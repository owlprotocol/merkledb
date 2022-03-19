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
