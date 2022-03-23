# OrbitDB to MerkleDB
Configure project environment variables to listen to an OrbitDB Docstore and listen for changes.

Setup envvars. Create Docstore with mock data

Listen for database changes

## Environment Variables
**OrbitDB Config**
* `DATABASE_ADDRESS`: OrbitDB [Database Address](https://github.com/orbitdb/orbit-db/blob/main/GUIDE.md#address)

**IPFS Config**
* `PEER_ID`: `Config.Identity.PeerID`
* `PRIV_KEY`: `Config.Identity.PrivKey`


## Links
https://github.com/orbitdb/orbit-db/blob/main/GUIDE.md#replicating-a-database

## Bugs
* Initial IPFS Node has incorrect identity
  * https://github.com/ipfs/go-ipfs/issues/6262

* Parsing BN in JSON
  * https://github.com/wbuss/JSONBigNumber

## IPFS Cluster
To enable better stability, we configure a cluster of IPFS Nodes with fixed identities:

* `ipfs1.json`: OrbitDB to MerkleDB IPFS
* `ipfs2.json`: Frontend Demo Node
* `ipfs3.json`: Coordinator node?
* `ipfs4.json`: Firebase node?
