import NumberTreeIndex from './NumberTreeIndex';
import TreeBalanced from '../TreeBalanced';

export default class NumberTreeBalanced extends TreeBalanced<NumberTreeIndex> {
    private readonly key: NumberTreeIndex;
    private readonly left: TreeBalanced<NumberTreeIndex> | undefined;
    private readonly right: TreeBalanced<NumberTreeIndex> | undefined;

    private constructor(
        key: NumberTreeIndex,
        left: TreeBalanced<NumberTreeIndex> | undefined,
        right: TreeBalanced<NumberTreeIndex> | undefined,
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
        left: TreeBalanced<NumberTreeIndex> | undefined,
        right: TreeBalanced<NumberTreeIndex> | undefined,
    ): NumberTreeBalanced {
        return new NumberTreeBalanced(key, left, right);
    }

    static createLeaf(key: NumberTreeIndex) {
        return this.create(key, undefined, undefined);
    }

    //Instantiate key
    static createWithKey(
        key: number,
        left: TreeBalanced<NumberTreeIndex> | undefined,
        right: TreeBalanced<NumberTreeIndex> | undefined,
    ) {
        return this.create(NumberTreeIndex.create(key), left, right);
    }

    static createLeafWithKey(key: number) {
        return this.createWithKey(key, undefined, undefined);
    }

    async withKey(key: NumberTreeIndex) {
        if (key.equals(this.key)) return this;
        return NumberTreeBalanced.create(key, this.left, this.right);
    }

    async withLeft(left: TreeBalanced<NumberTreeIndex>) {
        if (left === this.left) return this;
        const n = NumberTreeBalanced.create(this.key, left, this.right);
        return n;
    }

    async withRight(right: TreeBalanced<NumberTreeIndex>) {
        if (right === this.right) return this;
        const n = NumberTreeBalanced.create(this.key, this.left, right);
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
