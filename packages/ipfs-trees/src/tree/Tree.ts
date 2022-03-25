import TreeInterface from './TreeInterface';

export default abstract class Tree<T> implements TreeInterface<T> {
    abstract getKey(): Promise<T>;
    abstract getLeft(): Promise<TreeInterface<T> | undefined>;
    abstract getRight(): Promise<TreeInterface<T> | undefined>;
    abstract withKey(key: T): TreeInterface<T>;
    abstract withLeft(left: TreeInterface<T>): TreeInterface<T>;
    abstract withRight(right: TreeInterface<T>): TreeInterface<T>;

    //Left, Root, Right
    static async *inOrderTraversal<T>(root: TreeInterface<T> | undefined): AsyncGenerator<TreeInterface<T>> {
        if (!root) return;

        yield* Tree.inOrderTraversal(await root.getLeft());
        yield root;
        yield* Tree.inOrderTraversal(await root.getRight());
    }

    async *inOrderTraversal(): AsyncGenerator<TreeInterface<T>> {
        yield* Tree.inOrderTraversal(this);
    }

    //Root, Left, Right
    static async *preOrderTraversal<T>(root: TreeInterface<T> | undefined): AsyncGenerator<TreeInterface<T>> {
        if (!root) return;

        yield root;
        yield* Tree.preOrderTraversal(await root.getLeft());
        yield* Tree.preOrderTraversal(await root.getRight());
    }

    async *preOrderTraversal(): AsyncGenerator<TreeInterface<T>> {
        yield* Tree.preOrderTraversal(this);
    }

    //Left, Right, Root
    static async *postOrderTraversal<T>(root: TreeInterface<T> | undefined): AsyncGenerator<TreeInterface<T>> {
        if (!root) return;

        yield* Tree.postOrderTraversal(await root.getLeft());
        yield* Tree.postOrderTraversal(await root.getRight());
        yield root;
    }

    async *postOrderTraversal(): AsyncGenerator<TreeInterface<T>> {
        yield* Tree.postOrderTraversal(this);
    }

    //Left, Right, Root
    async *depthFirstTraversal(): AsyncGenerator<TreeInterface<T>> {
        const arr: TreeInterface<T>[] = [this];
        while (arr.length > 0) {
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

    async getKeysInOrder(): Promise<T[]> {
        const promises: Promise<T>[] = [];
        for await (const c of this.inOrderTraversal()) {
            promises.push(c.getKey());
        }

        return Promise.all(promises);
    }
}
