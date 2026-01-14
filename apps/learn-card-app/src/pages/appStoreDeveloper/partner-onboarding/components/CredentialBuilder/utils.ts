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
    CredentialSchemaType,
    staticField,
    dynamicField,
    systemField,
    DEFAULT_CONTEXTS,
    DEFAULT_TYPES,
} from './types';

// Known system variables that are auto-injected at issuance time
const SYSTEM_VARIABLES = ['issue_date', 'issuer_did', 'recipient_did'];

/**
 * Detect the credential schema type from JSON structure
 */
export const detectSchemaType = (json: Record<string, unknown>): CredentialSchemaType => {
    const contexts = Array.isArray(json['@context']) ? json['@context'] as string[] : [];
    const types = Array.isArray(json.type) ? json.type as string[] : [];

    // Check for OBv3 indicators
    const isOBv3 = contexts.some(c => 
        typeof c === 'string' && (
            c.includes('openbadges') || 
            c.includes('ob/v3') ||
            c.includes('purl.imsglobal.org/spec/ob')
        )
    ) && types.some(t => 
        t === 'OpenBadgeCredential' 
    );

    if (isOBv3) return 'obv3';

    // Check for CLR 2.0 indicators
    const isCLR = contexts.some(c => 
        typeof c === 'string' && (
            c.includes('clr/v2') ||
            c.includes('comprehensivelearnerrecord')
        )
    ) || types.some(t => 
        t === 'ClrCredential' ||
        t === 'ComprehensiveLearnerRecord'
    );

    if (isCLR) return 'clr2';

    // Default to custom for unknown schemas
    return 'custom';
};

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
 * Preserves system field status for known system variables
 */
export const jsonToField = (value: unknown): TemplateFieldValue => {
    if (value === undefined || value === null) {
        return staticField('');
    }

    const strValue = String(value);

    // Check for Mustache variable pattern
    const mustacheMatch = strValue.match(/^\{\{(\w+)\}\}$/);

    if (mustacheMatch) {
        const varName = mustacheMatch[1];

        // Check if this is a known system variable
        if (SYSTEM_VARIABLES.includes(varName)) {
            return systemField(varName);
        }

        return dynamicField(varName, '');
    }

    return staticField(strValue);
};

/**
 * Convert OBv3CredentialTemplate to a JSON credential object
 */
