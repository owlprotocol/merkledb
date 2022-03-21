declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production';
            ORBITDB_ADDRESS: string;
            IPFS_PEER_ID: string;
            IPFS_PRIVATE_KEY: string;
            MERKLE_DB_CONTRACT: string;
            ETH_RPC: string;
            ETH_PRIVATE_KEY: string;
        }
    }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
