import Tree from './Tree';

export default abstract class TreeBalanced<T> extends Tree<T> {
    //Inserts and returns root
    static async *insertGenerator<T>(
        root: TreeBalanced<T> | undefined,
        a: TreeBalanced<T>,
    ): AsyncGenerator<TreeBalanced<T>> {
        if (!root) {
            //No root, return self
            yield a;
            return;
        }

        const levelOrderGen = TreeBalanced.levelOrderTraversal(root);

        for await (const n of levelOrderGen) {
            const left = await n.getLeft();
            if (left === undefined) {
                //Set Left Node
                yield (await n.withLeft(a)) as TreeBalanced<T>;
                break;
            } else {
                const right = await n.getRight();
                if (right === undefined) {
                    //Set Right Node
                    yield (await n.withRight(a)) as TreeBalanced<T>;
                    break;
                }
            }
        }
    }

    static async insert<T>(root: TreeBalanced<T> | undefined, a: TreeBalanced<T>): Promise<TreeBalanced<T>> {
        const gen = TreeBalanced.insertGenerator(root, a);
        let n: TreeBalanced<T>;
        for await (n of gen) {
            n = n;
        }
        return n!;
    }

    async *insertGenerator(a: TreeBalanced<T>): AsyncGenerator<TreeBalanced<T>> {
        yield* TreeBalanced.insertGenerator(this, a);
    }

    async insert(a: TreeBalanced<T>): Promise<TreeBalanced<T>> {
        return TreeBalanced.insert(this, a);
    }
}
