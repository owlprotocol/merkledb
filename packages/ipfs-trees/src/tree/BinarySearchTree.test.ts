import * as IPFS from 'ipfs';
import { existsSync, rmSync } from 'fs';
import { assert } from 'chai';
import { CID } from 'multiformats';
import BinarySearchTree from './BinarySearchTree';
import BinaryTreeNode from './BinaryTreeNode';
import asyncGeneratorToArray from '../utils/asyncGeneratorToArray';

describe('BinarySearchTree.test.ts', () => {
    let ipfs: any;

    const testKeys: Uint8Array[] = [];
    const testKeysCIDList: CID[] = [];

    /**
     *       node3
     *      /   \
     *   node2  node4
     *     /
     *  node1
     *
     */
    let tree1Local: BinaryTreeNode;
    //let tree1Network: BinaryTreeNode;

    let node1: BinaryTreeNode;
    let node2: BinaryTreeNode;
    let node3: BinaryTreeNode;
    let node4: BinaryTreeNode;

    //let node1Network: BinaryTreeNode;
    //let node2Network: BinaryTreeNode;

    before(async () => {
        ['./ipfs'].map((p) => {
            if (existsSync(p)) rmSync(p, { recursive: true });
        });

        //Write data to docs database
        ipfs = await IPFS.create({
            repo: './ipfs',
            EXPERIMENTAL: {
                pubsub: true,
            },
        });

        for (let i = 0; i < 6; i++) {
            const key = new TextEncoder().encode(`${i}`);
            const cid = await ipfs.block.put(key);
            testKeys.push(key);
            testKeysCIDList.push(cid);
        }
    });

    beforeEach(async () => {
        //Leaves
        node1 = BinaryTreeNode.create(testKeysCIDList[1], undefined, undefined);
        node4 = BinaryTreeNode.create(testKeysCIDList[4], undefined, undefined);

        //Nodes
        node2 = await BinaryTreeNode.createWithLeaves(testKeysCIDList[2], node1, undefined);
        node3 = await BinaryTreeNode.createWithLeaves(testKeysCIDList[3], node2, node4);
        tree1Local = node3;

        //Nodes with CID refs
        //node1Network = BinaryTreeNode.create(testKeysCIDList[1], await node0.put(ipfs), undefined);
        //node2Network = BinaryTreeNode.create(testKeysCIDList[2], await node1Network.put(ipfs), await node3.put(ipfs));

        //tree1Network = node2Network;
    });

    describe('search', () => {
        it('root', async () => {
            const searchContent = new Uint8Array([3]); //root key value
            const searchResult = await BinarySearchTree.search(tree1Local, ipfs, searchContent);
            const searchResultContent = await searchResult!.getKeyContent(ipfs);
            assert.equal(searchContent.toString(), searchResultContent.toString());
        });

        it('leaf', async () => {
            const searchContent = new Uint8Array([1]); //leaf key value
            const searchResult = await BinarySearchTree.search(tree1Local, ipfs, searchContent);
            const searchResultContent = await searchResult!.getKeyContent(ipfs);
            assert.equal(searchContent.toString(), searchResultContent.toString());
        });

        it('not found!', async () => {
            const searchContent = new Uint8Array([5]); //non-present value
            const searchResult = await BinarySearchTree.search(tree1Local, ipfs, searchContent);
            const searchResultContent = await searchResult!.getKeyContent(ipfs);
            assert.notEqual(searchContent.toString(), searchResultContent.toString());
        });
    });

    describe('insert', () => {
        it('min', async () => {
            const node0 = BinaryTreeNode.create(testKeysCIDList[0], undefined, undefined);
            const tree2Local = await BinarySearchTree.insert(tree1Local, ipfs, node0);

            //Verify in-order traversal
            const gen = tree2Local.inorderTraversal(ipfs);
            const nodesInOrder = await asyncGeneratorToArray(gen);
            const valuesInOrder = await Promise.all(
                nodesInOrder.map(async (n) => {
                    return (await n.getKeyContent(ipfs)).toString();
                }),
            );
            const nodesExpected = [node0, node1, node2, node3, node4];
            const valuesExpected = await Promise.all(
                nodesExpected.map(async (n) => {
                    return (await n.getKeyContent(ipfs)).toString();
                }),
            );
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('max', async () => {
            const node5 = BinaryTreeNode.create(testKeysCIDList[5], undefined, undefined);
            const tree2Local = await BinarySearchTree.insert(tree1Local, ipfs, node5);

            //Verify in-order traversal
            const gen = tree2Local.inorderTraversal(ipfs);
            const nodesInOrder = await asyncGeneratorToArray(gen);
            const valuesInOrder = await Promise.all(
                nodesInOrder.map(async (n) => {
                    return (await n.getKeyContent(ipfs)).toString();
                }),
            );
            const nodesExpected = [node1, node2, node3, node4, node5];
            const valuesExpected = await Promise.all(
                nodesExpected.map(async (n) => {
                    return (await n.getKeyContent(ipfs)).toString();
                }),
            );
            assert.deepEqual(valuesInOrder, valuesExpected);
        });

        it('random 100', async () => {
            const values: Uint8Array[] = [];
            for (let i = 0; i < 100; i++) {
                const rand = Math.floor(Math.random() * 100);
                const data = new TextEncoder().encode(`${rand}`);
                values.push(data);
            }
            const valuesCIDPromises = values.map((v) => {
                return ipfs.block.put(v);
            });
            const valuesCID = (await Promise.all(valuesCIDPromises)) as unknown as CID[];

            let root = BinaryTreeNode.createRoot(valuesCID[0]);
            valuesCID.forEach(async (v, i) => {
                if (i == 0) return;
                root = await BinarySearchTree.insert(tree1Local, ipfs, BinaryTreeNode.create(v, undefined, undefined));
            });

            console.debug(root.toString());
            /*
            //Verify in-order traversal
            const gen = root.inorderTraversal(ipfs);
            const nodesInOrder = await asyncGeneratorToArray(gen);
            const valuesInOrder = await Promise.all(
                nodesInOrder.map(async (n) => {
                    return (await n.getKeyContent(ipfs)).toString();
                }),
            );
            const valuesExpected = values.map((n) => {
                return n.toString();
            });
            assert.deepEqual(valuesInOrder, valuesExpected);
            */
        });
    });

    after(async () => {
        await ipfs.stop();

        ['./ipfs'].map((p) => {
            if (existsSync(p)) rmSync(p, { recursive: true });
        });
    });
});
