export default abstract class TreeMerkle<T> {
    abstract getParent(): Promise<TreeMerkle<T> | undefined>;
    abstract getLeft(): Promise<TreeMerkle<T> | undefined>;
    abstract getRight(): Promise<TreeMerkle<T> | undefined>;
    abstract getHash(): Promise<T>;

    abstract setParent(a: TreeMerkle<T>): Promise<TreeMerkle<T>>;

    async getSibling(): Promise<TreeMerkle<T> | undefined> {
        const parent = await this.getParent();
        if (!parent) return this;

        //Recurse up with sibling
        let sibling: TreeMerkle<T> | undefined;
        if (this === (await parent!.getLeft())) {
            sibling = await parent!.getRight();
        } else {
            sibling = await parent!.getLeft();
        }

        return sibling;
    }

    async isLeafNode(): Promise<boolean> {
        const left = await this.getLeft();
        const right = await this.getRight();
        return left === undefined && right === undefined;
    }

    //Joins two nodes, creating a new node and making them siblings
    abstract join(a: TreeMerkle<T>): Promise<TreeMerkle<T>>;

    //Yield siblings for merkle proof, last yield is root
    async *recurseSibling(): AsyncGenerator<TreeMerkle<T>> {
        const parent = await this.getParent();
        if (!parent) {
            //Yield root node
            yield this;
            return;
        }

        //Recurse up with sibling
        const sibling = await this.getSibling();
        if (sibling) yield sibling;
        else throw new Error('Missing sibling for proof');

        yield* parent.recurseSibling();
    }

    //Insertion
    static async *insertGenerator<T>(root: TreeMerkle<T> | undefined, a: TreeMerkle<T>): AsyncGenerator<TreeMerkle<T>> {
        if (!root) {
            //No root, return self
            yield a;
            return;
        }

        //Level-order traverse to find leaf node
        const levelOrderGen = TreeMerkle.levelOrderTraversal(root);
        let leafNode: TreeMerkle<T>;

        for await (const n of levelOrderGen) {
            if (await n.isLeafNode()) {
                leafNode = n;
                break;
            }
        }

        //Recurse up to update parent
        let prevNode = leafNode!;
        let prevNodeParent = await prevNode.getParent();
        let prevNodeSibling = await prevNode.getSibling();

        //Insert
        let currNode = await leafNode!.join(a);
        yield currNode;

        while (prevNodeParent) {
            if (!prevNodeSibling) throw new Error('No sibling!');
            currNode = await currNode.join(prevNodeSibling!);
            yield currNode;

            prevNode = prevNodeParent;
            prevNodeParent = await prevNode.getParent();
            prevNodeSibling = await prevNode.getSibling();
        }
    }

    static async insert<T>(root: TreeMerkle<T> | undefined, a: TreeMerkle<T>): Promise<TreeMerkle<T>> {
        const gen = TreeMerkle.insertGenerator(root, a);
        let n: TreeMerkle<T>;
        for await (n of gen) {
            n = n;
        }
        return n!;
    }

    async *insertGenerator(a: TreeMerkle<T>): AsyncGenerator<TreeMerkle<T>> {
        yield* TreeMerkle.insertGenerator(this, a);
    }

    async insert(a: TreeMerkle<T>): Promise<TreeMerkle<T>> {
        return TreeMerkle.insert(this, a);
    }

    //Level-order Traversal
    static async *levelOrderTraversal<T>(root: TreeMerkle<T>): AsyncGenerator<TreeMerkle<T>> {
        const arr: TreeMerkle<T>[] = [root];
        while (arr.length > 0) {
            //FIFO
            const pop = arr.shift()!;
            yield pop;

            const leftNode = await pop.getLeft();
            if (leftNode) {
                arr.push(leftNode);
            }

            const rightNode = await pop.getRight();
            if (rightNode) {
                arr.push(rightNode);
            }
        }
    }
}
