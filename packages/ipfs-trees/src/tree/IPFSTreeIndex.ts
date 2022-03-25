import { CID } from 'multiformats';
import { ByteView, encode, decode, code } from '@ipld/dag-json';
import { sha256 } from 'multiformats/hashes/sha2';
import Comparable from '../interfaces/Comparable';
import { Digest } from 'multiformats/hashes/digest';
import { IPFS } from 'ipfs';

export interface IPFSTreeIndexData {
    key: number;
    valueCID: CID;
}

export default class IPFSTreeIndex implements Comparable<IPFSTreeIndex> {
    readonly key: number;
    readonly valueCID: CID;

    //memoization
    private _encodeCache: ByteView<IPFSTreeIndexData> | undefined;
    private _digestCache: Digest<18, number> | undefined;
    private _cidCache: CID | undefined;

    //IPFS Client
    private static _ipfs: IPFS;
    //Development Stats
    private static _totalNetworkGet = 0;
    private static _totalNetworkPut = 0;

    static setIPFS(ipfs: IPFS) {
        this._ipfs = ipfs;
    }

    private constructor(key: number, valueCID: CID) {
        this.key = key;
        this.valueCID = valueCID;
    }

    //Factory
    static create(key: number, valueCID: CID): IPFSTreeIndex {
        return new IPFSTreeIndex(key, valueCID);
    }

    static async createFromCID(cid: CID): Promise<IPFSTreeIndex> {
        this._totalNetworkGet += 1;
        const data = await this._ipfs.block.get(cid);
        return IPFSTreeIndex.decode(data);
    }

    equals(a: IPFSTreeIndex): boolean {
        return this.key === a.key;
    }
    lt(a: IPFSTreeIndex): boolean {
        return this.key < a.key;
    }
    gt(a: IPFSTreeIndex): boolean {
        return this.key > a.key;
    }

    //IPFS
    encode(): ByteView<IPFSTreeIndexData> {
        if (this._encodeCache) return this._encodeCache;

        //Data
        const data: IPFSTreeIndexData = {
            key: this.key,
            valueCID: this.valueCID,
        };
        //Encode
        return encode(data);
    }

    static async decode(data: ByteView<IPFSTreeIndexData>): Promise<IPFSTreeIndex> {
        //Decode
        const { key, valueCID } = decode(data);
        return IPFSTreeIndex.create(key, valueCID);
    }

    async digest(): Promise<Digest<18, number>> {
        if (this._digestCache) return this._digestCache;
        return sha256.digest(this.encode());
    }

    async cid(): Promise<CID> {
        if (this._cidCache) return this._cidCache;
        const hash = await this.digest();
        return CID.create(1, code, hash);
    }

    async put(): Promise<CID> {
        IPFSTreeIndex._totalNetworkPut += 1;
        const data = await this.encode();
        const cid = await IPFSTreeIndex._ipfs.block.put(data, { version: 1, format: 'dag-json' });
        return cid;
    }
}
