import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';
import { DEMO_SCHOOL_ISSUER, STUDENT_ACHIEVEMENTS } from '../personas/studentAchievements';

const createStudentAchievementFixture = ({
    id,
    name,
    description,
    profile,
    achievement,
    validFrom,
    credentialId,
}: {
    id: string;
    name: string;
    description: string;
    profile: CredentialFixture['profile'];
    achievement: (typeof STUDENT_ACHIEVEMENTS)[keyof typeof STUDENT_ACHIEVEMENTS];
    credentialId: string;
    validFrom: string;
}): CredentialFixture => ({
    id,
    name,
    description,
    spec: 'obv3',
    profile,
    features: ['image', 'alignment', 'skills', 'display'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,
    tags: ['student-persona'],
    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: achievement.name,
        description: achievement.description,
        id: credentialId,
        issuer: DEMO_SCHOOL_ISSUER,
        validFrom,
        credentialSubject: {
            id: 'did:example:student',
            type: ['AchievementSubject'],
            achievement,
        },
    },
});

export const obv3StudentCivicLeadership = createStudentAchievementFixture({
    id: 'obv3/student-civic-leadership',
    name: 'Student Persona — Civic Leadership',
    description: 'A standards-pure OBv3 leadership badge for the Student sample persona.',
    profile: 'badge',
    achievement: STUDENT_ACHIEVEMENTS.civicLeadership,
    credentialId: 'urn:uuid:10000000-0000-4000-8000-000000000001',
    validFrom: '2025-03-15T00:00:00Z',
});

export const obv3StudentWebDevelopment = createStudentAchievementFixture({
    id: 'obv3/student-web-development',
    name: 'Student Persona — Web Development Foundations',
    description: 'A standards-pure OBv3 course certificate for the Student sample persona.',
    profile: 'course',
    achievement: STUDENT_ACHIEVEMENTS.webDevelopment,
    validFrom: '2025-05-28T00:00:00Z',
    credentialId: 'urn:uuid:10000000-0000-4000-8000-000000000002',
});

export const obv3StudentCommunityImpact = createStudentAchievementFixture({
    id: 'obv3/student-community-impact',
    name: 'Student Persona — Community Impact Award',
    description: 'A standards-pure OBv3 community award for the Student sample persona.',
    profile: 'badge',
    achievement: STUDENT_ACHIEVEMENTS.communityImpact,
    credentialId: 'urn:uuid:10000000-0000-4000-8000-000000000003',
    validFrom: '2025-06-10T00:00:00Z',
});
