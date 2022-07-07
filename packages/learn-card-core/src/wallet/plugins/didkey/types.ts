import { KeyPair } from '../didkit/types';

export type DependentMethods = {
    generateEd25519KeyFromBytes: (bytes: Uint8Array) => KeyPair;
    keyToDid: (type: string, keypair: KeyPair) => string;
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

export type DidKeyPluginMethods = {
    getSubjectDid: () => string;
    getSubjectKeypair: () => { kty: string; crv: string; x: string; d: string };
    getKey: () => string;
};
