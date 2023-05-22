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
} from './didkit/index';

import { DIDKitPlugin, DidMethod } from './types';

/**
 *
 * @group Plugins
 */
export const getDidKitPlugin = async (
    input?: InitInput | Promise<InitInput>
): Promise<DIDKitPlugin> => {
    await init(input);

    const memoizedDids: Partial<Record<DidMethod, string>> = {};

    return {
        name: 'DIDKit',
        displayName: 'DIDKit',
        description:
            'Provides an interface to DIDKit, which allows for the generation of key material, as well as signing and verifying credentials and presentations',
        methods: {
            generateEd25519KeyFromBytes: (_learnCard, bytes) =>
                JSON.parse(generateEd25519KeyFromBytes(bytes)),

            generateSecp256k1KeyFromBytes: (_learnCard, bytes) =>
                JSON.parse(generateSecp256k1KeyFromBytes(bytes)),

            keyToDid: (_learnCard, type, keypair) => {
                const memoizedDid = memoizedDids[type];

                if (!memoizedDid) {
                    const did = keyToDID(type, JSON.stringify(keypair));

                    memoizedDids[type] = did;

                    return did;
                }

                return memoizedDid;
            },

            keyToVerificationMethod: async (_learnCard, type, keypair) =>
                keyToVerificationMethod(type, JSON.stringify(keypair)),

            didToVerificationMethod: async (_learnCard, did) => didToVerificationMethod(did),

            issueCredential: async (_learnCard, credential, options, keypair) =>
                JSON.parse(
                    await issueCredential(
                        JSON.stringify(credential),
                        JSON.stringify(options),
                        JSON.stringify(keypair)
                    )
                ),

            verifyCredential: async (_learnCard, credential, options = {}) =>
                JSON.parse(
                    await verifyCredential(JSON.stringify(credential), JSON.stringify(options))
                ),

            issuePresentation: async (_learnCard, presentation, options, keypair) => {
                const isJwt = options.proofFormat === 'jwt';

                const result = await issuePresentation(
                    JSON.stringify(presentation),
                    JSON.stringify(options),
                    JSON.stringify(keypair)
                );

                return isJwt ? result : JSON.parse(result);
            },

            verifyPresentation: async (_learnCard, presentation, options = {}) => {
                const isJwt = typeof presentation === 'string';

                return JSON.parse(
                    await verifyPresentation(
                        isJwt ? presentation : JSON.stringify(presentation),
                        JSON.stringify(options)
                    )
                );
            },

            contextLoader: async (_learnCard, url) => JSON.parse(await contextLoader(url)),

            resolveDid: async (_learnCard, did, inputMetadata = {}) =>
                JSON.parse(await resolveDID(did, JSON.stringify(inputMetadata))),

            didResolver: async (_learnCard, did, inputMetadata = {}) =>
                JSON.parse(await didResolver(did, JSON.stringify(inputMetadata))),
        },
    };
};
