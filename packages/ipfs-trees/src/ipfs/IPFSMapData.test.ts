import IPFSTree from './IPFSTree';
import IPFSSingleton from './IPFSSingleton';
import { IPFS, create as createIPFS } from 'ipfs-core';

describe('IPFSDataMap.test.ts', () => {
    let ipfs: IPFS;
    before(async () => {
        ipfs = await createIPFS({ repo: './ipfs' });
        IPFSSingleton.setIPFS(ipfs);
    });

    describe('Data Pump ', () => {
        it('get/set json', async () => {
            //DATA STRUCTURE is immutable
            let tree = IPFSTree.createNull();

            tree = await tree.setCBOR('1', { message: 'hello' });
            const cid = await tree.putAllSync();
            console.debug(cid)
        });
    });
});
