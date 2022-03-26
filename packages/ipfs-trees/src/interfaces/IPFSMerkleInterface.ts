import { Digest } from 'multiformats/hashes/digest';

export default interface IPFSMerkleInterface {
    insertHash(a: Digest<18, number>): Promise<IPFSMerkleInterface>;
    getProofGen(): AsyncGenerator<Digest<18, number>>
    getProof(): Promise<Digest<18, number>[]>
}
