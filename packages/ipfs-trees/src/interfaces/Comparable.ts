export default interface Comparable<T> {
    equals(a: Comparable<T>): boolean;
    lt(a: Comparable<T>): boolean;
    gt(a: Comparable<T>): boolean;
}
