import init, {
    InitInput,
    generateEd25519KeyFromBytes,
    keyToDID,
    keyToVerificationMethod,
    issueCredential,
    verifyCredential,
    issuePresentation,
    verifyPresentation,
} from 'didkit';

import { DidkitPluginMethods } from './types';
import { Plugin } from 'types/wallet';

export const getDidKitPlugin = async (
    input?: InitInput | Promise<InitInput>
): Promise<Plugin<'DIDKit', DidkitPluginMethods>> => {
    await init(input);

    return {
        pluginMethods: {
            generateEd25519KeyFromBytes: (_wallet, bytes) =>
                JSON.parse(generateEd25519KeyFromBytes(bytes)),

            keyToDid: (_wallet, type, keypair) => keyToDID(type, JSON.stringify(keypair)),

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

            issuePresentation: async (presentation, options, keypair) =>
                issuePresentation(
                    JSON.stringify(presentation),
                    JSON.stringify(options),
                    JSON.stringify(keypair)
                ),

            verifyPresentation: async (_wallet, presentation) =>
                JSON.parse(await verifyPresentation(JSON.stringify(presentation), '{}')),
        },
    };
};
