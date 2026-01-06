/**
 * TemplateBuilderStep - Interactive OBv3 credential template builder
 * 
 * Uses the CredentialBuilder component for a full-featured, schema-driven
 * credential template editor with live JSON preview and bidirectional editing.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

            const fetchedTemplates: ExtendedTemplate[] = (result?.records || []).map((boost: Record<string, unknown>) => {
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
                };
            });

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
                    const boostUri = await saveTemplateAsBoost(template);

                    savedTemplates.push({
                        ...template,
                        id: boostUri || template.id,
                        boostUri: boostUri || undefined,
                        isNew: false,
                        isDirty: false,
                    });
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
                    <TemplateEditor
                        key={template.id}
                        template={template}
                        branding={branding}
                        onChange={(updated) => handleUpdateTemplate(template.id, updated)}
                        onDelete={() => handleDeleteTemplate(template.id)}
                        isExpanded={expandedId === template.id}
                        onToggle={() => setExpandedId(expandedId === template.id ? null : template.id)}
                    />
                ))}

                {/* Add Template Button */}
                <button
                    onClick={handleAddTemplate}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors disabled:opacity-50"
                >
                    <Plus className="w-5 h-5" />
                    Add Credential Template
                </button>
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
        </div>
    );
};
