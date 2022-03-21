import { fromPairs, sortBy, toPairs } from 'lodash-es';

export function toSortedKeysObject(item: any) {
    return fromPairs(sortBy(toPairs(item), 0));
}
export default toSortedKeysObject;
