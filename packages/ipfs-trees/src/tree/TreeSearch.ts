import Comparable from '../interfaces/Comparable';
import Tree from './Tree';

export default abstract class TreeSearch<K extends Comparable<any>> extends Tree<K> {
    //Binary search
    //Yields searched nodes to enable cancelling search on timeout
    //Returns undefined if no result match
    static async *searchGenerator<K extends Comparable<any>, T extends TreeSearch<K>>(
        root: T | undefined,
        a: K,
    ): AsyncGenerator<T> {
        if (!root) {
            return;
        }

        yield root;

        if ((await root.getKey()).equals(a)) return;

        //left < root < right
        if (a.lt(await root.getKey())) {
            const leftNode = await root.getLeft();
            const searchRec = TreeSearch.searchGenerator(leftNode as T, a);
            yield* searchRec;
        } else {
            const rightNode = await root.getRight();
            const searchRec = TreeSearch.searchGenerator(rightNode as T, a);
            yield* searchRec;
        }
    }

    async *searchGenerator(a: K): AsyncGenerator<TreeSearch<K>> {
        yield* TreeSearch.searchGenerator(this, a);
    }

    async search(a: K): Promise<TreeSearch<K> | undefined> {
        const gen = this.searchGenerator(a);
        let n: TreeSearch<K>;
        for await (n of gen) {
            n = n;
        }
        if ((await n!.getKey()).equals(a)) return n!;

        return undefined;
    }

    //Inserts and returns root
    static async *insertGenerator<K extends Comparable<any>, T extends TreeSearch<K>>(
        root: T | undefined,
        a: T,
    ): AsyncGenerator<T> {
        if (!root) {
            yield a;
            return;
        }

        //Duplicate
        if ((await a.getKey()).equals(await root.getKey())) {
            yield root;
            return;
        }

        //left < root < right
        if ((await a.getKey()).lt(await root.getKey())) {
            const leftNode = await root.getLeft();
            const gen = TreeSearch.insertGenerator(leftNode as T, a);
            let n: T;
            for await (n of gen) {
                n = n;
                yield n;
            }
            yield (await root.withLeft(n!)) as T;
        } else {
            const rightNode = await root.getRight();
            const gen = TreeSearch.insertGenerator(rightNode as T, a);
            let n: T;
            for await (n of gen) {
                n = n;
                yield n;
            }
            yield (await root.withRight(n!)) as T;
        }
    }

    async *insertGenerator(a: TreeSearch<K>): AsyncGenerator<TreeSearch<K>> {
        yield* TreeSearch.insertGenerator(this, a);
    }

    async insert(a: TreeSearch<K>): Promise<TreeSearch<K>> {
        const gen = this.insertGenerator(a);
        let n: TreeSearch<K>;
        for await (n of gen) {
            n = n;
        }
        return n!;
    }
}
