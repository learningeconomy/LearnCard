import { describe, it, expect } from 'vitest';

import {
    getSupportedRefreshService,
    getCredentialIssuerId,
    getCredentialEffectiveTime,
    canonicalizeCredentialContent,
    canonicalizeCredentialJson,
    credentialContentsEqual,
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
        expect(getCredentialIssuerId(vcdm11Credential as any)).toBe(issuerDid);
    });

    it('normalizes an object issuer to its id', () => {
        expect(getCredentialIssuerId(vcdm2Credential as any)).toBe(issuerDid);
    });

    it('returns undefined for a missing issuer', () => {
        expect(getCredentialIssuerId({} as any)).toBeUndefined();
    });
});

describe('getCredentialEffectiveTime', () => {
    it('reads issuanceDate from a VCDM 1.1 credential', () => {
        expect(getCredentialEffectiveTime(vcdm11Credential as any)).toBe(
            Date.parse('2026-01-01T00:00:00Z')
        );
    });

    it('prefers validFrom from a VCDM 2.0 credential', () => {
        expect(getCredentialEffectiveTime(vcdm2Credential as any)).toBe(
            Date.parse('2026-02-01T00:00:00Z')
        );
    });

    it('falls back to issuanceDate when validFrom is absent', () => {
        const vc = { ...vcdm2Credential, issuanceDate: '2026-01-15T00:00:00Z' };
        delete (vc as any).validFrom;

        expect(getCredentialEffectiveTime(vc as any)).toBe(Date.parse('2026-01-15T00:00:00Z'));
    });

    it('returns undefined when no effective timestamp exists', () => {
        expect(getCredentialEffectiveTime({} as any)).toBeUndefined();
    });
});

describe('getSupportedRefreshService', () => {
    const managedService = {
        id: 'https://refresh.example.com/refresh/abc123',
        type: '1EdTechCredentialRefresh',
    };
    const unsupportedService = { id: 'https://example.com/other', type: 'SomeOtherService' };

    it('returns the single supported refresh service', () => {
        const vc = { ...vcdm2Credential, refreshService: managedService };

        expect(getSupportedRefreshService(vc as any)).toEqual(managedService);
    });

    it('returns the single supported refresh service from a one-item array', () => {
        const vc = { ...vcdm2Credential, refreshService: [managedService] };

        expect(getSupportedRefreshService(vc as any)).toEqual(managedService);
    });

    it('skips an unsupported first entry and selects the supported second entry', () => {
        const vc = {
            ...vcdm2Credential,
            refreshService: [unsupportedService, managedService],
        };

        expect(getSupportedRefreshService(vc as any)).toEqual(managedService);
    });

    it('returns undefined when no service is supported', () => {
        const vc = { ...vcdm2Credential, refreshService: unsupportedService };

        expect(getSupportedRefreshService(vc as any)).toBeUndefined();
    });

    it('returns undefined when no refreshService exists', () => {
        expect(getSupportedRefreshService(vcdm2Credential as any)).toBeUndefined();
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

        expect(credentialContentsEqual(base as any, other as any)).toBe(true);
    });

    it('detects content changes beneath the proof', () => {
        const other = {
            ...base,
            credentialSubject: { id: 'did:example:holder', status: 'final' },
        };

        expect(credentialContentsEqual(base as any, other as any)).toBe(false);
    });

    it('treats a missing proof and a present proof as equal content', () => {
        const withoutProof = { ...base };
        delete (withoutProof as any).proof;

        expect(credentialContentsEqual(base as any, withoutProof as any)).toBe(true);
    });
});
