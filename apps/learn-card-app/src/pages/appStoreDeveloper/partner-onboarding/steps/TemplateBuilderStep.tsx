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
} from 'lucide-react';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

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
} from '../components/CredentialBuilder';

const TEMPLATE_META_VERSION = '2.0.0';

// Default fields for new templates
const DEFAULT_FIELDS = [
    { id: 'recipient_name', name: 'Recipient Name', type: 'text' as const, required: true, variableName: 'recipient_name' },
    { id: 'issue_date', name: 'Issue Date', type: 'date' as const, required: true, variableName: 'issue_date' },
];

// Credential field options for mapping CSV columns (catalog-level = baked into boost)
const CATALOG_FIELD_OPTIONS = [
    { id: 'skip', label: '— Skip this column —', description: 'Do not include in credential' },
    { id: 'achievement_name', label: 'Achievement Name', description: 'Name of the credential (e.g., course name)', required: true },
    { id: 'achievement_description', label: 'Achievement Description', description: 'Description of the achievement' },
    { id: 'credits', label: 'Credits/Hours', description: 'Number of credits or hours earned' },
    { id: 'instructor', label: 'Instructor Name', description: 'Name of the instructor' },
    { id: 'department', label: 'Department', description: 'Academic department or category' },
    { id: 'course_id', label: 'Course ID', description: 'Unique identifier for the course' },
    { id: 'custom', label: 'Custom Field', description: 'Include as a custom field' },
];

// Issuance-level fields (dynamic at credential issue time, not from CSV)
const ISSUANCE_FIELDS = [
    { id: 'recipient_name', label: 'Recipient Name', description: 'Name of the credential recipient', required: true, defaultIncluded: true },
    { id: 'recipient_email', label: 'Recipient Email', description: 'Email for sending the credential', required: true, defaultIncluded: true },
    { id: 'issue_date', label: 'Issue Date', description: 'When the credential was issued', required: false, defaultIncluded: true },
    { id: 'completion_date', label: 'Completion Date', description: 'When the course was completed', required: false, defaultIncluded: false },
    { id: 'score', label: 'Score/Grade', description: 'Score or grade achieved', required: false, defaultIncluded: false },
    { id: 'expiration_date', label: 'Expiration Date', description: 'When the credential expires', required: false, defaultIncluded: false },
];

