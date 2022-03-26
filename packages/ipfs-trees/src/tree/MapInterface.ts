export default interface MapInterface<K, V> {
    get(k: K): Promise<V>;
    set(k: K, v: V): Promise<MapInterface<K, V>>;
}
