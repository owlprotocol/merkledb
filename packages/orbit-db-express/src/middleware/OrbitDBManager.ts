import { OrbitDB } from 'orbit-db';
import Store from 'orbit-db-store';

class DBManager {
    orbitdb: OrbitDB;
    dbs: { [key: string]: Store } = {};

    constructor(orbitdb: OrbitDB) {
        this.orbitdb = orbitdb;
    }

    /**
     * Search store cache
     * @param dbn Store name
     * @returns Store in cache
     */
    findDb(dbn: string) {
        let result;
        if (dbn in this.dbs) return this.dbs[dbn];
        for (const db of Object.values(this.dbs)) {
            //@ts-expect-error
            if (dbn == db.id) {
                result = db;
                break;
            } else if (dbn == [db.address.root, db.address.path].join('/')) {
                result = db;
                break;
            }
        }
        if (result) return result;
    }

    async get(dbn: string, options?: IOpenOptions) {
        let db = this.findDb(dbn);
        if (db) {
            return db;
        } else {
            console.log(`Opening db ${dbn}`);
            db = await this.orbitdb.open(dbn, options);
            await db.load();
            //@ts-expect-error
            console.log(`Loaded db ${db.dbname}`);
            //@ts-expect-error
            this.dbs[db.dbname] = db;
            return db;
        }
    }

    async dbListRemove(dbn: string) {
        const db = this.findDb(dbn);
        if (db) {
            await db.close();
            //@ts-expect-error
            delete dbs[db.dbname];
            //@ts-expect-error
            console.log(`Unloaded db ${db.dbname}`);
        }
    }

    dbList() {
        const dbInfoList: any = {};
        for (const dbn in this.dbs) {
            if (this.dbs.hasOwnProperty(dbn)) {
                dbInfoList[dbn] = this.dbInfo(dbn);
            }
        }
        return JSON.stringify(dbInfoList);
    }

    _dbWrite(db: Store) {
        return (
            //@ts-expect-error
            db.access.write ||
            //@ts-expect-error
            (typeof db.access.get == 'function' && db.access.get('write')) ||
            //@ts-expect-error
            db.access._options.write ||
            'unavaliable'
        );
    }

    dbWrite(dbn: string) {
        const db = this.findDb(dbn);
        if (!db) return {};
        return this._dbWrite(db);
    }

    dbInfo(dbn: string) {
        const db = this.findDb(dbn) as any;
        if (!db) return;
        const __db_write = this._dbWrite(db);
        return {
            address: db.address,
            dbname: db.dbname,
            id: db.id,
            options: {
                create: db.options.create,
                indexBy: db.options.indexBy,
                localOnly: db.options.localOnly,
                maxHistory: db.options.maxHistory,
                overwrite: db.options.overwrite,
                path: db.options.path,
                replicate: db.options.replicate,
            },
            //@ts-expect-error
            canAppend: __db_write.includes(this.orbitdb.identity.id),
            write: __db_write,
            type: db.type,
            uid: db.uid,
            indexLength: db.index ? db.index.length || Object.keys(db.index).length : -1,
            accessControlerType: db.access.type || 'custom',
            capabilities: Object.keys(
                //TODO: cleanup this mess once tc39 object.fromEntries aproved
                Object.assign(
                    {},
                    ...// https://tc39.github.io/proposal-object-from-entries
                    Object.entries({
                        add: typeof db.add == 'function',
                        get: typeof db.get == 'function',
                        inc: typeof db.inc == 'function',
                        iterator: typeof db.iterator == 'function',
                        put: typeof db.put == 'function',
                        query: typeof db.query == 'function',
                        remove: typeof (db.del || db.remove) == 'function',
                        value: typeof db.value == 'function',
                    })
                        .filter(([, v]) => v)
                        .map(([k, v]) => ({ [k]: v })),
                ),
            ),
        };
    }
}

export default DBManager;
