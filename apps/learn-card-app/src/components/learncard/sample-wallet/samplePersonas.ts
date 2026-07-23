import type { VC } from '@learncard/types';

import { CredentialCategoryEnum } from 'learn-card-base/types/boostAndCredentialMetadata';
import { DEMO_URI_PREFIX } from 'learn-card-base/stores/demoSessionStore';
import type { DemoBoostEntry } from 'learn-card-base/stores/demoSessionStore';
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

export type SampleSkill = {
    category: string;
    skill: string;
    subskills: string[];
};

export type SampleInsightArea = {
    title: string;
    summary: string;
};

export type SampleAiSessionSeed = {
    id: string;
    title: string;
    completed: boolean;
    daysAgo: number;
};

export type SampleAiTopicSeed = {
    title: string;
    sessions: SampleAiSessionSeed[];
};

export type SamplePathwaySeed = {
    id: string;
    title: string;
    description: string;
    skills: string[];
};

export type SampleStagedContent = {
    professionalTitle: string;
    goals: string[];
    roleExperience: { years: number; months: number };
    salary: { salary: string; salaryType: 'per_year' | 'per_hour' };
    workLifeBalance: string;
    jobStability: string;
    insight: {
        strongestArea: SampleInsightArea;
        weakestArea: SampleInsightArea;
        roomForGrowth: SampleInsightArea;
    };
    pathways: SamplePathwaySeed[];
    aiTopic: SampleAiTopicSeed;
};

export type SamplePersona = {
    id: string;
    name: string;
    tagline: string;
    portrait: string;
    recommendedForRoles: string[];
    credentials: SampleCredentialSeed[];
    staged: SampleStagedContent;
};

