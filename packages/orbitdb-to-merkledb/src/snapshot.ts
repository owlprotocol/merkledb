import { MerkleTree } from 'merkletreejs';
import cbor from 'cbor';
import { keccak256 } from 'web3-utils';
import toSortedKeysObject from './utils/toSortedKeysObject.js';

/**
 *
 * @param db OrbitDB KV Database
 */
export async function snapshotDatabase(db: any) {
    //TODO: Handle op (currently assumes only PUT)
    const rows = Object.values(db.all).map((v: any) => v.payload.value);
    console.debug(`Snapshot database at ${db.address}`);
    const rowsCBOR = rows.map((r) => cbor.encode(toSortedKeysObject(r)));
    console.debug({ rows, rowsCBOR: rowsCBOR.map((r) => r.toString('hex')) });

    const tree = new MerkleTree(rowsCBOR, keccak256, {
        hashLeaves: true,
        sortPairs: true,
    });
    return tree;
}
