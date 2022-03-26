import { encode, decode } from '@ipld/dag-cbor'
import { CID } from 'multiformats'

const obj = {
    x: 1,
    /* CID instances are encoded as links */
    y: [2, 3, CID.parse('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4')],
    z: {
        a: CID.parse('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4'),
        b: null,
        c: 'string'
    }
}

let data = encode(obj)
let decoded = decode(data)
decoded.y[0] // 2
CID.asCID(decoded.z.a) // cid instance
