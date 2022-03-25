import { CID } from 'multiformats';
import { assert } from 'chai';
import { code } from '@ipld/dag-json';
import { sha256 } from 'multiformats/hashes/sha2';
import crypto from 'crypto';
import IPFSMerkle from './IPFSMerkle';
import IPFSMerkleIndex from './IPFSMerkleIndex';
import { Digest } from 'multiformats/hashes/digest';

describe('IPFSMerkle.test.ts', () => {
    let data: Uint8Array;
    let hash: Digest<18, number>;
    let dataHashHex: string;
    let cid: CID;

    before(async () => {
        //Data
        const encoder = new TextEncoder();
        const value = 'hello';
        data = encoder.encode(value);

        hash = await sha256.digest(data);
        cid = CID.create(1, code, hash);

        const hashExpected = crypto.createHash('sha256').update(data);
        dataHashHex = hashExpected.digest().toString('hex');
    });

    describe('Single Node', async () => {
        it('getKey()', async () => {
            const node0 = IPFSMerkle.createLeafWithKey(hash, undefined, undefined);
            const key = await node0.getKey();

            //Compare multihash objects
            const keyHashStr = key.hash.digest.toString();
            assert.equal(keyHashStr, hash.digest.toString());

            //Verify against NodeJS crypto module
            const keyHashHex = Buffer.from(key.hash.digest.buffer).toString('hex');
            assert.equal(keyHashHex, dataHashHex, 'hash != hashExpected');
        });

        it('withLeft()', async () => {
            /**
             * Transform tree by extending leaf
             *
             *    node0                root
             *              ==>       /    \
             *                      node1  node0
             *
             *
             */
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
