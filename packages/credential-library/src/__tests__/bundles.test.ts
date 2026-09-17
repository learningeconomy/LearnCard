import { describe, expect, it } from 'vitest';

import { getBundle, getFixture, getFixtures, isCredentialFixture, prepareFixture } from '../index';

const collectContexts = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(collectContexts);
    if (!value || typeof value !== 'object') return [];

    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
        key === '@context' && Array.isArray(nested)
            ? nested.filter((context): context is string => typeof context === 'string')
            : collectContexts(nested)
    );
};

const getAchievementIds = (credential: unknown): string[] => {
    if (!credential || typeof credential !== 'object' || !('credentialSubject' in credential)) {
        throw new Error('Credential is missing credentialSubject');
    }

    const subject = credential.credentialSubject;
    if (!subject || typeof subject !== 'object' || !('achievement' in subject)) {
        throw new Error('Credential subject is missing achievement');
    }

    const achievements = Array.isArray(subject.achievement)
        ? subject.achievement
        : [subject.achievement];

    return achievements.map(achievement => {
        if (!achievement || typeof achievement !== 'object' || !('id' in achievement)) {
            throw new Error('Achievement is missing an id');
        }
        if (typeof achievement.id !== 'string') throw new Error('Achievement id is not a string');

        return achievement.id;
    });
};

describe('student credential bundle', () => {
    it('resolves every manifest entry to a standards-pure, valid fixture', () => {
        const bundle = getBundle('student');

        expect(bundle.entries.map(entry => entry.fixtureId)).toEqual([
            'obv3/student-civic-leadership',
            'obv3/student-web-development',
            'obv3/student-community-impact',
            'clr/student-transcript',
        ]);

        for (const entry of bundle.entries) {
            const fixture = getFixture(entry.fixtureId);
            expect(isCredentialFixture(fixture)).toBe(true);
            if (!isCredentialFixture(fixture)) throw new Error(`${entry.fixtureId} is not a VC`);
            const credential = prepareFixture(fixture, {
                issuerDid: 'did:web:demo.example:users:demo-school',
                subjectDid: 'did:example:student',
                freshIds: false,
            });

            expect(fixture.validity).toBe('valid');
            expect(collectContexts(credential).some(context => context.startsWith('lcn:'))).toBe(
                false
            );
            expect(fixture.validator?.safeParse(credential).success ?? true).toBe(true);
            if (credential.id?.startsWith('urn:uuid:')) {
                expect(credential.id).toMatch(
                    /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
                );
            }
        }
    });

    it('advertises alignment only for fixtures that contain alignments', () => {
        const alignedFixtureIds = getFixtures({ features: ['alignment'] }).map(
            fixture => fixture.id
        );

        expect(alignedFixtureIds).toContain('obv3/student-civic-leadership');
        expect(alignedFixtureIds).toContain('obv3/student-web-development');
        expect(alignedFixtureIds).not.toContain('obv3/student-community-impact');
    });

    it('keeps the transcript linked to all three standalone achievements', () => {
        const transcriptFixture = getFixture('clr/student-transcript');
        if (!isCredentialFixture(transcriptFixture))
            throw new Error('Student transcript is not a VC');
        const transcriptAchievementIds = getAchievementIds(transcriptFixture.credential);
        const standaloneAchievementIds = getBundle('student')
            .entries.filter(entry => entry.fixtureId.startsWith('obv3/'))
            .map(entry => {
                const fixture = getFixture(entry.fixtureId);
                if (!isCredentialFixture(fixture))
                    throw new Error(`${entry.fixtureId} is not a VC`);

                const [achievementId] = getAchievementIds(fixture.credential);
                if (!achievementId) throw new Error(`${entry.fixtureId} has no achievement`);

                return achievementId;
            });

        expect(transcriptAchievementIds).toEqual(standaloneAchievementIds);
    });
});
