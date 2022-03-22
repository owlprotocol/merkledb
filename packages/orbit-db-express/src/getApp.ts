import express from 'express';
import bodyParser from 'body-parser';
import { create as createIPFS } from 'ipfs-http-client';
import { IPFS } from 'ipfs';
import { ETH_PRIVATE_KEY, IPFS_BASIC_AUTH, IPFS_RPC } from './utils/environment';
import getOrbitDB from './factory/getOrbitDB';
import getOrbitDBIdentity from './factory/getOrbitDBIdentity';
import OrbitDBManager from './DBManager';
import KeyValueStore from 'orbit-db-kvstore';
import DocumentStore from 'orbit-db-docstore';

function unpackContents(contents: any) {
    if (contents) {
        if (contents.map) {
            return contents.map((e: any) => {
                if (e.payload) return e.payload.value;
                return e;
            });
        } else if (contents.payload) {
            return contents.payload.value;
        }
    }
    return contents;
}

export async function getApp() {
    let ipfs: IPFS;
    if (IPFS_BASIC_AUTH) {
        console.debug(IPFS_BASIC_AUTH);
        const auth = Buffer.from(IPFS_BASIC_AUTH).toString('base64');
        ipfs = await createIPFS({
            url: IPFS_RPC,
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });
    } else {
        ipfs = await createIPFS({ url: IPFS_RPC });
    }
    const identity = await getOrbitDBIdentity(ETH_PRIVATE_KEY);
    const orbitdb = await getOrbitDB(ipfs, identity);
    const dbManager = new OrbitDBManager(orbitdb);

    const app = express();
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.get('/', (req, res) => {
        res.send('OrbitDB Express Server');
    });

    app.get('/dbs', (req, res) => {
        res.send(dbManager.dbList());
    });

    app.get('/db/:dbname', (req, res) => {
        const { dbname } = req.params;
        const dbInfo = dbManager.dbInfo(dbname);
        if (!dbInfo) {
            res.status(404);
            res.send({ error: `Database ${dbname} not found. Open db with POST /db/${dbname}` });
            return;
        }
        res.send(dbInfo);
    });

    app.get('/db/:dbname/value', (req, res) => {
        throw new Error('Unimplemented');
    });

    app.get('/db/:dbname/:item', async (req, res) => {
        const { dbname, item } = req.params;
        const db = dbManager.findDb(dbname);
        if (!db) {
            res.status(404);
            res.send({ error: `Database ${dbname} not found. Open db with POST /db/${dbname}` });
            return;
        }
        //@ts-expect-error
        const itemRaw = await db.get(item);
        const itemData = unpackContents(itemRaw);
        res.send(itemData);
    });

    app.get('/db/:dbname/iterator', (req, res) => {
        throw new Error('Unimplemented');
    });

    app.get('/db/:dbname/index', (req, res) => {
        throw new Error('Unimplemented');
    });

    app.get('/identity', async (req, res) => {
        res.send(identity.toJSON());
    });

    app.post('/db/:dbname', async (req, res) => {
        const { dbname } = req.params;
        const options = req.body;
        const db = await dbManager.get(dbname, options);
        //@ts-expect-error
        const dbInfo = dbManager.dbInfo(db.dbname);
        res.send(dbInfo);
    });

    app.post('/db/:dbname/query', (req, res) => {
        throw new Error('Unimplemented');
    });

    app.post('/db/:dbname/add', (req, res) => {
        throw new Error('Unimplemented');
    });

    app.post('/db/:dbname/put', async (req, res) => {
        const { dbname } = req.params;
        const body = req.body;
        const db = await dbManager.get(dbname);

        if (db.type == 'keyvalue') {
            const dbKV = db as unknown as KeyValueStore<any>;
            let key, value;
            if (!body['key']) {
                throw new Error('Body must have {key, value} when inserting to KV Store!');
                //[key, value] = [Object.keys(body)[0], Object.values(body)[0]];
            } else {
                ({ key, value } = body);
            }
            res.send({ hash: await dbKV.put(key, value) });
        } else if (db.type == 'docstore') {
            const dbDocs = db as unknown as DocumentStore<any>;
            res.send({ hash: await dbDocs.put(body) });
        } else {
            throw new Error(`db.type = ${db.type}! db.put() only supported by keyvalue and docstore.`);
        }
    });

    app.post('/db/:dbname/inc', (req, res) => {
        throw new Error('Unimplemented');
    });

    app.post('/db/:dbname/inc/:val', (req, res) => {
        throw new Error('Unimplemented');
    });

    app.post('/db/:dbname/access/write', (req, res) => {
        throw new Error('Unimplemented');
    });

    app.delete('/db/:dbname', (req, res) => {
        throw new Error('Unimplemented');
    });

    app.delete('/db/:dbname/:item', (req, res) => {
        throw new Error('Unimplemented');
    });

    return app;
}

export default getApp;
