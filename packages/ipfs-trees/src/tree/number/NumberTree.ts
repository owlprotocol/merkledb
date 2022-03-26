import NumberTreeIndex from './NumberTreeIndex';
import TreeSearch from '../TreeSearch';

export default class NumberTree extends TreeSearch<NumberTreeIndex> {
    private readonly key: NumberTreeIndex;
    private readonly left: TreeSearch<NumberTreeIndex> | undefined;
    private readonly right: TreeSearch<NumberTreeIndex> | undefined;

    private constructor(
        key: NumberTreeIndex,
        left: TreeSearch<NumberTreeIndex> | undefined,
        right: TreeSearch<NumberTreeIndex> | undefined,
    ) {
        super();
        this.key = key;
        this.left = left;
        this.right = right;
    }

    //Factory
    //Pass key by reference
    static create(
        key: NumberTreeIndex,
        left: TreeSearch<NumberTreeIndex> | undefined,
        right: TreeSearch<NumberTreeIndex> | undefined,
    ): NumberTree {
        return new NumberTree(key, left, right);
    }

    static createLeaf(key: NumberTreeIndex) {
        return this.create(key, undefined, undefined);
    }

    //Instantiate key
    static createWithKey(
        key: number,
        left: TreeSearch<NumberTreeIndex> | undefined,
        right: TreeSearch<NumberTreeIndex> | undefined,
    ) {
        return this.create(NumberTreeIndex.create(key), left, right);
    }

    static createLeafWithKey(key: number) {
        return this.createWithKey(key, undefined, undefined);
    }

    async withKey(key: NumberTreeIndex) {
        if (key.equals(this.key)) return this;
        return NumberTree.create(key, this.left, this.right);
    }

    async withLeft(left: TreeSearch<NumberTreeIndex>) {
        if (left === this.left) return this;
        const n = NumberTree.create(this.key, left, this.right);
        return n;
    }

    async withRight(right: TreeSearch<NumberTreeIndex>) {
        if (right === this.right) return this;
        const n = NumberTree.create(this.key, this.left, right);
        return n;
    }

    //Getters
    async getKey() {
        return this.key;
    }
    async getLeft() {
        return this.left;
    }
    async getRight() {
        return this.right;
    }
}
