import { CID } from 'multiformats';
import MapInterface from './MapInterface';

export default interface IPFSMapInterface extends MapInterface<string, CID | undefined> {
    get(k: string): Promise<CID | undefined>;
    set(k: string, v: CID): Promise<IPFSMapInterface>;

    getJSON(k: string): Promise<Record<string, any> | undefined>;
    setJSON(k: string, v: Record<string, any>): Promise<IPFSMapInterface>;

    //getCBOR(k: string): Promise<Record<string, any> | undefined>;
    //setCBOR(k: string, v: Record<string, any>): Promise<IPFSMapInterface>;
}
