import { Plugin } from '@learncard/core';
import { JWK } from '@learncard/types';

/** @group DidKey Plugin */
export type Algorithm = 'ed25519' | 'secp256k1';

/** @group DidKey Plugin */
export type DependentMethods<DidMethod extends string> = {
    generateEd25519KeyFromBytes: (bytes: Uint8Array) => JWK;
    generateSecp256k1KeyFromBytes: (bytes: Uint8Array) => JWK;
    keyToDid: (method: DidMethod, keypair: JWK) => string;
};

/** @group DidKey Plugin */
export type DidKeyPluginMethods<DidMethod extends string> = {
    getSubjectDid: (method?: DidMethod) => string;
    getSubjectKeypair: (algorithm?: Algorithm) => JWK;
    getKey: () => string;
};

/** @group DidKey Plugin */
export type DidKeyPlugin<DidMethod extends string = string> = Plugin<
    'DID Key',
    'id',
    DidKeyPluginMethods<DidMethod>,
    any,
    DependentMethods<DidMethod>
>;
