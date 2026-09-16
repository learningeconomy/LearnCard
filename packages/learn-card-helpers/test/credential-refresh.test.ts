import { describe, it, expect } from 'vitest';

import {
    getSupportedRefreshService,
    getCredentialIssuerId,
    getCredentialEffectiveTime,
    canonicalizeCredentialContent,
    canonicalizeCredentialJson,
    credentialContentsEqual,
    getManagedRefreshServices,
    prepareManagedRefreshContext,
    injectManagedRefreshService,
    MANAGED_REFRESH_SERVICE_CONTEXT,
} from '../src';

const issuerDid = 'did:example:issuer';

const vcdm11Credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:uuid:cred-1',
    type: ['VerifiableCredential'],
    issuer: issuerDid,
    issuanceDate: '2026-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:holder' },
};

const vcdm2Credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    id: 'urn:uuid:cred-2',
    type: ['VerifiableCredential'],
    issuer: { id: issuerDid, name: 'Issuer' },
    validFrom: '2026-02-01T00:00:00Z',
    credentialSubject: { id: 'did:example:holder' },
};

describe('getCredentialIssuerId', () => {
    it('returns a string issuer unchanged', () => {
        expect(getCredentialIssuerId(vcdm11Credential)).toBe(issuerDid);
    });

    it('normalizes an object issuer to its id', () => {
        expect(getCredentialIssuerId(vcdm2Credential)).toBe(issuerDid);
    });

    it('returns undefined for a missing issuer', () => {
        expect(getCredentialIssuerId({})).toBeUndefined();
    });
});

describe('getCredentialEffectiveTime', () => {
    it('reads issuanceDate from a VCDM 1.1 credential', () => {
        expect(getCredentialEffectiveTime(vcdm11Credential)).toBe(
            Date.parse('2026-01-01T00:00:00Z')
        );
    });

    it('prefers validFrom from a VCDM 2.0 credential', () => {
        expect(getCredentialEffectiveTime(vcdm2Credential)).toBe(
            Date.parse('2026-02-01T00:00:00Z')
        );
    });

    it('falls back to issuanceDate when validFrom is absent', () => {
        const { validFrom: _validFrom, ...vc } = {
            ...vcdm2Credential,
            issuanceDate: '2026-01-15T00:00:00Z',
        };

        expect(getCredentialEffectiveTime(vc)).toBe(Date.parse('2026-01-15T00:00:00Z'));
    });

    it('returns undefined when no effective timestamp exists', () => {
        expect(getCredentialEffectiveTime({})).toBeUndefined();
    });
});

describe('getSupportedRefreshService', () => {
    const managedService = {
        id: 'https://refresh.example.com/refresh/abc123',
        type: '1EdTechCredentialRefresh',
    };
    const unsupportedService = { id: 'https://example.com/other', type: 'SomeOtherService' };

    it('selects the separately typed encrypted managed service', () => {
        const service = { ...managedService, type: 'LearnCardCredentialRefresh2026' };
        expect(getSupportedRefreshService({ refreshService: service })).toEqual(service);
    });

    it('returns the single supported refresh service', () => {
        const vc = { ...vcdm2Credential, refreshService: managedService };

        expect(getSupportedRefreshService(vc)).toEqual(managedService);
    });

    it('returns the single supported refresh service from a one-item array', () => {
        const vc = { ...vcdm2Credential, refreshService: [managedService] };

        expect(getSupportedRefreshService(vc)).toEqual(managedService);
    });

    it('skips an unsupported first entry and selects the supported second entry', () => {
        const vc = {
            ...vcdm2Credential,
            refreshService: [unsupportedService, managedService],
        };

        expect(getSupportedRefreshService(vc)).toEqual(managedService);
    });

    it('returns undefined when no service is supported', () => {
        const vc = { ...vcdm2Credential, refreshService: unsupportedService };

        expect(getSupportedRefreshService(vc)).toBeUndefined();
    });

    it('returns undefined when no refreshService exists', () => {
        expect(getSupportedRefreshService(vcdm2Credential)).toBeUndefined();
    });
});