// Categories must be BoostCMSSKillsCategoryEnum values (durable, stem, digital,
// business, social, creative, trade, athletic, medical) or Skills Hub grouping
// renders them under unknown headers.
const SEED_SKILLS: Record<string, SampleSkill[]> = {
    'rising-graduate:bs-degree': [
        {
            category: 'stem',
            skill: 'Computer Science',
            subskills: ['Algorithms', 'Data Structures'],
        },
        { category: 'durable', skill: 'Problem Solving', subskills: ['Analytical Thinking'] },
    ],
    'rising-graduate:ml-course': [
        { category: 'stem', skill: 'Machine Learning', subskills: ['Supervised Learning'] },
        { category: 'digital', skill: 'Python', subskills: ['Pandas'] },
    ],
    'rising-graduate:hackathon-badge': [
        { category: 'digital', skill: 'Web Development', subskills: ['React'] },
        { category: 'durable', skill: 'Collaboration', subskills: ['Teamwork'] },
    ],
    'rising-graduate:teamwork-badge': [
        { category: 'social', skill: 'Teamwork', subskills: ['Peer Support'] },
    ],
    'rising-graduate:summer-internship': [
        { category: 'digital', skill: 'Software Engineering', subskills: ['Code Review', 'Git'] },
    ],
    'career-changer:pmp-cert': [
        {
            category: 'business',
            skill: 'Project Management',
            subskills: ['Risk Management', 'Scheduling'],
        },
    ],
    'career-changer:aws-cert': [
        { category: 'digital', skill: 'Cloud Computing', subskills: ['AWS', 'Cloud Architecture'] },
    ],
    'career-changer:ux-bootcamp': [
        { category: 'creative', skill: 'UX Design', subskills: ['Wireframing', 'User Research'] },
    ],
    'career-changer:ops-manager': [
        {
            category: 'business',
            skill: 'Operations Management',
            subskills: ['Process Improvement'],
        },
        { category: 'durable', skill: 'Leadership', subskills: ['Decision Making'] },
    ],
    'career-changer:mentor-badge': [
        { category: 'social', skill: 'Mentorship', subskills: ['Coaching'] },
    ],
    'educator:teaching-license': [
        { category: 'durable', skill: 'Instruction', subskills: ['Lesson Planning'] },
    ],
    'educator:pd-literacy': [
        { category: 'durable', skill: 'Literacy Instruction', subskills: ['Phonics'] },
    ],
    'educator:pd-sel': [
        {
            category: 'social',
            skill: 'Social-Emotional Learning',
            subskills: ['Empathy', 'Classroom Culture'],
        },
    ],
    'educator:innovation-award': [
        { category: 'creative', skill: 'Instructional Innovation', subskills: ['EdTech'] },
    ],
    'educator:mentor-teacher-badge': [
        { category: 'social', skill: 'Mentorship', subskills: ['Peer Coaching'] },
    ],
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
        staged: {
            professionalTitle: 'Computer Science Graduate',
            goals: ['Land a software engineering role', 'Build a standout project portfolio'],
            roleExperience: { years: 1, months: 3 },
            salary: { salary: '65000', salaryType: 'per_year' },
            workLifeBalance: 'balanced',
            jobStability: 'growth',
            aiTopic: {
                title: 'Ace the Technical Interview',
                sessions: [
                    {
                        id: 'big-o-review',
                        title: 'Big-O & Data Structures Review',
                        completed: true,
                        daysAgo: 5,
                    },
                    {
                        id: 'mock-interview',
                        title: 'Mock Interview: Arrays & Strings',
                        completed: false,
                        daysAgo: 2,
                    },
                ],
            },
            insight: {
                strongestArea: {
                    title: 'Software Engineering Foundations',
                    summary:
                        'Your degree, coursework, and hackathon record show consistent strength in core engineering and structured problem-solving.',
                },
                weakestArea: {
                    title: 'Professional Experience',
                    summary:
                        'Your record shows limited industry experience so far — more internships or freelance projects would round it out.',
                },
                roomForGrowth: {
                    title: 'Cloud & DevOps',
                    summary:
                        'Employers in your target roles increasingly expect cloud deployment skills to complement your CS foundations.',
                },
            },
            pathways: [
                {
                    id: 'break-into-swe',
                    title: 'Break Into Software Engineering',
                    description:
                        'Turn your degree and projects into a hired-ready portfolio, interview skills, and a first engineering role.',
                    skills: ['JavaScript', 'System Design', 'Technical Interviewing'],
                },
                {
                    id: 'cloud-fundamentals',
                    title: 'Cloud Fundamentals',
                    description:
                        'Build the cloud deployment skills that complement your computer science foundations.',
                    skills: ['AWS', 'CI/CD', 'Docker'],
                },
            ],
        },
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
        staged: {
            professionalTitle: 'Operations Manager',
            goals: ['Transition into technical project management', 'Earn a cloud certification'],
            roleExperience: { years: 12, months: 0 },
            salary: { salary: '95000', salaryType: 'per_year' },
            workLifeBalance: 'balanced',
            jobStability: 'stable',
            aiTopic: {
                title: 'Agile Foundations',
                sessions: [
                    { id: 'scrum-basics', title: 'Scrum Basics', completed: true, daysAgo: 6 },
                    {
                        id: 'sprint-planning',
                        title: 'Sprint Planning Deep Dive',
                        completed: false,
                        daysAgo: 3,
                    },
                ],
            },
            insight: {
                strongestArea: {
                    title: 'Project Leadership',
                    summary:
                        'Your PMP certification and operations background show proven strength in planning, coordination, and delivery.',
                },
                weakestArea: {
                    title: 'Hands-On Technical Skills',
                    summary:
                        'Technical project roles will expect more hands-on familiarity with the systems your teams build.',
                },
                roomForGrowth: {
                    title: 'Agile Delivery',
                    summary:
                        'Deepening your agile toolkit would bridge your operations experience into modern product teams.',
                },
            },
            pathways: [
                {
                    id: 'technical-pm',
                    title: 'Technical Program Management',
                    description:
                        'Bridge your operations leadership into technical program management for product teams.',
                    skills: ['Agile', 'Stakeholder Management', 'Roadmapping'],
                },
                {
                    id: 'cloud-practitioner',
                    title: 'Cloud Practitioner Path',
                    description:
                        'Add the cloud fluency that technical project roles increasingly require.',
                    skills: ['AWS', 'Cloud Cost Management'],
                },
            ],
        },
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
        staged: {
            professionalTitle: 'Middle School Teacher',
            goals: ['Become an instructional coach', 'Deepen social-emotional learning expertise'],
            roleExperience: { years: 8, months: 0 },
            salary: { salary: '62000', salaryType: 'per_year' },
            workLifeBalance: 'important',
            jobStability: 'stable',
            aiTopic: {
                title: 'Data-Driven Instruction',
                sessions: [
                    {
                        id: 'assessment-data',
                        title: 'Reading Assessment Data',
                        completed: true,
                        daysAgo: 7,
                    },
                    {
                        id: 'exit-tickets',
                        title: 'Designing Exit Tickets',
                        completed: false,
                        daysAgo: 2,
                    },
                ],
            },
            insight: {
                strongestArea: {
                    title: 'Instructional Design',
                    summary:
                        'Your license, professional development, and innovation award show sustained strength in designing effective learning experiences.',
                },
                weakestArea: {
                    title: 'Data-Driven Instruction',
                    summary:
                        'Your record shows fewer credentials in assessment analytics — a key expectation for coaching roles.',
                },
                roomForGrowth: {
                    title: 'Mentorship & Coaching',
                    summary:
                        'Your mentor-teacher experience is a strong base for formal instructional coaching credentials.',
                },
            },
            pathways: [
                {
                    id: 'instructional-coach',
                    title: 'Path to Instructional Coach',
                    description:
                        'Turn your classroom leadership into a formal instructional coaching role in your district.',
                    skills: ['Coaching', 'Curriculum Design', 'Peer Feedback'],
                },
                {
                    id: 'sel-specialist',
                    title: 'SEL Specialist',
                    description:
                        'Deepen your social-emotional learning practice into a school-wide specialty.',
                    skills: ['Social-Emotional Learning', 'Classroom Culture'],
                },
            ],
        },
    },
];

