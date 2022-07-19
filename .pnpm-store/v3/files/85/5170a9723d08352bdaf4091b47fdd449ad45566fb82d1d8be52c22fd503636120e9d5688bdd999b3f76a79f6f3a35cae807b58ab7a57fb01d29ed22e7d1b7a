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
function keyToDidDoc(pubKeyBytes, fingerprint) {
    const did = `did:key:${fingerprint}`;
    const keyId = `${did}#${fingerprint}`;
    return {
        id: did,
        verificationMethod: [
            {
                id: keyId,
                type: 'Secp256k1VerificationKey2018',
                controller: did,
                publicKeyBase58: u8a.toString(pubKeyBytes, 'base58btc'),
            },
        ],
        authentication: [keyId],
        assertionMethod: [keyId],
        capabilityDelegation: [keyId],
        capabilityInvocation: [keyId],
    };
}
exports.keyToDidDoc = keyToDidDoc;
//# sourceMappingURL=secp256k1.js.map