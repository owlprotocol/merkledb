import { MerkleTree } from 'merkletreejs';
import cbor from 'cbor';
import * as IPFSClient from 'ipfs-http-client';
import { keccak256 } from '../es/web3-utils.js';
import toSortedKeysObject from '../utils/toSortedKeysObject.js';
import { createRequire } from 'module';
import esMain from 'es-main';
import { ETH_PRIVATE_KEY, IPFS_RPC } from '../environment.js';
import { getOrbitDBIdentity } from '../utils/getOrbitDBIdentity.js';
import { getOrbitDB } from '../utils/getOrbitDB.js';

const require = createRequire(import.meta.url);
// eslint-disable-next-line import/no-commonjs
const { people } = require('./data.json');

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

if (esMain(import.meta)) {
    console.debug(IPFS_RPC);
    const ipfs = IPFSClient.create({ url: IPFS_RPC });
    // Create OrbitDB identity
    const identity = await getOrbitDBIdentity(ETH_PRIVATE_KEY);
    console.debug(identity.toJSON());
    // Create OrbitDB instance with
    const orbitdb = await getOrbitDB(ipfs, identity);
    //const db1 = await orbitdb.docs(ORBITDB_ADDRESS, { indexBy: 'id' });
    const db1 = await orbitdb.docs('merkledb', { indexBy: 'id' });
    await writeTestDataToDB(db1);
    await db1.close();
}
