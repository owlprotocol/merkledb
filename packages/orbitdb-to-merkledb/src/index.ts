import * as IPFS from 'ipfs';
import OrbitDB from 'orbit-db';
import { DATABASE_ADDRESS, PRIV_KEY, PEER_ID } from './environment.js';

console.debug({ PEER_ID, PRIV_KEY })

async function main() {
    // Create IPFS instance
    const ipfsOptions = {
        repo: './ipfs',
        config: {
            Addresses: {
                Announce: [],
                NoAnnounce: [],
                API: '/ip4/127.0.0.1/tcp/5001',
                Gateway: '/ip4/127.0.0.1/tcp/8080',
                Swarm: [
                    '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
                    '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
                    '/dns4/webrtc-star.discovery.libp2p.io/tcp/443/wss/p2p-webrtc-star/',
                    '/ip4/127.0.0.1/tcp/4001',
                    //'/ip6/::/etcp/4001',
                    '/ip4/127.0.0.1/tcp/4002/ws',
                ],
            },
            Identity: {
                PeerID: PEER_ID,
                PrivKey: PRIV_KEY,
            },
        },
        EXPERIMENTAL: {
            pubsub: true,
        },
    };
    const ipfs = await IPFS.create(ipfsOptions);
    console.debug(await ipfs.config.get('Addresses'));
    console.debug(await ipfs.config.get('Identity'));
    const peers = await ipfs.swarm.peers();
    peers.map((p: any) => p.addr.toString());
    console.debug(peers);
    // Create OrbitDB instance
    const orbitdb = await OrbitDB.createInstance(ipfs);

    //https://github.com/orbitdb/orbit-db/blob/main/GUIDE.md#persistency
    const db1 = await orbitdb.keyvalue('kv1');
    await db1.load();
    console.debug(db1.all)

    await db1.put('Bob', { name: 'Bob' }, { pin: true });
    await db1.close();

    const db2 = await orbitdb.keyvalue('kv1');
    await db2.load();
    console.debug(db2.all);

    // Create database instance
    //console.debug(DATABASE_ADDRESS);
    //const db = await orbitdb.docs(DATABASE_ADDRESS);
    //console.debug(db.all);
}
main();
