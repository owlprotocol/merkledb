import { CID } from 'multiformats';
import { ByteView, encode, decode, code } from '@ipld/dag-json';
import { sha256 } from 'multiformats/hashes/sha2';
import Comparable from '../interfaces/Comparable';
import { Digest } from 'multiformats/hashes/digest';
import IPFSSingleton from './IPFSSingleton';

export interface IPFSTreeIndexData {
    key: string;
    valueCID?: CID;
}

export default class IPFSTreeIndex implements Comparable<IPFSTreeIndex> {
    readonly key: string;
    readonly valueCID: CID | undefined;

    //memoization
    private _encodeCache: ByteView<IPFSTreeIndexData> | undefined;
    private _digestCache: Digest<18, number> | undefined;
    private _cidCache: CID | undefined;

    private constructor(key: string | number, valueCID: CID | undefined) {
        if (typeof key === 'number') this.key = `${key}`;
        else this.key = key;

        this.valueCID = valueCID;
    }

    //Factory
    static create(key: string, valueCID: CID | undefined): IPFSTreeIndex {
        return new IPFSTreeIndex(key, valueCID);
    }

    static async createFromCID(cid: CID): Promise<IPFSTreeIndex> {
        const data = await IPFSSingleton.get(cid);
        return IPFSTreeIndex.decode(data);
    }

    equals(a: IPFSTreeIndex): boolean {
        return this.key === a.key;
    }

    //Implement proper string compare
    lt(a: IPFSTreeIndex): boolean {
        return this.key < a.key;
    }
    gt(a: IPFSTreeIndex): boolean {
        return !this.equals(a) && !this.lt(a);
    }
    isNullNode(): boolean {
        return this.valueCID === undefined;
    }

    //IPFS
    encode(): ByteView<IPFSTreeIndexData> {
        if (this._encodeCache) return this._encodeCache;

        //Data
        const data: IPFSTreeIndexData = {
            key: this.key,
        };
        if (this.valueCID) data.valueCID = this.valueCID;
        //Encode
        this._encodeCache = encode(data);
        return this._encodeCache;
    }

    static decode(data: ByteView<IPFSTreeIndexData>): IPFSTreeIndex {
        //Decode
        const { key, valueCID } = decode(data);
        return IPFSTreeIndex.create(key, valueCID);
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

    //Put Data
    async put(): Promise<CID> {
        const data = await this.encode();
        const cid = await IPFSSingleton.put(data, { version: 1, format: 'dag-json' });
        return cid;
    }
}
