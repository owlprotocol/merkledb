import OrbitDB from 'orbit-db';
import { ETH_PRIVATE_KEY } from '../environment.js';
import { initIPFS } from '../ipfs.js';
import getOrbitDBIdentity from './getOrbitDBIdentity.js';

async function getOrbitDBAddress(identity: any) {
    const ipfs = await initIPFS();
    // Create OrbitDB instance
    const orbitdb = await OrbitDB.createInstance(ipfs, { identity });
    const address = orbitdb.determineAddress('merkledb', 'docstore');

    return address;
}

if (require.main === module) {
    getOrbitDBIdentity(ETH_PRIVATE_KEY)
        .then((id) => {
            console.log(id.toJSON())
            return getOrbitDBAddress(id);
        })
        .then((address) => {
            console.log(address);
        });
}
