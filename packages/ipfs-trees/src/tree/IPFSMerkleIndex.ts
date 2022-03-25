import { CID } from 'multiformats';
import { ByteView, encode, decode, code } from '@ipld/dag-json';
import { sha256 } from 'multiformats/hashes/sha2';
import { Digest } from 'multiformats/hashes/digest';
import { IPFS } from 'ipfs';

export interface IPFSMerkleIndexData {
    hash: Digest<18, number>;
    leftCID: CID | undefined;
    rightCID: CID | undefined;
}

export default class IPFSMerkleIndex {
    readonly hash: Digest<18, number>;
    readonly leftCID: CID | undefined;
    readonly rightCID: CID | undefined;

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

    private constructor(hash: Digest<18, number>, leftCID: CID | undefined, rightCID: CID | undefined) {
        this.hash = hash;
        this.leftCID = leftCID;
        this.rightCID = rightCID;
    }

    //Factory
    static create(hash: Digest<18, number>, leftCID: CID | undefined, rightCID: CID | undefined): IPFSMerkleIndex {
        return new IPFSMerkleIndex(hash, leftCID, rightCID);
    }

    static async createFromCID(cid: CID): Promise<IPFSMerkleIndex> {
        this._totalNetworkGet += 1;
        const data = await this._ipfs.block.get(cid);
        return IPFSMerkleIndex.decode(data);
    }

    //May be sorted for consistency
    static async createFromLeaves(
        leaf1: IPFSMerkleIndex | undefined,
        leaf2: IPFSMerkleIndex | undefined,
    ): Promise<IPFSMerkleIndex> {
        const leaf1CID = await leaf1?.cid();
        const leaf2CID = await leaf2?.cid();
        const leaf1Hash = leaf1?.hash;
        const leaf2Hash = leaf2?.hash;

        //TODO: Replace with keccak256
        //TODO: Verify against ethereum implementation
        let hash: Digest<18, number>;
        if (leaf1Hash === undefined && leaf2Hash === undefined) throw new Error('Must have 1 leaf');

        if (leaf1Hash !== undefined && leaf2Hash !== undefined) {
            //[leaf1, null]
            hash = await sha256.digest(leaf1Hash.bytes);

            return IPFSMerkleIndex.create(hash, leaf1CID, undefined);
        } else if (leaf1Hash === undefined && leaf2Hash !== undefined) {
            //[leaf2, null]
            hash = await sha256.digest(leaf2Hash.bytes);

            return IPFSMerkleIndex.create(hash, leaf2CID, undefined);
        } else if (leaf1Hash!.bytes < leaf2Hash!.bytes) {
            //[leaf1, leaf2]
            const leaf1Bytes = leaf1Hash!.bytes;
            const leaf2Bytes = leaf2Hash!.bytes;
            const concat = new Uint8Array(leaf1Bytes.length + leaf2Bytes.length);
            concat.set(leaf1Bytes);
            concat.set(leaf2Bytes, leaf1Bytes.length);
            hash = await sha256.digest(concat);

            return IPFSMerkleIndex.create(hash, leaf1CID, leaf2CID);
        } else {
            //[leaf2, leaf1]
            const leaf1Bytes = leaf1Hash!.bytes;
            const leaf2Bytes = leaf2Hash!.bytes;
            const concat = new Uint8Array(leaf1Bytes.length + leaf2Bytes.length);
            concat.set(leaf2Bytes);
            concat.set(leaf1Bytes, leaf2Bytes.length);
            hash = await sha256.digest(concat);

            return IPFSMerkleIndex.create(hash, leaf2CID, leaf1CID);
        }
    }

    isNullNode(): boolean {
        return this.leftCID === undefined && this.rightCID == undefined;
    }

    //IPFS
    encode(): ByteView<IPFSMerkleIndexData> {
        if (this._encodeCache) return this._encodeCache;

        //Data
        const data: IPFSMerkleIndexData = {
            hash: this.hash,
            leftCID: undefined,
            rightCID: undefined,
        };
        if (this.leftCID) data.leftCID = this.leftCID;
        if (this.rightCID) data.rightCID = this.rightCID;
        //Encode
        this._encodeCache = encode(data);
        return this._encodeCache;
    }

    static decode(data: ByteView<IPFSMerkleIndexData>): IPFSMerkleIndex {
        //Decode
        const { hash, leftCID, rightCID } = decode(data);
        return IPFSMerkleIndex.create(hash, leftCID, rightCID);
    }

    async digest(): Promise<Digest<18, number>> {
        if (this._digestCache) return this._digestCache;
        this._digestCache = await sha256.digest(this.encode());
        return this._digestCache;
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
