import Comparable from '../interfaces/Comparable';
import Tree from './Tree';

export default abstract class TreeSearch<T extends Comparable<any>> extends Tree<T> {
    //Binary search
    //Yields searched nodes to enable cancelling search on timeout
    //Returns undefined if no result match
    static async *searchGenerator<T extends Comparable<any>>(
        root: TreeSearch<T> | undefined,
        a: T,
    ): AsyncGenerator<TreeSearch<T>> {
        if (!root) {
            return;
        }

        yield root;

        if ((await root.getKey()).equals(a)) return;

        //left < root < right
        if (a.lt(await root.getKey())) {
            const leftNode = (await root.getLeft()) as TreeSearch<T>;
            const searchRec = TreeSearch.searchGenerator(leftNode, a);
            yield* searchRec;
        } else {
            const rightNode = (await root.getRight()) as TreeSearch<T>;
            const searchRec = TreeSearch.searchGenerator(rightNode, a);
            yield* searchRec;
        }
    }

    async *searchGenerator(a: T): AsyncGenerator<TreeSearch<T>> {
        yield* TreeSearch.searchGenerator(this, a);
    }

    async search(a: T): Promise<TreeSearch<T> | undefined> {
        const gen = this.searchGenerator(a);
        let n: TreeSearch<T>;
        for await (n of gen) {
            n = n;
        }
        if ((await n!.getKey()).equals(a)) return n!;

        return undefined;
    }

    //Inserts and returns root
    static async *insertGenerator<T extends Comparable<any>>(
        root: TreeSearch<T> | undefined,
        a: TreeSearch<T>,
    ): AsyncGenerator<TreeSearch<T>> {
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
            const leftNode = (await root.getLeft()) as TreeSearch<T> | undefined;
            const gen = TreeSearch.insertGenerator(leftNode, a);
            let n: TreeSearch<T>;
            for await (n of gen) {
                n = n;
                yield n;
            }
            yield (await root.withLeft(n!)) as TreeSearch<T>;
        } else {
            const rightNode = (await root.getRight()) as TreeSearch<T> | undefined;
            const gen = TreeSearch.insertGenerator(rightNode, a);
            let n: TreeSearch<T>;
            for await (n of gen) {
                n = n;
                yield n;
            }
            yield (await root.withRight(n!)) as TreeSearch<T>;
        }
    }

    async *insertGenerator(a: TreeSearch<T>): AsyncGenerator<TreeSearch<T>> {
        yield* TreeSearch.insertGenerator(this, a);
    }

    async insert(a: TreeSearch<T>): Promise<TreeSearch<T>> {
        const gen = this.insertGenerator(a);
        let n: TreeSearch<T>;
        for await (n of gen) {
            n = n;
        }
        return n!;
    }
}
