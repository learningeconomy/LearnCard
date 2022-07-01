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
