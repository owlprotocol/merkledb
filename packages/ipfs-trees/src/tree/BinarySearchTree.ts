import { IPFS } from 'ipfs';
import BinaryTreeNode from './BinaryTreeNode';

//Binary Search Tree
export default class BinarySearchTree {
    //Binary search
    //Yields searched nodes to enable cancelling search on timeout
    //Returns undefined if no result match
    static async *searchGenerator(
        root: BinaryTreeNode,
        ipfs: IPFS,
        searchKeyContent: Uint8Array,
    ): AsyncGenerator<BinaryTreeNode | undefined> {
        const keyContent = await root.getKeyContent(ipfs);
        yield root;

        if (BinarySearchTree.equalKey(searchKeyContent, keyContent)) return;

        //left < root < right
        if (BinarySearchTree.compareKey(searchKeyContent, keyContent)) {
            const leftNode = await root.getLeft(ipfs);
            if (leftNode) {
                leftNode.setParentNode(root);
                const searchRec = BinarySearchTree.searchGenerator(leftNode, ipfs, searchKeyContent);
                yield* searchRec;
            }
        } else {
            const rightNode = await root.getRight(ipfs);
            if (rightNode) {
                rightNode.setParentNode(root);
                const searchRec = BinarySearchTree.searchGenerator(rightNode, ipfs, searchKeyContent);
                yield* searchRec;
            }
        }
    }

    static async search(
        root: BinaryTreeNode,
        ipfs: IPFS,
        searchKeyContent: Uint8Array,
    ): Promise<BinaryTreeNode | undefined> {
        const searchGen = BinarySearchTree.searchGenerator(root, ipfs, searchKeyContent);
        let n: BinaryTreeNode | undefined;
        for await (n of searchGen) {
        }
        return n;
    }

    //Inserts and returns root
    static async insert(root: BinaryTreeNode, ipfs: IPFS, node: BinaryTreeNode): Promise<BinaryTreeNode> {
        const insertKeyContent = await node.getKeyContent(ipfs);
        const searchGen = BinarySearchTree.searchGenerator(root, ipfs, insertKeyContent);

        let leafNode: BinaryTreeNode | undefined;
        for await (const x of searchGen) {
            leafNode = x;
        }

        if (!leafNode) throw new Error('Search did not return any leaf node!');

        //Insert to leaf
        let currNode = node;

        const resultGen = await searchGen.next();
        if (resultGen.value) {
            //Duplicate insert
            return root;
        } else {
            const leafContent = await leafNode.getKeyContent(ipfs);
            //left < root < right
            if (BinarySearchTree.compareKey(insertKeyContent, leafContent)) {
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
        //console.debug(`${a.toString()} === ${b.toString()}`);
        return a.toString() === b.toString();
    }

    static compareKey(a: Uint8Array, b: Uint8Array): boolean {
        return a < b;
    }
}
