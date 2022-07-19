import { generateKeyPairFromSeed, convertSecretKeyToX25519 } from '@stablelib/ed25519';
import { createJWS, decryptJWE, x25519Decrypter, EdDSASigner } from 'did-jwt';
import stringify from 'fast-json-stable-stringify';
import { RPCError, createHandler } from 'rpc-utils';
import * as u8a from 'uint8arrays';
const B64 = 'base64pad';
function toStableObject(obj) {
    return JSON.parse(stringify(obj));
}
export function encodeDID(publicKey) {
    const bytes = new Uint8Array(publicKey.length + 2);
    bytes[0] = 0xed;
    bytes[1] = 0x01;
    bytes.set(publicKey, 2);
    return `did:key:z${u8a.toString(bytes, 'base58btc')}`;
}
function toGeneralJWS(jws) {
    const [protectedHeader, payload, signature] = jws.split('.');
    return {
        payload,
        signatures: [{ protected: protectedHeader, signature }],
    };
}
const sign = async (payload, did, secretKey, protectedHeader = {}) => {
    const kid = `${did}#${did.split(':')[2]}`;
    const signer = EdDSASigner(secretKey);
    const header = toStableObject(Object.assign(protectedHeader, { kid, alg: 'EdDSA' }));
    return createJWS(typeof payload === 'string' ? payload : toStableObject(payload), signer, header);
};
const didMethods = {
    did_authenticate: async ({ did, secretKey }, params) => {
        const response = await sign({
            did,
            aud: params.aud,
            nonce: params.nonce,
            paths: params.paths,
            exp: Math.floor(Date.now() / 1000) + 600,
        }, did, secretKey);
        return toGeneralJWS(response);
    },
    did_createJWS: async ({ did, secretKey }, params) => {
        const requestDid = params.did.split('#')[0];
        if (requestDid !== did)
            throw new RPCError(4100, `Unknown DID: ${did}`);
        const jws = await sign(params.payload, did, secretKey, params.protected);
        return { jws: toGeneralJWS(jws) };
    },
    did_decryptJWE: async ({ secretKey }, params) => {
        const decrypter = x25519Decrypter(convertSecretKeyToX25519(secretKey));
        try {
            const bytes = await decryptJWE(params.jwe, decrypter);
            return { cleartext: u8a.toString(bytes, B64) };
        }
        catch (e) {
            throw new RPCError(-32000, e.message);
        }
    },
};
export class Ed25519Provider {
    constructor(seed) {
        const { secretKey, publicKey } = generateKeyPairFromSeed(seed);
        const did = encodeDID(publicKey);
        const handler = createHandler(didMethods);
        this._handle = async (msg) => await handler({ did, secretKey }, msg);
    }
    get isDidProvider() {
        return true;
    }
    async send(msg) {
        return await this._handle(msg);
    }
}
//# sourceMappingURL=index.js.map