import { MerkleTree } from 'merkletreejs';
import cbor from 'cbor';
import { keccak256 } from 'web3-utils';
import { readFileSync } from 'fs';
import toSortedKeysObject from '../utils/toSortedKeysObject.js';

const data = JSON.parse(readFileSync('./data.json', 'utf-8'));
const people = data.people;

export async function writeTestDataToDB(db: any) {
    const promises = people.map((p: any) => {
        return db.put(p, { pin: true });
    });
    await Promise.all(promises);
    console.debug(`Test data written to ${db.address}`);
}

export function testDataToMerkleTree() {
    const rows = people;
    const rowsCBOR = rows.map((r: any) => cbor.encode(toSortedKeysObject(r)));
    //console.debug('Creating test Merkle Tree');
    //console.debug({ rows, rowsCBOR: rowsCBOR.map((r) => r.toString('hex')) });

    const tree = new MerkleTree(rowsCBOR, keccak256, {
        hashLeaves: true,
        sortPairs: true,
    });
    return tree;
}
