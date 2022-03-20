import MerkleTree from 'merkletreejs';
import cbor from 'cbor';
import toSortedKeysObject from './utils/toSortedKeysObject.js';

/**
 *
 * Event handler on database replicate.progress (emitted peer db updating)
 * @param db OrbitDB KV Database
 * @param tree Merkle Tree to add leaves to
 */
export function onReplicateDatabase(db: any, tree: MerkleTree) {
    db.events.on('replicate.progress', (address: string, hash: string, entry: any, progress: any, have: any) => {
        console.debug(`Replicate database at ${db.address}`);
        console.debug(entry.payload.value);
        tree.addLeaf(cbor.encode(toSortedKeysObject(entry.payload.value)), true);
    });
}

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
