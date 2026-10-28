import { describe, expect, test } from 'bun:test';
import { UnsignedClrCredentialValidator } from '@learncard/types';
import { ParsedTranscriptSchema, type ParsedTranscript } from '../ai/generation-schemas';
import { toUnsignedTranscriptClr } from './transcript-clr.helpers';

const holderDid = 'did:key:z6Mktest-holder';

const getSubject = (credential: Record<string, any>) =>
    credential.credentialSubject as Record<string, any>;

const getNestedCredentials = (credential: Record<string, any>) =>
    getSubject(credential).verifiableCredential as Record<string, any>[];

const getCourseCredentials = (credential: Record<string, any>) =>
    getNestedCredentials(credential).filter(
        nested => getSubject(nested).achievement?.achievementType === 'Course'
    );

const expectPropertiesOmitted = (value: Record<string, any>, properties: string[]) => {
    for (const property of properties) expect(value).not.toHaveProperty(property);
};

describe('toUnsignedTranscriptClr', () => {
    test('maps several courses into one valid CLR with nested course credentials', () => {
        const transcript: ParsedTranscript = {
            learner: { name: 'Jordan Reyes', studentId: '20210042' },
            institution: 'Westbridge University',
            program: 'Bachelor of Science',
            fieldOfStudy: 'Data Science',
            dateIssued: '2025-05-20',
            cumulativeGpa: 3.8,
            courses: [
                {
                    courseCode: 'DS 101',
                    courseName: 'Introduction to Data Science',
                    term: 'Fall 2021',
                    grade: 'A',
                    credits: 3,
                    completedAt: '2021-12-15',
                },
                {
                    courseCode: 'MATH 151',
                    courseName: 'Calculus I',
                    term: 'Fall 2021',
                    grade: 'A-',
                    credits: 4,
                },
            ],
        };

        const clr = toUnsignedTranscriptClr(transcript, holderDid) as Record<string, any>;
        const parsed = UnsignedClrCredentialValidator.safeParse(clr);
        const courses = getCourseCredentials(clr);

        expect(parsed.success).toBe(true);
        expect(clr.type).toEqual(['VerifiableCredential', 'ClrCredential']);
        expect(getSubject(clr).type).toEqual(['ClrSubject']);
        expect(getSubject(clr)['@context']).toEqual({
            identifier: {
                '@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#identifier',
                '@container': '@set',
            },
        });
        expect(getSubject(clr).identifier).toHaveLength(2);
        expect(getNestedCredentials(clr)).toHaveLength(2);
        expect(courses).toHaveLength(2);
        expect(getSubject(courses[0])).toMatchObject({
            creditsEarned: 3,
            term: 'Fall 2021',
            activityEndDate: '2021-12-15',
            result: [{ type: ['Result'], value: 'A' }],
            achievement: {
                achievementType: 'Course',
                name: 'Introduction to Data Science',
                humanCode: 'DS 101',
            },
        });
        expect(getSubject(clr).achievement).toEqual([
            expect.objectContaining({
                achievementType: 'LearningProgram',
                name: 'Bachelor of Science',
                fieldOfStudy: 'Data Science',
            }),
        ]);
    });

    test('omits optional transcript and course claims when absent', () => {
        const clr = toUnsignedTranscriptClr(
            {
                institution: 'Westbridge University',
                courses: [{ courseName: 'Calculus I' }],
            },
            holderDid
        ) as Record<string, any>;
        const subject = getSubject(clr);
        const courseSubject = getSubject(getCourseCredentials(clr)[0]);
        const { achievement } = courseSubject;

        expectPropertiesOmitted(clr, ['validFrom']);
        expectPropertiesOmitted(subject, ['identifier', 'achievement']);
        expectPropertiesOmitted(courseSubject, [
            'creditsEarned',
            'result',
            'term',
            'activityEndDate',
        ]);
        expectPropertiesOmitted(achievement, ['humanCode']);
    });

    test('rejects empty or malformed course data through the strict schema', () => {
        expect(() =>
            ParsedTranscriptSchema.parse({
                institution: 'Westbridge University',
                courses: [],
            })
        ).toThrow();

        expect(() =>
            toUnsignedTranscriptClr(
                {
                    institution: 'Westbridge University',
                    courses: [{ courseName: '' }],
                } as ParsedTranscript,
                holderDid
            )
        ).toThrow();

        expect(() =>
            ParsedTranscriptSchema.parse({
                institution: 'Westbridge University',
                courses: [{ courseName: 'Calculus I', inventedClaim: 'nope' }],
            })
        ).toThrow();
    });

    test('is deterministic and never uses the institution as a VC issuer', () => {
        const transcript: ParsedTranscript = {
            institution: 'Westbridge University',
            program: 'Data Science',
            courses: [
                { courseCode: 'DS 101', courseName: 'Introduction to Data Science' },
                { courseName: 'Calculus I' },
            ],
        };

        const first = toUnsignedTranscriptClr(transcript, holderDid) as Record<string, any>;
        const second = toUnsignedTranscriptClr(transcript, holderDid) as Record<string, any>;

        expect(second).toEqual(first);
        expect(first.issuer).toBe(holderDid);
        expect(getNestedCredentials(first).every(vc => vc.issuer === holderDid)).toBe(true);
        expect(JSON.stringify(getSubject(first))).toContain('Westbridge University');
        expect(first.issuer).not.toBe('Westbridge University');
    });
});
