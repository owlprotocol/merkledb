import Comparable from './Comparable';

export default class ComparableNumber implements Comparable<number> {
    v: number;
    constructor(v: number) {
        this.v = v;
    }

    equals(a: ComparableNumber): boolean {
        return this.v == a.v;
    }
    lt(a: ComparableNumber): boolean {
        return this.v < a.v;
    }
    gt(a: ComparableNumber): boolean {
        return this.v > a.v;
    }
}
