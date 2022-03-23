import express from 'express';
import bodyParser from 'body-parser';
import * as IPFS from 'ipfs';
import Web3 from 'web3';
//import wrtc from 'wrtc';
//import WebRTCStar from 'libp2p-webrtc-star';
import { ETH_PRIVATE_KEY, ETH_RPC } from './utils/environment';
import getOrbitDB from './factory/getOrbitDB';
import getOrbitDBIdentity from './factory/getOrbitDBIdentity';
import OrbitDBManager from './middleware/OrbitDBManager';
import { getOrbitDBRouter } from './middleware/getOrbitDBRouter';
import { getMerkleDBRouter } from './middleware/getMerkleDBRouter';
import { MerkleDBManager } from './middleware/MerkleDBManager';

export async function getApp() {
    const ipfs = await IPFS.create({ repo: './ipfs' });
    /*
    const ipfs = await IPFS.create({
        config: {
            Addresses: {
                API: ['/ip4/0.0.0.0/tcp/5002'],
                Swarm: [
                    '/ip4/0.0.0.0/tcp/4002',
                    '/ip4/127.0.0.1/tcp/4003/ws',
                    //'/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
                    //'/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
                ],
            },
        },
        libp2p: {
            modules: {
                transport: [WebRTCStar],
            },
            config: {
                peerDiscovery: {
                    webRTCStar: {
                        // <- note the lower-case w - see https://github.com/libp2p/js-libp2p/issues/576
                        enabled: true,
                    },
                },
                transport: {
                    WebRTCStar: {
                        // <- note the upper-case w- see https://github.com/libp2p/js-libp2p/issues/576
                        wrtc,
                    },
                },
            },
        },
    });
    */

    console.log('IPFS-JS Server listening on port 5002');

    const web3 = new Web3(ETH_RPC);
    web3.eth.accounts.wallet.add(ETH_PRIVATE_KEY);

    const identity = await getOrbitDBIdentity(ETH_PRIVATE_KEY);
    const orbitdb = await getOrbitDB(ipfs, identity);
    const dbManager = new OrbitDBManager(orbitdb);

    const app = express();
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    /*
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err: Error, _req: any, res: any, _next: any) => {
        console.error(err.stack);
        res.status(500).sendJSON(err);
    });
    */

    app.get('/', (req, res) => {
        res.send('OrbitDB Express Server');
    });

    app.get('/dbs', (req, res) => {
        res.send(dbManager.dbList());
    });

    app.get('/identity', async (req, res) => {
        res.send(identity.toJSON());
    });

    const orbitDBManager = getOrbitDBRouter(dbManager);
    app.use('/db', orbitDBManager, (req, res) => {
        res.sendStatus(404);
    });

    const merkleDBManager = new MerkleDBManager(dbManager, ipfs, web3);
    await merkleDBManager.initialize();

    const merkleDbRouter = await getMerkleDBRouter(merkleDBManager);
    app.use('/merkle', merkleDbRouter, (req, res) => {
        res.sendStatus(404);
    });

    return app;
}

export default getApp;
