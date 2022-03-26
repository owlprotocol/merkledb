import { CID } from 'multiformats';
import { ByteView, encode, decode, code } from '@ipld/dag-json';
//@ts-expect-error
import { keccak256 } from '@multiformats/sha3';
import { Digest } from 'multiformats/hashes/digest';
import TreeMerkle from '../tree/TreeMerkle';
import { stringToDigest } from '../utils';
import IPFSMerkleInterface from '../interfaces/IPFSMerkleInterface';
import IPFSSingleton from './IPFSSingleton';

export interface IPFSTreeMerkleData {
    hash: Digest<18, number>;
    leftCID?: CID | undefined;
    rightCID?: CID | undefined;
}

export default class IPFSTreeMerkle extends TreeMerkle<Digest<18, number>> implements IPFSMerkleInterface {
    private readonly _hash: Digest<18, number>;
    private readonly _parent: IPFSTreeMerkle | undefined;
    private readonly _left: IPFSTreeMerkle | undefined;
    private readonly _right: IPFSTreeMerkle | undefined;

    //IPFS Pointers
    private readonly _leftCID: CID | undefined;
    private readonly _rightCID: CID | undefined;

    //memoization
    private _encodeCache: ByteView<IPFSTreeMerkleData> | undefined;
    private _digestCache: Digest<18, number> | undefined;
    private _cidCache: CID | undefined;

    private constructor(
        _hash: Digest<18, number>,
        _parent: IPFSTreeMerkle | undefined,
        _left: IPFSTreeMerkle | undefined,
        _right: IPFSTreeMerkle | undefined,
        _leftCID: CID | undefined,
        _rightCID: CID | undefined,
    ) {
        super();
        this._hash = _hash;
        this._parent = _parent;
        this._left = _left;
        this._right = _right;
        this._leftCID = _leftCID;
        this._rightCID = _rightCID;
    }

    static async createNull(): Promise<IPFSTreeMerkle> {
        return IPFSTreeMerkle.createLeaf(await stringToDigest('0'));
    }

    static async createLeaf(hash: Digest<18, number>): Promise<IPFSTreeMerkle> {
        return new IPFSTreeMerkle(hash, undefined, undefined, undefined, undefined, undefined);
    }

    static createWithCIDs(
        hash: Digest<18, number>,
        leftCID: CID | undefined,
        rightCID: CID | undefined,
    ): IPFSTreeMerkle {
        return new IPFSTreeMerkle(hash, undefined, undefined, undefined, leftCID, rightCID);
    }

    async insertHash(hash: Digest<18, number>): Promise<IPFSTreeMerkle> {
        const leaf = await IPFSTreeMerkle.createLeaf(hash);
        return TreeMerkle.insert(this, leaf) as Promise<IPFSTreeMerkle>;
    }

    async getParent(): Promise<TreeMerkle<Digest<18, number>> | undefined> {
        return this._parent;
    }
    async getLeft(): Promise<TreeMerkle<Digest<18, number>> | undefined> {
        return this._left;
    }
    async getRight(): Promise<TreeMerkle<Digest<18, number>> | undefined> {
        return this._right;
    }
    async getHash(): Promise<Digest<18, number>> {
        return this._hash;
    }
    async setParent(a: TreeMerkle<Digest<18, number>>): Promise<TreeMerkle<Digest<18, number>>> {
        //@ts-expect-error
        this._parent = a;
        return this;
    }
    //No mutation
    async join(a: IPFSTreeMerkle): Promise<TreeMerkle<Digest<18, number>>> {
        const hashThis = await this.getHash();
        const hashA = await a.getHash();

        const hashParent = await IPFSTreeMerkle.joinDigests(hashThis, hashA);
        const parent = new IPFSTreeMerkle(hashParent, undefined, this, a, undefined, undefined);

        await this.setParent(parent);
        await a.setParent(parent);
        return parent;
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
    async *getProof(): AsyncGenerator<Digest<18, number>> {
        for await (const s of this.recurseSibling()) {
            yield await s.getHash();
        }
    }

    static async verifyProof(proof: Digest<18, number>[]): Promise<boolean> {
        let leafDigest = proof.shift();
        const rootDigest = proof.pop();

        for (const s of proof) {
            leafDigest = await IPFSTreeMerkle.joinDigests(leafDigest!, s);
        }

        const leafBuff = Buffer.from(leafDigest!.digest.buffer);
        const rootBuff = Buffer.from(rootDigest!.digest.buffer);
        return rootBuff.compare(leafBuff) == 0;
    }

    //IPFS
    async encode(): Promise<ByteView<IPFSTreeMerkleData>> {
        if (this._encodeCache) return this._encodeCache;

        const leftCID = await this.getLeftCID();
        const rightCID = await this.getRightCID();

        //Data
        const data: IPFSTreeMerkleData = {
            hash: this._hash,
        };
        if (leftCID) data.leftCID = leftCID;
        if (rightCID) data.rightCID = rightCID;
        //Encode
        this._encodeCache = encode(data);
        return this._encodeCache;
    }

    static decode(data: ByteView<IPFSTreeMerkleData>): IPFSTreeMerkle {
        //Decode
        const { hash, leftCID, rightCID } = decode(data);
        this;
        return new IPFSTreeMerkle(hash, undefined, undefined, undefined, leftCID, rightCID);
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
