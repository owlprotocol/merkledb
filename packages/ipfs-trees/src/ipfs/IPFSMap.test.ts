import { code, encode } from '@ipld/dag-json';
import { assert } from 'chai';
import { CID } from 'multiformats';
import { sha256 } from 'multiformats/hashes/sha2';
import IPFSTree from './IPFSTree';
import IPFSMapInterface from '../interfaces/IPFSMapInterface';
import asyncGeneratorToArray from '../utils/asyncGeneratorToArray';

describe('IPFSMap.test.ts', () => {

    describe('Single node', () => {
        it('null', async () => {
            const node0 = IPFSTree.createNull();
            const key0 = await node0.getKey();
            assert.equal(key0.key, '0');

            assert.isDefined(await node0.cid());
            assert.isDefined(await key0.cid());
        });

        it('root', async () => {
            let node0 = IPFSTree.createNull();
            const node0NullCid = await node0.cid();
            const key0NullCid = await (await node0.getKey()).cid();

            const value = {
                message: 'hello',
            };
            //Encode
            const data = encode(value);
            const hash = await sha256.digest(data);
            const cid = CID.create(1, code, hash);

            //Modify by copy
            node0 = await node0.set('0', cid);
            const key0 = await node0.getKey();
            assert.equal(key0.key, '0');

            const node0Cid = await node0.cid();
            const key0Cid = await key0.cid();
            assert.isDefined(node0Cid);
            assert.isDefined(key0Cid);

            assert.isFalse(node0Cid.equals(node0NullCid));
            assert.isFalse(key0Cid.equals(key0NullCid));
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
