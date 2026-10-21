import type { CredentialFixture } from '../../types';

/**
 * LC-2184: synthetic, unsigned CLR display/issuance template.
 * Both the outer record and embedded achievements intentionally have no proof.
 * Sign/rebind children before the outer CLR for cryptographic verification tests.
 */
export const clrLicensingRegulatoryRecord: CredentialFixture = {
    id: 'clr/licensing-regulatory-record',
    name: 'Licenses & Certifications — Meridian Licensing Board',
    description:
        'Explores license numbers, award and validity dates, an expired historical child alongside current qualifications, and separate publisher and certifier identities. Unsigned display/issuance template; child proofs must be issued separately for a fully verifiable CLR.',
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
        'licensing',
        'regulatory-affairs',
        'license',
        'certification',
        'expired-child',
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
        id: 'urn:uuid:29139132-6871-5065-b702-5671916115b7',
        type: ['VerifiableCredential', 'ClrCredential'],
        name: 'Licenses & Certifications — Meridian Licensing Board',
        description:
            'Synthetic demonstration record as of September 1, 2026. Explores license numbers, award and validity dates, an expired historical child alongside current qualifications, and separate publisher and certifier identities.',
        issuer: {
            id: 'did:example:lc2184-meridian-licensing',
            type: ['Profile'],
            name: 'Meridian Licensing Board (Fictional)',
            url: 'https://meridian-licensing.example',
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
                    id: 'urn:uuid:75a0d998-e0fa-5ae3-9728-530067b4f68e',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Synthetic Applied Practice License',
                    description:
                        'A fictional license used to test number and validity display; no legal authorization is conferred.',
                    issuer: {
                        id: 'did:example:lc2184-meridian-licensing',
                        type: ['Profile'],
                        name: 'Meridian Licensing Board (Fictional)',
                        url: 'https://meridian-licensing.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2026-02-01T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:2ed76eda-2d43-5c41-ac2a-c1d8ae12cd50',
                            type: ['Achievement'],
                            achievementType: 'License',
                            name: 'Synthetic Applied Practice License',
                            description:
                                'A fictional license used to test number and validity display; no legal authorization is conferred.',
                            criteria: {
                                narrative:
                                    'Meet the fictional board requirements and receive an award decision.',
                            },
                            creator: {
                                id: 'did:example:lc2184-cedar-standards',
                                type: ['Profile'],
                                name: 'Cedar Skills Council',
                                url: 'https://cedar-standards.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-PRACTICE-LICENSE',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:9bcb7d96-b284-5f2d-9b25-2ba7e054ad3b',
                                    type: ['ResultDescription'],
                                    name: 'License award decision',
                                    resultType: 'Status',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Applied practice capability',
                                    targetCode: 'PRACTICE-101',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/practice-101',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        role: 'License Holder',
                        source: {
                            id: 'did:example:lc2184-meridian-licensing',
                            type: ['Profile'],
                            name: 'Meridian Licensing Board (Fictional)',
                            url: 'https://meridian-licensing.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        licenseNumber: 'SYN-LIC-2184-042',
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:9bcb7d96-b284-5f2d-9b25-2ba7e054ad3b',
                                status: 'Completed',
                            },
                        ],
                    },
                    awardedDate: '2026-01-15T12:00:00Z',
                    validUntil: '2028-01-31T23:59:59Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Fictional board award record',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'The number and dates are synthetic. Completed describes the award decision, not current regulatory standing.',
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
                    id: 'urn:uuid:b7cee9bf-2468-5992-9791-0c7de11eb257',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Foundation Practice Certification — Historical',
                    description:
                        'A historical certification whose validity ended before the CLR snapshot.',
                    issuer: {
                        id: 'did:example:lc2184-assurance-institute',
                        type: ['Profile'],
                        name: 'Independent Assurance Institute (Fictional)',
                        url: 'https://assurance-institute.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2023-02-01T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:c04ec610-66d5-5921-bb2f-caed67e0c0d4',
                            type: ['Achievement'],
                            achievementType: 'Certification',
                            name: 'Foundation Practice Certification — Historical',
                            description:
                                'A historical certification whose validity ended before the CLR snapshot.',
                            criteria: {
                                narrative: 'Pass the foundation assessment.',
                            },
                            creator: {
                                id: 'did:example:lc2184-assurance-institute',
                                type: ['Profile'],
                                name: 'Independent Assurance Institute (Fictional)',
                                url: 'https://assurance-institute.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-EXPIRED-CERTIFICATION',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:fb1d9f92-ec7a-5a06-9ced-903ef4a9d3b5',
                                    type: ['ResultDescription'],
                                    name: 'Certification completion',
                                    resultType: 'Status',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Foundation practice',
                                    targetCode: 'PRACTICE-100',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/practice-100',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        source: {
                            id: 'did:example:lc2184-assurance-institute',
                            type: ['Profile'],
                            name: 'Independent Assurance Institute (Fictional)',
                            url: 'https://assurance-institute.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:fb1d9f92-ec7a-5a06-9ced-903ef4a9d3b5',
                                status: 'Completed',
                            },
                        ],
                    },
                    awardedDate: '2023-01-20T12:00:00Z',
                    validUntil: '2025-01-31T23:59:59Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Historical assessment decision',
                            description: 'Synthetic assessment evidence.',
                            narrative:
                                'Assessment completion is preserved even though credential validity ended in 2025.',
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
                    id: 'urn:uuid:98b81973-04be-53e3-8199-8153445c9f0f',
                    type: ['VerifiableCredential', 'AchievementCredential'],
                    name: 'Foundation Practice Certification — Renewed',
                    description:
                        'A renewed certification issued independently of the outer CLR publisher.',
                    issuer: {
                        id: 'did:example:lc2184-assurance-institute',
                        type: ['Profile'],
                        name: 'Independent Assurance Institute (Fictional)',
                        url: 'https://assurance-institute.example',
                        description:
                            'Fictional organization used only for LearnCard display tests.',
                    },
                    validFrom: '2025-03-01T00:00:00Z',
                    credentialSubject: {
                        id: 'did:example:lc2184-alex-morgan',
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:5f535a93-2327-5f5b-82c3-7e1737440112',
                            type: ['Achievement'],
                            achievementType: 'Certification',
                            name: 'Foundation Practice Certification — Renewed',
                            description:
                                'A renewed certification issued independently of the outer CLR publisher.',
                            criteria: {
                                narrative: 'Score at least 80 on the renewal assessment.',
                            },
                            creator: {
                                id: 'did:example:lc2184-cedar-standards',
                                type: ['Profile'],
                                name: 'Cedar Skills Council',
                                url: 'https://cedar-standards.example',
                                description:
                                    'Fictional organization used only for LearnCard display tests.',
                            },
                            humanCode: 'SYN-RENEWED-CERTIFICATION',
                            version: '1.0',
                            inLanguage: 'en',
                            tag: ['synthetic', 'lc-2184'],
                            resultDescription: [
                                {
                                    id: 'urn:uuid:27490bbf-3510-5974-8744-f018851d3b9d',
                                    type: ['ResultDescription'],
                                    name: 'Renewal assessment score',
                                    resultType: 'RawScore',
                                    valueMin: '0',
                                    valueMax: '100',
                                    requiredValue: '80',
                                },
                            ],
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetName: 'Foundation practice',
                                    targetCode: 'PRACTICE-100',
                                    targetFramework: 'Synthetic Workplace Capability Framework',
                                    targetUrl: 'https://skills.example/framework/practice-100',
                                    targetDescription:
                                        'Fictional framework node for testing explicit alignment display; not a real qualification equivalence.',
                                    targetType: 'CFItem',
                                },
                            ],
                        },
                        source: {
                            id: 'did:example:lc2184-assurance-institute',
                            type: ['Profile'],
                            name: 'Independent Assurance Institute (Fictional)',
                            url: 'https://assurance-institute.example',
                            description:
                                'Fictional organization used only for LearnCard display tests.',
                        },
                        result: [
                            {
                                type: ['Result'],
                                resultDescription: 'urn:uuid:27490bbf-3510-5974-8744-f018851d3b9d',
                                value: '91',
                            },
                        ],
                    },
                    awardedDate: '2025-02-15T12:00:00Z',
                    validUntil: '2027-02-28T23:59:59Z',
                    evidence: [
                        {
                            type: ['Evidence'],
                            name: 'Renewal assessment record',
                            description: 'Synthetic assessment evidence.',
                            narrative: 'The fictional certifier awarded 91 of 100 points.',
                            genre: 'Assessment record',
                            audience: 'Learner and authorized reviewer',
                        },
                    ],
                },
            ],
            association: [
                {
                    type: ['Association'],
                    associationType: 'replacedBy',
                    sourceId: 'urn:uuid:c04ec610-66d5-5921-bb2f-caed67e0c0d4',
                    targetId: 'urn:uuid:5f535a93-2327-5f5b-82c3-7e1737440112',
                },
                {
                    type: ['Association'],
                    associationType: 'isRelatedTo',
                    sourceId: 'urn:uuid:5f535a93-2327-5f5b-82c3-7e1737440112',
                    targetId: 'urn:uuid:2ed76eda-2d43-5c41-ac2a-c1d8ae12cd50',
                },
            ],
        },
        validUntil: '2030-08-31T23:59:59Z',
    },
};
