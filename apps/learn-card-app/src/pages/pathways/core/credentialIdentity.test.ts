import { describe, expect, it } from 'vitest';

import { extractCredentialIdentity } from './credentialIdentity';
import type { VcLike } from './outcomeMatcher';

describe('extractCredentialIdentity — types + issuer + credentialId', () => {
    it('normalises a string `type` into a single-element array', () => {
        const identity = extractCredentialIdentity({ type: 'OpenBadgeCredential' });

        expect(identity.types).toContain('OpenBadgeCredential');
    });

    it('includes raw + prefix-stripped variants for every type', () => {
        const identity = extractCredentialIdentity({
            type: ['ceterms:CertificationCredential', 'OpenBadgeCredential'],
        });

        expect(identity.types).toEqual(
            expect.arrayContaining([
                'ceterms:CertificationCredential',
                'CertificationCredential',
                'OpenBadgeCredential',
            ]),
        );
    });

    it('extracts an issuer DID from both string and object shapes', () => {
        expect(
            extractCredentialIdentity({ issuer: 'did:web:aws.example' }).issuerDid,
        ).toBe('did:web:aws.example');

        expect(
            extractCredentialIdentity({
                issuer: { id: 'did:web:coursera.example', name: 'Coursera' },
            }).issuerDid,
        ).toBe('did:web:coursera.example');
    });

    it('returns null issuer when the field is missing or malformed', () => {
        expect(extractCredentialIdentity({}).issuerDid).toBeNull();
        expect(extractCredentialIdentity({ issuer: {} as any }).issuerDid).toBeNull();
    });

    it('captures the W3C `id` field when present', () => {
        expect(
            extractCredentialIdentity({ id: 'urn:uuid:vc-1', type: 'Foo' }).credentialId,
        ).toBe('urn:uuid:vc-1');

        expect(extractCredentialIdentity({ type: 'Foo' }).credentialId).toBeNull();
    });
});

describe('extractCredentialIdentity — OBv3 achievement + alignments', () => {
    it('extracts achievement.id from an object-shaped achievement', () => {
        const vc: VcLike = {
            type: ['OpenBadgeCredential'],
            credentialSubject: {
                achievement: { id: 'https://badges.example/ach/aws-clf' },
            },
        };

        expect(extractCredentialIdentity(vc).obAchievementId).toBe(
            'https://badges.example/ach/aws-clf',
        );
    });

    it('extracts achievement.id from the first entry of an array-shaped achievement', () => {
        const vc: VcLike = {
            type: ['OpenBadgeCredential'],
            credentialSubject: {
                achievement: [
                    { id: 'https://badges.example/ach/aws-clf' },
                    { id: 'https://badges.example/ach/aws-sap' },
                ],
            },
        };

        expect(extractCredentialIdentity(vc).obAchievementId).toBe(
            'https://badges.example/ach/aws-clf',
        );
    });

    it('flattens alignments targetUrls across achievements and dedupes them', () => {
        const vc: VcLike = {
            credentialSubject: {
                achievement: [
                    {
                        alignments: [
                            { targetUrl: 'https://rsd.example/iam' },
                            { targetUrl: 'https://rsd.example/iam' },
                        ],
                    },
                    {
                        alignments: [{ targetUrl: 'https://rsd.example/vpc' }],
                    },
                ],
            },
        };

        expect(extractCredentialIdentity(vc).obAlignments).toEqual([
            'https://rsd.example/iam',
            'https://rsd.example/vpc',
        ]);
    });

    it('leaves obAchievementId / obAlignments undefined when absent', () => {
        const identity = extractCredentialIdentity({ type: 'VerifiableCredential' });

        expect(identity.obAchievementId).toBeUndefined();
        expect(identity.obAlignments).toBeUndefined();
    });
});

describe('extractCredentialIdentity — CTDL CTID', () => {
    it('pulls a bare CTID from `ctid`', () => {
        const vc: VcLike = {
            ctid: 'ce-abcdef01-2345-6789-abcd-ef0123456789',
        } as VcLike;

        expect(extractCredentialIdentity(vc).ctdlCtid).toBe(
            'ce-abcdef01-2345-6789-abcd-ef0123456789',
        );
    });

    it('pulls a CTID embedded in a Credential Engine URL', () => {
        const vc: VcLike = {
            sourceUri:
                'https://credentialregistry.org/resources/ce-abcdef01-2345-6789-abcd-ef0123456789',
        } as VcLike;

        expect(extractCredentialIdentity(vc).ctdlCtid).toBe(
            'ce-abcdef01-2345-6789-abcd-ef0123456789',
        );
    });

    it('normalises CTID casing to lowercase', () => {
        const vc: VcLike = {
            ctid: 'CE-ABCDEF01-2345-6789-ABCD-EF0123456789',
        } as VcLike;

        expect(extractCredentialIdentity(vc).ctdlCtid).toBe(
            'ce-abcdef01-2345-6789-abcd-ef0123456789',
        );
    });

    it('leaves ctdlCtid undefined when no CTID pattern is found', () => {
        expect(extractCredentialIdentity({ id: 'urn:uuid:not-a-ctid' }).ctdlCtid).toBeUndefined();
    });
});

describe('extractCredentialIdentity — skill tags', () => {
    it('harvests tags from VC.tag, subject.tag, and achievement.tag', () => {
        const vc: VcLike = {
            credentialSubject: {
                tag: ['iam'],
                achievement: {
                    tag: ['least-privilege'],
                    alignments: [
                        { targetCode: 'RSD:cross-account' },
                    ],
                },
            },
        } as VcLike;

        const identity = extractCredentialIdentity(vc);

        expect(identity.skillTags).toEqual(
            expect.arrayContaining(['iam', 'least-privilege', 'RSD:cross-account']),
        );
    });

    it('dedupes tags that appear in multiple places', () => {
        const vc: VcLike = {
            credentialSubject: { tag: ['iam', 'iam', 'IAM'] },
        } as VcLike;

        const identity = extractCredentialIdentity(vc);

        // Dedup is exact — 'iam' and 'IAM' differ, matcher handles
        // case-insensitivity separately.
        expect(identity.skillTags).toEqual(['iam', 'IAM']);
    });

    it('leaves skillTags undefined when no source supplies tags', () => {
        expect(extractCredentialIdentity({ type: 'Foo' }).skillTags).toBeUndefined();
    });
});

describe('extractCredentialIdentity — provenance hints', () => {
    it('applies publisher-supplied boostUri and overrides any VC guess', () => {
        const vc: VcLike = { type: 'OpenBadgeCredential' };

        const identity = extractCredentialIdentity(vc, {
            boostUri: 'boost:aws-iam-deep-dive',
        });

        expect(identity.boostUri).toBe('boost:aws-iam-deep-dive');
    });

    it('preserves the raw VC on the identity for escape-hatch matchers', () => {
        const vc: VcLike = { type: 'Foo', custom: 'bar' };

        expect(extractCredentialIdentity(vc).raw).toBe(vc);
    });
});
