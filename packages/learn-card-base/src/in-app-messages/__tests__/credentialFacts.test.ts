import {
    countMatchingCredentials,
    credentialMatches,
    summarizeCredential,
} from '../credentialFacts';

const NOW = Date.parse('2026-10-14T12:00:00Z');

describe('summarizeCredential', () => {
    it('summarizes an OBv3 credential with an object issuer', () => {
        const summary = summarizeCredential(
            'lc:obv3',
            {
                type: ['VerifiableCredential', 'OpenBadgeCredential'],
                issuer: { id: 'did:example:university' },
                validFrom: '2026-10-13T12:00:00Z',
                credentialSubject: {
                    achievement: { achievementType: 'Certificate' },
                },
            },
            'Qualifications'
        );

        expect(summary).toEqual({
            uri: 'lc:obv3',
            category: 'Qualifications',
            types: ['VerifiableCredential', 'OpenBadgeCredential'],
            issuer: 'did:example:university',
            nestedIssuers: [],
            achievementTypes: ['Certificate'],
            issuedAt: '2026-10-13T12:00:00Z',
        });
    });

    it('unwraps boosts and summarizes nested CLR issuers with both issuer shapes', () => {
        const summary = summarizeCredential(
            'lc:clr',
            {
                type: ['VerifiableCredential', 'CertifiedBoostCredential'],
                issuer: 'did:example:wrapper',
                boostCredential: {
                    type: ['VerifiableCredential', 'ClrCredential'],
                    issuer: 'did:example:clr',
                    issuanceDate: '2026-10-12T12:00:00Z',
                    credentialSubject: {
                        verifiableCredential: [
                            {
                                type: ['VerifiableCredential', 'OpenBadgeCredential'],
                                issuer: 'did:example:nested-string',
                                credentialSubject: {
                                    achievement: { achievementType: 'Course' },
                                },
                            },
                            {
                                type: ['VerifiableCredential', 'OpenBadgeCredential'],
                                issuer: { id: 'did:example:nested-object' },
                                credentialSubject: {
                                    achievement: { achievementType: 'Certification' },
                                },
                            },
                        ],
                    },
                },
            },
            'Learning History'
        );

        expect(summary.types).toContain('ClrCredential');
        expect(summary.issuer).toBe('did:example:clr');
        expect(summary.nestedIssuers).toEqual([
            'did:example:nested-string',
            'did:example:nested-object',
        ]);
        expect(summary.achievementTypes).toEqual(['Course', 'Certification']);
        expect(summary.issuedAt).toBe('2026-10-12T12:00:00Z');
    });

    it('never throws for malformed input', () => {
        const circular: Record<string, unknown> = { type: ['ClrCredential'] };

        circular.credentialSubject = { verifiableCredential: [circular] };

        expect(() => summarizeCredential('lc:bad', circular, null)).not.toThrow();
        expect(summarizeCredential('lc:null', null, null).types).toEqual([]);
    });
});

describe('credentialMatches', () => {
    const summary = summarizeCredential(
        'lc:match',
        {
            type: ['VerifiableCredential', 'ClrCredential'],
            issuer: 'did:example:pilot',
            validFrom: '2026-10-07T12:00:00Z',
            credentialSubject: {
                verifiableCredential: [
                    {
                        issuer: { id: 'did:example:nested' },
                        credentialSubject: {
                            achievement: { achievementType: 'Course' },
                        },
                    },
                ],
            },
        },
        'Learning History'
    );

    it('matches every supported field', () => {
        expect(credentialMatches(summary, { issuers: ['did:example:pilot'] }, NOW)).toBe(true);
        expect(credentialMatches(summary, { nestedIssuers: ['did:example:nested'] }, NOW)).toBe(
            true
        );
        expect(credentialMatches(summary, { vcTypes: ['ClrCredential'] }, NOW)).toBe(true);
        expect(credentialMatches(summary, { categories: ['Learning History'] }, NOW)).toBe(true);
        expect(credentialMatches(summary, { achievementTypes: ['Course'] }, NOW)).toBe(true);
        expect(credentialMatches(summary, { issuedWithinDays: 7 }, NOW)).toBe(true);
    });

    it('uses an inclusive issued-within day boundary and rejects missing dates', () => {
        expect(credentialMatches(summary, { issuedWithinDays: 7 }, NOW)).toBe(true);
        expect(credentialMatches(summary, { issuedWithinDays: 6.99 }, NOW)).toBe(false);
        expect(
            credentialMatches({ ...summary, issuedAt: null }, { issuedWithinDays: 7 }, NOW)
        ).toBe(false);
    });

    it('requires all fields on one summary and counts matching summaries', () => {
        const match = {
            issuers: ['did:example:pilot'] as [string],
            vcTypes: ['ClrCredential'] as [string],
        };

        expect(credentialMatches(summary, match, NOW)).toBe(true);
        expect(
            countMatchingCredentials(
                [summary, { ...summary, uri: 'lc:other', issuer: 'did:example:other' }],
                match,
                NOW
            )
        ).toBe(1);
    });
});
