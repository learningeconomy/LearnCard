import {
    canonicalConsentScopeString,
    canonicalJsonString,
    compileInlineTemplate,
    decodeManifestFromUrl,
    encodeManifestForUrl,
    extractTemplateVariables,
    buildVariableManifest,
    normalizeConsentRequest,
    renderCompiledTemplate,
    validateInlineTemplate,
    validateTemplateData,
} from '../index';
import type { InlineCredentialTemplate } from '../types';

describe('@learncard/partner-connect-core', () => {
    const simpleTemplate: InlineCredentialTemplate = {
        name: 'Course Completion: {{courseName}}',
        description: 'Awarded for completing {{courseName}} with instructor "{{instructorName}}".',
        image: 'https://cdn.example.com/badges/{{badgeSlug}}.png',
        issuerName: 'Example Academy',
        achievementType: 'Certificate',
        category: 'Achievement',
        criteria: {
            narrative: 'Complete all {{moduleCount}} modules',
            url: 'https://example.com/rubrics/{{rubricId}}',
        },
        alignments: [
            {
                name: 'Competency {{competencyCode}}',
                url: 'https://frameworks.example.com/{{competencyCode}}',
                framework: 'Example Framework',
                code: '{{competencyCode}}',
            },
        ],
        tags: ['tag-one', '{{topicTag}}'],
        activity: {
            startDate: '{{activityStart}}',
            endDate: '2026-07-20T00:00:00.000Z',
        },
        credits: {
            earned: '{{earnedCredits}}',
            available: 10,
        },
        validUntil: '{{expiryDate}}',
        evidence: [
            {
                id: 'https://evidence.example.com/{{artifactId}}',
                name: 'Artifact {{artifactId}}',
                narrative: 'Submitted by {{learnerDisplayName}}',
            },
        ],
        walletSkills: [{ frameworkId: 'esco', id: '1234', proficiencyLevel: 'advanced' }],
    };

    it('validates simple template errors and suggestions', () => {
        const errors = validateInlineTemplate({
            rawCredential: {
                '@context': [],
                type: [],
            },
            name: 'Bad mix',
            category: 'Achievment' as never,
            walletSkills: [{ frameworkId: '', id: '' }],
        } as unknown as InlineCredentialTemplate);

        expect(errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    message:
                        'template.rawCredential cannot be combined with template.name — use one or the other',
                }),
                expect.objectContaining({
                    path: 'template.category',
                    message:
                        'template.category must be one of Achievement, Skill, ID, Learning History, Work History, Social Badges, Membership, Accomplishment, Experiences, Accommodation, Family; did you mean "Achievement"?',
                }),
            ])
        );
    });

    it('validates field-level rules including did-you-mean and reserved variables', () => {
        const errors = validateInlineTemplate({
            name: 'Badge {{issuer_did}}',
            achievementType: 'Cert',
            image: 'http://not-secure.example.com/image.png',
            credits: { earned: '12' as never },
            validUntil: 'not-a-date',
            activity: { startDate: '{{bad-name}}' },
            alignments: [{ name: '', url: 'relative/path' }],
            evidence: [{ id: 'ftp://bad.example.com' }],
            tags: ['good', '{{bad-name}}'],
        });

        expect(errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: 'template.name',
                    message:
                        'template.name uses reserved variable {{issuer_did}}; it is injected automatically by LearnCard',
                }),
                expect.objectContaining({
                    path: 'template.achievementType',
                    message:
                        'template.achievementType "Cert" is not a known OBv3 achievementType; did you mean "Certificate"? Custom types must use the "ext:" prefix',
                }),
                expect.objectContaining({
                    path: 'template.image',
                    message: 'template.image must start with https:// or contain a {{variable}}',
                }),
                expect.objectContaining({
                    path: 'template.credits.earned',
                    message: 'template.credits.earned must be a number or a {{variable}} token',
                }),
                expect.objectContaining({
                    path: 'template.validUntil',
                    message: 'template.validUntil must be an ISO-8601 date or a {{variable}} token',
                }),
                expect.objectContaining({
                    path: 'template.activity.startDate',
                    message:
                        'template.activity.startDate uses invalid variable {{bad-name}}; variable names must match /^\\w+$/',
                }),
                expect.objectContaining({
                    path: 'template.alignments[0].name',
                    message: 'template.alignments[0].name is required',
                }),
                expect.objectContaining({
                    path: 'template.alignments[0].url',
                    message:
                        'template.alignments[0].url must start with https:// or contain a {{variable}}',
                }),
                expect.objectContaining({
                    path: 'template.evidence[0].id',
                    message:
                        'template.evidence[0].id must start with https:// or contain a {{variable}}',
                }),
                expect.objectContaining({
                    path: 'template.tags[1]',
                    message:
                        'template.tags[1] uses invalid variable {{bad-name}}; variable names must match /^\\w+$/',
                }),
            ])
        );
    });

    it('compiles a full-featured simple template deterministically', () => {
        const compiled = compileInlineTemplate(simpleTemplate);

        expect(compiled.category).toBe('Achievement');
        expect(compiled.walletSkills).toEqual(simpleTemplate.walletSkills);
        expect(compiled.credentialTemplateJson).toContain('"creditsEarned":{{earnedCredits}}');
        expect(compiled.variableManifest.variables.earnedCredits.type).toBe('number');

        const parsed = JSON.parse(
            compiled.credentialTemplateJson.replace('{{earnedCredits}}', '4')
        );

        expect(parsed).toEqual({
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            credentialSubject: {
                achievement: {
                    achievementType: 'Certificate',
                    alignment: [
                        {
                            targetCode: '{{competencyCode}}',
                            targetFramework: 'Example Framework',
                            targetName: 'Competency {{competencyCode}}',
                            targetUrl: 'https://frameworks.example.com/{{competencyCode}}',
                            type: ['Alignment'],
                        },
                    ],
                    criteria: {
                        id: 'https://example.com/rubrics/{{rubricId}}',
                        narrative: 'Complete all {{moduleCount}} modules',
                    },
                    description:
                        'Awarded for completing {{courseName}} with instructor "{{instructorName}}".',
                    image: 'https://cdn.example.com/badges/{{badgeSlug}}.png',
                    name: 'Course Completion: {{courseName}}',
                    tag: ['tag-one', '{{topicTag}}'],
                    type: ['Achievement'],
                },
                activityEndDate: '2026-07-20T00:00:00.000Z',
                activityStartDate: '{{activityStart}}',
                creditsAvailable: 10,
                creditsEarned: 4,
                id: '{{recipient_did}}',
                type: ['AchievementSubject'],
            },
            description:
                'Awarded for completing {{courseName}} with instructor "{{instructorName}}".',
            evidence: [
                {
                    id: 'https://evidence.example.com/{{artifactId}}',
                    name: 'Artifact {{artifactId}}',
                    narrative: 'Submitted by {{learnerDisplayName}}',
                    type: ['Evidence'],
                },
            ],
            image: 'https://cdn.example.com/badges/{{badgeSlug}}.png',
            issuer: {
                id: '{{issuer_did}}',
                name: 'Example Academy',
                type: ['Profile'],
            },
            name: 'Course Completion: {{courseName}}',
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            validFrom: '{{issue_date}}',
            validUntil: '{{expiryDate}}',
        });
    });

    it('forces server-controlled fields for raw templates', () => {
        const compiled = compileInlineTemplate({
            rawCredential: {
                '@context': ['https://example.com/context'],
                type: ['VerifiableCredential'],
                issuer: 'did:example:issuer',
                credentialSubject: [{ name: 'One' }, { name: 'Two', id: 'did:example:two' }],
            },
            category: 'Work History',
        });

        expect(JSON.parse(compiled.credentialTemplateJson)).toEqual({
            '@context': ['https://example.com/context'],
            credentialSubject: [
                { id: '{{recipient_did}}', name: 'One' },
                { id: '{{recipient_did}}', name: 'Two' },
            ],
            issuer: { id: '{{issuer_did}}', type: ['Profile'] },
            type: ['VerifiableCredential'],
            validFrom: '{{issue_date}}',
        });
        expect(compiled.category).toBe('Work History');
    });

    it('extracts variables and builds a typed manifest', () => {
        const json =
            '{"name":"Hi {{courseName}}","count":{{earnedCredits}},"extra":"{{courseName}}"}';

        expect(extractTemplateVariables(json)).toEqual(['courseName', 'earnedCredits']);
        expect(buildVariableManifest(json)).toEqual({
            variables: {
                courseName: { type: 'string', paths: ['$.extra', '$.name'] },
                earnedCredits: { type: 'number', paths: [] },
            },
        });
    });

    it('does not classify variables as numeric when a colon precedes them inside a string value', () => {
        const json =
            '{"name":"Demo Achievement: {{courseName}}","note":"score: {{grade}}, done","count":{{earnedCredits}}}';

        const manifest = buildVariableManifest(json);

        expect(manifest.variables.courseName.type).toBe('string');
        expect(manifest.variables.grade.type).toBe('string');
        expect(manifest.variables.earnedCredits.type).toBe('number');

        expect(
            validateTemplateData(manifest, {
                courseName: 'LearnCard 101',
                grade: 'A',
                earnedCredits: 3,
            })
        ).toEqual([]);
    });

    it('classifies colon-adjacent string variables correctly through the full compile pipeline', () => {
        const compiled = compileInlineTemplate({
            name: 'Demo Achievement: {{courseName}}',
            description: 'Completed {{courseName}}',
        });

        expect(compiled.variableManifest.variables.courseName.type).toBe('string');
        expect(
            validateTemplateData(compiled.variableManifest, { courseName: 'LearnCard 101' })
        ).toEqual([]);
    });

    it('validates runtime template data with missing, unused, reserved, type, and evidence exceptions', () => {
        const manifest = {
            variables: {
                courseName: { type: 'string' as const, paths: ['$.name'] },
                earnedCredits: {
                    type: 'number' as const,
                    paths: ['$.credentialSubject.creditsEarned'],
                },
            },
        };

        expect(
            validateTemplateData(manifest, {
                courseNmae: 'Algebra',
                earnedCredits: '4',
                issuer_did: 'did:example:issuer',
                evidence: [{ id: 'ok' }],
            })
        ).toEqual([
            { path: 'templateData.courseName', message: 'templateData.courseName is required' },
            {
                path: 'templateData.earnedCredits',
                message: 'templateData.earnedCredits must be a finite number',
            },
            {
                path: 'templateData.courseNmae',
                message: 'templateData.courseNmae is unused; did you mean "courseName"?',
            },
            {
                path: 'templateData.issuer_did',
                message:
                    'templateData.issuer_did is injected automatically by LearnCard and cannot be supplied',
            },
        ]);
    });

    it('renders compiled templates with escaping and reserved variables', () => {
        const compiled = compileInlineTemplate(simpleTemplate);
        const rendered = renderCompiledTemplate(compiled.credentialTemplateJson, {
            courseName: 'Biology "101"\nAdvanced',
            instructorName: 'Prof\\Name',
            badgeSlug: 'biology-101',
            competencyCode: 'BIO-1',
            moduleCount: 8,
            topicTag: 'science',
            activityStart: '2026-01-01T00:00:00.000Z',
            earnedCredits: 4,
            expiryDate: '2027-01-01T00:00:00.000Z',
            artifactId: 'artifact-7',
            learnerDisplayName: 'Ada\tLovelace',
            rubricId: 'rubric-1',
            issuer_did: 'did:web:issuer.example',
            recipient_did: 'did:web:recipient.example',
            issue_date: '2026-07-20T12:00:00.000Z',
        });

        expect(rendered).toEqual({
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            credentialSubject: {
                achievement: {
                    achievementType: 'Certificate',
                    alignment: [
                        {
                            targetCode: 'BIO-1',
                            targetFramework: 'Example Framework',
                            targetName: 'Competency BIO-1',
                            targetUrl: 'https://frameworks.example.com/BIO-1',
                            type: ['Alignment'],
                        },
                    ],
                    criteria: {
                        id: 'https://example.com/rubrics/rubric-1',
                        narrative: 'Complete all 8 modules',
                    },
                    description:
                        'Awarded for completing Biology "101"\nAdvanced with instructor "Prof\\Name".',
                    image: 'https://cdn.example.com/badges/biology-101.png',
                    name: 'Course Completion: Biology "101"\nAdvanced',
                    tag: ['tag-one', 'science'],
                    type: ['Achievement'],
                },
                activityEndDate: '2026-07-20T00:00:00.000Z',
                activityStartDate: '2026-01-01T00:00:00.000Z',
                creditsAvailable: 10,
                creditsEarned: 4,
                id: 'did:web:recipient.example',
                type: ['AchievementSubject'],
            },
            description:
                'Awarded for completing Biology "101"\nAdvanced with instructor "Prof\\Name".',
            evidence: [
                {
                    id: 'https://evidence.example.com/artifact-7',
                    name: 'Artifact artifact-7',
                    narrative: 'Submitted by Ada\tLovelace',
                    type: ['Evidence'],
                },
            ],
            image: 'https://cdn.example.com/badges/biology-101.png',
            issuer: {
                id: 'did:web:issuer.example',
                name: 'Example Academy',
                type: ['Profile'],
            },
            name: 'Course Completion: Biology "101"\nAdvanced',
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            validFrom: '2026-07-20T12:00:00.000Z',
            validUntil: '2027-01-01T00:00:00.000Z',
        });
    });

    it('normalizes consent requests and excludes reason from scopes', () => {
        const normalized = normalizeConsentRequest({
            read: {
                credentialCategories: ['Work History', 'Achievement', 'Achievement'],
                personalFields: ['email', 'name', 'email'],
            },
            write: {
                credentialCategories: ['Skill', 'Achievement', 'Skill'],
            },
            reason: 'Display only',
        });

        expect(normalized).toEqual({
            read: {
                credentialCategories: ['Achievement', 'Work History'],
                personalFields: ['email', 'name'],
            },
            write: {
                credentialCategories: ['Achievement', 'Skill'],
            },
        });
        expect(canonicalConsentScopeString(normalized)).toBe(
            '{"read":{"credentialCategories":["Achievement","Work History"],"personalFields":["email","name"]},"write":{"credentialCategories":["Achievement","Skill"]}}'
        );
    });

    it('throws clear consent normalization errors for unknown values', () => {
        expect(() =>
            normalizeConsentRequest({
                read: { personalFields: ['emali' as never] },
            })
        ).toThrow(
            'consent.read.personalFields[0] has unknown personal field "emali"; did you mean "email"?'
        );
    });

    it('serializes canonical JSON deterministically', () => {
        expect(
            canonicalJsonString({
                z: 1,
                a: { y: 2, x: 1 },
                arr: [{ b: 2, a: 1 }],
            })
        ).toBe('{"a":{"x":1,"y":2},"arr":[{"a":1,"b":2}],"z":1}');
    });

    it('round-trips captured manifests through base64url encoding', () => {
        const manifest = {
            manifestVersion: 1 as const,
            appUrl: 'https://partner.localhost',
            suggestedName: 'Café Credentials',
            suggestedIconUrl: 'https://partner.localhost/icon.png',
            permissions: ['request_identity', 'send_credential'],
            templates: [
                {
                    alias: 'course-complete',
                    template: {
                        name: 'Completed {{courseName}}',
                        description: 'Awarded for finishing {{courseName}}.',
                    },
                    version: 2,
                    lastUsedAt: '2026-07-20T12:00:00.000Z',
                },
            ],
            consentRequests: [
                {
                    scopes: normalizeConsentRequest({
                        read: { credentialCategories: ['Achievement'], personalFields: ['name'] },
                        reason: 'Used only for copy retention checks',
                    }),
                    reason: 'Used only for copy retention checks',
                    lastUsedAt: '2026-07-20T12:00:00.000Z',
                },
            ],
            featuresLaunched: ['/wallet'],
            counterKeys: ['coins'],
            usedLearnerContext: true,
            usedNotifications: true,
            firstCapturedAt: '2026-07-20T12:00:00.000Z',
            lastUpdatedAt: '2026-07-20T12:01:00.000Z',
        };

        const encoded = encodeManifestForUrl(manifest);

        expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(decodeManifestFromUrl(encoded)).toEqual(manifest);
    });
});
