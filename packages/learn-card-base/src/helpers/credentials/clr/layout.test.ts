import { describe, expect, it } from 'vitest';
import { normalizeClrCredential } from './normalize';
import { groupClrRecords, inferClrLayout } from './layout';

const collection = (name: string, types: string[] = ['Course']) => ({
    type: ['ClrCredential'],
    name,
    credentialSubject: {
        achievement: types.map((type, i) => ({
            id: `achievement-${i}`,
            name: `Record ${i}`,
            achievementType: type,
        })),
    },
});

describe('CLR collection layout', () => {
    it.each([
        'Military Training & Qualifications — Academy',
        'Military Training and Qualifications',
        'Military Record',
        'Military Transcript',
        'Military Service Record',
    ])('recognizes %s without treating a military transcript as academic', title => {
        expect(inferClrLayout(normalizeClrCredential(collection(title)))).toEqual({
            kind: 'military',
            reason: 'military-title',
        });
    });
    it.each([
        'Official Academic Transcript',
        'Academic History',
        'Student Record',
        'Grade Report',
        'University Transcript',
    ])('recognizes %s', title => {
        expect(inferClrLayout(normalizeClrCredential(collection(title))).kind).toBe('academic');
    });
    it('keeps conflicting collection titles general', () => {
        expect(
            inferClrLayout(
                normalizeClrCredential(collection('Military Training and Academic Transcript'))
            )
        ).toEqual({ kind: 'general', reason: 'conflicting-title' });
    });
    it('does not infer a sector from course counts, issuer names, tags, or child text', () => {
        const raw = {
            ...collection('Training record', ['Course', 'Course']),
            issuer: { name: 'Military Training Academy' },
        };
        raw.credentialSubject.achievement[0].name = 'Military Training';
        expect(inferClrLayout(normalizeClrCredential(raw)).kind).toBe('general');
    });
    it('requires academic structure when the collection title is inconclusive', () => {
        expect(
            inferClrLayout(
                normalizeClrCredential(collection('My record', ['Course', 'BachelorDegree']))
            ).kind
        ).toBe('academic');
        expect(
            inferClrLayout(
                normalizeClrCredential(
                    collection('My record', ['Course', 'BachelorDegree', 'Membership'])
                )
            ).kind
        ).toBe('general');
        expect(
            inferClrLayout(
                normalizeClrCredential(collection('My record', ['Course', 'Certificate']))
            ).kind
        ).toBe('general');
    });
    it('recognizes explicit zero GPA but not an absent result or a GPA-like name', () => {
        const make = (result: object, resultType = 'GradePointAverage') =>
            normalizeClrCredential({
                type: ['ClrCredential'],
                credentialSubject: {
                    verifiableCredential: [
                        {
                            credentialSubject: {
                                achievement: {
                                    achievementType: 'Course',
                                    resultDescription: [{ id: 'gpa', resultType, name: 'GPA' }],
                                },
                                result: [{ resultDescription: 'gpa', ...result }],
                            },
                        },
                    ],
                },
            });
        expect(inferClrLayout(make({ value: 0 })).kind).toBe('academic');
        expect(inferClrLayout(make({})).kind).toBe('general');
        expect(inferClrLayout(make({ value: 4 }, 'RawScore')).kind).toBe('general');
    });
    it('preserves military selection when courses or degrees are added', () => {
        expect(
            inferClrLayout(
                normalizeClrCredential(
                    collection('Military Training', ['Course', 'Course', 'BachelorDegree'])
                )
            ).kind
        ).toBe('military');
    });
    it('does not change the input and falls back for empty data', () => {
        const raw = collection('Unclassified record', ['UnknownType']);
        const before = JSON.stringify(raw);
        expect(inferClrLayout(normalizeClrCredential(raw)).kind).toBe('general');
        expect(JSON.stringify(raw)).toBe(before);
        expect(inferClrLayout(normalizeClrCredential({})).kind).toBe('general');
    });
});

describe('CLR record sections', () => {
    it('partitions every occurrence once and preserves order, including repeated IDs', () => {
        const model = normalizeClrCredential({
            type: ['ClrCredential'],
            credentialSubject: {
                verifiableCredential: [
                    'Course',
                    'Fieldwork',
                    'Competency',
                    'Assessment',
                    'License',
                    'Award',
                    'Membership',
                    'UnknownType',
                    'Course',
                ].map(type => ({
                    id: 'duplicate',
                    credentialSubject: {
                        role: 'Learner',
                        achievement: { achievementType: type, name: type },
                    },
                })),
            },
        });
        for (const layout of ['military', 'general'] as const) {
            const sections = groupClrRecords(model.records, layout);
            expect(
                sections
                    .flatMap(section => section.records)
                    .map(record => record.id)
                    .sort()
            ).toEqual(model.records.map(record => record.id).sort());
            expect(
                sections
                    .find(
                        section => section.kind === (layout === 'military' ? 'training' : 'courses')
                    )
                    ?.records.map(record => record.id)
            ).toEqual([model.records[0].id, model.records[8].id]);
            expect(sections.find(section => section.kind === 'qualifications')?.records[0]).toBe(
                model.records[4]
            );
            expect(sections.find(section => section.kind === 'other')?.records[0]).toBe(
                model.records[6]
            );
        }
    });
    it('retains definition-only and unclassified records', () => {
        const model = normalizeClrCredential(collection('My record', ['Unrecognized', 'Course']));
        expect(groupClrRecords(model.records, 'general').map(section => section.kind)).toEqual([
            'courses',
            'other',
        ]);
        expect(model.records.every(record => !record.sourceCredential)).toBe(true);
    });
    it('assigns multiply typed records only once and keeps a qualification out of activities', () => {
        const model = normalizeClrCredential(collection('My record', ['License']));
        model.records[0].presentationHints.push('course', 'activity');
        expect(groupClrRecords(model.records, 'military').map(section => section.kind)).toEqual([
            'qualifications',
        ]);
    });
});
