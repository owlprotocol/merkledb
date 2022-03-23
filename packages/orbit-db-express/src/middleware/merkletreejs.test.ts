import { create as createIPFS, IPFS } from 'ipfs';
import { existsSync, rmSync } from 'fs';
import { MerkleTree } from 'merkletreejs';
import cbor from 'cbor';
import { keccak256 } from 'web3-utils';
import toSortedKeysObject from '../utils/toSortedKeysObject';
import { assert } from 'chai';

async function iterToBuffer(x: AsyncIterable<Uint8Array>) {
    const buffers = [];
    for await (const b of x) {
        buffers.push(b);
    }
    return Buffer.concat(buffers);
}

describe('merktreejs.test.ts', () => {
    let ipfs: IPFS;

    beforeEach(async () => {
        ipfs = await createIPFS();
    });

    it('merkletreejs', async () => {
        const rows = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }];
        const rowsCBOR = rows.map((r) => cbor.encode(toSortedKeysObject(r)).toString('hex'));
        const tree = new MerkleTree(rowsCBOR, keccak256, {
            hashLeaves: true,
            sortPairs: true,
        });

        //Publish on-chain
        //const merkleRoot1 = '0x' + tree.getRoot().toString('hex');
        const result = await ipfs.add(JSON.stringify(rowsCBOR));
        const merkleTreeIPFS = result.cid.toString();

        const result2Iter = await ipfs.cat(merkleTreeIPFS);
        const rowsCBOR2 = JSON.parse((await iterToBuffer(result2Iter)).toString('utf-8'));

        /*
        console.debug({
            merkleRoot: merkleRoot1,
            merkleTreeIPFS,
            rowsCBOR,
            rowsCBOR2,
        });
        */
        assert.deepEqual(rowsCBOR2, rowsCBOR, 'Non matching encoding!');
        const tree2 = new MerkleTree(rowsCBOR2, keccak256, {
            hashLeaves: true,
            sortPairs: true,
        });
        assert.equal(tree2.getRoot().toString('hex'), tree.getRoot().toString('hex'), 'non-matchig merkle roots');
    });

    afterEach(async () => {
        await ipfs.stop();

        ['./ipfs'].map((p) => {
            if (existsSync(p)) rmSync(p, { recursive: true });
        });
    });
});
