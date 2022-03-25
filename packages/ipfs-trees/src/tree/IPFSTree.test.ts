import { create as createIPFS, IPFS } from 'ipfs';
import { existsSync, rmSync } from 'fs';
import { CID } from 'multiformats';
import { assert } from 'chai';
import { encode, code } from '@ipld/dag-json';
import { sha256 } from 'multiformats/hashes/sha2';
import { uniq, sortBy } from 'lodash';
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

    describe('Single Node', async () => {
        it('getKey()', async () => {
            const node0 = IPFSTree.createLeafWithKey(0, cid);
            const key = await node0.getKey();
            assert.equal(key.key, 0);
            assert.equal(key.valueCID, cid);
        });

        it('withKey()', async () => {
            const node0 = IPFSTree.createLeafWithKey(0, cid);
            const node1 = node0.withKey(IPFSTreeIndex.create(1, cid));

            const key = await node1.getKey();
            assert.equal(key.key, 1);
            assert.equal(key.valueCID, cid);

            assert.notEqual(node1, node0);
            assert.notEqual(key, await node0.getKey());
        });

        it('withLeft()', async () => {
            const node0 = IPFSTree.createLeafWithKey(0, cid);
            const node1 = node0.withKey(IPFSTreeIndex.create(1, cid));
            const node0v2 = node0.withLeft(node1);

            const key0 = await node0.getKey();
            const key0v2 = await node0v2.getKey();
            assert.equal(key0v2, key0, 'unchanged key not passed by reference');
            assert.notEqual(node0v2, node0, 'node0 mutated');
        });

        it('encode/decode', async () => {
            const node0 = IPFSTree.createLeafWithKey(0, cid);
            const node0Encode = await node0.encode();

            const node0Decode = await IPFSTree.decode(node0Encode);
            assert.notEqual(node0, node0Decode);

            const key0 = await node0.getKey();
            const key0Decode = await node0Decode.getKey();
            assert.notEqual(key0Decode, key0);
            assert.isTrue(key0Decode.equals(key0));
            assert.isTrue(key0Decode.valueCID.equals(key0.valueCID), 'key0Decode.valueCID != key0.valueCID');

            const node0CID = await node0.cid();
            const node0DecodeCID = await node0Decode.cid();
            assert.isTrue(node0DecodeCID.equals(node0CID));
        });

        describe('Network', async () => {
            let ipfs: IPFS;
            before(async () => {
                ['./ipfs'].map((p) => {
                    if (existsSync(p)) rmSync(p, { recursive: true });
                });

                //Write data to docs database
                ipfs = await createIPFS({
                    repo: './ipfs',
                });
                IPFSTree.setIPFS(ipfs);
            });

            after(async () => {
                await ipfs.stop();
                ['./ipfs'].map((p) => {
                    if (existsSync(p)) rmSync(p, { recursive: true });
                });
            });

            it('put', async () => {
                const node0 = IPFSTree.createLeafWithKey(0, cid);
                const node0CID = await node0.put();
                const node0CIDExpected = await node0.cid();
                assert.isTrue(node0CID.equals(node0CIDExpected), 'put() CID != computed CID');
            });

            it.skip('get', async () => {
                const node0 = IPFSTree.createLeafWithKey(0, cid);
                const node0CID = await node0.put();

                //Pushed in put() test
                const node0Load = await IPFSTree.createFromCID(node0CID);
                const key0 = await node0.getKey();
                const key0Decode = await node0Load.getKey();
                assert.notEqual(key0Decode, key0);
                assert.isTrue(key0Decode.equals(key0));
                assert.isTrue(key0Decode.valueCID.equals(key0.valueCID), 'key0Decode.valueCID != key0.valueCID');
            });
        });
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

        describe('Network', async () => {
            let ipfs: IPFS;
            before(async () => {
                ['./ipfs'].map((p) => {
                    if (existsSync(p)) rmSync(p, { recursive: true });
                });

                //Write data to docs database
                ipfs = await createIPFS({
                    repo: './ipfs',
                });
                IPFSTree.setIPFS(ipfs);
            });

            after(async () => {
                await ipfs.stop();
                ['./ipfs'].map((p) => {
                    if (existsSync(p)) rmSync(p, { recursive: true });
                });
            });

            it.skip('recurse load', async () => {
                /**
                 *       node0
                 *         \
                 *         node1
                 *           \
                 *           node2
                 *             \
                 *             node3
                 */
                const node3 = IPFSTree.createLeafWithKey(0, cid);
                const node2 = IPFSTree.createLeafWithKey(2, cid).withRight(node3);
                const node1 = IPFSTree.createLeafWithKey(1, cid).withRight(node2);
                const node0 = IPFSTree.createLeafWithKey(0, cid).withRight(node1);
                const searchResult1 = await (await node0.search(IPFSTree.createLeafWithKey(3, cid))).getKey();
                assert.equal(searchResult1.key, 3);

                await node0.put();
                await node1.put();
                await node2.put();
                await node3.put();

                const node0Load = await IPFSTree.createFromCID(await node0.cid());
                const searchResult2 = await (await node0Load.search(IPFSTree.createLeafWithKey(3, cid))).getKey();
                assert.equal(searchResult2.key, 3);
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

            it('random 1000', async () => {
                const values = [0];
                const node0 = IPFSTree.createLeafWithKey(0, cid);
                let tree1 = node0;
                for (let i = 1; i < 1000; i++) {
                    const v = Math.ceil(Math.random() * 100);
                    values.push(v);
                    tree1 = (await tree1.insert(IPFSTree.createLeafWithKey(v, cid))) as IPFSTree;
                }

                //Verify in-order traversal
                const valuesInOrder = (await tree1!.getKeysInOrder()).map((v) => v.key);
                const valuesExpected = sortBy(uniq(values));
                assert.deepEqual(valuesInOrder, valuesExpected);
            });
        });
    });
});
