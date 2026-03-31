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
    AchievementEntryTemplate,
    AssociationTemplate,
    ClrSubjectTemplate,
    ResultTemplate,
    staticField,
    dynamicField,
    systemField,
    DEFAULT_CONTEXTS,
    DEFAULT_TYPES,
    CLR2_CONTEXTS,
    CLR2_TYPES,
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

    // Trim whitespace/newlines to avoid backend parsing errors from textarea inputs
    const trimmed = field.value?.trim();
    return trimmed || undefined;
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
 * Serialize a single AchievementTemplate to JSON (shared between OBv3 and CLR)
 */
export const serializeAchievement = (ach: AchievementTemplate): Record<string, unknown> => {
    const achievement: Record<string, unknown> = {
        type: ['Achievement'],
    };

    if (ach.id?.value || ach.id?.isDynamic) {
        achievement.id = fieldToJson(ach.id);
    }

    achievement.name = fieldToJson(ach.name) || 'Achievement';
    achievement.description = fieldToJson(ach.description) || '';

    if (ach.achievementType?.value || ach.achievementType?.isDynamic) {
        achievement.achievementType = fieldToJson(ach.achievementType);
    }

    if (ach.image?.value || ach.image?.isDynamic) {
        achievement.image = fieldToJson(ach.image);
    }

    // Criteria
    const criteria: Record<string, unknown> = {};
    if (ach.criteria?.id?.value || ach.criteria?.id?.isDynamic) {
        criteria.id = fieldToJson(ach.criteria.id);
    }
    if (ach.criteria?.narrative?.value || ach.criteria?.narrative?.isDynamic) {
        criteria.narrative = fieldToJson(ach.criteria.narrative);
    }
    if (Object.keys(criteria).length === 0) {
        criteria.narrative = '';
    }
    achievement.criteria = criteria;

    // Additional fields
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

    // otherIdentifier
    if (ach.otherIdentifier && ach.otherIdentifier.length > 0) {
        achievement.otherIdentifier = ach.otherIdentifier.map(oi => ({
            type: 'IdentifierEntry',
            identifier: fieldToJson(oi.identifier),
            identifierType: fieldToJson(oi.identifierType),
        }));
    }

    // ResultDescription
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
    if (ach.alignment && ach.alignment.length > 0) {
        achievement.alignment = ach.alignment.map(a => {
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

    return achievement;
};

/**
 * Serialize results array to JSON (shared between OBv3 subject-level and CLR per-entry)
 */
const serializeResults = (results: ResultTemplate[]): Record<string, unknown>[] => {
    return results.map(r => {
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
};

/**
 * Serialize issuer from template to JSON (shared between OBv3 and CLR)
 */
const serializeIssuer = (issuer: IssuerTemplate): string | Record<string, unknown> => {
    const issuerHasExtraFields = (issuer.name?.value || issuer.name?.isDynamic)
        || (issuer.url?.value || issuer.url?.isDynamic)
        || (issuer.image?.value || issuer.image?.isDynamic)
        || (issuer.email?.value || issuer.email?.isDynamic);

    if (issuerHasExtraFields) {
        const issuerObj: Record<string, unknown> = {
            id: fieldToJson(issuer.id) || '{{issuer_did}}',
            type: ['Profile'],
        };
        if (issuer.name?.value || issuer.name?.isDynamic) {
            issuerObj.name = fieldToJson(issuer.name);
        }
        if (issuer.url?.value || issuer.url?.isDynamic) {
            issuerObj.url = fieldToJson(issuer.url);
        }
        if (issuer.image?.value || issuer.image?.isDynamic) {
            issuerObj.image = fieldToJson(issuer.image);
        }
        if (issuer.email?.value || issuer.email?.isDynamic) {
            issuerObj.email = fieldToJson(issuer.email);
        }
        return issuerObj;
    }
    return fieldToJson(issuer.id) || '{{issuer_did}}';
};

/**
 * Serialize evidence array to JSON (shared between OBv3 and CLR)
 */
const serializeEvidence = (evidence: EvidenceTemplate[]): Record<string, unknown>[] => {
    return evidence.map(e => {
        const ev: Record<string, unknown> = {
            type: [fieldToJson(e.type) || 'Evidence'],
        };
        if (e.evidenceUrl?.value || e.evidenceUrl?.isDynamic) {
            ev.id = fieldToJson(e.evidenceUrl);
        }
        if (e.name?.value || e.name?.isDynamic) {
            ev.name = fieldToJson(e.name);
        }
        if (e.description?.value || e.description?.isDynamic) {
            ev.description = fieldToJson(e.description);
        }
        if (e.narrative?.value || e.narrative?.isDynamic) {
            ev.narrative = fieldToJson(e.narrative);
        }
        if (e.genre?.value || e.genre?.isDynamic) {
            ev.genre = fieldToJson(e.genre);
        }
        if (e.audience?.value || e.audience?.isDynamic) {
            ev.audience = fieldToJson(e.audience);
        }
        return ev;
    });
};

/**
 * Parse a single achievement JSON object into AchievementTemplate (shared between OBv3 and CLR)
 */
export const parseAchievement = (achievementObj: Record<string, unknown>): AchievementTemplate => {
    const criteriaObj = (typeof achievementObj.criteria === 'object' && achievementObj.criteria !== null) ? achievementObj.criteria as Record<string, unknown> : undefined;
    const alignmentArr = Array.isArray(achievementObj.alignment) ? achievementObj.alignment as Record<string, unknown>[] : [];
    const resultDescArr = Array.isArray(achievementObj.resultDescription) ? achievementObj.resultDescription as Record<string, unknown>[] : [];
    const otherIdArr = Array.isArray(achievementObj.otherIdentifier) ? achievementObj.otherIdentifier as Record<string, unknown>[] : [];

    return {
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
};

/**
 * Parse results array from JSON (shared between OBv3 subject-level and CLR per-entry)
 */
const parseResults = (resultArr: Record<string, unknown>[]): ResultTemplate[] => {
    return resultArr.map((r, i) => ({
        id: `result_${i}`,
        resultDescription: r.resultDescription ? jsonToField(r.resultDescription) : undefined,
        value: r.value ? jsonToField(r.value) : undefined,
        status: r.status ? jsonToField(r.status) : undefined,
        achievedLevel: r.achievedLevel ? jsonToField(r.achievedLevel) : undefined,
    }));
};

/**
 * Parse issuer from JSON (shared between OBv3 and CLR)
 */
const parseIssuer = (issuerValue: unknown): IssuerTemplate => {
    const issuerObj = (typeof issuerValue === 'object' && issuerValue !== null) ? issuerValue as Record<string, unknown> : null;
    return {
        id: issuerValue ? jsonToField(typeof issuerValue === 'string' ? issuerValue : issuerObj?.id) : undefined,
        name: issuerObj?.name ? jsonToField(issuerObj.name) : staticField(''),
        url: issuerObj?.url ? jsonToField(issuerObj.url) : undefined,
        image: issuerObj?.image ? jsonToField(issuerObj.image) : undefined,
        email: issuerObj?.email ? jsonToField(issuerObj.email) : undefined,
        description: issuerObj?.description ? jsonToField(issuerObj.description) : undefined,
    };
};

/**
 * Parse evidence array from JSON (shared between OBv3 and CLR)
 */
const parseEvidence = (evidenceArr: Record<string, unknown>[]): EvidenceTemplate[] => {
    return evidenceArr.map((e, i) => ({
        id: `evidence_${i}`,
        evidenceUrl: e.id ? jsonToField(e.id) : undefined,
        type: e.type ? jsonToField(Array.isArray(e.type) ? e.type[0] : e.type) : undefined,
        name: e.name ? jsonToField(e.name) : undefined,
        description: e.description ? jsonToField(e.description) : undefined,
        narrative: e.narrative ? jsonToField(e.narrative) : undefined,
        genre: e.genre ? jsonToField(e.genre) : undefined,
        audience: e.audience ? jsonToField(e.audience) : undefined,
    }));
};

/**
 * Convert CLR 2.0 template to JSON credential object
 */
export const clrTemplateToJson = (template: OBv3CredentialTemplate): Record<string, unknown> => {
    const credential: Record<string, unknown> = {
        '@context': template.contexts.length > 0 ? template.contexts : CLR2_CONTEXTS,
        type: template.types.length > 0 ? template.types : CLR2_TYPES,
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

    // Issuer (shared)
    credential.issuer = serializeIssuer(template.issuer);

    // Dates
    credential.validFrom = fieldToJson(template.validFrom) || '{{issue_date}}';
    if (template.validUntil?.value || template.validUntil?.isDynamic) {
        credential.validUntil = fieldToJson(template.validUntil);
    }

    // CLR Subject
    const credentialSubject: Record<string, unknown> = {
        type: ['ClrSubject'],
    };

    if (template.credentialSubject.id?.value || template.credentialSubject.id?.isDynamic) {
        credentialSubject.id = fieldToJson(template.credentialSubject.id);
    }

    // Serialize achievements from clrSubject
    if (template.clrSubject?.achievements && template.clrSubject.achievements.length > 0) {
        credentialSubject.achievement = template.clrSubject.achievements.map(entry => {
            const achJson = serializeAchievement(entry.achievement);

            // Per-entry subject fields (result, credits, dates) are placed at the
            // achievement level as CLR 2.0 AchievementSubject-like properties
            const wrapper: Record<string, unknown> = { ...achJson };

            if (entry.result && entry.result.length > 0) {
                wrapper.result = serializeResults(entry.result);
            }
            if (entry.creditsEarned?.value || entry.creditsEarned?.isDynamic) {
                wrapper.creditsEarned = fieldToJson(entry.creditsEarned);
            }
            if (entry.activityStartDate?.value || entry.activityStartDate?.isDynamic) {
                wrapper.activityStartDate = fieldToJson(entry.activityStartDate);
            }
            if (entry.activityEndDate?.value || entry.activityEndDate?.isDynamic) {
                wrapper.activityEndDate = fieldToJson(entry.activityEndDate);
            }

            return wrapper;
        });
    }

    // Serialize associations
    if (template.clrSubject?.associations && template.clrSubject.associations.length > 0) {
        credentialSubject.association = template.clrSubject.associations.map(assoc => ({
            type: ['Association'],
            associationType: fieldToJson(assoc.associationType),
            sourceId: assoc.sourceAchievementId,
            targetId: assoc.targetAchievementId,
        }));
    }

    credential.credentialSubject = credentialSubject;

    // Evidence (top-level, same as OBv3)
    if (template.credentialSubject.evidence && template.credentialSubject.evidence.length > 0) {
        credential.evidence = serializeEvidence(template.credentialSubject.evidence);
    }

    return credential;
};

/**
 * Convert OBv3CredentialTemplate to a JSON credential object
 */
export const templateToJson = (template: OBv3CredentialTemplate): Record<string, unknown> => {
    // If we have raw JSON stored (non-OBv3/non-CLR credential), return it directly
    if (template.rawJson && template.schemaType === 'custom') {
        return template.rawJson;
    }

    // CLR 2.0 delegation
    if (template.schemaType === 'clr2') {
        return clrTemplateToJson(template);
    }

    const credential: Record<string, unknown> = {
        '@context': template.contexts,
        type: template.types,
    };

    // Core fields
    if (template.id?.value) {
        credential.id = fieldToJson(template.id);
    }

    // Credential name mirrors achievement name (static or dynamic)
    const achievementName = template.credentialSubject.achievement.name;
    credential.name = fieldToJson(achievementName) || fieldToJson(template.name) || 'Untitled Credential';

    if (template.description?.value || template.description?.isDynamic) {
        credential.description = fieldToJson(template.description);
    }

    if (template.image?.value || template.image?.isDynamic) {
        credential.image = fieldToJson(template.image);
    }

    // Issuer (shared helper)
    credential.issuer = serializeIssuer(template.issuer);

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

    // Achievement (use shared helper)
    credentialSubject.achievement = serializeAchievement(template.credentialSubject.achievement);

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
        credentialSubject.result = serializeResults(subj.result);
    }

    credential.credentialSubject = credentialSubject;

    // Evidence is a top-level credential property (VC v2 context), NOT inside credentialSubject
    if (template.credentialSubject.evidence && template.credentialSubject.evidence.length > 0) {
        credential.evidence = serializeEvidence(template.credentialSubject.evidence);
    }

    return credential;
};

/**
 * Parse a JSON credential object back to OBv3CredentialTemplate
 */
// Contexts injected by the signing process — not part of the template definition
const SIGNING_ARTIFACT_CONTEXTS = new Set([
    'https://w3id.org/security/suites/ed25519-2020/v1',
    'https://w3id.org/security/suites/ed25519-2018/v1',
    'https://w3id.org/security/suites/jws-2020/v1',
]);

/**
 * Parse a CLR 2.0 JSON credential into template model
 */
export const jsonToClrTemplate = (json: Record<string, unknown>, contexts: string[], types: string[]): OBv3CredentialTemplate => {
    const subjectObj = (typeof json.credentialSubject === 'object' && json.credentialSubject !== null) ? json.credentialSubject as Record<string, unknown> : {};
    const evidenceArr = Array.isArray(json.evidence) ? json.evidence as Record<string, unknown>[]
        : Array.isArray(subjectObj.evidence) ? subjectObj.evidence as Record<string, unknown>[] : [];

    // Parse multi-achievement array
    const achievementArr = Array.isArray(subjectObj.achievement) ? subjectObj.achievement as Record<string, unknown>[] : [];
    const achievements: AchievementEntryTemplate[] = achievementArr.map((achObj, i) => {
        const resultArr = Array.isArray(achObj.result) ? achObj.result as Record<string, unknown>[] : [];
        return {
            id: `ach_${i}`,
            achievement: parseAchievement(achObj),
            result: resultArr.length > 0 ? parseResults(resultArr) : undefined,
            creditsEarned: achObj.creditsEarned ? jsonToField(achObj.creditsEarned) : undefined,
            activityStartDate: achObj.activityStartDate ? jsonToField(achObj.activityStartDate) : undefined,
            activityEndDate: achObj.activityEndDate ? jsonToField(achObj.activityEndDate) : undefined,
        };
    });

    // Parse associations
    const associationArr = Array.isArray(subjectObj.association) ? subjectObj.association as Record<string, unknown>[] : [];
    const associations: AssociationTemplate[] = associationArr.map((assoc, i) => ({
        id: `assoc_${i}`,
        associationType: jsonToField(assoc.associationType || ''),
        sourceAchievementId: String(assoc.sourceId || ''),
        targetAchievementId: String(assoc.targetId || ''),
    }));

    return {
        schemaType: 'clr2',
        contexts,
        types,
        id: json.id ? jsonToField(json.id) : undefined,
        name: jsonToField(json.name || ''),
        description: json.description ? jsonToField(json.description) : undefined,
        image: json.image ? jsonToField(json.image) : undefined,
        issuer: parseIssuer(json.issuer),
        credentialSubject: {
            id: subjectObj.id ? jsonToField(subjectObj.id) : undefined,
            achievement: achievements.length > 0 ? achievements[0].achievement : { name: staticField(''), description: staticField('') },
            evidence: parseEvidence(evidenceArr),
        },
        clrSubject: {
            achievements,
            associations,
        },
        validFrom: jsonToField(json.validFrom || json.issuanceDate || '{{issue_date}}'),
        validUntil: json.validUntil || json.expirationDate ? jsonToField(json.validUntil || json.expirationDate) : undefined,
        customFields: [],
    };
};

export const jsonToTemplate = (json: Record<string, unknown>): OBv3CredentialTemplate => {
    const schemaType = detectSchemaType(json);
    const rawContexts = Array.isArray(json['@context']) ? json['@context'] as string[] : DEFAULT_CONTEXTS;
    // Strip signing artifact contexts that get injected by issueCredential()
    const contexts = rawContexts.filter(c => !SIGNING_ARTIFACT_CONTEXTS.has(c));
    const types = Array.isArray(json.type) ? json.type as string[] : DEFAULT_TYPES;

    // CLR 2.0 credentials get full parsing
    if (schemaType === 'clr2') {
        return jsonToClrTemplate(json, contexts, types);
    }

    // For custom/unknown credentials, store raw JSON and create minimal template
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
    // Evidence is a top-level credential property (VC v2), but also check subjectObj for backwards compat
    const evidenceArr = Array.isArray(json.evidence) ? json.evidence as Record<string, unknown>[]
        : Array.isArray(subjectObj.evidence) ? subjectObj.evidence as Record<string, unknown>[] : [];
    const resultArr = Array.isArray(subjectObj.result) ? subjectObj.result as Record<string, unknown>[] : [];
    const subjectIdArr = Array.isArray(subjectObj.identifier) ? subjectObj.identifier as Record<string, unknown>[] : [];

    // Parse credential subject with all OBv3 AchievementSubject fields
    const credentialSubject: CredentialSubjectTemplate = {
        id: subjectObj.id ? jsonToField(subjectObj.id) : undefined,
        name: subjectObj.name ? jsonToField(subjectObj.name) : undefined,
        achievement: parseAchievement(achievementObj),
        evidence: parseEvidence(evidenceArr),
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
        result: resultArr.length > 0 ? parseResults(resultArr) : undefined,
    };

    return {
        schemaType: 'obv3',
        contexts,
        types,
        id: json.id ? jsonToField(json.id) : undefined,
        name: jsonToField(json.name || ''),
        description: json.description ? jsonToField(json.description) : undefined,
        image: json.image ? jsonToField(json.image) : undefined,
        issuer: parseIssuer(json.issuer),
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

/**
 * Check all fields of an AchievementTemplate for variables (shared helper)
 */
const checkAchievementFields = (ach: AchievementTemplate, checkField: (field: TemplateFieldValue | undefined) => void) => {
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
    ach.otherIdentifier?.forEach(oi => {
        checkField(oi.identifier);
        checkField(oi.identifierType);
    });
    ach.resultDescription?.forEach(rd => {
        checkField(rd.name);
        checkField(rd.resultType);
        checkField(rd.requiredValue);
    });
    ach.alignment?.forEach(a => {
        checkField(a.targetName);
        checkField(a.targetUrl);
        checkField(a.targetDescription);
        checkField(a.targetFramework);
        checkField(a.targetCode);
    });
};

export const extractVariablesByType = (template: OBv3CredentialTemplate): ExtractedVariables => {
    // For custom credentials with rawJson, extract from the raw JSON directly
    if (template.rawJson && template.schemaType === 'custom') {
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
        // Also check the value for mustache patterns (in case isDynamic wasn't set)
        if (field?.value && typeof field.value === 'string') {
            const matches = field.value.matchAll(/\{\{(\w+)\}\}/g);
            for (const m of matches) {
                const varName = m[1];
                if (SYSTEM_VARIABLES.includes(varName)) {
                    systemVars.add(varName);
                } else {
                    dynamicVars.add(varName);
                }
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

    // Achievement (OBv3 single achievement)
    checkAchievementFields(template.credentialSubject.achievement, checkField);

    // CLR 2.0 multi-achievement fields
    if (template.clrSubject) {
        template.clrSubject.achievements.forEach(entry => {
            checkAchievementFields(entry.achievement, checkField);
            checkField(entry.creditsEarned);
            checkField(entry.activityStartDate);
            checkField(entry.activityEndDate);
            entry.result?.forEach(r => {
                checkField(r.resultDescription);
                checkField(r.value);
                checkField(r.status);
                checkField(r.achievedLevel);
            });
        });
        template.clrSubject.associations.forEach(assoc => {
            checkField(assoc.associationType);
        });
    }

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

    // Evidence fields
    template.credentialSubject.evidence?.forEach(e => {
        checkField(e.evidenceUrl);
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

    // Comprehensive fallback: scan the entire template object for any mustache patterns
    // This catches variables in any nested locations that explicit checks might miss
    const scanObject = (obj: unknown): void => {
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
            obj.forEach(scanObject);
        } else if (obj && typeof obj === 'object') {
            Object.values(obj).forEach(scanObject);
        }
    };
    scanObject(template);

    return {
        system: Array.from(systemVars).sort(),
        dynamic: Array.from(dynamicVars).sort(),
    };
};

/**
 * Extract all dynamic variables from a template (legacy - returns all variables)
 */
export const extractDynamicVariables = (template: OBv3CredentialTemplate): string[] => {
    // For custom credentials with rawJson, extract from the raw JSON directly
    if (template.rawJson && template.schemaType === 'custom') {
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

    // Achievement (OBv3 single achievement)
    checkAchievementFields(template.credentialSubject.achievement, checkField);

    // CLR 2.0 multi-achievement fields
    if (template.clrSubject) {
        template.clrSubject.achievements.forEach(entry => {
            checkAchievementFields(entry.achievement, checkField);
            checkField(entry.creditsEarned);
            checkField(entry.activityStartDate);
            checkField(entry.activityEndDate);
            entry.result?.forEach(r => {
                checkField(r.resultDescription);
                checkField(r.value);
                checkField(r.status);
                checkField(r.achievedLevel);
            });
        });
    }

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

    // Evidence fields
    template.credentialSubject.evidence?.forEach(e => {
        checkField(e.evidenceUrl);
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
 * A field-level validation error with a path identifier for inline display
 */
export interface FieldValidationError {
    /** Dot-path identifying the field, e.g. 'achievement.name', 'achievement.criteria.id' */
    field: string;
    /** Human-readable error message */
    message: string;
}

/**
 * Validate a template and return field-level errors
 */
/**
 * Validate a single achievement's URLs (shared between OBv3 and CLR)
 */
const validateAchievementUrls = (ach: AchievementTemplate, prefix: string): FieldValidationError[] => {
    const errors: FieldValidationError[] = [];

    const criteriaId = ach.criteria?.id;
    if (criteriaId?.value && !criteriaId.isDynamic) {
        if (!/^https?:\/\//i.test(criteriaId.value) && !/^urn:/i.test(criteriaId.value)) {
            errors.push({ field: `${prefix}.criteria.id`, message: 'Must be a valid URL (e.g., https://example.com)' });
        }
    }

    const alignments = ach.alignment || [];
    for (let i = 0; i < alignments.length; i++) {
        const a = alignments[i];
        if (a.targetUrl?.value && !a.targetUrl.isDynamic) {
            if (!/^https?:\/\//i.test(a.targetUrl.value) && !/^urn:/i.test(a.targetUrl.value)) {
                errors.push({ field: `${prefix}.alignment.${i}.targetUrl`, message: 'Must be a valid URL (e.g., https://example.com)' });
            }
        }
    }

    return errors;
};

export const validateTemplate = (template: OBv3CredentialTemplate): FieldValidationError[] => {
    const errors: FieldValidationError[] = [];

    // Custom schemas use rawJson passthrough — template fields are empty placeholders
    if (template.schemaType === 'custom') {
        return errors;
    }

    // CLR 2.0 validation
    if (template.schemaType === 'clr2') {
        const achievements = template.clrSubject?.achievements || [];

        if (achievements.length === 0) {
            errors.push({ field: 'achievements-list', message: 'At least one achievement is required' });
        }

        for (let i = 0; i < achievements.length; i++) {
            const entry = achievements[i];
            if (!entry.achievement.name.value && !entry.achievement.name.isDynamic) {
                errors.push({ field: `achievements.${i}.name`, message: `Achievement ${i + 1} name is required` });
            }
            errors.push(...validateAchievementUrls(entry.achievement, `achievements.${i}`));
        }

        // Validate associations reference valid achievement IDs
        const validIds = new Set(achievements.map(a => a.id));
        const associations = template.clrSubject?.associations || [];
        for (let i = 0; i < associations.length; i++) {
            const assoc = associations[i];
            if (assoc.sourceAchievementId && !validIds.has(assoc.sourceAchievementId)) {
                errors.push({ field: `associations.${i}.source`, message: 'Source achievement not found' });
            }
            if (assoc.targetAchievementId && !validIds.has(assoc.targetAchievementId)) {
                errors.push({ field: `associations.${i}.target`, message: 'Target achievement not found' });
            }
        }

        // Evidence URL validation (shared with OBv3)
        const evidenceItems = template.credentialSubject.evidence || [];
        for (let i = 0; i < evidenceItems.length; i++) {
            const e = evidenceItems[i];
            if (e.evidenceUrl?.value && !e.evidenceUrl.isDynamic) {
                if (!/^https?:\/\//i.test(e.evidenceUrl.value) && !/^urn:/i.test(e.evidenceUrl.value)) {
                    errors.push({ field: `evidence.${i}.evidenceUrl`, message: 'Must be a valid URL (e.g., https://example.com)' });
                }
            }
        }

        return errors;
    }

    // OBv3 validation
    if (!template.credentialSubject.achievement.name.value && !template.credentialSubject.achievement.name.isDynamic) {
        errors.push({ field: 'achievement.name', message: 'Achievement name is required' });
    }

    errors.push(...validateAchievementUrls(template.credentialSubject.achievement, 'achievement'));

    // Evidence URL must be a valid URI (JSON-LD @id field)
    const evidenceItems = template.credentialSubject.evidence || [];
    for (let i = 0; i < evidenceItems.length; i++) {
        const e = evidenceItems[i];
        if (e.evidenceUrl?.value && !e.evidenceUrl.isDynamic) {
            if (!/^https?:\/\//i.test(e.evidenceUrl.value) && !/^urn:/i.test(e.evidenceUrl.value)) {
                errors.push({ field: `evidence.${i}.evidenceUrl`, message: 'Must be a valid URL (e.g., https://example.com)' });
            }
        }
    }

    return errors;
};

/**
 * Get the error message for a specific field from validation errors
 */
export const getFieldError = (errors: FieldValidationError[], field: string): string | undefined => {
    return errors.find(e => e.field === field)?.message;
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
