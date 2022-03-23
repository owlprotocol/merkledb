import * as IPFS from 'ipfs-http-client';
import cbor from 'cbor';
import axios from 'axios';
import iterToBuffer from '../utils/iterToBuffer';

describe('merktreejs.test.ts', () => {
    it.skip('decode - client', async () => {
        const client = IPFS.create({ url: 'https://ipfs.infura.io:5001' });

        const result = await client.cat('QmNw5ygVyKJwNRiE6pkzoSzENpKHJnXPfk4ZBoECWgzyTz');

        const buffer = await iterToBuffer(result);
        const bufferStr = buffer.toString('utf-8');
        console.log(buffer.toString('hex'));
        const bufferJSON = JSON.parse(bufferStr);
        const rows = bufferJSON.map((d: any) => cbor.decode(d));
        console.debug(rows);
    });

    it('decode - axios', async () => {
        const client = axios.create({ baseURL: 'https://ipfs.infura.io:5001/api/v0' });
        const result = await client.post('/cat', undefined, {
            params: { arg: 'QmNw5ygVyKJwNRiE6pkzoSzENpKHJnXPfk4ZBoECWgzyTz' },
        });
        const rows = result.data.map((d: any) => cbor.decode(d));
        console.debug(rows);
    });
});
