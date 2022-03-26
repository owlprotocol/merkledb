import { CID } from 'multiformats';
import { ByteView, encode as encodeJSON, decode as decodeJSON, code as codeJSON } from '@ipld/dag-json';
import { encode as encodeCBOR, decode as decodeCBOR, code as codeCBOR } from '@ipld/dag-json';
//@ts-expect-error
import { keccak256 } from '@multiformats/sha3';
import IPFSMapInterface from '../interfaces/IPFSMapInterface';
import IPFSTree from './IPFSTree';
import IPFSMerkleInterface from '../interfaces/IPFSMerkleInterface';
import IPFSTreeMerkle from './IPFSMerkle';
import IPFSSingleton from './IPFSSingleton';

export interface IPFSMerkleMapData {
    merkleTreeCID: CID;
    parentMapCID: CID;
    leavesMapCID: CID;
}

export default class IPFSMerkleMap implements IPFSMapInterface {
    private readonly _merkleTree: IPFSMerkleInterface;
    private readonly _parentMap: IPFSMapInterface;
    private readonly _leavesMap: IPFSMapInterface;

    private constructor(_merkleTree: IPFSMerkleInterface, _parentMap: IPFSMapInterface, _leavesMap: IPFSMapInterface) {
        this._merkleTree = _merkleTree;
        this._parentMap = _parentMap;
        this._leavesMap = _leavesMap;
    }

    static async createNull(): Promise<IPFSMerkleMap> {
        const merkleTree = await IPFSTreeMerkle.createNull();
        const parentMap = IPFSTree.createNull();
        const leavesMap = IPFSTree.createNull();

        return new IPFSMerkleMap(merkleTree, parentMap, leavesMap);
    }

    get(k: string): Promise<CID | undefined> {
        throw new Error('Method not implemented.');
    }
    async set(k: string, v: CID): Promise<IPFSMapInterface> {
        throw new Error('Method not implemented.');
    }
    getJSON(k: string): Promise<Record<string, any> | undefined> {
        throw new Error('Method not implemented.');
    }
    async setJSON(k: string, v: Record<string, any>): Promise<IPFSMerkleMap> {
        throw new Error('Method not implemented.');
    }
    async getCBOR(k: string): Promise<Record<string, any> | undefined> {
        const cid = await this.get(k);
        if (!cid) return undefined;
        const data = await IPFSSingleton.ipfs!.block.get(cid);
        return decodeCBOR(data);
    }
    async setCBOR(k: string, v: Record<string, any>): Promise<IPFSMerkleMap> {
        const data = encodeCBOR(v);
        const digest = keccak256(data.buffer);
        await IPFSSingleton.ipfs!.block.put(data);

        const merkleTree = await this._merkleTree.insertHash(digest);
        const parentMap = await this._parentMap.setJSON(k, v);
        const leavesMap = await this._leavesMap.setJSON(k, v);

        return new IPFSMerkleMap(merkleTree, parentMap, leavesMap);
    }
}
