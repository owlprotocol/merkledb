export default interface TreeInterface<T> {
    getKey(): Promise<T>;
    getLeft(): Promise<TreeInterface<T> | undefined>;
    getRight(): Promise<TreeInterface<T> | undefined>;

    withKey(key: T): TreeInterface<T>;
    withLeft(left: TreeInterface<T>): TreeInterface<T>;
    withRight(right: TreeInterface<T>): TreeInterface<T>;
}
