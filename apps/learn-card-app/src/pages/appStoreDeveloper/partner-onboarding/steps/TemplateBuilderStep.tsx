/**
 * TemplateBuilderStep - Interactive OBv3 credential template builder
 * 
 * Uses the CredentialBuilder component for a full-featured, schema-driven
 * credential template editor with live JSON preview and bidirectional editing.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import {
    FileStack,
    Plus,
    Trash2,
    ArrowRight,
    ArrowLeft,
    Award,
    ChevronDown,
    ChevronUp,
    Loader2,
    Save,
    AlertCircle,
    Zap,
    Upload,
    X,
    FileSpreadsheet,
    Check,
    ArrowDown,
    Pencil,
} from 'lucide-react';

import { useWallet, useFilestack } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';
import { ImageIcon } from 'lucide-react';

import { CredentialTemplate, BrandingConfig, TemplateBoostMeta, PartnerProject } from '../types';
import { 
    CredentialBuilder, 
    OBv3CredentialTemplate, 
    templateToJson, 
    jsonToTemplate,
    extractDynamicVariables,
    getBlankTemplate,
    TEMPLATE_PRESETS,
    staticField,
    dynamicField,
    systemField,
} from '../components/CredentialBuilder';

const TEMPLATE_META_VERSION = '2.0.0';

// Default fields for new templates
const DEFAULT_FIELDS = [
    { id: 'recipient_name', name: 'Recipient Name', type: 'text' as const, required: true, variableName: 'recipient_name' },
    { id: 'issue_date', name: 'Issue Date', type: 'date' as const, required: true, variableName: 'issue_date' },
];

// Comprehensive OBv3 field options for mapping CSV columns
// Based on Open Badges v3 JSON-LD context: https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json
const CATALOG_FIELD_OPTIONS = [
    // Skip option
    { id: 'skip', label: '— Skip this column —', description: 'Do not include in credential', group: 'skip' },

    // Credential-level fields
    { id: 'credential.name', label: 'Credential Name', description: 'Display name of the credential', group: 'credential', required: true },
    { id: 'credential.description', label: 'Credential Description', description: 'Description of the credential', group: 'credential' },
    { id: 'credential.image', label: 'Credential Image', description: 'URL to credential image', group: 'credential' },
    { id: 'credential.inLanguage', label: 'Language', description: 'Language of the credential (e.g., en, es)', group: 'credential' },

    // Achievement fields
    { id: 'achievement.name', label: 'Name', description: 'Name of the achievement', group: 'achievement', required: true },
    { id: 'achievement.description', label: 'Description', description: 'Description of the achievement', group: 'achievement' },
    { id: 'achievement.image', label: 'Image', description: 'URL to achievement badge image', group: 'achievement' },
    { id: 'achievement.achievementType', label: 'Type', description: 'Type: Course, Badge, Certificate, etc.', group: 'achievement' },
    { id: 'achievement.id', label: 'ID/URL', description: 'Unique identifier/URL for the achievement', group: 'achievement' },
    { id: 'achievement.humanCode', label: 'Human Code', description: 'Human-readable code (e.g., CS101)', group: 'achievement' },
    { id: 'achievement.fieldOfStudy', label: 'Field of Study', description: 'Field of study or discipline', group: 'achievement' },
    { id: 'achievement.specialization', label: 'Specialization', description: 'Area of specialization', group: 'achievement' },
    { id: 'achievement.creditsAvailable', label: 'Credits Available', description: 'Number of credits available', group: 'achievement' },
    { id: 'achievement.tag', label: 'Tags/Keywords', description: 'Keywords or tags for the achievement', group: 'achievement' },
    { id: 'achievement.version', label: 'Version', description: 'Version of the achievement', group: 'achievement' },
    { id: 'achievement.inLanguage', label: 'Language', description: 'Language of the achievement', group: 'achievement' },
    { id: 'achievement.criteria.narrative', label: 'Criteria (Narrative)', description: 'Criteria for earning this achievement', group: 'achievement' },

    // Achievement Subject fields (recipient-related but can be static)
    { id: 'subject.creditsEarned', label: 'Credits Earned', description: 'Number of credits earned by recipient', group: 'subject' },
    { id: 'subject.activityStartDate', label: 'Activity Start Date', description: 'When the activity started', group: 'subject' },
    { id: 'subject.activityEndDate', label: 'Activity End Date', description: 'When the activity ended', group: 'subject' },
    { id: 'subject.licenseNumber', label: 'License Number', description: 'License or certificate number', group: 'subject' },
    { id: 'subject.role', label: 'Role', description: 'Role of the recipient in the activity', group: 'subject' },
    { id: 'subject.term', label: 'Term', description: 'Academic term (e.g., Fall 2024)', group: 'subject' },

    // Alignment fields (for mapping to frameworks/standards)
    { id: 'alignment.targetName', label: 'Name', description: 'Name of aligned competency/standard', group: 'alignment' },
    { id: 'alignment.targetUrl', label: 'URL', description: 'URL to the aligned standard', group: 'alignment' },
    { id: 'alignment.targetDescription', label: 'Description', description: 'Description of the alignment', group: 'alignment' },
    { id: 'alignment.targetFramework', label: 'Framework', description: 'Name of the framework (e.g., CASE)', group: 'alignment' },
    { id: 'alignment.targetCode', label: 'Code', description: 'Code within the framework', group: 'alignment' },
    { id: 'alignment.targetType', label: 'Type', description: 'Type of alignment target', group: 'alignment' },

    // Evidence fields
    { id: 'evidence.name', label: 'Name', description: 'Name/title of evidence', group: 'evidence' },
    { id: 'evidence.description', label: 'Description', description: 'Description of the evidence', group: 'evidence' },
    { id: 'evidence.narrative', label: 'Narrative', description: 'Narrative about the evidence', group: 'evidence' },
    { id: 'evidence.genre', label: 'Genre', description: 'Type/genre of evidence', group: 'evidence' },
    { id: 'evidence.audience', label: 'Audience', description: 'Intended audience', group: 'evidence' },

    // Result fields (for scores, grades, etc.)
    { id: 'result.value', label: 'Value', description: 'Score, grade, or result value', group: 'result' },
    { id: 'result.status', label: 'Status', description: 'Result status (Completed, Passed, Failed)', group: 'result' },
    { id: 'result.achievedLevel', label: 'Achieved Level', description: 'Level achieved (URL to rubric level)', group: 'result' },

    // Related achievement
    { id: 'related.id', label: 'Related: ID/URL', description: 'URL of a related achievement', group: 'related' },
    { id: 'related.version', label: 'Related: Version', description: 'Version of the related achievement', group: 'related' },
    { id: 'related.inLanguage', label: 'Related: Language', description: 'Language of the related achievement', group: 'related' },

    // Custom extension
    { id: 'custom', label: 'Custom Field', description: 'Include as a custom extension field', group: 'custom' },
];

// Group labels for the dropdown
const FIELD_GROUPS: Record<string, string> = {
    skip: '',
    credential: 'Credential',
    achievement: 'Achievement',
    subject: 'Recipient/Subject',
    alignment: 'Alignment (Standards)',
    evidence: 'Evidence',
    result: 'Result',
    related: 'Related Achievement',
    custom: 'Extensions',
};

// Issuance-level fields - distinguished by type:
// - 'dynamic': Mustache variable that user provides at issuance time
// - 'system': Auto-injected by the system (recipient DID, etc.)
const ISSUANCE_FIELDS = [
    { id: 'recipient_name', label: 'Recipient Name', description: 'Name of the credential recipient', type: 'dynamic' as const, required: true, defaultIncluded: true },
    { id: 'recipient_email', label: 'Recipient Email', description: 'Email for sending the credential (used for delivery, not in credential)', type: 'system' as const, required: true, defaultIncluded: false },
    { id: 'recipient_did', label: 'Recipient DID', description: 'Auto-injected recipient identifier', type: 'system' as const, required: false, defaultIncluded: true },
    { id: 'issue_date', label: 'Issue Date', description: 'When the credential was issued', type: 'dynamic' as const, required: false, defaultIncluded: true },
    { id: 'completion_date', label: 'Completion Date', description: 'When the course was completed', type: 'dynamic' as const, required: false, defaultIncluded: false },
    { id: 'score', label: 'Score/Grade', description: 'Score or grade achieved', type: 'dynamic' as const, required: false, defaultIncluded: false },
    { id: 'expiration_date', label: 'Expiration Date', description: 'When the credential expires', type: 'dynamic' as const, required: false, defaultIncluded: false },
];

// Smart mapping suggestions for catalog columns (baked into each boost)
const suggestCatalogFieldMapping = (columnName: string): string => {
    const lower = columnName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Course name / title → Achievement Name
    if (lower.includes('coursename') || lower.includes('title') || (lower.includes('name') && !lower.includes('student') && !lower.includes('instructor') && !lower.includes('framework'))) {
        return 'achievement.name';
    }

    // Description
    if (lower.includes('description') || lower.includes('desc') || lower.includes('summary') || lower.includes('overview')) {
        return 'achievement.description';
    }

    // Achievement type
    if (lower.includes('type') && (lower.includes('achievement') || lower.includes('credential') || lower.includes('badge'))) {
        return 'achievement.achievementType';
    }

    // Criteria
    if (lower.includes('criteria') || lower.includes('requirement') || lower.includes('objective') || lower.includes('learning outcome')) {
        return 'achievement.criteria.narrative';
    }

    // Image/Badge
    if (lower.includes('image') || lower.includes('badge') || lower.includes('icon') || lower.includes('logo')) {
        return 'achievement.image';
    }

    // Alignment fields
    if (lower.includes('standard') || lower.includes('competency') || lower.includes('skill') && !lower.includes('name')) {
        return 'alignment.targetName';
    }

    if (lower.includes('framework') && lower.includes('name')) {
        return 'alignment.targetFramework';
    }

    if (lower.includes('framework') && (lower.includes('url') || lower.includes('link'))) {
        return 'alignment.targetUrl';
    }

    if (lower.includes('frameworkcode') || (lower.includes('code') && lower.includes('standard'))) {
        return 'alignment.targetCode';
    }

    // Evidence
    if (lower.includes('evidence') && lower.includes('name')) {
        return 'evidence.name';
    }

    if (lower.includes('evidence') && lower.includes('desc')) {
        return 'evidence.description';
    }

    // Result/Score
    if (lower.includes('score') || lower.includes('grade') || lower.includes('result') || lower.includes('mark')) {
        return 'result.value';
    }

    if (lower.includes('pass') || lower.includes('fail') || lower.includes('status')) {
        return 'result.status';
    }

    // Course ID → Achievement ID
    if (lower.includes('courseid') || lower.includes('badgeid') || lower.includes('credentialid')) {
        return 'achievement.id';
    }

    // Skip fields that are clearly issuance-level or not useful
    if (lower.includes('student') || lower.includes('email') || lower.includes('enrolled') || 
        lower.includes('capacity') || lower.includes('room') || lower.includes('schedule') ||
        lower.includes('seat') || lower.includes('available') || lower.includes('prerequisite') ||
        lower.includes('instructor') || lower.includes('teacher') || lower.includes('professor')) {
        return 'skip';
    }

    // Default to custom field for other columns
    return 'custom';
};

interface TemplateBuilderStepProps {
    templates: CredentialTemplate[];
    branding: BrandingConfig | null;
    project: PartnerProject | null;
    onComplete: (templates: CredentialTemplate[]) => void;
    onBack: () => void;
}

// Extended template type - uses CredentialTemplate with proper OBv3 typing
type ExtendedTemplate = CredentialTemplate & {
    obv3Template?: OBv3CredentialTemplate;
    isMasterTemplate?: boolean;
    parentTemplateId?: string;
    childTemplates?: ExtendedTemplate[];
};

// Convert legacy CredentialTemplate to OBv3CredentialTemplate
const legacyToOBv3 = (legacy: CredentialTemplate, issuerName?: string, issuerImage?: string): OBv3CredentialTemplate => {
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
const obv3ToLegacy = (obv3: OBv3CredentialTemplate, existingTemplate?: CredentialTemplate): CredentialTemplate => {
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

// Single template editor using CredentialBuilder
interface TemplateEditorProps {
    template: ExtendedTemplate;
    branding: BrandingConfig | null;
    onChange: (template: ExtendedTemplate) => void;
    onDelete: () => void;
    isExpanded: boolean;
    onToggle: () => void;
    onTestIssue?: (credential: Record<string, unknown>) => Promise<{ success: boolean; error?: string; result?: unknown }>;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
    template,
    branding,
    onChange,
    onDelete,
    isExpanded,
    onToggle,
    onTestIssue,
}) => {
    // Initialize OBv3 template from legacy or existing
    const [obv3Template, setObv3Template] = useState<OBv3CredentialTemplate>(() => {
        if (template.obv3Template) {
            return template.obv3Template;
        }

        return legacyToOBv3(template, branding?.displayName, branding?.image);
    });

    const dynamicVars = useMemo(() => extractDynamicVariables(obv3Template), [obv3Template]);

    const handleTemplateChange = useCallback((newObv3: OBv3CredentialTemplate) => {
        setObv3Template(newObv3);

        // Convert back to legacy format and notify parent
        const legacyTemplate = obv3ToLegacy(newObv3, template) as ExtendedTemplate;
        legacyTemplate.obv3Template = newObv3;
        onChange(legacyTemplate);
    }, [template, onChange]);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 text-left">
                    <h4 className="font-medium text-gray-800">
                        {obv3Template.name.value || 'Untitled Template'}
                    </h4>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        {dynamicVars.length > 0 && (
                            <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-violet-500" />
                                {dynamicVars.length} dynamic fields
                            </span>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>

                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {/* Content - Full CredentialBuilder */}
            {isExpanded && (
                <div className="h-[600px] border-t border-gray-200">
                    <CredentialBuilder
                        template={obv3Template}
                        onChange={handleTemplateChange}
                        issuerName={branding?.displayName}
                        issuerImage={branding?.image}
                        onTestIssue={onTestIssue}
                    />
                </div>
            )}
        </div>
    );
};

