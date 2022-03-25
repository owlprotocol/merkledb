# IPFS Trees
Create an immutable data-structure library using IPFS as a storage layer and enabling efficient querying. This can avoid the need for 3rd party indexing, effectively solving the data availability problem for the merkledb's off-chain data bridge solution.

## Tasks
* Use dag-json IPLD codec for simple huma-friendly encoding
* Tree: A simple binary tree abstraction build on top of IPFS.
* TreeReverse: A binary tree with where leaf nodes have parent references (used for MerkleTree parent traversal).
* RBTree: A red-black black tree for sorting by key.
* MerkleTree: A Merkle tree for compacting a set as a merkle root.

## Links
* https://en.wikipedia.org/wiki/Red%E2%80%93black_tree
* https://en.wikipedia.org/wiki/Merkle_tree
* https://github.com/ipld/js-dag-json
