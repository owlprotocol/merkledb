import { firestore, Change, EventContext } from 'firebase-functions';
import { client } from '../client';
import { FB_DOCUMENT } from '../utils/environment';

export const onWrite = firestore
    .document(`${FB_DOCUMENT}/{id}`)
    .onWrite(async (change: Change<firestore.DocumentSnapshot>, context: EventContext) => {
        const id = context.params.id;
        const data = change.after.data();

        const response = await client.post(`/db/${FB_DOCUMENT}/put`, { _id: id, ...data });
        console.debug(response.data);
    });
