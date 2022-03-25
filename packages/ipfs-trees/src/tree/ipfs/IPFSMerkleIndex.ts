import { CID } from 'multiformats';
import { ByteView, encode, decode, code } from '@ipld/dag-json';
//@ts-expect-error
import { keccak256 } from '@multiformats/sha3';
import { Digest } from 'multiformats/hashes/digest';
import { IPFS } from 'ipfs';

export interface IPFSMerkleIndexData {
    hash: Digest<18, number>;
    leftHash?: Digest<18, number> | undefined;
    rightHash?: Digest<18, number> | undefined;
}

export default class IPFSMerkleIndex {
    readonly hash: Digest<18, number>;
    readonly leftHash: Digest<18, number> | undefined;
    readonly rightHash: Digest<18, number> | undefined;

    _parent: IPFSMerkleIndex | undefined;
    _left: IPFSMerkleIndex | undefined;
    _right: IPFSMerkleIndex | undefined;

    //memoization
    private _encodeCache: ByteView<IPFSMerkleIndexData> | undefined;
    private _digestCache: Digest<18, number> | undefined;
    private _cidCache: CID | undefined;

    //IPFS Client
    private static _ipfs: IPFS;
    //Development Stats
    static _totalNetworkGet = 0;
    static _totalNetworkPut = 0;

    static setIPFS(ipfs: IPFS) {
        this._ipfs = ipfs;
    }

    private constructor(
        hash: Digest<18, number>,
        leftHash: Digest<18, number> | undefined,
        rightHash: Digest<18, number> | undefined,
    ) {
        this.hash = hash;
        this.leftHash = leftHash;
        this.rightHash = rightHash;
    }

    //Factory
    static async createFromCID(cid: CID): Promise<IPFSMerkleIndex> {
        this._totalNetworkGet += 1;
        const data = await this._ipfs.block.get(cid);
        return IPFSMerkleIndex.decode(data);
    }

    static async createLeaf(hash: Digest<18, number>) {
        return new IPFSMerkleIndex(hash, undefined, undefined);
    }

    //May be sorted for consistency
    static async createFromLeaves(
        leaf1: IPFSMerkleIndex | undefined,
        leaf2: IPFSMerkleIndex | undefined,
    ): Promise<IPFSMerkleIndex> {
        const leaf1Hash = leaf1?.hash;
        const leaf2Hash = leaf2?.hash;
        //TODO: Remove mutation in favor of returning copies
        //TODO: Verify against ethereum implementation
        let hash: Digest<18, number>;
        if (leaf1Hash === undefined && leaf2Hash === undefined) throw new Error('Must have 1 leaf');

        if (leaf1Hash !== undefined && leaf2Hash === undefined) {
            //[leaf1, null]
            hash = await keccak256.digest(leaf1Hash.digest);
            const n = new IPFSMerkleIndex(hash, leaf1Hash, leaf2Hash);
            n._parent = leaf1!._parent;
            n._left = leaf1;
            leaf1!._parent = n;
            return n;
        } else if (leaf1Hash === undefined && leaf2Hash !== undefined) {
            //[leaf2, null]
            hash = await keccak256.digest(leaf2Hash.digest);
            const n = new IPFSMerkleIndex(hash, leaf2Hash, undefined);
            n._parent = leaf2!._parent;
            n._left = leaf2;
            leaf2!._parent = n;
            return n;
        } else {
            //Both defined, compare
            const cmp = Buffer.from(leaf1Hash!.digest).compare(Buffer.from(leaf2Hash!.digest));
            if (cmp < 0) {
                //[leaf1, leaf2]
                const leaf1Bytes = leaf1Hash!.digest;
                const leaf2Bytes = leaf2Hash!.digest;
                const concat = new Uint8Array(leaf1Bytes.length + leaf2Bytes.length);
                concat.set(leaf1Bytes);
                concat.set(leaf2Bytes, leaf1Bytes.length);
                hash = await keccak256.digest(concat);
                const n = new IPFSMerkleIndex(hash, leaf1Hash, leaf2Hash);
                n._left = leaf1;
                n._right = leaf2;
                //if (leaf1?._parent != undefined || leaf2?._parent != undefined)
                n._parent = undefined;
                leaf1!._parent = n;
                leaf2!._parent = n;
                return n;
            } else {
                //[leaf2, leaf1]
                const leaf1Bytes = leaf1Hash!.digest;
                const leaf2Bytes = leaf2Hash!.digest;
                const concat = new Uint8Array(leaf1Bytes.length + leaf2Bytes.length);
                concat.set(leaf2Bytes);
                concat.set(leaf1Bytes, leaf2Bytes.length);
                hash = await keccak256.digest(concat);
                const n = new IPFSMerkleIndex(hash, leaf2Hash, leaf1Hash);
                n._parent = undefined;
                n._left = leaf2;
                n._right = leaf1;
                leaf1!._parent = n;
                leaf2!._parent = n;
                return n;
            }
        }
    }

