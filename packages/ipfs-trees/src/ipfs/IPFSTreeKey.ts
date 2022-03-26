import { CID } from 'multiformats';
import { ByteView, encode, decode, code } from '@ipld/dag-cbor';
import { sha256 } from 'multiformats/hashes/sha2';
import Comparable from '../interfaces/Comparable';
import { Digest } from 'multiformats/hashes/digest';
import IPFSSingleton from './IPFSSingleton';

export interface IPFSTreeKeyData {
    key: string;
    valueCID?: CID;
}

export default class IPFSTreeKey implements Comparable<IPFSTreeKey> {
    readonly key: string;
    readonly valueCID: CID | undefined;

    //memoization
    private _encodeCache: ByteView<IPFSTreeKeyData> | undefined;
    private _digestCache: Digest<18, number> | undefined;
    private _cidCache: CID | undefined;

    private constructor(key: string | number, valueCID: CID | undefined) {
        if (typeof key === 'number') this.key = `${key}`;
        else this.key = key;

        this.valueCID = valueCID;
    }

    //Factory
    static create(key: string, valueCID: CID | undefined): IPFSTreeKey {
        return new IPFSTreeKey(key, valueCID);
    }

    static async createJSON(key: string, value: Record<string, any>): Promise<IPFSTreeKey> {
        const cid = await IPFSSingleton.putJSON(value);
        return IPFSTreeKey.create(key, cid);
    }

    static async createCBOR(key: string, value: Record<string, any>): Promise<IPFSTreeKey> {
        const cid = await IPFSSingleton.putCBOR(value);
        return IPFSTreeKey.create(key, cid);
    }

    static async createFromCID(cid: CID): Promise<IPFSTreeKey> {
        const data = await IPFSSingleton.get(cid);
        return IPFSTreeKey.decode(data);
    }

    equals(a: IPFSTreeKey): boolean {
        return this.key === a.key;
    }

    //Implement proper string compare
    lt(a: IPFSTreeKey): boolean {
        return this.key < a.key;
    }
    gt(a: IPFSTreeKey): boolean {
        return !this.equals(a) && !this.lt(a);
    }
    isNullNode(): boolean {
        return this.valueCID === undefined;
    }

    //IPFS
    encode(): ByteView<IPFSTreeKeyData> {
        if (this._encodeCache) return this._encodeCache;

        //Data
        const data: IPFSTreeKeyData = {
            key: this.key,
        };
        if (this.valueCID) data.valueCID = this.valueCID;
        //Encode
        this._encodeCache = encode(data);
        return this._encodeCache;
    }

    static decode(data: ByteView<IPFSTreeKeyData>): IPFSTreeKey {
        //Decode
        const { key, valueCID } = decode(data);
        return IPFSTreeKey.create(key, valueCID);
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
        const cid = await IPFSSingleton.put(data, { version: 1, format: 'dag-cbor' });
        return cid;
    }
}
