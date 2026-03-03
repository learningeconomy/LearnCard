/**
 * Utility functions for TemplateBuilderStep
 * Extracted for better code splitting and testability
 */

import { CredentialTemplate, BrandingConfig, TemplateBoostMeta } from '../types';
import { 
    OBv3CredentialTemplate, 
    extractDynamicVariables,
    getBlankTemplate,
    staticField,
    dynamicField,
    systemField,
} from '../components/CredentialBuilder';
import { TEMPLATE_META_VERSION, ISSUANCE_FIELDS } from './templateBuilderConstants';

// Extended template type - uses CredentialTemplate with proper OBv3 typing
export type ExtendedTemplate = CredentialTemplate & {
    obv3Template?: OBv3CredentialTemplate;
    isMasterTemplate?: boolean;
    parentTemplateId?: string;
    childTemplates?: ExtendedTemplate[];
};

export type ValidationStatus = 'unknown' | 'validating' | 'valid' | 'invalid' | 'dirty';

// Convert legacy CredentialTemplate to OBv3CredentialTemplate
export const legacyToOBv3 = (legacy: CredentialTemplate, issuerName?: string, issuerImage?: string): OBv3CredentialTemplate => {
    const template = getBlankTemplate();

    // Set basic info
    template.name = staticField(legacy.name || '');
    template.description = staticField(legacy.description || '');

    if (legacy.imageUrl) {
        template.image = staticField(legacy.imageUrl);
    }

    // Set issuer
    if (issuerName) {
        template.issuer.name = staticField(issuerName);
    }

    if (issuerImage) {
        template.issuer.image = staticField(issuerImage);
    }

    // Set achievement
    template.credentialSubject.achievement.name = staticField(legacy.name || '');
    template.credentialSubject.achievement.description = staticField(legacy.description || '');

    if (legacy.achievementType) {
        template.credentialSubject.achievement.achievementType = staticField(legacy.achievementType);
    }

    // Convert legacy fields to OBv3 format
    for (const field of legacy.fields || []) {
        const varName = field.variableName || field.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

        if (field.id === 'recipient_name' || varName === 'recipient_name') {
            template.credentialSubject.name = dynamicField('recipient_name', '');
        } else if (field.id === 'issue_date' || varName === 'issue_date') {
            template.validFrom = dynamicField('issue_date', '');
        } else {
            // Add as custom field
            template.customFields.push({
                id: field.id,
                key: staticField(varName),
                value: dynamicField(varName, ''),
            });
        }
    }

    return template;
};

// Convert OBv3CredentialTemplate back to legacy CredentialTemplate format for storage
export const obv3ToLegacy = (obv3: OBv3CredentialTemplate, existingTemplate?: CredentialTemplate): CredentialTemplate => {
    const dynamicVars = extractDynamicVariables(obv3);

    // Build fields array from dynamic variables
    const fields = dynamicVars.map(varName => ({
        id: varName,
        name: varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: 'text' as const,
        required: varName === 'recipient_name' || varName === 'issue_date',
        variableName: varName,
    }));

    return {
        id: existingTemplate?.id || `template_${Date.now()}`,
        boostUri: existingTemplate?.boostUri,
        name: obv3.name.value || 'Untitled Template',
        description: obv3.description?.value || '',
        achievementType: obv3.credentialSubject.achievement.achievementType?.value || 'Achievement',
        fields,
        imageUrl: obv3.image?.value,
        isNew: existingTemplate?.isNew ?? true,
        isDirty: true,
        obv3Template: obv3,
    };
};

