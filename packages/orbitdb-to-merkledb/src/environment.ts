export const NODE_ENV = process.env.NODE_ENV;

if (NODE_ENV === 'development' || NODE_ENV === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dotenv = await import('dotenv');
    dotenv.config();
}

//export const IPFS_PRIVATE_KEY = process.env.IPFS_PRIVATE_KEY;
//export const IPFS_PEER_ID = process.env.IPFS_PEER_ID;
export const IPFS_RPC = process.env.IPFS_RPC;

export const ORBITDB_ADDRESS = process.env.ORBITDB_ADDRESS;
export const MERKLE_DB_CONTRACT = process.env.MERKLE_DB_CONTRACT;
export const ETH_RPC = process.env.ETH_RPC;
export const ETH_PRIVATE_KEY = process.env.ETH_PRIVATE_KEY;
