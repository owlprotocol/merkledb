import { https } from 'firebase-functions';
import admin from 'firebase-admin';
import { AxiosResponse } from 'axios';
import { FB_DOCUMENT } from '../utils/environment';
import { client } from '../client';

admin.initializeApp();

export const snapshotDatabase = https.onRequest(async (req, res) => {
    const db = admin.firestore();
    const docs = await db.collection(FB_DOCUMENT).get();

    const responses: Promise<AxiosResponse>[] = [];
    docs.forEach((d) => {
        const data = d.data();
        responses.push(client.post(`/db/${FB_DOCUMENT}/put`, { _id: d.id, ...data }));
    });

    try {
        const results = await Promise.all(responses);
        const resultsData = results.map((r) => r.data);
        res.send(resultsData);
    } catch (error: any) {
        res.status(500).send(error.toJSON());
    }
});
