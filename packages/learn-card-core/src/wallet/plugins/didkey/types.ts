import { KeyPair } from '../didkit/types';

/** @group DidKey Plugin */
export type Algorithm = 'ed25519' | 'secp256k1';

/** @group DidKey Plugin */
export type DependentMethods<T extends string> = {
    generateEd25519KeyFromBytes: (bytes: Uint8Array) => KeyPair;
    generateSecp256k1KeyFromBytes: (bytes: Uint8Array) => KeyPair;
    keyToDid: (type: T, keypair: KeyPair) => string;
};

/** @group DidKey Plugin */
export type JWK = {
    id: string;
    type: string | string[];
    controller?: string;
    publicKeyJwk?: any;
    privateKeyJwk?: any;
    '@context': string[];
    name: string;
    image: string;
    description: string;
    tags: string[];
    value?: string;
    generatedFrom?: [string];
};

/** @group DidKey Plugin */
export type DidKeyPluginMethods<DidMethod extends string> = {
    getSubjectDid: (type: DidMethod) => string;
    getSubjectKeypair: (type?: Algorithm) => {
        kty: string;
        crv: string;
        x: string;
        y?: string;
        d: string;
    };
    getKey: () => string;
};
