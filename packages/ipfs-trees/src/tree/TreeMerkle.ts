export default abstract class TreeMerkle<H> {
    abstract getParent(): Promise<TreeMerkle<H> | undefined>;
    abstract getLeft(): Promise<TreeMerkle<H> | undefined>;
    abstract getRight(): Promise<TreeMerkle<H> | undefined>;
    abstract getHash(): Promise<H>;

    abstract setParent(a: TreeMerkle<H>): Promise<TreeMerkle<H>>;

    async getSibling(): Promise<TreeMerkle<H> | undefined> {
        const parent = await this.getParent();
        if (!parent) return this;

        //Recurse up with sibling
        let sibling: TreeMerkle<H> | undefined;
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
    abstract join(a: TreeMerkle<H>): Promise<TreeMerkle<H>>;

    //Yield siblings for merkle proof, last yield is root
    async *recurseSibling(): AsyncGenerator<TreeMerkle<H>> {
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
    static async *insertGenerator<H, T extends TreeMerkle<H>>(root: T | undefined, a: T): AsyncGenerator<T> {
        if (!root) {
            //No root, return self
            yield a;
            return;
        }

        //Level-order traverse to find leaf node
        const levelOrderGen = TreeMerkle.levelOrderTraversal(root);
        let leafNode: TreeMerkle<H>;

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
        yield currNode as T;

        while (prevNodeParent) {
            if (!prevNodeSibling) throw new Error('No sibling!');
            currNode = await currNode.join(prevNodeSibling!) as T;
            yield currNode as T;

            prevNode = prevNodeParent;
            prevNodeParent = await prevNode.getParent();
            prevNodeSibling = await prevNode.getSibling();
        }
    }

    static async insert<H, T extends TreeMerkle<H>>(root: T | undefined, a: T): Promise<T> {
        const gen = TreeMerkle.insertGenerator(root, a);
        let n: T;
        for await (n of gen) {
            n = n;
        }
        return n!;
    }

    async *insertGenerator(a: TreeMerkle<H>): AsyncGenerator<TreeMerkle<H>> {
        yield* TreeMerkle.insertGenerator(this, a);
    }

    async insert(a: TreeMerkle<H>): Promise<TreeMerkle<H>> {
        return TreeMerkle.insert(this, a);
    }

    //Level-order Traversal
    static async *levelOrderTraversal<H, T extends TreeMerkle<H>>(root: T): AsyncGenerator<T> {
        const arr: T[] = [root];
        while (arr.length > 0) {
            //FIFO
            const pop = arr.shift()!;
            yield pop;

            const leftNode = await pop.getLeft();
            if (leftNode) {
                arr.push(leftNode as T);
            }

            const rightNode = await pop.getRight();
            if (rightNode) {
                arr.push(rightNode as T);
            }
        }
    }
}
