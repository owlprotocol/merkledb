import OrbitDB from 'orbit-db';
import { existsSync } from 'fs';

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
