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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResolver = void 0;
const varint_1 = __importDefault(require("varint"));
const multibase_1 = __importDefault(require("multibase"));
const secp256k1 = __importStar(require("./secp256k1"));
const ed25519 = __importStar(require("./ed25519"));
const DID_LD_JSON = 'application/did+ld+json';
const DID_JSON = 'application/did+json';
const prefixToDriverMap = {
    0xe7: secp256k1,
    0xed: ed25519,
};
function getResolver() {
    return {
        key: async (did, parsed, r, options) => {
            const contentType = options.accept || DID_JSON;
            const response = {
                didResolutionMetadata: { contentType },
                didDocument: null,
                didDocumentMetadata: {},
            };
            try {
                const multicodecPubKey = multibase_1.default.decode(parsed.id);
                const keyType = varint_1.default.decode(multicodecPubKey);
                const pubKeyBytes = multicodecPubKey.slice(varint_1.default.decode.bytes);
                const doc = await prefixToDriverMap[keyType].keyToDidDoc(pubKeyBytes, parsed.id);
                if (contentType === DID_LD_JSON) {
                    doc['@context'] = 'https://w3id.org/did/v1';
                    response.didDocument = doc;
                }
                else if (contentType === DID_JSON) {
                    response.didDocument = doc;
                }
                else {
                    delete response.didResolutionMetadata.contentType;
                    response.didResolutionMetadata.error = 'representationNotSupported';
                }
            }
            catch (e) {
                response.didResolutionMetadata.error = 'invalidDid';
                response.didResolutionMetadata.message = e.toString();
            }
            return response;
        },
    };
}
exports.getResolver = getResolver;
exports.default = { getResolver };
//# sourceMappingURL=index.js.map