import Comparable from '../../interfaces/Comparable';

export default class NumberTreeIndex implements Comparable<number> {
    v: number;
    private constructor(v: number) {
        this.v = v;
    }

    static create(key: number): NumberTreeIndex {
        return new NumberTreeIndex(key);
    }

    equals(a: NumberTreeIndex): boolean {
        return this.v == a.v;
    }
    lt(a: NumberTreeIndex): boolean {
        return this.v < a.v;
    }
    gt(a: NumberTreeIndex): boolean {
        return this.v > a.v;
    }
}