export const TemplateBuilderStep: React.FC<TemplateBuilderStepProps> = ({
    templates,
    branding,
    project,
    onComplete,
    onBack,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const [localTemplates, setLocalTemplates] = useState<ExtendedTemplate[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);

    // Child template editing modal state
    const [editingChild, setEditingChild] = useState<{
        masterId: string;
        childId: string;
        template: OBv3CredentialTemplate;
    } | null>(null);

    // CSV Catalog Import state
    const [showImportModal, setShowImportModal] = useState(false);
    const [csvColumns, setCsvColumns] = useState<string[]>([]);
    const [csvAllRows, setCsvAllRows] = useState<Record<string, string>[]>([]);
    const [csvSampleRows, setCsvSampleRows] = useState<Record<string, string>[]>([]);
    const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
    const [issuanceFieldsIncluded, setIssuanceFieldsIncluded] = useState<Record<string, boolean>>({});
    const [templateNamePattern, setTemplateNamePattern] = useState('{{course_name}} Completion');
    const [defaultImage, setDefaultImage] = useState<string>('');
    const csvInputRef = useRef<HTMLInputElement>(null);

    // Filestack for default image upload
    const { handleFileSelect: handleImageSelect, isLoading: isUploadingImage } = useFilestack({
        onUpload: (url: string) => setDefaultImage(url),
        fileType: 'image/*',
    });

    const integrationId = project?.id;

    // Fetch existing templates (boosts) for this integration
    const fetchTemplates = useCallback(async () => {
        if (!integrationId) {
            setLocalTemplates((templates.length > 0 ? templates : []) as ExtendedTemplate[]);
            setIsLoading(false);
            return;
        }

        try {
            const wallet = await initWalletRef.current();
            const result = await wallet.invoke.getPaginatedBoosts({
                limit: 100,
                query: { meta: { integrationId } },
            });

            console.log('result', result);
            // First pass: fetch full boost data to get credentials
            const allTemplates: ExtendedTemplate[] = [];

            for (const boostRecord of (result?.records || [])) {
                const boostUri = (boostRecord as Record<string, unknown>).uri as string;

                try {
                    // Fetch full boost to get credential
                    const fullBoost = await wallet.invoke.getBoost(boostUri);
                    console.log('full boost', fullBoost);
                    const meta = fullBoost.meta as TemplateBoostMeta | undefined;
                    const templateConfig = meta?.templateConfig;
                    // The credential is in the 'boost' property
                    const credential = fullBoost.boost as Record<string, unknown> | undefined;

                    // Try to parse existing credential as OBv3 template
                    let obv3Template: OBv3CredentialTemplate | undefined;

                    if (credential) {
                        try {
                            obv3Template = jsonToTemplate(credential);
                        } catch (e) {
                            console.warn('Failed to parse credential as OBv3:', e);
                        }
                    }

                    // Get name/description from credential
                    const credentialName = credential?.name as string | undefined;
                    const credentialDesc = credential?.description as string | undefined;

                    allTemplates.push({
                        id: boostUri,
                        boostUri,
                        name: fullBoost.name || credentialName || 'Untitled Template',
                        description: credentialDesc || '',
                        achievementType: templateConfig?.achievementType || 'Course Completion',
                        fields: templateConfig?.fields || [],
                        isNew: false,
                        isDirty: false,
                        obv3Template,
                        isMasterTemplate: meta?.isMasterTemplate,
                    });
                } catch (e) {
                    console.warn('Failed to fetch boost:', boostUri, e);
                }
            }

            // Second pass: for master templates, fetch their children and collect child URIs
            const fetchedTemplates: ExtendedTemplate[] = [];
            const childUris = new Set<string>();

            // First, fetch all children for master templates and collect their URIs
            for (const template of allTemplates) {
                if (template.isMasterTemplate && template.boostUri) {
                    try {
                        // Fetch child boost URIs for this master
                        const childrenResult = await wallet.invoke.getBoostChildren(template.boostUri, { limit: 100 });
                        const childRecords = childrenResult?.records || [];

                        // Fetch full boost data for each child to get the credential
                        const children: ExtendedTemplate[] = [];

                        for (const childRecord of childRecords) {
                            const childUri = (childRecord as Record<string, unknown>).uri as string;
                            childUris.add(childUri);

                            try {
                                // Fetch full boost to get credential
                                const fullChild = await wallet.invoke.getBoost(childUri);
                                const childMeta = fullChild.meta as TemplateBoostMeta | undefined;
                                const childConfig = childMeta?.templateConfig;
                                // The credential is in the 'boost' property
                                const childCredential = fullChild.boost as Record<string, unknown> | undefined;

                                let childObv3Template: OBv3CredentialTemplate | undefined;

                                if (childCredential) {
                                    try {
                                        childObv3Template = jsonToTemplate(childCredential);
                                    } catch (e) {
                                        console.warn('Failed to parse child credential as OBv3:', e);
                                    }
                                }

                                // Get name/description from credential
                                const credentialName = childCredential?.name as string | undefined;
                                const credentialDesc = childCredential?.description as string | undefined;

                                children.push({
                                    id: childUri,
                                    boostUri: childUri,
                                    name: fullChild.name || credentialName || 'Untitled',
                                    description: credentialDesc || '',
                                    achievementType: childConfig?.achievementType || 'Course Completion',
                                    fields: childConfig?.fields || [],
                                    isNew: false,
                                    isDirty: false,
                                    obv3Template: childObv3Template,
                                    parentTemplateId: template.id,
                                });
                            } catch (e) {
                                console.warn('Failed to fetch child boost:', childUri, e);
                            }
                        }

                        fetchedTemplates.push({
                            ...template,
                            childTemplates: children,
                        });
                    } catch (e) {
                        console.warn('Failed to fetch children for master template:', e);
                        fetchedTemplates.push(template);
                    }
                }
            }

            // Now add non-master templates, but exclude any that are children of a master
            for (const template of allTemplates) {
                if (!template.isMasterTemplate && !childUris.has(template.boostUri || '')) {
                    fetchedTemplates.push(template);
                }
            }

            setLocalTemplates(fetchedTemplates.length > 0 ? fetchedTemplates : templates as ExtendedTemplate[]);
        } catch (err) {
            console.error('Failed to fetch templates:', err);
            setLocalTemplates((templates.length > 0 ? templates : []) as ExtendedTemplate[]);
        } finally {
            setIsLoading(false);
        }
    }, [integrationId, templates]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // Save a single template as a boost (create or update)
    const saveTemplateAsBoost = async (template: ExtendedTemplate): Promise<string | null> => {
        if (!integrationId) return null;

        try {
            const wallet = await initWalletRef.current();

            // Get OBv3 template or convert from legacy
            const obv3Template = template.obv3Template || legacyToOBv3(template, branding?.displayName, branding?.image);

            // Convert to JSON credential
            const credential = templateToJson(obv3Template);

            // Extract dynamic variables for storage
            const dynamicVars = extractDynamicVariables(obv3Template);

            const boostMeta: TemplateBoostMeta = {
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

            const boostMetadata = {
                name: template.name,
                description: template.description,
                type: template.achievementType,
                category: 'achievement',
                meta: boostMeta,
                status: 'PROVISIONAL'
            };

            // If updating existing boost, use updateBoost to preserve children
            if (template.boostUri) {
                await wallet.invoke.updateBoost(
                    template.boostUri,
                    boostMetadata as unknown as Parameters<typeof wallet.invoke.updateBoost>[1],
                    credential as Parameters<typeof wallet.invoke.updateBoost>[2]
                );

                return template.boostUri;
            }

            // Otherwise create a new boost
            const boostUri = await wallet.invoke.createBoost(
                credential as Parameters<typeof wallet.invoke.createBoost>[0],
                boostMetadata as unknown as Parameters<typeof wallet.invoke.createBoost>[1]
            );

            return boostUri;
        } catch (err) {
            console.error('Failed to save template as boost:', err);
            throw err;
        }
    };

    // Delete a boost
    const deleteBoost = async (boostUri: string) => {
        try {
            const wallet = await initWalletRef.current();
            await wallet.invoke.deleteBoost(boostUri);
        } catch (err) {
            console.error('Failed to delete boost:', err);
            throw err;
        }
    };

    // Save a child template as a child boost linked to parent
    const saveChildTemplateAsBoost = async (
        template: ExtendedTemplate, 
        parentBoostUri: string
    ): Promise<string | null> => {
        try {
            const wallet = await initWalletRef.current();

            // Use OBv3 template if available, otherwise convert
            const obv3Template = template.obv3Template || legacyToOBv3(
                template,
                branding?.displayName,
                branding?.image
            );

            const credential = templateToJson(obv3Template);

            const boostMeta: TemplateBoostMeta = {
                integrationId: integrationId!,
                templateConfig: {
                    version: TEMPLATE_META_VERSION,
                    achievementType: template.achievementType,
                    fields: template.fields,
                },
            };

            const boostMetadata = {
                name: template.name,
                description: template.description,
                type: template.achievementType,
                category: 'achievement',
                meta: boostMeta,
                status: 'PROVISIONAL',
            };

            // If updating existing child boost, use updateBoost
            if (template.boostUri) {
                await wallet.invoke.updateBoost(
                    template.boostUri,
                    boostMetadata as unknown as Parameters<typeof wallet.invoke.updateBoost>[1],
                    credential as Parameters<typeof wallet.invoke.updateBoost>[2]
                );

                return template.boostUri;
            }

            // Otherwise create as new child boost linked to parent
            const boostUri = await wallet.invoke.createChildBoost(
                parentBoostUri,
                credential as Parameters<typeof wallet.invoke.createChildBoost>[1],
                boostMetadata as unknown as Parameters<typeof wallet.invoke.createChildBoost>[2]
            );

            return boostUri;
        } catch (err) {
            console.error('Failed to save child template as boost:', err);
            throw err;
        }
    };

    // Save all templates
    const handleSaveAll = async () => {
        if (!integrationId) {
            presentToast('No project selected', { type: ToastTypeEnum.Error, hasDismissButton: true });
            return;
        }

        setIsSaving(true);

        try {
            // Delete pending deletes
            for (const uri of pendingDeletes) {
                await deleteBoost(uri);
            }

            setPendingDeletes([]);

            // Save all templates that are new or dirty
            const savedTemplates: CredentialTemplate[] = [];

            for (const template of localTemplates) {
                // Check if any children need saving (for master templates)
                const hasChildUpdates = template.isMasterTemplate && 
                    template.childTemplates?.some(c => c.isNew || c.isDirty || !c.boostUri);

                if (template.isNew || template.isDirty || !template.boostUri || hasChildUpdates) {
                    // Handle master templates with children
                    if (template.isMasterTemplate && template.childTemplates?.length) {
                        // First, save the master template
                        const parentBoostUri = await saveTemplateAsBoost(template);

                        if (parentBoostUri) {
                            // Save each child that needs saving
                            const savedChildren: ExtendedTemplate[] = [];

                            for (const child of template.childTemplates) {
                                // Only save children that are new, dirty, or don't have a boostUri
                                if (child.isNew || child.isDirty || !child.boostUri) {
                                    try {
                                        const childBoostUri = await saveChildTemplateAsBoost(child, parentBoostUri);

                                        savedChildren.push({
                                            ...child,
                                            id: childBoostUri || child.id,
                                            boostUri: childBoostUri || undefined,
                                            isNew: false,
                                            isDirty: false,
                                        });
                                    } catch (e) {
                                        console.error('Failed to save child boost:', e);
                                        // Keep the original child on error
                                        savedChildren.push(child);
                                    }
                                } else {
                                    // Child doesn't need saving, keep as-is
                                    savedChildren.push(child);
                                }
                            }

                            savedTemplates.push({
                                ...template,
                                id: parentBoostUri,
                                boostUri: parentBoostUri,
                                isNew: false,
                                isDirty: false,
                                childTemplates: savedChildren,
                            } as ExtendedTemplate);
                        }
                    } else {
                        // Regular template - save as standalone boost
                        const boostUri = await saveTemplateAsBoost(template);

                        savedTemplates.push({
                            ...template,
                            id: boostUri || template.id,
                            boostUri: boostUri || undefined,
                            isNew: false,
                            isDirty: false,
                        });
                    }
                } else {
                    savedTemplates.push(template);
                }
            }

            setLocalTemplates(savedTemplates as ExtendedTemplate[]);
            presentToast('Templates saved successfully!', { type: ToastTypeEnum.Success, hasDismissButton: true });
            onComplete(savedTemplates);
        } catch (err) {
            console.error('Failed to save templates:', err);
            presentToast('Failed to save templates', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTemplate = () => {
        const newTemplate: CredentialTemplate = {
            id: `template_${Date.now()}`,
            name: '',
            description: '',
            achievementType: 'Course Completion',
            fields: [...DEFAULT_FIELDS],
            isNew: true,
            isDirty: true,
        };

        setLocalTemplates([...localTemplates, newTemplate as ExtendedTemplate]);
        setExpandedId(newTemplate.id);
    };

    // Handle CSV file upload for catalog import
    const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const headers = results.meta.fields || [];
                const allRows = (results.data as Record<string, string>[]).filter(
                    row => Object.values(row).some(v => v?.trim())
                );

                setCsvColumns(headers);
                setCsvAllRows(allRows);
                setCsvSampleRows(allRows.slice(0, 3));

                // Auto-suggest mappings for each column (catalog-level fields)
                const suggestions: Record<string, string> = {};
                headers.forEach(col => {
                    suggestions[col] = suggestCatalogFieldMapping(col);
                });
                setColumnMappings(suggestions);

                // Initialize issuance fields with defaults
                const issuanceDefaults: Record<string, boolean> = {};
                ISSUANCE_FIELDS.forEach(field => {
                    issuanceDefaults[field.id] = field.defaultIncluded;
                });
                setIssuanceFieldsIncluded(issuanceDefaults);

                // Find the achievement name column to set pattern
                const nameCol = headers.find(h => suggestCatalogFieldMapping(h) === 'achievement_name');
                if (nameCol) {
                    const varName = nameCol.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                    setTemplateNamePattern(`{{${varName}}} Completion`);
                } else {
                    setTemplateNamePattern('Course Completion Certificate');
                }

                setShowImportModal(true);
            },
            error: (error) => {
                console.error('CSV parse error:', error);
                presentToast('Failed to parse CSV file', { type: ToastTypeEnum.Error, hasDismissButton: true });
            },
        });

        // Reset file input
        if (csvInputRef.current) {
            csvInputRef.current.value = '';
        }
    };

    // Generate the master template with dynamic variables for all catalog + issuance fields
    const generateMasterTemplate = (): ExtendedTemplate => {
        const template = getBlankTemplate();

        // Set issuer from branding
        if (branding?.displayName) {
            template.issuer.name = staticField(branding.displayName);
        }

        if (branding?.image) {
            template.issuer.image = staticField(branding.image);
        }

        // Process catalog-level mappings as DYNAMIC variables in master template
        // Uses dot-notation field IDs matching CATALOG_FIELD_OPTIONS
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
            // Add as custom fields with dynamic values in master template
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
        const issuanceFieldDefs = ISSUANCE_FIELDS.reduce((acc, f) => ({ ...acc, [f.id]: f }), {} as Record<string, typeof ISSUANCE_FIELDS[0]>);

        Object.entries(issuanceFieldsIncluded).forEach(([fieldId, included]) => {
            if (!included) return;

            const fieldDef = issuanceFieldDefs[fieldId];
            const isSystem = fieldDef?.type === 'system';

            switch (fieldId) {
                case 'recipient_name':
                    template.credentialSubject.name = dynamicField('recipient_name', '');
                    break;

                case 'recipient_did':
                    // System field - auto-injected at issuance
                    template.credentialSubject.id = systemField('Recipient DID (auto-injected)');
                    break;

                case 'recipient_email':
                    // System field - used for delivery, not stored in credential
                    // No action needed as it's handled at send time
                    break;

                case 'issue_date':
                    template.validFrom = dynamicField('issue_date', '');
                    break;

                case 'completion_date':
                    template.customFields.push({
                        id: 'custom_completion_date',
                        key: staticField('Completion Date'),
                        value: dynamicField('completion_date', ''),
                    });
                    break;

                case 'score':
                    template.customFields.push({
                        id: 'custom_score',
                        key: staticField('Score'),
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
    const generateChildBoostForCourse = (courseRow: Record<string, string>, parentId: string): ExtendedTemplate => {
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

        // Track aggregate fields (alignment, evidence, result, related, subject)
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

            // Handle OBv3 field mappings based on the dot-notation field IDs
            // Using startsWith for grouped fields, exact match for others
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
                // Credential-level fields
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
                    // Add as custom field since template doesn't have inLanguage
                    template.customFields.push({
                        id: 'credential_language',
                        key: staticField('Language'),
                        value: staticField(value),
                    });
                    break;

                // Achievement fields
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

                // Additional achievement fields stored as custom until types support them
                case 'achievement.humanCode':
                case 'achievement.fieldOfStudy':
                case 'achievement.specialization':
                case 'achievement.creditsAvailable':
                case 'achievement.tag':
                case 'achievement.version':
                case 'achievement.inLanguage': {
                    const fieldName = fieldType.replace('achievement.', '');
                    const displayName = fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();

                    template.customFields.push({
                        id: `achievement_${fieldName.toLowerCase()}`,
                        key: staticField(displayName),
                        value: staticField(value),
                    });
                    break;
                }

                // Custom extension field
                case 'custom': {
                    const displayName = columnName.replace(/[^a-zA-Z0-9]+/g, ' ').trim();

                    template.customFields.push({
                        id: `custom_${columnName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
                        key: staticField(displayName),
                        value: staticField(value),
                    });
                    break;
                }
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

        // Add result data as custom fields (OBv3 results are more complex, so we use custom for now)
        Object.entries(resultData).forEach(([key, value]) => {
            const displayName = key === 'value' ? 'Result' : key === 'status' ? 'Status' : key === 'achievedLevel' ? 'Achieved Level' : key;

            template.customFields.push({
                id: `result_${key}`,
                key: staticField(displayName),
                value: staticField(value),
            });
        });

        // Add subject data as custom fields (creditsEarned, activityStartDate, etc.)
        Object.entries(subjectData).forEach(([key, value]) => {
            const displayName = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, s => s.toUpperCase())
                .trim();

            template.customFields.push({
                id: `subject_${key.toLowerCase()}`,
                key: staticField(displayName),
                value: staticField(value),
            });
        });

        // Add related achievement data as custom fields
        Object.entries(relatedData).forEach(([key, value]) => {
            const displayName = key === 'id' ? 'Related Achievement' : `Related ${key.replace(/([A-Z])/g, ' $1').trim()}`;

            template.customFields.push({
                id: `related_${key.toLowerCase()}`,
                key: staticField(displayName),
                value: staticField(value),
            });
        });

        // Apply default image if no image was mapped from CSV
        if (defaultImage) {
            // Only set if not already set by CSV mapping
            if (!template.image?.value && !template.credentialSubject.achievement.image?.value) {
                template.credentialSubject.achievement.image = staticField(defaultImage);
            }
        }

        // Default achievement type to "Course" for course catalog imports (OBv3 spec)
        if (!achievementTypeSet) {
            template.credentialSubject.achievement.achievementType = staticField('Course');
        }

        // Add issuance-level fields based on their type (dynamic or system)
        Object.entries(issuanceFieldsIncluded).forEach(([fieldId, included]) => {
            if (!included) return;

            switch (fieldId) {
                case 'recipient_name':
                    template.credentialSubject.name = dynamicField('recipient_name', '');
                    break;

                case 'recipient_did':
                    // System field - auto-injected at issuance
                    template.credentialSubject.id = systemField('Recipient DID (auto-injected)');
                    break;

                case 'recipient_email':
                    // System field - used for delivery, not stored in credential
                    // No action needed as it's handled at send time
                    break;

                case 'issue_date':
                    template.validFrom = dynamicField('issue_date', '');
                    break;

                case 'completion_date':
                    template.customFields.push({
                        id: 'custom_completion_date',
                        key: staticField('Completion Date'),
                        value: dynamicField('completion_date', ''),
                    });
                    break;

                case 'score':
                    template.customFields.push({
                        id: 'custom_score',
                        key: staticField('Score'),
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

    // Handle import confirmation - generate master template + child boosts
    const handleImportConfirm = () => {
        // Generate master template first
        const masterTemplate = generateMasterTemplate();

        // Generate child boosts for each course, linked to master
        const childTemplates = csvAllRows.map(row => 
            generateChildBoostForCourse(row, masterTemplate.id)
        );

        // Attach children to master for UI display
        masterTemplate.childTemplates = childTemplates;

        // Add master template (children are nested within it for display)
        setLocalTemplates([...localTemplates, masterTemplate]);
        setExpandedId(masterTemplate.id);
        setShowImportModal(false);
        
        presentToast(`Created master template + ${childTemplates.length} course boosts!`, { 
            type: ToastTypeEnum.Success, 
            hasDismissButton: true 
        });

        // Reset import state
        setCsvColumns([]);
        setCsvAllRows([]);
        setCsvSampleRows([]);
        setColumnMappings({});
        setIssuanceFieldsIncluded({});
        setDefaultImage('');
    };

    // Close import modal
    const handleImportCancel = () => {
        setShowImportModal(false);
        setCsvColumns([]);
        setCsvSampleRows([]);
        setColumnMappings({});
        setDefaultImage('');
    };

    const handleUpdateTemplate = (id: string, updated: ExtendedTemplate) => {
        setLocalTemplates(localTemplates.map(t =>
            t.id === id ? { ...updated, isDirty: true } as ExtendedTemplate : t
        ));
    };

    const handleDeleteTemplate = (id: string) => {
        const template = localTemplates.find(t => t.id === id);

        if (template) {
            const urisToDelete: string[] = [];

            // For master templates, queue children for deletion first
            if (template.isMasterTemplate && template.childTemplates?.length) {
                for (const child of template.childTemplates) {
                    if (child.boostUri) {
                        urisToDelete.push(child.boostUri);
                    }
                }
            }

            // Then queue the master/parent template itself
            if (template.boostUri) {
                urisToDelete.push(template.boostUri);
            }

            if (urisToDelete.length > 0) {
                setPendingDeletes([...pendingDeletes, ...urisToDelete]);
            }
        }

        setLocalTemplates(localTemplates.filter(t => t.id !== id));

        if (expandedId === id) setExpandedId(null);
    };

    // Open edit modal for a child template
    const handleEditChild = (masterId: string, child: ExtendedTemplate) => {
        // Get or create OBv3 template for the child
        const obv3Template = child.obv3Template || legacyToOBv3(child, branding?.displayName, branding?.image);

        setEditingChild({
            masterId,
            childId: child.id,
            template: JSON.parse(JSON.stringify(obv3Template)), // Deep clone
        });
    };

    // Save edited child template
    const handleSaveChildEdit = () => {
        if (!editingChild) return;

        setLocalTemplates(prev => prev.map(master => {
            if (master.id !== editingChild.masterId) return master;

            const updatedChildren = master.childTemplates?.map(child => {
                if (child.id !== editingChild.childId) return child;

                // Convert OBv3 back to legacy format
                const updatedChild = obv3ToLegacy(editingChild.template, child) as ExtendedTemplate;
                updatedChild.obv3Template = editingChild.template;
                updatedChild.isDirty = true;

                return updatedChild;
            }) as ExtendedTemplate[] | undefined;

            return {
                ...master,
                childTemplates: updatedChildren,
                isDirty: true,
            } as ExtendedTemplate;
        }));

        setEditingChild(null);
        presentToast('Child template updated', { type: ToastTypeEnum.Success });
    };

    // Cancel child edit
    const handleCancelChildEdit = () => {
        setEditingChild(null);
    };

    // Update the template being edited in the modal
    const handleChildTemplateChange = (newTemplate: OBv3CredentialTemplate) => {
        if (!editingChild) return;

        setEditingChild({
            ...editingChild,
            template: newTemplate,
        });
    };

    // Test issue handler - tests if a credential can be issued
    const handleTestIssue = useCallback(async (credential: Record<string, unknown>): Promise<{ success: boolean; error?: string; result?: unknown }> => {
        try {
            const wallet = await initWalletRef.current();

            // Replace dynamic variables with sample values
            const replaceDynamicVariables = (obj: unknown): unknown => {
                if (typeof obj === 'string') {
                    // Replace {{variable_name}} with sample values
                    return obj.replace(/\{\{(\w+)\}\}/g, (_match, varName) => {
                        // Special handling for date fields - use actual ISO dates
                        const lowerVar = varName.toLowerCase();
                        if (lowerVar.includes('date') || lowerVar.includes('time')) {
                            return new Date().toISOString();
                        }

                        // Use humanized variable name as sample value for other fields
                        const humanized = varName.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                        return `[Sample ${humanized}]`;
                    });
                }

                if (Array.isArray(obj)) {
                    return obj.map(replaceDynamicVariables);
                }

                if (obj && typeof obj === 'object') {
                    const result: Record<string, unknown> = {};
                    for (const [key, value] of Object.entries(obj)) {
                        result[key] = replaceDynamicVariables(value);
                    }
                    return result;
                }

                return obj;
            };

            const renderedCredential = replaceDynamicVariables(credential) as Record<string, unknown>;

            // Ensure required array fields are present and non-empty
            const contexts = renderedCredential['@context'];
            const types = renderedCredential['type'];

            const testCredential = {
                ...renderedCredential,
                '@context': Array.isArray(contexts) && contexts.length > 0 
                    ? contexts 
                    : ['https://www.w3.org/ns/credentials/v2'],
                type: Array.isArray(types) && types.length > 0 
                    ? types 
                    : ['VerifiableCredential'],
                issuer: wallet.id.did(),
                validFrom: new Date().toISOString(),
                credentialSubject: {
                    ...(renderedCredential.credentialSubject as Record<string, unknown> || {}),
                    id: wallet.id.did(),
                },
            };

            console.log('Test issuing credential:', testCredential);

            const result = await wallet.invoke.issueCredential?.(testCredential as Parameters<typeof wallet.invoke.issueCredential>[0]);

            if (result) {
                return { success: true, result };
            } else {
                return { success: false, error: 'issueCredential returned undefined' };
            }
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    }, []);

    const hasUnsavedChanges = localTemplates.some(t => t.isNew || t.isDirty) || pendingDeletes.length > 0;
    const canProceed = localTemplates.length > 0 && localTemplates.every(t => t.name.trim());

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Info */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <FileStack className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

                <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Create Credential Templates</p>
                    <p>
                        Templates define the structure of credentials you'll issue. Each template is saved 
                        as a reusable boost that can be issued to recipients.
                    </p>
                </div>
            </div>

            {/* Unsaved Changes Warning */}
            {hasUnsavedChanges && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>You have unsaved changes. Click "Save & Continue" to save your templates.</span>
                </div>
            )}

            {/* Templates */}
            <div className="space-y-4">
                {localTemplates.map((template) => (
                    <div key={template.id}>
                        {/* Master Template with Children */}
                        {template.isMasterTemplate ? (
                            <div className="border-2 border-violet-200 rounded-xl overflow-hidden">
                                {/* Master Template Header */}
                                <div 
                                    className="flex items-center gap-3 p-4 bg-violet-50 cursor-pointer"
                                    onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                                >
                                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                                        <FileStack className="w-5 h-5 text-violet-600" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-800">{template.name}</span>
                                            <span className="px-2 py-0.5 bg-violet-200 text-violet-700 text-xs font-medium rounded-full">
                                                Master Template
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-500">
                                            {template.childTemplates?.length || 0} course boosts • {template.fields?.length || 0} dynamic fields
                                        </p>
                                    </div>

                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                                        expandedId === template.id ? 'rotate-180' : ''
                                    }`} />
                                </div>

                                {/* Expanded: Show Children */}
                                {expandedId === template.id && (
                                    <div className="p-4 bg-white border-t border-violet-200">
                                        {/* Master Template Info */}
                                        <div className="mb-4 p-3 bg-violet-50 rounded-lg">
                                            <p className="text-sm text-violet-800">
                                                <strong>Dynamic variables at issuance:</strong>{' '}
                                                {template.fields?.map(f => `{{${f.variableName}}}`).join(', ') || 'None'}
                                            </p>
                                        </div>

                                        {/* Child Templates List */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                                <span className="font-medium">Course Boosts ({template.childTemplates?.length})</span>
                                            </div>

                                            <div className="max-h-64 overflow-y-auto space-y-2">
                                                {template.childTemplates?.map((child, idx) => (
                                                    <div 
                                                        key={child.id}
                                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 group"
                                                    >
                                                        <span className="w-6 h-6 bg-gray-200 rounded text-xs flex items-center justify-center text-gray-600 font-medium">
                                                            {idx + 1}
                                                        </span>

                                                        <Award className="w-4 h-4 text-cyan-500" />

                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-800 truncate">{child.name}</p>
                                                            <p className="text-xs text-gray-500 truncate">{child.description || 'No description'}</p>
                                                        </div>

                                                        <span className="text-xs text-gray-400">
                                                            {child.fields?.length || 0} fields
                                                        </span>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditChild(template.id, child as ExtendedTemplate);
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Customize this boost"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Delete Master Template Button */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() => handleDeleteTemplate(template.id)}
                                                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete Master Template & All Course Boosts
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Regular Template */
                            <TemplateEditor
                                template={template}
                                branding={branding}
                                onChange={(updated) => handleUpdateTemplate(template.id, updated)}
                                onDelete={() => handleDeleteTemplate(template.id)}
                                isExpanded={expandedId === template.id}
                                onToggle={() => setExpandedId(expandedId === template.id ? null : template.id)}
                                onTestIssue={handleTestIssue}
                            />
                        )}
                    </div>
                ))}

                {/* Add Template Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleAddTemplate}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors disabled:opacity-50"
                    >
                        <Plus className="w-5 h-5" />
                        Add Blank Template
                    </button>

                    <label className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-colors cursor-pointer">
                        <Upload className="w-5 h-5" />
                        Import from Catalog
                        <input
                            ref={csvInputRef}
                            type="file"
                            accept=".csv,.tsv,.txt"
                            onChange={handleCsvUpload}
                            className="hidden"
                        />
                    </label>
                </div>

                <p className="text-xs text-center text-gray-500">
                    Upload a CSV of your courses to auto-generate a template with dynamic fields
                </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={onBack}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={handleSaveAll}
                    disabled={!canProceed || isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save & Continue
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>

            {/* Import from Catalog Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-800">Import Course Catalog</h3>
                                    <p className="text-sm text-gray-500">
                                        {csvAllRows.length} courses found • {csvColumns.length} columns
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleImportCancel}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-auto p-4 space-y-6">
                            {/* Explanation */}
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                                <p className="font-medium mb-1">How this works:</p>
                                <p>
                                    We'll create <strong>{csvAllRows.length} separate boosts</strong> — one for each course. 
                                    Course data (name, credits, etc.) will be <strong>baked in</strong>. 
                                    Recipient data (name, date) stays <strong>dynamic</strong> for issuance.
                                </p>
                            </div>

                            {/* Default Image Section */}
                            <div>
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Default Credential Image
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        This image will be used for all credentials unless overridden by a CSV column
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    {defaultImage ? (
                                        <div className="relative group">
                                            <img
                                                src={defaultImage}
                                                alt="Default credential"
                                                className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                                            />

                                            <button
                                                onClick={() => setDefaultImage('')}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                                            <ImageIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}

                                    <button
                                        onClick={handleImageSelect}
                                        disabled={isUploadingImage}
                                        className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        {isUploadingImage ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                {defaultImage ? 'Change Image' : 'Upload Image'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Catalog Fields Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Catalog Fields (Baked into each boost)
                                        </label>
                                        <p className="text-xs text-gray-500">These values come from your CSV</p>
                                    </div>

                                    <span className="text-xs text-gray-500">
                                        {Object.values(columnMappings).filter(v => v !== 'skip').length} mapped
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {csvColumns.map(column => {
                                        const mapping = columnMappings[column] || 'skip';
                                        const sampleValue = csvSampleRows[0]?.[column] || '';

                                        return (
                                            <div
                                                key={column}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                                    mapping === 'skip'
                                                        ? 'border-gray-200 bg-gray-50'
                                                        : 'border-emerald-200 bg-emerald-50'
                                                }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-800 truncate">{column}</div>

                                                    {sampleValue && (
                                                        <div className="text-xs text-gray-500 truncate">
                                                            e.g., "{sampleValue}"
                                                        </div>
                                                    )}
                                                </div>

                                                <ArrowDown className={`w-4 h-4 flex-shrink-0 ${
                                                    mapping === 'skip' ? 'text-gray-300' : 'text-emerald-500'
                                                }`} />

                                                <select
                                                    value={mapping}
                                                    onChange={(e) => setColumnMappings(prev => ({
                                                        ...prev,
                                                        [column]: e.target.value
                                                    }))}
                                                    className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                                        mapping === 'skip'
                                                            ? 'border-gray-300 bg-white'
                                                            : 'border-emerald-300 bg-white'
                                                    }`}
                                                >
                                                    {/* Skip option */}
                                                    <option value="skip">— Skip this column —</option>

                                                    {/* Group options by category */}
                                                    {Object.entries(FIELD_GROUPS)
                                                        .filter(([key]) => key !== 'skip')
                                                        .map(([groupKey, groupLabel]) => {
                                                            const groupOptions = CATALOG_FIELD_OPTIONS.filter(o => o.group === groupKey);

                                                            if (groupOptions.length === 0) return null;

                                                            return (
                                                                <optgroup key={groupKey} label={groupLabel}>
                                                                    {groupOptions.map(option => (
                                                                        <option key={option.id} value={option.id}>{option.label}</option>
                                                                    ))}
                                                                </optgroup>
                                                            );
                                                        })}
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Issuance Fields Section */}
                            <div>
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Issuance Fields
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        <span className="text-violet-600 font-medium">Dynamic</span> = you provide at issuance time • 
                                        <span className="text-cyan-600 font-medium ml-1">System</span> = auto-injected
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {ISSUANCE_FIELDS.map(field => {
                                        const isIncluded = issuanceFieldsIncluded[field.id] ?? field.defaultIncluded;
                                        const isSystem = field.type === 'system';

                                        return (
                                            <label
                                                key={field.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                                    isIncluded
                                                        ? isSystem
                                                            ? 'border-cyan-200 bg-cyan-50'
                                                            : 'border-violet-200 bg-violet-50'
                                                        : 'border-gray-200 bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isIncluded}
                                                    onChange={(e) => setIssuanceFieldsIncluded(prev => ({
                                                        ...prev,
                                                        [field.id]: e.target.checked
                                                    }))}
                                                    className={`w-4 h-4 rounded border-gray-300 focus:ring-2 ${
                                                        isSystem 
                                                            ? 'text-cyan-500 focus:ring-cyan-500' 
                                                            : 'text-violet-500 focus:ring-violet-500'
                                                    }`}
                                                />

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-800 text-sm">{field.label}</span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                                            isSystem 
                                                                ? 'bg-cyan-100 text-cyan-700' 
                                                                : 'bg-violet-100 text-violet-700'
                                                        }`}>
                                                            {isSystem ? 'System' : 'Dynamic'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">{field.description}</div>
                                                </div>

                                                {isIncluded && !isSystem && (
                                                    <code className="text-xs text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">
                                                        {`{{${field.id}}}`}
                                                    </code>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    Preview: First 3 Boosts to Create
                                </h4>

                                <div className="space-y-2">
                                    {csvSampleRows.slice(0, 3).map((row, idx) => {
                                        const nameCol = Object.entries(columnMappings).find(([_, type]) => type === 'achievement.name')?.[0];
                                        const name = nameCol ? row[nameCol] : `Course ${idx + 1}`;

                                        return (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                                <Award className="w-4 h-4 text-cyan-500" />
                                                <span className="font-medium text-gray-800">{name} Completion</span>
                                                <span className="text-xs text-gray-500">
                                                    + {Object.values(issuanceFieldsIncluded).filter(Boolean).length} dynamic fields
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {csvAllRows.length > 3 && (
                                        <div className="text-xs text-gray-500 text-center py-1">
                                            ...and {csvAllRows.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                Will create <strong>{csvAllRows.length}</strong> course boosts
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleImportCancel}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleImportConfirm}
                                    disabled={Object.values(columnMappings).every(v => v === 'skip')}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Check className="w-4 h-4" />
                                    Create {csvAllRows.length} Boosts
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Child Template Modal */}
            {editingChild && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                                    <Pencil className="w-5 h-5 text-violet-600" />
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-800">
                                        Customize Boost
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {editingChild.template.name?.value || 'Untitled'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleCancelChildEdit}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body - CredentialBuilder */}
                        <div className="flex-1 min-h-0 overflow-auto" style={{ height: '600px' }}>
                            <CredentialBuilder
                                template={editingChild.template}
                                onChange={handleChildTemplateChange}
                                issuerName={branding?.displayName}
                                issuerImage={branding?.image}
                                onTestIssue={handleTestIssue}
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={handleCancelChildEdit}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSaveChildEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
