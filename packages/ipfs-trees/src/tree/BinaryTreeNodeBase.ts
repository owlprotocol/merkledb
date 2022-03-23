import { CID } from 'multiformats';
import { ByteView, encode, decode, code } from '@ipld/dag-json';
import { sha256 } from 'multiformats/hashes/sha2';
import { IPFS } from 'ipfs';
import BinaryTreeNodeData from './BinaryTreeNodeData';

export default class BinaryTreeNodeBase {
    readonly key: CID;
    readonly left: CID | undefined;
    readonly right: CID | undefined;

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

    async cid(): Promise<CID> {
        const hash = await sha256.digest(this.encode());
        return CID.create(1, code, hash);
    }

    encode(): ByteView<BinaryTreeNodeData> {
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
        const data = await ipfs.block.get(cid);
        const node = BinaryTreeNodeBase.decode(data);
        return node;
    }

    async put(ipfs: IPFS): Promise<CID> {
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
