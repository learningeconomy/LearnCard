import type { VC } from '@learncard/types';

import { CredentialCategoryEnum, DEMO_URI_PREFIX } from 'learn-card-base';
import type { LCR } from 'learn-card-base/types/credential-records';

const issuerLogo = (seed: string, backgroundColor: string) =>
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        seed
    )}&backgroundColor=${backgroundColor}`;

const ACHIEVEMENT_IMG = {
    degree: 'https://cdn.filestackcontent.com/Y9DCbjt6Q0CccrCDX46I',
    certificate: 'https://cdn.filestackcontent.com/OSTqZlxSCe6B62jwPm7O',
    award: 'https://cdn.filestackcontent.com/F9yva92WQ0CPisIeQRmr',
} as const;

export type SampleCredentialSeed = {
    id: string;
    title: string;
    issuerName: string;
    issuerImage: string;
    achievementImage: string;
    achievementType: string;
    category: CredentialCategoryEnum;
    daysAgo: number;
    description?: string;
};

export type SamplePersona = {
    id: string;
    name: string;
    tagline: string;
    portrait: string;
    recommendedForRoles: string[];
    credentials: SampleCredentialSeed[];
};

export const SAMPLE_PERSONAS: SamplePersona[] = [
    {
        id: 'rising-graduate',
        name: 'The Rising Graduate',
        tagline: 'A student finishing school with degrees, courses, and community awards',
        portrait: 'https://i.pravatar.cc/160?img=12',
        recommendedForRoles: ['learner', 'guardian'],
        credentials: [
            {
                id: 'bs-degree',
                title: 'Bachelor of Science, Computer Science',
                issuerName: 'State University',
                issuerImage: issuerLogo('State University', '0B6E4F'),
                achievementImage: ACHIEVEMENT_IMG.degree,
                achievementType: 'Degree',
                category: CredentialCategoryEnum.achievement,
                daysAgo: 4,
            },
            {
                id: 'ml-course',
                title: 'Introduction to Machine Learning',
                issuerName: 'State University',
                issuerImage: issuerLogo('State University', '0B6E4F'),
                achievementImage: ACHIEVEMENT_IMG.certificate,
                achievementType: 'Course',
                category: CredentialCategoryEnum.learningHistory,
                daysAgo: 40,
            },
            {
                id: 'calc-course',
                title: 'Calculus II',
                issuerName: 'State University',
                issuerImage: issuerLogo('State University', '0B6E4F'),
                achievementImage: ACHIEVEMENT_IMG.certificate,
                achievementType: 'Course',
                category: CredentialCategoryEnum.learningHistory,
                daysAgo: 120,
            },
            {
                id: 'hackathon-badge',
                title: 'Campus Hackathon Finalist',
                issuerName: 'State University',
                issuerImage: issuerLogo('State University', '0B6E4F'),
                achievementImage: ACHIEVEMENT_IMG.award,
                achievementType: 'Badge',
                category: CredentialCategoryEnum.socialBadge,
                daysAgo: 60,
            },
            {
                id: 'teamwork-badge',
                title: 'Outstanding Teamwork',
                issuerName: 'Robotics Club',
                issuerImage: issuerLogo('Robotics Club', '1F6FEB'),
                achievementImage: ACHIEVEMENT_IMG.award,
                achievementType: 'Badge',
                category: CredentialCategoryEnum.socialBadge,
                daysAgo: 90,
            },
            {
                id: 'volunteer-award',
                title: 'Volunteer of the Year',
                issuerName: 'American Red Cross',
                issuerImage: issuerLogo('Red Cross', 'C81E1E'),
                achievementImage: ACHIEVEMENT_IMG.award,
                achievementType: 'CommunityService',
                category: CredentialCategoryEnum.achievement,
                daysAgo: 30,
            },
            {
                id: 'summer-internship',
                title: 'Software Engineering Intern',
                issuerName: 'Acme Corp',
                issuerImage: issuerLogo('Acme Corp', '18224E'),
                achievementImage: ACHIEVEMENT_IMG.certificate,
                achievementType: 'ext:Employment',
                category: CredentialCategoryEnum.workHistory,
                daysAgo: 75,
            },
        ],
    },
    {
        id: 'career-changer',
        name: 'The Career Changer',
        tagline: 'A professional pivoting careers with certifications and work experience',
        portrait: 'https://i.pravatar.cc/160?img=45',
        recommendedForRoles: ['learner'],
        credentials: [
            {
                id: 'pmp-cert',
                title: 'Project Management Professional (PMP)',
                issuerName: 'Project Management Institute',
                issuerImage: issuerLogo('PMI', '1F6FEB'),
                achievementImage: ACHIEVEMENT_IMG.certificate,
                achievementType: 'ext:ProfessionalCertification',
                category: CredentialCategoryEnum.achievement,
                daysAgo: 10,
            },
            {
                id: 'aws-cert',
                title: 'AWS Solutions Architect – Associate',
                issuerName: 'Amazon Web Services',
                issuerImage: issuerLogo('AWS', 'F59E0B'),
                achievementImage: ACHIEVEMENT_IMG.certificate,
                achievementType: 'ext:ProfessionalCertification',
                category: CredentialCategoryEnum.achievement,
                daysAgo: 45,
            },
            {
                id: 'ux-bootcamp',
                title: 'UX Design Bootcamp',
                issuerName: 'Design Lab',
                issuerImage: issuerLogo('Design Lab', '7C3AED'),
                achievementImage: ACHIEVEMENT_IMG.certificate,
                achievementType: 'Course',
                category: CredentialCategoryEnum.learningHistory,
                daysAgo: 90,
            },
            {
                id: 'ops-manager',
                title: 'Operations Manager',
                issuerName: 'Retail Group Inc',
                issuerImage: issuerLogo('Retail Group', '18224E'),
                achievementImage: ACHIEVEMENT_IMG.certificate,
                achievementType: 'ext:Employment',
                category: CredentialCategoryEnum.workHistory,
                daysAgo: 400,
            },
            {
                id: 'mentor-badge',
                title: 'Peer Mentor',
                issuerName: 'Career Pivot Community',
                issuerImage: issuerLogo('Career Pivot', '0B6E4F'),
                achievementImage: ACHIEVEMENT_IMG.award,
                achievementType: 'Badge',
                category: CredentialCategoryEnum.socialBadge,
                daysAgo: 20,
            },
        ],
    },
    {
        id: 'educator',
        name: 'The Educator',
        tagline: 'A teacher with licenses, professional development, and classroom awards',
        portrait: 'https://i.pravatar.cc/160?img=33',
        recommendedForRoles: ['teacher', 'counselor', 'admin'],
        credentials: [
            {
                id: 'teaching-license',
                title: 'Professional Teaching License',
                issuerName: 'State Board of Education',
                issuerImage: issuerLogo('State Board', '0B6E4F'),
                achievementImage: ACHIEVEMENT_IMG.certificate,
                achievementType: 'ext:License',
                category: CredentialCategoryEnum.achievement,
                daysAgo: 200,
            },
            {
                id: 'pd-literacy',
                title: 'Literacy Instruction Strategies',
                issuerName: 'Teach Forward Institute',
                issuerImage: issuerLogo('Teach Forward', '1F6FEB'),
                achievementImage: ACHIEVEMENT_IMG.certificate,
                achievementType: 'Course',
                category: CredentialCategoryEnum.learningHistory,
                daysAgo: 35,
            },
            {
                id: 'pd-sel',
                title: 'Social-Emotional Learning Fundamentals',
                issuerName: 'Teach Forward Institute',
                issuerImage: issuerLogo('Teach Forward', '1F6FEB'),
                achievementImage: ACHIEVEMENT_IMG.certificate,
                achievementType: 'Course',
                category: CredentialCategoryEnum.learningHistory,
                daysAgo: 80,
            },
            {
                id: 'innovation-award',
                title: 'Classroom Innovation Award',
                issuerName: 'District 12 Schools',
                issuerImage: issuerLogo('District 12', 'C81E1E'),
                achievementImage: ACHIEVEMENT_IMG.award,
                achievementType: 'Award',
                category: CredentialCategoryEnum.achievement,
                daysAgo: 15,
            },
            {
                id: 'mentor-teacher-badge',
                title: 'Mentor Teacher',
                issuerName: 'District 12 Schools',
                issuerImage: issuerLogo('District 12', 'C81E1E'),
                achievementImage: ACHIEVEMENT_IMG.award,
                achievementType: 'Badge',
                category: CredentialCategoryEnum.socialBadge,
                daysAgo: 50,
            },
        ],
    },
];

export const findSamplePersona = (personaId: string): SamplePersona | undefined =>
    SAMPLE_PERSONAS.find(persona => persona.id === personaId);

export const getRecommendedPersona = (role?: string | null): SamplePersona =>
    SAMPLE_PERSONAS.find(persona => role && persona.recommendedForRoles.includes(role)) ??
    SAMPLE_PERSONAS[0];

const daysAgoIso = (days: number): string => new Date(Date.now() - days * 86_400_000).toISOString();

const seedToVC = (persona: SamplePersona, seed: SampleCredentialSeed, subjectDid: string): VC => {
    const uri = `${DEMO_URI_PREFIX}${persona.id}:${seed.id}`;
    const issuedAt = daysAgoIso(seed.daysAgo);

    return {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: uri,
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: {
            id: 'did:web:network.learncard.com:users:sample-wallet-issuer',
            name: seed.issuerName,
            image: seed.issuerImage,
        },
        issuanceDate: issuedAt,
        name: seed.title,
        credentialSubject: {
            id: subjectDid,
            type: ['AchievementSubject'],
            achievement: {
                id: `${uri}#achievement`,
                type: ['Achievement'],
                achievementType: seed.achievementType,
                name: seed.title,
                description:
                    seed.description ?? `${seed.title}, issued by ${seed.issuerName}. (Sample)`,
                image: seed.achievementImage,
                criteria: { narrative: `Awarded for completing ${seed.title}.` },
            },
        },
    } as unknown as VC;
};

export type CompiledSamplePersona = {
    records: LCR[];
    vcs: Record<string, VC>;
};

export const compileSamplePersona = (
    persona: SamplePersona,
    subjectDid: string
): CompiledSamplePersona => {
    const records: LCR[] = [];
    const vcs: Record<string, VC> = {};

    persona.credentials.forEach(seed => {
        const uri = `${DEMO_URI_PREFIX}${persona.id}:${seed.id}`;

        vcs[uri] = seedToVC(persona, seed, subjectDid);

        records.push({
            id: uri,
            uri,
            category: seed.category,
            title: seed.title,
            imgUrl: seed.achievementImage,
            from: seed.issuerName,
            date: daysAgoIso(seed.daysAgo),
        } as LCR);
    });

    return { records, vcs };
};
