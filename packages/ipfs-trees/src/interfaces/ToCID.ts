import { CID } from 'multiformats';

export default interface ToCID {
    cid(): CID;
}
