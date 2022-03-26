import { CID } from 'multiformats';
import {
    ByteView,
    encode as encodeJSON,
    decode as decodeJSON,
    code as codeJSON,
    encode as encodeCBOR,
    decode as decodeCBOR,
    code as codeCBOR,
} from '@ipld/dag-json';
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
    cid(): Promise<CID> {
        throw new Error('Method not implemented.');
    }
    putAll(): AsyncGenerator<CID, any, unknown> {
        throw new Error('Method not implemented.');
    }

    static async createNull(): Promise<IPFSMerkleMap> {
        const merkleTree = await IPFSTreeMerkle.createNull();
        const parentMap = IPFSTree.createNull();
        const leavesMap = IPFSTree.createNull();

        return new IPFSMerkleMap(merkleTree, parentMap, leavesMap);
    }

    get(k: string): Promise<CID | undefined> {
        return this._leavesMap.get(k);
    }
    async set(k: string, v: CID): Promise<IPFSMapInterface> {
        throw new Error('Method not implemented.');
    }

    getJSON(k: string): Promise<Record<string, any> | undefined> {
        return this._leavesMap.getJSON(k);
    }
    async setJSON(k: string, v: Record<string, any>): Promise<IPFSMapInterface> {
        throw new Error('Method not implemented.');
    }

    async getCBOR(k: string): Promise<Record<string, any> | undefined> {
        return this._leavesMap.getCBOR(k);
    }
    async setCBOR(k: string, v: Record<string, any>): Promise<IPFSMapInterface> {
        const data = encodeCBOR(v);
        //Use keccak256 hash
        const digestKeccak = keccak256(data.buffer);
        const cid = await IPFSSingleton.putCBOR(data);

        const merkleTree = await this._merkleTree.insertHash(digestKeccak);
        const parentMap = await this._parentMap.setJSON(k, v);
        const leavesMap = await this._leavesMap.setJSON(k, v);

        return new IPFSMerkleMap(merkleTree, parentMap, leavesMap);
    }
}
