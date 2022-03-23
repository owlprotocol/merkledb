import OrbitDB from 'orbit-db';
import { getIpfs } from './getIpfs';

export async function getOrbitDBAddress(identity: any) {
    const ipfs = await getIpfs();
    // Create OrbitDB instance
    const orbitdb = await OrbitDB.createInstance(ipfs, { identity });
    const address = orbitdb.determineAddress('merkledb', 'docstore');
    await orbitdb.disconnect();

    return address;
}

export default getOrbitDBAddress;
