import { expect, test } from 'bun:test';
import { credentialDetailsForDisplay, signatureStateForDisplay } from './credential-details';
import { clrStudentOfficialAcademicTranscript } from '../../../packages/credential-library/src/fixtures/clr/student-official-academic-transcript';

test('projects the CLR corpus transcript into source-backed terms and records without changing the credential', () => {
    const credential = clrStudentOfficialAcademicTranscript.credential;
    const original = JSON.stringify(credential);
    const transcript = credentialDetailsForDisplay(credential).transcript!;
    expect(transcript.kind).toBe('academic');
    const fall = transcript.groups.find(group => group.term === 'Fall 2021');
    expect(fall?.kind).toBe('courses');
    expect(fall?.records[0]).toMatchObject({
        name: 'Introduction to Interactive Media',
        code: 'IMD 101',
        credits: { amount: 3, kind: 'earned' },
        results: [{ label: 'Letter Grade', value: 'A' }],
    });
    expect(transcript.groups.some(group => group.kind === 'programs')).toBe(true);
    expect(transcript.groups.some(group => group.kind === 'other')).toBe(true);
    expect(JSON.stringify(credential)).toBe(original);
});

test('recognizes only an outer CLR and keeps explicit zero credits and missing values', () => {
    const course = {
        type: ['VerifiableCredential', 'AchievementCredential'],
        credentialSubject: {
            creditsEarned: 0,
            term: 'Spring',
            achievement: { name: 'Fieldwork', achievementType: 'Course', creditsAvailable: 3 },
        },
    };
    const raw = {
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Academic Transcript',
        proof: { proofValue: 'unchanged' },
        credentialSubject: { verifiableCredential: [course] },
    };
    const transcript = credentialDetailsForDisplay(raw).transcript!;
    expect(transcript.groups[0]).toMatchObject({
        kind: 'courses',
        term: 'Spring',
        records: [{ name: 'Fieldwork', credits: { amount: 0, kind: 'earned' }, results: [] }],
    });
    expect(credentialDetailsForDisplay(course).transcript).toBeUndefined();
    expect(
        credentialDetailsForDisplay({
            type: ['CertifiedBoostCredential'],
            boostCredential: raw,
        }).transcript
    ).toEqual(transcript);
    expect(credentialDetailsForDisplay({ type: ['ClrCredential'] }).transcript?.groups).toEqual([]);
});

test('projects partial general records without inventing courses, credits or results', () => {
    const transcript = credentialDetailsForDisplay({
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Professional Record',
        partial: true,
        credentialSubject: {
            id: 'did:example:learner',
            identifier: [{ identityType: 'emailAddress', identifier: 'learner@example.invalid' }],
            verifiableCredential: [
                {
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    credentialSubject: {
                        achievement: {
                            name: 'Project facilitation',
                            achievementType: 'Competency',
                        },
                    },
                },
            ],
        },
    }).transcript!;
    expect(transcript.kind).toBe('general');
    expect(transcript.partial).toBe(true);
    expect(transcript.learner).toBeUndefined();
    expect(transcript.groups).toMatchObject([
        {
            kind: 'other',
            records: [{ name: 'Project facilitation', results: [] }],
        },
    ]);
    expect(transcript.groups[0].records[0].credits).toBeUndefined();
});

