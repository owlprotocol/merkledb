import * as IPFS from 'ipfs';
import { existsSync, rmSync } from 'fs';
import { assert } from 'chai';
import { CID } from 'multiformats';
import BinaryTreeNode from './BinaryTreeNode';
import asyncGeneratorToArray from '../utils/asyncGeneratorToArray';

describe('BinaryTreeNode.test.ts', () => {
    let ipfs: any;

    const testKeys: Uint8Array[] = [];
    const testKeysCIDList: CID[] = [];

    /**
     *       node0
     *      /   \
     *   node1  node2
     *     /
     *  node3
     *
     */
    let tree1Local: BinaryTreeNode;
    let tree1Network: BinaryTreeNode;

    let node0: BinaryTreeNode;
    let node1: BinaryTreeNode;
    let node0Network: BinaryTreeNode;
    let node1Network: BinaryTreeNode;

    let node3: BinaryTreeNode;
    let node2: BinaryTreeNode;

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

    beforeEach(async () => {
        //Leaves
        node3 = BinaryTreeNode.create(testKeysCIDList[3], undefined, undefined);
        node2 = BinaryTreeNode.create(testKeysCIDList[2], undefined, undefined);

        //Nodes
        node1 = await BinaryTreeNode.createWithLeaves(testKeysCIDList[1], node3, undefined);
        node0 = await BinaryTreeNode.createWithLeaves(testKeysCIDList[0], node1, node2);

        //Nodes with CID refs
        node1Network = BinaryTreeNode.create(testKeysCIDList[1], await node3.put(ipfs), undefined);
        node0Network = BinaryTreeNode.create(testKeysCIDList[0], await node1Network.put(ipfs), await node2.put(ipfs));

        tree1Local = node0;
        tree1Network = node0Network;
    });

    describe('BinaryTreeNode', () => {
        it('preorderTraversal:local', async () => {
            const gen = tree1Local.preorderTraversal(ipfs);
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
            const gen = tree1Network.preorderTraversal(ipfs);
            const values = await asyncGeneratorToArray(gen);
            //Expected traversal
            const expectedValues = [node0Network, node1Network, node3, node2];

            values.forEach(async (v, i) => {
                //Reference equality
                assert.notEqual(v, expectedValues[i], `values[${i}] == expected[${i}]`);
                //Value equality
                assert.isTrue(v.equals(expectedValues[i]), `$values[${i}] ${v} != ${expectedValues[i]}`);
            });
        });

        it('depthFirstTraversal:local', async () => {
            const gen = tree1Local.depthFirstTraversal(ipfs);
            const values = await asyncGeneratorToArray(gen);
            //Expected traversal
            const expectedValues = [node0, node1, node2, node3];

            values.forEach(async (v, i) => {
                //Reference equality
                assert.equal(v, expectedValues[i], `values[${i}] != expected[${i}]`);
                //Value equality
                assert.isTrue(v.equals(expectedValues[i]), `$values[${i}] ${v} != ${expectedValues[i]}`);
            });
        });

        it('toString:local', async () => {
            for await (const n of tree1Local.depthFirstTraversal(ipfs)) {
                await n.getKeyContent(ipfs);
            }
            console.log(tree1Local.toString());
        });

        it('toString:network', () => {
            console.log(tree1Network.toString());
        });
    });

    after(async () => {
        await ipfs.stop();

        ['./ipfs'].map((p) => {
            if (existsSync(p)) rmSync(p, { recursive: true });
        });
    });
});
