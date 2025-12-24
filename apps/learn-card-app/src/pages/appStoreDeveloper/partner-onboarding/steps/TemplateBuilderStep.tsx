import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FileStack,
    Plus,
    Trash2,
    ArrowRight,
    ArrowLeft,
    GripVertical,
    Award,
    Calendar,
    Hash,
    Type,
    Link as LinkIcon,
    Mail,
    ChevronDown,
    ChevronUp,
    Loader2,
    Save,
    X,
    AlertCircle,
} from 'lucide-react';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import { CredentialTemplate, CredentialField, BrandingConfig, TemplateBoostMeta, PartnerProject } from '../types';

const TEMPLATE_META_VERSION = '1.0.0';

interface TemplateBuilderStepProps {
    templates: CredentialTemplate[];
    branding: BrandingConfig | null;
    project: PartnerProject | null;
    onComplete: (templates: CredentialTemplate[]) => void;
    onBack: () => void;
}

const FIELD_TYPES = [
    { value: 'text', label: 'Text', icon: Type },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'number', label: 'Number', icon: Hash },
    { value: 'url', label: 'URL', icon: LinkIcon },
    { value: 'email', label: 'Email', icon: Mail },
] as const;

const ACHIEVEMENT_TYPES = [
    'Course Completion',
    'Certificate',
    'Badge',
    'Skill',
    'Competency',
    'License',
    'Certification',
    'Other',
];

const DEFAULT_FIELDS: CredentialField[] = [
    { id: 'recipient_name', name: 'Recipient Name', type: 'text', required: true },
    { id: 'issue_date', name: 'Issue Date', type: 'date', required: true },
];

