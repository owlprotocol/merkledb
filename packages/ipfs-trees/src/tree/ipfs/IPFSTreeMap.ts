import { CID } from 'multiformats';
import IPFSTree from './IPFSTree';
import IPFSTreeIndex from './IPFSTreeIndex';
import MapInterface from '../MapInterface';

export default class IPFSTreeMap extends IPFSTree implements MapInterface<string, CID | undefined> {
    async get(k: string): Promise<CID | undefined> {
        const resultNode = await this.search(IPFSTreeIndex.create(k, undefined));
        if (!resultNode) return undefined;

        const resultIdx = await resultNode.getKey();
        return resultIdx.valueCID;
    }
    async set(k: string, v: CID | undefined): Promise<MapInterface<string, CID | undefined>> {
        const leafNode = IPFSTree.createLeafWithKey(k, v);
        const tree = await this.insert(leafNode);
        return tree as unknown as MapInterface<string, CID | undefined>;
    }
    static async createMap(k: string, v: CID | undefined): Promise<MapInterface<string, CID | undefined>> {
        const leafNode = IPFSTree.createLeafWithKey(k, v);
        return leafNode as unknown as MapInterface<string, CID | undefined>;
    }
}
