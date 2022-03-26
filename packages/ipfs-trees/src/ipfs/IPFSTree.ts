//@ts-nocheck
import { CID } from 'multiformats';
import { ByteView, encode as encodeJSON, decode as decodeJSON, code as codeJSON } from '@ipld/dag-json';
import { sha256 } from 'multiformats/hashes/sha2';
import { Digest } from 'multiformats/hashes/digest';

import TreeSearch from '../tree/TreeSearch';
import IPFSTreeKey from './IPFSTreeKey';
import IPFSMapInterface from '../interfaces/IPFSMapInterface';
import IPFSSingleton from './IPFSSingleton';
import asyncGeneratorToArray from '../utils/asyncGeneratorToArray';

export interface IPFSTreeData {
    keyCID: CID;
    leftCID?: CID;
    rightCID?: CID;
}

export default class IPFSTree extends TreeSearch<IPFSTreeKey> implements IPFSMapInterface {
    private readonly _key: IPFSTreeKey | undefined;
    private readonly _left: IPFSTree | undefined;
    private readonly _right: IPFSTree | undefined;

    private readonly _keyCID: CID | undefined;
    private readonly _leftCID: CID | undefined;
    private readonly _rightCID: CID | undefined;

    //memoization
    private _encodeCache: ByteView<IPFSTreeData> | undefined;
    private _digestCache: Digest<18, number> | undefined;
    private _cidCache: CID | undefined;

    protected constructor(
        key: IPFSTreeKey | undefined,
        left: IPFSTree | undefined,
        right: IPFSTree | undefined,
        keyCID: CID | undefined,
        leftCID: CID | undefined,
        rightCID: CID | undefined,
    ) {
        super();
        this._key = key;
        this._left = left;
        this._right = right;
        this._keyCID = keyCID;
        this._leftCID = leftCID;
        this._rightCID = rightCID;
    }

    //Factory
    static createNull(): IPFSTree {
        return new IPFSTree(undefined, undefined, undefined, undefined, undefined, undefined);
    }
    isNull(): boolean {
        return this._keyCID === undefined && this._key === undefined;
    }

    static create(
        key: IPFSTreeKey,
        left: IPFSTree | undefined,
        right: IPFSTree | undefined,
    ): IPFSTree {
        return new IPFSTree(key, left, right, undefined, undefined, undefined);
    }

    static createWithCIDs(keyCID: CID, leftCID: CID | undefined, rightCID: CID | undefined): IPFSTree {
        return new IPFSTree(undefined, undefined, undefined, keyCID, leftCID, rightCID);
    }

    static createLeaf(key: IPFSTreeKey): IPFSTree {
        return this.create(key, undefined, undefined);
    }

    //Instantiate key
    static createWithKey(
        key: string,
        valueCID: CID | undefined,
        left: IPFSTree | undefined,
        right: IPFSTree | undefined,
    ) {
        return this.create(IPFSTreeKey.create(key, valueCID), left, right);
    }

    static createLeafWithKey(key: string, valueCID: CID | undefined) {
        return this.createWithKey(key, valueCID, undefined, undefined);
    }

    //Async Factory
    //Factory helpers that ALWAYS create a copy
    //@ts-expect-error
    async withKey(key: IPFSTreeKey) {
        if (!this._key) throw new Error('Node has no key!');
        return IPFSTree.create(key, this._left, this._right);
    }
    //@ts-expect-error
    async withLeft(left: IPFSTree) {
        if (!this._key) throw new Error('Node has no key!');
        const n = IPFSTree.create(this._key, left, this._right);
        return n;
    }
    //@ts-expect-error
    async withRight(right: IPFSTree) {
        if (!this._key) throw new Error('Node has no key!');
        const n = IPFSTree.create(this._key, this._left, right);
        return n;
    }

    //Async Factory
    static async createFromCID(cid: CID): Promise<IPFSTree> {
        const data = await IPFSSingleton.get(cid);
        return IPFSTree.decode(data);
    }

    //Get/Set KV
    async get(k: string): Promise<CID | undefined> {
        const resultNode = await this.search(IPFSTreeKey.create(k, undefined));
        if (!resultNode) return undefined;

        const resultIdx = await resultNode.getKey();
        return resultIdx.valueCID;
    }
    async set(k: string, v: CID | undefined): Promise<IPFSTree> {
        const leafNode = IPFSTree.createLeafWithKey(k, v);
        const tree = await this.insert(leafNode);
        return tree as IPFSTree;
    }
    async getJSON(k: string): Promise<Record<string, any> | undefined> {
        const cid = await this.get(k);
        if (!cid) return undefined;
        return IPFSSingleton.getJSON(cid);
    }
    async setJSON(k: string, v: Record<string, any>): Promise<IPFSTree> {
        const cid = await IPFSSingleton.putJSON(v);
        return await this.set(k, cid);
    }
    async getCBOR(k: string): Promise<Record<string, any> | undefined> {
        const cid = await this.get(k);
        if (!cid) return undefined;
        return IPFSSingleton.getCBOR(cid);
    }
    async setCBOR(k: string, v: Record<string, any>): Promise<IPFSTree> {
        const cid = await IPFSSingleton.putCBOR(v);
        return await this.set(k, cid);
    }

