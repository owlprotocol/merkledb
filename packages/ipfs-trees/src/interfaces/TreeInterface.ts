export default interface TreeInterface<T> {
    getKey(): Promise<T>;
    getLeft(): Promise<TreeInterface<T> | undefined>;
    getRight(): Promise<TreeInterface<T> | undefined>;

    withKey(key: T): Promise<TreeInterface<T>>;
    withLeft(left: TreeInterface<T>): Promise<TreeInterface<T>>;
    withRight(right: TreeInterface<T>): Promise<TreeInterface<T>>;
}
