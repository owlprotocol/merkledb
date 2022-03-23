export async function iterToBuffer(x: AsyncIterable<Uint8Array>) {
    const buffers = [];
    for await (const b of x) {
        buffers.push(b);
    }

    if (buffers.length == 1) return buffers[0];

    return Buffer.concat(buffers);
}

export default iterToBuffer;