    //Level-order Traversal
    static *levelOrderTraversal(root: IPFSMerkleIndex): Generator<IPFSMerkleIndex> {
        const arr: IPFSMerkleIndex[] = [root];
        while (arr.length > 0) {
            //FIFO
            const pop = arr.shift()!;
            yield pop;

            const leftNode = pop._left;
            if (leftNode) {
                arr.push(leftNode);
            }

            const rightNode = pop._right;
            if (rightNode) {
                arr.push(rightNode);
            }
        }
    }

    *levelOrderTraversal(): Generator<IPFSMerkleIndex> {
        yield* IPFSMerkleIndex.levelOrderTraversal(this);
    }

    //Inserts and returns root
    static async *insertGenerator<T>(
        root: IPFSMerkleIndex | undefined,
        a: IPFSMerkleIndex,
    ): AsyncGenerator<IPFSMerkleIndex> {
        if (!root) {
            //No root, return self
            yield a;
            return;
        }

        const levelOrderGen = IPFSMerkleIndex.levelOrderTraversal(root);

        for await (const n of levelOrderGen) {
            const left = n._left;
            if (left === undefined) {
                //Set Left Node
                const newN = await IPFSMerkleIndex.createFromLeaves(n, a);
                break;
            } else {
                const right = n._right;
                if (right === undefined) {
                    const newN = await IPFSMerkleIndex.createFromLeaves(n, a);
                }
            }
        }
    }

    static async insert<T>(root: IPFSMerkleIndex | undefined, a: IPFSMerkleIndex): Promise<IPFSMerkleIndex> {
        const gen = IPFSMerkleIndex.insertGenerator(root, a);
        let n: IPFSMerkleIndex;
        for await (n of gen) {
            n = n;
        }
        return n!;
    }

    async *insertGenerator(a: IPFSMerkleIndex): AsyncGenerator<IPFSMerkleIndex> {
        yield* IPFSMerkleIndex.insertGenerator(this, a);
    }

    async insert(a: IPFSMerkleIndex): Promise<IPFSMerkleIndex> {
        return IPFSMerkleIndex.insert(this, a);
    }

    //Comparisons
    equals(a: IPFSMerkleIndex): boolean {
        //TODO: Optimize UInt8 comparison
        return this.hash.digest.toString() === a.hash.digest.toString();
    }
    isNullNode(): boolean {
        return this.leftHash === undefined && this.rightHash == undefined;
    }
    toHex(): string {
        return Buffer.from(this.hash.digest.buffer).toString('hex');
    }

    //IPFS
    encode(): ByteView<IPFSMerkleIndexData> {
        if (this._encodeCache) return this._encodeCache;

        //Data
        const data: IPFSMerkleIndexData = {
            hash: this.hash,
        };
        if (this.leftHash) data.leftHash = this.leftHash;
        if (this.rightHash) data.rightHash = this.rightHash;
        //Encode
        this._encodeCache = encode(data);
        return this._encodeCache;
    }

    static decode(data: ByteView<IPFSMerkleIndexData>): IPFSMerkleIndex {
        //Decode
        const { hash, leftHash, rightHash } = decode(data);
        return new IPFSMerkleIndex(hash, leftHash, rightHash);
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
        IPFSMerkleIndex._totalNetworkPut += 1;
        const data = await this.encode();
        const cid = await IPFSMerkleIndex._ipfs.block.put(data, { version: 1, format: 'dag-json' });
        return cid;
    }
}
