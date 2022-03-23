import { people } from './data.json';
import toMerkleTree from '../utils/toMerkleTree';

export async function writeTestDataToDB(db: any) {
    const promises = people.map((p: any) => {
        return db.put(p, { pin: true });
    });
    await Promise.all(promises);
    console.debug(`Test data written to ${db.address}`);
}

export function testDataToMerkleTree() {
    return toMerkleTree(people);
}
