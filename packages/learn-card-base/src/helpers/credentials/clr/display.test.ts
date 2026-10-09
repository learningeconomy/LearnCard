import { describe, expect, it } from 'vitest';

import { createClrTranscriptDisplayModel, normalizeClrTranscriptDisplayModel } from './display';
import { normalizeClrCredential } from './normalize';
import {
    createClrRecordSelection,
    findClrRecordByCanonicalId,
    findClrRecordById,
    getLinkedCompetencies,
} from './relationships';
import { resolveClrRecord } from './selectors';
import { getResultDisplayValue } from './presentation';
import type { ClrJsonObject } from './types';

const achievement = {
    id: 'achievement:shared',
    achievementType: 'Course',
    name: 'Shared course',
    resultDescription: [
        {
            id: 'scale',
            name: 'Proficiency',
            resultType: 'RubricCriterionLevel',
            requiredLevel: 'advanced',
            rubricCriterionLevel: [{ id: 'advanced', name: 'Advanced', points: '3' }],
        },
    ],
};

const assertion = (id: string, result: ClrJsonObject[] = []): ClrJsonObject => ({
    id,
    type: ['VerifiableCredential', 'AchievementCredential'],
    issuer: { id: `issuer:${id}`, name: `Issuer ${id}` },
    awardedDate: '2026-01-15',
    validFrom: '2026-02-01',
    validUntil: '2027-02-01',
    credentialSubject: {
        id: 'learner',
        source: { id: `assessor:${id}` },
        activityStartDate: '2025-10-01',
        activityEndDate: '2026-01-01',
        achievement: { id: achievement.id, creator: { id: `creator:${id}` } },
        result,
    },
});

const collection = (
    children: ClrJsonObject[],
    definitions: ClrJsonObject[] = [achievement]
): ClrJsonObject => ({
    id: 'collection',
    type: ['VerifiableCredential', 'ClrCredential'],
    issuer: { id: 'publisher', name: 'Publisher' },
    credentialSubject: { id: 'learner', achievement: definitions, verifiableCredential: children },
});

