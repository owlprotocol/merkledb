import * as IPFS from 'ipfs';
import OrbitDB from 'orbit-db';
import cbor from 'cbor';
import { assert } from 'chai';
import { existsSync, rmSync } from 'fs';
import sleep from './utils/sleep.js';
import { testDataToMerkleTree, writeTestDataToDB } from './test/data.js';
import { snapshotDatabase } from './snapshot.js';
import { onReplicateDatabase } from './replicate.js';
import toSortedKeysObject from './utils/toSortedKeysObject.js';

describe('orbitDBtoMerkleDB.test.ts', () => {
    let ipfs1: any;
    let ipfs2: any;
    let orbitdb1: any;
    let orbitdb2: any;
    let db1: any;
    let db2: any;
    before(async () => {
        ['./ipfs1', './ipfs2', './orbitdb1', './orbitdb2'].map((p) => {
            if (existsSync(p)) rmSync(p, { recursive: true });
        });

        //Write data to docs database
        ipfs1 = await IPFS.create({
            repo: './ipfs1',
            EXPERIMENTAL: {
                pubsub: true,
            },
        });
        orbitdb1 = await OrbitDB.createInstance(ipfs1, { directory: './orbitdb1' });
        db1 = await orbitdb1.docs('docs', { indexBy: 'id' });
        await writeTestDataToDB(db1);

        const ipfs2_config = {
            repo: './ipfs2',
            config: {
                Addresses: {
                    Swarm: ['/ip4/0.0.0.0/tcp/5002', '/ip4/127.0.0.1/tcp/5003/ws'],
                },
                Bootstrap: ['/ip4/0.0.0.0/tcp/4002', '/ip4/127.0.0.1/tcp/4003/ws'],
            },
            EXPERIMENTAL: {
                pubsub: true,
            },
        };
        ipfs2 = await IPFS.create(ipfs2_config);
        orbitdb2 = await OrbitDB.createInstance(ipfs2, { directory: './orbitdb2' });
        db2 = await orbitdb2.docs(db1.address.toString());
        await db2.load();
        await sleep(1000);
    });

    it('snapshot, replicate', async () => {
        const tree = await snapshotDatabase(db2);
        const treeExpected = testDataToMerkleTree();
        const root1 = tree.getHexRoot();
        const rootExpected1 = treeExpected.getHexRoot();

        console.debug(tree.toString());
        console.debug(treeExpected.toString());
        assert.equal(root1, rootExpected1, 'Invalid Root!');

        //On replicate listener
        onReplicateDatabase(db2, tree);
        //Update db1
        const donald = {
            id: '4',
            name: 'Donald',
            address: '0x0000000000000000000000000000000000000004',
            score: 50,
            balance: '2000000000000000000',
            premium: false,
        };
        await db1.put(donald);
        await sleep(1000);

        const root2 = tree.getHexRoot();
        treeExpected.addLeaf(cbor.encode(toSortedKeysObject(donald)), true);
        const rootExpected2 = treeExpected.getHexRoot();

        assert.notEqual(root2, root1, 'root2 identical to previous!');
        assert.notEqual(rootExpected2, rootExpected1, 'rootExpected2 identical to previous!');
        assert.equal(root2, rootExpected2, 'Invalid Root!');
    });

    after(async () => {
        await db1.close();
        await db2.close();
        await orbitdb1.disconnect();
        await orbitdb2.disconnect();
        await ipfs2.stop();
        await ipfs1.stop();

        ['./ipfs1', './ipfs2', './orbitdb1', './orbitdb2'].map((p) => {
            if (existsSync(p)) rmSync(p, { recursive: true });
        });
    });
});
