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
            leaf1!._parent = n;
            return n;
        } else if (leaf1Hash === undefined && leaf2Hash !== undefined) {
            //[leaf2, null]
            hash = await keccak256.digest(leaf2Hash.digest);
            const n = new IPFSMerkleIndex(hash, leaf2Hash, undefined);
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
                leaf1!._parent = n;
                leaf2!._parent = n;
                return n;
            }
        }
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