export const templateToJson = (template: OBv3CredentialTemplate): Record<string, unknown> => {
    // If we have raw JSON stored (non-OBv3 credential), return it directly
    if (template.rawJson && template.schemaType !== 'obv3') {
        return template.rawJson;
    }

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

    // Dates (VC v2 syntax)
    credential.validFrom = fieldToJson(template.validFrom) || '{{issue_date}}';

    if (template.validUntil?.value || template.validUntil?.isDynamic) {
        credential.validUntil = fieldToJson(template.validUntil);
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

    // Additional Achievement fields (OBv3 spec-compliant)
    const ach = template.credentialSubject.achievement;

    if (ach.humanCode?.value || ach.humanCode?.isDynamic) {
        achievement.humanCode = fieldToJson(ach.humanCode);
    }

    if (ach.fieldOfStudy?.value || ach.fieldOfStudy?.isDynamic) {
        achievement.fieldOfStudy = fieldToJson(ach.fieldOfStudy);
    }

    if (ach.specialization?.value || ach.specialization?.isDynamic) {
        achievement.specialization = fieldToJson(ach.specialization);
    }

    if (ach.creditsAvailable?.value || ach.creditsAvailable?.isDynamic) {
        achievement.creditsAvailable = fieldToJson(ach.creditsAvailable);
    }

    if (ach.tag && ach.tag.length > 0) {
        achievement.tag = ach.tag;
    }

    if (ach.inLanguage?.value || ach.inLanguage?.isDynamic) {
        achievement.inLanguage = fieldToJson(ach.inLanguage);
    }

    if (ach.version?.value || ach.version?.isDynamic) {
        achievement.version = fieldToJson(ach.version);
    }

    // Achievement otherIdentifier
    if (ach.otherIdentifier && ach.otherIdentifier.length > 0) {
        achievement.otherIdentifier = ach.otherIdentifier.map(oi => ({
            type: 'IdentifierEntry',
            identifier: fieldToJson(oi.identifier),
            identifierType: fieldToJson(oi.identifierType),
        }));
    }

    // ResultDescription (defines possible results for this achievement)
    if (ach.resultDescription && ach.resultDescription.length > 0) {
        achievement.resultDescription = ach.resultDescription.map(rd => {
            const desc: Record<string, unknown> = {
                id: rd.id,
                type: ['ResultDescription'],
                name: fieldToJson(rd.name),
            };

            if (rd.resultType?.value || rd.resultType?.isDynamic) {
                desc.resultType = fieldToJson(rd.resultType);
            }

            if (rd.allowedValue && rd.allowedValue.length > 0) {
                desc.allowedValue = rd.allowedValue;
            }

            if (rd.requiredValue?.value || rd.requiredValue?.isDynamic) {
                desc.requiredValue = fieldToJson(rd.requiredValue);
            }

            return desc;
        });
    }

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

    // Additional CredentialSubject fields (OBv3 AchievementSubject spec-compliant)
    const subj = template.credentialSubject;

    if (subj.creditsEarned?.value || subj.creditsEarned?.isDynamic) {
        credentialSubject.creditsEarned = fieldToJson(subj.creditsEarned);
    }

    if (subj.activityStartDate?.value || subj.activityStartDate?.isDynamic) {
        credentialSubject.activityStartDate = fieldToJson(subj.activityStartDate);
    }

    if (subj.activityEndDate?.value || subj.activityEndDate?.isDynamic) {
        credentialSubject.activityEndDate = fieldToJson(subj.activityEndDate);
    }

    if (subj.term?.value || subj.term?.isDynamic) {
        credentialSubject.term = fieldToJson(subj.term);
    }

    if (subj.licenseNumber?.value || subj.licenseNumber?.isDynamic) {
        credentialSubject.licenseNumber = fieldToJson(subj.licenseNumber);
    }

    if (subj.role?.value || subj.role?.isDynamic) {
        credentialSubject.role = fieldToJson(subj.role);
    }

    // Recipient identifiers
    if (subj.identifier && subj.identifier.length > 0) {
        credentialSubject.identifier = subj.identifier.map(id => ({
            type: 'IdentityObject',
            identityHash: fieldToJson(id.identifier),
            identityType: fieldToJson(id.identifierType),
            hashed: false,
        }));
    }

    // Results (actual achieved grades/scores)
    if (subj.result && subj.result.length > 0) {
        credentialSubject.result = subj.result.map(r => {
            const result: Record<string, unknown> = {
                type: ['Result'],
            };

            if (r.resultDescription?.value || r.resultDescription?.isDynamic) {
                result.resultDescription = fieldToJson(r.resultDescription);
            }

            if (r.value?.value || r.value?.isDynamic) {
                result.value = fieldToJson(r.value);
            }

            if (r.status?.value || r.status?.isDynamic) {
                result.status = fieldToJson(r.status);
            }

            if (r.achievedLevel?.value || r.achievedLevel?.isDynamic) {
                result.achievedLevel = fieldToJson(r.achievedLevel);
            }

            return result;
        });
    }

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
    const schemaType = detectSchemaType(json);
    const contexts = Array.isArray(json['@context']) ? json['@context'] as string[] : DEFAULT_CONTEXTS;
    const types = Array.isArray(json.type) ? json.type as string[] : DEFAULT_TYPES;

    // For non-OBv3 credentials, store raw JSON and create minimal template
    if (schemaType !== 'obv3') {
        return {
            schemaType,
            rawJson: json,
            contexts,
            types,
            name: staticField(String(json.name || 'Custom Credential')),
            issuer: {
                name: staticField(''),
            },
            credentialSubject: {
                achievement: {
                    name: staticField(''),
                    description: staticField(''),
                },
            },
            validFrom: staticField(''),
            customFields: [],
        };
    }

    const subjectObj = (typeof json.credentialSubject === 'object' && json.credentialSubject !== null) ? json.credentialSubject as Record<string, unknown> : {};
    const achievementObj = (typeof subjectObj.achievement === 'object' && subjectObj.achievement !== null) ? subjectObj.achievement as Record<string, unknown> : {};
    const criteriaObj = (typeof achievementObj.criteria === 'object' && achievementObj.criteria !== null) ? achievementObj.criteria as Record<string, unknown> : undefined;
    const alignmentArr = Array.isArray(achievementObj.alignment) ? achievementObj.alignment as Record<string, unknown>[] : [];
    const evidenceArr = Array.isArray(subjectObj.evidence) ? subjectObj.evidence as Record<string, unknown>[] : [];
    const resultArr = Array.isArray(subjectObj.result) ? subjectObj.result as Record<string, unknown>[] : [];
    const resultDescArr = Array.isArray(achievementObj.resultDescription) ? achievementObj.resultDescription as Record<string, unknown>[] : [];
    const otherIdArr = Array.isArray(achievementObj.otherIdentifier) ? achievementObj.otherIdentifier as Record<string, unknown>[] : [];
    const subjectIdArr = Array.isArray(subjectObj.identifier) ? subjectObj.identifier as Record<string, unknown>[] : [];

    // Parse issuer - can be a string (DID) or an object
    const issuerValue = json.issuer;
    const issuer: IssuerTemplate = {
        id: issuerValue ? jsonToField(typeof issuerValue === 'string' ? issuerValue : (issuerValue as Record<string, unknown>).id) : undefined,
        name: staticField(''),
    };

    // Parse achievement with all OBv3 fields
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
        // Additional OBv3 Achievement fields
        humanCode: achievementObj.humanCode ? jsonToField(achievementObj.humanCode) : undefined,
        fieldOfStudy: achievementObj.fieldOfStudy ? jsonToField(achievementObj.fieldOfStudy) : undefined,
        specialization: achievementObj.specialization ? jsonToField(achievementObj.specialization) : undefined,
        creditsAvailable: achievementObj.creditsAvailable ? jsonToField(achievementObj.creditsAvailable) : undefined,
        tag: Array.isArray(achievementObj.tag) ? achievementObj.tag as string[] : undefined,
        inLanguage: achievementObj.inLanguage ? jsonToField(achievementObj.inLanguage) : undefined,
        version: achievementObj.version ? jsonToField(achievementObj.version) : undefined,
        otherIdentifier: otherIdArr.length > 0 ? otherIdArr.map((oi, i) => ({
            id: `otherId_${i}`,
            identifier: jsonToField(oi.identifier || ''),
            identifierType: jsonToField(oi.identifierType || ''),
        })) : undefined,
        resultDescription: resultDescArr.length > 0 ? resultDescArr.map((rd, i) => ({
            id: (rd.id as string) || `resultDesc_${i}`,
            name: jsonToField(rd.name || ''),
            resultType: rd.resultType ? jsonToField(rd.resultType) : undefined,
            allowedValue: Array.isArray(rd.allowedValue) ? rd.allowedValue as string[] : undefined,
            requiredValue: rd.requiredValue ? jsonToField(rd.requiredValue) : undefined,
        })) : undefined,
    };

    // Parse credential subject with all OBv3 AchievementSubject fields
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
        // Additional OBv3 AchievementSubject fields
        creditsEarned: subjectObj.creditsEarned ? jsonToField(subjectObj.creditsEarned) : undefined,
        activityStartDate: subjectObj.activityStartDate ? jsonToField(subjectObj.activityStartDate) : undefined,
        activityEndDate: subjectObj.activityEndDate ? jsonToField(subjectObj.activityEndDate) : undefined,
        term: subjectObj.term ? jsonToField(subjectObj.term) : undefined,
        licenseNumber: subjectObj.licenseNumber ? jsonToField(subjectObj.licenseNumber) : undefined,
        role: subjectObj.role ? jsonToField(subjectObj.role) : undefined,
        identifier: subjectIdArr.length > 0 ? subjectIdArr.map((id, i) => ({
            id: `subjectId_${i}`,
            identifier: jsonToField(id.identityHash || id.identifier || ''),
            identifierType: jsonToField(id.identityType || id.identifierType || ''),
        })) : undefined,
        result: resultArr.length > 0 ? resultArr.map((r, i) => ({
            id: `result_${i}`,
            resultDescription: r.resultDescription ? jsonToField(r.resultDescription) : undefined,
            value: r.value ? jsonToField(r.value) : undefined,
            status: r.status ? jsonToField(r.status) : undefined,
            achievedLevel: r.achievedLevel ? jsonToField(r.achievedLevel) : undefined,
        })) : undefined,
    };

    return {
        schemaType: 'obv3',
        contexts,
        types,
        id: json.id ? jsonToField(json.id) : undefined,
        name: jsonToField(json.name || ''),
        description: json.description ? jsonToField(json.description) : undefined,
        image: json.image ? jsonToField(json.image) : undefined,
        issuer,
        credentialSubject,
        validFrom: jsonToField(json.validFrom || json.issuanceDate || '{{issue_date}}'),
        validUntil: json.validUntil || json.expirationDate ? jsonToField(json.validUntil || json.expirationDate) : undefined,
        customFields: [],
    };
};