describe('canonicalizeCredentialContent', () => {
    it('recursively sorts object keys', () => {
        const input = {
            b: 1,
            a: { d: 2, c: { f: 3, e: 4 } },
        };

        expect(Object.keys(canonicalizeCredentialContent(input))).toEqual(['a', 'b']);

        const a = canonicalizeCredentialContent(input).a;

        expect(Object.keys(a)).toEqual(['c', 'd']);
        expect(Object.keys(a.c)).toEqual(['e', 'f']);
    });

    it('preserves array ordering', () => {
        const input = { type: ['Zebra', 'Apple', 'Mango'] };

        expect(canonicalizeCredentialContent(input).type).toEqual(['Zebra', 'Apple', 'Mango']);
    });
});

describe('canonicalizeCredentialJson', () => {
    it('produces identical JSON regardless of key order', () => {
        const a = { b: 1, a: { y: 2, x: 3 } };
        const b = { a: { x: 3, y: 2 }, b: 1 };

        expect(canonicalizeCredentialJson(a)).toBe(canonicalizeCredentialJson(b));
    });
});

describe('credentialContentsEqual', () => {
    const base = {
        ...vcdm2Credential,
        proof: {
            type: 'Ed25519Signature2020',
            created: '2026-02-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:example:issuer#key-1',
            jws: 'signature-a',
        },
    };

    it('is proof-insensitive: different proofs with equal content are equal', () => {
        const other = {
            ...base,
            proof: {
                type: 'Ed25519Signature2020',
                created: '2026-03-01T00:00:00Z',
                proofPurpose: 'assertionMethod',
                verificationMethod: 'did:example:issuer#key-1',
                jws: 'completely-different-signature',
            },
        };

        expect(credentialContentsEqual(base, other)).toBe(true);
    });

    it('detects content changes beneath the proof', () => {
        const other = {
            ...base,
            credentialSubject: { id: 'did:example:holder', status: 'final' },
        };

        expect(credentialContentsEqual(base, other)).toBe(false);
    });

    it('treats a missing proof and a present proof as equal content', () => {
        const { proof: _proof, ...withoutProof } = base;

        expect(credentialContentsEqual(base, withoutProof)).toBe(true);
    });
});

