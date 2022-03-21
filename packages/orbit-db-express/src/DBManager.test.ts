import { create as createIPFS, IPFS } from 'ipfs';
import { existsSync, rmSync } from 'fs';
import DBManager from './DBManager';
import { ETH_PRIVATE_KEY } from './utils/environment';
import getOrbitDB from './factory/getOrbitDB';
import getOrbitDBIdentity from './factory/getOrbitDBIdentity';
import OrbitDB from 'orbit-db';
import { assert } from 'chai';

describe('DBManager.test.ts', () => {
    let ipfs: IPFS;
    let orbitdb: OrbitDB;
    let dbManager: DBManager;

    beforeEach(async () => {
        ipfs = await createIPFS();
        const identity = await getOrbitDBIdentity(ETH_PRIVATE_KEY);
        orbitdb = await getOrbitDB(ipfs, identity);
        dbManager = new DBManager(orbitdb);
    });

    it('dbList', () => {
        const dbList = dbManager.dbList();
        assert.equal(dbList, '{}');
    });

    it('dbGet', async () => {
        const db = await dbManager.get('docs1', { create: true, type: 'docstore' });
        //@ts-expect-error
        const dbInfo = dbManager.dbInfo(db.dbname);
        assert.equal(dbInfo?.dbname, 'docs1');
    });

    afterEach(async () => {
        await orbitdb.disconnect();
        await ipfs.stop();

        ['./ipfs1', './ipfs2', './orbitdb1', './orbitdb2'].map((p) => {
            if (existsSync(p)) rmSync(p, { recursive: true });
        });
    });
});
