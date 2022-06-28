import crypto from 'isomorphic-webcrypto';

if (!window) {
    globalThis.crypto = crypto;
}

export default crypto;
