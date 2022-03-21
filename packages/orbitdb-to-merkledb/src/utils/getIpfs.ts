import * as IPFS from 'ipfs';
import esMain from 'es-main';
import { IPFS_PRIVATE_KEY, IPFS_PEER_ID } from '../environment.js';

interface IPFSConfig {
    Identity: {
        PeerID: string;
        PrivKey: string;
    };
}

export async function getIpfs(config?: IPFSConfig) {
    const ipfsConfig: any = {
        Addresses: {
            Swarm: [
                '/ip4/0.0.0.0/tcp/4002',
                '/ip4/0.0.0.0/tcp/4003/ws',
                '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
                '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
                '/dns4/webrtc-star.discovery.libp2p.io/tcp/443/wss/p2p-webrtc-star/',
            ],
        },
    };
    if (config) ipfsConfig.Identity = config.Identity;

    // Create IPFS instance
    const ipfsOptions = {
        repo: './ipfs',
        config: ipfsConfig,
        EXPERIMENTAL: {
            pubsub: true,
        },
    };

    let ipfs = await IPFS.create(ipfsOptions);
    let Addresses = await ipfs.config.get('Addresses');
    let Identity = await ipfs.config.get('Identity');
    let peers = await ipfs.swarm.peers();
    peers.map((p: any) => p.addr.toString());
    let Peers = peers;

    if (config && Identity.PeerID != config.Identity.PeerID) {
        console.warn('Initial IPFS bootstrap config bug. Restarting node...');

        await ipfs.stop();
        ipfs = await IPFS.create(ipfsOptions);
        Addresses = await ipfs.config.get('Addresses');
        Identity = await ipfs.config.get('Identity');
        peers = await ipfs.swarm.peers();
        peers.map((p: any) => p.addr.toString());
        Peers = peers;
    }

    //console.debug({ Addresses, Identity, Peers });

    return ipfs;
}

export default getIpfs;

if (esMain(import.meta)) {
    await getIpfs({
        Identity: {
            PeerID: IPFS_PEER_ID,
            PrivKey: IPFS_PRIVATE_KEY,
        },
    });
}
