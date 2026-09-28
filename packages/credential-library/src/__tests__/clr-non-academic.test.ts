import { describe, expect, it } from 'vitest';
import {
    UnsignedAchievementCredentialValidator,
    UnsignedClrCredentialValidator,
    UnsignedVCValidator,
} from '@learncard/types';

import { ALL_FIXTURES } from '../fixtures';
import { clrEmploymentRecord } from '../fixtures/clr/employment-record';
import { clrTrainingProviderRecord } from '../fixtures/clr/training-provider-record';
import { clrMilitaryTrainingRecord } from '../fixtures/clr/military-training-record';
import { clrProfessionalOrganizationRecord } from '../fixtures/clr/professional-organization-record';
import { clrLicensingRegulatoryRecord } from '../fixtures/clr/licensing-regulatory-record';
import { clrMixedCareerRecord } from '../fixtures/clr/mixed-career-record';
import { prepareFixture } from '../prepare';
import type { CredentialFixture } from '../types';

type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown): JsonRecord => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Expected a JSON object in a CLR fixture');
    }
    return value as JsonRecord;
};

const asRecords = (value: unknown): JsonRecord[] => {
    if (!Array.isArray(value)) throw new Error('Expected a JSON array in a CLR fixture');
    return value.map(asRecord);
};

const subjectOf = (credential: JsonRecord): JsonRecord => asRecord(credential.credentialSubject);
const achievementOf = (credential: JsonRecord): JsonRecord =>
    asRecord(subjectOf(credential).achievement);
const childrenOf = (credential: JsonRecord): JsonRecord[] =>
    asRecords(subjectOf(credential).verifiableCredential);

const fixtures: CredentialFixture[] = [
    clrEmploymentRecord,
    clrTrainingProviderRecord,
    clrMilitaryTrainingRecord,
    clrProfessionalOrganizationRecord,
    clrLicensingRegulatoryRecord,
    clrMixedCareerRecord,
];
const cases = fixtures.map(fixture => [fixture.id, fixture] as const);

/** Check achievement, result-description and rubric references without network lookups. */
const expectResolvableReferences = (credential: JsonRecord): void => {
    const children = childrenOf(credential);
    const achievementIds = new Set(children.map(child => achievementOf(child).id));
    const childIds = children.map(child => child.id);
    expect(new Set(childIds).size).toBe(childIds.length);

    for (const association of asRecords(subjectOf(credential).association)) {
        // CLR associations target achievement definitions, not credential IDs.
        expect(achievementIds.has(association.sourceId)).toBe(true);
        expect(achievementIds.has(association.targetId)).toBe(true);
    }

    for (const child of children) {
        const descriptions = asRecords(achievementOf(child).resultDescription);
        const byId = new Map(descriptions.map(description => [description.id, description]));
        expect(byId.size).toBe(descriptions.length);

        for (const result of asRecords(subjectOf(child).result)) {
            const description = byId.get(result.resultDescription);
            expect(description).toBeDefined();
            if (!description) throw new Error('Missing referenced result description');
            if (description.resultType === 'Status') expect(result.status).toBeDefined();
            if (result.value !== undefined) expect(typeof result.value).toBe('string');

            const levels = description.rubricCriterionLevel
                ? asRecords(description.rubricCriterionLevel)
                : [];
            if (result.achievedLevel) {
                expect(levels.some(level => level.id === result.achievedLevel)).toBe(true);
            }
            if (description.requiredLevel) {
                expect(levels.some(level => level.id === description.requiredLevel)).toBe(true);
            }
        }
    }
};

