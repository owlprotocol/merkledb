import { Digest } from 'multiformats/hashes/digest';

export default interface IPFSMerkleInterface {
    insertHash(a: Digest<18, number>): Promise<IPFSMerkleInterface>;
}
