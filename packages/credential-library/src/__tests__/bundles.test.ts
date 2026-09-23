import { KnownAchievementTypeValidator } from '@learncard/types';
import { describe, expect, it } from 'vitest';

import { getBundle, getFixture, isCredentialFixture, prepareFixture } from '../index';

const STANDARD_CONTEXTS = new Set([
    'https://www.w3.org/ns/credentials/v2',
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
]);

const PROPRIETARY_FIELDS = new Set([
    'address',
    'attachments',
    'boostId',
    'boostID',
    'display',
    'groupID',
    'skills',
]);

const collectContexts = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(collectContexts);
    if (!value || typeof value !== 'object') return [];

    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
        key === '@context' && Array.isArray(nested)
            ? nested.filter((context): context is string => typeof context === 'string')
            : collectContexts(nested)
    );
};

const collectPropertyValues = (value: unknown, property: string): unknown[] => {
    if (Array.isArray(value)) {
        return value.flatMap(nested => collectPropertyValues(nested, property));
    }
    if (!value || typeof value !== 'object') return [];

    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => [
        ...(key === property ? [nested] : []),
        ...collectPropertyValues(nested, property),
    ]);
};

const collectProprietaryFields = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(collectProprietaryFields);
    if (!value || typeof value !== 'object') return [];

    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => [
        ...(PROPRIETARY_FIELDS.has(key) ? [key] : []),
        ...collectProprietaryFields(nested),
    ]);
};

const collectSubjectIds = (credential: unknown): unknown[] =>
    collectPropertyValues(credential, 'credentialSubject').flatMap(subject => {
        const subjects = Array.isArray(subject) ? subject : [subject];

        return subjects.map(currentSubject =>
            currentSubject && typeof currentSubject === 'object'
                ? (currentSubject as Record<string, unknown>).id
                : undefined
        );
    });

