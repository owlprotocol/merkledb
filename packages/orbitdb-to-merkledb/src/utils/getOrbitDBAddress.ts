import OrbitDB from 'orbit-db';
import esMain from 'es-main';

import { getIpfs } from './getIpfs.js';
import getOrbitDBIdentity from './getOrbitDBIdentity.js';
import { ETH_PRIVATE_KEY } from '../environment.js';

export async function getOrbitDBAddress(identity: any) {
    const ipfs = await getIpfs();
    // Create OrbitDB instance
    const orbitdb = await OrbitDB.createInstance(ipfs, { identity });
    const address = orbitdb.determineAddress('merkledb', 'docstore');
    await orbitdb.disconnect();

    return address;
}

export default getOrbitDBAddress;

if (esMain(import.meta)) {
    const id = await getOrbitDBIdentity(ETH_PRIVATE_KEY);
    const address = await getOrbitDBAddress(id);
    console.log(id.toJSON());
    console.log(address);
}
