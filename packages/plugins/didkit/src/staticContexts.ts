/**
 * JSON-LD contexts served from JS before falling through to the WASM `contextLoader`.
 *
 * The WASM binary already bundles most well-known contexts (VC v1/v2, OBv3 3.0.x,
 * CLR `context.json`, LearnCard boosts, ...). Anything it does *not* know is fetched
 * over the network from inside WASM on every verify/issue call. Adding a context here
 * avoids that fetch without rebuilding the Rust/WASM.
 *
 * Only add exact copies of the published document: aliasing to a "close enough"
 * context changes the canonical RDF and breaks signature verification.
 */

/** https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json (verbatim) */
const CLR_V2P0_2_0_1 = {
    '@context': {
        id: '@id',
        type: '@type',
        ClrCredential: {
            '@id': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#ClrCredential',
            '@context': {
                id: '@id',
                type: '@type',
                partial: {
                    '@id': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#partial',
                    '@type': 'xsd:boolean',
                },
            },
        },
        ClrSubject: {
            '@id': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#ClrSubject',
            '@context': {
                id: '@id',
                type: '@type',
                cred: 'https://www.w3.org/2018/credentials#',
                obi: 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#',
                achievement: {
                    '@id': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#achievement',
                    '@type': 'obi:Achievement',
                    '@container': '@set',
                },
                association: {
                    '@id': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#association',
                    '@type': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#Association',
                    '@container': '@set',
                },
                verifiableCredential: {
                    '@id': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#verifiableCredential',
                    '@type': 'cred:verifiableCredential',
                    '@container': '@set',
                },
                identifier: {
                    '@id': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#identifier-1',
                    '@type': 'obi:Identifier',
                    '@container': '@set',
                },
            },
        },
        Association: {
            '@id': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#Association',
            '@context': {
                associationType: {
                    '@id': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#AssociationType',
                },
                sourceId: {
                    '@id': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#sourceId',
                    '@type': 'xsd:anyURI',
                },
                targetId: {
                    '@id': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#targetId',
                    '@type': 'xsd:anyURI',
                },
            },
        },
    },
} as const;

export const STATIC_CONTEXTS: Readonly<Record<string, Record<string, unknown>>> = {
    'https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json': CLR_V2P0_2_0_1,
};

export const getStaticContext = (url: string): Record<string, unknown> | undefined =>
    STATIC_CONTEXTS[url];
