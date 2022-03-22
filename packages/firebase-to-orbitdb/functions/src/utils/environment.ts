// Process environment variables
export const NODE_ENV = process.env.NODE_ENV;

if (NODE_ENV === 'development' || NODE_ENV === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dotenv = require('dotenv');
    dotenv.config();
}

export const ORBITDB_RPC = process.env.ORBITDB_RPC;
export const FB_DOCUMENT = process.env.FB_DOCUMENT ?? 'ScoreBoard';
