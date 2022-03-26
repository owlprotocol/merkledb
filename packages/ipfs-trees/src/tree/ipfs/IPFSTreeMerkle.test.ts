import { assert } from 'chai';
import { Digest } from 'multiformats/hashes/digest';
//@ts-expect-error
import { keccak256 } from '@multiformats/sha3'; //js-sha3
import keccak256Fn from 'keccak256'; //keccak256
import { zip } from 'lodash';
import { MerkleTree } from 'merkletreejs';

import asyncGeneratorToArray from '../../utils/asyncGeneratorToArray';
import IPFSTreeMerkle from './IPFSTreeMerkle';
import TreeMerkle from '../TreeMerkle';

const encoder = new TextEncoder();
function stringToDigest(s: string): Promise<Digest<18, number>> {
    return keccak256.digest(encoder.encode(s));
}

function digestToString(a: Digest<18, number>) {
    return Buffer.from(a.digest.buffer).toString('hex');
}
function digestEqual(a: Digest<18, number>, b: Digest<18, number>, m?: string) {
    return assert.equal(digestToString(a), digestToString(b), m);
}

describe('IPFSTreeMerkle.test.ts', () => {
    //Compare digests by reference?
    const digests: { [k: string]: Digest<18, number> } = {};
    before(async () => {
        const keys = ['0', '1', '2', '3', '4'];
        await Promise.all(
            keys.map(async (k) => {
                digests[k] = await stringToDigest(k);
            }),
        );
        //['0-1', '0-2', '1-3', '1-4'];
        digests['0-1'] = await IPFSTreeMerkle.joinDigests(digests[0], digests[1]);
        digests['0-2'] = await IPFSTreeMerkle.joinDigests(digests[0], digests[2]);
        digests['1-3'] = await IPFSTreeMerkle.joinDigests(digests[1], digests[3]);
        digests['1-4'] = await IPFSTreeMerkle.joinDigests(digests[1], digests[4]);

        //['0-2-1', '1-3-0-2', , '1-4-3-0-2', '1-4-3'];
        digests['0-2-1'] = await IPFSTreeMerkle.joinDigests(digests['0-2'], digests[1]);
        digests['1-3-0-2'] = await IPFSTreeMerkle.joinDigests(digests['1-3'], digests['0-2']);
        digests['1-4-3'] = await IPFSTreeMerkle.joinDigests(digests['1-4'], digests['3']);
        digests['1-4-3-0-2'] = await IPFSTreeMerkle.joinDigests(digests['1-4-3'], digests['0-2']);
    });
    describe('insert', () => {
        it('root', async () => {
            /**
             *       0
             */
            const tree = await IPFSTreeMerkle.createLeaf(digests[0]);
            const levelOrder = await asyncGeneratorToArray(IPFSTreeMerkle.levelOrderTraversal(tree));
            const levelOrderHash = await Promise.all(
                levelOrder.map((n) => {
                    return n.getHash();
                }),
            );
            const expected = [digests[0]];
            assert.equal(levelOrderHash.length, expected.length);
            zip(levelOrderHash, expected).map(([v, e], i) => {
                digestEqual(v!, e!, `levelOrder hashes[${i}]`);
            });
        });

        it('1-depth', async () => {
            /**
             *        0-1
             *        / \
             *       0   1
             */
            let tree = await IPFSTreeMerkle.createLeaf(digests[0]);
            //@ts-expect-error
            tree = await tree.insert(await IPFSTreeMerkle.createLeaf(digests[1]));

            const levelOrder = await asyncGeneratorToArray(IPFSTreeMerkle.levelOrderTraversal(tree));
            const levelOrderHash = await Promise.all(
                levelOrder.map((n) => {
                    return n.getHash();
                }),
            );
            const expected = [digests['0-1'], digests[0], digests[1]];
            assert.equal(levelOrderHash.length, expected.length);
            zip(levelOrderHash, expected).map(([v, e], i) => {
                digestEqual(v!, e!, `levelOrder hashes[${i}]`);
            });
        });

        it('1-depth', async () => {
            /**
             *        0-2-1
             *        /   \
             *      0-2    1
             *      / \
             *     0   2
             */
            let tree = await IPFSTreeMerkle.createLeaf(digests[0]);
            //@ts-expect-error
            tree = await tree.insert(await IPFSTreeMerkle.createLeaf(digests[1]));
            const insertGen = tree.insertGenerator(await IPFSTreeMerkle.createLeaf(digests[2]));
            for await (const n of insertGen) {
                //@ts-expect-error
                tree = n;
            }

            const levelOrder = await asyncGeneratorToArray(IPFSTreeMerkle.levelOrderTraversal(tree));
            const levelOrderHash = await Promise.all(
                levelOrder.map((n) => {
                    return n.getHash();
                }),
            );
            assert.deepEqual(
                levelOrderHash,
                ['0-2-1', '0-2', '1', '0', '2'].map((k) => digests[k]!),
                'levelOrder hashes',
            );
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
            let tree = await IPFSTreeMerkle.createLeaf(digests['0']);
            //@ts-expect-error
            tree = await tree.insert(await IPFSTreeMerkle.createLeaf(digests['1']));
            //@ts-expect-error
            tree = await tree.insert(await IPFSTreeMerkle.createLeaf(digests['2']));
            const insertGen = tree.insertGenerator(await IPFSTreeMerkle.createLeaf(digests['3']));
            for await (const n of insertGen) {
                //@ts-expect-error
                tree = n;
            }

            const levelOrder = await asyncGeneratorToArray(IPFSTreeMerkle.levelOrderTraversal(tree));
            const levelOrderHash = await Promise.all(
                levelOrder.map((n) => {
                    return n.getHash();
                }),
            );
            assert.deepEqual(
                levelOrderHash,
                ['1-3-0-2', '1-3', '0-2', '1', '3', '0', '2'].map((k) => digests[k]!),
                'levelOrder hashes',
            );
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
            let tree = await IPFSTreeMerkle.createLeaf(digests['0']);
            //@ts-expect-error
            tree = await tree.insert(await IPFSTreeMerkle.createLeaf(digests['1']));
            //@ts-expect-error
            tree = await tree.insert(await IPFSTreeMerkle.createLeaf(digests['2']));
            //@ts-expect-error
            tree = await tree.insert(await IPFSTreeMerkle.createLeaf(digests['3']));
            const insertGen = tree.insertGenerator(await IPFSTreeMerkle.createLeaf(digests['4']));
            for await (const n of insertGen) {
                //@ts-expect-error
                tree = n;
            }

            const levelOrder = await asyncGeneratorToArray(IPFSTreeMerkle.levelOrderTraversal(tree));
            const levelOrderHash = await Promise.all(
                levelOrder.map((n) => {
                    return n.getHash();
                }),
            );
            assert.deepEqual(
                levelOrderHash,
                ['1-4-3-0-2', '1-4-3', '0-2', '1-4', '3', '0', '2', '1', '4'].map((k) => digests[k]!),
                'levelOrder hashes',
            );
        });
    });

    describe('proof', () => {
        it('root', async () => {
            /**
             *       0
             */
            const tree = await IPFSTreeMerkle.createLeaf(digests[0]);
            const proofNode = await asyncGeneratorToArray(tree.recurseSibling());
            const proof = await Promise.all(proofNode.map((n) => n.getHash()));
            assert.deepEqual(proof, [digests[0]]);
        });
        it('1-depth', async () => {
            /**
             *        0-1
             *        / \
             *       0   1
             */
            const leaf = await IPFSTreeMerkle.createLeaf(digests[1]);

            const tree = await IPFSTreeMerkle.createLeaf(digests[0]);
            await tree.insert(leaf);

            const proofs = await asyncGeneratorToArray(leaf.getProof());
            assert.deepEqual(proofs, [digests[0], digests['0-1']]);

            const verifyProof = await tree.verifyProof([...proofs]);
            assert.isTrue(verifyProof, 'verify proof!');
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
            let tree = await IPFSTreeMerkle.createLeaf(digests['0']);
            //@ts-expect-error
            tree = await tree.insert(await IPFSTreeMerkle.createLeaf(digests['1']));
            //@ts-expect-error
            tree = await tree.insert(await IPFSTreeMerkle.createLeaf(digests['2']));
            //@ts-expect-error
            tree = await tree.insert(await IPFSTreeMerkle.createLeaf(digests['3']));

            const leaf = await IPFSTreeMerkle.createLeaf(digests['4']);
            await tree.insert(leaf);

            const proofNode = await asyncGeneratorToArray(leaf.recurseSibling());
            const proof = await Promise.all(proofNode.map((n) => n.getHash()));
            assert.deepEqual(
                proof,
                ['1', '3', '0-2', '1-4-3-0-2'].map((k) => digests[k]!),
            );
        });
    });

    describe('merkletreejs', () => {
        it('merkletreejs: single', async () => {
            const hash = await stringToDigest('node0');

            const tree = new MerkleTree([Buffer.from(hash.digest.buffer)], keccak256Fn, {
                hashLeaves: false,
                sortPairs: true,
            });
            const treeRoot = tree.getRoot().toString('hex');
            assert.equal(digestToString(hash), treeRoot, 'IPFSMerkle !== merkletreejs');
        });

        it('merkletreejs: 1-depth', async () => {
            const hash0 = await stringToDigest('node0');
            const hash1 = await stringToDigest('node1');
            const hashRoot = await IPFSTreeMerkle.joinDigests(hash0, hash1);

            const tree = new MerkleTree(
                [Buffer.from(hash0.digest.buffer), Buffer.from(hash1.digest.buffer)],
                keccak256Fn,
                {
                    hashLeaves: false,
                    sortPairs: true,
                },
            );
            const rootHex = digestToString(hashRoot);
            const treeHex = tree.getRoot().toString('hex');
            assert.equal(rootHex, treeHex, 'IPFSMerkle !== merkletreejs');
        });

        it.skip('merkletreejs: 1-10', async () => {
            const valuesP: Promise<Digest<18, number>>[] = [];
            for (let i = 0; i < 3; i++) {
                //valuesP.push(stringToDigest(`${Math.ceil(Math.random() * 100)}`));
                valuesP.push(stringToDigest(`${i}`));
            }

            const values = await Promise.all(valuesP);
            let ipfsTree: TreeMerkle<Digest<18, number>> | undefined;
            for (const v of values) {
                if (!ipfsTree) ipfsTree = await IPFSTreeMerkle.createLeaf(v);
                else ipfsTree = await ipfsTree.insert(await IPFSTreeMerkle.createLeaf(v));
            }

            const valuesBuff = values.map((v) => {
                return Buffer.from(v.digest.buffer);
            });
            const merkjsTree = new MerkleTree(valuesBuff, keccak256Fn, {
                hashLeaves: false,
                sortPairs: true,
            });

            console.debug(merkjsTree.toString());

            const levelOrder = await asyncGeneratorToArray(IPFSTreeMerkle.levelOrderTraversal(ipfsTree!));
            const levelOrderHash = await Promise.all(
                levelOrder.map((n) => {
                    return n.getHash();
                }),
            );
            const levelOrderHashStr = levelOrderHash.map((x) => digestToString(x));
            console.debug(levelOrderHashStr);

            const rootHex = digestToString(await ipfsTree!.getHash());
            const treeHex = merkjsTree.getRoot().toString('hex');
            assert.equal(rootHex, treeHex, 'IPFSMerkle !== merkletreejs');
        });
    });
});
