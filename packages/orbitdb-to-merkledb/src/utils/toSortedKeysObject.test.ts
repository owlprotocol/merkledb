import { assert } from 'chai';
import { toSortedKeysObject } from './toSortedKeysObject.js';

describe('toSortedKeysObject.test.ts', () => {
    it('sort', async () => {
        const item1 = { a: true, z: true, b: true, x: true };

        const item2 = toSortedKeysObject(item1);
        const item3 = { a: true, b: true, x: true, z: true };

        assert.notDeepEqual(Object.keys(item1), Object.keys(item3));
        assert.deepEqual(Object.keys(item2), Object.keys(item3));
    });
});