describe('managed refresh context preparation', () => {
    const managedService = {
        id: 'https://network.learncard.test/api/credential-refreshes/refresh-123',
        type: 'LearnCardCredentialRefresh2026' as const,
        authorization: { type: 'LearnCardDIDAuth' },
    };

    const standardService = {
        id: 'https://example.org/refresh/1',
        type: '1EdTechCredentialRefresh' as const,
    };

    const v2Contexts = [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
        'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
    ];

    const managedCredential = (extra: Record<string, unknown> = {}) => ({
        '@context': [...v2Contexts],
        id: 'urn:uuid:cred-1',
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer',
        validFrom: '2026-01-01T00:00:00Z',
        credentialSubject: { id: 'did:example:holder' },
        ...extra,
    });

    it('returns the identical credential untouched when no managed service is present', () => {
        const credential = managedCredential({ refreshService: standardService });
        const snapshot = JSON.parse(JSON.stringify(credential));

        expect(prepareManagedRefreshContext(credential)).toBe(credential);
        expect(credential).toEqual(snapshot);
    });

    it('appends the full inline fragment for a managed service with a string context', () => {
        const credential = {
            ...managedCredential({ refreshService: managedService }),
            '@context': 'https://www.w3.org/2018/credentials/v1',
        };

        const prepared = prepareManagedRefreshContext(credential);

        expect(prepared).not.toBe(credential);
        expect(prepared['@context']).toEqual([
            'https://www.w3.org/2018/credentials/v1',
            MANAGED_REFRESH_SERVICE_CONTEXT,
        ]);
        expect(prepared.refreshService).toEqual(managedService);
    });

    it('keeps standard 1EdTech services unchanged and appends the managed service to an array', () => {
        const credential = managedCredential({ refreshService: [standardService, managedService] });

        const prepared = prepareManagedRefreshContext(credential);

        expect(prepared.refreshService).toEqual([standardService, managedService]);
        expect((prepared['@context'] as unknown[]).at(-1)).toEqual(MANAGED_REFRESH_SERVICE_CONTEXT);
    });

    it('works against VCDM 1.1, VCDM 2.0, OBv3, and CLR base contexts', () => {
        const v11 = {
            ...managedCredential({ refreshService: managedService }),
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
            ],
            issuanceDate: '2026-01-01T00:00:00Z',
            validFrom: undefined,
        };

        for (const credential of [v11, managedCredential({ refreshService: managedService })]) {
            const prepared = prepareManagedRefreshContext(credential);

            expect((prepared['@context'] as unknown[]).at(-1)).toEqual(
                MANAGED_REFRESH_SERVICE_CONTEXT
            );
        }
    });

    it('is idempotent across repeat calls', () => {
        const credential = managedCredential({ refreshService: managedService });

        const once = prepareManagedRefreshContext(credential);
        const twice = prepareManagedRefreshContext(once);

        expect(twice).toEqual(once);
        expect(twice['@context']).toHaveLength(once['@context'].length);
    });

    it('does not duplicate the fragment when an equivalent mapping already exists', () => {
        const credential = managedCredential({
            refreshService: managedService,
            extraInline: { arbitrary: true },
        });
        credential['@context'] = [
            ...v2Contexts,
            {
                LearnCardCredentialRefresh2026:
                    'https://learncard.com/refresh#LearnCardCredentialRefresh2026',
                authorization: {
                    '@id': 'https://purl.imsglobal.org/spec/ob/v3p0#authorization',
                    '@context': {
                        LearnCardDIDAuth: 'https://docs.learncard.com/definitions#LearnCardDIDAuth',
                    },
                },
            },
        ];

        const prepared = prepareManagedRefreshContext(credential);

        expect(prepared).toBe(credential);
        expect(prepared['@context']).toHaveLength(v2Contexts.length + 1);
    });

    it('completes only the terms missing from an incomplete existing mapping', () => {
        const credential = managedCredential({ refreshService: managedService });
        credential['@context'] = [
            ...v2Contexts,
            {
                LearnCardCredentialRefresh2026:
                    'https://learncard.com/refresh#LearnCardCredentialRefresh2026',
            },
        ];

        const prepared = prepareManagedRefreshContext(credential);
        const fragment = (prepared['@context'] as Record<string, unknown>[]).at(-1) as Record<
            string,
            unknown
        >;

        expect(Object.keys(fragment)).toEqual(['authorization']);
    });

    it('completes only the nested term when authorization matches but LearnCardDIDAuth is missing', () => {
        const credential = managedCredential({ refreshService: managedService });
        credential['@context'] = [
            ...v2Contexts,
            {
                LearnCardCredentialRefresh2026:
                    'https://learncard.com/refresh#LearnCardCredentialRefresh2026',
                authorization: 'https://purl.imsglobal.org/spec/ob/v3p0#authorization',
            },
        ];

        const prepared = prepareManagedRefreshContext(credential);
        const fragment = (prepared['@context'] as Record<string, unknown>[]).at(-1) as Record<
            string,
            unknown
        >;

        expect(Object.keys(fragment)).toEqual(['LearnCardDIDAuth']);
    });

    it('throws a clear error on a conflicting term mapping', () => {
        const credential = managedCredential({ refreshService: managedService });
        credential['@context'] = [
            ...v2Contexts,
            {
                LearnCardCredentialRefresh2026:
                    'https://evil.example/other#LearnCardCredentialRefresh2026',
            },
        ];

        expect(() => prepareManagedRefreshContext(credential)).toThrow(
            /LearnCardCredentialRefresh2026/
        );
    });

    it('throws a clear error on a conflicting nested LearnCardDIDAuth mapping', () => {
        const credential = managedCredential({ refreshService: managedService });
        credential['@context'] = [
            ...v2Contexts,
            {
                authorization: {
                    '@id': 'https://purl.imsglobal.org/spec/ob/v3p0#authorization',
                    '@context': { LearnCardDIDAuth: 'https://evil.example/other#LearnCardDIDAuth' },
                },
            },
        ];

        expect(() => prepareManagedRefreshContext(credential)).toThrow(/LearnCardDIDAuth/);
    });

    it('never mutates the input credential', () => {
        const credential = managedCredential({ refreshService: managedService });
        const snapshot = JSON.parse(JSON.stringify(credential));

        prepareManagedRefreshContext(credential);

        expect(credential).toEqual(snapshot);
    });
});

