import * as IPFS from 'ipfs-http-client';
import iterToBuffer from '../utils/iterToBuffer';

describe('merktreejs.test.ts', () => {
    it('decode', async () => {
        const client = IPFS.create({ url: 'https://ipfs.infura.io:5001' });

        const result = await client.cat('QmXxT1L5WEdszfK3jMVqZH6fjt6qD8nwP1AHjnZ8kQ5Vvf');

        const buffer = await iterToBuffer(result);
        console.debug(buffer.toString('hex'));
    });
});
