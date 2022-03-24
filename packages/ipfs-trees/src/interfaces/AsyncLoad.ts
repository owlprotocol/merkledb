export default interface AsyncLoad<T> {
    get(): Promise<T>;
}
