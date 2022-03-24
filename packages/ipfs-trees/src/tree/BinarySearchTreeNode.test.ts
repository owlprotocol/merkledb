import * as IPFS from 'ipfs';
import { existsSync, rmSync } from 'fs';
import BinarySearchTreeNode from './BinarySearchTreeNode';
import { assert } from 'chai';
import { CID } from 'multiformats';
import BinaryTreeNode from './BinaryTreeNode';
import asyncGeneratorToArray from '../utils/asyncGeneratorToArray';

describe('BinarySearchTree.test.ts', () => {
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

    describe('BinarySearchTreeNode', () => {
        it('search:local', async () => {
            /**
             * Binary Search Tree
             *       node2
             *      /   \
             *   node1  node3
             *     /
             *  node0
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
    });

    after(async () => {
        await ipfs.stop();

        ['./ipfs'].map((p) => {
            if (existsSync(p)) rmSync(p, { recursive: true });
        });
    });
});
