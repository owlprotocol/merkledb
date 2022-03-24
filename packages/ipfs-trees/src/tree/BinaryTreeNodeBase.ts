import { CID } from 'multiformats';
import { ByteView, encode, decode, code } from '@ipld/dag-json';
import { sha256 } from 'multiformats/hashes/sha2';
import { IPFS } from 'ipfs';
import BinaryTreeNodeData from './BinaryTreeNodeData';
import { Digest } from 'multiformats/hashes/digest';
import { NODE_ENV } from '../utils/environment';

export default class BinaryTreeNodeBase {
    readonly key: CID;
    readonly left: CID | undefined;
    readonly right: CID | undefined;

    //Memoization
    private _encodeCache: ByteView<BinaryTreeNodeData> | undefined;
    private _digestCache: Digest<18, number> | undefined;
    private _cidCache: CID | undefined;

    //Development Stats
    private static _totalNetworkGet = 0;
    private static _totalNetworkPut = 0;

    protected constructor(key: CID, left: CID | undefined, right: CID | undefined) {
        this.key = key;
        this.left = left;
        this.right = right;
    }

    static create(key: CID, left: CID | undefined, right: CID | undefined) {
        return new BinaryTreeNodeBase(key, left, right);
    }

    withKey(key: CID): BinaryTreeNodeBase {
        return BinaryTreeNodeBase.create(key, this.left, this.right);
    }

    withLeft(left: CID): BinaryTreeNodeBase {
        return BinaryTreeNodeBase.create(this.key, left, this.right);
    }

    withRight(right: CID): BinaryTreeNodeBase {
        return BinaryTreeNodeBase.create(this.key, this.left, right);
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

    encode(): ByteView<BinaryTreeNodeData> {
        if (this._encodeCache) return this._encodeCache;

        //Data
        const data: BinaryTreeNodeData = {
            key: this.key,
        };
        if (this.left) data.left = this.left;
        if (this.right) data.right = this.right;
        //Encode
        return encode(data);
    }

    static decode(data: ByteView<BinaryTreeNodeData>): BinaryTreeNodeBase {
        //Decode
        const { key, left, right } = decode(data);
        return BinaryTreeNodeBase.create(key, left, right);
    }

    //Network
    static async get(ipfs: IPFS, cid: CID): Promise<BinaryTreeNodeBase> {
        if (NODE_ENV !== 'production') BinaryTreeNodeBase._totalNetworkGet += 1;

        const data = await ipfs.block.get(cid);
        const node = BinaryTreeNodeBase.decode(data);
        return node;
    }

    async put(ipfs: IPFS): Promise<CID> {
        if (NODE_ENV !== 'production') BinaryTreeNodeBase._totalNetworkPut += 1;

        const data = this.encode();
        const cid = await ipfs.block.put(data, { version: 1, format: 'dag-json' });
        return cid;
    }

    //Equality
    static equals(a: BinaryTreeNodeBase, b: BinaryTreeNodeBase): boolean {
        if (a === b) return true;

        if (!a.key.equals(b.key)) return false;
        if (
            (a.left === undefined && b.left !== undefined) ||
            (b.left === undefined && a.left !== undefined) ||
            (a.left !== undefined && a.left.equals(b.left))
        )
            return false;
        if (
            (a.right === undefined && b.right !== undefined) ||
            (b.right === undefined && a.right !== undefined) ||
            (a.right !== undefined && a.right.equals(b.right))
        )
            return false;

        return true;
    }

    equals(b: BinaryTreeNodeBase): boolean {
        return BinaryTreeNodeBase.equals(this, b);
    }
}
