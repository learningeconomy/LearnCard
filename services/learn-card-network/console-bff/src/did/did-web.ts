export type DidDocument = {
    '@context': string[];
    id: string;
    verificationMethod: Array<{
        id: string;
        type: 'JsonWebKey2020';
        controller: string;
        publicKeyJwk: JsonWebKey;
    }>;
    authentication: string[];
    assertionMethod: string[];
};

export function didWebFromDomain(domain: string, profileId: string): string {
    const encodedDomain = domain.replace(':', '%3A');

    return `did:web:${encodedDomain}:p:${profileId}`;
}

// did:web resolution (W3C): segments after the domain map to URL path segments + /did.json;
// a bare-domain DID resolves at /.well-known/did.json. The served path MUST derive from the
// DID string this way or external resolvers will 404.
export function deriveDidWebPath(did: string): string {
    const parts = did.split(':');

    if (parts[0] !== 'did' || parts[1] !== 'web' || parts.length < 3) {
        throw new Error(`Not a did:web DID: ${did}`);
    }

    const pathSegments = parts.slice(3).map(decodeURIComponent);

    if (pathSegments.length === 0) return '/.well-known/did.json';

    return `/${pathSegments.join('/')}/did.json`;
}

export function buildManagedDidDocument(did: string, publicKeyJwk: JsonWebKey): DidDocument {
    const keyId = `${did}#key-1`;
    const { d: _d, ...publicOnly } = publicKeyJwk as Record<string, unknown>;

    return {
        '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://w3id.org/security/suites/jws-2020/v1',
        ],
        id: did,
        verificationMethod: [
            {
                id: keyId,
                type: 'JsonWebKey2020',
                controller: did,
                publicKeyJwk: publicOnly as JsonWebKey,
            },
        ],
        authentication: [keyId],
        assertionMethod: [keyId],
    };
}
