import { Contract } from 'web3-eth-contract';
import { snapshotDatabase } from './snapshot.js';
import { onReplicateDatabase } from './replicate.js';

export interface SenderParams {
    from: string;
    nonce: number;
}
export async function orbitDBtoMerkleDB(db: any, merkleDB: Contract, senderOptions: SenderParams) {
    const from = senderOptions.from;
    const nonce = senderOptions.nonce;

    await db.load();

    //Snapshot Tree
    const tree = await snapshotDatabase(db, merkleDB, { from, nonce });

    //const root1 = tree.getRoot().toString('hex');
    //console.debug(root1);
    //console.debug(tree.toString());

    //Replicate Changes
    onReplicateDatabase(db, tree, merkleDB, { from, nonce: nonce + 1 });
    console.debug(`Listening for database changes at ${db.address}`);
}