    //Getters
    async getKey(): Promise<IPFSTreeKey | undefined> {
        if (this.isNull()) return undefined;
        if (this._key) return this._key;

        //@ts-expect-error
        this._key = await IPFSTreeKey.createFromCID(this._keyCID);
        return this._key;
    }
    //@ts-expect-error
    async getLeft(): Promise<IPFSTree | undefined> {
        if (this.isNull()) return undefined;
        if (this._left) return this._left;
        if (!this._leftCID) return undefined;

        //@ts-expect-error
        this._left = await IPFSTree.createFromCID(this._leftCID);
        return this._left;
    }
    //@ts-expect-error
    async getRight(): Promise<IPFSTree | undefined> {
        if (this.isNull()) return undefined;
        if (this._right) return this._right;
        if (!this._rightCID) return undefined;

        //@ts-expect-error
        this._right = await IPFSTree.createFromCID(this._rightCID);
        return this._right;
    }

    async getKeyCID(): Promise<CID> {
        if (this._keyCID) return this._keyCID;
        if (!this._key) throw new Error('Node has no key!');

        //@ts-expect-error
        this._keyCID = await this._key?.cid();
        return this._keyCID;
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

    //IPFS
    async encode(): Promise<ByteView<IPFSTreeData>> {
        if (this._encodeCache) return this._encodeCache;

        const keyCID = await this.getKeyCID();
        const leftCID = await this.getLeftCID();
        const rightCID = await this.getRightCID();

        //Data
        const data: IPFSTreeData = {
            keyCID,
        };
        if (leftCID) data.leftCID = leftCID;
        if (rightCID) data.rightCID = rightCID;
        //Encode
        this._encodeCache = encodeJSON(data);
        return this._encodeCache;
    }

    static decode(data: ByteView<IPFSTreeData>): IPFSTree {
        //Decode
        const { keyCID, leftCID, rightCID } = decodeJSON(data);
        const n = IPFSTree.createWithCIDs(keyCID, leftCID, rightCID);
        return n;
    }

    async digest(): Promise<Digest<18, number>> {
        if (this._digestCache) return this._digestCache;
        this._digestCache = await sha256.digest(await this.encode());
        return this._digestCache;
    }

    async cid(): Promise<CID> {
        if (this._cidCache) return this._cidCache;
        const hash = await this.digest();
        this._cidCache = CID.create(1, codeJSON, hash);
        return this._cidCache;
    }

    //Iterate
    async *getEntriesGen(): AsyncGenerator<[string, Record<string, any>]> {
        for await (const n of this.inOrderTraversal()) {
            const k = await n.getKey()
            const key = k.key;
            if (k.valueCID) {
                const value = await IPFSSingleton.getJSON(k.valueCID);
                if (value) {
                    yield [key, value]
                }
            }
        }
    };
    async getEntries(): Promise<[string, Record<string, any>][]> {
        const entriesGen = this.getEntriesGen()
        return asyncGeneratorToArray(entriesGen);
    }

    //Includes null keys
    async *getKeysGen(): AsyncGenerator<string> {
        for await (const n of this.inOrderTraversal()) {
            const k = await n.getKey()
            yield k.key;
        }
    }
    async getKeys(): Promise<string[]> {
        const keysGen = this.getKeysGen()
        return asyncGeneratorToArray(keysGen);
    }

    async *getValuesGen(): AsyncGenerator<Record<string, any>> {
        for await (const n of this.getEntriesGen()) {
            yield n[1]
        }
    }
    async getValues(): Promise<Record<string, any>> {
        const valuesGen = this.getValuesGen();
        return asyncGeneratorToArray(valuesGen);
    }

    async rootKey(): Promise<string | undefined> {
        const k = await this.getKey();
        if (!k) return undefined;
        return k.key;
    }
    async rootValue(): Promise<Record<string, any> | undefined> {
        const k = await this.getKey();
        if (!k) return undefined;
        if (!k.valueCID) return undefined;
        const value = await IPFSSingleton.getJSON(k.valueCID);
        return value;
    }

    //Put
    async put(): Promise<CID> {
        const data = await this.encode();
        const cid = IPFSSingleton.put(data, { version: 1, format: 'dag-json' });
        return cid;
    }

    putWithKey(): { node: Promise<CID>; key: Promise<CID | undefined> } {
        const promises: { node: Promise<CID>; key: Promise<CID | undefined> } = {
            node: this.put(),
            key: Promise.resolve(undefined),
        };
        if (this._key) promises.key = this._key.put();
        return promises;
    }

    async *putAll(): AsyncGenerator<{ node: Promise<CID>; key: Promise<CID | undefined> }> {
        for await (const n of this.inOrderTraversal()) {
            yield (n as IPFSTree).putWithKey();
        }
    }
    async putAllSync(): Promise<{ node: CID; key: CID | undefined }[]> {
        const nodePromises = [];
        const keyPromises = [];
        for await (const n of this.putAll()) {
            nodePromises.push(n.node);
            keyPromises.push(n.key);
        }

        const nodeP = Promise.all(nodePromises);
        const keyP = Promise.all(keyPromises);
        const [nodes, keys] = await Promise.all([nodeP, keyP]);
        const v = nodes.map((n, i) => {
            return { node: n, key: keys[i] };
        });
        return v;
    }
}
