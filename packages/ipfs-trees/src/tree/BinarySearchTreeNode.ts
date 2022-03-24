import { IPFS } from 'ipfs';
import { CID } from 'multiformats';
import BinaryTreeNode from './BinaryTreeNode';

//Binary Search Tree
export default class BinarySearchTreeNode extends BinaryTreeNode {
    protected constructor(
        key: CID,
        left: CID | undefined,
        right: CID | undefined,
        leftNode: BinaryTreeNode | undefined,
        rightNode: BinaryTreeNode | undefined,
    ) {
        super(key, left, right, leftNode, rightNode);
    }

    //Base case factory
    static createRoot(key: CID): BinarySearchTreeNode {
        return new BinarySearchTreeNode(key, undefined, undefined, undefined, undefined);
    }

    //Overrides
    override async withLeftNode(leftNode: BinarySearchTreeNode): Promise<BinarySearchTreeNode> {
        return super.withLeftNode(leftNode) as Promise<BinarySearchTreeNode>;
    }

    override async withRightNode(rightNode: BinarySearchTreeNode): Promise<BinarySearchTreeNode> {
        return super.withRightNode(rightNode) as Promise<BinarySearchTreeNode>;
    }

    override getParentNode(): BinarySearchTreeNode | undefined {
        return super.getParentNode() as BinarySearchTreeNode | undefined;
    }

    override async getLeft(ipfs: IPFS): Promise<BinarySearchTreeNode | undefined> {
        return super.getLeft(ipfs) as Promise<BinarySearchTreeNode | undefined>;
    }

    async getRight(ipfs: IPFS): Promise<BinarySearchTreeNode | undefined> {
        return super.getRight(ipfs) as Promise<BinarySearchTreeNode | undefined>;
    }

    //Binary search
    //Yields searched nodes to enable cancelling search on timeout
    //Returns undefined if no result match
    async *search(
        ipfs: IPFS,
        searchKeyContent: Uint8Array,
    ): AsyncGenerator<BinarySearchTreeNode, BinarySearchTreeNode | undefined> {
        const keyContent = await this.getKeyContent(ipfs);
        yield this;

        if (BinarySearchTreeNode.equalKey(searchKeyContent, keyContent)) return this;

        //left < root < right
        if (BinarySearchTreeNode.compareKey(searchKeyContent, keyContent)) {
            const leftNode = await this.getLeft(ipfs);
            if (leftNode) {
                leftNode.setParentNode(this);
                const searchRec = leftNode.search(ipfs, searchKeyContent);
                yield* searchRec;
                return (await searchRec.next()).value;
            }
        } else {
            const rightNode = await this.getRight(ipfs);
            if (rightNode) {
                rightNode.setParentNode(this);
                const searchRec = rightNode.search(ipfs, searchKeyContent);
                yield* searchRec;
                return (await searchRec.next()).value;
            }
        }
    }

    //Inserts and returns root
    async insert(ipfs: IPFS, node: BinarySearchTreeNode): Promise<BinarySearchTreeNode> {
        const insertKeyContent = await node.getKeyContent(ipfs);
        const searchGen = this.search(ipfs, insertKeyContent);

        let leafNode: BinarySearchTreeNode | undefined;
        for await (const x of searchGen) {
            leafNode = x;
        }

        if (!leafNode) throw new Error('Search did not return any leaf node!');

        //Insert to leaf
        let currNode = node;

        const resultGen = await searchGen.next();
        if (resultGen.value) {
            //Duplicate insert
            return this;
        } else {
            const leafContent = await leafNode.getKeyContent(ipfs);
            //left < root < right
            if (BinarySearchTreeNode.compareKey(insertKeyContent, leafContent)) {
                currNode = await leafNode.withLeftNode(currNode);
            } else {
                currNode = await leafNode.withRightNode(currNode);
            }
        }

        //Recurse from leaf node up to root
        let leafNodeParent = leafNode.getParentNode();
        while (leafNodeParent) {
            const parentLeft = await leafNodeParent.getLeft(ipfs);
            if (parentLeft === leafNode) {
                currNode = await leafNodeParent.withLeftNode(currNode);
            } else {
                currNode = await leafNodeParent.withRightNode(currNode);
            }

            leafNode = leafNode?.getParentNode();
            leafNodeParent = leafNode?.getParentNode();
        }

        return currNode;
    }

    //Comparators
    //TODO: Performance
    //TODO: Use generic Comparable<T> type
    static equalKey(a: Uint8Array, b: Uint8Array): boolean {
        return a.toString() === b.toString();
    }

    static compareKey(a: Uint8Array, b: Uint8Array): boolean {
        return a < b;
    }
}