test('details preserve criteria, alignment references, evidence and issuer fields without modifying signed content', () => {
    const raw = {
        proof: { proofValue: 'original-proof' },
        credentialSubject: {
            role: 'Mentor',
            term: 'Autumn',
            creditsEarned: 0,
            activityStartDate: '2026-01-01T00:00:00Z',
            activityEndDate: '2026-06-30T12:00:00Z',
            achievement: {
                name: 'Community leadership',
                fieldOfStudy: 'Education',
                criteria: {
                    narrative: 'Complete supervised work.',
                    id: 'https://example.org/criteria',
                },
                alignment: [
                    {
                        targetName: 'Adaptability',
                        targetCode: '3.6',
                        targetFramework: 'Durable Skills',
                        targetDescription: 'Respond to change.',
                        targetUrl: 'https://example.org/skill',
                    },
                ],
                resultDescription: [
                    {
                        id: 'grade',
                        name: 'Final grade',
                        resultType: 'LetterGrade',
                        description: 'Course result.',
                    },
                ],
            },
            result: { resultDescription: 'grade', value: 'A' },
        },
        expirationDate: '2027-01-01T00:00:00Z',
        evidence: [
            { id: 'https://example.org/work', name: 'Project', description: 'Original project.' },
        ],
        attachments: [{ url: 'https://example.org/document', name: 'Certificate' }],
    };
    const before = JSON.stringify(raw),
        details = credentialDetailsForDisplay(raw);
    expect(details.criteria).toEqual([
        { name: '', text: 'Complete supervised work.', url: 'https://example.org/criteria' },
    ]);
    expect(details.alignments[0]).toMatchObject({
        name: 'Adaptability',
        framework: 'Durable Skills',
        code: '3.6',
    });
    expect(details.evidence).toHaveLength(2);
    expect(details.fields).toContainEqual({ kind: 'creditsEarned', value: '0' });
    expect(details.results).toEqual([
        { name: 'Final grade', value: 'A', text: 'Course result.', type: 'LetterGrade' },
    ]);
    expect(details.validUntil).toBe('2027-01-01T00:00:00.000Z');
    expect(details.activityStartDate).toBe('2026-01-01T00:00:00.000Z');
    expect(JSON.stringify(raw)).toBe(before);
});

test('singleton and multiple achievements retain their own criteria and tolerate malformed optional fields', () => {
    const details = credentialDetailsForDisplay({
        credentialSubject: [
            {
                achievement: [
                    { name: 'First', criteria: 'One requirement.' },
                    { name: 'Second', criteria: { narrative: 'Another requirement.' } },
                ],
            },
            {
                achievement: {
                    name: 'Third',
                    criteria: 'https://example.org/criteria',
                    alignment: { targetName: 'A skill' },
                },
            },
            { achievement: null },
        ],
    });
    expect(details.criteria.map(item => item.name)).toEqual(['First', 'Second', 'Third']);
    expect(details.criteria[2].url).toBe('https://example.org/criteria');
    expect(details.alignments[0].name).toBe('A skill');
    expect(credentialDetailsForDisplay(null).criteria).toEqual([]);
    expect(
        credentialDetailsForDisplay({ evidence: [null, 5, {}], credentialSubject: 'unavailable' })
            .evidence
    ).toEqual([]);
});

test('unsafe links stay noninteractive and missing dates never acquire a made-up expiry', () => {
    const details = credentialDetailsForDisplay({
        credentialSubject: {
            achievement: {
                criteria: { narrative: 'Keep this text.', id: 'javascript:alert(1)' },
                alignment: [{ targetName: 'Skill', targetUrl: 'https://user:secret@example.org' }],
            },
        },
        evidence: [{ name: 'Unsafe reference', id: 'file:///private/file' }],
        validUntil: 'unknown',
    });
    expect(details.criteria[0]).toEqual({ name: '', text: 'Keep this text.', url: undefined });
    expect(details.alignments[0].url).toBeUndefined();
    expect(details.evidence[0].url).toBeUndefined();
    expect(details.validUntil).toBeUndefined();
    expect(credentialDetailsForDisplay({ validUntil: '1' }).validUntil).toBeUndefined();
    expect(
        credentialDetailsForDisplay({ validUntil: '2026-02-30T00:00:00Z' }).validUntil
    ).toBeUndefined();
    expect(credentialDetailsForDisplay({ validUntil: '2027-01-01' }).validUntil).toBeUndefined();
});

test('legacy and certified boost display fields remain read-only and signature failures do not invent lifecycle status', () => {
    expect(
        credentialDetailsForDisplay({
            type: ['CertifiedBoostCredential'],
            boostCredential: {
                legacyAssertion: {
                    badge: {
                        narrative: 'Legacy criteria.',
                        alignment: [{ targetName: 'Legacy skill' }],
                    },
                },
            },
        }).criteria[0].text
    ).toBe('Legacy criteria.');
    expect(signatureStateForDisplay({ errors: [] })).toBe('verified');
    expect(signatureStateForDisplay({ errors: ['revoked, suspended or a network error'] })).toBe(
        'notVerified'
    );
    expect(signatureStateForDisplay({ warnings: [] })).toBe('unavailable');
    expect(signatureStateForDisplay(null)).toBe('unavailable');
});