describe('canonical CLR display adapter', () => {
    it('preserves result forms and top-level provenance through the displayed course', () => {
        const credential = collection([
            assertion('first', [
                { resultDescription: 'scale', achievedLevel: 'advanced' },
                { status: 'Completed' },
                { value: 0 },
                { value: false },
                { resultDescription: 'missing' },
            ]),
        ]);
        const before = structuredClone(credential);
        const canonical = normalizeClrCredential(credential);
        const model = createClrTranscriptDisplayModel(canonical);
        const [course] = model.courses;

        expect(credential).toEqual(before);
        expect(model.records).toBe(canonical.records);
        expect(course.results).toHaveLength(5);
        expect(course.results.map(getResultDisplayValue)).toEqual([
            'Advanced',
            'Completed',
            0,
            false,
            '—',
        ]);
        expect(course.results[0].value).toBeUndefined();
        expect(course.results[1].value).toBeUndefined();
        expect(course.results[1].status?.value).toBe('Completed');
        expect(course.results[4].resultDescriptionResolved).toBe(false);
        expect(course.results[0].label).toMatchObject({
            value: 'Proficiency',
            sourceKind: 'topLevelAchievement',
            sourcePath: 'credentialSubject.achievement[0].resultDescription[0].name',
        });
        expect(course.results[0].requiredRubricLevel?.name).toBe('Advanced');
        expect(course.name?.sourcePath).toBe('credentialSubject.achievement[0].name');
        expect(canonical.records[0].provenance.issuer?.id?.value).toBe('issuer:first');
        expect(canonical.records[0].provenance.assessor?.id?.value).toBe('assessor:first');
        expect(canonical.records[0].provenance.creator?.id?.value).toBe('creator:first');
        expect(
            Object.fromEntries(
                Object.entries(canonical.records[0].dates).map(([key, field]) => [
                    key,
                    field?.value,
                ])
            )
        ).toEqual({
            activityStart: '2025-10-01',
            activityEnd: '2026-01-01',
            awarded: '2026-01-15',
            validFrom: '2026-02-01',
            validUntil: '2027-02-01',
        });
    });

    it('never resolves an ambiguous achievement alias in associations or record navigation', () => {
        const credential = collection([assertion('first'), assertion('second')]);
        const subject = credential.credentialSubject as ClrJsonObject;
        const model = normalizeClrTranscriptDisplayModel({
            ...credential,
            credentialSubject: {
                ...subject,
                association: [
                    {
                        type: 'Association',
                        associationType: 'isRelatedTo',
                        sourceId: achievement.id,
                        targetId: 'first',
                    },
                    {
                        type: ['Association'],
                        associationType: 'precedes',
                        sourceId: 'first',
                        targetId: 'second',
                    },
                ],
            },
        });

        expect(model.courses).toHaveLength(2);
        expect(model.associations[0].sourceResolution).toBe('ambiguous');
        expect(model.associations[0].sourceRecordId).toBeUndefined();
        expect(findClrRecordById(model, achievement.id)).toBeUndefined();
        expect(resolveClrRecord(model.canonical, achievement.id).resolution).toBe('ambiguous');
        expect(findClrRecordById(model, 'second')?.record.sourceCredentialId).toBe('second');
        expect(model.relationships.first).toHaveLength(2);
        expect(model.relationships.first).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ relatedRecordId: 'second', navigable: true }),
                expect.objectContaining({
                    relatedRecordId: achievement.id,
                    resolution: 'ambiguous',
                    navigable: false,
                }),
            ])
        );
        expect(getLinkedCompetencies('first', [], model.associations)).toEqual([]);
    });

    it('keeps duplicate credential occurrences distinct in the display categories', () => {
        const model = normalizeClrTranscriptDisplayModel(
            collection([assertion('duplicate'), assertion('duplicate')])
        );
        expect(new Set(model.courses.map(course => course.sourceCredentialId)).size).toBe(2);
        expect(findClrRecordById(model, 'duplicate')).toBeUndefined();
        const opened: string[] = [];
        const navigator = createClrRecordSelection(model, selected =>
            opened.push(selected.record.sourceCredentialId)
        );
        for (const course of model.courses) {
            expect(findClrRecordByCanonicalId(model, course.sourceCredentialId)?.record).toBe(
                course
            );
            navigator.selectRecord(course.sourceCredentialId);
        }
        expect(opened).toEqual(model.courses.map(course => course.sourceCredentialId));
        const uniqueId = model.courses[1].sourceCredentialId;
        expect(findClrRecordById(model, uniqueId)?.record).toBe(model.courses[1]);
    });

    it('keeps standalone definitions in categories without manufacturing assertion claims', () => {
        const model = normalizeClrTranscriptDisplayModel(
            collection(
                [],
                [
                    achievement,
                    {
                        id: 'extension',
                        achievementType: 'CustomPractice',
                        name: 'Custom practice',
                    },
                ]
            )
        );
        expect(model.courses).toHaveLength(1);
        expect(model.otherRecords).toHaveLength(1);
        expect(model.courses[0].results).toEqual([]);
        expect(model.courses[0].earnedAt).toBeUndefined();
        expect(
            model.records.every(record => !record.sourceCredential && !record.provenance.issuer)
        ).toBe(true);
    });

    it('does not choose a result description when same-ID definitions conflict', () => {
        const conflicting = {
            ...achievement,
            resultDescription: [{ id: 'scale', name: 'Conflicting scale' }],
        };
        const model = normalizeClrTranscriptDisplayModel(
            collection(
                [assertion('first', [{ resultDescription: 'scale', achievedLevel: 'advanced' }])],
                [achievement, conflicting]
            )
        );
        const result = model.courses[0].results[0];
        expect(result.resultDescriptionResolved).toBe(false);
        expect(result.label).toBeUndefined();
        expect(result.rubricLevels).toBeUndefined();
        expect(result.achievedLevelId?.value).toBe('advanced');
        expect(
            model.warnings.some(warning => warning.code === 'CONFLICTING_ACHIEVEMENT_DEFINITION')
        ).toBe(true);
    });

    it('rejects ambiguous subjects without dropping the original embedded credential', () => {
        const child = assertion('first');
        const ambiguousChild = {
            ...child,
            credentialSubject: [child.credentialSubject, { id: 'another' }],
        };
        const model = normalizeClrTranscriptDisplayModel(collection([ambiguousChild], []));
        expect(model.records).toHaveLength(1);
        expect(model.records[0].sourceCredential).toBe(ambiguousChild);
        expect(model.records[0].sourceSubject).toBeUndefined();
        expect(model.otherRecords).toHaveLength(1);
        expect(model.courses).toEqual([]);
        expect(model.warnings.some(warning => warning.code === 'AMBIGUOUS_SUBJECT')).toBe(true);

        const parent = collection([child]);
        const ambiguous = normalizeClrTranscriptDisplayModel({
            ...parent,
            credentialSubject: [parent.credentialSubject, { id: 'another' }],
        });
        expect(ambiguous.records).toEqual([]);
        expect(ambiguous.warnings.some(warning => warning.code === 'AMBIGUOUS_SUBJECT')).toBe(true);
    });

    it('retains exact paths for single-subject array encodings', () => {
        const child = assertion('first', [{ status: 'Completed' }]);
        const credential = collection([{ ...child, credentialSubject: [child.credentialSubject] }]);
        const model = normalizeClrTranscriptDisplayModel({
            ...credential,
            credentialSubject: [credential.credentialSubject],
        });
        expect(model.courses[0].results[0].status?.sourcePath).toBe(
            'credentialSubject[0].verifiableCredential[0].credentialSubject[0].result[0].status'
        );
        expect(model.courses[0].name?.sourcePath).toBe('credentialSubject[0].achievement[0].name');
    });
});

