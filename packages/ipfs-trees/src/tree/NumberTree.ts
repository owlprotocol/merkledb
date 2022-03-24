import ComparableNumber from '../interfaces/ComparableNumber';
import TreeSearch from './TreeSearch';

export default class ComparableNumberTree extends TreeSearch<ComparableNumber> {
    private readonly key: ComparableNumber;
    private readonly left: TreeSearch<ComparableNumber> | undefined;
    private readonly right: TreeSearch<ComparableNumber> | undefined;
    private readonly parent: TreeSearch<ComparableNumber> | undefined;

    protected constructor(
        key: ComparableNumber,
        left: TreeSearch<ComparableNumber> | undefined,
        right: TreeSearch<ComparableNumber> | undefined,
    ) {
        super();
        this.key = key;
        this.left = left;
        this.right = right;
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
    async getParent() {
        return this.parent;
    }

    //Factory
    //Pass key by reference
    static create(
        key: ComparableNumber,
        left: TreeSearch<ComparableNumber> | undefined,
        right: TreeSearch<ComparableNumber> | undefined,
    ): ComparableNumberTree {
        return new ComparableNumberTree(key, left, right);
    }

    //Instantiate key
    static createWithValue(
        key: number,
        left: TreeSearch<ComparableNumber> | undefined,
        right: TreeSearch<ComparableNumber> | undefined,
    ) {
        return this.create(new ComparableNumber(key), left, right);
    }

    static createLeaf(key: ComparableNumber) {
        return this.create(key, undefined, undefined);
    }

    static createLeafWithValue(key: number) {
        return this.createWithValue(key, undefined, undefined);
    }

    withKey(key: ComparableNumber) {
        if (key.equals(this.key)) return this;
        return ComparableNumberTree.create(key, this.left, this.right);
    }

    withLeft(left: TreeSearch<ComparableNumber>) {
        if (left === this.left) return this;
        const n = ComparableNumberTree.create(this.key, left, this.right);
        return n;
    }

    withRight(right: TreeSearch<ComparableNumber>) {
        if (right === this.right) return this;
        const n = ComparableNumberTree.create(this.key, this.left, right);
        return n;
    }

    setParent(parent: TreeSearch<ComparableNumber>) {
        //@ts-expect-error
        this.parent = parent;
    }
}
