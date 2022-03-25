import { assert } from 'chai';
//@ts-expect-error
import { keccak256 as keccak256Digest } from '@multiformats/sha3'; //js-sha3
import keccak256 from 'keccak256'; //keccak256
import { MerkleTree } from 'merkletreejs';

import IPFSMerkleIndex from './IPFSMerkleIndex';
import { Digest } from 'multiformats/hashes/digest';

function digestToString(a: Digest<18, number>) {
    return Buffer.from(a.digest.buffer).toString('hex');
}
function digestEqual(a: Digest<18, number>, b: Digest<18, number>, m?: string) {
    return assert.equal(digestToString(a), digestToString(b), m);
}

describe('IPFSMerkleIndex.test.ts', () => {
    const encoder = new TextEncoder();

    it('keccak256', async () => {
        const hash = await keccak256Digest.digest(encoder.encode('hello'));

        const expectedHex = keccak256('hello').toString('hex');
        const hashHex = Buffer.from(hash.digest.buffer).toString('hex');
        assert.equal(hashHex, expectedHex, 'js-sha3 != keccak256');
    });

    it('root', async () => {
        const hash = await keccak256Digest.digest(encoder.encode('node0'));

        const node0 = await IPFSMerkleIndex.createLeaf(hash);
        digestEqual(node0.hash, hash, 'node0.hash != hash');
    });

    it('1-depth', async () => {
        /**
         * Transform tree by extending leaf
         *
         *    node0                root
         *              ==>       /    \
         *                      node1  node0
         *
         */
        const hash0 = await keccak256Digest.digest(encoder.encode('node0'));
        const hash1 = await keccak256Digest.digest(encoder.encode('node1'));

        const node0 = await IPFSMerkleIndex.createLeaf(hash0);
        const node1 = await IPFSMerkleIndex.createLeaf(hash1);
        const root = await IPFSMerkleIndex.createFromLeaves(node0, node1);

        assert.equal(node0._parent, root, 'node0.parent');
        assert.equal(node1._parent, root, 'node1.parent');
    });

    describe('merkletreejs', () => {
        it('merkletreejs: single', async () => {
            const hash = await keccak256Digest.digest(encoder.encode('node0'));

            const tree = new MerkleTree([Buffer.from(hash.digest.buffer)], keccak256, {
                hashLeaves: false,
                sortPairs: true,
            });
            const treeRoot = tree.getRoot().toString('hex');
            assert.equal(digestToString(hash), treeRoot, 'IPFSMerkle !== merkletreejs');
        });

        it('merkletreejs: 1-depth', async () => {
            const hash0 = await keccak256Digest.digest(encoder.encode('node0'));
            const hash1 = await keccak256Digest.digest(encoder.encode('node1'));

            const node0 = await IPFSMerkleIndex.createLeaf(hash0);
            const node1 = await IPFSMerkleIndex.createLeaf(hash1);
            const root = await IPFSMerkleIndex.createFromLeaves(node0, node1);

            const tree = new MerkleTree(
                [Buffer.from(node0.hash.digest.buffer), Buffer.from(node1.hash.digest.buffer)],
                keccak256,
                {
                    hashLeaves: false,
                    sortPairs: true,
                },
            );
            const rootHash = digestToString(root.hash);
            const treeRoot = tree.getRoot().toString('hex');
            assert.equal(rootHash, treeRoot, 'IPFSMerkle !== merkletreejs');
        });

        it('merkletreejs: fuzzing', async () => {
            const values: number[] = [];
            for (let i = 0; i++; i < 100) {
                values.push(Math.ceil(Math.random() * 100));
            }
        });

        it('n', async () => {
            /**
             * Transform tree by extending leaf
             *
             *    node0                root
             *              ==>       /    \
             *                      node1  node0
             *
             */
            /*
                const node0 = IPFSMerkle.createLeafWithKey(hash, undefined, undefined);
                const node1 = IPFSMerkle.createLeafWithKey(hash, undefined, undefined);

                const root = await node0.withLeft(node1);
                const left = await root.getLeft();
                assert.isDefined(left, 'root.left');
                const right = await root.getRight();
                assert.isDefined(right, 'root.right');

                const leftKey = await left!.getKey();
                const leftKeyHashHex = Buffer.from(leftKey.hash.digest.buffer).toString('hex');
                assert.equal(leftKeyHashHex, dataHashHex, 'hash != hashExpected');

                //Check refs
                assert.notEqual(root, node0);
                assert.equal(left, node1, 'left != node1');
                assert.equal(right, node0, 'right != node0');

                //Verify Merkle
                //Concat bytes
                const rightKey = await right!.getKey();
                const leftBytes = leftKey.hash!.bytes;
                const rightBytes = rightKey.hash!.bytes;
                const concat = new Uint8Array(leftBytes.length + rightBytes.length);
                concat.set(leftBytes);
                concat.set(rightBytes, leftBytes.length);
                //Concat hash
                const rootHashExpected = await sha256.digest(concat);
                const rootHashHexExpected = Buffer.from(rootHashExpected.digest.buffer).toString('hex');

                const rootKey = await root.getKey();
                const rootKeyHashHex = Buffer.from(rootKey.hash.digest.buffer).toString('hex');
                assert.equal(rootKeyHashHex, rootHashHexExpected, 'root.hash');
                */
        });

        /*
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
            */
    });
});
