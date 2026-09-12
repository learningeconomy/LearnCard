import init, {
    InitInput,
    generateEd25519KeyFromBytes,
    generateSecp256k1KeyFromBytes,
    keyToDID,
    keyToVerificationMethod,
    didToVerificationMethod,
    issueCredential,
    verifyCredential,
    issuePresentation,
    verifyPresentation,
    contextLoader,
    resolveDID,
    didResolver,
    createJwe,
    decryptJwe,
    createDagJwe,
    decryptDagJwe,
    clearCache,
} from './didkit/index';
import { getDocumentMap } from './helpers';

import { DIDKitPlugin, DidMethod } from './types';

import type { VC } from '@learncard/types';

/**
 j
 * @group Plugins
 */
export const getDidKitPlugin = async (
    input?: InitInput | Promise<InitInput>,
    allowRemoteContexts = false
): Promise<DIDKitPlugin> => {
    await init(input);

    const memoizedDids: Partial<Record<DidMethod, string>> = {};

    return {
        name: 'DIDKit',
        displayName: 'DIDKit',
        description:
            'Provides an interface to DIDKit, which allows for the generation of key material, as well as signing and verifying credentials and presentations',
        context: {
            resolveStaticDocument: async (_learnCard, url) => {
                try {
                    return JSON.parse((await contextLoader(url)) ?? '') || undefined;
                } catch (error) {
                    _learnCard.debug?.(error);

                    return undefined;
                }
            },
        },
        methods: {
            generateEd25519KeyFromBytes: (_learnCard, bytes) =>
                JSON.parse(generateEd25519KeyFromBytes(bytes)),

            generateSecp256k1KeyFromBytes: (_learnCard, bytes) =>
                JSON.parse(generateSecp256k1KeyFromBytes(bytes)),

            keyToDid: (_learnCard, type, keypair) => {
                return keyToDID(type, JSON.stringify(keypair));
            },

            keyToVerificationMethod: async (_learnCard, type, keypair) =>
                keyToVerificationMethod(type, JSON.stringify(keypair)),

            didToVerificationMethod: async (_learnCard, did) => didToVerificationMethod(did),

            issueCredential: async (_learnCard, credential, options, keypair) => {
                const isJwt = options.proofFormat === 'jwt';

                const result = await issueCredential(
                    JSON.stringify(credential),
                    JSON.stringify(options),
                    JSON.stringify(keypair),
                    JSON.stringify(
                        await getDocumentMap(_learnCard, credential, allowRemoteContexts)
                    )
                );

                // DIDKit returns the signed compact serialization for JWT proofs;
                // only linked-data-proof results are JSON objects.
                return (isJwt ? result : JSON.parse(result)) as VC;
            },

            verifyCredential: async (_learnCard, credential, options = {}) => {
                // A compact VC-JWT is an opaque string. Passing it through
                // JSON.stringify would wrap it in quotes and DIDKit would fail to
                // split the JWS, so route raw tokens straight through with JWT
                // options instead of resolving JSON-LD contexts.
                const isJwt = typeof credential === 'string';

                return JSON.parse(
                    await verifyCredential(
                        isJwt ? credential : JSON.stringify(credential),
                        JSON.stringify(options),
                        isJwt
                            ? '{}'
                            : JSON.stringify(
                                  await getDocumentMap(_learnCard, credential, allowRemoteContexts)
                              )
                    )
                );
            },

            issuePresentation: async (_learnCard, presentation, options, keypair) => {
                const isJwt = options.proofFormat === 'jwt';

                const result = await issuePresentation(
                    JSON.stringify(presentation),
                    JSON.stringify(options),
                    JSON.stringify(keypair),
                    JSON.stringify(
                        await getDocumentMap(_learnCard, presentation, allowRemoteContexts)
                    )
                );

                return isJwt ? result : JSON.parse(result);
            },

            verifyPresentation: async (_learnCard, presentation, options = {}) => {
                const isJwt = typeof presentation === 'string';

                return JSON.parse(
                    await verifyPresentation(
                        isJwt ? presentation : JSON.stringify(presentation),
                        JSON.stringify(options),
                        isJwt
                            ? '{}'
                            : JSON.stringify(
                                  await getDocumentMap(
                                      _learnCard,
                                      presentation,
                                      allowRemoteContexts
                                  )
                              )
                    )
                );
            },

            contextLoader: async (_learnCard, url) => {
                try {
                    return JSON.parse((await contextLoader(url)) ?? '') || undefined;
                } catch (error) {
                    _learnCard.debug?.(error);

                    return undefined;
                }
            },

            resolveDid: async (_learnCard, did, inputMetadata = {}) =>
                JSON.parse(await resolveDID(did, JSON.stringify(inputMetadata))),

            didResolver: async (_learnCard, did, inputMetadata = {}) =>
                JSON.parse(await didResolver(did, JSON.stringify(inputMetadata))),

            createJwe: async (_learnCard, cleartext, recipients) =>
                JSON.parse(await createJwe(cleartext, recipients)),

            decryptJwe: async (_learnCard, jwe, jwks) =>
                decryptJwe(
                    JSON.stringify(jwe),
                    jwks.map(jwk => JSON.stringify(jwk))
                ),

            createDagJwe: async (_learnCard, cleartext, recipients) =>
                JSON.parse(await createDagJwe(cleartext as any, recipients)),

            decryptDagJwe: async (_learnCard, jwe, jwks) => {
                // Didkit is serializing numbers as BigInts when crossing the WASM boundary, so we
                // need to convert them back to numbers
                const convertBigIntsToNumbers = (obj: any): any => {
                    if (obj === null || obj === undefined) return obj;

                    // Convert BigInt to Number
                    if (typeof obj === 'bigint') return Number(obj);

                    // Handle arrays
                    if (Array.isArray(obj)) return obj.map(convertBigIntsToNumbers);

                    // Return primitives as-is
                    if (typeof obj !== 'object') return obj;

                    // -- Handle objects --

                    // Quick check if the object has any nested objects that need conversion
                    const hasNestedObjects = Object.values(obj).some(
                        val => typeof val === 'bigint' || (typeof val === 'object' && val !== null)
                    );
                    if (!hasNestedObjects) return obj; // Fast path for simple objects

                    const result: Record<string, any> = {};
                    for (const key in obj) {
                        result[key] = convertBigIntsToNumbers(obj[key]);
                    }
                    return result;
                };

                return convertBigIntsToNumbers(
                    await decryptDagJwe(
                        JSON.stringify(jwe),
                        jwks.map(jwk => JSON.stringify(jwk))
                    )
                );
            },

            clearDidWebCache: async () => {
                await clearCache();
            },
        },
    };
};
