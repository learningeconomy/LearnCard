import { KeyPair } from '../didkit/types';

export type Algorithm = 'ed25519' | 'secp256k1';

export type DependentMethods<T extends string> = {
    generateEd25519KeyFromBytes: (bytes: Uint8Array) => KeyPair;
    generateSecp256k1KeyFromBytes: (bytes: Uint8Array) => KeyPair;
    keyToDid: (type: T, keypair: KeyPair) => string;
};

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
