import OrbitDB from 'orbit-db';
import Web3 from 'web3';
import MerkleDBArtifact from './artifacts/contracts/MerkleDB.sol/MerkleDB.json';
import { ETH_PRIVATE_KEY, ETH_RPC, MERKLE_DB_CONTRACT, ORBITDB_ADDRESS } from './environment.js';
import { initIPFS } from './ipfs.js';
import { orbitDBtoMerkleDB } from './orbitDBtoMerkleDB.js';


async function main() {
    const web3 = new Web3(ETH_RPC);
    //TODO: Add Private Key
    const contract = new web3.eth.Contract(MerkleDBArtifact.abi as any, MERKLE_DB_CONTRACT);

    const ipfs = await initIPFS();
    // Create OrbitDB instance
    const orbitdb = await OrbitDB.createInstance(ipfs);
    //https://github.com/orbitdb/orbit-db/blob/main/GUIDE.md#persistency
    const db1 = await orbitdb.docs(ORBITDB_ADDRESS, { indexBy: 'id' });

    web3.eth.accounts.wallet.add(ETH_PRIVATE_KEY);
    const from = web3.eth.accounts.wallet[0].address;
    const nonce = await web3.eth.getTransactionCount(from);
    orbitDBtoMerkleDB(db1, contract, { from, nonce });
}

if (require.main === module) {
    main();
}
