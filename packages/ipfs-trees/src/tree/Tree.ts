export default abstract class Tree<T> {
    abstract getKey(): Promise<T>;

    abstract getLeft(): Promise<Tree<T> | undefined>;
    abstract getRight(): Promise<Tree<T> | undefined>;
    //abstract getParent(): Promise<Tree<T> | undefined>;

    abstract withKey(key: T): Tree<T>;
    abstract withLeft(left: Tree<T>): Tree<T>;
    abstract withRight(right: Tree<T>): Tree<T>;

    //abstract withLeftKey(left: T): TreeNode<T>;
    //abstract withRightKey(right: T): TreeNode<T>;
    //abstract setParent(parent: Tree<T>): void;

    //Left, Root, Right
    static async *inOrderTraversal<T>(root: Tree<T> | undefined): AsyncGenerator<Tree<T>> {
        if (!root) return;

        yield* Tree.inOrderTraversal(await root.getLeft());
        yield root;
        yield* Tree.inOrderTraversal(await root.getRight());
    }

    async *inOrderTraversal(): AsyncGenerator<Tree<T>> {
        yield* Tree.inOrderTraversal(this);
    }

    //Root, Left, Right
    static async *preOrderTraversal<T>(root: Tree<T> | undefined): AsyncGenerator<Tree<T>> {
        if (!root) return;

        yield root;
        yield* Tree.preOrderTraversal(await root.getLeft());
        yield* Tree.preOrderTraversal(await root.getRight());
    }

    async *preOrderTraversal(): AsyncGenerator<Tree<T>> {
        yield* Tree.preOrderTraversal(this);
    }

    //Left, Right, Root
    static async *postOrderTraversal<T>(root: Tree<T> | undefined): AsyncGenerator<Tree<T>> {
        if (!root) return;

        yield* Tree.postOrderTraversal(await root.getLeft());
        yield* Tree.postOrderTraversal(await root.getRight());
        yield root;
    }

    async *postOrderTraversal(): AsyncGenerator<Tree<T>> {
        yield* Tree.postOrderTraversal(this);
    }

    //Left, Right, Root
    async *depthFirstTraversal(): AsyncGenerator<Tree<T>> {
        const arr: Tree<T>[] = [this];
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

    async getKeyContentInOrder(): Promise<T[]> {
        const promises: Promise<T>[] = [];
        for await (const c of this.inOrderTraversal()) {
            promises.push(c.getKey());
        }

        return Promise.all(promises);
    }
}
