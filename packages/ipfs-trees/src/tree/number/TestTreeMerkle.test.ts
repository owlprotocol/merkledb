import { assert } from 'chai';
import asyncGeneratorToArray from '../../utils/asyncGeneratorToArray';
import TestTreeMerkle from './TestTreeMerkle';

describe('TestTreeMerkle.test.ts', () => {
    describe('insert', () => {
        it('root', async () => {
            /**
             *       0
             */
            const tree = await TestTreeMerkle.createLeaf('0');
            const levelOrder = await asyncGeneratorToArray(TestTreeMerkle.levelOrderTraversal(tree));
            const levelOrderHash = await Promise.all(
                levelOrder.map((n) => {
                    return n.getHash();
                }),
            );
            assert.deepEqual(levelOrderHash, ['0'], 'levelOrder hashes');
        });

        it('1-depth', async () => {
            /**
             *        0-1
             *        / \
             *       0   1
             */
            let tree = await TestTreeMerkle.createLeaf('0');
            //@ts-expect-error
            tree = await tree.insert(await TestTreeMerkle.createLeaf('1'));

            const levelOrder = await asyncGeneratorToArray(TestTreeMerkle.levelOrderTraversal(tree));
            const levelOrderHash = await Promise.all(
                levelOrder.map((n) => {
                    return n.getHash();
                }),
            );
            assert.deepEqual(levelOrderHash, ['0-1', '0', '1'], 'levelOrder hashes');
        });

        it('1-depth', async () => {
            /**
             *        0-2-1
             *        /   \
             *      0-2    1
             *      / \
             *     0   2
             */
            let tree = await TestTreeMerkle.createLeaf('0');
            //@ts-expect-error
            tree = await tree.insert(await TestTreeMerkle.createLeaf('1'));
            const insertGen = tree.insertGenerator(await TestTreeMerkle.createLeaf('2'));
            for await (const n of insertGen) {
                //@ts-expect-error
                tree = n;
            }

            const levelOrder = await asyncGeneratorToArray(TestTreeMerkle.levelOrderTraversal(tree));
            const levelOrderHash = await Promise.all(
                levelOrder.map((n) => {
                    return n.getHash();
                }),
            );
            assert.deepEqual(levelOrderHash, ['0-2-1', '0-2', '1', '0', '2'], 'levelOrder hashes');
        });

        it('1-depth', async () => {
            /**
             *  Warning: Tree Rotated
             *        1-3-0-2
             *        /   \
             *      1-3    0-2
             *      / \    / \
             *     1   3  0   2
             */
            let tree = await TestTreeMerkle.createLeaf('0');
            //@ts-expect-error
            tree = await tree.insert(await TestTreeMerkle.createLeaf('1'));
            //@ts-expect-error
            tree = await tree.insert(await TestTreeMerkle.createLeaf('2'));
            const insertGen = tree.insertGenerator(await TestTreeMerkle.createLeaf('3'));
            for await (const n of insertGen) {
                //@ts-expect-error
                tree = n;
            }

            const levelOrder = await asyncGeneratorToArray(TestTreeMerkle.levelOrderTraversal(tree));
            const levelOrderHash = await Promise.all(
                levelOrder.map((n) => {
                    return n.getHash();
                }),
            );
            assert.deepEqual(levelOrderHash, ['1-3-0-2', '1-3', '0-2', '1', '3', '0', '2'], 'levelOrder hashes');
        });

        it('2-depth', async () => {
            /**
             *        1-4-3-0-2
             *        /   \
             *     1-4-3    0-2
             *      / \    / \
             *    1-4   3  0   2
             *    / \
             *   1   4
             */
            let tree = await TestTreeMerkle.createLeaf('0');
            //@ts-expect-error
            tree = await tree.insert(await TestTreeMerkle.createLeaf('1'));
            //@ts-expect-error
            tree = await tree.insert(await TestTreeMerkle.createLeaf('2'));
            //@ts-expect-error
            tree = await tree.insert(await TestTreeMerkle.createLeaf('3'));
            const insertGen = tree.insertGenerator(await TestTreeMerkle.createLeaf('4'));
            for await (const n of insertGen) {
                //@ts-expect-error
                tree = n;
            }

            const levelOrder = await asyncGeneratorToArray(TestTreeMerkle.levelOrderTraversal(tree));
            const levelOrderHash = await Promise.all(
                levelOrder.map((n) => {
                    return n.getHash();
                }),
            );
            assert.deepEqual(
                levelOrderHash,
                ['1-4-3-0-2', '1-4-3', '0-2', '1-4', '3', '0', '2', '1', '4'],
                'levelOrder hashes',
            );
        });
    });
});
