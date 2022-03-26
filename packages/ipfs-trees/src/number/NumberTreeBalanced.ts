import NumberTreeIndex from './NumberTreeIndex';
import TreeBalanced from '../tree/TreeBalanced';

export default class NumberTreeBalanced extends TreeBalanced<NumberTreeIndex> {
    private readonly key: NumberTreeIndex;
    private readonly left: NumberTreeBalanced | undefined;
    private readonly right: NumberTreeBalanced | undefined;

    private constructor(
        key: NumberTreeIndex,
        left: NumberTreeBalanced | undefined,
        right: NumberTreeBalanced | undefined,
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
        left: NumberTreeBalanced | undefined,
        right: NumberTreeBalanced | undefined,
    ): NumberTreeBalanced {
        return new NumberTreeBalanced(key, left, right);
    }

    static createLeaf(key: NumberTreeIndex) {
        return this.create(key, undefined, undefined);
    }

    //Instantiate key
    static createWithKey(key: number, left: NumberTreeBalanced | undefined, right: NumberTreeBalanced | undefined) {
        return this.create(NumberTreeIndex.create(key), left, right);
    }

    static createLeafWithKey(key: number) {
        return this.createWithKey(key, undefined, undefined);
    }

    async withKey(key: NumberTreeIndex) {
        if (key.equals(this.key)) return this;
        return NumberTreeBalanced.create(key, this.left, this.right);
    }

    async withLeft(left: NumberTreeBalanced) {
        if (left === this.left) return this;
        const n = NumberTreeBalanced.create(this.key, left, this.right);
        return n;
    }

    async withRight(right: NumberTreeBalanced) {
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
