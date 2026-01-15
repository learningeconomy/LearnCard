/**
 * TemplateListManager - Unified template management component
 * 
 * Provides a complete UI for managing credential templates linked to app listings.
 * Includes: template list, create/edit with CredentialBuilder, alias editing, code snippets.
 * 
 * Used by:
 * - IssueCredentialsSetup (EmbedAppGuide)
 * - PeerBadgesSetup (EmbedAppGuide)
 * - PartnerConnectTab (Dashboard)
 */

import React, { useState, useCallback } from 'react';
import {
    Plus,
    Loader2,
    Award,
    Code,
    Trash2,
    Edit3,
    Check,
    X,
    Sparkles,
    Pencil,
} from 'lucide-react';

import { useToast, ToastTypeEnum } from 'learn-card-base';

import {
    useTemplateManager,
    type ManagedTemplate,
    type TemplateManagerOptions,
} from '../dashboards/hooks/useTemplateDetails';

import {
    CredentialBuilder,
    getBlankTemplate,
    templateToJson,
    jsonToTemplate,
    type OBv3CredentialTemplate,
} from '../partner-onboarding/components/CredentialBuilder';

import { CodeBlock } from './CodeBlock';

export interface TemplateListManagerProps {
    listingId: string;
    integrationId?: string;
    featureType?: 'issue-credentials' | 'peer-badges';
    showCodeSnippets?: boolean;
    editable?: boolean;
    compact?: boolean;
    onTemplateChange?: (templates: ManagedTemplate[]) => void;
}