// Smart mapping suggestions for catalog columns (baked into each boost)
const suggestCatalogFieldMapping = (columnName: string): string => {
    const lower = columnName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Course name / title → Achievement Name
    if (lower.includes('coursename') || lower.includes('title') || (lower.includes('name') && !lower.includes('student') && !lower.includes('instructor'))) {
        return 'achievement_name';
    }

    // Description
    if (lower.includes('description') || lower.includes('desc') || lower.includes('summary')) {
        return 'achievement_description';
    }

    // Credits/Hours
    if (lower.includes('credit') || lower.includes('hour') || lower.includes('ceu') || lower.includes('pdu')) {
        return 'credits';
    }

    // Instructor
    if (lower.includes('instructor') || lower.includes('teacher') || lower.includes('facilitator') || lower.includes('professor')) {
        return 'instructor';
    }

    // Department
    if (lower.includes('department') || lower.includes('dept') || lower.includes('subject') || lower.includes('category')) {
        return 'department';
    }

    // Course ID
    if (lower.includes('courseid') || lower.includes('id') || lower.includes('code') || lower.includes('number')) {
        return 'course_id';
    }

    // Skip fields that are clearly issuance-level or not useful
    if (lower.includes('student') || lower.includes('email') || lower.includes('enrolled') || 
        lower.includes('capacity') || lower.includes('room') || lower.includes('schedule') ||
        lower.includes('seat') || lower.includes('available') || lower.includes('prerequisite')) {
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
            template.issuanceDate = dynamicField('issue_date', '');
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
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
    template,
    branding,
    onChange,
    onDelete,
    isExpanded,
    onToggle,
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

    // CSV Catalog Import state
    const [showImportModal, setShowImportModal] = useState(false);
    const [csvColumns, setCsvColumns] = useState<string[]>([]);
    const [csvAllRows, setCsvAllRows] = useState<Record<string, string>[]>([]);
    const [csvSampleRows, setCsvSampleRows] = useState<Record<string, string>[]>([]);
    const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
    const [issuanceFieldsIncluded, setIssuanceFieldsIncluded] = useState<Record<string, boolean>>({});
    const [templateNamePattern, setTemplateNamePattern] = useState('{{course_name}} Completion');
    const csvInputRef = useRef<HTMLInputElement>(null);

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

            // First pass: convert all boosts to templates
            const allTemplates: ExtendedTemplate[] = (result?.records || []).map((boost: Record<string, unknown>) => {
                const meta = boost.meta as TemplateBoostMeta | undefined;
                const templateConfig = meta?.templateConfig;
                const credential = boost.credential as Record<string, unknown> | undefined;

                // Try to parse existing credential as OBv3 template
                let obv3Template: OBv3CredentialTemplate | undefined;

                if (credential) {
                    try {
                        obv3Template = jsonToTemplate(credential);
                    } catch (e) {
                        console.warn('Failed to parse credential as OBv3:', e);
                    }
                }

                return {
                    id: boost.uri as string,
                    boostUri: boost.uri as string,
                    name: (boost.name as string) || 'Untitled Template',
                    description: (boost.description as string) || '',
                    achievementType: templateConfig?.achievementType || 'Course Completion',
                    fields: templateConfig?.fields || [],
                    imageUrl: boost.image as string | undefined,
                    isNew: false,
                    isDirty: false,
                    obv3Template,
                    isMasterTemplate: meta?.isMasterTemplate,
                };
            });

            // Second pass: for master templates, fetch their children and collect child URIs
            const fetchedTemplates: ExtendedTemplate[] = [];
            const childUris = new Set<string>();

            // First, fetch all children for master templates and collect their URIs
            for (const template of allTemplates) {
                if (template.isMasterTemplate && template.boostUri) {
                    try {
                        // Fetch child boosts for this master
                        const childrenResult = await wallet.invoke.getBoostChildren(template.boostUri, { limit: 100 });
                        const children: ExtendedTemplate[] = (childrenResult?.records || []).map((child: Record<string, unknown>) => {
                            const childMeta = child.meta as TemplateBoostMeta | undefined;
                            const childConfig = childMeta?.templateConfig;
                            const childCredential = child.credential as Record<string, unknown> | undefined;
                            const childUri = child.uri as string;

                            // Track this URI as a child so we exclude it from top-level
                            childUris.add(childUri);

                            let childObv3Template: OBv3CredentialTemplate | undefined;

                            if (childCredential) {
                                try {
                                    childObv3Template = jsonToTemplate(childCredential);
                                } catch (e) {
                                    console.warn('Failed to parse child credential as OBv3:', e);
                                }
                            }

                            return {
                                id: childUri,
                                boostUri: childUri,
                                name: (child.name as string) || 'Untitled',
                                description: (child.description as string) || '',
                                achievementType: childConfig?.achievementType || 'Course Completion',
                                fields: childConfig?.fields || [],
                                isNew: false,
                                isDirty: false,
                                obv3Template: childObv3Template,
                                parentTemplateId: template.id,
                            };
                        });

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

            // If updating existing boost, delete and recreate (updateBoost doesn't support credential updates)
            if (template.boostUri) {
                try {
                    await wallet.invoke.deleteBoost(template.boostUri);
                } catch (e) {
                    console.warn('Failed to delete old boost, creating new:', e);
                }
            }

            // Otherwise create a new boost
            const boostMetadata = {
                name: template.name,
                type: template.achievementType,
                category: 'achievement',
                meta: boostMeta,
                defaultPermissions: {
                    canIssue: true,
                },
            };

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
                type: template.achievementType,
                category: 'achievement',
                meta: boostMeta,
                defaultPermissions: {
                    canIssue: true,
                },
            };

            // Create as child boost linked to parent
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
                if (template.isNew || template.isDirty || !template.boostUri) {
                    // Handle master templates with children
                    if (template.isMasterTemplate && template.childTemplates?.length) {
                        // First, save the master template
                        const parentBoostUri = await saveTemplateAsBoost(template);

                        if (parentBoostUri) {
                            // Then save each child as a child boost
                            const savedChildren: ExtendedTemplate[] = [];

                            for (const child of template.childTemplates) {
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
                                    // Continue with other children
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
        Object.entries(columnMappings).forEach(([columnName, fieldType]) => {
            if (fieldType === 'skip') return;

            const varName = columnName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

            switch (fieldType) {
                case 'achievement_name':
                    template.credentialSubject.achievement.name = dynamicField(varName, '');
                    break;

                case 'achievement_description':
                    template.credentialSubject.achievement.description = dynamicField(varName, '');
                    break;

                case 'course_id':
                case 'credits':
                case 'instructor':
                case 'department':
                case 'custom': {
                    const displayName = columnName.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
                    template.customFields.push({
                        id: `custom_${varName}`,
                        key: staticField(displayName),
                        value: dynamicField(varName, ''),
                    });
                    break;
                }
            }
        });

        // Add issuance-level fields as DYNAMIC variables
        Object.entries(issuanceFieldsIncluded).forEach(([fieldId, included]) => {
            if (!included) return;

            switch (fieldId) {
                case 'recipient_name':
                    template.credentialSubject.name = dynamicField('recipient_name', '');
                    break;

                case 'issue_date':
                    template.issuanceDate = dynamicField('issue_date', '');
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
                    template.expirationDate = dynamicField('expiration_date', '');
                    break;
            }
        });

        template.name = dynamicField('course_name', 'Course Completion');
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

        // Process catalog-level mappings - BAKE IN the actual values from CSV
        Object.entries(columnMappings).forEach(([columnName, fieldType]) => {
            if (fieldType === 'skip') return;

            const value = courseRow[columnName] || '';
            if (!value.trim()) return;

            switch (fieldType) {
                case 'achievement_name':
                    template.credentialSubject.achievement.name = staticField(value);
                    boostName = value;
                    break;

                case 'achievement_description':
                    template.credentialSubject.achievement.description = staticField(value);
                    boostDescription = value;
                    break;

                case 'course_id':
                case 'credits':
                case 'instructor':
                case 'department':
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

        // Add issuance-level fields as DYNAMIC (Mustache variables)
        Object.entries(issuanceFieldsIncluded).forEach(([fieldId, included]) => {
            if (!included) return;

            switch (fieldId) {
                case 'recipient_name':
                    template.credentialSubject.name = dynamicField('recipient_name', '');
                    break;

                case 'issue_date':
                    template.issuanceDate = dynamicField('issue_date', '');
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
                    template.expirationDate = dynamicField('expiration_date', '');
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
    };

    // Close import modal
    const handleImportCancel = () => {
        setShowImportModal(false);
        setCsvColumns([]);
        setCsvSampleRows([]);
        setColumnMappings({});
    };

    const handleUpdateTemplate = (id: string, updated: ExtendedTemplate) => {
        setLocalTemplates(localTemplates.map(t =>
            t.id === id ? { ...updated, isDirty: true } as ExtendedTemplate : t
        ));
    };

    const handleDeleteTemplate = (id: string) => {
        const template = localTemplates.find(t => t.id === id);

        // If it has a boostUri, queue it for deletion on save
        if (template?.boostUri) {
            setPendingDeletes([...pendingDeletes, template.boostUri]);
        }

        setLocalTemplates(localTemplates.filter(t => t.id !== id));

        if (expandedId === id) setExpandedId(null);
    };

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
                                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
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
                                                    {CATALOG_FIELD_OPTIONS.map((option: { id: string; label: string }) => (
                                                        <option key={option.id} value={option.id}>
                                                            {option.label}
                                                        </option>
                                                    ))}
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
                                        Issuance Fields (Dynamic at credential time)
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        These fields stay as variables — you'll provide values when issuing credentials
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {ISSUANCE_FIELDS.map(field => {
                                        const isIncluded = issuanceFieldsIncluded[field.id] ?? field.defaultIncluded;

                                        return (
                                            <label
                                                key={field.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                                    isIncluded
                                                        ? 'border-violet-200 bg-violet-50'
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
                                                    className="w-4 h-4 rounded border-gray-300 text-violet-500 focus:ring-violet-500"
                                                />

                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-800 text-sm">{field.label}</div>
                                                    <div className="text-xs text-gray-500">{field.description}</div>
                                                </div>

                                                {isIncluded && (
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
                                        const nameCol = Object.entries(columnMappings).find(([_, type]) => type === 'achievement_name')?.[0];
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
        </div>
    );
};
