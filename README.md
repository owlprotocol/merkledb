# merkledb

## Projects
* [cborlib-contracts](./packages/borlib-contracts): Solidity library to encode/decode CBOR data.
* [firebase-to-orbitdb](./packages/firebase-to-orbitdb): Firebase Cloud Function used a plugin to reflect a Firestore database to OrbitDB document store by listening to write updates.
* [merkledb-contracts](./packages/merkledb-contracts): Solidity smart contract to sotre merkledb root and IPFS hash.
* [orbitdb-to-merkledb](./packages/orbitdb-to-merkledb): Listens to OrbitDB changes to generate a merkle tree, publish it to IPFS, and publish its root on-chain.

## Local Development
#### Install
```
git clone git@github.com:owlprotocol/merkledb.git
pnpm install
```