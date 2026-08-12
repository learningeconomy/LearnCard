import { describe, it, expect } from 'vitest';
import {
    templateToJson,
    jsonToTemplate,
    validateTemplate,
    extractVariablesByType,
    extractDynamicVariables,
} from './utils';
import { staticField, dynamicField } from './types';
import type { OBv3CredentialTemplate } from './types';

/**
 * Creates a minimal valid template for testing
 */
const createMinimalTemplate = (
    overrides: Partial<OBv3CredentialTemplate> = {}
): OBv3CredentialTemplate => ({
    id: staticField(''),
    name: staticField('Test Credential'),
    description: staticField(''),
    image: staticField(''),
    contexts: [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    types: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: {
        id: staticField(''),
        name: staticField('Test Issuer'),
        url: staticField(''),
        email: staticField(''),
        description: staticField(''),
        image: staticField(''),
    },
    validFrom: staticField(''),
    validUntil: staticField(''),
    credentialSubject: {
        id: staticField(''),
        name: staticField(''),
        achievement: {
            id: staticField(''),
            name: staticField('Test Achievement'),
            description: staticField('A test achievement'),
            achievementType: staticField(''),
            image: staticField(''),
            criteria: {
                id: staticField(''),
                narrative: staticField(''),
            },
            alignment: [],
        },
        evidence: [],
    },
    customFields: [],
    ...overrides,
});

describe('CTID Feature', () => {
    // ─── templateToJson: CTID Alignment Generation ───────────────────────

    describe('templateToJson - CTID alignment', () => {
        it('generates alignment entry when static CTID is present', () => {
            const template = createMinimalTemplate();
            template.credentialSubject.achievement.ctid = staticField(
                'ce-12345678-1234-1234-1234-123456789abc'
            );
            template.credentialSubject.achievement.name = staticField('My Badge');

            const json = templateToJson(template);
            const credSubject = json.credentialSubject as Record<string, unknown>;
            const achievement = credSubject?.achievement as Record<string, unknown>;
            const alignments = achievement?.alignment as Array<{
                type: string[];
                targetName: string;
                targetUrl: string;
                targetType: string;
                targetCode: string;
                targetFramework: string;
            }>;

            expect(alignments).toBeDefined();
            expect(alignments).toHaveLength(1);

            const ctidAlignment = alignments[0];
            expect(ctidAlignment.type).toEqual(['Alignment']);
            expect(ctidAlignment.targetName).toBe('My Badge');
            expect(ctidAlignment.targetUrl).toBe(
                'https://credentialfinder.org/credential/ce-12345678-1234-1234-1234-123456789abc'
            );
            expect(ctidAlignment.targetType).toBe('ceterms:Credential');
            expect(ctidAlignment.targetCode).toBe('ce-12345678-1234-1234-1234-123456789abc');
            expect(ctidAlignment.targetFramework).toBe('Credential Engine Registry');
        });

        it('generates alignment entry when dynamic CTID is present', () => {
            const template = createMinimalTemplate();
            template.credentialSubject.achievement.ctid = dynamicField('ctidVar');

            const json = templateToJson(template);
            const credSubject = json.credentialSubject as Record<string, unknown>;
            const achievement = credSubject?.achievement as Record<string, unknown>;
            const alignments = achievement?.alignment as Array<{
                targetUrl: string;
                targetCode: string;
            }>;

            expect(alignments).toBeDefined();
            expect(alignments).toHaveLength(1);
            expect(alignments[0].targetCode).toBe('{{ctidVar}}');
            expect(alignments[0].targetUrl).toBe(
                'https://credentialfinder.org/credential/{{ctidVar}}'
            );
        });

        it('does not generate alignment entry when CTID is empty', () => {
            const template = createMinimalTemplate();
            template.credentialSubject.achievement.ctid = staticField('');

            const json = templateToJson(template);
            const credSubject = json.credentialSubject as Record<string, unknown>;
            const achievement = credSubject?.achievement as Record<string, unknown>;

            expect(achievement?.alignment).toBeUndefined();
        });

        it('does not generate alignment entry when dynamic CTID has empty variable name', () => {
            const template = createMinimalTemplate();
            // Simulate dynamic mode toggled on but no variable name entered yet
            template.credentialSubject.achievement.ctid = {
                value: '',
                isDynamic: true,
                variableName: '',
            };

            const json = templateToJson(template);
            const credSubject = json.credentialSubject as Record<string, unknown>;
            const achievement = credSubject?.achievement as Record<string, unknown>;

            // Should NOT generate an alignment with "undefined" in the URL
            expect(achievement?.alignment).toBeUndefined();
        });

        it('appends CTID alignment to existing user-defined alignments', () => {
            const template = createMinimalTemplate();
            template.credentialSubject.achievement.ctid = staticField(
                'ce-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
            );
            template.credentialSubject.achievement.alignment = [
                {
                    id: 'align_1',
                    targetName: staticField('Existing Alignment'),
                    targetUrl: staticField('https://example.com/standard'),
                },
            ];

            const json = templateToJson(template);
            const credSubject = json.credentialSubject as Record<string, unknown>;
            const achievement = credSubject?.achievement as Record<string, unknown>;
            const alignments = achievement?.alignment as Array<{
                targetName: string;
                targetFramework?: string;
            }>;

            expect(alignments).toHaveLength(2);
            expect(alignments[0].targetName).toBe('Existing Alignment');
            expect(alignments[1].targetFramework).toBe('Credential Engine Registry');
        });
    });

    // ─── jsonToTemplate: CTID Round-trip ─────────────────────────────────

    describe('jsonToTemplate - CTID round-trip', () => {
        it('extracts CTID from Credential Engine Registry alignment', () => {
            const json = {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                ],
                type: ['VerifiableCredential', 'OpenBadgeCredential'],
                issuer: { id: 'did:example:issuer', name: 'Test Issuer' },
                credentialSubject: {
                    achievement: {
                        name: 'Test Badge',
                        description: 'A test badge',
                        alignment: [
                            {
                                type: ['Alignment'],
                                targetName: 'Test Badge',
                                targetUrl:
                                    'https://credentialfinder.org/credential/ce-12345678-1234-1234-1234-123456789abc',
                                targetType: 'ceterms:Credential',
                                targetCode: 'ce-12345678-1234-1234-1234-123456789abc',
                                targetFramework: 'Credential Engine Registry',
                            },
                        ],
                    },
                },
            };

            const template = jsonToTemplate(json);

            expect(template.credentialSubject.achievement.ctid).toBeDefined();
            expect(template.credentialSubject.achievement.ctid?.value).toBe(
                'ce-12345678-1234-1234-1234-123456789abc'
            );
        });

        it('filters out CTID alignment from regular alignments', () => {
            const json = {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                ],
                type: ['VerifiableCredential', 'OpenBadgeCredential'],
                issuer: { id: 'did:example:issuer', name: 'Test Issuer' },
                credentialSubject: {
                    achievement: {
                        name: 'Test Badge',
                        description: 'A test badge',
                        alignment: [
                            {
                                type: ['Alignment'],
                                targetName: 'Regular Alignment',
                                targetUrl: 'https://example.com/standard',
                            },
                            {
                                type: ['Alignment'],
                                targetName: 'Test Badge',
                                targetUrl:
                                    'https://credentialfinder.org/credential/ce-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                                targetType: 'ceterms:Credential',
                                targetCode: 'ce-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                                targetFramework: 'Credential Engine Registry',
                            },
                        ],
                    },
                },
            };

            const template = jsonToTemplate(json);

            // CTID should be extracted
            expect(template.credentialSubject.achievement.ctid?.value).toBe(
                'ce-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
            );

            // Regular alignments should remain, CTID alignment should be filtered out
            const alignments = template.credentialSubject.achievement.alignment || [];
            expect(alignments).toHaveLength(1);
            expect(alignments[0].targetName.value).toBe('Regular Alignment');
        });

        it('handles credentials without CTID alignment', () => {
            const json = {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                ],
                type: ['VerifiableCredential', 'OpenBadgeCredential'],
                issuer: { id: 'did:example:issuer', name: 'Test Issuer' },
                credentialSubject: {
                    achievement: {
                        name: 'Test Badge',
                        description: 'A test badge',
                    },
                },
            };

            const template = jsonToTemplate(json);

            expect(template.credentialSubject.achievement.ctid).toBeUndefined();
        });

        it('completes full round-trip: template → JSON → template', () => {
            const originalTemplate = createMinimalTemplate();
            originalTemplate.credentialSubject.achievement.ctid = staticField(
                'ce-abcdef01-2345-6789-abcd-ef0123456789'
            );
            originalTemplate.credentialSubject.achievement.name = staticField('Round Trip Badge');

            // Template → JSON
            const json = templateToJson(originalTemplate);

            // JSON → Template
            const restoredTemplate = jsonToTemplate(json);

            // Verify CTID was preserved
            expect(restoredTemplate.credentialSubject.achievement.ctid?.value).toBe(
                'ce-abcdef01-2345-6789-abcd-ef0123456789'
            );
        });
    });

    // ─── validateTemplate: CTID Validation ───────────────────────────────

    describe('validateTemplate - CTID format validation', () => {
        it('accepts valid CTID format', () => {
            const template = createMinimalTemplate();
            template.credentialSubject.achievement.ctid = staticField(
                'ce-12345678-1234-1234-1234-123456789abc'
            );

            const errors = validateTemplate(template);
            const ctidErrors = errors.filter(e => e.field === 'achievement.ctid');

            expect(ctidErrors).toHaveLength(0);
        });

        it('rejects CTID without ce- prefix', () => {
            const template = createMinimalTemplate();
            template.credentialSubject.achievement.ctid = staticField(
                '12345678-1234-1234-1234-123456789abc'
            );

            const errors = validateTemplate(template);
            const ctidErrors = errors.filter(e => e.field === 'achievement.ctid');

            expect(ctidErrors).toHaveLength(1);
            expect(ctidErrors[0].message).toContain('Invalid CTID format');
        });

        it('rejects CTID with invalid UUID structure', () => {
            const template = createMinimalTemplate();
            template.credentialSubject.achievement.ctid = staticField('ce-invalid-uuid');

            const errors = validateTemplate(template);
            const ctidErrors = errors.filter(e => e.field === 'achievement.ctid');

            expect(ctidErrors).toHaveLength(1);
        });

        it('accepts uppercase hex characters in CTID', () => {
            const template = createMinimalTemplate();
            template.credentialSubject.achievement.ctid = staticField(
                'ce-ABCDEF01-2345-6789-ABCD-EF0123456789'
            );

            const errors = validateTemplate(template);
            const ctidErrors = errors.filter(e => e.field === 'achievement.ctid');

            expect(ctidErrors).toHaveLength(0);
        });

        it('skips validation for dynamic CTID fields', () => {
            const template = createMinimalTemplate();
            template.credentialSubject.achievement.ctid = dynamicField('ctidVariable');

            const errors = validateTemplate(template);
            const ctidErrors = errors.filter(e => e.field === 'achievement.ctid');

            expect(ctidErrors).toHaveLength(0);
        });

        it('skips validation for empty CTID', () => {
            const template = createMinimalTemplate();
            template.credentialSubject.achievement.ctid = staticField('');

            const errors = validateTemplate(template);
            const ctidErrors = errors.filter(e => e.field === 'achievement.ctid');

            expect(ctidErrors).toHaveLength(0);
        });
    });

    // ─── extractVariablesByType: CTID Dynamic Fields ─────────────────────

    describe('extractVariablesByType - CTID dynamic fields', () => {
        it('extracts dynamic CTID variable', () => {
            const template = createMinimalTemplate();
            template.credentialSubject.achievement.ctid = dynamicField('registryId');

            const { dynamic } = extractVariablesByType(template);

            expect(dynamic).toContain('registryId');
        });

        it('does not extract static CTID as variable', () => {
            const template = createMinimalTemplate();
            template.credentialSubject.achievement.ctid = staticField(
                'ce-12345678-1234-1234-1234-123456789abc'
            );

            const { dynamic, system } = extractVariablesByType(template);

            expect(dynamic).not.toContain('ce-12345678-1234-1234-1234-123456789abc');
            expect(system).not.toContain('ce-12345678-1234-1234-1234-123456789abc');
        });
    });

    // ─── extractDynamicVariables: CTID Dynamic Fields ────────────────────

    describe('extractDynamicVariables - CTID dynamic fields', () => {
        it('extracts dynamic CTID variable (legacy function)', () => {
            const template = createMinimalTemplate();
            template.credentialSubject.achievement.ctid = dynamicField('ctidFromApi');

            const variables = extractDynamicVariables(template);

            expect(variables).toContain('ctidFromApi');
        });
    });
});
