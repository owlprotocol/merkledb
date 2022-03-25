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
        node1 = await IPFSTree.createLeafWithKey(1, cid);
        node4 = await IPFSTree.createLeafWithKey(4, cid);

        //Nodes
        node2 = await IPFSTree.createWithKey(2, cid, node1, undefined);
        node3 = await IPFSTree.createWithKey(3, cid, node2, node4);
        tree = node3;
    });

    describe('Single Node', async () => {
        it('getKey()', async () => {
            const node0 = IPFSTree.createLeafWithKey(0, cid);
            const key = await node0.getKey();
            assert.equal(key.key, '0');
            assert.equal(key.valueCID, cid);
        });

        it('withKey()', async () => {
            const node0 = await IPFSTree.createLeafWithKey(0, cid);
            const node1 = await node0.withKey(IPFSTreeIndex.create(1, cid));

            const key = await node1.getKey();
            assert.equal(key.key, '1');
            assert.equal(key.valueCID, cid);

            assert.notEqual(node1, node0);
            assert.notEqual(key, await node0.getKey());
        });

        it('withLeft()', async () => {
            const node0 = IPFSTree.createLeafWithKey(0, cid);
            const node1 = await node0.withKey(IPFSTreeIndex.create(1, cid));
            const node0v2 = await node0.withLeft(node1);

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
            const node0CID = await node0.cid();
            const node0DecodeCID = await node0Decode.cid();
            assert.isTrue(node0DecodeCID.equals(node0CID), 'node0Decoded.cid != node0.cid');

            const node0KeyCID = await node0.getKeyCID();
            const node0DecodeKeyCID = await node0Decode.getKeyCID();
            assert.isTrue(node0DecodeKeyCID.equals(node0KeyCID), 'node0Decoded.key.cid != node0.key.cid');
        });

        describe('Network', async () => {
            let ipfs: IPFS;
            beforeEach(async () => {
                ['./ipfs'].map((p) => {
                    if (existsSync(p)) rmSync(p, { recursive: true });
                });

                //Write data to docs database
                ipfs = await createIPFS({
                    repo: './ipfs',
                });
                IPFSTree.setIPFS(ipfs);
                IPFSTree._totalNetworkGet = 0;
                IPFSTree._totalNetworkPut = 0;
                IPFSTreeIndex._totalNetworkGet = 0;
                IPFSTreeIndex._totalNetworkPut = 0;
            });

            afterEach(async () => {
                await ipfs.stop();
                ['./ipfs'].map((p) => {
                    if (existsSync(p)) rmSync(p, { recursive: true });
                });
            });

            it('put/get()', async () => {
                const node0 = IPFSTree.createLeafWithKey(0, cid);
                const node0CID = await node0.put();
                assert.equal(IPFSTree._totalNetworkPut, 1, 'IPFSTree._totalNetworkPut');

                const node0FromCID = await IPFSTree.createFromCID(node0CID);
                assert.equal(IPFSTree._totalNetworkGet, 1, 'IPFSTree._totalNetworkGet');

                const node0Key = await node0.getKey();
                await node0Key.put();
                assert.equal(IPFSTreeIndex._totalNetworkPut, 1, 'IPFSTreeIndex._totalNetworkPut');

                const node0FromCIDKey = await node0FromCID.getKey();
                assert.equal(IPFSTreeIndex._totalNetworkGet, 1, 'IPFSTreeIndex._totalNetworkGet');
                assert.isTrue(node0FromCIDKey.equals(node0Key), 'node0FromCIDKey.key != node0.key');
            });
        });
    });

    describe('search', () => {
        it('root', async () => {
            const searchResult = await tree.search(IPFSTreeIndex.create(3, cid));
            const searchResultContent = await searchResult!.getKey();

            assert.isTrue(searchResultContent.equals(IPFSTreeIndex.create(3, cid)));
            assert.equal(searchResult, node3);
        });

        it('leaf', async () => {
            const searchResult = await tree.search(IPFSTreeIndex.create(1, cid));
            const searchResultContent = await searchResult!.getKey();

            assert.isTrue(searchResultContent.equals(IPFSTreeIndex.create(1, cid)));
            assert.equal(searchResult, node1);
        });

        it('not found!', async () => {
            const searchResult = await tree.search(IPFSTreeIndex.create(0, cid));
            assert.isUndefined(searchResult);
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
                IPFSTree._totalNetworkGet = 0;
                IPFSTree._totalNetworkPut = 0;
                IPFSTreeIndex._totalNetworkGet = 0;
                IPFSTreeIndex._totalNetworkPut = 0;
            });

            after(async () => {
                await ipfs.stop();
                ['./ipfs'].map((p) => {
                    if (existsSync(p)) rmSync(p, { recursive: true });
                });
            });

            it('recurse load', async () => {
                /**
                 *       node0
                 *         \
                 *         node1
                 *           \
                 *           node2
                 *             \
                 *             node3
                 */
                const node3 = IPFSTree.createLeafWithKey(3, cid);
                const node2 = await IPFSTree.createLeafWithKey(2, cid).withRight(node3);
                const node1 = await IPFSTree.createLeafWithKey(1, cid).withRight(node2);
                const node0 = await IPFSTree.createLeafWithKey(0, cid).withRight(node1);
                const searchResult1 = await node0.search(IPFSTreeIndex.create(3, cid));
                const searchResult1Key = await searchResult1?.getKey();
                assert.equal(searchResult1Key?.key, '3', 'searchResult1.key');

                const { node: node0P, key: key0P } = node0.putWithKey();
                const { node: node1P, key: key1P } = node1.putWithKey();
                const { node: node2P, key: key2P } = node2.putWithKey();
                const { node: node3P, key: key3P } = node3.putWithKey();
                await Promise.all([node0P, key0P, node1P, key1P, node2P, key2P, node3P, key3P]);

                assert.equal(IPFSTree._totalNetworkPut, 4, 'IPFSTreeIndex._totalNetworkPut');
                assert.equal(IPFSTreeIndex._totalNetworkPut, 4, 'IPFSTreeIndex._totalNetworkPut');

                const node0Load = await IPFSTree.createFromCID(await node0.cid());
                const searchResult2 = await node0Load.search(IPFSTreeIndex.create(3, cid));
                const searchResult2Key = await searchResult2?.getKey();
                assert.equal(searchResult2Key?.key, '3', 'searchResult1.key');

                assert.equal(IPFSTree._totalNetworkGet, 4, 'IPFSTreeIndex._totalNetworkGet');
                assert.equal(IPFSTreeIndex._totalNetworkGet, 4, 'IPFSTreeIndex._totalNetworkGet');
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
                const valuesExpected = ['0'];
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
                const valuesExpected = ['0', '1'];
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
                const node2 = await IPFSTree.createLeafWithKey(2, cid);
                const node1 = await IPFSTree.createLeafWithKey(1, cid).withRight(node2);
                const node0 = await IPFSTree.createLeafWithKey(0, cid).withRight(node1);

                const node3 = IPFSTree.createLeafWithKey(3, cid);
                const tree0 = node0;
                let tree1: IPFSTree;
                for await (const n of IPFSTree.insertGenerator(tree0, node3)) {
                    tree1 = n as IPFSTree;
                }
                assert.notEqual(tree1!, tree0);
                //Verify in-order traversal
                const valuesInOrder = (await tree1!.getKeysInOrder()).map((v) => v.key);
                const valuesExpected = [0, 1, 2, 3].map((x) => `${x}`);
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
                const node3 = await IPFSTree.createLeafWithKey(3, cid);
                const node1 = await IPFSTree.createLeafWithKey(1, cid).withRight(node3);
                const node0 = await IPFSTree.createLeafWithKey(0, cid).withRight(node1);

                const node2 = IPFSTree.createLeafWithKey(2, cid);
                const tree0 = node0;
                let tree1: IPFSTree;
                for await (const n of IPFSTree.insertGenerator(tree0, node2)) {
                    tree1 = n as IPFSTree;
                }
                assert.notEqual(tree1!, tree0);
                //Verify in-order traversal
                const valuesInOrder = (await tree1!.getKeysInOrder()).map((v) => v.key);
                const valuesExpected = [0, 1, 2, 3].map((x) => `${x}`);
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
                const valuesExpected = [0, 1, 2, 3, 4].map((x) => `${x}`);
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
                const valuesExpected = [1, 2, 3, 4, 5].map((x) => `${x}`);
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
                const valuesExpected = [1, 2, 3, 4].map((x) => `${x}`);
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
                const valuesExpected = values.map((x) => `${x}`);
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
                const valuesExpected = values.sort((a, b) => a - b).map((x) => `${x}`);
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
                const valuesExpected = sortBy(uniq(values)).map((x) => `${x}`);
                assert.deepEqual(valuesInOrder, valuesExpected);
            });
        });
    });
});
