import crypto from 'isomorphic-webcrypto';

if (typeof window === 'undefined') globalThis.crypto = crypto;

export default crypto;
