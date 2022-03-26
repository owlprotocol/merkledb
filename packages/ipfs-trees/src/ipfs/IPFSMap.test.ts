import { code, encode } from '@ipld/dag-json';
import { assert } from 'chai';
import { CID } from 'multiformats';
import { sha256 } from 'multiformats/hashes/sha2';
import IPFSTree from './IPFSTree';
import IPFSMapInterface from '../interfaces/IPFSMapInterface';
import asyncGeneratorToArray from '../utils/asyncGeneratorToArray';

describe('IPFSMap.test.ts', () => {
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

    it('load from CID', async () => {
        let map: IPFSMapInterface = IPFSTree.createNull();
        map = await map.setJSON('1', { message: 'hello' });
        map = await map.setJSON('2', { message: 'hello' });
        map = await map.setJSON('3', { message: 'hello' });
        const cid = map.cid();
        const cidList = await asyncGeneratorToArray(map.putAll());

        console.debug(cid)
        console.debug(cidList)
    })
});
