import MerkleTree from 'merkletreejs';
import cbor from 'cbor';
import { Contract } from 'web3-eth-contract';
import toSortedKeysObject from './utils/toSortedKeysObject.js';
import { SenderParams } from './orbitDBtoMerkleDB.js';

/**
 *
 * Event handler on database replicate.progress (emitted peer db updating)
 * @param db OrbitDB KV Database
 * @param tree Merkle Tree to add leaves to
 */
export function onReplicateDatabase(db: any, tree: MerkleTree, merkleDB: Contract, senderOptions: SenderParams) {
    const from = senderOptions.from;
    let nonce = senderOptions.nonce;

    db.events.on('replicate.progress', (address: string, hash: string, entry: any, progress: any, have: any) => {
        console.debug(`Replicate database at ${db.address}`);
        console.debug(entry.payload.value);
        tree.addLeaf(cbor.encode(toSortedKeysObject(entry.payload.value)), true);

        //Publish on-chain
        const merkleRoot = '0x' + tree.getRoot().toString('hex');
        const merkleTreeIPFS = '0x';
        const databaseIPFS = '0x';
        const tx = merkleDB.methods.updateMerkleDB(merkleRoot, merkleTreeIPFS, databaseIPFS);
        tx.send({
            nonce: nonce++,
            from,
            gas: 100000,
        }).on('transactionHash', (h: string) => console.debug(`Replicate ${h}`));
    });
}

//Inspired from https://stackoverflow.com/questions/51045136/how-can-i-use-a-event-emitter-as-an-async-generator
/**
 *
 * Event handler on database replicate.progress (emitted peer db updating)
 * @param db OrbitDB KV Database
 * @param tree Merkle Tree to add leaves to
 */
/*
export async function* onReplicateDatabaseGen(db: any) {

    let resolve: () => void;
    let results: any = [];
    //@ts-ignore
    const promises: Promise<any>[] = [];
    const resolvers: ((x: unknown) => void)[] = [];

    //Create initial promise &
    const p1 = new Promise((r) => resolvers.push(r));
    promises.push(p1);

    db.events.on('replicate.progress', (address: string, hash: string, entry: any, progress: any, have: any) => {
        console.debug(`Replicate database at ${db.address}`);
        console.debug(entry.payload.value);
        results.push(entry.payload.value);
        resolve();
        //@ts-ignore
        promise = new Promise((r) => (resolve = r));
    });

    while (true) {
        await promise;
        yield* results;
        results = [];
    }
}
*/

/**
 *
 * Event handler on database write (emitted when directly writing to db)
 * @param db OrbitDB KV Database
 * @param tree Merkle Tree to add leaves to
 */
export function onWriteDatabase(db: any, tree: MerkleTree) {
    db.events.on('write', (address: string, entry: any, heads: any) => {
        console.debug(`Write database at ${db.address}`);
        console.debug(entry.payload);
        tree.addLeaf(cbor.encode(entry.payload), true);
    });
}
