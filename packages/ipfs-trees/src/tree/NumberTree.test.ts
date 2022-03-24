import { assert } from 'chai';
import NumberTree from './NumberTree';
import ComparableNumber from '../interfaces/ComparableNumber';
import asyncGeneratorToArray from '../utils/asyncGeneratorToArray';

describe('BinarySearchTree.test.ts', () => {
    /**
     *       node3
     *      /   \
     *   node2  node4
     *     /
     *  node1
     *
     */
    let tree: NumberTree;
    let node1: NumberTree;
    let node2: NumberTree;
    let node3: NumberTree;
    let node4: NumberTree;

    beforeEach(async () => {
        //Leaves
        node1 = NumberTree.createLeafWithValue(1);
        node4 = NumberTree.createLeafWithValue(4);

        //Nodes
        node2 = await NumberTree.createWithValue(2, node1, undefined);
        node3 = await NumberTree.createWithValue(3, node2, node4);
        tree = node3;
    });

    describe('search', () => {
        it('root', async () => {
            const searchResult = await tree.search(NumberTree.createLeafWithValue(3));
            const searchResultContent = await searchResult!.getKey();

            assert.isTrue(searchResultContent.equals(new ComparableNumber(3)));
            assert.equal(searchResult, node3);
        });

        it('leaf', async () => {
            const searchResult = await tree.search(NumberTree.createLeafWithValue(1));
            const searchResultContent = await searchResult!.getKey();

            assert.isTrue(searchResultContent.equals(new ComparableNumber(1)));
            assert.equal(searchResult, node1);
        });

        it('not found!', async () => {
            const searchResult = await tree.search(NumberTree.createLeafWithValue(0));
            const searchResultContent = await searchResult!.getKey();
            assert.isFalse(searchResultContent.equals(new ComparableNumber(0)));
            //Leaf node is 1
            assert.isTrue(searchResultContent.equals(new ComparableNumber(1)));
            assert.equal(searchResult, node1);
        });
    });

    describe('insert', () => {
        it('null', async () => {
            const node0 = NumberTree.createLeafWithValue(0);
            const tree0 = undefined;
            let tree1: NumberTree;
            for await (const n of NumberTree.insertGenerator(tree0, node0)) {
                tree1 = n as NumberTree;
            }
            assert.notEqual(tree1!, tree0);
            assert.equal(tree1!, node0);
            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeyContentInOrder()).map((v) => v.v);
            const valuesExpected = [0];
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('root', async () => {
            const node0 = NumberTree.createLeafWithValue(0);
            const node1 = NumberTree.createLeafWithValue(1);
            const tree0 = node0;
            let tree1: NumberTree;
            for await (const n of NumberTree.insertGenerator(tree0, node1)) {
                tree1 = n as NumberTree;
            }
            assert.notEqual(tree1!, tree0);
            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeyContentInOrder()).map((v) => v.v);
            const valuesExpected = [0, 1];
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('0-1-2-insert(3)', async () => {
            /**
             *       node0
             *         \
             *         node1
             *           \
             *           node2
             *             \
             *           insert(node3)
             */
            const node2 = NumberTree.createLeafWithValue(2);
            const node1 = NumberTree.createLeafWithValue(1).withRight(node2);
            const node0 = NumberTree.createLeafWithValue(0).withRight(node1);

            const node3 = NumberTree.createLeafWithValue(3);
            const tree0 = node0;
            let tree1: NumberTree;
            for await (const n of NumberTree.insertGenerator(tree0, node3)) {
                tree1 = n as NumberTree;
            }
            assert.notEqual(tree1!, tree0);
            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeyContentInOrder()).map((v) => v.v);
            const valuesExpected = [0, 1, 2, 3];
            assert.deepEqual(valuesInOrder, valuesExpected);
            //Verify non-mutation
            const tree0InOrder = tree0.inOrderTraversal();
            const tree1InOrder = tree1!.inOrderTraversal();
            while (true) {
                const n0 = (await tree0InOrder.next()).value;
                const n1 = (await tree1InOrder.next()).value;
                assert.notEqual(n0, n1, 'Internal nodes equal reference');
                if (n0 === undefined) {
                    assert.equal(n1, node3, 'Leaf node reference');
                    break;
                }
            }
        });

        it('0-1-insert(2)-3', async () => {
            /**
             *       node0
             *         \
             *         node1
             *           \
             *           node3
             *            /
             *     insert(node2)
             */
            const node3 = NumberTree.createLeafWithValue(3);
            const node1 = NumberTree.createLeafWithValue(1).withRight(node3);
            const node0 = NumberTree.createLeafWithValue(0).withRight(node1);

            const node2 = NumberTree.createLeafWithValue(2);
            const tree0 = node0;
            let tree1: NumberTree;
            for await (const n of NumberTree.insertGenerator(tree0, node2)) {
                tree1 = n as NumberTree;
            }
            assert.notEqual(tree1!, tree0);
            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeyContentInOrder()).map((v) => v.v);
            const valuesExpected = [0, 1, 2, 3];
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('insert(0)-1-2-3-4', async () => {
            const node0 = NumberTree.createLeafWithValue(0);
            let tree1 = tree;
            for await (const n of NumberTree.insertGenerator(tree, node0)) {
                tree1 = n as NumberTree;
            }

            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeyContentInOrder()).map((v) => v.v);
            const valuesExpected = [0, 1, 2, 3, 4];
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('1-2-3-4-insert(5)', async () => {
            const node5 = NumberTree.createLeafWithValue(5);
            let tree1 = tree;
            for await (const n of NumberTree.insertGenerator(tree, node5)) {
                tree1 = n as NumberTree;
            }

            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeyContentInOrder()).map((v) => v.v);
            const valuesExpected = [1, 2, 3, 4, 5];
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('1-2-3-4 duplicate', async () => {
            const node4 = NumberTree.createLeafWithValue(4);
            let tree1 = tree;
            for await (const n of NumberTree.insertGenerator(tree1, node4)) {
                tree1 = n as NumberTree;
            }

            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeyContentInOrder()).map((v) => v.v);
            const valuesExpected = [1, 2, 3, 4];
            assert.deepEqual(valuesInOrder, valuesExpected);
            //Reference un-changed
            assert.equal(tree1, tree, 'reference changed despite no mutation');
        });

        it('sorted 0-100', async () => {
            const values = [0];
            const node0 = NumberTree.createLeafWithValue(0);
            let tree1 = node0;
            for (let i = 1; i < 100; i++) {
                values.push(i);
                tree1 = (await tree1.insert(NumberTree.createLeafWithValue(i))) as NumberTree;
            }

            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeyContentInOrder()).map((v) => v.v);
            const valuesExpected = values;
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('[10,5,15,0,7,20,12]', async () => {
            /**
             *       10
             *      /   \
             *     5    15
             *    / \   / \
             *   0   7 12 20
             *
             */
            const values = [10, 5, 15, 0, 7, 20, 12];
            const node0 = NumberTree.createLeafWithValue(10);
            let tree1 = node0;
            for (let i = 1; i < values.length; i++) {
                const v = values[i];
                tree1 = (await tree1.insert(NumberTree.createLeafWithValue(v))) as NumberTree;
            }

            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeyContentInOrder()).map((v) => v.v);
            const valuesExpected = values.sort((a, b) => a - b);
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('random 100', async () => {
            const values = [0];
            const node0 = NumberTree.createLeafWithValue(0);
            let tree1 = node0;
            for (let i = 1; i < 10; i++) {
                const v = Math.ceil(Math.random() * 100);
                values.push(v);
                tree1 = (await tree1.insert(NumberTree.createLeafWithValue(v))) as NumberTree;
            }

            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeyContentInOrder()).map((v) => v.v);
            const valuesExpected = values.sort((a, b) => a - b);
            assert.deepEqual(valuesInOrder, valuesExpected);
        });
    });
});
