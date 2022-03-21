declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production';
            ORBITDB_ADDRESS: string;
            MERKLE_DB_CONTRACT: string;
            ETH_RPC: string;
            ETH_PRIVATE_KEY: string;
            IPFS_RPC: string;
        }
    }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export { };
