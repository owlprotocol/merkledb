import { CID } from 'multiformats';
import { ByteView, encode, decode, code } from '@ipld/dag-json';
import { sha256 } from 'multiformats/hashes/sha2';
import { IPFS } from 'ipfs';
import { Digest } from 'multiformats/hashes/digest';
import TreeSearch from '../TreeSearch';
import IPFSTreeIndex from './IPFSTreeIndex';

export interface IPFSTreeData {
    keyCID: CID;
    leftCID?: CID;
    rightCID?: CID;
}

export default class IPFSTree extends TreeSearch<IPFSTreeIndex> {
    private readonly _key: IPFSTreeIndex | undefined;
    private readonly _left: TreeSearch<IPFSTreeIndex> | undefined;
    private readonly _right: TreeSearch<IPFSTreeIndex> | undefined;

    private readonly _keyCID: CID | undefined;
    private readonly _leftCID: CID | undefined;
    private readonly _rightCID: CID | undefined;

    //memoization
    private _encodeCache: ByteView<IPFSTreeData> | undefined;
    private _digestCache: Digest<18, number> | undefined;
    private _cidCache: CID | undefined;

    //IPFS Client
    private static _ipfs: IPFS;
    //Development Stats
    static _totalNetworkGet = 0;
    static _totalNetworkPut = 0;

    static setIPFS(ipfs: IPFS) {
        this._ipfs = ipfs;
        IPFSTreeIndex.setIPFS(ipfs);
    }

    protected constructor(
        key: IPFSTreeIndex | undefined,
        left: TreeSearch<IPFSTreeIndex> | undefined,
        right: TreeSearch<IPFSTreeIndex> | undefined,
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
    static create(
        key: IPFSTreeIndex,
        left: TreeSearch<IPFSTreeIndex> | undefined,
        right: TreeSearch<IPFSTreeIndex> | undefined,
    ): IPFSTree {
        return new IPFSTree(key, left, right, undefined, undefined, undefined);
    }

    static createWithCIDs(keyCID: CID, leftCID: CID | undefined, rightCID: CID | undefined): IPFSTree {
        return new IPFSTree(undefined, undefined, undefined, keyCID, leftCID, rightCID);
    }

    static createLeaf(key: IPFSTreeIndex): IPFSTree {
        return this.create(key, undefined, undefined);
    }

    //Instantiate key
    static createWithKey(
        key: number,
        valueCID: CID | undefined,
        left: TreeSearch<IPFSTreeIndex> | undefined,
        right: TreeSearch<IPFSTreeIndex> | undefined,
    ) {
        return this.create(IPFSTreeIndex.create(key, valueCID), left, right);
    }

    static createLeafWithKey(key: number, valueCID: CID | undefined) {
        return this.createWithKey(key, valueCID, undefined, undefined);
    }

    withKey(key: IPFSTreeIndex) {
        if (!this._key) throw new Error('Node has no key!');

        if (key.equals(this._key)) return this;
        return IPFSTree.create(key, this._left, this._right);
    }

    withLeft(left: TreeSearch<IPFSTreeIndex>) {
        if (!this._key) throw new Error('Node has no key!');

        if (left === this._left) return this;
        const n = IPFSTree.create(this._key, left, this._right);
        return n;
    }

    withRight(right: TreeSearch<IPFSTreeIndex>) {
        if (!this._key) throw new Error('Node has no key!');

        if (right === this._right) return this;
        const n = IPFSTree.create(this._key, this._left, right);
        return n;
    }

    //Async Factory
    static async createFromCID(cid: CID): Promise<IPFSTree> {
        IPFSTree._totalNetworkGet += 1;
        const data = await IPFSTree._ipfs.block.get(cid);
        return IPFSTree.decode(data);
    }

    //Getters
    async getKey(): Promise<IPFSTreeIndex> {
        if (this._key) return this._key;

        //@ts-expect-error
        this._key = await IPFSTreeIndex.createFromCID(this._keyCID);
        return this._key;
    }
    async getLeft(): Promise<TreeSearch<IPFSTreeIndex> | undefined> {
        if (this._left) return this._left;
        if (!this._leftCID) return undefined;

        //@ts-expect-error
        this._left = await IPFSTree.createFromCID(this._leftCID);
        return this._left as TreeSearch<IPFSTreeIndex>;
    }
    async getRight(): Promise<TreeSearch<IPFSTreeIndex> | undefined> {
        if (this._right) return this._right;
        if (!this._rightCID) return undefined;

        //@ts-expect-error
        this._right = await IPFSTree.createFromCID(this._rightCID);
        return this._right as TreeSearch<IPFSTreeIndex>;
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
        this._encodeCache = encode(data);
        return this._encodeCache;
    }

    static decode(data: ByteView<IPFSTreeData>): IPFSTree {
        //Decode
        const { keyCID, leftCID, rightCID } = decode(data);
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
        this._cidCache = CID.create(1, code, hash);
        return this._cidCache;
    }

    async put(): Promise<CID> {
        IPFSTree._totalNetworkPut += 1;
        const data = await this.encode();
        const cid = await IPFSTree._ipfs.block.put(data, { version: 1, format: 'dag-json' });
        return cid;
    }

    putWithKey(): { node: Promise<CID>; key: Promise<CID> | undefined } {
        const promises: { node: Promise<CID>; key: Promise<CID> | undefined } = {
            node: this.put(),
            key: undefined,
        };
        if (this._key) promises.key = this._key.put();
        return promises;
    }
}