/**
 * Extract all mustache variables from any JSON object (for raw/custom credentials)
 */
export const extractVariablesFromRawJson = (json: unknown): { system: string[]; dynamic: string[] } => {
    const systemVars: Set<string> = new Set();
    const dynamicVars: Set<string> = new Set();

    const scan = (obj: unknown): void => {
        if (typeof obj === 'string') {
            const matches = obj.matchAll(/\{\{(\w+)\}\}/g);
            for (const m of matches) {
                const varName = m[1];
                if (SYSTEM_VARIABLES.includes(varName)) {
                    systemVars.add(varName);
                } else {
                    dynamicVars.add(varName);
                }
            }
        } else if (Array.isArray(obj)) {
            obj.forEach(scan);
        } else if (obj && typeof obj === 'object') {
            Object.values(obj).forEach(scan);
        }
    };

    scan(json);

    return {
        system: Array.from(systemVars).sort(),
        dynamic: Array.from(dynamicVars).sort(),
    };
};

/**
 * Extract variables from a template, separated by type (system vs dynamic)
 */
export interface ExtractedVariables {
    system: string[];
    dynamic: string[];
}

export const extractVariablesByType = (template: OBv3CredentialTemplate): ExtractedVariables => {
    // For non-OBv3 credentials with rawJson, extract from the raw JSON directly
    if (template.rawJson && template.schemaType !== 'obv3') {
        return extractVariablesFromRawJson(template.rawJson);
    }

    const systemVars: Set<string> = new Set();
    const dynamicVars: Set<string> = new Set();

    const checkField = (field: TemplateFieldValue | undefined) => {
        if (field?.isDynamic && field.variableName) {
            if (field.isSystem) {
                systemVars.add(field.variableName);
            } else {
                dynamicVars.add(field.variableName);
            }
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
    checkField(template.validFrom);
    checkField(template.validUntil);

    // Credential Subject
    checkField(template.credentialSubject.id);
    checkField(template.credentialSubject.name);

    // Achievement
    const ach = template.credentialSubject.achievement;
    checkField(ach.id);
    checkField(ach.name);
    checkField(ach.description);
    checkField(ach.achievementType);
    checkField(ach.image);
    checkField(ach.criteria?.id);
    checkField(ach.criteria?.narrative);
    checkField(ach.humanCode);
    checkField(ach.fieldOfStudy);
    checkField(ach.specialization);
    checkField(ach.creditsAvailable);
    checkField(ach.inLanguage);
    checkField(ach.version);

    // Achievement otherIdentifier
    ach.otherIdentifier?.forEach(oi => {
        checkField(oi.identifier);
        checkField(oi.identifierType);
    });

    // ResultDescription
    ach.resultDescription?.forEach(rd => {
        checkField(rd.name);
        checkField(rd.resultType);
        checkField(rd.requiredValue);
    });

    // Alignment
    ach.alignment?.forEach(a => {
        checkField(a.targetName);
        checkField(a.targetUrl);
        checkField(a.targetDescription);
        checkField(a.targetFramework);
        checkField(a.targetCode);
    });

    // CredentialSubject additional fields
    const subj = template.credentialSubject;
    checkField(subj.creditsEarned);
    checkField(subj.activityStartDate);
    checkField(subj.activityEndDate);
    checkField(subj.term);
    checkField(subj.licenseNumber);
    checkField(subj.role);

    // Recipient identifiers
    subj.identifier?.forEach(id => {
        checkField(id.identifier);
        checkField(id.identifierType);
    });

    // Results
    subj.result?.forEach(r => {
        checkField(r.resultDescription);
        checkField(r.value);
        checkField(r.status);
        checkField(r.achievedLevel);
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

    // Custom fields (legacy support)
    template.customFields?.forEach(f => {
        checkField(f.key);
        checkField(f.value);
    });

    return {
        system: Array.from(systemVars).sort(),
        dynamic: Array.from(dynamicVars).sort(),
    };
};

/**
 * Extract all dynamic variables from a template (legacy - returns all variables)
 */
export const extractDynamicVariables = (template: OBv3CredentialTemplate): string[] => {
    // For non-OBv3 credentials with rawJson, extract from the raw JSON directly
    if (template.rawJson && template.schemaType !== 'obv3') {
        const extracted = extractVariablesFromRawJson(template.rawJson);
        // Return combined system + dynamic variables for backwards compatibility
        return [...extracted.system, ...extracted.dynamic].sort();
    }

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
    checkField(template.validFrom);
    checkField(template.validUntil);

    // Credential Subject
    checkField(template.credentialSubject.id);
    checkField(template.credentialSubject.name);

    // Achievement
    const ach = template.credentialSubject.achievement;
    checkField(ach.id);
    checkField(ach.name);
    checkField(ach.description);
    checkField(ach.achievementType);
    checkField(ach.image);
    checkField(ach.criteria?.id);
    checkField(ach.criteria?.narrative);
    checkField(ach.humanCode);
    checkField(ach.fieldOfStudy);
    checkField(ach.specialization);
    checkField(ach.creditsAvailable);
    checkField(ach.inLanguage);
    checkField(ach.version);

    // Achievement otherIdentifier
    ach.otherIdentifier?.forEach(oi => {
        checkField(oi.identifier);
        checkField(oi.identifierType);
    });

    // ResultDescription
    ach.resultDescription?.forEach(rd => {
        checkField(rd.name);
        checkField(rd.resultType);
        checkField(rd.requiredValue);
    });

    // Alignment
    ach.alignment?.forEach(a => {
        checkField(a.targetName);
        checkField(a.targetUrl);
        checkField(a.targetDescription);
        checkField(a.targetFramework);
        checkField(a.targetCode);
    });

    // CredentialSubject additional fields
    const subj = template.credentialSubject;
    checkField(subj.creditsEarned);
    checkField(subj.activityStartDate);
    checkField(subj.activityEndDate);
    checkField(subj.term);
    checkField(subj.licenseNumber);
    checkField(subj.role);

    // Recipient identifiers
    subj.identifier?.forEach(id => {
        checkField(id.identifier);
        checkField(id.identifierType);
    });

    // Results
    subj.result?.forEach(r => {
        checkField(r.resultDescription);
        checkField(r.value);
        checkField(r.status);
        checkField(r.achievedLevel);
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

    // Custom fields (legacy support)
    template.customFields?.forEach(f => {
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
