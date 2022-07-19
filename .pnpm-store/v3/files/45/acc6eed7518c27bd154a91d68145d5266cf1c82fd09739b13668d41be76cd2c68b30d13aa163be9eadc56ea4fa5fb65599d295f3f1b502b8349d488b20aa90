"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyToDidDoc = void 0;
const u8a = __importStar(require("uint8arrays"));
const ed25519_1 = require("@stablelib/ed25519");
function encodeKey(key) {
    const bytes = new Uint8Array(key.length + 2);
    bytes[0] = 0xec;
    bytes[1] = 0x01;
    bytes.set(key, 2);
    return `z${u8a.toString(bytes, 'base58btc')}`;
}
function keyToDidDoc(pubKeyBytes, fingerprint) {
    const did = `did:key:${fingerprint}`;
    const keyId = `${did}#${fingerprint}`;
    const x25519PubBytes = ed25519_1.convertPublicKeyToX25519(pubKeyBytes);
    const x25519KeyId = `${did}#${encodeKey(x25519PubBytes)}`;
    return {
        id: did,
        verificationMethod: [
            {
                id: keyId,
                type: 'Ed25519VerificationKey2018',
                controller: did,
                publicKeyBase58: u8a.toString(pubKeyBytes, 'base58btc'),
            },
        ],
        authentication: [keyId],
        assertionMethod: [keyId],
        capabilityDelegation: [keyId],
        capabilityInvocation: [keyId],
        keyAgreement: [
            {
                id: x25519KeyId,
                type: 'X25519KeyAgreementKey2019',
                controller: did,
                publicKeyBase58: u8a.toString(x25519PubBytes, 'base58btc'),
            },
        ],
    };
}
exports.keyToDidDoc = keyToDidDoc;
//# sourceMappingURL=ed25519.js.map