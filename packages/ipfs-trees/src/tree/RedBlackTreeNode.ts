import { IPFS } from 'ipfs';
import { CID } from 'multiformats';
import BinaryTreeNode from './BinaryTreeNode';

//Red-Black Tree
export class RedBlackTreeNode extends BinaryTreeNode {
    private red: boolean;

    protected constructor(
        key: CID,
        left: CID | undefined,
        right: CID | undefined,
        leftNode: BinaryTreeNode | undefined,
        rightNode: BinaryTreeNode | undefined,
        red: boolean,
    ) {
        super(key, left, right, leftNode, rightNode);
        this.red = red;
    }

    //Base case
    static createRoot(key: CID): RedBlackTreeNode {
        return new RedBlackTreeNode(key, undefined, undefined, undefined, undefined, false);
    }

    //Inserts and returns root
    async insert(ipfs: IPFS, node: RedBlackTreeNode): Promise<RedBlackTreeNode> {
        const insertVal = await node.getKeyContent(ipfs);
        const inorder = this.inorderTraversal(ipfs);
        for await (const x of inorder) {
            const xVal = await x.getKeyContent(ipfs);
            //TODO: Custom compare
            //if (RBNode.compare(x)
        }

        return node;
    }

    static compare(a: Uint8Array, b: Uint8Array): boolean {
        return a < b;
    }
}
