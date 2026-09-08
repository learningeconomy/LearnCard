import { describe, expect, it } from 'vitest';
import type { VC } from '@learncard/types';

import { clrUniversityTranscript } from '../../../../packages/credential-library/src/fixtures/clr/university-transcript';
import { clrNdStudentTranscript } from '../../../../packages/credential-library/src/fixtures/clr/nd-student-transcript';
import { clrGreatPlainsFull } from '../../../../packages/credential-library/src/fixtures/clr/great-plains-full';
import { clrDemoIsdDiplomaAssessments } from '../../../../packages/credential-library/src/fixtures/clr/demo-isd-diploma-assessments';
import { obv3CourseCompletion } from '../../../../packages/credential-library/src/fixtures/obv3/course-completion';
import { obv3StandaloneFullCourse } from '../../../../packages/credential-library/src/fixtures/obv3/standalone-full-course';

import {
    ClrTranscriptSurface,
    isStandaloneCourseCredential,
    normalizeClrTranscriptDisplayModel,
    selectClrTranscriptView,
} from './clrRenderer.helpers';
import { getClrTranscriptKind } from '../components/clr-transcript/clrKind.helpers';

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
});
