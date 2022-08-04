import crypto from 'isomorphic-webcrypto';

if (typeof window === 'undefined' && !globalThis.crypto) globalThis.crypto = crypto;

export default crypto;
