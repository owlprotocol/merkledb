import { CID } from 'multiformats';
import { ByteView, encode, decode, code } from '@ipld/dag-json';
import { sha256 } from 'multiformats/hashes/sha2';
import { IPFS } from 'ipfs';
import { Digest } from 'multiformats/hashes/digest';
import TreeSearch from './TreeSearch';
import IPFSTreeIndex from './IPFSTreeIndex';

export interface IPFSTreeData {
    keyCID: CID;
    leftCID?: CID;
    rightCID?: CID;
}

export default class IPFSTree extends TreeSearch<IPFSTreeIndex> {
    private readonly key: IPFSTreeIndex;
    private readonly left: TreeSearch<IPFSTreeIndex> | undefined;
    private readonly right: TreeSearch<IPFSTreeIndex> | undefined;

    readonly leftCID: CID | undefined;
    readonly rightCID: CID | undefined;

    //memoization
    private _encodeCache: ByteView<IPFSTreeData> | undefined;
    private _digestCache: Digest<18, number> | undefined;
    private _cidCache: CID | undefined;

    //IPFS Client
    private static _ipfs: IPFS;
    //Development Stats
    private static _totalNetworkGet = 0;
    private static _totalNetworkPut = 0;

    static setIPFS(ipfs: IPFS) {
        this._ipfs = ipfs;
        IPFSTreeIndex.setIPFS(ipfs);
    }

    private constructor(
        key: IPFSTreeIndex,
        left: TreeSearch<IPFSTreeIndex> | undefined,
        right: TreeSearch<IPFSTreeIndex> | undefined,
    ) {
        super();
        this.key = key;
        this.left = left;
        this.right = right;
    }

    //Factory
    static create(
        key: IPFSTreeIndex,
        left: TreeSearch<IPFSTreeIndex> | undefined,
        right: TreeSearch<IPFSTreeIndex> | undefined,
    ): IPFSTree {
        return new IPFSTree(key, left, right);
    }

    static createLeaf(key: IPFSTreeIndex): IPFSTree {
        return this.create(key, undefined, undefined);
    }

    //Instantiate key
    static createWithKey(
        key: number,
        valueCID: CID,
        left: TreeSearch<IPFSTreeIndex> | undefined,
        right: TreeSearch<IPFSTreeIndex> | undefined,
    ) {
        return this.create(IPFSTreeIndex.create(key, valueCID), left, right);
    }

    static createLeafWithKey(key: number, valueCID: CID) {
        return this.createWithKey(key, valueCID, undefined, undefined);
    }

    withKey(key: IPFSTreeIndex) {
        if (key.equals(this.key)) return this;
        return IPFSTree.create(key, this.left, this.right);
    }

    withLeft(left: TreeSearch<IPFSTreeIndex>) {
        if (left === this.left) return this;
        const n = IPFSTree.create(this.key, left, this.right);
        return n;
    }

    withRight(right: TreeSearch<IPFSTreeIndex>) {
        if (right === this.right) return this;
        const n = IPFSTree.create(this.key, this.left, right);
        return n;
    }

    //Create with CID
    /*
    static createWithCIDs(key: CID, left: CID | undefined, right: CID | undefined): IPFSTree {
        return new IPFSTree(key, left, right);
    }

    static createLeafWithCIDs(key: CID): IPFSTree {
        return this.create(key, undefined, undefined);
    }
    */

    //Async Factory
    static async createFromCID(cid: CID): Promise<IPFSTree> {
        IPFSTree._totalNetworkGet += 1;
        const data = await IPFSTree._ipfs.block.get(cid);
        return IPFSTree.decode(data);
    }

    //Getters
    async getKey() {
        return this.key;
    }
    async getLeft(): Promise<TreeSearch<IPFSTreeIndex> | undefined> {
        if (this.left) return this.left;
        if (!this.leftCID) return undefined;

        //@ts-expect-error
        this.left = await IPFSTree.createFromCID(this.leftCID);
        return this.left as TreeSearch<IPFSTreeIndex>;
    }
    async getRight(): Promise<TreeSearch<IPFSTreeIndex> | undefined> {
        if (this.right) return this.right;
        if (!this.rightCID) return undefined;

        //@ts-expect-error
        this.right = await IPFSTree.createFromCID(this.rightCID);
        return this.right as TreeSearch<IPFSTreeIndex>;
    }

    //IPFS
    async encode(): Promise<ByteView<IPFSTreeData>> {
        if (this._encodeCache) return this._encodeCache;

        //Data
        const data: IPFSTreeData = {
            keyCID: await this.key.cid(),
        };
        if (this.leftCID) data.leftCID = this.leftCID;
        if (this.rightCID) data.rightCID = this.rightCID;
        //Encode
        return encode(data);
    }

    static async decode(data: ByteView<IPFSTreeData>): Promise<IPFSTree> {
        //Decode
        //TODO: Use left/right CID
        const { keyCID, leftCID, rightCID } = decode(data);
        const key = await IPFSTreeIndex.createFromCID(keyCID);

        //TODO
        const n = IPFSTree.create(key, undefined, undefined);
        //TODO: Move to factory method
        //@ts-expect-error
        n.leftCID = leftCID;
        //@ts-expect-error
        n.rightCID = rightCID;
        return n;
    }

    async digest(): Promise<Digest<18, number>> {
        if (this._digestCache) return this._digestCache;
        return sha256.digest(await this.encode());
    }

    async cid(): Promise<CID> {
        if (this._cidCache) return this._cidCache;
        const hash = await this.digest();
        return CID.create(1, code, hash);
    }

    async put(): Promise<CID> {
        IPFSTree._totalNetworkPut += 1;
        const data = await this.encode();
        const cid = await IPFSTree._ipfs.block.put(data, { version: 1, format: 'dag-json' });
        return cid;
    }
}
