import { CID } from 'multiformats';
import { IPFS } from 'ipfs';
import BinaryTreeNodeBase from './BinaryTreeNodeBase';

export default class BinaryTreeNode extends BinaryTreeNodeBase {
    private keyContent: Uint8Array | undefined;
    private leftNode: BinaryTreeNode | undefined;
    private rightNode: BinaryTreeNode | undefined;

    //Cached parent node post traversal
    private parentNode: BinaryTreeNode | undefined;

    protected constructor(
        key: CID,
        left: CID | undefined,
        right: CID | undefined,
        leftNode: BinaryTreeNode | undefined,
        rightNode: BinaryTreeNode | undefined,
    ) {
        super(key, left, right);
        this.leftNode = leftNode;
        this.rightNode = rightNode;
    }

    //Factory
    static override create(key: CID, left: CID | undefined, right: CID | undefined): BinaryTreeNode {
        return new BinaryTreeNode(key, left, right, undefined, undefined);
    }

    static async createWithLeaves(
        key: CID,
        leftNode: BinaryTreeNode | undefined,
        rightNode: BinaryTreeNode | undefined,
    ): Promise<BinaryTreeNode> {
        const left = leftNode ? await leftNode.cid() : undefined;
        const right = rightNode ? await rightNode.cid() : undefined;
        return new BinaryTreeNode(key, left, right, leftNode, rightNode);
    }

    //Setters
    override withKey(key: CID): BinaryTreeNode {
        return new BinaryTreeNode(key, this.left, this.right, this.leftNode, this.rightNode);
    }

    override withLeft(left: CID): BinaryTreeNode {
        //Set left CID, resets left node
        return new BinaryTreeNode(this.key, left, this.right, undefined, this.rightNode);
    }

    override withRight(right: CID): BinaryTreeNode {
        //Set left CID, resets left node
        return new BinaryTreeNode(this.key, this.left, right, this.leftNode, undefined);
    }

    async withLeftNode(leftNode: BinaryTreeNode): Promise<BinaryTreeNode> {
        //Set left CID, resets left node
        return new BinaryTreeNode(this.key, await leftNode.cid(), this.right, leftNode, this.rightNode);
    }

    async withRightNode(rightNode: BinaryTreeNode): Promise<BinaryTreeNode> {
        //Set left CID, resets left node
        return new BinaryTreeNode(this.key, this.left, await rightNode.cid(), this.leftNode, rightNode);
    }

    //Network Fetch
    async getKeyContent(ipfs: IPFS): Promise<Uint8Array> {
        //Set cached leaf
        if (!this.keyContent) {
            this.keyContent = await ipfs.block.get(this.key);
        }

        return this.keyContent;
    }

    async getLeft(ipfs: IPFS): Promise<BinaryTreeNode | undefined> {
        //Node has no leaft
        if (!this.left) return undefined;

        //Set cached leaf
        if (!this.leftNode) {
            const tnodeBase = await BinaryTreeNode.get(ipfs, this.left);
            this.leftNode = BinaryTreeNode.create(tnodeBase.key, tnodeBase.left, tnodeBase.right);
        }

        return this.leftNode;
    }

    async getRight(ipfs: IPFS): Promise<BinaryTreeNode | undefined> {
        //Node has no leaft
        if (!this.right) return undefined;

        //Set cached leaf
        if (!this.rightNode) {
            const tnodeBase = await BinaryTreeNode.get(ipfs, this.right);
            this.rightNode = BinaryTreeNode.create(tnodeBase.key, tnodeBase.left, tnodeBase.right);
        }

        return this.rightNode;
    }

    //Left, Root, Right
    async *inorderTraversal(ipfs: IPFS): AsyncGenerator<BinaryTreeNode> {
        const leftNode = await this.getLeft(ipfs);
        if (leftNode) {
            leftNode.parentNode = this;
            yield* leftNode.inorderTraversal(ipfs);
        }

        yield this;

        const rightNode = await this.getRight(ipfs);
        if (rightNode) {
            rightNode.parentNode = this;
            yield* rightNode.inorderTraversal(ipfs);
        }
    }

    //Root, Left, Right
    async *preorderTraversal(ipfs: IPFS): AsyncGenerator<BinaryTreeNode> {
        yield this;

        const leftNode = await this.getLeft(ipfs);
        if (leftNode) {
            leftNode.parentNode = this;
            yield* leftNode.preorderTraversal(ipfs);
        }

        const rightNode = await this.getRight(ipfs);
        if (rightNode) {
            rightNode.parentNode = this;
            yield* rightNode.preorderTraversal(ipfs);
        }
    }

    //Left, Right, Root
    async *postorderTraversal(ipfs: IPFS): AsyncGenerator<BinaryTreeNode> {
        const leftNode = await this.getLeft(ipfs);
        if (leftNode) {
            leftNode.parentNode = this;
            yield* leftNode.postorderTraversal(ipfs);
        }

        const rightNode = await this.getRight(ipfs);
        if (rightNode) {
            rightNode.parentNode = this;
            yield* rightNode.postorderTraversal(ipfs);
        }

        yield this;
    }
}
