import { code, encode } from '@ipld/dag-cbor';
import { assert } from 'chai';
import { CID } from 'multiformats';
import { sha256 } from 'multiformats/hashes/sha2';
import IPFSTree from './IPFSTree';
import IPFSMapInterface from '../interfaces/IPFSMapInterface';
import asyncGeneratorToArray from '../utils/asyncGeneratorToArray';
import IPFSSingleton from './IPFSSingleton';
import { zip } from 'lodash';
import { IPFS, create as createIPFS } from 'ipfs-core';

describe('IPFSMap.test.ts', () => {
    let ipfs: IPFS;
    before(async () => {
        ipfs = await createIPFS({ repo: './ipfs' });
        IPFSSingleton.setIPFS(ipfs);
    });

    describe('Single node', () => {
        it('null', async () => {
            const node0 = IPFSTree.createNull();
            const key0 = await node0.getKey();
            assert.isUndefined(key0);
        });

        it('root', async () => {
            let node0 = IPFSTree.createNull();
            const value = {
                message: 'hello',
            };
            //Encode
            const data = encode(value);
            const hash = await sha256.digest(data);
            const cid = CID.create(1, code, hash);
            await IPFSSingleton.putJSON(value);

            //Modify by copy
            node0 = await node0.set('0', cid);
            const key0 = await node0.rootKey();
            assert.equal(key0, '0');
            const val0 = await node0.rootValue();
            assert.deepEqual(val0, value);
        });

        it('get/set json', async () => {
            //DATA STRUCTURE is immutable
            let node0 = IPFSTree.createNull();
            node0 = await node0.setJSON('1', { message: 'hello' });
            const m = await node0.getJSON('1');

            assert.isDefined(m);
            assert.deepEqual(m, { message: 'hello' });
        });

        it('put/load from CID', async () => {
            let map: IPFSMapInterface = IPFSTree.createNull();
            map = await map.setJSON('1', { message: 'hello' });
            const cid = await map.cid();
            await map.putAllSync();

            const map2: IPFSMapInterface = await IPFSTree.createFromCID(cid);
            //Fetches leaf nodes
            const m = await map2.getJSON('1');
            assert.isDefined(m);
            assert.deepEqual(m, { message: 'hello' });
        });
    });
    describe('1-5', () => {
        it('get/set json', async () => {
            //DATA STRUCTURE is immutable
            let map: IPFSMapInterface = IPFSTree.createNull();
            map = await map.setJSON('3', { message: 'node3' });
            map = await map.setJSON('2', { message: 'node2' });
            map = await map.setJSON('4', { message: 'node4' });
            map = await map.setJSON('1', { message: 'node1' });
            map = await map.setJSON('5', { message: 'node5' });

            const n1 = await map.getJSON('1');
            assert.isDefined(n1);
            assert.deepEqual(n1, { message: 'node1' });

            const n5 = await map.getJSON('5');
            assert.isDefined(n5);
            assert.deepEqual(n5, { message: 'node5' });
        });

        it('iterate', async () => {
            let map: IPFSMapInterface = IPFSTree.createNull();
            map = await map.setJSON('3', { message: 'node3' });
            map = await map.setJSON('2', { message: 'node2' });
            map = await map.setJSON('4', { message: 'node4' });
            map = await map.setJSON('1', { message: 'node1' });
            map = await map.setJSON('5', { message: 'node5' });

            const keys = await map.getKeys();
            const values = await map.getValues();
            const entries = await map.getEntries();
            const expectedKeys = ['1', '2', '3', '4', '5'];
            const expectedValues = expectedKeys.map((k) => {
                return { message: `node${k}` };
            });
            const expectedEntries = zip(expectedKeys, expectedValues);
            assert.deepEqual(keys, expectedKeys, 'getKeys()');
            assert.deepEqual(values, expectedValues, 'getValues()');
            //@ts-expect-error
            assert.deepEqual(entries, expectedEntries, 'getEntries()');
        });

        it('put/load from CID', async () => {
            let map: IPFSMapInterface = IPFSTree.createNull();
            map = await map.setJSON('3', { message: 'node3' });
            map = await map.setJSON('2', { message: 'node2' });
            map = await map.setJSON('4', { message: 'node4' });
            map = await map.setJSON('1', { message: 'node1' });
            map = await map.setJSON('5', { message: 'node5' });

            const cid = await map.cid();
            await map.putAllSync();

            const map2: IPFSMapInterface = await IPFSTree.createFromCID(cid);
            //Fetches leaf nodes
            const n1 = await map2.getJSON('1');
            assert.isDefined(n1);
            assert.deepEqual(n1, { message: 'node1' });

            const n5 = await map2.getJSON('5');
            assert.isDefined(n5);
            assert.deepEqual(n5, { message: 'node5' });
        });
    });
});