export const findSamplePersona = (personaId: string): SamplePersona | undefined =>
    SAMPLE_PERSONAS.find(persona => persona.id === personaId);

export const getRecommendedPersona = (role?: string | null): SamplePersona =>
    SAMPLE_PERSONAS.find(persona => role && persona.recommendedForRoles.includes(role)) ??
    SAMPLE_PERSONAS[0];

const daysAgoIso = (days: number): string => new Date(Date.now() - days * 86_400_000).toISOString();

const SAMPLE_ISSUER_DID = 'did:web:network.learncard.com:users:sample-wallet-issuer';

// Placeholder proof so sample VCs pass VCValidator (e.g. in
// useExistingAiInsightCredential). Never verified: verification actions are
// blocked by the demo gate while a sample wallet is active.
const sampleProof = (created: string) => ({
    type: 'Ed25519Signature2020',
    created,
    proofPurpose: 'assertionMethod',
    verificationMethod: `${SAMPLE_ISSUER_DID}#sample`,
});

const seedToVC = (persona: SamplePersona, seed: SampleCredentialSeed, subjectDid: string): VC => {
    const uri = `${DEMO_URI_PREFIX}${persona.id}:${seed.id}`;
    const issuedAt = daysAgoIso(seed.daysAgo);
    const skills = SEED_SKILLS[`${persona.id}:${seed.id}`];

    return {
        ...(skills && { skills }),
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: uri,
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: {
            id: SAMPLE_ISSUER_DID,
            name: seed.issuerName,
            image: seed.issuerImage,
        },
        issuanceDate: issuedAt,
        proof: sampleProof(issuedAt),
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
    boosts: Record<string, DemoBoostEntry>;
};

const verifiableDataVC = (uri: string, key: string, data: unknown, subjectDid: string): VC => {
    const issuedAt = daysAgoIso(1);

    return {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        id: uri,
        type: ['VerifiableCredential', 'VerifiableData'],
        issuer: subjectDid,
        validFrom: issuedAt,
        proof: sampleProof(issuedAt),
        credentialSubject: {
            id: subjectDid,
            dataKey: key,
            dataPayload: data,
        },
    } as unknown as VC;
};

const compileVerifiableData = (
    persona: SamplePersona,
    key: string,
    data: unknown,
    subjectDid: string
): { record: LCR; uri: string; vc: VC } => {
    const uri = `${DEMO_URI_PREFIX}${persona.id}:verifiable-data:${key}`;

    return {
        uri,
        vc: verifiableDataVC(uri, key, data, subjectDid),
        record: {
            id: `__verifiable_data_${key}__`,
            uri,
            category: CredentialCategoryEnum.verifiableData,
            title: `VerifiableData: ${key}`,
            verifiableData: data,
            issuanceDate: daysAgoIso(1),
            __v: 1,
        } as unknown as LCR,
    };
};

const compileAiTopic = (
    persona: SamplePersona,
    subjectDid: string,
    records: LCR[],
    vcs: Record<string, VC>,
    boosts: Record<string, DemoBoostEntry>
): void => {
    const { aiTopic } = persona.staged;
    const topicBoostUri = `${DEMO_URI_PREFIX}${persona.id}:boost:ai-topic`;
    const topicUri = `${DEMO_URI_PREFIX}${persona.id}:ai-topic`;
    const topicIssuedAt = daysAgoIso(8);

    vcs[topicUri] = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: topicUri,
        type: ['VerifiableCredential'],
        issuer: SAMPLE_ISSUER_DID,
        issuanceDate: topicIssuedAt,
        proof: sampleProof(topicIssuedAt),
        name: aiTopic.title,
        credentialSubject: { id: subjectDid },
        boostId: topicBoostUri,
        boostCredential: { topicInfo: { title: aiTopic.title } },
    } as unknown as VC;

    records.push({
        id: topicUri,
        uri: topicUri,
        category: CredentialCategoryEnum.aiTopic,
        title: aiTopic.title,
        boostUri: topicBoostUri,
        date: topicIssuedAt,
        __v: 1,
    } as unknown as LCR);

    const sessionBoostUris = aiTopic.sessions.map(session => {
        const sessionBoostUri = `${DEMO_URI_PREFIX}${persona.id}:boost:ai-session:${session.id}`;
        const sessionUri = `${DEMO_URI_PREFIX}${persona.id}:ai-session:${session.id}`;
        const sessionIssuedAt = daysAgoIso(session.daysAgo);

        vcs[sessionUri] = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id: sessionUri,
            type: ['VerifiableCredential'],
            issuer: SAMPLE_ISSUER_DID,
            issuanceDate: sessionIssuedAt,
            proof: sampleProof(sessionIssuedAt),
            name: session.title,
            credentialSubject: { id: subjectDid },
            boostId: sessionBoostUri,
            completed: session.completed,
            boostCredential: { summaryInfo: { title: session.title } },
        } as unknown as VC;

        records.push({
            id: sessionUri,
            uri: sessionUri,
            category: CredentialCategoryEnum.aiSummary,
            title: session.title,
            boostUri: sessionBoostUri,
            date: sessionIssuedAt,
            __v: 1,
        } as unknown as LCR);

        boosts[sessionBoostUri] = {
            boost: {
                uri: sessionBoostUri,
                name: session.title,
                category: CredentialCategoryEnum.aiSummary,
                status: 'LIVE',
            },
            childUris: [],
        };

        return sessionBoostUri;
    });

    boosts[topicBoostUri] = {
        boost: {
            uri: topicBoostUri,
            name: aiTopic.title,
            category: CredentialCategoryEnum.aiTopic,
            status: 'LIVE',
        },
        childUris: sessionBoostUris,
    };
};

