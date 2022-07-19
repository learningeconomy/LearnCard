import { CID } from 'multiformats/cid';
import varint from 'varint';
import { decode as decodeMultiHash } from 'multiformats/hashes/digest';
export function readVarint(bytes) {
    const value = varint.decode(bytes);
    const readLength = varint.decode.bytes;
    const remainder = bytes.slice(readLength);
    return [value, remainder, readLength];
}
function isCidVersion(input) {
    return input === 0 || input === 1;
}
export function readCid(bytes) {
    const result = readCidNoThrow(bytes);
    if (result instanceof Error) {
        throw result;
    }
    return result;
}
export function readCidNoThrow(bytes) {
    const [cidVersion, cidVersionRemainder] = readVarint(bytes);
    if (!isCidVersion(cidVersion)) {
        return new Error(`Unknown CID version ${cidVersion}`);
    }
    const [codec, codecRemainder] = readVarint(cidVersionRemainder);
    const [, mhCodecRemainder, mhCodecLength] = readVarint(codecRemainder);
    const [mhLength, , mhLengthLength] = readVarint(mhCodecRemainder);
    const multihashBytes = codecRemainder.slice(0, mhCodecLength + mhLengthLength + mhLength);
    const multihashBytesRemainder = codecRemainder.slice(mhCodecLength + mhLengthLength + mhLength);
    return [CID.create(cidVersion, codec, decodeMultiHash(multihashBytes)), multihashBytesRemainder];
}
//# sourceMappingURL=reading-bytes.js.map