import { toString } from 'uint8arrays/to-string';
import { fromString } from 'uint8arrays/from-string';
export * from './random-string.util.js';
const B64 = 'base64pad';
const B64_URL = 'base64url';
export function encodeBase64(bytes) {
    return toString(bytes, B64);
}
export function encodeBase64Url(bytes) {
    return toString(bytes, B64_URL);
}
export function decodeBase64(s) {
    return fromString(s, B64);
}
export function base64urlToJSON(s) {
    return JSON.parse(toString(fromString(s, B64_URL)));
}
export function fromDagJWS(jws) {
    if (jws.signatures.length > 1)
        throw new Error('Cant convert to compact jws');
    return `${jws.signatures[0].protected}.${jws.payload}.${jws.signatures[0].signature}`;
}
export function didWithTime(did, atTime) {
    if (atTime) {
        const versionTime = atTime.toISOString().split('.')[0] + 'Z';
        return `${did}?versionTime=${versionTime}`;
    }
    else {
        return did;
    }
}
export function extractControllers(controllerProperty) {
    if (controllerProperty) {
        if (Array.isArray(controllerProperty)) {
            return controllerProperty;
        }
        else {
            return [controllerProperty];
        }
    }
    else {
        return [];
    }
}
//# sourceMappingURL=utils.js.map