import { CID } from 'multiformats';
import { assert } from 'chai';
import { encode, code } from '@ipld/dag-json';
import { sha256 } from 'multiformats/hashes/sha2';
import IPFSTree from './IPFSTree';
import IPFSTreeIndex from './IPFSTreeIndex';

describe('IPFSTree.test.ts', () => {
    let cid: CID;

    /**
     *       node3
     *      /   \
     *   node2  node4
     *     /
     *  node1
     *
     */
    let tree: IPFSTree;
    let node1: IPFSTree;
    let node2: IPFSTree;
    let node3: IPFSTree;
    let node4: IPFSTree;

    before(async () => {
        //Data
        const value = {
            message: 'hello',
        };
        //Encode
        const data = encode(value);
        const hash = await sha256.digest(data);
        cid = CID.create(1, code, hash);
    });

    beforeEach(async () => {
        //Leaves
        node1 = IPFSTree.createLeafWithKey(1, cid);
        node4 = IPFSTree.createLeafWithKey(4, cid);

        //Nodes
        node2 = await IPFSTree.createWithKey(2, cid, node1, undefined);
        node3 = await IPFSTree.createWithKey(3, cid, node2, node4);
        tree = node3;
    });

    describe('search', () => {
        it('root', async () => {
            const searchResult = await tree.search(IPFSTree.createLeafWithKey(3, cid));
            const searchResultContent = await searchResult!.getKey();

            assert.isTrue(searchResultContent.equals(IPFSTreeIndex.create(3, cid)));
            assert.equal(searchResult, node3);
        });

        it('leaf', async () => {
            const searchResult = await tree.search(IPFSTree.createLeafWithKey(1, cid));
            const searchResultContent = await searchResult!.getKey();

            assert.isTrue(searchResultContent.equals(IPFSTreeIndex.create(1, cid)));
            assert.equal(searchResult, node1);
        });

        it('not found!', async () => {
            const searchResult = await tree.search(IPFSTree.createLeafWithKey(0, cid));
            const searchResultContent = await searchResult!.getKey();
            assert.isFalse(searchResultContent.equals(IPFSTreeIndex.create(0, cid)));
            //Leaf node is 1
            assert.isTrue(searchResultContent.equals(IPFSTreeIndex.create(1, cid)));
            assert.equal(searchResult, node1);
        });
    });

    describe('insert', () => {
        it('null', async () => {
            const node0 = IPFSTree.createLeafWithKey(0, cid);
            const tree0 = undefined;
            let tree1: IPFSTree;
            for await (const n of IPFSTree.insertGenerator(tree0, node0)) {
                tree1 = n as IPFSTree;
            }
            assert.notEqual(tree1!, tree0);
            assert.equal(tree1!, node0);
            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeysInOrder()).map((v) => v.key);
            const valuesExpected = [0];
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('root', async () => {
            const node0 = IPFSTree.createLeafWithKey(0, cid);
            const node1 = IPFSTree.createLeafWithKey(1, cid);
            const tree0 = node0;
            let tree1: IPFSTree;
            for await (const n of IPFSTree.insertGenerator(tree0, node1)) {
                tree1 = n as IPFSTree;
            }
            assert.notEqual(tree1!, tree0);

            for await (const n of tree1!.inOrderTraversal()) {
                console.debug(n);
            }

            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeysInOrder()).map((v) => v.key);
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
            const node2 = IPFSTree.createLeafWithKey(2, cid);
            const node1 = IPFSTree.createLeafWithKey(1, cid).withRight(node2);
            const node0 = IPFSTree.createLeafWithKey(0, cid).withRight(node1);

            const node3 = IPFSTree.createLeafWithKey(3, cid);
            const tree0 = node0;
            let tree1: IPFSTree;
            for await (const n of IPFSTree.insertGenerator(tree0, node3)) {
                tree1 = n as IPFSTree;
            }
            assert.notEqual(tree1!, tree0);
            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeysInOrder()).map((v) => v.key);
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
            const node3 = IPFSTree.createLeafWithKey(3, cid);
            const node1 = IPFSTree.createLeafWithKey(1, cid).withRight(node3);
            const node0 = IPFSTree.createLeafWithKey(0, cid).withRight(node1);

            const node2 = IPFSTree.createLeafWithKey(2, cid);
            const tree0 = node0;
            let tree1: IPFSTree;
            for await (const n of IPFSTree.insertGenerator(tree0, node2)) {
                tree1 = n as IPFSTree;
            }
            assert.notEqual(tree1!, tree0);
            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeysInOrder()).map((v) => v.key);
            const valuesExpected = [0, 1, 2, 3];
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('insert(0)-1-2-3-4', async () => {
            const node0 = IPFSTree.createLeafWithKey(0, cid);
            let tree1 = tree;
            for await (const n of IPFSTree.insertGenerator(tree, node0)) {
                tree1 = n as IPFSTree;
            }

            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeysInOrder()).map((v) => v.key);
            const valuesExpected = [0, 1, 2, 3, 4];
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('1-2-3-4-insert(5)', async () => {
            const node5 = IPFSTree.createLeafWithKey(5, cid);
            let tree1 = tree;
            for await (const n of IPFSTree.insertGenerator(tree, node5)) {
                tree1 = n as IPFSTree;
            }

            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeysInOrder()).map((v) => v.key);
            const valuesExpected = [1, 2, 3, 4, 5];
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('1-2-3-4 duplicate', async () => {
            const node4 = IPFSTree.createLeafWithKey(4, cid);
            let tree1 = tree;
            for await (const n of IPFSTree.insertGenerator(tree1, node4)) {
                tree1 = n as IPFSTree;
            }

            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeysInOrder()).map((v) => v.key);
            const valuesExpected = [1, 2, 3, 4];
            assert.deepEqual(valuesInOrder, valuesExpected);
            //Reference un-changed
            assert.equal(tree1, tree, 'reference changed despite no mutation');
        });

        it('sorted 0-100', async () => {
            const values = [0];
            const node0 = IPFSTree.createLeafWithKey(0, cid);
            let tree1 = node0;
            for (let i = 1; i < 100; i++) {
                values.push(i);
                tree1 = (await tree1.insert(IPFSTree.createLeafWithKey(i, cid))) as IPFSTree;
            }

            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeysInOrder()).map((v) => v.key);
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
            const node0 = IPFSTree.createLeafWithKey(10, cid);
            let tree1 = node0;
            for (let i = 1; i < values.length; i++) {
                const v = values[i];
                tree1 = (await tree1.insert(IPFSTree.createLeafWithKey(v, cid))) as IPFSTree;
            }

            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeysInOrder()).map((v) => v.key);
            const valuesExpected = values.sort((a, b) => a - b);
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('random 100', async () => {
            const values = [0];
            const node0 = IPFSTree.createLeafWithKey(0, cid);
            let tree1 = node0;
            for (let i = 1; i < 100; i++) {
                const v = Math.ceil(Math.random() * 100);
                values.push(v);
                tree1 = (await tree1.insert(IPFSTree.createLeafWithKey(v, cid))) as IPFSTree;
            }

            //Verify in-order traversal
            const valuesInOrder = (await tree1!.getKeysInOrder()).map((v) => v.key);
            const valuesExpected = values.sort((a, b) => a - b);
            assert.deepEqual(valuesInOrder, valuesExpected);
        });
    });
});
