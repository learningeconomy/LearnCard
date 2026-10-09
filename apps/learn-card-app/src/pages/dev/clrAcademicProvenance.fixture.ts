/** Unsigned, fictional academic data for exercising rubric-only results and distinct attribution. */
export const clrAcademicProvenanceDemo: Record<string, unknown> = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: 'urn:example:synthetic-academic-transcript',
    type: ['VerifiableCredential', 'ClrCredential'],
    name: 'Synthetic Academic Transcript — Rubric & Attribution',
    description:
        'Fictional, unsigned example for display testing. These records do not represent real academic achievements.',
    issuer: {
        id: 'did:example:synthetic-transcript-publisher',
        type: ['Profile'],
        name: 'Transcript Publishing Office (Synthetic)',
    },
    validFrom: '2026-06-15T12:00:00Z',
    credentialSubject: {
        id: 'did:example:synthetic-academic-learner',
        type: ['ClrSubject'],
        identifier: [
            {
                type: 'IdentityObject',
                identityType: 'name',
                identityHash: 'Alex Example (Synthetic)',
                hashed: false,
            },
        ],
        verifiableCredential: [
            {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                ],
                id: 'urn:example:synthetic-academic-course-credential',
                type: ['VerifiableCredential', 'OpenBadgeCredential'],
                name: 'Applied Research Methods (Synthetic)',
                issuer: {
                    id: 'did:example:synthetic-course-issuer',
                    type: ['Profile'],
                    name: 'Example College Registrar (Synthetic)',
                },
                awardedDate: '2026-06-03T12:00:00Z',
                validFrom: '2026-06-05T12:00:00Z',
                validUntil: '2028-06-05T12:00:00Z',
                credentialSubject: {
                    id: 'did:example:synthetic-academic-learner',
                    type: ['AchievementSubject'],
                    source: {
                        id: 'did:example:synthetic-course-assessor',
                        type: ['Profile'],
                        name: 'Academic Assessment Board (Synthetic)',
                    },
                    activityStartDate: '2026-01-12T12:00:00Z',
                    activityEndDate: '2026-05-29T12:00:00Z',
                    term: 'Spring 2026',
                    creditsEarned: 3,
                    achievement: {
                        id: 'urn:example:synthetic-academic-course',
                        type: ['Achievement'],
                        achievementType: 'Course',
                        name: 'Applied Research Methods (Synthetic)',
                        description:
                            'A fictional academic course assessed using a research-practice rubric.',
                        humanCode: 'SYN-201',
                        fieldOfStudy: 'Research Methods',
                        creditsAvailable: 3,
                        inLanguage: 'en',
                        tag: ['synthetic', 'academic', 'rubric-only'],
                        creator: {
                            id: 'did:example:synthetic-course-creator',
                            type: ['Profile'],
                            name: 'Curriculum Design Institute (Synthetic)',
                        },
                        criteria: {
                            narrative:
                                'Complete the research project and reach Proficient or above.',
                        },
                        resultDescription: [
                            {
                                id: 'urn:example:synthetic-research-rubric',
                                type: ['ResultDescription'],
                                name: 'Research Practice',
                                resultType: 'RubricCriterionLevel',
                                requiredLevel: 'urn:example:synthetic-level-proficient',
                                rubricCriterionLevel: [
                                    {
                                        id: 'urn:example:synthetic-level-developing',
                                        type: ['RubricCriterionLevel'],
                                        name: 'Developing',
                                        level: '1',
                                    },
                                    {
                                        id: 'urn:example:synthetic-level-proficient',
                                        type: ['RubricCriterionLevel'],
                                        name: 'Proficient',
                                        level: '2',
                                    },
                                    {
                                        id: 'urn:example:synthetic-level-advanced',
                                        type: ['RubricCriterionLevel'],
                                        name: 'Advanced',
                                        level: '3',
                                        description:
                                            'Independently selects methods and explains their limitations.',
                                    },
                                ],
                            },
                        ],
                    },
                    result: [
                        {
                            type: ['Result'],
                            resultDescription: 'urn:example:synthetic-research-rubric',
                            achievedLevel: 'urn:example:synthetic-level-advanced',
                        },
                    ],
                },
            },
        ],
    },
};