const compileStagedContent = (
    persona: SamplePersona,
    subjectDid: string,
    records: LCR[],
    vcs: Record<string, VC>,
    boosts: Record<string, DemoBoostEntry>
): void => {
    const { staged } = persona;

    const pathwayUris = staged.pathways.map(pathway => {
        const uri = `${DEMO_URI_PREFIX}${persona.id}:pathway:${pathway.id}`;
        const issuedAt = daysAgoIso(1);

        vcs[uri] = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id: uri,
            type: ['VerifiableCredential'],
            issuer: SAMPLE_ISSUER_DID,
            issuanceDate: issuedAt,
            proof: sampleProof(issuedAt),
            credentialSubject: { id: subjectDid },
            learningPathway: {
                step: {
                    title: pathway.title,
                    description: pathway.description,
                    skills: pathway.skills,
                    keywords: {},
                },
            },
        } as unknown as VC;

        return uri;
    });

    const insightUri = `${DEMO_URI_PREFIX}${persona.id}:ai-insight`;
    const insightIssuedAt = daysAgoIso(1);

    vcs[insightUri] = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: insightUri,
        type: ['VerifiableCredential'],
        issuer: SAMPLE_ISSUER_DID,
        issuanceDate: insightIssuedAt,
        proof: sampleProof(insightIssuedAt),
        credentialSubject: { id: subjectDid },
        insights: {
            strongestArea: staged.insight.strongestArea,
            weakestArea: staged.insight.weakestArea,
            roomForGrowth: staged.insight.roomForGrowth,
            suggestedPathways: pathwayUris,
        },
    } as unknown as VC;

    records.push({
        id: '__ai_insight__',
        uri: insightUri,
        category: CredentialCategoryEnum.aiInsight,
        title: 'AI Insight',
        date: insightIssuedAt,
    } as LCR);

    const goals = compileVerifiableData(
        persona,
        'skill-profile-goals',
        { goals: staged.goals },
        subjectDid
    );
    records.push(goals.record);
    vcs[goals.uri] = goals.vc;

    const title = compileVerifiableData(
        persona,
        'skill-profile-professional-title',
        { professionalTitle: staged.professionalTitle },
        subjectDid
    );
    records.push(title.record);
    vcs[title.uri] = title.vc;

    const workHistoryUris = persona.credentials
        .filter(seed => seed.category === CredentialCategoryEnum.workHistory)
        .map(seed => `${DEMO_URI_PREFIX}${persona.id}:${seed.id}`);

    const extraProfileData: [string, unknown][] = [
        ['skill-profile-role-experience', { lifetimeExperience: staged.roleExperience }],
        ['skill-profile-work-history', { selectedCredentialUris: workHistoryUris }],
        ['skill-profile-salary', staged.salary],
        ['skill-profile-work-life-balance', { workLifeBalance: staged.workLifeBalance }],
        ['skill-profile-job-stability', { jobStability: staged.jobStability }],
    ];

    extraProfileData.forEach(([key, data]) => {
        const entry = compileVerifiableData(persona, key, data, subjectDid);
        records.push(entry.record);
        vcs[entry.uri] = entry.vc;
    });

    compileAiTopic(persona, subjectDid, records, vcs, boosts);
};

export const compileSamplePersona = (
    persona: SamplePersona,
    subjectDid: string
): CompiledSamplePersona => {
    const records: LCR[] = [];
    const vcs: Record<string, VC> = {};
    const boosts: Record<string, DemoBoostEntry> = {};

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
            // Marks the record as already-migrated so useBackfillBoostUris
            // never tries to index.update demo records (a blocked write).
            __v: 1,
        } as LCR);
    });

    compileStagedContent(persona, subjectDid, records, vcs, boosts);

    return { records, vcs, boosts };
};
