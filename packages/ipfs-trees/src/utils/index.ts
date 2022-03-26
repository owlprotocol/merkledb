//@ts-expect-error
import { keccak256 } from '@multiformats/sha3'; //js-sha3
import { Digest } from 'multiformats/hashes/digest';
import { assert } from 'chai';

const encoder = new TextEncoder();
export function stringToDigest(s: string): Promise<Digest<18, number>> {
    return keccak256.digest(encoder.encode(s));
}

export function digestToString(a: Digest<18, number>) {
    return Buffer.from(a.digest.buffer).toString('hex');
}
export function digestEqual(a: Digest<18, number>, b: Digest<18, number>, m?: string) {
    return assert.equal(digestToString(a), digestToString(b), m);
}
