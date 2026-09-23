import { describe, expect, it } from 'vitest';

import { getBundle, getFixture, isCredentialFixture, prepareFixture } from '../index';

const collectContexts = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(collectContexts);
    if (!value || typeof value !== 'object') return [];

    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
        key === '@context' && Array.isArray(nested)
            ? nested.filter((context): context is string => typeof context === 'string')
            : collectContexts(nested)
    );
};

describe('student credential bundle', () => {
    it('resolves only the Afterschool Program Mentor credential', () => {
        const bundle = getBundle('student');

        expect(bundle.entries.map(entry => entry.fixtureId)).toEqual([
            'obv3/student-afterschool-program-mentor',
        ]);

        const [entry] = bundle.entries;
        if (!entry) throw new Error('Student bundle is empty');

        const fixture = getFixture(entry.fixtureId);
        expect(isCredentialFixture(fixture)).toBe(true);
        if (!isCredentialFixture(fixture)) throw new Error(`${entry.fixtureId} is not a VC`);

        const credential = prepareFixture(fixture, {
            issuerDid: 'did:web:demo.example:users:hillvalleyhigh',
            subjectDid: 'did:example:student',
            freshIds: false,
        });

        expect(fixture.validity).toBe('valid');
        expect(fixture.validator?.safeParse(credential).success ?? true).toBe(true);
        expect(collectContexts(credential)).toEqual([
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://ctx.learncard.com/boosts/1.0.3.json',
        ]);
        expect(collectContexts(credential).some(context => context.startsWith('lcn:'))).toBe(false);
        expect(credential.type).toEqual([
            'VerifiableCredential',
            'OpenBadgeCredential',
            'BoostCredential',
        ]);
        expect(credential.name).toBe('Afterschool Program Mentor');
        expect(credential.credentialSubject).toMatchObject({
            type: ['AchievementSubject'],
            achievement: {
                name: 'Afterschool Program Mentor',
                achievementType: 'ext:LCA_CUSTOM:Social Badge:Community_Champ',
                image: 'https://cdn.filestackcontent.com/7hs6fs2Qgurpw2wSjuDx',
                alignment: [
                    { targetName: 'Personal Integrity' },
                    { targetName: 'Interpersonal Relationships' },
                    { targetName: 'Teamwork/Team-Oriented' },
                    { targetName: 'Trustworthy' },
                    { targetName: 'Scheduling' },
                ],
            },
        });
    });
});
