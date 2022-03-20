import { MerkleTree } from 'merkletreejs';
import cbor from 'cbor';
import { keccak256, toHex } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import toSortedKeysObject from './utils/toSortedKeysObject.js';
import { SenderParams } from './orbitDBtoMerkleDB.js';

/**
 *
 * @param db OrbitDB KV Database
 */
export async function snapshotDatabase(db: any, merkleDB: Contract, senderOptions: SenderParams) {
    //TODO: Handle op (currently assumes only PUT)
    const rows = Object.values(db.all).map((v: any) => v.payload.value);
    console.debug(`Snapshot database at ${db.address}`);
    const rowsCBOR = rows.map((r) => cbor.encode(toSortedKeysObject(r)));
    console.debug({ rows, rowsCBOR: rowsCBOR.map((r) => r.toString('hex')) });

    const tree = new MerkleTree(rowsCBOR, keccak256, {
        hashLeaves: true,
        sortPairs: true,
    });

    //Publish on-chain
    const from = senderOptions.from;
    const nonce = senderOptions.nonce;
    const merkleRoot = '0x' + tree.getRoot().toString('hex');
    const merkleTreeIPFS = '0x';
    const databaseIPFS = '0x';
    const tx = merkleDB.methods.updateMerkleDB(merkleRoot, merkleTreeIPFS, databaseIPFS);
    tx.send({
        nonce,
        from,
        gas: 100000,
    }).on('transactionHash', (h: string) => console.debug(`Snapshot ${h}`));

    return tree;
}
