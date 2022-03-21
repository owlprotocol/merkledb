import OrbitDB from 'orbit-db';
import esMain from 'es-main';
import { assert } from 'chai';
import { existsSync } from 'fs';

import { getIpfs } from './getIpfs.js';
import { getOrbitDBIdentity } from './getOrbitDBIdentity.js';
import { ETH_PRIVATE_KEY, IPFS_PEER_ID, IPFS_PRIVATE_KEY } from '../environment.js';

export async function getOrbitDB(ipfs: any, identity: any) {
    //Check if db exists
    const orbitDBExists = existsSync('./orbitdb');
    let orbitdb: any;

    if (!orbitDBExists) {
        //Initialize store
        orbitdb = await OrbitDB.createInstance(ipfs);
        await orbitdb.disconnect();
    }

    //Initialize with identity
    orbitdb = await OrbitDB.createInstance(ipfs, { identity });
    return orbitdb;
}

export default getOrbitDB;

if (esMain(import.meta)) {
    const ipfs = await getIpfs({
        Identity: {
            PeerID: IPFS_PEER_ID,
            PrivKey: IPFS_PRIVATE_KEY,
        },
    });
    const identity = await getOrbitDBIdentity(ETH_PRIVATE_KEY);
    const orbitdb = await getOrbitDB(ipfs, identity);
    console.debug(orbitdb.identity);
}
