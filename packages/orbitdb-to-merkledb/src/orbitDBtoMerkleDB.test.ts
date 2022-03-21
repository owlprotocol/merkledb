import * as IPFS from 'ipfs';
import OrbitDB from 'orbit-db';
import cbor from 'cbor';
import { assert } from 'chai';
import ganache from 'ganache';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { existsSync, readFileSync, rmSync } from 'fs';

import sleep from './utils/sleep.js';
import { testDataToMerkleTree, writeTestDataToDB } from './test/data.js';
import { snapshotDatabase } from './snapshot.js';
import { onReplicateDatabase } from './replicate.js';
import toSortedKeysObject from './utils/toSortedKeysObject.js';

const MerkleDBArtifact = JSON.parse(readFileSync('./artifacts/contracts/MerkleDB.sol/MerkleDB.json', 'utf-8'));

describe('orbitDBtoMerkleDB.test.ts', () => {
    let web3: Web3;
    let merkleDB: Contract;
    let from: string;
    let nonce: number;

    let ipfs1: any;
    let ipfs2: any;
    let orbitdb1: any;
    let orbitdb2: any;
    let db1: any;
    let db2: any;

    beforeEach(async () => {
        const provider = ganache.provider({
            logging: { quiet: true },
        });
        //@ts-ignore
        web3 = new Web3(provider);
        const accounts = await web3.eth.getAccounts();
        from = accounts[0];
        nonce = await web3.eth.getTransactionCount(from);

        merkleDB = await new web3.eth.Contract(MerkleDBArtifact.abi as any)
            .deploy({
                data: MerkleDBArtifact.bytecode,
            })
            .send({
                nonce: nonce++,
                from,
                gas: 2000000,
            });

        console.debug(`MerkleDB deployed at ${merkleDB.options.address}`);

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
        const tree = await snapshotDatabase(db2, merkleDB, { from, nonce });
        const treeExpected = testDataToMerkleTree();
        const root1 = '0x' + tree.getRoot().toString('hex');
        const rootExpected1 = '0x' + treeExpected.getRoot().toString('hex');

        //console.debug(tree.toString());
        //console.debug(treeExpected.toString());
        assert.equal(root1, rootExpected1, 'Invalid Root!');

        //Check contract values
        await sleep(1000);
        const rootContract1 = await merkleDB.methods.merkleRoot().call();
        //console.debug(rootContract1);
        assert.equal(rootContract1, rootExpected1, 'Invalid Contract Root!');

        //On replicate listener
        onReplicateDatabase(db2, tree, merkleDB, { from, nonce: nonce + 1 });
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

        const root2 = '0x' + tree.getRoot().toString('hex');
        treeExpected.addLeaf(cbor.encode(toSortedKeysObject(donald)), true);
        const rootExpected2 = '0x' + treeExpected.getRoot().toString('hex');

        assert.notEqual(root2, root1, 'root2 identical to previous!');
        assert.notEqual(rootExpected2, rootExpected1, 'rootExpected2 identical to previous!');

        assert.equal(root2, rootExpected2, 'Invalid Root 2!');
        //Check contract values
        const rootContract2 = await merkleDB.methods.merkleRoot().call();
        assert.equal(rootContract2, rootExpected2, 'Invalid Contract Root 2!');
    });

    /*
    it('onReplicateDatabaseGen', async () => {
        //On replicate listener
        const treeExpected = testDataToMerkleTree();
        const gen = onReplicateDatabase(db2, treeExpected);

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

        //const next = await gen.next();

        //assert.deepEqual(next.value, donald, 'onReplicate generator invalid!');
    });
    */

    afterEach(async () => {
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
