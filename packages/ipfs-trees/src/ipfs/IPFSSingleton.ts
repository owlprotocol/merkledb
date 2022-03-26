import { IPFS } from 'ipfs';
import { encode as encodeJSON, decode as decodeJSON, code as codeJSON } from '@ipld/dag-json';
import { encode as encodeCBOR, decode as decodeCBOR, code as codeCBOR } from '@ipld/dag-cbor';
import { CID } from 'multiformats';
import { sha256 } from 'multiformats/hashes/sha2';

interface PutOptions {
    version?: 0 | 1;
    format?: 'dag-json' | 'dag-cbor';
}

export default class IPFSSingleton {
    private static readonly ipfs: IPFS | undefined;
    static _totalNetworkPut = 0;
    static _totalNetworkGet = 0;
    private static readonly local: { [key: string]: any } = {};

    private constructor() { }
    public static setIPFS(ipfs: IPFS) {
        //@ts-expect-error
        this.ipfs = ipfs;
    }

    //PUT
    public static async put(data: Uint8Array, options: PutOptions) {
        if (this.ipfs) return this.ipfs.block.put(data, options);

        //Mock IPFS Storage
        const digest = await sha256.digest(data);
        let cid: CID;
        if (!options || options.version == 0) {
            //dag-pb
            cid = CID.create(0, 112, digest);
        } else if (options.format == 'dag-json') {
            cid = CID.create(1, codeJSON, digest);
        } else if (options.format == 'dag-cbor') {
            cid = CID.create(1, codeCBOR, digest);
        }

        this.local[cid!.toString()] = data;
        return cid!;
    }

    public static async putJSON(rec: Record<string, any>) {
        const data = encodeJSON(rec);
        if (this.ipfs) return this.ipfs.block.put(data, { version: 1, format: 'dag-json' });

        //Mock IPFS Storage
        const digest = await sha256.digest(data);
        const cid = CID.create(1, codeJSON, digest);
        this.local[cid.toString()] = data;
        return cid;
    }

    public static async putCBOR(rec: Record<string, any>) {
        const data = encodeCBOR(rec);
        if (this.ipfs) return this.ipfs.block.put(data, { version: 1, format: 'dag-cbor' });

        //Mock IPFS Storage
        const digest = await sha256.digest(data);
        const cid = CID.create(1, codeCBOR, digest);
        this.local[cid.toString()] = data;
        return cid;
    }

    //GET
    static async get(cid: CID): Promise<Uint8Array> {
        let v: Uint8Array;
        if (this.ipfs) v = await this.ipfs.block.get(cid);
        else v = this.local[cid.toString()];

        if (!v) throw new Error(`${cid} not found!`);
        return v;
    }

    static async getJSON(cid: CID): Promise<Record<string, any>> {
        let data: Uint8Array;
        if (this.ipfs) data = await this.ipfs.block.get(cid);
        else data = this.local[cid.toString()];

        if (!data) throw new Error(`${cid} not found!`);
        return decodeJSON(data);
    }

    static async getCBOR(cid: CID): Promise<Record<string, any>> {
        let data: Uint8Array;
        if (this.ipfs) data = await this.ipfs.block.get(cid);
        else data = this.local[cid.toString()];

        if (!data) throw new Error(`${cid} not found!`);
        return decodeCBOR(data);
    }
}
