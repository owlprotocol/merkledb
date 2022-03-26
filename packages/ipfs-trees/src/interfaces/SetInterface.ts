export default interface SetInterface<K> {
    exists(k: K): Promise<boolean>;
    add(k: K): Promise<SetInterface<K>>;
    remove(k: K): Promise<SetInterface<K>>;
}
