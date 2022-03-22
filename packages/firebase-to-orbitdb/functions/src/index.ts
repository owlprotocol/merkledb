import { https, config, logger, firestore, Change, EventContext } from 'firebase-functions';
import admin from 'firebase-admin';
import { collection } from 'firebase/firestore';
import { getOrbitDBIdentity } from './utils';
import { create } from 'ipfs-http-client';
//@ts-ignore
import OrbitDb from 'orbit-db';
admin.initializeApp();

// // Start writing Firebase Function
// // https://firebase.google.com/docs/functions/typescript
//

export const snapshotDatabase = https.onRequest(async (req, res) => {
    //@ts-ignore
    const db = admin.firestore();
    const peopleRef = await db.collection('ScoreBoard').get();
    const arr: admin.firestore.DocumentData[] = [];
    peopleRef.forEach((doc) => arr.push(doc.data()));
    res.send(arr);
});

export const onWrite = firestore
    .document('ScoreBoard/{scoreId}')
    .onWrite(async (change: Change<firestore.DocumentSnapshot>, context: EventContext) => {
        const changedDoc = context.params.scoreId;
        const dataBefore = change.before.data();
        const dataChange = change.after.data();
        const keys = [];
        for (const key in dataChange) {
            keys.push(key);
        }

        const identity = await getOrbitDBIdentity(process.env.ID_PRIVATE);

        const ipfs = create({ host: 'localhost', port: 5001 });
        const orbitDb = await OrbitDb.createInstance(ipfs, identity);
        const docStore = await orbitDb.docstore('ScoreBoard');

        docStore.put(dataChange);

        console.log(docStore, orbitDb, ipfs);
        console.log(
            `Changed document ${changedDoc} fields ${keys
                //@ts-ignore
                .map((e) => `${e} from ${dataBefore[e]} to ${dataChange[e]}`)
                .join(', ')} `,
        );
    });