describe('injectManagedRefreshService', () => {
    const managedService = {
        id: 'https://network.learncard.test/api/credential-refreshes/refresh-123',
        type: 'LearnCardCredentialRefresh2026' as const,
        authorization: { type: 'LearnCardDIDAuth' },
    };

    const standardService = {
        id: 'https://example.org/refresh/1',
        type: '1EdTechCredentialRefresh' as const,
    };

    const baseCredential = {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        id: 'urn:uuid:cred-1',
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer',
        validFrom: '2026-01-01T00:00:00Z',
        credentialSubject: { id: 'did:example:holder' },
    };

    it('sets the managed service and prepares the context on a credential without one', () => {
        const injected = injectManagedRefreshService(baseCredential, managedService);

        expect(injected.refreshService).toEqual(managedService);
        expect((injected['@context'] as unknown[]).at(-1)).toEqual(MANAGED_REFRESH_SERVICE_CONTEXT);
    });

    it('keeps an existing standard service and makes the managed service primary', () => {
        const injected = injectManagedRefreshService(
            { ...baseCredential, refreshService: standardService },
            managedService
        );

        expect(injected.refreshService).toEqual([managedService, standardService]);
    });

    it('is idempotent when the same managed service is injected twice', () => {
        const once = injectManagedRefreshService(baseCredential, managedService);
        const twice = injectManagedRefreshService(once, managedService);

        expect(twice).toEqual(once);
        expect(twice.refreshService).toEqual(managedService);
    });

    it('rejects injecting a second managed service with a different id', () => {
        const otherManaged = {
            ...managedService,
            id: 'https://network.learncard.test/api/credential-refreshes/refresh-999',
        };

        const withService = injectManagedRefreshService(baseCredential, managedService);

        expect(() => injectManagedRefreshService(withService, otherManaged)).toThrow(
            /different managed refresh service/i
        );
    });

    it('rejects an invalid managed service payload', () => {
        expect(() =>
            injectManagedRefreshService(baseCredential, {
                id: 'https://example.com/refresh',
                type: '1EdTechCredentialRefresh',
            })
        ).toThrow();
    });
});

describe('getManagedRefreshServices', () => {
    it('finds managed services within object and array refreshService values', () => {
        const managed = {
            id: 'https://network.learncard.test/api/credential-refreshes/refresh-1',
            type: 'LearnCardCredentialRefresh2026' as const,
        };

        expect(getManagedRefreshServices({ refreshService: managed })).toEqual([managed]);
        expect(
            getManagedRefreshServices({
                refreshService: [
                    { id: 'https://example.org/refresh/1', type: '1EdTechCredentialRefresh' },
                    managed,
                ],
            })
        ).toEqual([managed]);
        expect(getManagedRefreshServices({ refreshService: { id: 'x', type: 'Other' } })).toEqual(
            []
        );
        expect(getManagedRefreshServices({})).toEqual([]);
    });
});
