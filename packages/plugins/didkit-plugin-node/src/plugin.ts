import type { InitInput } from '@learncard/types';
import type { DIDKitPlugin, DidMethod } from '@learncard/didkit-plugin';
import type { JWKWithPrivateKey } from '@learncard/types';

// Native addon interface
interface NativeAddon {
    generateEd25519KeyFromBytes(bytes: Buffer): string;
    generateSecp256K1KeyFromBytes(bytes: Buffer): string;
    keyToDid(methodPattern: string, jwkJson: string): string;
    keyToVerificationMethod(methodPattern: string, jwkJson: string): Promise<string>;
    didToVerificationMethod(did: string): Promise<string>;
    resolveDid(did: string, inputMetadata: string): Promise<string>;
    didResolver(did: string, inputMetadata: string): Promise<string>;
    issueCredential(
        credential: string,
        proofOptions: string,
        key: string,
        contextMap: string
    ): Promise<string>;
    verifyCredential(credential: string, proofOptions: string, contextMap: string): Promise<string>;
    issuePresentation(
        presentation: string,
        proofOptions: string,
        key: string,
        contextMap: string
    ): Promise<string>;
    verifyPresentation(
        presentation: string,
        proofOptions: string,
        contextMap: string
    ): Promise<string>;
    contextLoader(url: string): Promise<string>;
    createJwe(cleartext: string, recipients: string[]): Promise<string>;
    decryptJwe(jwe: string, jwks: string[]): Promise<string>;
    createDagJwe(cleartext: string, recipients: string[]): Promise<string>;
    decryptDagJwe(jwe: string, jwks: string[]): Promise<string>;
    clearCache(): Promise<string>;
}

let nativeAddon: NativeAddon | null = null;

function loadNativeAddon(): NativeAddon {
    if (nativeAddon) return nativeAddon;

    try {
        // Load the platform-specific native addon
        // napi-rs generates files like index.linux-x64-gnu.node
        const path = require('path');
        const fs = require('fs');

        const packageRoot = path.join(__dirname, '..');

        // Try to find the platform-specific .node file
        const files = fs.readdirSync(packageRoot);
        const nodeFile = files.find((f: string) => f.startsWith('index.') && f.endsWith('.node'));

        if (!nodeFile) {
            throw new Error(
                'No .node binary found. Run `pnpm build` to compile the native module.'
            );
        }

        nativeAddon = require(path.join(packageRoot, nodeFile)) as NativeAddon;
        return nativeAddon;
    } catch (error) {
        throw new Error(
            `@learncard/didkit-plugin-node: Failed to load native module. ` +
                `Ensure the addon is built for your platform. Original error: ${error}`
        );
    }
}