describe('student credential bundle', () => {
    it('prepares every manifest entry as a standards-pure credential', () => {
        const bundle = getBundle('student');
        const fixtureIds = bundle.entries.map(entry => entry.fixtureId);
        let backgroundImageHintCount = 0;

        expect(bundle.entries).toHaveLength(33);
        expect(new Set(fixtureIds).size).toBe(fixtureIds.length);
        expect(bundle.entries.some(entry => entry.fixtureId.startsWith('clr/'))).toBe(true);
        expect(new Set(bundle.entries.map(entry => entry.issuer.profileId)).size).toBeGreaterThan(
            1
        );

        for (const entry of bundle.entries) {
            expect(entry.issuer.profileId).toMatch(/^sample-/);

            const fixture = getFixture(entry.fixtureId);
            expect(isCredentialFixture(fixture)).toBe(true);
            if (!isCredentialFixture(fixture)) {
                throw new Error(`${entry.fixtureId} is not a credential fixture`);
            }

            const sourceCredential = fixture.credential as Record<string, unknown>;
            expect(sourceCredential).not.toHaveProperty('id');
            expect(sourceCredential).not.toHaveProperty('proof');
            expect(sourceCredential).not.toHaveProperty('credentialStatus');
            expect(sourceCredential).not.toHaveProperty('image');
            expect(collectProprietaryFields(sourceCredential)).toEqual([]);

            const serializedCredential = JSON.stringify(sourceCredential);
            expect(serializedCredential).not.toContain('ctx.learncard.com');
            expect(serializedCredential).not.toContain('BoostCredential');
            expect(serializedCredential).not.toContain('"BoostID"');

            const contexts = collectContexts(sourceCredential);
            expect(contexts.length).toBeGreaterThan(0);
            expect(contexts.every(context => STANDARD_CONTEXTS.has(context))).toBe(true);

            const achievementTypes = collectPropertyValues(sourceCredential, 'achievementType');
            expect(achievementTypes.length).toBeGreaterThan(0);
            achievementTypes.forEach(achievementType => {
                expect(KnownAchievementTypeValidator.safeParse(achievementType).success).toBe(true);
            });

            backgroundImageHintCount += collectPropertyValues(sourceCredential, 'tag').filter(
                tags =>
                    Array.isArray(tags) &&
                    tags.some(
                        tag =>
                            typeof tag === 'string' &&
                            tag.startsWith('lc:bgImage:https://cdn.filestackcontent.com/')
                    )
            ).length;

            const issuerDid = `did:web:demo.example:users:${entry.issuer.profileId}`;
            const credential = prepareFixture(fixture, {
                issuerDid,
                subjectDid: 'did:example:prepared-student',
                freshIds: false,
            });

            expect(fixture.validity).toBe('valid');
            expect(fixture.validator?.safeParse(credential).success ?? true).toBe(true);
            expect(credential.name).toBe(entry.name ?? sourceCredential.name);
            expect(credential.issuer).toMatchObject({ id: issuerDid });
            expect(new Set(collectSubjectIds(credential))).toEqual(
                new Set(['did:example:prepared-student'])
            );
        }

        expect(backgroundImageHintCount).toBe(26);
    });

    it('preserves the supplied Capstone Project badge presentation as OBv3 tags', () => {
        const fixture = getFixture('obv3/student-capstone-project');
        if (!isCredentialFixture(fixture)) throw new Error('Capstone Project fixture is missing');

        const subject = fixture.credential.credentialSubject as Record<string, unknown>;
        const achievement = subject.achievement as Record<string, unknown>;

        expect(achievement.achievementType).toBe('Assignment');
        expect(achievement.image).toBe('https://cdn.filestackcontent.com/W6nqpwFySGO5EwFi4dAk');
        expect(achievement.tag).toEqual(
            expect.arrayContaining([
                'lc:category:Accomplishment',
                'lc:subtype:Project',
                'lc:displayType:badge',
                'lc:bgImage:https://cdn.filestackcontent.com/OQWyjlSauKQAD3Z2qwEw',
            ])
        );
    });

    it('preserves the supplied ID artwork and issuer marks as OBv3 tags', () => {
        const expectations = [
            {
                fixtureId: 'obv3/student-world-scouting-troop-id',
                idBackgroundImage: 'https://cdn.filestackcontent.com/SyKchHHLRucuS087I4rE',
                idIssuerThumbnail: 'https://cdn.filestackcontent.com/KsarfGXWS2uR4xmqEeDD',
            },
            {
                fixtureId: 'obv3/student-hill-valley-high-school-student-id',
                idBackgroundImage: 'https://cdn.filestackcontent.com/cKTNAyZ9RGF4oUGTRh2r',
                idIssuerThumbnail: 'https://cdn.filestackcontent.com/Otu9MBWYSemRxEKJQxAB',
            },
            {
                fixtureId: 'obv3/student-motlow-college-id',
                idBackgroundImage: 'https://cdn.filestackcontent.com/CnqU0q7xQoOxkwQMliz4',
                idIssuerThumbnail: 'https://cdn.filestackcontent.com/mSjAUhi3Rw2BH2pp4Nah',
            },
        ];

        for (const expectation of expectations) {
            const fixture = getFixture(expectation.fixtureId);
            if (!isCredentialFixture(fixture)) {
                throw new Error(`${expectation.fixtureId} fixture is missing`);
            }

            const subject = fixture.credential.credentialSubject as Record<string, unknown>;
            const achievement = subject.achievement as Record<string, unknown>;

            expect(achievement.tag).toEqual(
                expect.arrayContaining([
                    `lc:idBackgroundImage:${expectation.idBackgroundImage}`,
                    `lc:idIssuerThumbnail:${expectation.idIssuerThumbnail}`,
                    'lc:idDimBackgroundImage:true',
                ])
            );
        }
    });

    it('preserves all authoritative CLR records and the official identifier context', () => {
        const fixture = getFixture('clr/student-official-academic-transcript');
        if (!isCredentialFixture(fixture)) throw new Error('Student CLR fixture is missing');

        const transcriptEntry = getBundle('student').entries.find(
            entry => entry.fixtureId === 'clr/student-official-academic-transcript'
        );
        expect(transcriptEntry?.issuer.profileId).toBe('sample-redwood-valley-university');
        expect(fixture.credential.issuer).toMatchObject({
            id: 'did:web:network.learncard.com:users:redwoodvalley2',
        });

        const subject = fixture.credential.credentialSubject as Record<string, unknown>;
        const context = subject['@context'];
        const embeddedCredentials = subject.verifiableCredential as Record<string, unknown>[];
        const typographyCourse = embeddedCredentials.find(credential => {
            const embeddedSubject = credential.credentialSubject as Record<string, unknown>;
            const achievement = embeddedSubject.achievement as Record<string, unknown>;

            return achievement.humanCode === 'IMD 120';
        });

        expect(context).toEqual({
            identifier: {
                '@id': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#identifier-1',
                '@type': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Identifier',
                '@container': '@set',
            },
        });
        expect(embeddedCredentials).toHaveLength(35);
        expect(typographyCourse).toBeDefined();
        expect(
            (
                (typographyCourse?.credentialSubject as Record<string, unknown>)
                    .achievement as Record<string, unknown>
            ).name
        ).toBe('Typography and Layout');
    });
});
