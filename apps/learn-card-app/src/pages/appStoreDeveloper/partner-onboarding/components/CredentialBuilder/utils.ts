/**
 * Utility functions for converting between OBv3CredentialTemplate and JSON
 */

import {
    OBv3CredentialTemplate,
    TemplateFieldValue,
    AchievementTemplate,
    IssuerTemplate,
    CredentialSubjectTemplate,
    AlignmentTemplate,
    EvidenceTemplate,
    CustomFieldTemplate,
    staticField,
    dynamicField,
    DEFAULT_CONTEXTS,
    DEFAULT_TYPES,
} from './types';

/**
 * Convert a TemplateFieldValue to its JSON representation
 * If dynamic, wraps in Mustache syntax: {{variableName}}
 */
export const fieldToJson = (field: TemplateFieldValue | undefined): string | undefined => {
    if (!field) return undefined;

    if (field.isDynamic && field.variableName) {
        return `{{${field.variableName}}}`;
    }

    return field.value || undefined;
};

/**
 * Parse a JSON value back to a TemplateFieldValue
 * Detects Mustache syntax and extracts variable name
 */
export const jsonToField = (value: unknown): TemplateFieldValue => {
    if (value === undefined || value === null) {
        return staticField('');
    }

    const strValue = String(value);

    // Check for Mustache variable pattern
    const mustacheMatch = strValue.match(/^\{\{(\w+)\}\}$/);

    if (mustacheMatch) {
        return dynamicField(mustacheMatch[1], '');
    }

    return staticField(strValue);
};

/**
 * Convert OBv3CredentialTemplate to a JSON credential object
 */
export const templateToJson = (template: OBv3CredentialTemplate): Record<string, unknown> => {
    const credential: Record<string, unknown> = {
        '@context': template.contexts,
        type: template.types,
    };

    // Core fields
    if (template.id?.value) {
        credential.id = fieldToJson(template.id);
    }

    credential.name = fieldToJson(template.name) || 'Untitled Credential';

    if (template.description?.value || template.description?.isDynamic) {
        credential.description = fieldToJson(template.description);
    }

    if (template.image?.value || template.image?.isDynamic) {
        credential.image = fieldToJson(template.image);
    }

    // Issuer - just use the issuer ID (DID) as a string, not an object
    // This will be replaced with wallet.id.did() during actual issuance
    credential.issuer = fieldToJson(template.issuer.id) || '{{issuer_did}}';

    // Dates
    credential.issuanceDate = fieldToJson(template.issuanceDate) || '{{issue_date}}';

    if (template.expirationDate?.value || template.expirationDate?.isDynamic) {
        credential.expirationDate = fieldToJson(template.expirationDate);
    }

    // Credential Subject
    const credentialSubject: Record<string, unknown> = {
        type: ['AchievementSubject'],
    };

    if (template.credentialSubject.id?.value || template.credentialSubject.id?.isDynamic) {
        credentialSubject.id = fieldToJson(template.credentialSubject.id);
    }

    if (template.credentialSubject.name?.value || template.credentialSubject.name?.isDynamic) {
        credentialSubject.name = fieldToJson(template.credentialSubject.name);
    }

    // Achievement
    const achievement: Record<string, unknown> = {
        type: ['Achievement'],
    };

    if (template.credentialSubject.achievement.id?.value || template.credentialSubject.achievement.id?.isDynamic) {
        achievement.id = fieldToJson(template.credentialSubject.achievement.id);
    }

    achievement.name = fieldToJson(template.credentialSubject.achievement.name) || 'Achievement';
    achievement.description = fieldToJson(template.credentialSubject.achievement.description) || '';

    if (template.credentialSubject.achievement.achievementType?.value || template.credentialSubject.achievement.achievementType?.isDynamic) {
        achievement.achievementType = fieldToJson(template.credentialSubject.achievement.achievementType);
    }

    if (template.credentialSubject.achievement.image?.value || template.credentialSubject.achievement.image?.isDynamic) {
        achievement.image = fieldToJson(template.credentialSubject.achievement.image);
    }

    // Criteria - OBv3 requires criteria to always be present
    const criteria: Record<string, unknown> = {};

    if (template.credentialSubject.achievement.criteria?.id?.value || template.credentialSubject.achievement.criteria?.id?.isDynamic) {
        criteria.id = fieldToJson(template.credentialSubject.achievement.criteria.id);
    }

    if (template.credentialSubject.achievement.criteria?.narrative?.value || template.credentialSubject.achievement.criteria?.narrative?.isDynamic) {
        criteria.narrative = fieldToJson(template.credentialSubject.achievement.criteria.narrative);
    }

    // Always include criteria (required by OBv3), default to empty narrative if none provided
    if (Object.keys(criteria).length === 0) {
        criteria.narrative = '';
    }

    achievement.criteria = criteria;

    // Alignment
    if (template.credentialSubject.achievement.alignment && template.credentialSubject.achievement.alignment.length > 0) {
        achievement.alignment = template.credentialSubject.achievement.alignment.map(a => {
            const align: Record<string, unknown> = {
                type: ['Alignment'],
                targetName: fieldToJson(a.targetName),
                targetUrl: fieldToJson(a.targetUrl),
            };

            if (a.targetDescription?.value || a.targetDescription?.isDynamic) {
                align.targetDescription = fieldToJson(a.targetDescription);
            }

            if (a.targetFramework?.value || a.targetFramework?.isDynamic) {
                align.targetFramework = fieldToJson(a.targetFramework);
            }

            if (a.targetCode?.value || a.targetCode?.isDynamic) {
                align.targetCode = fieldToJson(a.targetCode);
            }

            return align;
        });
    }

    credentialSubject.achievement = achievement;

    // Evidence
    if (template.credentialSubject.evidence && template.credentialSubject.evidence.length > 0) {
        credentialSubject.evidence = template.credentialSubject.evidence.map(e => {
            const evidence: Record<string, unknown> = {
                type: [fieldToJson(e.type) || 'Evidence'],
            };

            if (e.name?.value || e.name?.isDynamic) {
                evidence.name = fieldToJson(e.name);
            }

            if (e.description?.value || e.description?.isDynamic) {
                evidence.description = fieldToJson(e.description);
            }

            if (e.narrative?.value || e.narrative?.isDynamic) {
                evidence.narrative = fieldToJson(e.narrative);
            }

            if (e.genre?.value || e.genre?.isDynamic) {
                evidence.genre = fieldToJson(e.genre);
            }

            if (e.audience?.value || e.audience?.isDynamic) {
                evidence.audience = fieldToJson(e.audience);
            }

            return evidence;
        });
    }

    credential.credentialSubject = credentialSubject;

    return credential;
};

