import { CID } from 'multiformats';
import { ByteView, encode, decode, code } from '@ipld/dag-json';
//@ts-expect-error
import { keccak256 } from '@multiformats/sha3';
import { Digest } from 'multiformats/hashes/digest';
import TreeMerkle from '../tree/TreeMerkle';
import { stringToDigest } from '../utils';
import IPFSMerkleInterface from '../interfaces/IPFSMerkleInterface';
import IPFSSingleton from './IPFSSingleton';
import IPFSMapInterface from '../interfaces/IPFSMapInterface';
import IPFSTree from './IPFSTree';

//TODO: Add map pointer for back ref
//Currently back ref is not part of CID, requiring external tracking of links
export interface IPFSMerkleData {
    hash: Digest<18, number>;
    leftCID?: CID | undefined;
    rightCID?: CID | undefined;
}

export default class IPFSMerkle extends TreeMerkle<Digest<18, number>> implements IPFSMerkleInterface {
    private readonly _hash: Digest<18, number>;
    private readonly _left: IPFSMerkle | undefined;
    private readonly _right: IPFSMerkle | undefined;
    public getParentMap: IPFSMapInterface;

    //IPFS Pointers
    private readonly _leftCID: CID | undefined;
    private readonly _rightCID: CID | undefined;

    //memoization
    private _encodeCache: ByteView<IPFSMerkleData> | undefined;
    private _digestCache: Digest<18, number> | undefined;
    private _cidCache: CID | undefined;

    private constructor(
        _hash: Digest<18, number>,
        _left: IPFSMerkle | undefined,
        _right: IPFSMerkle | undefined,
        _leftCID: CID | undefined,
        _rightCID: CID | undefined,
        getParentMap: IPFSMapInterface
    ) {
        super();
        this._hash = _hash;
        this._left = _left;
        this._right = _right;
        this._leftCID = _leftCID;
        this._rightCID = _rightCID;
        this.getParentMap = getParentMap;
    }
    getProof(): Promise<Digest<18, number>[]> {
        throw new Error('Method not implemented.');
    }

    static async createNull(): Promise<IPFSMerkle> {
        return IPFSMerkle.createLeaf(await stringToDigest('0'));
    }

    static async createLeaf(hash: Digest<18, number>): Promise<IPFSMerkle> {
        const nullMap = IPFSTree.createNull();
        return new IPFSMerkle(hash, undefined, undefined, undefined, undefined, nullMap);
    }

    //Async Factory
    static async createFromCID(cid: CID): Promise<IPFSMerkle> {
        //IDEA: Cache factory
        const data = await IPFSSingleton.get(cid);
        return IPFSMerkle.decode(data);
    }

    async insertHash(hash: Digest<18, number>): Promise<IPFSMerkle> {
        const leaf = await IPFSMerkle.createLeaf(hash);
        //@ts-expect-error
        return TreeMerkle.insert(this, leaf) as Promise<IPFSMerkle>;
    }

    //@ts-expect-error
    async getParent(): Promise<IPFSMerkle | undefined> {
        const cid = await this.cid();
        const parent = await this.getParentMap.get(cid.toString());
        return IPFSMerkle.createFromCID(cid);
    }

    //@ts-expect-error
    async getLeft(): Promise<IPFSMerkle | undefined> {
        return this._left;
    }
    //@ts-expect-error
    async getRight(): Promise<IPFSMerkle | undefined> {
        return this._right;
    }
    async getHash(): Promise<Digest<18, number>> {
        return this._hash;
    }

    //@ts-expect-error
    async setParent(a: IPFSMerkle): Promise<IPFSMerkle | undefined> {
        //Use IPFSMap to avoid circular reference
        const cid = await this.cid();
        const parentCID = await a.cid();
        //TODO: non-mutational
        this.getParentMap = await this.getParentMap.set(cid.toString(), parentCID)
        return this;
    }