// Generate the master template with dynamic variables for all catalog + issuance fields
export const generateMasterTemplate = (
    columnMappings: Record<string, string>,
    issuanceFieldsIncluded: Record<string, boolean>,
    branding: BrandingConfig | null
): ExtendedTemplate => {
    const template = getBlankTemplate();

    // Set issuer from branding
    if (branding?.displayName) {
        template.issuer.name = staticField(branding.displayName);
    }

    if (branding?.image) {
        template.issuer.image = staticField(branding.image);
    }

    // Process catalog-level mappings as DYNAMIC variables in master template
    Object.entries(columnMappings).forEach(([columnName, fieldType]) => {
        if (fieldType === 'skip') return;

        const varName = columnName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        const displayName = columnName.replace(/[^a-zA-Z0-9]+/g, ' ').trim();

        // Handle credential-level fields
        if (fieldType === 'credential.name') {
            template.name = dynamicField(varName, '');
            return;
        }

        if (fieldType === 'credential.description') {
            template.description = dynamicField(varName, '');
            return;
        }

        if (fieldType === 'credential.image') {
            template.image = dynamicField(varName, '');
            return;
        }

        // Handle achievement fields
        if (fieldType === 'achievement.name') {
            template.credentialSubject.achievement.name = dynamicField(varName, '');
            return;
        }

        if (fieldType === 'achievement.description') {
            template.credentialSubject.achievement.description = dynamicField(varName, '');
            return;
        }

        if (fieldType === 'achievement.image') {
            template.credentialSubject.achievement.image = dynamicField(varName, '');
            return;
        }

        if (fieldType === 'achievement.achievementType') {
            template.credentialSubject.achievement.achievementType = dynamicField(varName, '');
            return;
        }

        if (fieldType === 'achievement.id') {
            template.credentialSubject.achievement.id = dynamicField(varName, '');
            return;
        }

        if (fieldType === 'achievement.criteria.narrative') {
            if (!template.credentialSubject.achievement.criteria) {
                template.credentialSubject.achievement.criteria = {};
            }
            template.credentialSubject.achievement.criteria.narrative = dynamicField(varName, '');
            return;
        }

        // For alignment, evidence, result, subject, related, and custom fields
        if (fieldType.startsWith('alignment.') || 
            fieldType.startsWith('evidence.') || 
            fieldType.startsWith('result.') || 
            fieldType.startsWith('subject.') || 
            fieldType.startsWith('related.') ||
            fieldType.startsWith('achievement.') ||
            fieldType === 'custom' ||
            fieldType === 'credential.inLanguage') {
            template.customFields.push({
                id: `custom_${varName}`,
                key: staticField(displayName),
                value: dynamicField(varName, ''),
            });
        }
    });

    // Add issuance-level fields based on their type (dynamic or system)
    const issuanceFieldDefs = ISSUANCE_FIELDS.reduce((acc, f) => ({ ...acc, [f.id]: f }), {} as Record<string, typeof ISSUANCE_FIELDS[number]>);

    Object.entries(issuanceFieldsIncluded).forEach(([fieldId, included]) => {
        if (!included) return;

        switch (fieldId) {
            case 'recipient_name':
                template.credentialSubject.name = dynamicField('recipient_name', '');
                break;

            case 'recipient_did':
                template.credentialSubject.id = systemField('Recipient DID (auto-injected)');
                break;

            case 'recipient_email':
                // System field - used for delivery, not stored in credential
                break;

            case 'issue_date':
                template.validFrom = systemField('issue_date');
                break;

            case 'completion_date':
                template.credentialSubject.activityEndDate = dynamicField('completion_date', '');
                break;

            case 'score':
                if (!template.credentialSubject.result) {
                    template.credentialSubject.result = [];
                }
                template.credentialSubject.result.push({
                    id: 'result_score',
                    value: dynamicField('score', ''),
                });
                break;

            case 'expiration_date':
                template.validUntil = dynamicField('expiration_date', '');
                break;
        }
    });

    // Find a name column mapped to achievement.name for the template name
    const nameColumn = Object.entries(columnMappings).find(([_, type]) => type === 'achievement.name')?.[0];
    const nameVarName = nameColumn ? nameColumn.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') : 'course_name';
    template.name = dynamicField(nameVarName, 'Course Completion');
    template.description = staticField('Master template for course completion credentials');

    const dynamicVars = extractDynamicVariables(template);

    return {
        id: `master_${Date.now()}`,
        name: 'Course Completion Template',
        description: 'Master template for all course completions',
        achievementType: 'Course Completion',
        fields: dynamicVars.map(varName => ({
            id: varName,
            name: varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type: 'text' as const,
            required: varName === 'recipient_name',
            variableName: varName,
        })),
        isNew: true,
        isDirty: true,
        obv3Template: template,
        isMasterTemplate: true,
    };
};