interface TemplateEditorProps {
    template: CredentialTemplate;
    branding: BrandingConfig | null;
    onChange: (template: CredentialTemplate) => void;
    onDelete: () => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
    template,
    branding,
    onChange,
    onDelete,
    isExpanded,
    onToggleExpand,
}) => {
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState<CredentialField['type']>('text');

    const handleAddField = () => {
        if (!newFieldName.trim()) return;

        const newField: CredentialField = {
            id: `field_${Date.now()}`,
            name: newFieldName.trim(),
            type: newFieldType,
            required: false,
        };

        onChange({
            ...template,
            fields: [...template.fields, newField],
        });

        setNewFieldName('');
        setNewFieldType('text');
    };

    const handleRemoveField = (fieldId: string) => {
        onChange({
            ...template,
            fields: template.fields.filter(f => f.id !== fieldId),
        });
    };

    const handleToggleRequired = (fieldId: string) => {
        onChange({
            ...template,
            fields: template.fields.map(f =>
                f.id === fieldId ? { ...f, required: !f.required } : f
            ),
        });
    };

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer"
                onClick={onToggleExpand}
            >
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: branding?.primaryColor || '#3B82F6' }}
                >
                    <Award className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{template.name || 'Untitled Template'}</h4>
                    <p className="text-sm text-gray-500">{template.fields.length} fields</p>
                </div>

                <button
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
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="p-4 space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Template Name <span className="text-red-500">*</span>
                            </label>

                            <input
                                type="text"
                                value={template.name}
                                onChange={(e) => onChange({ ...template, name: e.target.value })}
                                placeholder="e.g., Course Completion Certificate"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Achievement Type
                            </label>

                            <select
                                value={template.achievementType}
                                onChange={(e) => onChange({ ...template, achievementType: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                            >
                                {ACHIEVEMENT_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>

                        <textarea
                            value={template.description}
                            onChange={(e) => onChange({ ...template, description: e.target.value })}
                            placeholder="Describe what this credential represents..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none"
                        />
                    </div>

                    {/* Fields */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Credential Fields
                        </label>

                        <div className="space-y-2">
                            {template.fields.map((field) => {
                                const FieldIcon = FIELD_TYPES.find(t => t.value === field.type)?.icon || Type;

                                return (
                                    <div
                                        key={field.id}
                                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                                    >
                                        <GripVertical className="w-4 h-4 text-gray-300" />

                                        <FieldIcon className="w-4 h-4 text-gray-400" />

                                        <span className="flex-1 text-sm text-gray-700">{field.name}</span>

                                        <button
                                            onClick={() => handleToggleRequired(field.id)}
                                            className={`px-2 py-0.5 text-xs rounded ${
                                                field.required
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-gray-200 text-gray-500'
                                            }`}
                                        >
                                            {field.required ? 'Required' : 'Optional'}
                                        </button>

                                        <button
                                            onClick={() => handleRemoveField(field.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Field */}
                        <div className="flex gap-2 mt-3">
                            <input
                                type="text"
                                value={newFieldName}
                                onChange={(e) => setNewFieldName(e.target.value)}
                                placeholder="Field name (e.g., Course Name)"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                            />

                            <select
                                value={newFieldType}
                                onChange={(e) => setNewFieldType(e.target.value as CredentialField['type'])}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                            >
                                {FIELD_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>

                            <button
                                onClick={handleAddField}
                                disabled={!newFieldName.trim()}
                                className="px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
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

    const [localTemplates, setLocalTemplates] = useState<CredentialTemplate[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);

    const integrationId = project?.id;

    // Fetch existing templates (boosts) for this integration
    const fetchTemplates = useCallback(async () => {
        if (!integrationId) {
            setLocalTemplates(templates.length > 0 ? templates : []);
            setIsLoading(false);
            return;
        }

        try {
            const wallet = await initWalletRef.current();
            const result = await wallet.invoke.getPaginatedBoosts({
                limit: 100,
                query: { meta: { integrationId } },
            });

            const fetchedTemplates: CredentialTemplate[] = (result?.records || []).map((boost: Record<string, unknown>) => {
                const meta = boost.meta as TemplateBoostMeta | undefined;
                const templateConfig = meta?.templateConfig;

                return {
                    id: boost.uri as string,
                    boostUri: boost.uri as string,
                    name: (boost.name as string) || 'Untitled Template',
                    description: (boost.description as string) || '',
                    achievementType: templateConfig?.achievementType || 'Course Completion',
                    fields: templateConfig?.fields || [...DEFAULT_FIELDS],
                    imageUrl: boost.image as string | undefined,
                    isNew: false,
                    isDirty: false,
                };
            });

            setLocalTemplates(fetchedTemplates.length > 0 ? fetchedTemplates : templates);
        } catch (err) {
            console.error('Failed to fetch templates:', err);
            setLocalTemplates(templates.length > 0 ? templates : []);
        } finally {
            setIsLoading(false);
        }
    }, [integrationId, templates]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // Build an OBv3 credential from template
    const buildCredentialFromTemplate = (template: CredentialTemplate, issuerName: string, issuerImage?: string) => {
        return {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json',
            ],
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            name: template.name,
            description: template.description,
            issuer: {
                type: ['Profile'],
                name: issuerName,
                image: issuerImage,
            },
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                type: ['AchievementSubject'],
                achievement: {
                    type: ['Achievement'],
                    achievementType: template.achievementType,
                    name: template.name,
                    description: template.description,
                    criteria: {
                        narrative: `Awarded for completing ${template.name}`,
                    },
                },
            },
        };
    };

    // Save a single template as a boost (create or update)
    const saveTemplateAsBoost = async (template: CredentialTemplate): Promise<string | null> => {
        if (!integrationId) return null;

        try {
            const wallet = await initWalletRef.current();
            const issuerName = branding?.displayName || 'Issuer';
            const issuerImage = branding?.image;

            const credentialInput = buildCredentialFromTemplate(template, issuerName, issuerImage);

            // Use newCredential to create an unsigned credential (not issueCredential which requires DID resolution)
            const credential = await wallet.invoke.newCredential({
                type: 'boost',
                boostName: template.name,
                achievementType: template.achievementType,
                achievementDescription: template.description,
                achievementName: template.name,
                achievementNarrative: `Awarded for completing ${template.name}`,
                boostImage: template.imageUrl || branding?.image,
                achievementImage: template.imageUrl || branding?.image,
            });

            const boostMeta: TemplateBoostMeta = {
                integrationId,
                templateConfig: {
                    fields: template.fields,
                    achievementType: template.achievementType,
                    version: TEMPLATE_META_VERSION,
                },
            };

            // If updating existing boost, use updateBoost
            if (template.boostUri) {
                await wallet.invoke.updateBoost(template.boostUri, {
                    name: template.name,
                    type: template.achievementType,
                    category: 'achievement',
                    meta: boostMeta,
                    credential,
                } as Parameters<typeof wallet.invoke.updateBoost>[1]);

                return template.boostUri;
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
                credential,
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

            setLocalTemplates(savedTemplates);
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

        setLocalTemplates([...localTemplates, newTemplate]);
        setExpandedId(newTemplate.id);
    };

    const handleUpdateTemplate = (id: string, updated: CredentialTemplate) => {
        setLocalTemplates(localTemplates.map(t =>
            t.id === id ? { ...updated, isDirty: true } : t
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
                        onToggleExpand={() => setExpandedId(expandedId === template.id ? null : template.id)}
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
