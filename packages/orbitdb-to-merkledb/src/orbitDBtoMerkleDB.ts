import OrbitDB from 'orbit-db';
import { initIPFS } from './ipfs.js';
import { snapshotDatabase } from './snapshot.js';
import { onReplicateDatabase } from './replicate.js';
import { DATABASE_ADDRESS } from './environment.js';

export async function orbitDBtoMerkleDB() {
    const ipfs = await initIPFS();
    // Create OrbitDB instance
    const orbitdb = await OrbitDB.createInstance(ipfs);
    //https://github.com/orbitdb/orbit-db/blob/main/GUIDE.md#persistency
    const db1 = await orbitdb.docs(DATABASE_ADDRESS, { indexBy: 'id' });
    await db1.load();

    //Snapshot Tree
    const tree = await snapshotDatabase(db1);
    const root1 = tree.getRoot().toString('hex');
    console.debug(root1);
    console.debug(tree.toString());

    //Replicate Changes
    onReplicateDatabase(db1, tree);

    console.debug(`Listening for database changes at ${db1.address}`);
}
