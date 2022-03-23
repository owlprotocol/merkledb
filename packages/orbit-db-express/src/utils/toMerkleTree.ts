import cbor from 'cbor';
import MerkleTree from 'merkletreejs';
import { keccak256 } from 'web3-utils';
import toSortedKeysObject from './toSortedKeysObject';

export function toMerkleTree(data: any[]) {
    const leaves = data.map((r) => cbor.encode(toSortedKeysObject(r)).toString('hex'));
    const tree = new MerkleTree(leaves, keccak256, {
        hashLeaves: true,
        sortPairs: true,
    });
    return { tree, leaves };
}

export default toMerkleTree;
