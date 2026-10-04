import { describe, expect, it } from 'vitest';
import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import {
    ALL_FIXTURES,
    obv3FoodAllergenPractice,
    obv3FoodAllergenFacilitator,
    obv3FoodAllergenPracticeFr,
    obv3PhishingTransfer,
    customCourseEnrollment,
    customExamAccommodation,
    clrMixedRolePortfolio,
} from '../fixtures';
import { prepareFixture } from '../prepare';

type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown): JsonRecord => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Expected a credential object');
    }
    return value as JsonRecord;
};
const asRecords = (value: unknown): JsonRecord[] => {
    if (!Array.isArray(value)) throw new Error('Expected a credential array');
    return value.map(asRecord);
};
const subjectOf = (credential: JsonRecord): JsonRecord => asRecord(credential.credentialSubject);
const achievementOf = (credential: JsonRecord): JsonRecord =>
    asRecord(subjectOf(credential).achievement);

const fixtures = [
    obv3FoodAllergenPractice,
    obv3FoodAllergenFacilitator,
    obv3FoodAllergenPracticeFr,
    obv3PhishingTransfer,
    customCourseEnrollment,
    customExamAccommodation,
    clrMixedRolePortfolio,
];

const expectResultReferences = (credential: JsonRecord): void => {
    const descriptions = asRecords(achievementOf(credential).resultDescription);
    const byId = new Map(descriptions.map(description => [description.id, description]));
    expect(byId.size).toBe(descriptions.length);
    for (const result of asRecords(subjectOf(credential).result)) {
        const description = byId.get(result.resultDescription);
        expect(description).toBeDefined();
        if (!description) throw new Error('Missing result description');
        if (result.achievedLevel || description.requiredLevel) {
            const levels = asRecords(description.rubricCriterionLevel);
            if (result.achievedLevel) {
                expect(levels.some(level => level.id === result.achievedLevel)).toBe(true);
            }
            if (description.requiredLevel) {
                expect(levels.some(level => level.id === description.requiredLevel)).toBe(true);
            }
        }
    }
};