    //No mutation
    //@ts-expect-error
    async join(a: IPFSMerkle): Promise<TreeMerkle<Digest<18, number>>> {
        const hashThis = await this.getHash();
        const hashA = await a.getHash();

        const hashParent = await IPFSMerkle.joinDigests(hashThis, hashA);
        const nullMap = IPFSTree.createNull();
        const parent = new IPFSMerkle(hashParent, this, a, undefined, undefined, nullMap);

        await this.setParent(parent);
        await a.setParent(parent);
        return parent as TreeMerkle<Digest<18, number>>;
    }

    static async joinDigests(a: Digest<18, number>, b: Digest<18, number>): Promise<Digest<18, number>> {
        if (a === undefined && b === undefined) throw new Error('Must have 1 leaf');

        if (a !== undefined && b === undefined) {
            //[leaf1, null]
            return keccak256.digest(a.digest);
        } else if (a === undefined && b !== undefined) {
            //[leaf2, null]
            return keccak256.digest(b.digest);
        } else {
            //Both defined, compare
            const cmp = Buffer.from(a!.digest).compare(Buffer.from(b!.digest));
            if (cmp < 0) {
                //[leaf1, leaf2]
                const leaf1Bytes = a!.digest;
                const leaf2Bytes = b!.digest;
                const concat = new Uint8Array(leaf1Bytes.length + leaf2Bytes.length);
                concat.set(leaf1Bytes);
                concat.set(leaf2Bytes, leaf1Bytes.length);
                return keccak256.digest(concat);
            } else {
                //[leaf2, leaf1]
                const leaf1Bytes = a!.digest;
                const leaf2Bytes = b!.digest;
                const concat = new Uint8Array(leaf1Bytes.length + leaf2Bytes.length);
                concat.set(leaf2Bytes);
                concat.set(leaf1Bytes, leaf2Bytes.length);
                return keccak256.digest(concat);
            }
        }
    }

    async getLeftCID(): Promise<CID | undefined> {
        if (this._leftCID) return this._leftCID;
        //@ts-expect-error
        this._leftCID = await this._left?.cid();
        return this._leftCID;
    }

    async getRightCID(): Promise<CID | undefined> {
        if (this._rightCID) return this._rightCID;
        //@ts-expect-error
        this._rightCID = await this._right?.cid();
        return this._rightCID;
    }

    //Proof
    async *getProofGen(): AsyncGenerator<Digest<18, number>> {
        for await (const s of this.recurseSibling()) {
            yield await s.getHash();
        }
    }

    static async verifyProof(proof: Digest<18, number>[]): Promise<boolean> {
        let leafDigest = proof.shift();
        const rootDigest = proof.pop();

        for (const s of proof) {
            leafDigest = await IPFSMerkle.joinDigests(leafDigest!, s);
        }

        const leafBuff = Buffer.from(leafDigest!.digest.buffer);
        const rootBuff = Buffer.from(rootDigest!.digest.buffer);
        return rootBuff.compare(leafBuff) == 0;
    }

    //IPFS
    async encode(): Promise<ByteView<IPFSMerkleData>> {
        if (this._encodeCache) return this._encodeCache;

        const leftCID = await this.getLeftCID();
        const rightCID = await this.getRightCID();

        //Data
        const data: IPFSMerkleData = {
            hash: this._hash,
        };
        if (leftCID) data.leftCID = leftCID;
        if (rightCID) data.rightCID = rightCID;
        //Encode
        this._encodeCache = encode(data);
        return this._encodeCache;
    }

    static decode(data: ByteView<IPFSMerkleData>): IPFSMerkle {
        //Decode
        const { hash, leftCID, rightCID } = decode(data);
        const nullMap = IPFSTree.createNull();
        return new IPFSMerkle(hash, undefined, undefined, leftCID, rightCID, nullMap);
    }

    async digest(): Promise<Digest<18, number>> {
        if (this._digestCache) return this._digestCache;
        this._digestCache = await keccak256.digest(this.encode());
        return this._digestCache!;
    }

    async cid(): Promise<CID> {
        if (this._cidCache) return this._cidCache;
        const hash = await this.digest();
        this._cidCache = CID.create(1, code, hash);
        return this._cidCache;
    }

    async put(): Promise<CID> {
        const data = await this.encode();
        const cid = await IPFSSingleton.put(data, { version: 1, format: 'dag-json' });
        return cid;
    }
}