describe('LC-2184 non-academic CLR fixtures', () => {
    it.each(cases)('%s is registered exactly once and explicitly unsigned', (_id, fixture) => {
        expect(ALL_FIXTURES.filter(entry => entry.id === fixture.id)).toEqual([fixture]);
        expect(fixture.spec).toBe('clr-v2');
        expect(fixture.signed).toBe(false);
        expect(fixture.validity).toBe('valid'); // Valid unsigned template, not a verified VC.
        expect(fixture.source).toBe('synthetic');
        expect(fixture.credential.proof).toBeUndefined();
        for (const child of childrenOf(fixture.credential)) expect(child.proof).toBeUndefined();
    });

    it.each(cases)(
        '%s passes the shared unsigned CLR and achievement validators',
        (_id, fixture) => {
            expect(UnsignedVCValidator.safeParse(fixture.credential).success).toBe(true);
            expect(UnsignedClrCredentialValidator.safeParse(fixture.credential).success).toBe(true);
            for (const child of childrenOf(fixture.credential)) {
                expect(UnsignedAchievementCredentialValidator.safeParse(child).success).toBe(true);
            }
        }
    );

    it.each(cases)(
        '%s binds every embedded record to the same synthetic learner',
        (_id, fixture) => {
            const parentSubject = subjectOf(fixture.credential);
            expect(parentSubject.id).toBe('did:example:lc2184-alex-morgan');
            for (const child of childrenOf(fixture.credential)) {
                expect(subjectOf(child).id).toBe(parentSubject.id);
            }
        }
    );

    it.each(cases)('%s has resolvable achievement and result references', (_id, fixture) => {
        expectResolvableReferences(fixture.credential);
    });

    it.each(cases)('%s keeps references intact when UUIDs are regenerated', (_id, fixture) => {
        const before = JSON.stringify(fixture.credential);
        const prepared = prepareFixture(fixture, {
            issuerDid: 'did:example:lc2184-test-publisher',
            // Deliberately no subjectDid: prepareFixture is not a recursive child rebinder.
            freshIds: true,
            validFrom: '2026-09-01T12:00:00Z',
        });
        expect(prepared.id).not.toBe(fixture.credential.id);
        expectResolvableReferences(prepared);
        expect(JSON.stringify(fixture.credential)).toBe(before);
    });

    it('keeps non-academic training free of inferred GPA, terms, and academic credits', () => {
        const children = childrenOf(clrTrainingProviderRecord.credential);
        for (const child of children) {
            expect(subjectOf(child).term).toBeUndefined();
            expect(subjectOf(child).creditsEarned).toBeUndefined();
            expect(achievementOf(child).creditsAvailable).toBeUndefined();
            expect(
                asRecords(achievementOf(child).resultDescription).some(
                    description => description.resultType === 'GradePointAverage'
                )
            ).toBe(false);
        }
        const ongoing = children.find(child =>
            asRecords(subjectOf(child).result).some(result => result.status === 'InProgress')
        );
        expect(ongoing).toBeDefined();
        if (!ongoing) throw new Error('Missing ongoing training record');
        expect(subjectOf(ongoing).activityStartDate).toBeDefined();
        expect(subjectOf(ongoing).activityEndDate).toBeUndefined();
    });

    it('includes achieved-level-only results without manufacturing value or completion status', () => {
        for (const fixture of [clrEmploymentRecord, clrMilitaryTrainingRecord]) {
            const results = childrenOf(fixture.credential).flatMap(child =>
                asRecords(subjectOf(child).result)
            );
            expect(
                results.some(
                    result =>
                        typeof result.achievedLevel === 'string' &&
                        result.value === undefined &&
                        result.status === undefined
                )
            ).toBe(true);
        }
    });

    it('retains an expired child without calling the entire licensing collection expired', () => {
        const credential = clrLicensingRegulatoryRecord.credential;
        const snapshot = Date.parse(String(credential.validFrom));
        const children = childrenOf(credential);
        expect(children.some(child => Date.parse(String(child.validUntil)) < snapshot)).toBe(true);
        expect(children.some(child => Date.parse(String(child.validUntil)) > snapshot)).toBe(true);
        expect(Date.parse(String(credential.validUntil))).toBeGreaterThan(snapshot);
        expect(children.some(child => subjectOf(child).licenseNumber === 'SYN-LIC-2184-042')).toBe(
            true
        );
        // No fake status list or cryptographic proof is used to claim real-world standing.
        for (const child of children) expect(child.credentialStatus).toBeUndefined();
    });

    it('keeps course-first mixed records and their multiple issuers', () => {
        const credential = clrMixedCareerRecord.credential;
        const children = childrenOf(credential);
        expect(achievementOf(children[0]!).achievementType).toBe('Course');
        expect(children.map(child => achievementOf(child).achievementType)).toEqual([
            'Course',
            'Achievement',
            'Membership',
            'ApprenticeshipCertificate',
            'Competency',
            'License',
        ]);
        const publisherId = asRecord(credential.issuer).id;
        const childIssuerIds = new Set(children.map(child => asRecord(child.issuer).id));
        expect(childIssuerIds.size).toBe(4);
        expect(childIssuerIds.has(publisherId)).toBe(false);
    });

    it('separates activity end, award, and credential validity dates', () => {
        const work = childrenOf(clrEmploymentRecord.credential)[0]!;
        expect(subjectOf(work).activityEndDate).toBe('2026-06-30T17:00:00Z');
        expect(work.awardedDate).toBe('2026-07-10T12:00:00Z');
        expect(work.validFrom).toBe('2026-08-15T12:00:00Z');
    });

    it('keeps duplicated source credentials identical across independent fixture objects', () => {
        const source = childrenOf(clrProfessionalOrganizationRecord.credential)[0]!;
        const copy = childrenOf(clrMixedCareerRecord.credential).find(
            child => child.id === source.id
        );
        expect(copy).toEqual(source);
        expect(copy).not.toBe(source);
    });
});
