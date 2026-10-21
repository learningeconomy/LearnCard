import type { CredentialFixture } from '../../types';

/**
 * LC-2184: synthetic, unsigned CLR display/issuance template.
 * Both the outer record and embedded achievements intentionally have no proof.
 * Sign/rebind children before the outer CLR for cryptographic verification tests.
 */
export const clrProfessionalOrganizationRecord: CredentialFixture = {
    id: 'clr/professional-organization-record',
    name: 'Membership & Development — Society of Applied Practice',
    description:
        'Explores membership admission and identifiers, a membership period, volunteer roles, and independently issued professional-development evidence. Unsigned display/issuance template; child proofs must be issued separately for a fully verifiable CLR.',
    spec: 'clr-v2',
    profile: 'learner-record',
    features: [
        'nested-credentials',
        'associations',
        'results',
        'evidence',
        'alignment',
        'source',
        'expiration',
    ],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: [
        'lc-2184',
        'non-academic',
        'synthetic',
        'professional-organization',
        'membership',
        'community-service',
        'professional-development',
        'multi-issuer',
    ],
    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            {
                partial: {
                    '@id': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#partial',
                    '@type': 'http://www.w3.org/2001/XMLSchema#boolean',
                },
                identifier: {
                    '@id': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#identifier',
                    '@container': '@set',
                },
            },
        ],
        id: 'urn:uuid:d9547bd5-c1ed-5049-847a-24fa830bdfee',
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Membership & Development — Society of Applied Practice',
        description:
            'Synthetic demonstration record as of September 1, 2026. Explores membership admission and identifiers, a membership period, volunteer roles, and independently issued professional-development evidence.',
        issuer: {
            id: 'did:example:lc2184-practice-guild',
            type: ['Profile'],
            name: 'Society of Applied Practice (Fictional)',
            url: 'https://practice-guild.example',
            description: 'Fictional organization used only for LearnCard display tests.',
        },
        validFrom: '2026-09-01T12:00:00Z',
        partial: true,
        credentialSubject: {
            id: 'did:example:lc2184-alex-morgan',
            type: ['ClrSubject'],
            identifier: [
                {
                    type: 'IdentityObject',
                    hashed: false,
                    identityType: 'name',
                    identityHash: 'Alex Morgan (Synthetic)',
                },
            ],
            verifiableCredential: [
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:6d5e9cdf-41a6-5223-abff-faceaad2f29f',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Professional Society Membership',
                    description:
                        'Admission to a fictional professional organization for a stated period.',
                    issuer: {
                        id: 'did:example:lc2184-practice-guild',
                        type: ['Profile'],
                        name: 'Society of Applied Practice (Fictional)',
                        url: 'https://practice-guild.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-01-01T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:6ad7f99b-7d9d-59a8-a207-825d1d2bf57e',
                            type: ['Achievement'],
                            achievementType: 'Membership',
                            name: 'Professional Society Membership',
                            description:
                                'Admission to a fictional professional organization for a stated period.',
                            criteria: {
                                narrative:
                                    'Meet the society membership criteria and receive an admission decision.',
                            },
                            creator: {
                                id: 'did:example:lc2184-practice-guild',
                                type: ['Profile'],
                                name: 'Society of Applied Practice (Fictional)',
                                url: 'https://practice-guild.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-PROFESSIONAL-MEMBERSHIP',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:ea631e7d-ca45-58ab-85e6-f96da00fa43c',
                                    type: ['ResultDescription'],
                                    name: 'Membership admission',
                                    resultType: 'Status',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Professional practice participation',
                                    targetCode: 'PRO-101',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/pro-101',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        activityStartDate: '2026-01-01T00:00:00Z',
                        activityEndDate: '2026-12-31T23:59:59Z',
                        role: 'Professional Member',
                        source: {
                            id: 'did:example:lc2184-practice-guild',
                            type: ['Profile'],
                            name: 'Society of Applied Practice (Fictional)',
                            url: 'https://practice-guild.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        identifier: [
                            {
                                type: 'IdentityObject',
                                hashed: false,
                                identityType: 'ext:membershipId',
                                identityHash: 'SYN-MEM-2184-001',
                            },
                        ],
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:ea631e7d-ca45-58ab-85e6-f96da00fa43c',
                                status: 'Completed',
                            },
                        ],
                    },
                    awardedDate: '2026-01-01T00:00:00Z',
                    validUntil: '2026-12-31T23:59:59Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Admission record',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'Membership SYN-MEM-2184-001 covers calendar year 2026; admission is not a professional license.',
                            genre: 'Assessment record',
                            audience: 'Learner and authorized reviewer',
                        },
                    ],
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:ec9e99e0-7f37-5bba-ab43-f7b121f6784f',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Community Mentoring Contribution',
                    description:
                        'A member contribution with a documented role and activity period.',
                    issuer: {
                        id: 'did:example:lc2184-practice-guild',
                        type: ['Profile'],
                        name: 'Society of Applied Practice (Fictional)',
                        url: 'https://practice-guild.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-07-03T12:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:0d94d9bc-0354-5f50-9644-c20495128c8a',
                            type: ['Achievement'],
                            achievementType: 'CommunityService',
                            name: 'Community Mentoring Contribution',
                            description:
                                'A member contribution with a documented role and activity period.',
                            criteria: {
                                narrative: 'Complete the mentoring cycle and submit a reflection.',
                            },
                            creator: {
                                id: 'did:example:lc2184-practice-guild',
                                type: ['Profile'],
                                name: 'Society of Applied Practice (Fictional)',
                                url: 'https://practice-guild.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-PROFESSIONAL-SERVICE',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:1910a1a5-d975-5ec6-926c-5157faef1672',
                                    type: ['ResultDescription'],
                                    name: 'Service completion',
                                    resultType: 'Status',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Facilitates peer development',
                                    targetCode: 'MENTOR-101',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/mentor-101',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        activityStartDate: '2026-02-01T09:00:00Z',
                        activityEndDate: '2026-06-30T17:00:00Z',
                        role: 'Volunteer Mentor',
                        narrative:
                            'Supported a synthetic peer-learning cohort and organized four mentoring sessions.',
                        source: {
                            id: 'did:example:lc2184-practice-guild',
                            type: ['Profile'],
                            name: 'Society of Applied Practice (Fictional)',
                            url: 'https://practice-guild.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:1910a1a5-d975-5ec6-926c-5157faef1672',
                                status: 'Completed',
                            },
                        ],
                    },
                    awardedDate: '2026-07-03T12:00:00Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Mentoring reflection',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'The member reflected on four peer-learning sessions without disclosing participants.',
                            genre: 'Assessment record',
                            audience: 'Learner and authorized reviewer',
                        },
                    ],
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    id: 'urn:uuid:8c7b258d-3731-587c-8079-72b352edefe4',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Responsible Practice Development Badge',
                    description:
                        'A professional-development activity issued by a provider distinct from the society.',
                    issuer: {
                        id: 'did:example:lc2184-cedar-training',
                        type: ['Profile'],
                        name: 'Cedar Technical Training',
                        url: 'https://cedar-training.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-05-04T12:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:34dbdf5a-f88a-5053-9dbd-9b7f0ffc82b2',
                            type: ['Achievement'],
                            achievementType: 'Badge',
                            name: 'Responsible Practice Development Badge',
                            description:
                                'A professional-development activity issued by a provider distinct from the society.',
                            criteria: {
                                narrative:
                                    'Participate in at least eight hours of development activities and submit a reflection.',
                            },
                            creator: {
                                id: 'did:example:lc2184-practice-guild',
                                type: ['Profile'],
                                name: 'Society of Applied Practice (Fictional)',
                                url: 'https://practice-guild.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-PROFESSIONAL-DEVELOPMENT',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:5763e2dd-c18e-5070-ac4d-e06fbfeffcb7',
                                    type: ['ResultDescription'],
                                    name: 'Professional development participation (hours)',
                                    resultType: 'RawScore',
                                    valueMin: '0',
                                    valueMax: '12',
                                    requiredValue: '8',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Reflects on professional decisions',
                                    targetCode: 'ETHICS-101',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/ethics-101',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        activityStartDate: '2026-04-01T09:00:00Z',
                        activityEndDate: '2026-04-30T17:00:00Z',
                        role: 'Participant',
                        source: {
                            id: 'did:example:lc2184-cedar-training',
                            type: ['Profile'],
                            name: 'Cedar Technical Training',
                            url: 'https://cedar-training.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:5763e2dd-c18e-5070-ac4d-e06fbfeffcb7',
                                value: '10',
                            },
                        ],
                    },
                    awardedDate: '2026-05-04T12:00:00Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Professional development reflection',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'Ten participation hours were recorded. No conversion to CEUs or regulatory credit is asserted.',
                            genre: 'Assessment record',
                            audience: 'Learner and authorized reviewer',
                        },
                    ],
                },
            ],
            association: [
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:6ad7f99b-7d9d-59a8-a207-825d1d2bf57e',
                    targetId: 'urn:uuid:0d94d9bc-0354-5f50-9644-c20495128c8a',
                },
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:6ad7f99b-7d9d-59a8-a207-825d1d2bf57e',
                    targetId: 'urn:uuid:34dbdf5a-f88a-5053-9dbd-9b7f0ffc82b2',
                },
            ],
        },
    },
};
