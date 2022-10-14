import { Plugin } from 'types/wallet';
import { JWK } from '@learncard/types';

/** @group DidKey Plugin */
export type Algorithm = 'ed25519' | 'secp256k1';

/** @group DidKey Plugin */
export type DependentMethods<T extends string> = {
    generateEd25519KeyFromBytes: (bytes: Uint8Array) => JWK;
    generateSecp256k1KeyFromBytes: (bytes: Uint8Array) => JWK;
    keyToDid: (type: T, keypair: JWK) => string;
};

/** @group DidKey Plugin */
export type DidKeyPluginMethods<DidMethod extends string> = {
    getSubjectDid: (type: DidMethod) => string;
    getSubjectKeypair: (type?: Algorithm) => JWK;
    getKey: () => string;
};

/** @group DidKey Plugin */
export type DidKeyPlugin<DidMethod extends string = string> = Plugin<
    'DID Key',
    DidKeyPluginMethods<DidMethod>
>;
