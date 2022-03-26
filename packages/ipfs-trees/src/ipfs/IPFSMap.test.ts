import { code, encode } from '@ipld/dag-json';
import { assert } from 'chai';
import { existsSync, rmSync } from 'fs';
import { CID } from 'multiformats';
import { create as createIPFS, IPFS } from 'ipfs';
import { sha256 } from 'multiformats/hashes/sha2';
import IPFSTree from './IPFSTree';
import IPFSTreeIndex from './IPFSTreeIndex';
import IPFSSingleton from './IPFSSingleton';

describe('IPFSMap.test.ts', () => {
    let ipfs: IPFS;
    before(async () => {
        ['./ipfs'].map((p) => {
            if (existsSync(p)) rmSync(p, { recursive: true });
        });

        //Write data to docs database
        ipfs = await createIPFS({
            repo: './ipfs',
        });
        IPFSSingleton.setIPFS(ipfs);
        IPFSSingleton._totalNetworkGet = 0;
        IPFSSingleton._totalNetworkPut = 0;
    });

    after(async () => {
        await ipfs.stop();
        ['./ipfs'].map((p) => {
            if (existsSync(p)) rmSync(p, { recursive: true });
        });
    });

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
        let node0 = IPFSTree.createNull();
        node0 = await node0.setJSON('1', { message: 'hello' });
        const m = await node0.getJSON('1');

        assert.isDefined(m);
        assert.deepEqual(m, { message: 'hello' });
    });
});
