import OrbitDB from 'orbit-db';
import esMain from 'es-main';
import { existsSync } from 'fs';

import { getIpfs } from './getIpfs.js';
import { getOrbitDBIdentity } from './getOrbitDBIdentity.js';
import { ETH_PRIVATE_KEY } from '../environment.js';

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
    const ipfs = await getIpfs();
    const identity = await getOrbitDBIdentity(ETH_PRIVATE_KEY);
    const orbitdb = await getOrbitDB(ipfs, identity);
    console.debug(orbitdb.identity.toJSON());
}
