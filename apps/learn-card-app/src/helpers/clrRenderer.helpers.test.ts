import { describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

import { clrUniversityTranscript } from '../../../../packages/credential-library/src/fixtures/clr/university-transcript';
import { clrNdStudentTranscript } from '../../../../packages/credential-library/src/fixtures/clr/nd-student-transcript';
import { clrGreatPlainsFull } from '../../../../packages/credential-library/src/fixtures/clr/great-plains-full';
import { clrDemoIsdDiplomaAssessments } from '../../../../packages/credential-library/src/fixtures/clr/demo-isd-diploma-assessments';
import { clrWestbridgeFull } from '../../../../packages/credential-library/src/fixtures/clr/westbridge-full';
import { clrCompetencyAligned } from '../../../../packages/credential-library/src/fixtures/clr/competency-aligned';
import { clrAchievementIdAssociations } from '../../../../packages/credential-library/src/fixtures/clr/achievement-id-associations';
import { obv3CourseCompletion } from '../../../../packages/credential-library/src/fixtures/obv3/course-completion';
import { obv3StandaloneFullCourse } from '../../../../packages/credential-library/src/fixtures/obv3/standalone-full-course';

import {
    ClrTranscriptSurface,
    createClrRecordSelection,
    getLinkedCompetencies,
    isStandaloneCourseCredential,
    normalizeClrTranscriptDisplayModel,
    parseCreditsFromDescription,
    selectClrTranscriptView,
} from './clrRenderer.helpers';
import { getClrTranscriptKind } from '../components/clr-transcript/clrKind.helpers';

type MutableRelationshipFixture = {
    credentialSubject: {
        verifiableCredential: Array<{
            id?: string;
            type?: string[];
            credentialSubject: {
                id?: string;
                type?: string[];
                achievement: {
                    id?: string;
                    type?: string[];
                    achievementType?: string;
                    name?: string;
                };
            };
        }>;
        association: Array<{
            type?: string[];
            associationType: string;
            sourceId: string;
            targetId: string;
        }>;
    };
};

const cloneRelationshipFixture = (): MutableRelationshipFixture =>
    structuredClone(
        clrAchievementIdAssociations.credential
    ) as unknown as MutableRelationshipFixture;

describe('normalizeClrTranscriptDisplayModel', () => {
    it('maps CLR shell and structured transcript fields (university fixture)', () => {
        const model = normalizeClrTranscriptDisplayModel(
            clrUniversityTranscript.credential as unknown as Record<string, unknown>
        );

        expect(model.header.id.value).toBe('urn:uuid:8f3a1c2e-5b74-4d09-ae61-9c8f0d2e7b3a');
        expect(model.header.title.value).toContain('Transcript');
        expect(model.courses.length).toBeGreaterThan(0);
        expect(
            model.programs.every(program => typeof program.achievementType.value === 'string')
        ).toBeTruthy();
        expect(model.summary.gpa).toBeUndefined();
        expect(model.quality.level).toBe('rich');
        expect(
            selectClrTranscriptView(model, {
                viewer: 'student',
                surface: ClrTranscriptSurface.Full,
            })
        ).toBe('StructuredTranscriptView');
    });

    it('normalizes a CLR with its single credential subject encoded as an array', () => {
        const credential = clrUniversityTranscript.credential as unknown as Record<string, unknown>;
        const objectSubjectModel = normalizeClrTranscriptDisplayModel(credential);
        const arraySubjectModel = normalizeClrTranscriptDisplayModel({
            ...credential,
            credentialSubject: [credential.credentialSubject],
        });

        expect(arraySubjectModel.courses).toHaveLength(objectSubjectModel.courses.length);
        expect(arraySubjectModel.programs).toHaveLength(objectSubjectModel.programs.length);
        expect(arraySubjectModel.associations).toHaveLength(objectSubjectModel.associations.length);
        expect(arraySubjectModel.header.learnerIdentifiers.value).toEqual(
            objectSubjectModel.header.learnerIdentifiers.value
        );
    });

    it('renders sparse academic record from ND fixture and flags large inline evidence', () => {
        const model = normalizeClrTranscriptDisplayModel(
            clrNdStudentTranscript.credential as unknown as Record<string, unknown>
        );

        expect(model.courses.length).toBe(0);
        expect(model.evidence.length).toBeGreaterThan(0);
        expect(model.summary.gpa?.value).toBe('3.2200');
        expect(model.otherRecords.length).toBeGreaterThan(0);
        expect(model.quality.level).toBe('usable');
        expect(
            model.warnings.some(warning => warning.code === 'LARGE_INLINE_EVIDENCE')
        ).toBeTruthy();
        expect(
            selectClrTranscriptView(model, {
                viewer: 'student',
                surface: ClrTranscriptSurface.Full,
            })
        ).toBe('SparseAcademicRecordView');
    });

    it('stress-handles full great plains fixture and keeps no-guessing classification', () => {
        const model = normalizeClrTranscriptDisplayModel(
            clrGreatPlainsFull.credential as unknown as Record<string, unknown>
        );

        expect(model.evidence.some(evidence => evidence.isLargeInlineDataUri)).toBeTruthy();
        expect(
            model.warnings.some(warning => warning.code === 'LARGE_INLINE_EVIDENCE')
        ).toBeTruthy();
        expect(model.assessments.length).toBeGreaterThan(0);
        expect(model.otherRecords.length).toBeGreaterThan(0);
        expect(
            model.otherRecords.some(record => record.reason === 'unsupportedAchievementType')
        ).toBeTruthy();
    });

    describe('assessments (demo ISD diploma fixture)', () => {
        const model = normalizeClrTranscriptDisplayModel(
            clrDemoIsdDiplomaAssessments.credential as unknown as Record<string, unknown>
        );

        it('classifies Assessment achievements separately from courses', () => {
            expect(model.courses.length).toBe(33);
            expect(model.assessments.length).toBe(2);
            expect(model.summary.assessmentCount).toBe(2);
            expect(model.assessments.map(a => a.name?.value)).toEqual(
                expect.arrayContaining(['ACT', 'Durable Skills Assessment'])
            );
        });

        it('keeps plain score assessments as numeric results with min/max', () => {
            const act = model.assessments.find(a => a.name?.value === 'ACT')!;

            expect(act.isRubric).toBe(false);
            expect(act.alignments).toEqual([]);
            expect(act.results.length).toBe(5);
            expect(act.results.every(r => r.valueMin?.value && r.valueMax?.value)).toBe(true);
            expect(act.results.every(r => r.rubricLevels === undefined)).toBe(true);
        });

        it('resolves rubric levels, achieved level, status and alignments', () => {
            const skills = model.assessments.find(
                a => a.name?.value === 'Durable Skills Assessment'
            )!;

            expect(skills.isRubric).toBe(true);
            expect(skills.alignments.length).toBe(10);
            expect(skills.alignments[0].targetFramework?.value).toBe(
                'Carnegie Skills Progressions'
            );
            expect(skills.results.length).toBe(10);

            const communication = skills.results.find(r => r.label?.value?.startsWith('COM.1'))!;
            expect(communication.resultType?.value).toBe('RubricCriterionLevel');
            expect(communication.status?.value).toBe('Completed');
            expect(communication.rubricLevels?.map(l => l.name)).toEqual([
                'Exploring',
                'Analyzing',
                'Integrating',
                'Extending',
            ]);
            expect(communication.achievedLevel?.name).toBe('Integrating');
            expect(communication.achievedLevel?.points).toBe('3');
            expect(communication.achievedLevel?.description).toBeTruthy();
            expect(communication.value.value).toBe('Integrating');
        });

        it('falls back to matching the achieved level by value when achievedLevel is absent', () => {
            const credential = structuredClone(
                clrDemoIsdDiplomaAssessments.credential
            ) as unknown as Record<string, unknown>;
            type NestedVc = {
                credentialSubject: {
                    achievement: { name: string };
                    result: Array<{ achievedLevel?: string }>;
                };
            };
            const subject = credential.credentialSubject as { verifiableCredential: NestedVc[] };
            const skills = subject.verifiableCredential.find(
                vc => vc.credentialSubject.achievement.name === 'Durable Skills Assessment'
            )!;
            skills.credentialSubject.result.forEach(r => delete r.achievedLevel);

            const fallback = normalizeClrTranscriptDisplayModel(credential);
            const skillsModel = fallback.assessments.find(
                a => a.name?.value === 'Durable Skills Assessment'
            )!;

            expect(skillsModel.results.every(r => r.achievedLevel?.name === r.value.value)).toBe(
                true
            );
        });
    });

    it('normalizes an eligible standalone OBv3 Course as a single course record', () => {
        const credential = obv3StandaloneFullCourse.credential as unknown as Record<
            string,
            unknown
        >;
        const model = normalizeClrTranscriptDisplayModel(credential);

        expect(isStandaloneCourseCredential(credential)).toBe(true);
        expect(model.courses).toHaveLength(1);
        expect(model.courses[0]?.name?.value).toBe('Applied Data Ethics and Responsible AI');
        expect(model.courses[0]?.humanCode?.value).toBe('DAI-318');
        expect(model.courses[0]?.term?.value).toBe('Spring 2026');
        expect(model.courses[0]?.creditsEarned?.value).toBe(4);
        expect(model.courses[0]?.earnedAt?.value).toBe('2026-05-18T23:59:59Z');
        expect(model.courses[0]?.results[0]?.value.value).toBe('A-');
        expect(model.courses[0]?.results[2]?.value.value).toBe('Completed');
        expect(model.header.issuerImage?.value).toBe(
            'https://aster-ridge.example/brand/institute-mark.png'
        );
        expect(model.evidence).toHaveLength(2);
        expect(
            selectClrTranscriptView(model, {
                viewer: 'student',
                surface: ClrTranscriptSurface.Full,
            })
        ).toBe('StructuredTranscriptView');
    });

    it('does not select the course presentation from ambiguous standalone metadata', () => {
        const keywordOnly = {
            type: ['VerifiableCredential', 'AchievementCredential'],
            name: 'Course Completion Credential',
            issuer: { id: 'did:example:issuer', name: 'Example Institution' },
            credentialSubject: {
                achievement: { achievementType: 'Achievement', name: 'A Course About Ethics' },
            },
        };
        const unnamedIssuer = {
            ...keywordOnly,
            credentialSubject: {
                achievement: { achievementType: 'Course', name: 'Applied Ethics' },
            },
            issuer: { id: 'did:example:issuer' },
        };

        expect(isStandaloneCourseCredential(keywordOnly)).toBe(false);
        expect(isStandaloneCourseCredential(unnamedIssuer)).toBe(false);
    });

    it('does not treat a Course credential with nested credentials as standalone', () => {
        const credential = {
            id: 'urn:test:course-wrapper',
            type: ['VerifiableCredential', 'AchievementCredential'],
            issuer: { id: 'did:example:issuer', name: 'Example Institution' },
            evidence: [{ id: 'https://example.com/transcript.pdf' }],
            credentialSubject: {
                achievement: { achievementType: 'Course', name: 'Course wrapper' },
                verifiableCredential: [
                    {
                        id: 'urn:test:nested-course',
                        credentialSubject: {
                            achievement: { achievementType: 'Course', name: 'Nested course' },
                        },
                    },
                ],
            },
        };
        const model = normalizeClrTranscriptDisplayModel(credential);

        expect(isStandaloneCourseCredential(credential)).toBe(false);
        expect(model.courses).toHaveLength(1);
        expect(model.courses[0]?.name?.value).toBe('Nested course');
        expect(model.evidence).toHaveLength(1);
    });

    it('keeps optional course fields optional when selecting the standalone presentation', () => {
        const credential = obv3CourseCompletion.credential as unknown as Record<string, unknown>;
        const model = normalizeClrTranscriptDisplayModel(credential);

        expect(isStandaloneCourseCredential(credential)).toBe(true);
        expect(model.courses).toHaveLength(1);
        expect(model.courses[0]?.name?.value).toBe('Introduction to Machine Learning');
        expect(model.courses[0]?.humanCode).toBeUndefined();
        expect(model.courses[0]?.creditsEarned).toBeUndefined();
        expect(model.courses[0]?.results).toEqual([]);
    });

    it('does not infer GPA from text without GradePointAverage resultDescription', () => {
        const credential: Record<string, unknown> = {
            id: 'urn:test:no-gpa',
            type: ['VerifiableCredential', 'ClrCredential'],
            name: 'Test Transcript',
            validFrom: '2025-01-01T00:00:00Z',
            issuer: { id: 'did:test:issuer', name: 'Issuer' },
            credentialSubject: {
                type: ['ClrSubject'],
                identifier: [{ identityType: 'name', identityHash: 'Learner Name' }],
                verifiableCredential: [
                    {
                        id: 'nested-1',
                        credentialSubject: {
                            achievement: {
                                achievementType: 'Achievement',
                                name: 'Cumulative GPA',
                            },
                            result: [{ value: '3.9' }],
                        },
                    },
                ],
            },
        };

        const model = normalizeClrTranscriptDisplayModel(credential);
        expect(model.summary.gpa).toBeUndefined();
    });

    it('routes admin and registrar viewers to verifier inspection', () => {
        const model = normalizeClrTranscriptDisplayModel(
            clrUniversityTranscript.credential as unknown as Record<string, unknown>
        );

        expect(
            selectClrTranscriptView(model, {
                viewer: 'admin',
                surface: ClrTranscriptSurface.Full,
            })
        ).toBe('VerifierInspectionView');
        expect(
            selectClrTranscriptView(model, {
                viewer: 'registrar',
                surface: ClrTranscriptSurface.Embed,
            })
        ).toBe('VerifierInspectionView');
    });

    it('uses title heuristics when structured CLR signals are sparse', () => {
        expect(
            getClrTranscriptKind({
                id: 'urn:test:title-transcript',
                type: ['VerifiableCredential', 'ClrCredential'],
                name: 'Official Academic Transcript',
                issuer: { id: 'did:test:issuer', name: 'Issuer' },
                credentialSubject: {
                    id: 'did:test:learner',
                    type: ['ClrSubject'],
                },
            } as unknown as VC)
        ).toBe('transcript');

        expect(
            getClrTranscriptKind({
                id: 'urn:test:title-degree',
                type: ['VerifiableCredential', 'ClrCredential'],
                name: 'Bachelor of Science in Biology',
                issuer: { id: 'did:test:issuer', name: 'Issuer' },
                credentialSubject: {
                    id: 'did:test:learner',
                    type: ['ClrSubject'],
                },
            } as unknown as VC)
        ).toBe('degree');
    });

    describe('award classification', () => {
        const makeClrWithNestedAchievement = (achievementType: string, name: string) => ({
            id: 'urn:test:award-classification',
            type: ['VerifiableCredential', 'ClrCredential'],
            name: 'Test CLR',
            validFrom: '2025-01-01T00:00:00Z',
            issuer: { id: 'did:test:issuer', name: 'Issuer' },
            credentialSubject: {
                type: ['ClrSubject'],
                identifier: [{ identityType: 'name', identityHash: 'Learner' }],
                verifiableCredential: [
                    {
                        id: 'nested-1',
                        credentialSubject: {
                            achievement: { achievementType, name },
                        },
                    },
                ],
            },
        });

        it.each(['Award', 'Certificate', 'License', 'Certification', 'Badge', 'MicroCredential'])(
            'classifies %s as an award',
            achievementType => {
                const model = normalizeClrTranscriptDisplayModel(
                    makeClrWithNestedAchievement(achievementType, `Test ${achievementType}`)
                );
                expect(model.awards).toHaveLength(1);
                expect(model.awards[0]?.achievementType.value).toBe(achievementType);
                expect(model.summary.awardCount).toBe(1);
            }
        );

        it('does NOT classify Endorsement as an award (it is an assertion about another credential)', () => {
            const model = normalizeClrTranscriptDisplayModel(
                makeClrWithNestedAchievement('Endorsement', 'Faculty Endorsement')
            );
            expect(model.awards).toHaveLength(0);
            expect(model.summary.awardCount).toBe(0);
            expect(model.otherRecords).toHaveLength(1);
        });

        it('does NOT classify generic Achievement as an award', () => {
            const model = normalizeClrTranscriptDisplayModel(
                makeClrWithNestedAchievement('Achievement', 'Generic Achievement')
            );
            expect(model.awards).toHaveLength(0);
            expect(model.otherRecords).toHaveLength(1);
        });
    });

    describe('parseCreditsFromDescription helper', () => {
        it('extracts integer credits from "course, N credit(s)" format', () => {
            expect(parseCreditsFromDescription('Mathematics course, 1 credit(s).')).toBe(1);
            expect(parseCreditsFromDescription('This is a course, 3 credits.')).toBe(3);
        });

        it('extracts decimal credits', () => {
            expect(parseCreditsFromDescription('Elective course, 1.5 credits.')).toBe(1.5);
        });

        it('returns undefined when description lacks "course, N credit" pattern', () => {
            expect(
                parseCreditsFromDescription('An introductory course with no credit info.')
            ).toBeUndefined();
            expect(parseCreditsFromDescription('Worth 3 credits.')).toBeUndefined();
        });

        it('returns undefined when description is undefined', () => {
            expect(parseCreditsFromDescription(undefined)).toBeUndefined();
        });

        it('returns undefined when description is empty', () => {
            expect(parseCreditsFromDescription('')).toBeUndefined();
        });
    });

    describe('credits-from-description normalization', () => {
        const makeClrWithCourse = (
            description?: string,
            creditsEarned?: number,
            creditsAvailable?: number
        ) => ({
            id: 'urn:test:credits-parse',
            type: ['VerifiableCredential', 'ClrCredential'],
            name: 'Test CLR',
            validFrom: '2025-01-01T00:00:00Z',
            issuer: { id: 'did:test:issuer', name: 'Issuer' },
            credentialSubject: {
                type: ['ClrSubject'],
                identifier: [{ identityType: 'name', identityHash: 'Learner' }],
                verifiableCredential: [
                    {
                        id: 'nested-course',
                        credentialSubject: {
                            creditsEarned,
                            achievement: {
                                achievementType: 'Course',
                                name: 'Test Course',
                                description,
                                creditsAvailable,
                            },
                        },
                    },
                ],
            },
        });

        it('populates creditsFromDescription when structured fields are absent', () => {
            const model = normalizeClrTranscriptDisplayModel(
                makeClrWithCourse('Mathematics course, 3 credit(s).')
            );
            expect(model.courses[0]?.creditsFromDescription?.value).toBe(3);
            expect(model.courses[0]?.creditsFromDescription?.sourcePath).toBe(
                'achievement.description'
            );
        });

        it('includes creditsFromDescription in totalCreditsAvailable', () => {
            const model = normalizeClrTranscriptDisplayModel(
                makeClrWithCourse('Elective course, 4 credits.')
            );
            expect(model.summary.totalCreditsAvailable).toBe(4);
        });

        it('does NOT populate creditsFromDescription when creditsEarned exists', () => {
            const model = normalizeClrTranscriptDisplayModel(
                makeClrWithCourse('Mathematics course, 3 credits.', 4, undefined)
            );
            expect(model.courses[0]?.creditsEarned?.value).toBe(4);
            expect(model.courses[0]?.creditsFromDescription).toBeUndefined();
        });

        it('does NOT populate creditsFromDescription when creditsAvailable exists', () => {
            const model = normalizeClrTranscriptDisplayModel(
                makeClrWithCourse('Mathematics course, 3 credits.', undefined, 5)
            );
            expect(model.courses[0]?.creditsAvailable?.value).toBe(5);
            expect(model.courses[0]?.creditsFromDescription).toBeUndefined();
        });

        it('leaves creditsFromDescription undefined when description has no credit pattern', () => {
            const model = normalizeClrTranscriptDisplayModel(
                makeClrWithCourse('An introductory course.')
            );
            expect(model.courses[0]?.creditsFromDescription).toBeUndefined();
        });

        it('leaves creditsFromDescription undefined when description is missing', () => {
            const model = normalizeClrTranscriptDisplayModel(makeClrWithCourse(undefined));
            expect(model.courses[0]?.creditsFromDescription).toBeUndefined();
        });
    });

    describe('result descriptions and relationship graph', () => {
        it('preserves scale requirements and alignments from results and descriptions', () => {
            const model = normalizeClrTranscriptDisplayModel(
                clrAchievementIdAssociations.credential as unknown as Record<string, unknown>
            );
            const foundation = model.courses.find(
                course => course.name?.value === 'Foundations of Systems Thinking'
            )!;
            const advanced = model.courses.find(
                course => course.name?.value === 'Applied Systems Design'
            )!;
            const assessment = model.assessments[0]!;
            const program = model.programs[0]!;

            expect(foundation.achievementId).toBe('urn:achievement:relationship-foundation');
            expect(foundation.results[0]?.requiredValue?.value).toBe('Proficient');
            expect(foundation.results[0]?.alignments[0]?.targetName?.value).toBe(
                'Systems Thinking'
            );
            expect(advanced.results[0]?.valueMin?.value).toBe('0');
            expect(advanced.results[0]?.valueMax?.value).toBe('100');
            expect(advanced.results[0]?.requiredValue?.value).toBe('70');
            expect(assessment.results[0]?.requiredRubricLevel?.name).toBe('Proficient');
            expect(assessment.results[0]?.alignments[0]?.targetName?.value).toBe('Design Quality');
            expect(program.results[0]?.resultType?.value).toBe('Status');
        });

        it('resolves all association types through Achievement.id aliases on both ends', () => {
            const model = normalizeClrTranscriptDisplayModel(
                clrAchievementIdAssociations.credential as unknown as Record<string, unknown>
            );
            const byName = Object.fromEntries(
                [
                    ...model.courses,
                    ...model.programs,
                    ...model.assessments,
                    ...model.competencies,
                ].map(record => [record.name?.value, record.sourceCredentialId])
            );
            const labelsFor = (name: string): string[] =>
                model.relationships[byName[name]]?.map(relationship => relationship.label) ?? [];

            expect(
                new Set(model.associations.map(association => association.associationType))
            ).toEqual(
                new Set([
                    'isChildOf',
                    'isParentOf',
                    'isPartOf',
                    'precedes',
                    'isPeerOf',
                    'exactMatchOf',
                    'replacedBy',
                    'isRelatedTo',
                ])
            );
            expect(model.associations.every(association => association.sourceRecordId)).toBe(true);
            expect(model.associations.every(association => association.targetRecordId)).toBe(true);
            expect(labelsFor('Foundations of Systems Thinking')).toEqual(
                expect.arrayContaining([
                    'Part of Systems Design Certificate',
                    'Unlocks Applied Systems Design',
                    'Taken alongside Systems Design Assessment',
                    'Superseded by Applied Systems Design',
                ])
            );
            expect(labelsFor('Applied Systems Design')).toEqual(
                expect.arrayContaining([
                    'Part of Systems Design Certificate',
                    'Requires Foundations of Systems Thinking',
                    'Replaces Foundations of Systems Thinking',
                    'Related Systems Thinking',
                ])
            );
            expect(labelsFor('Systems Design Assessment')).toEqual(
                expect.arrayContaining([
                    'Part of Systems Design Certificate',
                    'Taken alongside Foundations of Systems Thinking',
                    'Equivalent to Systems Thinking',
                ])
            );
            expect(labelsFor('Systems Design Certificate')).toEqual(
                expect.arrayContaining([
                    'Includes Foundations of Systems Thinking',
                    'Includes Applied Systems Design',
                    'Includes Systems Design Assessment',
                ])
            );
        });

        it('assigns unique fallback IDs to nested credentials without IDs', () => {
            const credential = cloneRelationshipFixture();
            credential.credentialSubject.verifiableCredential
                .filter(nested => nested.credentialSubject.achievement.achievementType === 'Course')
                .forEach(nested => {
                    delete nested.id;
                });

            const model = normalizeClrTranscriptDisplayModel(
                credential as unknown as Record<string, unknown>
            );
            const courseIds = model.courses.map(course => course.sourceCredentialId);

            expect(new Set(courseIds)).toHaveProperty('size', courseIds.length);
            expect(courseIds.every(id => id.startsWith('nested-unknown-'))).toBe(true);
        });

        it('warns when multiple records share an Achievement ID alias', () => {
            const credential = cloneRelationshipFixture();
            const nestedCredentials = credential.credentialSubject.verifiableCredential;
            const foundation = nestedCredentials.find(
                nested =>
                    nested.credentialSubject.achievement.name === 'Foundations of Systems Thinking'
            )!;
            const advanced = nestedCredentials.find(
                nested => nested.credentialSubject.achievement.name === 'Applied Systems Design'
            )!;
            advanced.credentialSubject.achievement.id = foundation.credentialSubject.achievement.id;

            const model = normalizeClrTranscriptDisplayModel(
                credential as unknown as Record<string, unknown>
            );

            expect(model.warnings).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        code: 'AMBIGUOUS_RECORD',
                        sourceCredentialId: advanced.id,
                        sourcePath: 'achievement.id',
                    }),
                ])
            );
        });

        it('marks relationships to unsupported record types as non-navigable', () => {
            const credential = cloneRelationshipFixture();
            const foundation = credential.credentialSubject.verifiableCredential.find(
                nested =>
                    nested.credentialSubject.achievement.name === 'Foundations of Systems Thinking'
            )!;
            credential.credentialSubject.verifiableCredential.push({
                id: 'urn:uuid:relationship-award',
                type: ['VerifiableCredential', 'AchievementCredential'],
                credentialSubject: {
                    achievement: {
                        id: 'urn:achievement:relationship-award',
                        type: ['Achievement'],
                        achievementType: 'Award',
                        name: 'Systems Thinking Award',
                    },
                },
            });
            credential.credentialSubject.association.push({
                type: ['Association'],
                associationType: 'isRelatedTo',
                sourceId: foundation.credentialSubject.achievement.id!,
                targetId: 'urn:achievement:relationship-award',
            });

            const model = normalizeClrTranscriptDisplayModel(
                credential as unknown as Record<string, unknown>
            );
            const normalizedFoundation = model.courses.find(
                course => course.name?.value === 'Foundations of Systems Thinking'
            )!;
            const awardRelationship = model.relationships[
                normalizedFoundation.sourceCredentialId
            ]?.find(relationship => relationship.relatedRecordName === 'Systems Thinking Award');

            expect(awardRelationship?.navigable).toBe(false);
        });

        it('ignores inherited object properties as competency relationship types', () => {
            const model = normalizeClrTranscriptDisplayModel(
                clrAchievementIdAssociations.credential as unknown as Record<string, unknown>
            );
            const relationship = model.associations.find(
                association => association.associationType === 'isRelatedTo'
            )!;

            expect(
                getLinkedCompetencies(relationship.sourceRecordId!, model.competencies, [
                    { ...relationship, associationType: 'constructor' },
                ])
            ).toEqual([]);
        });

        it('warns and preserves a plain value when a result description link is broken', () => {
            const credential = structuredClone(
                clrAchievementIdAssociations.credential
            ) as unknown as Record<string, unknown>;
            type NestedCredential = {
                credentialSubject: {
                    achievement: { name: string };
                    result: Array<{ resultDescription: string }>;
                };
            };
            const subject = credential.credentialSubject as {
                verifiableCredential: NestedCredential[];
            };
            const foundation = subject.verifiableCredential.find(
                nested =>
                    nested.credentialSubject.achievement.name === 'Foundations of Systems Thinking'
            )!;
            foundation.credentialSubject.result[0].resultDescription =
                'urn:result-description:missing';

            const model = normalizeClrTranscriptDisplayModel(credential);
            const result = model.courses.find(
                course => course.name?.value === 'Foundations of Systems Thinking'
            )!.results[0]!;

            expect(result.value.value).toBe('Advanced');
            expect(result.label).toBeUndefined();
            expect(result.resultDescriptionResolved).toBe(false);
            expect(result.alignments).toEqual([]);
            expect(
                model.warnings.some(warning => warning.code === 'UNRESOLVED_RESULT_DESCRIPTION')
            ).toBe(true);
        });

        it('normalizes scale data from the three acceptance fixtures', () => {
            const westbridge = normalizeClrTranscriptDisplayModel(
                clrWestbridgeFull.credential as unknown as Record<string, unknown>
            );
            const demoIsd = normalizeClrTranscriptDisplayModel(
                clrDemoIsdDiplomaAssessments.credential as unknown as Record<string, unknown>
            );
            const competencyAligned = normalizeClrTranscriptDisplayModel(
                clrCompetencyAligned.credential as unknown as Record<string, unknown>
            );

            expect(westbridge.courses.some(course => course.results[0]?.allowedValue)).toBe(true);
            expect(
                demoIsd.assessments.some(assessment =>
                    assessment.results.some(result => result.rubricLevels?.length)
                )
            ).toBe(true);
            expect(
                competencyAligned.courses.some(course =>
                    course.results.some(result => result.allowedValue?.value.length)
                )
            ).toBe(true);
        });
    });
});

describe('createClrRecordSelection', () => {
    it('opens a directly selected record without resolving its ID again', () => {
        const model = normalizeClrTranscriptDisplayModel(
            clrAchievementIdAssociations.credential as unknown as Record<string, unknown>
        );
        const [firstCourse, selectedCourse] = model.courses;
        const ambiguousCourse = {
            ...selectedCourse!,
            sourceCredentialId: firstCourse!.sourceCredentialId,
        };
        const onOpenRecord = vi.fn();
        const navigator = createClrRecordSelection(model, onOpenRecord);

        navigator.openRecord({ kind: 'course', record: ambiguousCourse });

        expect(onOpenRecord).toHaveBeenCalledWith({
            kind: 'course',
            record: ambiguousCourse,
        });
    });
});
