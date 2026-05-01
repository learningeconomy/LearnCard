import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const boostWithSkills: CredentialFixture = {
    id: 'boost/with-skills',
    name: 'LearnCard Boost with Skills',
    description:
        'LearnCard BoostCredential with attached skills taxonomy, evidence files, and alignment',
    spec: 'obv3',
    profile: 'boost',
    features: ['skills', 'evidence', 'alignment'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,
    tags: ['learncard', 'boost', 'skills'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://ctx.learncard.com/boosts/1.0.3.json',
        ],
        id: 'urn:uuid:d0e1f2a3-0010-4000-8000-000000000001',
        type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
        name: 'Full-Stack Developer Certification',
        issuer: { id: 'did:example:bootcamp' },
        validFrom: '2024-11-01T00:00:00Z',
        credentialSubject: {
            id: 'did:example:graduate55',
            type: ['AchievementSubject'],
            achievement: {
                id: 'urn:uuid:d0e1f2a3-0010-4000-8000-000000000002',
                type: ['Achievement'],
                achievementType: 'Certification',
                name: 'Full-Stack Developer',
                description: 'Completed 16-week intensive full-stack bootcamp.',
                image: '',
                criteria: {
                    narrative:
                        'Complete all coursework, capstone project, and pass technical assessments.',
                },
                alignment: [
                    {
                        type: ['Alignment'],
                        targetName: 'Full Stack Web Developer',
                        targetUrl: 'https://www.onetonline.org/link/summary/15-1254.00',
                        targetType: 'CTDL',
                        targetFramework: 'O*NET-SOC',
                    },
                ],
            },
        },
        evidence: [
            {
                type: ['Evidence', 'EvidenceFile'],
                name: 'Capstone Project Repository',
                description: 'GitHub repository for capstone full-stack application.',
            },
        ],
        skills: [
            {
                category: 'Frontend',
                skill: 'React',
                subskills: ['Hooks', 'Context API', 'Server Components'],
            },
            {
                category: 'Backend',
                skill: 'Node.js',
                subskills: ['Express', 'REST APIs', 'Authentication'],
            },
            {
                category: 'Database',
                skill: 'PostgreSQL',
                subskills: ['Schema Design', 'Migrations', 'Query Optimization'],
            },
        ],
    },
};
