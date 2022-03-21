import Web3 from 'web3';
import esMain from 'es-main';
import { createRequire } from 'module';
import {
    ETH_PRIVATE_KEY,
    ETH_RPC,
    IPFS_PEER_ID,
    IPFS_PRIVATE_KEY,
    MERKLE_DB_CONTRACT,
    ORBITDB_ADDRESS,
} from './environment.js';
import { getIpfs } from './utils/getIpfs.js';
import { orbitDBtoMerkleDB } from './orbitDBtoMerkleDB.js';
import { getOrbitDBIdentity } from './utils/getOrbitDBIdentity.js';
import { getOrbitDB } from './utils/getOrbitDB.js';

const require = createRequire(import.meta.url);
// eslint-disable-next-line import/no-commonjs
const MerkleDBArtifact = require('./artifacts/contracts/MerkleDB.sol/MerkleDB.json');

async function main() {
    const web3 = new Web3(ETH_RPC);
    //TODO: Add Private Key
    const contract = new web3.eth.Contract(MerkleDBArtifact.abi as any, MERKLE_DB_CONTRACT);

    const ipfs = await getIpfs({
        Identity: {
            PeerID: IPFS_PEER_ID,
            PrivKey: IPFS_PRIVATE_KEY,
        },
    });
    // Create OrbitDB identity
    const identity = await getOrbitDBIdentity(ETH_PRIVATE_KEY);
    console.debug(identity.toJSON())
    // Create OrbitDB instance with
    const orbitdb = await getOrbitDB(ipfs, { identity });
    //https://github.com/orbitdb/orbit-db/blob/main/GUIDE.md#persistency
    const db1 = await orbitdb.docs(ORBITDB_ADDRESS, { indexBy: 'id' });

    web3.eth.accounts.wallet.add(ETH_PRIVATE_KEY);
    const from = web3.eth.accounts.wallet[0].address;
    const nonce = await web3.eth.getTransactionCount(from);
    orbitDBtoMerkleDB(db1, contract, { from, nonce });
}

if (esMain(import.meta)) {
    main();
}
