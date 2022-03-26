//@ts-nocheck
import TreeMerkle from '../tree/TreeMerkle';

export default class TestTreeMerkle extends TreeMerkle<string> {
    private readonly _hash: string;
    private readonly _parent: TestTreeMerkle | undefined;
    private readonly _left: TestTreeMerkle | undefined;
    private readonly _right: TestTreeMerkle | undefined;

    private constructor(
        _hash: string,
        _parent: TestTreeMerkle | undefined,
        _left: TestTreeMerkle | undefined,
        _right: TestTreeMerkle | undefined,
    ) {
        super();
        this._hash = _hash;
        this._parent = _parent;
        this._left = _left;
        this._right = _right;
    }

    static async createLeaf(hash: string): Promise<TestTreeMerkle> {
        return new TestTreeMerkle(hash, undefined, undefined, undefined);
    }

    async getParent(): Promise<TreeMerkle<string> | undefined> {
        return this._parent;
    }
    async getLeft(): Promise<TreeMerkle<string> | undefined> {
        return this._left;
    }
    async getRight(): Promise<TreeMerkle<string> | undefined> {
        return this._right;
    }
    async getHash(): Promise<string> {
        return this._hash;
    }
    async setParent(a: TreeMerkle<string>): Promise<TreeMerkle<string>> {
        //@ts-expect-error
        this._parent = a;
        return this;
    }
    //No mutation
    async join(a: TestTreeMerkle): Promise<TreeMerkle<string>> {
        const hashThis = await this.getHash();
        const hashA = await a.getHash();

        const hashParent = `${hashThis}-${hashA}`;
        const parent = new TestTreeMerkle(hashParent, undefined, this, a);

        await this.setParent(parent);
        await a.setParent(parent);
        return parent;
    }
}
