import dotenv from 'dotenv';

dotenv.config();

export const PRIV_KEY = process.env.PRIV_KEY;
export const PEER_ID = process.env.PEER_ID;
export const ORBITDB_ADDRESS = process.env.ORBITDB_ADDRESS;
export const MERKLE_DB_CONTRACT = process.env.MERKLE_DB_CONTRACT;
export const ETH_RPC = process.env.ETH_RPC;
export const ETH_PRIVATE_KEY = process.env.ETH_PRIVATE_KEY;