/**
 * Parse a JSON credential object back to OBv3CredentialTemplate
 */
export const jsonToTemplate = (json: Record<string, unknown>): OBv3CredentialTemplate => {
    const contexts = Array.isArray(json['@context']) ? json['@context'] as string[] : DEFAULT_CONTEXTS;
    const types = Array.isArray(json.type) ? json.type as string[] : DEFAULT_TYPES;

    const subjectObj = (typeof json.credentialSubject === 'object' && json.credentialSubject !== null) ? json.credentialSubject as Record<string, unknown> : {};
    const achievementObj = (typeof subjectObj.achievement === 'object' && subjectObj.achievement !== null) ? subjectObj.achievement as Record<string, unknown> : {};
    const criteriaObj = (typeof achievementObj.criteria === 'object' && achievementObj.criteria !== null) ? achievementObj.criteria as Record<string, unknown> : undefined;
    const alignmentArr = Array.isArray(achievementObj.alignment) ? achievementObj.alignment as Record<string, unknown>[] : [];
    const evidenceArr = Array.isArray(subjectObj.evidence) ? subjectObj.evidence as Record<string, unknown>[] : [];

    // Parse issuer - can be a string (DID) or an object
    const issuerValue = json.issuer;
    const issuer: IssuerTemplate = {
        id: issuerValue ? jsonToField(typeof issuerValue === 'string' ? issuerValue : (issuerValue as Record<string, unknown>).id) : undefined,
        name: staticField(''),
    };

    // Parse achievement
    const achievement: AchievementTemplate = {
        id: achievementObj.id ? jsonToField(achievementObj.id) : undefined,
        name: jsonToField(achievementObj.name || ''),
        description: jsonToField(achievementObj.description || ''),
        achievementType: achievementObj.achievementType ? jsonToField(achievementObj.achievementType) : undefined,
        image: achievementObj.image ? jsonToField(achievementObj.image) : undefined,
        criteria: criteriaObj ? {
            id: criteriaObj.id ? jsonToField(criteriaObj.id) : undefined,
            narrative: criteriaObj.narrative ? jsonToField(criteriaObj.narrative) : undefined,
        } : undefined,
        alignment: alignmentArr.map((a, i) => ({
            id: `alignment_${i}`,
            targetName: jsonToField(a.targetName || ''),
            targetUrl: jsonToField(a.targetUrl || ''),
            targetDescription: a.targetDescription ? jsonToField(a.targetDescription) : undefined,
            targetFramework: a.targetFramework ? jsonToField(a.targetFramework) : undefined,
            targetCode: a.targetCode ? jsonToField(a.targetCode) : undefined,
        })),
    };

    // Parse credential subject
    const credentialSubject: CredentialSubjectTemplate = {
        id: subjectObj.id ? jsonToField(subjectObj.id) : undefined,
        name: subjectObj.name ? jsonToField(subjectObj.name) : undefined,
        achievement,
        evidence: evidenceArr.map((e, i) => ({
            id: `evidence_${i}`,
            type: e.type ? jsonToField(Array.isArray(e.type) ? e.type[0] : e.type) : undefined,
            name: e.name ? jsonToField(e.name) : undefined,
            description: e.description ? jsonToField(e.description) : undefined,
            narrative: e.narrative ? jsonToField(e.narrative) : undefined,
            genre: e.genre ? jsonToField(e.genre) : undefined,
            audience: e.audience ? jsonToField(e.audience) : undefined,
        })),
    };

    return {
        contexts,
        types,
        id: json.id ? jsonToField(json.id) : undefined,
        name: jsonToField(json.name || ''),
        description: json.description ? jsonToField(json.description) : undefined,
        image: json.image ? jsonToField(json.image) : undefined,
        issuer,
        credentialSubject,
        issuanceDate: jsonToField(json.issuanceDate || '{{issue_date}}'),
        expirationDate: json.expirationDate ? jsonToField(json.expirationDate) : undefined,
        customFields: [],
    };
};

