import { CID } from 'multiformats';
import { IPFS } from 'ipfs';
import invariant from 'tiny-invariant';
import BinaryTreeNodeBase from './BinaryTreeNodeBase';
import { NODE_ENV } from '../utils/environment';

export default class BinaryTreeNode extends BinaryTreeNodeBase {
    private keyContent: Uint8Array | undefined;
    protected leftNode: BinaryTreeNode | undefined;
    protected rightNode: BinaryTreeNode | undefined;

    //Cached parent node post traversal
    //This is NOT a safe pointer
    private readonly parentNode: BinaryTreeNode | undefined;

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

    static override createRoot(key: CID): BinaryTreeNode {
        return BinaryTreeNode.create(key, undefined, undefined);
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
        const n = new BinaryTreeNode(this.key, await leftNode.cid(), this.right, leftNode, this.rightNode);
        leftNode.setParentNode(n);
        return n;
    }

    async withRightNode(rightNode: BinaryTreeNode): Promise<BinaryTreeNode> {
        //Set left CID, resets left node
        const n = new BinaryTreeNode(this.key, this.left, await rightNode.cid(), this.leftNode, rightNode);
        rightNode.setParentNode(n);
        return n;
    }

    //Getters
    getParentNode(): BinaryTreeNode | undefined {
        const parentNode = this.parentNode;

        //Sanity check
        if (NODE_ENV !== 'production') {
            if (parentNode) {
                invariant(
                    parentNode?.leftNode === this || parentNode?.rightNode === this,
                    'parentNode does not have this as leaf',
                );
            }
        }

        return parentNode;
    }

    setParentNode(parentNode: BinaryTreeNode): void {
        if (this.parentNode === parentNode) return;

        //@ts-expect-error
        this.parentNode = parentNode;
        //Sanity check
        if (NODE_ENV !== 'production') {
            if (parentNode) {
                invariant(
                    parentNode?.leftNode === this || parentNode?.rightNode === this,
                    'parentNode does not have this as leaf',
                );
            }
        }
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
            leftNode.setParentNode(this);
            yield* leftNode.inorderTraversal(ipfs);
        }

        yield this;

        const rightNode = await this.getRight(ipfs);
        if (rightNode) {
            rightNode.setParentNode(this);
            yield* rightNode.inorderTraversal(ipfs);
        }
    }

    //Root, Left, Right
    async *preorderTraversal(ipfs: IPFS): AsyncGenerator<BinaryTreeNode> {
        yield this;

        const leftNode = await this.getLeft(ipfs);
        if (leftNode) {
            leftNode.setParentNode(this);
            yield* leftNode.preorderTraversal(ipfs);
        }

        const rightNode = await this.getRight(ipfs);
        if (rightNode) {
            rightNode.setParentNode(this);
            yield* rightNode.preorderTraversal(ipfs);
        }
    }

    //Left, Right, Root
    async *postorderTraversal(ipfs: IPFS): AsyncGenerator<BinaryTreeNode> {
        const leftNode = await this.getLeft(ipfs);
        if (leftNode) {
            leftNode.setParentNode(this);
            yield* leftNode.postorderTraversal(ipfs);
        }

        const rightNode = await this.getRight(ipfs);
        if (rightNode) {
            rightNode.setParentNode(this);
            yield* rightNode.postorderTraversal(ipfs);
        }

        yield this;
    }

    //Left, Right, Root
    async *depthFirstTraversal(ipfs: IPFS): AsyncGenerator<BinaryTreeNode> {
        const arr: BinaryTreeNode[] = [this];
        while (arr.length > 0) {
            const pop = arr.pop()!;
            yield pop;

            const leftNode = await pop.getLeft(ipfs);
            if (leftNode) {
                leftNode.setParentNode(pop);
                arr.push(leftNode);
            }

            const rightNode = await pop.getRight(ipfs);
            if (rightNode) {
                rightNode.setParentNode(pop);
                arr.push(rightNode);
            }
        }
    }

    //String
    toString() {
        return this.toStringDepth(0);
    }

    async getKeyContentAll(ipfs: IPFS) {
        const promises = [];
        for await (const c of this.depthFirstTraversal(ipfs)) {
            promises.push(c.getKeyContent(ipfs));
        }

        await Promise.all(promises);
    }

    toStringDepth(d: number) {
        let str = '';
        for (let i = 0; i < d; i++) {
            str = str + '    ';
        }
        //if (d > 0) str = str + ' |__';
        str = str + this.key.toString();
        if (this.keyContent) str = str + ` (${this.keyContent.toString()})`;
        else str = str + '\n';

        if (this.leftNode) str = str + '\n' + this.leftNode.toStringDepth(d + 1);
        if (this.rightNode) str = str + '\n' + this.rightNode.toStringDepth(d + 1);
        else str = str + '\n';

        return str;
    }
}
