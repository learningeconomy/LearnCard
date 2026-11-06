import { createHash } from 'node:crypto';
import {
    UnsignedAchievementCredentialValidator,
    UnsignedClrCredentialValidator,
    type Achievement,
    type IdentityObject,
    type UnsignedAchievementCredential,
    type UnsignedClrCredential,
} from '@learncard/types';
import { ParsedTranscriptSchema, type ParsedTranscript } from '../ai/generation-schemas';

const VC_V2_CONTEXT = 'https://www.w3.org/ns/credentials/v2';
const OB_V3_CONTEXT = 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json';
const CLR_V2_CONTEXT = 'https://purl.imsglobal.org/spec/clr/v2p0/context.json';

// CLR v2 scopes its credentialSubject context and does not define the Open
// Badges `identifier` term there. Reintroduce it when learner identifiers are
// included so JSON-LD processors can expand and sign the CLR.
const CLR_SUBJECT_IDENTIFIER_CONTEXT = {
    identifier: {
        '@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#identifier',
        '@container': '@set',
    },
};

const stableSerialize = (value: unknown): string => {
    if (value === undefined) return 'undefined';

    if (Array.isArray(value)) {
        return `[${value.map(stableSerialize).join(',')}]`;
    }

    if (value !== null && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        return `{${Object.keys(record)
            .toSorted()
            .map(key => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
            .join(',')}}`;
    }

    return JSON.stringify(value);
};

const deterministicUrnUuid = (...parts: unknown[]): string => {
    const digest = createHash('sha256').update(stableSerialize(parts)).digest('hex').slice(0, 32);
    const variant = ((Number.parseInt(digest[16] ?? '0', 16) & 0x3) | 0x8).toString(16);
    // Mark the hash-derived identifier as a UUIDv5-shaped value with an RFC 4122 variant.
    const value = `${digest.slice(0, 12)}5${digest.slice(13, 16)}${variant}${digest.slice(17)}`;

    return `urn:uuid:${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
};

const institutionProfile = (institution: string) => ({
    type: ['Profile'],
    name: institution,
});

type InstitutionProfile = ReturnType<typeof institutionProfile>;

const toUnsignedCourseCredential = ({
    course,
    courseIndex,
    holderDid,
    institution,
    source,
}: {
    course: ParsedTranscript['courses'][number];
    courseIndex: number;
    holderDid: string;
    institution: string;
    source: InstitutionProfile;
}): UnsignedAchievementCredential => {
    const achievementId = deterministicUrnUuid(
        'transcript-course-achievement',
        holderDid,
        institution,
        courseIndex,
        course
    );
    const displayName = course.courseCode
        ? `${course.courseCode} — ${course.courseName}`
        : course.courseName;

    return UnsignedAchievementCredentialValidator.parse({
        '@context': [VC_V2_CONTEXT, OB_V3_CONTEXT],
        id: deterministicUrnUuid(
            'transcript-course-credential',
            holderDid,
            institution,
            courseIndex,
            course
        ),
        type: ['VerifiableCredential', 'AchievementCredential'],
        name: displayName,
        issuer: holderDid,
        credentialSubject: {
            id: holderDid,
            type: ['AchievementSubject'],
            achievement: {
                id: achievementId,
                type: ['Achievement'],
                achievementType: 'Course',
                name: course.courseName,
                description: course.courseName,
                criteria: {},
                creator: source,
                ...(course.courseCode ? { humanCode: course.courseCode } : {}),
            },
            source,
            ...(course.credits !== undefined ? { creditsEarned: course.credits } : {}),
            ...(course.grade ? { result: [{ type: ['Result'], value: course.grade }] } : {}),
            ...(course.term ? { term: course.term } : {}),
            ...(course.completedAt ? { activityEndDate: course.completedAt } : {}),
        },
    });
};

const toProgramAchievement = (
    transcript: ParsedTranscript,
    holderDid: string,
    source: InstitutionProfile
): Achievement | undefined => {
    const name = transcript.program ?? transcript.fieldOfStudy;
    if (!name) return undefined;

    return {
        id: deterministicUrnUuid(
            'transcript-program-achievement',
            holderDid,
            transcript.institution,
            transcript.program,
            transcript.fieldOfStudy
        ),
        type: ['Achievement'],
        achievementType: 'LearningProgram',
        name,
        description: name,
        criteria: {},
        creator: source,
        ...(transcript.fieldOfStudy ? { fieldOfStudy: transcript.fieldOfStudy } : {}),
    };
};

const toLearnerIdentifiers = (learner: ParsedTranscript['learner']): IdentityObject[] => [
    ...(learner?.name
        ? [
              {
                  type: 'IdentityObject',
                  identityHash: learner.name,
                  identityType: 'name',
                  hashed: false,
              },
          ]
        : []),
    ...(learner?.studentId
        ? [
              {
                  type: 'IdentityObject',
                  identityHash: learner.studentId,
                  identityType: 'studentId',
                  hashed: false,
              },
          ]
        : []),
];

/**
 * Maps document-supported transcript facts to one self-attested CLR v2 credential.
 * The function validates its input and uses content-derived identifiers, so the same
 * transcript and holder DID always produce the same unsigned credential.
 */
export const toUnsignedTranscriptClr = (
    transcript: ParsedTranscript,
    holderDid: string
): UnsignedClrCredential => {
    const parsedTranscript = ParsedTranscriptSchema.parse(transcript);
    const source = institutionProfile(parsedTranscript.institution);
    const courseCredentials = parsedTranscript.courses.map((course, courseIndex) =>
        toUnsignedCourseCredential({
            course,
            courseIndex,
            holderDid,
            institution: parsedTranscript.institution,
            source,
        })
    );
    const programAchievement = toProgramAchievement(parsedTranscript, holderDid, source);
    const identifiers = toLearnerIdentifiers(parsedTranscript.learner);

    const clr: UnsignedClrCredential = {
        '@context': [VC_V2_CONTEXT, OB_V3_CONTEXT, CLR_V2_CONTEXT],
        id: deterministicUrnUuid('transcript-clr', holderDid, parsedTranscript),
        type: ['VerifiableCredential', 'ClrCredential'],
        name: `${parsedTranscript.institution} Transcript`,
        issuer: holderDid,
        ...(parsedTranscript.dateIssued ? { validFrom: parsedTranscript.dateIssued } : {}),
        credentialSubject: {
            id: holderDid,
            type: ['ClrSubject'],
            ...(identifiers.length > 0
                ? {
                      '@context': CLR_SUBJECT_IDENTIFIER_CONTEXT,
                      identifier: identifiers,
                  }
                : {}),
            ...(programAchievement ? { achievement: [programAchievement] } : {}),
            verifiableCredential: courseCredentials,
        },
    };

    return UnsignedClrCredentialValidator.parse(clr);
};
