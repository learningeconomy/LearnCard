import { KeyPair } from '../didkit/types';

export type DependentMethods<T extends string> = {
    generateEd25519KeyFromBytes: (bytes: Uint8Array) => KeyPair;
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

export type DidKeyPluginMethods<T extends string> = {
    getSubjectDid: (type: T) => string;
    getSubjectKeypair: () => { kty: string; crv: string; x: string; d: string };
    getKey: () => string;
};
