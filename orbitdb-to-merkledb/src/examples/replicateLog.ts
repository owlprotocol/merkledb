import * as IPFS from 'ipfs';
import OrbitDB from 'orbit-db';

async function main() {
    // Create the first peer
    const ipfs1_config = { repo: './ipfs1' };
    const ipfs1 = await IPFS.create(ipfs1_config);

    // Create the database
    const orbitdb1 = await OrbitDB.createInstance(ipfs1, { directory: './orbitdb1' });
    const db1 = await orbitdb1.log('events');

    // Create the second peer
    const ipfs2_config = {
        repo: './ipfs2',
        config: {
            Addresses: {
                Swarm: ['/ip4/0.0.0.0/tcp/5002', '/ip4/127.0.0.1/tcp/5003/ws'],
            },
            Bootstrap: ['/ip4/0.0.0.0/tcp/4002', '/ip4/127.0.0.1/tcp/4003/ws'],
        },
    };
    const ipfs2 = await IPFS.create(ipfs2_config);

    const peers1 = (await ipfs1.swarm.peers()).map((p: any) => p.addr.toString());;
    const peers2 = (await ipfs2.swarm.peers()).map((p: any) => p.addr.toString());;
    console.debug({ peers1, peers2 });

    // Open the first database for the second peer,
    // ie. replicate the database
    const orbitdb2 = await OrbitDB.createInstance(ipfs2, { directory: './orbitdb2' });
    const db2 = await orbitdb2.log(db1.address.toString());

    console.log('Making db2 check replica');

    // When the second database replicated new heads, query the database
    db2.events.on('replicated', (address: string) => {
        console.debug('replicated', address);
    });

    db2.events.on('replicate.progress', (address: string, hash: string, entry: any, progress: any, have: any) => {
        console.debug(entry.payload);
    });

    // Start adding entries to the first database
    setInterval(async () => {
        await db1.add({ time: new Date().getTime() });
    }, 1000);
}

main();