export const getDidKitPlugin = async (
    _input?: InitInput | Promise<InitInput>,
    _allowRemoteContexts = false
): Promise<DIDKitPlugin> => {
    const native = loadNativeAddon();

    return {
        name: 'DIDKit',
        displayName: 'DIDKit (Native)',
        description:
            'Node-native N-API DIDKit plugin for LearnCard. Provides cryptographic operations without WASM overhead.',
        context: {
            resolveStaticDocument: async (_learnCard, url) => {
                try {
                    const result = await native.contextLoader(url);
                    return JSON.parse(result) || undefined;
                } catch (error) {
                    _learnCard.debug?.(error);
                    return undefined;
                }
            },
        },
        methods: {
            generateEd25519KeyFromBytes: (_learnCard, bytes) => {
                const jwkJson = native.generateEd25519KeyFromBytes(Buffer.from(bytes));
                return JSON.parse(jwkJson) as JWKWithPrivateKey;
            },

            generateSecp256k1KeyFromBytes: (_learnCard, bytes) => {
                const jwkJson = native.generateSecp256K1KeyFromBytes(Buffer.from(bytes));
                return JSON.parse(jwkJson) as JWKWithPrivateKey;
            },

            keyToDid: (_learnCard, type: DidMethod, keypair) => {
                return native.keyToDid(type, JSON.stringify(keypair));
            },

            keyToVerificationMethod: async (_learnCard, type, keypair) => {
                return native.keyToVerificationMethod(type, JSON.stringify(keypair));
            },

            didToVerificationMethod: async (_learnCard, did) => {
                return native.didToVerificationMethod(did);
            },

            issueCredential: async (_learnCard, credential, options, keypair) => {
                const { getDocumentMap } = await import('@learncard/didkit-plugin');
                const contextMap = await getDocumentMap(
                    _learnCard,
                    credential,
                    _allowRemoteContexts
                );
                const result = await native.issueCredential(
                    JSON.stringify(credential),
                    JSON.stringify(options),
                    JSON.stringify(keypair),
                    JSON.stringify(contextMap)
                );
                return JSON.parse(result);
            },

            verifyCredential: async (_learnCard, credential, options = {}) => {
                const { getDocumentMap } = await import('@learncard/didkit-plugin');
                const contextMap = await getDocumentMap(
                    _learnCard,
                    credential,
                    _allowRemoteContexts
                );
                const result = await native.verifyCredential(
                    JSON.stringify(credential),
                    JSON.stringify(options),
                    JSON.stringify(contextMap)
                );
                return JSON.parse(result);
            },

            issuePresentation: async (_learnCard, presentation, options, keypair) => {
                const { getDocumentMap } = await import('@learncard/didkit-plugin');
                const isJwt = options.proofFormat === 'jwt';
                const contextMap = await getDocumentMap(
                    _learnCard,
                    presentation,
                    _allowRemoteContexts
                );
                const result = await native.issuePresentation(
                    JSON.stringify(presentation),
                    JSON.stringify(options),
                    JSON.stringify(keypair),
                    JSON.stringify(contextMap)
                );
                return isJwt ? result : JSON.parse(result);
            },

            verifyPresentation: async (_learnCard, presentation, options = {}) => {
                const { getDocumentMap } = await import('@learncard/didkit-plugin');
                const isJwt = typeof presentation === 'string';
                const contextMap = isJwt
                    ? {}
                    : await getDocumentMap(_learnCard, presentation, _allowRemoteContexts);
                // Filter out proofFormat as it's not part of LinkedDataProofOptions in Rust
                const { proofFormat, ...nativeOptions } = options as any;
                const result = await native.verifyPresentation(
                    isJwt ? presentation : JSON.stringify(presentation),
                    JSON.stringify(nativeOptions),
                    JSON.stringify(contextMap)
                );
                return JSON.parse(result);
            },

            contextLoader: async (_learnCard, url) => {
                try {
                    const result = await native.contextLoader(url);
                    return JSON.parse(result);
                } catch (e) {
                    // Context loading failed, return undefined to allow fallback
                    return undefined;
                }
            },

            resolveDid: async (_learnCard, did, inputMetadata = {}) => {
                const result = await native.resolveDid(did, JSON.stringify(inputMetadata));
                return JSON.parse(result);
            },

            didResolver: async (_learnCard, did, inputMetadata = {}) => {
                const result = await native.didResolver(did, JSON.stringify(inputMetadata));
                return JSON.parse(result);
            },

            createJwe: async (_learnCard, cleartext, recipients) => {
                const result = await native.createJwe(cleartext, recipients);
                return JSON.parse(result);
            },

            decryptJwe: async (_learnCard, jwe, jwks) => {
                return native.decryptJwe(
                    JSON.stringify(jwe),
                    jwks.map((jwk: JWKWithPrivateKey) => JSON.stringify(jwk))
                );
            },

            createDagJwe: async (_learnCard, cleartext, recipients) => {
                const result = await native.createDagJwe(JSON.stringify(cleartext), recipients);
                return JSON.parse(result);
            },

            decryptDagJwe: async (_learnCard, jwe, jwks) => {
                const result = await native.decryptDagJwe(
                    JSON.stringify(jwe),
                    jwks.map((jwk: JWKWithPrivateKey) => JSON.stringify(jwk))
                );
                return JSON.parse(result);
            },

            clearDidWebCache: async () => {
                await native.clearCache();
            },
        },
    };
};
