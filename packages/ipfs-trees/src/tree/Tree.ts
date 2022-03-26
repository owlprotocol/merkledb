import TreeInterface from '../interfaces/TreeInterface';

export default abstract class Tree<K> implements TreeInterface<K> {
    abstract getKey(): Promise<K>;
    abstract getLeft(): Promise<Tree<K> | undefined>;
    abstract getRight(): Promise<Tree<K> | undefined>;
    abstract withKey(key: K): Promise<Tree<K>>;
    abstract withLeft(left: Tree<K>): Promise<Tree<K>>;
    abstract withRight(right: Tree<K>): Promise<Tree<K>>;

    //Left, Root, Right
    static async *inOrderTraversal<T>(root: Tree<T> | undefined): AsyncGenerator<Tree<T>> {
        if (!root) return;

        yield* Tree.inOrderTraversal(await root.getLeft());
        yield root;
        yield* Tree.inOrderTraversal(await root.getRight());
    }

    async *inOrderTraversal(): AsyncGenerator<Tree<K>> {
        yield* Tree.inOrderTraversal(this);
    }

    //Root, Left, Right
    static async *preOrderTraversal<T>(root: Tree<T> | undefined): AsyncGenerator<Tree<T>> {
        if (!root) return;

        yield root;
        yield* Tree.preOrderTraversal(await root.getLeft());
        yield* Tree.preOrderTraversal(await root.getRight());
    }

    async *preOrderTraversal(): AsyncGenerator<Tree<K>> {
        yield* Tree.preOrderTraversal(this);
    }

    //Left, Right, Root
    static async *postOrderTraversal<T>(root: Tree<T> | undefined): AsyncGenerator<Tree<T>> {
        if (!root) return;

        yield* Tree.postOrderTraversal(await root.getLeft());
        yield* Tree.postOrderTraversal(await root.getRight());
        yield root;
    }

    async *postOrderTraversal(): AsyncGenerator<Tree<K>> {
        yield* Tree.postOrderTraversal(this);
    }

    //Depth First Traversal
    static async *depthFirstTraversal<K>(root: Tree<K>): AsyncGenerator<Tree<K>> {
        const arr: Tree<K>[] = [root];
        while (arr.length > 0) {
            //LIFO
            const pop = arr.pop()!;
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

    async *depthFirstTraversal(): AsyncGenerator<Tree<K>> {
        yield* Tree.depthFirstTraversal(this);
    }

    //Level-order Traversal
    static async *levelOrderTraversal<K>(root: Tree<K>): AsyncGenerator<Tree<K>> {
        const arr: Tree<K>[] = [root];
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

    async *levelOrderTraversal(): AsyncGenerator<Tree<K>> {
        yield* Tree.levelOrderTraversal(this);
    }

    //Iterate Keys
    async getKeysInOrder(): Promise<K[]> {
        const promises: Promise<K>[] = [];
        for await (const c of this.inOrderTraversal()) {
            promises.push(c.getKey());
        }

        return Promise.all(promises);
    }

    async getKeysLevelOrder(): Promise<K[]> {
        const promises: Promise<K>[] = [];
        for await (const c of this.levelOrderTraversal()) {
            promises.push(c.getKey());
        }

        return Promise.all(promises);
    }
}