describe('mixed CLR relationship navigation', () => {
    it('opens qualifications and other records by identity even when names match', () => {
        const model = normalizeClrTranscriptDisplayModel(
            collection(
                [],
                [
                    { id: 'qualification', name: 'Shared name', achievementType: 'License' },
                    { id: 'other', name: 'Shared name', achievementType: 'VolunteerExperience' },
                ]
            )
        );
        expect(findClrRecordById(model, 'qualification')?.kind).toBe('award');
        expect(findClrRecordById(model, 'other')?.kind).toBe('other');
        expect(findClrRecordById(model, 'qualification')?.record).not.toBe(
            findClrRecordById(model, 'other')?.record
        );
    });

    it('retains unresolved targets alongside navigable mixed-record targets', () => {
        const credential = collection(
            [],
            [
                { id: 'course', name: 'Course', achievementType: 'Course' },
                { id: 'qualification', name: 'Qualification', achievementType: 'License' },
                { id: 'other', name: 'Other', achievementType: 'VolunteerExperience' },
            ]
        );
        const model = normalizeClrTranscriptDisplayModel({
            ...credential,
            credentialSubject: {
                ...(credential.credentialSubject as ClrJsonObject),
                association: ['qualification', 'other', 'missing-record'].map(targetId => ({
                    type: 'Association',
                    associationType: 'isRelatedTo',
                    sourceId: 'course',
                    targetId,
                })),
            },
        });
        const courseId = model.courses[0].sourceCredentialId;
        expect(model.relationships[courseId]).toHaveLength(3);
        expect(model.relationships[courseId].map(edge => edge.navigable)).toEqual([
            true,
            true,
            false,
        ]);
        expect(model.relationships[courseId][2]).toMatchObject({
            relatedRecordId: 'missing-record',
            relatedRecordName: 'missing-record',
            resolution: 'unresolved',
        });
        expect(findClrRecordById(model, 'missing-record')).toBeUndefined();
    });
});

describe('learner display identity', () => {
    it('skips hashed names and identifiers while retaining clear identifiers and source data', () => {
        const identifiers = [
            { identityType: 'name', identityHash: 'hashed-name', hashed: true },
            { identityType: 'name', identityHash: 'Supplied Name', hashed: false },
        ];
        const model = normalizeClrTranscriptDisplayModel({
            type: ['ClrCredential'],
            credentialSubject: { id: 'learner', identifier: identifiers },
        });
        expect(model.header.learnerName?.value).toBe('Supplied Name');
        expect(model.canonical.collection.subjectIdentifiers).toHaveLength(2);
        const hashedOnly = normalizeClrTranscriptDisplayModel({
            type: ['ClrCredential'],
            credentialSubject: { id: 'learner', identifier: [identifiers[0]] },
        });
        expect(hashedOnly.header.learnerName?.value).toBe('learner');
    });
});
