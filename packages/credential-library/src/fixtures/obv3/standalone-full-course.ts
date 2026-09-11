import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const obv3StandaloneFullCourse: CredentialFixture = {
    id: 'obv3/standalone-full-course',
    name: 'Applied Data Ethics and Responsible AI Course Completion',
    description:
        'A standalone Open Badges v3 course credential with the academic metadata commonly present on a course nested inside a Comprehensive Learner Record.',
    spec: 'obv3',
    profile: 'course',
    features: ['image', 'evidence', 'alignment', 'results', 'source'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,
    tags: ['course', 'standalone', 'higher-education', 'responsible-ai', 'full-metadata'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:7f1a9b36-91d2-4bd5-a7af-3d8d8e418101',
        type: ['VerifiableCredential', 'AchievementCredential'],
        name: 'Applied Data Ethics and Responsible AI',
        description:
            'Recognizes successful completion of a four-credit undergraduate course in ethical data practice and responsible artificial intelligence.',
        image: {
            id: 'https://aster-ridge.example/credentials/images/data-ethics-course.png',
            type: 'Image',
            caption: 'Applied Data Ethics and Responsible AI course credential',
        },
        issuer: {
            id: 'did:web:aster-ridge.example',
            type: ['Profile'],
            name: 'Aster Ridge Institute',
            url: 'https://aster-ridge.example',
            description:
                'A fictional higher education institution focused on technology and public impact.',
            email: 'registrar@aster-ridge.example',
            image: {
                id: 'https://aster-ridge.example/brand/institute-mark.png',
                type: 'Image',
                caption: 'Aster Ridge Institute mark',
            },
        },
        validFrom: '2026-05-22T16:00:00Z',
        credentialSubject: {
            id: 'did:example:learner-ari-1087',
            type: ['AchievementSubject'],
            activityStartDate: '2026-01-12T08:00:00Z',
            activityEndDate: '2026-05-18T23:59:59Z',
            creditsEarned: 4,
            term: 'Spring 2026',
            narrative:
                'The learner completed the course requirements, including a team audit of an automated decision system.',
            source: {
                id: 'https://aster-ridge.example/offices/registrar',
                type: ['Profile'],
                name: 'Aster Ridge Institute Registrar',
                url: 'https://aster-ridge.example/offices/registrar',
            },
            achievement: {
                id: 'https://aster-ridge.example/catalog/courses/DAI-318',
                type: ['Achievement'],
                achievementType: 'Course',
                name: 'Applied Data Ethics and Responsible AI',
                description:
                    'An interdisciplinary course covering data governance, algorithmic accountability, bias assessment, privacy, transparency, and responsible deployment of artificial intelligence systems.',
                humanCode: 'DAI-318',
                fieldOfStudy: 'Data Science',
                creditsAvailable: 4,
                inLanguage: 'en-US',
                version: '2026.1',
                criteria: {
                    id: 'https://aster-ridge.example/catalog/courses/DAI-318/criteria',
                    narrative:
                        'Complete all seminars and labs, earn at least 70 percent overall, and pass the final algorithmic impact assessment project.',
                },
                image: {
                    id: 'https://aster-ridge.example/credentials/images/data-ethics-course.png',
                    type: 'Image',
                    caption: 'Applied Data Ethics and Responsible AI course credential',
                },
                creator: {
                    id: 'https://aster-ridge.example/schools/computing-and-society',
                    type: ['Profile'],
                    name: 'School of Computing and Society',
                    url: 'https://aster-ridge.example/schools/computing-and-society',
                    description:
                        'The academic unit responsible for the course curriculum and assessment.',
                    parentOrg: {
                        id: 'did:web:aster-ridge.example',
                        type: ['Profile'],
                        name: 'Aster Ridge Institute',
                    },
                },
                otherIdentifier: [
                    {
                        type: 'IdentifierEntry',
                        identifier: 'ARI-DAI-318-2026-SP',
                        identifierType: 'identifier',
                    },
                ],
                alignment: [
                    {
                        type: ['Alignment'],
                        targetCode: 'ARIDF-4.2',
                        targetName: 'Evaluate algorithmic bias and disparate impact',
                        targetDescription:
                            'Evaluate automated systems for bias, disparate impact, and limitations in representative data.',
                        targetFramework: 'Aster Ridge Data Responsibility Framework',
                        targetType: 'CFItem',
                        targetUrl:
                            'https://aster-ridge.example/frameworks/data-responsibility/items/4.2',
                    },
                    {
                        type: ['Alignment'],
                        targetCode: 'ARIDF-6.1',
                        targetName: 'Design accountable data governance practices',
                        targetDescription:
                            'Design governance practices that document data provenance, consent, oversight, and recourse.',
                        targetFramework: 'Aster Ridge Data Responsibility Framework',
                        targetType: 'CFItem',
                        targetUrl:
                            'https://aster-ridge.example/frameworks/data-responsibility/items/6.1',
                    },
                ],
                resultDescription: [
                    {
                        id: 'urn:uuid:7f1a9b36-91d2-4bd5-a7af-3d8d8e418103',
                        type: ['ResultDescription'],
                        name: 'Final Letter Grade',
                        resultType: 'LetterGrade',
                        allowedValue: ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F'],
                        requiredValue: 'C',
                    },
                    {
                        id: 'urn:uuid:7f1a9b36-91d2-4bd5-a7af-3d8d8e418104',
                        type: ['ResultDescription'],
                        name: 'Final Percentage',
                        resultType: 'Percent',
                        valueMin: '0',
                        valueMax: '100',
                        requiredValue: '70',
                    },
                    {
                        id: 'urn:uuid:7f1a9b36-91d2-4bd5-a7af-3d8d8e418105',
                        type: ['ResultDescription'],
                        name: 'Course Completion Status',
                        resultType: 'Status',
                        allowedValue: [
                            'Completed',
                            'Enrolled',
                            'Failed',
                            'InProgress',
                            'OnHold',
                            'Withdrew',
                        ],
                    },
                ],
                tag: [
                    'data-ethics',
                    'responsible-ai',
                    'algorithmic-accountability',
                    'data-governance',
                ],
            },
            result: [
                {
                    type: ['Result'],
                    resultDescription: 'urn:uuid:7f1a9b36-91d2-4bd5-a7af-3d8d8e418103',
                    value: 'A-',
                },
                {
                    type: ['Result'],
                    resultDescription: 'urn:uuid:7f1a9b36-91d2-4bd5-a7af-3d8d8e418104',
                    value: '92',
                },
                {
                    type: ['Result'],
                    resultDescription: 'urn:uuid:7f1a9b36-91d2-4bd5-a7af-3d8d8e418105',
                    status: 'Completed',
                },
            ],
        },
        evidence: [
            {
                id: 'https://aster-ridge.example/records/ari-1087/DAI-318',
                type: ['Evidence'],
                name: 'Official Course Completion Record',
                description:
                    'Registrar record confirming the learner earned four credits with a final grade of A-.',
                narrative:
                    'Course requirements were completed during the Spring 2026 academic term.',
            },
            {
                id: 'https://aster-ridge.example/showcase/ari-1087/impact-assessment',
                type: ['Evidence'],
                name: 'Algorithmic Impact Assessment',
                description:
                    'Final project evaluating fairness, transparency, and governance controls for a fictional automated decision system.',
            },
        ],
    },
};
