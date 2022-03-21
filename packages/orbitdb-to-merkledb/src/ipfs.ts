import * as IPFS from 'ipfs';
import { IPFS_PRIVATE_KEY, IPFS_PEER_ID } from './environment.js';

export const initIPFS = async () => {
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
                    '/ip4/0.0.0.0/tcp/4001',
                    '/ip4/0.0.0.0/tcp/4002/ws',
                ],
            },
            Identity: {
                PeerID: IPFS_PEER_ID,
                PrivKey: IPFS_PRIVATE_KEY,
            },
        },
        EXPERIMENTAL: {
            pubsub: true,
        },
    };
    const ipfs = await IPFS.create(ipfsOptions);
    const Addresses = await ipfs.config.get('Addresses');
    const Identity = await ipfs.config.get('Identity');
    const peers = await ipfs.swarm.peers();
    peers.map((p: any) => p.addr.toString());
    const Peers = peers;
    console.debug({ Addresses, Identity, Peers });

    return ipfs;
};
