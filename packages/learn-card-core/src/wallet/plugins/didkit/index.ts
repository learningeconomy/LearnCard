import init, {
    InitInput,
    generateEd25519KeyFromBytes,
    generateSecp256k1KeyFromBytes,
    keyToDID,
    keyToVerificationMethod,
    issueCredential,
    verifyCredential,
    issuePresentation,
    verifyPresentation,
    contextLoader,
    resolveDID,
} from '@didkit/index';

import { DidkitPluginMethods, DidMethod } from './types';
import { Plugin } from 'types/wallet';

export * from './types';

/**
 *
 * @group Plugins
 */
export const getDidKitPlugin = async (
    input?: InitInput | Promise<InitInput>
): Promise<Plugin<'DIDKit', DidkitPluginMethods>> => {
    await init(input);

    const memoizedDids: Partial<Record<DidMethod, string>> = {};

    return {
        pluginMethods: {
            generateEd25519KeyFromBytes: (_wallet, bytes) =>
                JSON.parse(generateEd25519KeyFromBytes(bytes)),

            generateSecp256k1KeyFromBytes: (_wallet, bytes) =>
                JSON.parse(generateSecp256k1KeyFromBytes(bytes)),

            keyToDid: (_wallet, type, keypair) => {
                const memoizedDid = memoizedDids[type];

                if (!memoizedDid) {
                    const did = keyToDID(type, JSON.stringify(keypair));

                    memoizedDids[type] = did;

                    return did;
                }

                return memoizedDid;
            },

            keyToVerificationMethod: async (_wallet, type, keypair) =>
                keyToVerificationMethod(type, JSON.stringify(keypair)),

            issueCredential: async (_wallet, credential, options, keypair) =>
                JSON.parse(
                    await issueCredential(
                        JSON.stringify(credential),
                        JSON.stringify(options),
                        JSON.stringify(keypair)
                    )
                ),

            verifyCredential: async (_wallet, credential) =>
                JSON.parse(await verifyCredential(JSON.stringify(credential), '{}')),

            issuePresentation: async (_wallet, presentation, options, keypair) =>
                JSON.parse(
                    await issuePresentation(
                        JSON.stringify(presentation),
                        JSON.stringify(options),
                        JSON.stringify(keypair)
                    )
                ),

            verifyPresentation: async (_wallet, presentation) =>
                JSON.parse(await verifyPresentation(JSON.stringify(presentation), '{}')),

            contextLoader: async (_wallet, url) => JSON.parse(await contextLoader(url)),

            resolveDid: async (_wallet, did) => JSON.parse(await resolveDID(did, '{}')),
        },
    };
};