/**
 * Extract all dynamic variables from a template
 */
export const extractDynamicVariables = (template: OBv3CredentialTemplate): string[] => {
    const variables: Set<string> = new Set();

    const checkField = (field: TemplateFieldValue | undefined) => {
        if (field?.isDynamic && field.variableName) {
            variables.add(field.variableName);
        }
    };

    // Core fields
    checkField(template.id);
    checkField(template.name);
    checkField(template.description);
    checkField(template.image);

    // Issuer
    checkField(template.issuer.id);
    checkField(template.issuer.name);
    checkField(template.issuer.url);
    checkField(template.issuer.email);
    checkField(template.issuer.description);
    checkField(template.issuer.image);

    // Dates
    checkField(template.issuanceDate);
    checkField(template.expirationDate);

    // Credential Subject
    checkField(template.credentialSubject.id);
    checkField(template.credentialSubject.name);

    // Achievement
    checkField(template.credentialSubject.achievement.id);
    checkField(template.credentialSubject.achievement.name);
    checkField(template.credentialSubject.achievement.description);
    checkField(template.credentialSubject.achievement.achievementType);
    checkField(template.credentialSubject.achievement.image);
    checkField(template.credentialSubject.achievement.criteria?.id);
    checkField(template.credentialSubject.achievement.criteria?.narrative);

    // Alignment
    template.credentialSubject.achievement.alignment?.forEach(a => {
        checkField(a.targetName);
        checkField(a.targetUrl);
        checkField(a.targetDescription);
        checkField(a.targetFramework);
        checkField(a.targetCode);
    });

    // Evidence
    template.credentialSubject.evidence?.forEach(e => {
        checkField(e.type);
        checkField(e.name);
        checkField(e.description);
        checkField(e.narrative);
        checkField(e.genre);
        checkField(e.audience);
    });

    // Custom fields
    template.customFields.forEach(f => {
        checkField(f.key);
        checkField(f.value);
    });

    return Array.from(variables).sort();
};

/**
 * Validate a template and return any errors
 */
export const validateTemplate = (template: OBv3CredentialTemplate): string[] => {
    const errors: string[] = [];

    if (!template.name.value && !template.name.isDynamic) {
        errors.push('Credential name is required');
    }

    if (!template.issuer.name.value && !template.issuer.name.isDynamic) {
        errors.push('Issuer name is required');
    }

    if (!template.credentialSubject.achievement.name.value && !template.credentialSubject.achievement.name.isDynamic) {
        errors.push('Achievement name is required');
    }

    return errors;
};

/**
 * Generate a variable name from a field label
 */
export const labelToVariableName = (label: string): string => {
    return label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
};
