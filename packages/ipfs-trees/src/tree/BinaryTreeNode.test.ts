import * as IPFS from 'ipfs';
import { existsSync, rmSync } from 'fs';
import BinaryTreeNodeBase from './BinaryTreeNodeBase';
import { assert } from 'chai';
import { CID } from 'multiformats';
import BinaryTreeNode from './BinaryTreeNode';
import asyncGeneratorToArray from '../utils/asyncGeneratorToArray';

describe('TNode.test.ts', () => {
    let ipfs: any;

    const testKeys: Uint8Array[] = [];
    const testKeysCIDList: CID[] = [];

    before(async () => {
        ['./ipfs'].map((p) => {
            if (existsSync(p)) rmSync(p, { recursive: true });
        });

        //Write data to docs database
        ipfs = await IPFS.create({
            repo: './ipfs1',
            EXPERIMENTAL: {
                pubsub: true,
            },
        });

        for (let i = 1; i < 5; i++) {
            const key = new TextEncoder().encode(`${i}`);
            const cid = await ipfs.block.put(key);
            testKeys.push(key);
            testKeysCIDList.push(cid);
        }
    });

    describe('TNodeBase', () => {
        it('encode/decode', async () => {
            const tNode1 = BinaryTreeNodeBase.create(testKeysCIDList[0], undefined, undefined);
            const tNodeEncode = tNode1.encode();

            const tNode2 = BinaryTreeNodeBase.decode(tNodeEncode);
            assert.isTrue(tNode1.key.equals(tNode2.key), 'tNode1.key != tNode2.key');
            assert.isUndefined(tNode2.left);
            assert.isUndefined(tNode2.right);
            assert.isTrue(tNode1.equals(tNode2), 'tNode1 != tNode2');

            const cid1 = await tNode1.cid();
            const cid2 = await tNode2.cid();
            assert.isTrue(cid1.equals(cid2), 'tNode1.cid != tNode2.cid');
        });

        it('put', async () => {
            const tNode1 = BinaryTreeNodeBase.create(testKeysCIDList[0], undefined, undefined);
            const tNode1CID = await tNode1.put(ipfs);
            const tNode1CIDExpected = await tNode1.cid();
            assert.isTrue(tNode1CID.equals(tNode1CIDExpected), 'put() CID != computed CID');
        });

        it('get', async () => {
            const tNode1 = BinaryTreeNodeBase.create(testKeysCIDList[0], undefined, undefined);
            const tNode1CID = await tNode1.put(ipfs);

            const tNode2 = await BinaryTreeNodeBase.get(ipfs, tNode1CID);
            assert.isTrue(tNode1.equals(tNode2), 'tNode1 != tNode2');

            const tNode2CID = await tNode1.put(ipfs);
            assert.isTrue(tNode1CID.equals(tNode2CID), 'tNode1.cid != tNode2.cid');
        });
    });

    describe('TNode', () => {
        it('preorderTraversal:local', async () => {
            /**
             *       node0
             *      /   \
             *   node1  node2
             *     /
             *  node3
             *
             */
            //Leaves
            const node3 = BinaryTreeNode.create(testKeysCIDList[3], undefined, undefined);
            const node2 = BinaryTreeNode.create(testKeysCIDList[2], undefined, undefined);

            //Nodes
            const node1 = await BinaryTreeNode.createWithLeaves(testKeysCIDList[1], node3, undefined);
            const node0 = await BinaryTreeNode.createWithLeaves(testKeysCIDList[2], node1, node2);

            const gen = node0.preorderTraversal(ipfs);
            const values = await asyncGeneratorToArray(gen);
            //Expected traversal
            const expectedValues = [node0, node1, node3, node2];

            values.forEach(async (v, i) => {
                //Reference equality
                assert.equal(v, expectedValues[i], `values[${i}] != expected[${i}]`);
                //Value equality
                assert.isTrue(v.equals(expectedValues[i]), `$values[${i}] ${v} != ${expectedValues[i]}`);
            });
        });

        it('preorderTraversal:network', async () => {
            /**
             *       node0
             *      /   \
             *   node1  node2
             *     /
             *  node3
             *
             */
            //Leaves
            const node3 = BinaryTreeNode.create(testKeysCIDList[3], undefined, undefined);
            const node2 = BinaryTreeNode.create(testKeysCIDList[2], undefined, undefined);

            //Nodes
            const node1 = BinaryTreeNode.create(testKeysCIDList[1], await node3.put(ipfs), undefined);
            const node0 = BinaryTreeNode.create(testKeysCIDList[2], await node1.put(ipfs), await node2.put(ipfs));

            const gen = node0.preorderTraversal(ipfs);
            const values = await asyncGeneratorToArray(gen);
            //Expected traversal
            const expectedValues = [node0, node1, node3, node2];

            values.forEach(async (v, i) => {
                //Reference equality
                assert.notEqual(v, expectedValues[i], `values[${i}] == expected[${i}]`);
                //Value equality
                assert.isTrue(v.equals(expectedValues[i]), `$values[${i}] ${v} != ${expectedValues[i]}`);
            });
        });
    });

    after(async () => {
        await ipfs.stop();

        ['./ipfs'].map((p) => {
            if (existsSync(p)) rmSync(p, { recursive: true });
        });
    });
});
