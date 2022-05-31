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
    getSubjectKeypair: () => Record<string, string>;
};

export type DidKeyPluginConstants = {
    generateContentFromSeed: (seed: Uint8Array) => Promise<JWK[]>;
};
