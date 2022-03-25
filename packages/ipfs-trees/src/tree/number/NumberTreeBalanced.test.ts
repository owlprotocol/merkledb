import { assert } from 'chai';
import NumberTree from './NumberTreeBalanced';

describe('NumberTreeBalanced.test.ts', () => {
    describe('insert', () => {
        it('null', async () => {
            /**
             *       node0
             */
            const tree = await NumberTree.insert(undefined, NumberTree.createLeafWithKey(0));

            //Verify level-order traversal
            const valuesInOrder = (await tree.getKeysLevelOrder()).map((v) => v.v);
            const valuesExpected = [0];
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('root', async () => {
            /**
             *       node0
             *       /
             *    node1
             */
            let tree = await NumberTree.insert(undefined, NumberTree.createLeafWithKey(0));
            tree = await tree.insert(NumberTree.createLeafWithKey(1));

            //Verify level-order traversal
            const valuesInOrder = (await tree.getKeysLevelOrder()).map((v) => v.v);
            const valuesExpected = [0, 1];
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('0-3-1-2', async () => {
            /**
             *       node0
             *      /   \
             *  node3   node1
             *            \
             *            node2
             *
             */
            const node2 = NumberTree.createLeafWithKey(2);
            const node1 = NumberTree.createLeafWithKey(1).withRight(node2);
            const node0 = NumberTree.createLeafWithKey(0).withRight(node1);

            const tree = await node0.insert(NumberTree.createLeafWithKey(3));
            //Verify level-order traversal
            const valuesInOrder = (await tree.getKeysLevelOrder()).map((v) => v.v);
            const valuesExpected = [0, 3, 1, 2];
            assert.deepEqual(valuesInOrder, valuesExpected);
        });
    });
});
