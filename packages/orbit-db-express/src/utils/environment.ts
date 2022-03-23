// Process environment variables
export const NODE_ENV = process.env.NODE_ENV;

if (NODE_ENV === 'development' || NODE_ENV === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dotenv = require('dotenv');
    dotenv.config();
}

export const ETH_PRIVATE_KEY = process.env.ETH_PRIVATE_KEY;
export const ETH_RPC = process.env.ETH_RPC;