export const TemplateListManager: React.FC<TemplateListManagerProps> = ({
    listingId,
    integrationId,
    featureType = 'issue-credentials',
    showCodeSnippets = true,
    editable = true,
    compact = false,
    onTemplateChange,
}) => {
    const { presentToast } = useToast();

    // Use the shared template manager hook
    const {
        templates,
        isLoading,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        updateAlias,
        refetch,
    } = useTemplateManager({ listingId, integrationId });

    // Local UI state
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ManagedTemplate | null>(null);
    const [currentBuildingTemplate, setCurrentBuildingTemplate] = useState<OBv3CredentialTemplate>(() => getBlankTemplate());
    const [isSaving, setIsSaving] = useState(false);
    const [editingAlias, setEditingAlias] = useState<string | null>(null);
    const [tempAliasValue, setTempAliasValue] = useState('');
    const [selectedTemplateForCode, setSelectedTemplateForCode] = useState<ManagedTemplate | null>(null);

    // Notify parent when templates change
    React.useEffect(() => {
        onTemplateChange?.(templates);

        if (templates.length > 0 && !selectedTemplateForCode) {
            setSelectedTemplateForCode(templates[0]);
        }
    }, [templates, onTemplateChange, selectedTemplateForCode]);

    // Start editing an existing template
    const handleStartEdit = useCallback((template: ManagedTemplate) => {
        try {
            const obv3Template = jsonToTemplate(template.credential || {});
            setCurrentBuildingTemplate(obv3Template);
            setEditingTemplate(template);
            setShowBuilder(true);
        } catch (err) {
            console.error('Failed to load template for editing:', err);
            presentToast('Failed to load template for editing', { type: ToastTypeEnum.Error });
        }
    }, [presentToast]);

    // Save from builder (create or update)
    const handleSaveFromBuilder = useCallback(async () => {
        setIsSaving(true);

        try {
            const credentialData = templateToJson(currentBuildingTemplate);
            const name = (credentialData.name as string) || 'Untitled Template';

            if (editingTemplate) {
                // Update existing
                await updateTemplate(editingTemplate.boostUri!, credentialData, { name });
                presentToast('Template updated!', { type: ToastTypeEnum.Success });
            } else {
                // Create new - for peer-badges, add canIssue: true so anyone can issue
                await createTemplate(credentialData, {
                    name,
                    defaultPermissions: featureType === 'peer-badges'
                        ? { canIssue: true }
                        : undefined,
                });
                presentToast('Template created!', { type: ToastTypeEnum.Success });
            }

            setShowBuilder(false);
            setEditingTemplate(null);
            setCurrentBuildingTemplate(getBlankTemplate());
        } catch (err) {
            console.error('Failed to save template:', err);
            presentToast(`Failed to ${editingTemplate ? 'update' : 'create'} template`, { type: ToastTypeEnum.Error });
        } finally {
            setIsSaving(false);
        }
    }, [currentBuildingTemplate, editingTemplate, createTemplate, updateTemplate, presentToast, featureType]);

    // Handle delete
    const handleDelete = useCallback(async (boostUri: string) => {
        try {
            await deleteTemplate(boostUri);
            presentToast('Template removed', { type: ToastTypeEnum.Success });

            if (selectedTemplateForCode?.boostUri === boostUri) {
                setSelectedTemplateForCode(null);
            }
        } catch (err) {
            console.error('Failed to delete template:', err);
            presentToast('Failed to remove template', { type: ToastTypeEnum.Error });
        }
    }, [deleteTemplate, presentToast, selectedTemplateForCode]);

    // Handle alias update
    const handleSaveAlias = useCallback(async (boostUri: string) => {
        try {
            await updateAlias(boostUri, tempAliasValue);
            setEditingAlias(null);
            presentToast('Alias updated!', { type: ToastTypeEnum.Success });
        } catch (err) {
            console.error('Failed to update alias:', err);
            presentToast((err as Error).message || 'Failed to update alias', { type: ToastTypeEnum.Error });
        }
    }, [updateAlias, tempAliasValue, presentToast]);

    // Cancel builder
    const handleCancelBuilder = useCallback(() => {
        setShowBuilder(false);
        setEditingTemplate(null);
        setCurrentBuildingTemplate(getBlankTemplate());
    }, []);

    // Generate code snippet
    const getCodeSnippet = (template: ManagedTemplate | null) => {
        if (!template) {
            return `// Select a template above to see the integration code`;
        }

        const templateDataLines = template.variables && template.variables.length > 0
            ? template.variables.map(v => `        ${v}: 'value', // Replace with actual value`).join('\n')
            : `        // No template variables - credential will be issued as-is`;

        if (featureType === 'peer-badges') {
            return `// Issue "${template.name}" peer badge
const result = await learnCard.initiateTemplateIssue({
    templateUri: '${template.boostUri}',
    templateData: {
${templateDataLines}
    }
});`;
        }

        return `// Issue "${template.name}" credential to user
const result = await learnCard.sendCredential({
    templateAlias: '${template.templateAlias}',
    templateData: {
${templateDataLines}
    }
});

if (result.credentialUri) {
    console.log('Credential issued:', result.credentialUri);
}`;
    };

    // Render loading state
    if (isLoading) {
        return (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                <span className="text-gray-600">Loading templates...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Template List */}
            {templates.length > 0 && (
                <div className="space-y-2">
                    {templates.map(template => (
                        <div
                            key={template.boostUri}
                            className={`p-4 rounded-xl border transition-colors ${
                                selectedTemplateForCode?.boostUri === template.boostUri
                                    ? 'border-emerald-300 bg-emerald-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Template Icon */}
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {template.imageUrl ? (
                                        <img src={template.imageUrl} alt={template.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Award className="w-5 h-5 text-emerald-600" />
                                    )}
                                </div>

                                {/* Template Info */}
                                <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-gray-900 truncate">{template.name}</h5>

                                    {/* Alias */}
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500">Alias:</span>

                                        {editingAlias === template.boostUri ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={tempAliasValue}
                                                    onChange={e => setTempAliasValue(e.target.value)}
                                                    className="px-2 py-0.5 text-xs border border-emerald-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    autoFocus
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') handleSaveAlias(template.boostUri!);
                                                        if (e.key === 'Escape') setEditingAlias(null);
                                                    }}
                                                />

                                                <button
                                                    onClick={() => handleSaveAlias(template.boostUri!)}
                                                    className="p-1 text-emerald-600 hover:text-emerald-800"
                                                >
                                                    <Check className="w-3 h-3" />
                                                </button>

                                                <button
                                                    onClick={() => setEditingAlias(null)}
                                                    className="p-1 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setEditingAlias(template.boostUri!);
                                                    setTempAliasValue(template.templateAlias || '');
                                                }}
                                                className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700 hover:bg-gray-200 transition-colors"
                                            >
                                                <code>{template.templateAlias || 'No alias'}</code>
                                                {editable && <Pencil className="w-3 h-3 text-gray-400" />}
                                            </button>
                                        )}
                                    </div>

                                    {/* Variables */}
                                    {template.variables && template.variables.length > 0 && !compact && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {template.variables.map(v => (
                                                <span
                                                    key={v}
                                                    className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-mono"
                                                >
                                                    {`{{${v}}}`}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {editable && (
                                        <button
                                            onClick={() => handleStartEdit(template)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit template"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    )}

                                    {showCodeSnippets && (
                                        <button
                                            onClick={() => setSelectedTemplateForCode(template)}
                                            className={`p-2 rounded-lg transition-colors ${
                                                selectedTemplateForCode?.boostUri === template.boostUri
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                            }`}
                                            title="View code"
                                        >
                                            <Code className="w-4 h-4" />
                                        </button>
                                    )}

                                    {editable && (
                                        <button
                                            onClick={() => handleDelete(template.boostUri!)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Builder or Add Button */}
            {editable && (
                <>
                    {showBuilder ? (
                        <div className={`border rounded-xl overflow-hidden ${editingTemplate ? 'border-blue-200' : 'border-emerald-200'}`}>
                            <div className={`p-3 border-b flex items-center justify-between ${editingTemplate ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                <h5 className={`font-medium flex items-center gap-2 ${editingTemplate ? 'text-blue-800' : 'text-emerald-800'}`}>
                                    {editingTemplate ? (
                                        <>
                                            <Edit3 className="w-4 h-4" />
                                            Editing: {editingTemplate.name}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Design Your Credential Template
                                        </>
                                    )}
                                </h5>

                                <button
                                    onClick={handleCancelBuilder}
                                    className={`text-sm ${editingTemplate ? 'text-blue-600 hover:text-blue-800' : 'text-emerald-600 hover:text-emerald-800'}`}
                                >
                                    Cancel
                                </button>
                            </div>

                            <div className="p-4">
                                <CredentialBuilder
                                    template={currentBuildingTemplate}
                                    onChange={setCurrentBuildingTemplate}
                                />
                            </div>

                            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                                <button
                                    onClick={handleCancelBuilder}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg text-sm font-medium"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleSaveFromBuilder}
                                    disabled={isSaving}
                                    className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ${
                                        editingTemplate
                                            ? 'bg-blue-500 hover:bg-blue-600'
                                            : 'bg-emerald-500 hover:bg-emerald-600'
                                    }`}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {editingTemplate ? 'Saving...' : 'Creating...'}
                                        </>
                                    ) : editingTemplate ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Create Template
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowBuilder(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-emerald-300 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            {templates.length === 0 ? 'Create Your First Template' : 'Add Another Template'}
                        </button>
                    )}
                </>
            )}

            {/* Code Snippet */}
            {showCodeSnippets && templates.length > 0 && !showBuilder && (
                <div className="space-y-3">
                    {templates.length > 1 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-500">Select template:</span>

                            {templates.map(t => (
                                <button
                                    key={t.boostUri}
                                    onClick={() => setSelectedTemplateForCode(t)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                        selectedTemplateForCode?.boostUri === t.boostUri
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <CodeBlock code={getCodeSnippet(selectedTemplateForCode)} />
                </div>
            )}

            {/* Empty state */}
            {templates.length === 0 && !showBuilder && !editable && (
                <div className="p-6 text-center text-gray-500">
                    No templates configured yet.
                </div>
            )}
        </div>
    );
};

export default TemplateListManager;