describe('Curated example coverage', () => {
    it.each(fixtures)('$id is registered once, validated, and unsigned', fixture => {
        expect(ALL_FIXTURES.filter(entry => entry.id === fixture.id)).toEqual([fixture]);
        expect(fixture.source).toBe('synthetic');
        expect(fixture.signed).toBe(false);
        expect(fixture.validity).toBe('valid');
        expect(fixture.validator).toBeDefined();
        expect(fixture.validator?.safeParse(fixture.credential).success).toBe(true);
        expect(fixture.credential.proof).toBeUndefined();
    });

    it.each([obv3FoodAllergenPractice, obv3FoodAllergenPracticeFr])(
        '$id expresses RubricScore within the declared range',
        fixture => {
            const subject = subjectOf(fixture.credential);
            const [description] = asRecords(achievementOf(fixture.credential).resultDescription);
            const [result] = asRecords(subject.result);
            expect(description.resultType).toBe('RubricScore');
            expect(description).toMatchObject({ valueMin: '0', valueMax: '4', requiredValue: '3' });
            expect(result).toMatchObject({ value: '4', status: 'Completed' });
            expect(Number(result.value)).toBeGreaterThanOrEqual(Number(description.requiredValue));
            expect(Number(result.value)).toBeLessThanOrEqual(Number(description.valueMax));
            expect(subject.role).toBe('learner');
            expectResultReferences(fixture.credential);
        }
    );

    it('keeps French text, scoring, alignment, and counterpart identities consistent', () => {
        const english = achievementOf(obv3FoodAllergenPractice.credential);
        const french = achievementOf(obv3FoodAllergenPracticeFr.credential);
        expect(french.inLanguage).toBe('fr');
        expect(french.name).toContain('Prévention');
        expect(asRecord(french.criteria).narrative).toContain('Repère');
        expect(french.alignment).toEqual(english.alignment);
        const [englishScore] = asRecords(english.resultDescription);
        const [frenchScore] = asRecords(french.resultDescription);
        expect(frenchScore).toMatchObject({
            resultType: englishScore.resultType,
            valueMin: englishScore.valueMin,
            valueMax: englishScore.valueMax,
            requiredValue: englishScore.requiredValue,
        });
        expect(french.id).not.toBe(english.id);
        expect(frenchScore.id).not.toBe(englishScore.id);
        expect(obv3FoodAllergenPracticeFr.credential.id).not.toBe(
            obv3FoodAllergenPractice.credential.id
        );
        expect(subjectOf(obv3FoodAllergenPracticeFr.credential).id).toBe(
            subjectOf(obv3FoodAllergenPractice.credential).id
        );
    });

    it('assesses the matched facilitator as an instructor, separately from learner practice', () => {
        const instructor = subjectOf(obv3FoodAllergenFacilitator.credential);
        const learner = subjectOf(obv3FoodAllergenPractice.credential);
        const achievement = asRecord(instructor.achievement);
        expect(instructor.id).toBe(learner.id);
        expect(instructor.role).toBe('instructor');
        expect(achievement.description).toContain('Assesses teaching performance');
        expect(asRecords(achievement.alignment).map(alignment => alignment.targetName)).toEqual([
            'Instructing',
        ]);
        expect(asRecords(achievement.resultDescription)[0].resultType).toBe('PerformanceLevel');
        expectResultReferences(obv3FoodAllergenFacilitator.credential);
    });

    it('preserves achieved-level-only and raw-score branches in the same project', () => {
        const [level, score] = asRecords(subjectOf(obv3PhishingTransfer.credential).result);
        expect(level.achievedLevel).toBeDefined();
        expect(level).not.toHaveProperty('value');
        expect(score.value).toBe('9');
        expect(score).not.toHaveProperty('achievedLevel');
        expect(
            asRecords(achievementOf(obv3PhishingTransfer.credential).resultDescription).map(
                description => description.resultType
            )
        ).toEqual(['RubricCriterionLevel', 'RawScore']);
        expectResultReferences(obv3PhishingTransfer.credential);
    });

    it.each([customCourseEnrollment, customExamAccommodation])(
        '$id remains a custom administrative claim with no achievement',
        fixture => {
            const subject = subjectOf(fixture.credential);
            expect(fixture.spec).toBe('custom');
            expect(fixture.profile).toBe('generic');
            expect(subject.designation).toBeDefined();
            expect(subject.claimRole).toBeDefined();
            expect(subject.claimScope).toBeDefined();
            expect(subject).not.toHaveProperty('achievement');
            expect(subject).not.toHaveProperty('result');
            expect(subject).not.toHaveProperty('diagnosis');
            const context = fixture.credential['@context'];
            expect(Array.isArray(context)).toBe(true);
            if (!Array.isArray(context)) throw new Error('Expected inline context');
            const terms = asRecord(context[1]);
            expect(terms[fixture.credential.type[1]]).toBeDefined();
        }
    );

    it('keeps mixed CLR roles, mirrored definitions, and canonical achievement references', () => {
        expect(clrMixedRolePortfolio.credential['@context']).toEqual([
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ]);
        const subject = subjectOf(clrMixedRolePortfolio.credential);
        const children = asRecords(subject.verifiableCredential);
        expect(children).toHaveLength(3);
        expect(new Set(children.map(child => child.id)).size).toBe(3);
        expect(children.map(child => subjectOf(child).role)).toEqual([
            'learner',
            'learner',
            'instructor',
        ]);
        expect(subject.achievement).toEqual(children.map(achievementOf));
        const achievementIds = new Set(children.map(child => achievementOf(child).id));
        const credentialIds = new Set(children.map(child => child.id));
        for (const association of asRecords(subject.association)) {
            expect(association.type).toBe('Association');
            expect(achievementIds.has(association.sourceId)).toBe(true);
            expect(achievementIds.has(association.targetId)).toBe(true);
            expect(credentialIds.has(association.sourceId)).toBe(false);
            expect(credentialIds.has(association.targetId)).toBe(false);
        }
        for (const child of children) {
            expect(subjectOf(child).id).toBe(subject.id);
            expect(child.proof).toBeUndefined();
            expect(UnsignedAchievementCredentialValidator.safeParse(child).success).toBe(true);
            expectResultReferences(child);
        }
    });

    it('prepares CLR children together without changing source data or child issuer claims', () => {
        const before = JSON.stringify(clrMixedRolePortfolio.credential);
        const originalSubject = subjectOf(clrMixedRolePortfolio.credential);
        const originalChildren = asRecords(originalSubject.verifiableCredential);
        const prepared = prepareFixture(clrMixedRolePortfolio, {
            issuerDid: 'did:example:portfolio-test-issuer',
            subjectDid: 'did:example:portfolio-test-subject',
            validFrom: '2026-10-04T12:00:00Z',
            freshIds: true,
        });
        expect(asRecord(prepared.issuer).id).toBe('did:example:portfolio-test-issuer');
        expect(prepared.validFrom).toBe('2026-10-04T12:00:00Z');
        const subject = subjectOf(prepared);
        expect(subject.id).toBe('did:example:portfolio-test-subject');
        expect(prepared.id).not.toBe(clrMixedRolePortfolio.credential.id);
        const children = asRecords(subject.verifiableCredential);
        for (const [index, child] of children.entries()) {
            expect(subjectOf(child).id).toBe(subject.id);
            expect(child.id).not.toBe(originalChildren[index].id);
            expect(child.issuer).toEqual(originalChildren[index].issuer);
            expect(child.validFrom).toBe(originalChildren[index].validFrom);
            expect(child.proof).toBeUndefined();
            expectResultReferences(child);
        }
        expect(subject.achievement).toEqual(children.map(achievementOf));
        expect(subject.association).toEqual(originalSubject.association);
        expect(JSON.stringify(clrMixedRolePortfolio.credential)).toBe(before);
    });
});
