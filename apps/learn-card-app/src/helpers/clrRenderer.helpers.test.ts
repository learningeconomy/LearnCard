import { describe, expect, it } from 'vitest';
import type { VC } from '@learncard/types';

import { clrUniversityTranscript } from '../../../../packages/credential-library/src/fixtures/clr/university-transcript';
import { clrNdStudentTranscript } from '../../../../packages/credential-library/src/fixtures/clr/nd-student-transcript';
import { clrGreatPlainsFull } from '../../../../packages/credential-library/src/fixtures/clr/great-plains-full';

import { normalizeClrTranscriptDisplayModel, selectClrTranscriptView } from './clrRenderer.helpers';
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
        expect(selectClrTranscriptView(model, { viewer: 'student', surface: 'full' })).toBe(
            'StructuredTranscriptView'
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
        expect(selectClrTranscriptView(model, { viewer: 'student', surface: 'full' })).toBe(
            'SparseAcademicRecordView'
        );
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

        expect(selectClrTranscriptView(model, { viewer: 'admin', surface: 'full' })).toBe(
            'VerifierInspectionView'
        );
        expect(selectClrTranscriptView(model, { viewer: 'registrar', surface: 'embed' })).toBe(
            'VerifierInspectionView'
        );
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
