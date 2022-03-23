import express from 'express';
import OrbitDBManager from './OrbitDBManager';
import KeyValueStore from 'orbit-db-kvstore';
import DocumentStore from 'orbit-db-docstore';
import CounterStore from 'orbit-db-counterstore';

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

const comparisons = {
    ne: (a: any, b: any) => a != b,
    eq: (a: any, b: any) => a == b,
    gt: (a: number, b: number) => a > b,
    lt: (a: number, b: number) => a < b,
    gte: (a: number, b: number) => a >= b,
    lte: (a: number, b: number) => a <= b,
    mod: (a: number, b: number, c: number) => a % b == c,
    range: (a: number, b: number, c: number) => Math.max(b, c) >= a && a >= Math.min(b, c),
    all: () => true,
};

export function getOrbitDBRouter(dbManager: OrbitDBManager) {
    const router = express.Router();

    router.get('/:dbname', (req, res) => {
        const { dbname } = req.params;
        const dbInfo = dbManager.dbInfo(dbname);
        if (!dbInfo) {
            res.status(404).send({ error: `Database ${dbname} not found. Open db with POST /db/${dbname}` });
            return;
        }
        res.send(dbInfo);
    });

    router.get('/:dbname/value', (req, res) => {
        throw new Error('Unimplemented');
    });

    router.get('/:dbname/:item', async (req, res) => {
        const { dbname, item } = req.params;
        const db = dbManager.findDb(dbname);
        if (!db) {
            res.status(404).send({ error: `Database ${dbname} not found. Open db with POST /db/${dbname}` });
            return;
        }
        //@ts-expect-error
        const itemRaw = await db.get(item);
        const itemData = unpackContents(itemRaw);
        res.send(itemData);
    });

    router.get('/:dbname/iterator', (req, res) => {
        throw new Error('Unimplemented');
    });

    router.get('/:dbname/index', (req, res) => {
        throw new Error('Unimplemented');
    });

    router.post('/:dbname', async (req, res) => {
        const { dbname } = req.params;
        const options = req.body;
        const db = await dbManager.get(dbname, options);
        //@ts-expect-error
        const dbInfo = dbManager.dbInfo(db.dbname);
        res.send(dbInfo);
    });

    router.post('/:dbname/query', async (req, res) => {
        const { dbname } = req.params;
        const db = dbManager.findDb(dbname);
        if (!db) {
            res.status(404).send({ error: `Database ${dbname} not found. Open db with POST /db/${dbname}` });
            return;
        }
        if (db.type == 'docstore') {
            const dbDocs = db as unknown as DocumentStore<any>;

            const { comp, propname, values } = req.body;
            //@ts-expect-error
            const comparison = comparisons[comp || 'all'];
            const query = (doc: any) => comparison(doc[propname || '_id'], ...(values ?? []));
            try {
                const results = await dbDocs.query(query);
                res.send(results);
            } catch (error: any) {
                res.status(500).send({ error: error.message });
            }
        } else {
            throw new Error(`db.type = ${db.type}! db.query() only supported by docstore.`);
        }
    });

    router.post('/:dbname/add', async (req, res) => {
        const { dbname } = req.params;
        const body = req.body;
        const db = dbManager.findDb(dbname);
        if (!db) {
            res.status(404).send({ error: `Database ${dbname} not found. Open db with POST /db/${dbname}` });
            return;
        }

        if (db.type == 'log' || db.type == 'feed') {
            try {
                //@ts-expect-error
                const hash = await db.add(body);
                res.send({ hash });
            } catch (error: any) {
                res.status(500).send({ error: error.message });
            }
        } else {
            throw new Error(`db.type = ${db.type}! db.add() only supported by log and feedstore.`);
        }
    });

    router.post('/:dbname/put', async (req, res) => {
        const { dbname } = req.params;
        const body = req.body;
        const db = dbManager.findDb(dbname);
        if (!db) {
            res.status(404).send({ error: `Database ${dbname} not found. Open db with POST /db/${dbname}` });
            return;
        }

        if (db.type == 'keyvalue') {
            const dbKV = db as unknown as KeyValueStore<any>;
            let key, value;
            if (!body['key']) {
                throw new Error('Body must have {key, value} when inserting to KV Store!');
                //[key, value] = [Object.keys(body)[0], Object.values(body)[0]];
            } else {
                ({ key, value } = body);
            }
            try {
                const hash = await dbKV.put(key, value);
                res.send({ hash });
            } catch (error: any) {
                res.status(500).send({ error: error.message });
            }
        } else if (db.type == 'docstore') {
            const dbDocs = db as unknown as DocumentStore<any>;
            try {
                const hash = await dbDocs.put(body);
                res.send({ hash });
            } catch (error: any) {
                res.status(500).send({ error: error.message });
            }
        } else {
            throw new Error(`db.type = ${db.type}! db.put() only supported by keyvalue and docstore.`);
        }
    });

    router.post('/:dbname/inc', async (req, res) => {
        const { dbname } = req.params;
        const db = dbManager.findDb(dbname);
        if (!db) {
            res.status(404).send({ error: `Database ${dbname} not found. Open db with POST /db/${dbname}` });
            return;
        }

        if (db.type == 'counter') {
            const dbCounter = db as unknown as CounterStore;
            try {
                const hash = await dbCounter.inc();
                res.send({ hash });
            } catch (error: any) {
                res.status(500).send({ error: error.message });
            }
        } else {
            throw new Error(`db.type = ${db.type}! db.inc() only supported by counter.`);
        }
    });

    router.post('/:dbname/inc/:val', async (req, res) => {
        const { dbname, val } = req.params;
        const db = dbManager.findDb(dbname);
        if (!db) {
            res.status(404).send({ error: `Database ${dbname} not found. Open db with POST /db/${dbname}` });
            return;
        }

        if (db.type == 'counter') {
            const dbCounter = db as unknown as CounterStore;
            try {
                const hash = await dbCounter.inc(parseInt(val));
                res.send({ hash });
            } catch (error: any) {
                res.status(500).send({ error: error.message });
            }
        } else {
            throw new Error(`db.type = ${db.type}! db.inc() only supported by counter.`);
        }
    });

    router.post('/:dbname/access/write', (req, res) => {
        throw new Error('Unimplemented');
    });

    router.delete('/:dbname', async (req, res) => {
        const { dbname } = req.params;
        await dbManager.dbListRemove(dbname);
        res.status(204);
    });

    router.delete('/:dbname/:item', async (req, res) => {
        const { dbname, item } = req.params;
        const db = dbManager.findDb(dbname);
        if (!db) {
            res.status(404).send({ error: `Database ${dbname} not found. Open db with POST /db/${dbname}` });
            return;
        }
        //@ts-expect-error
        const hash = await db.del(item);
        res.send({ hash });
    });

    return router;
}

export default getOrbitDBRouter;
