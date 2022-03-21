import * as IPFS from 'ipfs';

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
    let Identity = await ipfs.config.get('Identity');
    let peers = await ipfs.swarm.peers();
    peers.map((p: any) => p.addr.toString());

    if (config && Identity.PeerID != config.Identity.PeerID) {
        console.warn('Initial IPFS bootstrap config bug. Restarting node...');

        await ipfs.stop();
        ipfs = await IPFS.create(ipfsOptions);
        Identity = await ipfs.config.get('Identity');
        peers = await ipfs.swarm.peers();
        peers.map((p: any) => p.addr.toString());
    }

    return ipfs;
}

export default getIpfs;