// Generate a child boost template for one course row with catalog data baked in
export const generateChildBoostForCourse = (
    courseRow: Record<string, string>,
    parentId: string,
    columnMappings: Record<string, string>,
    issuanceFieldsIncluded: Record<string, boolean>,
    branding: BrandingConfig | null,
    defaultImage: string
): ExtendedTemplate => {
    const template = getBlankTemplate();

    // Set issuer from branding
    if (branding?.displayName) {
        template.issuer.name = staticField(branding.displayName);
    }

    if (branding?.image) {
        template.issuer.image = staticField(branding.image);
    }

    let boostName = 'Course Completion';
    let boostDescription = '';
    let achievementTypeSet = false;

    // Track aggregate fields
    const alignmentData: Record<string, string> = {};
    const evidenceData: Record<string, string> = {};
    const resultData: Record<string, string> = {};
    const relatedData: Record<string, string> = {};
    const subjectData: Record<string, string> = {};

    // Process catalog-level mappings - BAKE IN the actual values from CSV
    Object.entries(columnMappings).forEach(([columnName, fieldType]) => {
        if (fieldType === 'skip') return;

        const value = courseRow[columnName] || '';
        if (!value.trim()) return;

        // Handle grouped fields
        if (fieldType.startsWith('alignment.')) {
            alignmentData[fieldType.replace('alignment.', '')] = value;
            return;
        }

        if (fieldType.startsWith('evidence.')) {
            evidenceData[fieldType.replace('evidence.', '')] = value;
            return;
        }

        if (fieldType.startsWith('result.')) {
            resultData[fieldType.replace('result.', '')] = value;
            return;
        }

        if (fieldType.startsWith('related.')) {
            relatedData[fieldType.replace('related.', '')] = value;
            return;
        }

        if (fieldType.startsWith('subject.')) {
            subjectData[fieldType.replace('subject.', '')] = value;
            return;
        }

        switch (fieldType) {
            case 'credential.name':
                template.name = staticField(value);
                boostName = value;
                break;

            case 'credential.description':
                template.description = staticField(value);
                boostDescription = value;
                break;

            case 'credential.image':
                template.image = staticField(value);
                break;

            case 'credential.inLanguage':
                template.customFields.push({
                    id: 'credential_language',
                    key: staticField('Language'),
                    value: staticField(value),
                });
                break;

            case 'achievement.name':
                template.credentialSubject.achievement.name = staticField(value);
                if (!boostName || boostName === 'Course Completion') {
                    boostName = value;
                }
                break;

            case 'achievement.description':
                template.credentialSubject.achievement.description = staticField(value);
                if (!boostDescription) {
                    boostDescription = value;
                }
                break;

            case 'achievement.image':
                template.credentialSubject.achievement.image = staticField(value);
                break;

            case 'achievement.achievementType':
                template.credentialSubject.achievement.achievementType = staticField(value);
                achievementTypeSet = true;
                break;

            case 'achievement.criteria.narrative':
                if (!template.credentialSubject.achievement.criteria) {
                    template.credentialSubject.achievement.criteria = {};
                }
                template.credentialSubject.achievement.criteria.narrative = staticField(value);
                break;

            case 'achievement.id':
                template.credentialSubject.achievement.id = staticField(value);
                break;

            case 'achievement.humanCode':
                template.credentialSubject.achievement.humanCode = staticField(value);
                break;

            case 'achievement.fieldOfStudy':
                template.credentialSubject.achievement.fieldOfStudy = staticField(value);
                break;

            case 'achievement.specialization':
                template.credentialSubject.achievement.specialization = staticField(value);
                break;

            case 'achievement.creditsAvailable':
                template.credentialSubject.achievement.creditsAvailable = staticField(value);
                break;

            case 'achievement.tag':
                if (!template.credentialSubject.achievement.tag) {
                    template.credentialSubject.achievement.tag = [];
                }
                const tags = value.split(',').map(t => t.trim()).filter(Boolean);
                template.credentialSubject.achievement.tag.push(...tags);
                break;

            case 'achievement.version':
                template.credentialSubject.achievement.version = staticField(value);
                break;

            case 'achievement.inLanguage':
                template.credentialSubject.achievement.inLanguage = staticField(value);
                break;
        }
    });

    // Create alignment entry if any alignment fields were mapped
    if (Object.keys(alignmentData).length > 0 && (alignmentData.targetName || alignmentData.targetUrl)) {
        if (!template.credentialSubject.achievement.alignment) {
            template.credentialSubject.achievement.alignment = [];
        }

        template.credentialSubject.achievement.alignment.push({
            id: `alignment_${Date.now()}`,
            targetName: staticField(alignmentData.targetName || ''),
            targetUrl: staticField(alignmentData.targetUrl || ''),
            ...(alignmentData.targetDescription && { targetDescription: staticField(alignmentData.targetDescription) }),
            ...(alignmentData.targetFramework && { targetFramework: staticField(alignmentData.targetFramework) }),
            ...(alignmentData.targetCode && { targetCode: staticField(alignmentData.targetCode) }),
        });
    }

    // Create evidence entry if any evidence fields were mapped
    if (Object.keys(evidenceData).length > 0) {
        if (!template.credentialSubject.evidence) {
            template.credentialSubject.evidence = [];
        }

        template.credentialSubject.evidence.push({
            id: `evidence_${Date.now()}`,
            ...(evidenceData.name && { name: staticField(evidenceData.name) }),
            ...(evidenceData.description && { description: staticField(evidenceData.description) }),
            ...(evidenceData.narrative && { narrative: staticField(evidenceData.narrative) }),
            ...(evidenceData.genre && { genre: staticField(evidenceData.genre) }),
            ...(evidenceData.audience && { audience: staticField(evidenceData.audience) }),
        });
    }

    // Add result data
    if (Object.keys(resultData).length > 0) {
        if (!template.credentialSubject.result) {
            template.credentialSubject.result = [];
        }

        template.credentialSubject.result.push({
            id: `result_${Date.now()}`,
            ...(resultData.value && { value: staticField(resultData.value) }),
            ...(resultData.status && { status: staticField(resultData.status) }),
            ...(resultData.achievedLevel && { achievedLevel: staticField(resultData.achievedLevel) }),
        });
    }

    // Add subject data
    Object.entries(subjectData).forEach(([key, value]) => {
        switch (key) {
            case 'creditsEarned':
                template.credentialSubject.creditsEarned = staticField(value);
                break;
            case 'activityStartDate':
                template.credentialSubject.activityStartDate = staticField(value);
                break;
            case 'activityEndDate':
                template.credentialSubject.activityEndDate = staticField(value);
                break;
            case 'term':
                template.credentialSubject.term = staticField(value);
                break;
            case 'licenseNumber':
                template.credentialSubject.licenseNumber = staticField(value);
                break;
            case 'role':
                template.credentialSubject.role = staticField(value);
                break;
        }
    });

    // Related achievement data
    if (Object.keys(relatedData).length > 0 && relatedData.id) {
        if (!template.credentialSubject.achievement.alignment) {
            template.credentialSubject.achievement.alignment = [];
        }

        template.credentialSubject.achievement.alignment.push({
            id: `related_${Date.now()}`,
            targetName: staticField(relatedData.id || 'Related Achievement'),
            targetUrl: staticField(relatedData.id || ''),
            ...(relatedData.version && { targetDescription: staticField(`Version: ${relatedData.version}`) }),
        });
    }

    // Apply default image if no image was mapped from CSV
    if (defaultImage) {
        if (!template.image?.value && !template.credentialSubject.achievement.image?.value) {
            template.credentialSubject.achievement.image = staticField(defaultImage);
        }
    }

    // Default achievement type
    if (!achievementTypeSet) {
        template.credentialSubject.achievement.achievementType = staticField('Course');
    }

    // Add issuance-level fields
    Object.entries(issuanceFieldsIncluded).forEach(([fieldId, included]) => {
        if (!included) return;

        switch (fieldId) {
            case 'recipient_name':
                template.credentialSubject.name = dynamicField('recipient_name', '');
                break;

            case 'recipient_did':
                template.credentialSubject.id = systemField('Recipient DID (auto-injected)');
                break;

            case 'recipient_email':
                break;

            case 'issue_date':
                template.validFrom = systemField('issue_date');
                break;

            case 'completion_date':
                template.credentialSubject.activityEndDate = dynamicField('completion_date', '');
                break;

            case 'score':
                if (!template.credentialSubject.result) {
                    template.credentialSubject.result = [];
                }
                template.credentialSubject.result.push({
                    id: 'result_score',
                    value: dynamicField('score', ''),
                });
                break;

            case 'expiration_date':
                template.validUntil = dynamicField('expiration_date', '');
                break;
        }
    });

    template.name = staticField(`${boostName} Completion`);
    template.description = staticField(boostDescription);

    const dynamicVars = extractDynamicVariables(template);

    return {
        id: `child_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: `${boostName} Completion`,
        description: boostDescription,
        achievementType: 'Course Completion',
        fields: dynamicVars.map(varName => ({
            id: varName,
            name: varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type: 'text' as const,
            required: varName === 'recipient_name',
            variableName: varName,
        })),
        isNew: true,
        isDirty: true,
        obv3Template: template,
        parentTemplateId: parentId,
    };
};

// Create boost metadata
export const createBoostMeta = (
    integrationId: string,
    template: ExtendedTemplate,
    obv3Template: OBv3CredentialTemplate
): TemplateBoostMeta => {
    const dynamicVars = extractDynamicVariables(obv3Template);

    return {
        integrationId,
        templateConfig: {
            fields: dynamicVars.map(varName => ({
                id: varName,
                name: varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                type: 'text' as const,
                required: false,
                variableName: varName,
            })),
            achievementType: obv3Template.credentialSubject.achievement.achievementType?.value || 'Achievement',
            version: TEMPLATE_META_VERSION,
        },
        isMasterTemplate: template.isMasterTemplate,
    };
};
