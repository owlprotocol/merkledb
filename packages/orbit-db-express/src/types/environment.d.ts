declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production' | 'test';
            ETH_PRIVATE_KEY: string;
            ETH_RPC: string;
            IPFS_RPC: string;
            IPFS_BASIC_AUTH?: string;
        }
    }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export { };
