import Tree from './Tree';

export default abstract class TreeBalanced<K> extends Tree<K> {
    //Inserts and returns root
    static async *insertGenerator<K, T extends TreeBalanced<K>>(root: T | undefined, a: T): AsyncGenerator<T> {
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
                yield (await n.withLeft(a)) as T;
                break;
            } else {
                const right = await n.getRight();
                if (right === undefined) {
                    //Set Right Node
                    yield (await n.withRight(a)) as T;
                    break;
                }
            }
        }
    }

    static async insert<K, T extends TreeBalanced<K>>(root: T | undefined, a: T): Promise<T> {
        const gen = TreeBalanced.insertGenerator(root, a);
        let n: T;
        for await (n of gen) {
            n = n;
        }
        return n!;
    }

    async *insertGenerator(a: TreeBalanced<K>): AsyncGenerator<TreeBalanced<K>> {
        yield* TreeBalanced.insertGenerator(this, a);
    }

    async insert(a: TreeBalanced<K>): Promise<TreeBalanced<K>> {
        return TreeBalanced.insert(this, a);
    }
}
