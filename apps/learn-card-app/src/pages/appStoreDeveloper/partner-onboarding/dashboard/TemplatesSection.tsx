import React, { useState, useCallback, useRef } from 'react';
import {
    Plus,
    Trash2,
    Pencil,
    Award,
    Save,
    X,
    Loader2,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Type,
    Calendar,
    Hash,
    Link as LinkIcon,
    Mail,
    GripVertical,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import { CredentialTemplate, CredentialField, BrandingConfig, TemplateBoostMeta } from '../types';

const TEMPLATE_META_VERSION = '1.0.0';

const FIELD_TYPE_ICONS: Record<string, React.ElementType> = {
    text: Type,
    date: Calendar,
    number: Hash,
    url: LinkIcon,
    email: Mail,
};

const ACHIEVEMENT_TYPES = [
    'Achievement',
    'Certificate',
    'Badge',
    'Certification',
    'License',
    'Diploma',
    'Award',
    'Course',
    'Skill',
];

interface TemplatesSectionProps {
    templates: CredentialTemplate[];
    branding: BrandingConfig | null;
    integrationId: string;
    onUpdate: (templates: CredentialTemplate[]) => void;
}

export const TemplatesSection: React.FC<TemplatesSectionProps> = ({
    templates,
    branding,
    integrationId,
    onUpdate,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
        templates.length > 0 ? templates[0].id : null
    );
    const [editingTemplate, setEditingTemplate] = useState<CredentialTemplate | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedFields, setExpandedFields] = useState<string[]>([]);

    const currentTemplate = templates.find(t => t.id === selectedTemplate);

    const handleCreateTemplate = () => {
        const newTemplate: CredentialTemplate = {
            id: crypto.randomUUID(),
            name: 'New Template',
            description: '',
            achievementType: 'Achievement',
            fields: [
                { id: crypto.randomUUID(), name: 'Recipient Name', type: 'text', required: true },
                { id: crypto.randomUUID(), name: 'Issue Date', type: 'date', required: true },
            ],
            isNew: true,
            isDirty: true,
        };

        const updated = [...templates, newTemplate];
        onUpdate(updated);
        setSelectedTemplate(newTemplate.id);
        setEditingTemplate(newTemplate);
    };

    const handleEditTemplate = (template: CredentialTemplate) => {
        setEditingTemplate({ ...template });
    };

    const handleCancelEdit = () => {
        setEditingTemplate(null);
    };

    const handleSaveTemplate = async () => {
        if (!editingTemplate) return;

        setIsSaving(true);

        try {
            const wallet = await initWalletRef.current();

            const credential = await wallet.invoke.newCredential({
                type: 'boost',
                boostName: editingTemplate.name,
                achievementType: editingTemplate.achievementType,
                achievementDescription: editingTemplate.description,
                achievementName: editingTemplate.name,
                achievementNarrative: `Awarded for completing ${editingTemplate.name}`,
                boostImage: editingTemplate.imageUrl || branding?.image,
                achievementImage: editingTemplate.imageUrl || branding?.image,
            });

            const boostMeta: TemplateBoostMeta = {
                integrationId,
                templateConfig: {
                    fields: editingTemplate.fields,
                    achievementType: editingTemplate.achievementType,
                    version: TEMPLATE_META_VERSION,
                },
            };

            let boostUri = editingTemplate.boostUri;

            if (boostUri) {
                await wallet.invoke.updateBoost(boostUri, {
                    name: editingTemplate.name,
                    type: editingTemplate.achievementType,
                    category: 'achievement',
                    meta: boostMeta,
                    credential,
                } as Parameters<typeof wallet.invoke.updateBoost>[1]);
            } else {
                boostUri = await wallet.invoke.createBoost(
                    credential,
                    {
                        name: editingTemplate.name,
                        type: editingTemplate.achievementType,
                        category: 'achievement',
                        meta: boostMeta,
                        defaultPermissions: { canIssue: true },
                    } as unknown as Parameters<typeof wallet.invoke.createBoost>[1]
                );
            }

            const savedTemplate: CredentialTemplate = {
                ...editingTemplate,
                boostUri: boostUri || undefined,
                isNew: false,
                isDirty: false,
            };

            const updated = templates.map(t => t.id === savedTemplate.id ? savedTemplate : t);
            onUpdate(updated);
            setEditingTemplate(null);

            presentToast('Template saved successfully!', { type: ToastTypeEnum.Success, hasDismissButton: true });
        } catch (err) {
            console.error('Failed to save template:', err);
            presentToast('Failed to save template', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTemplate = async (template: CredentialTemplate) => {
        if (!confirm(`Delete "${template.name}"? This cannot be undone.`)) return;

        try {
            if (template.boostUri) {
                const wallet = await initWalletRef.current();
                await wallet.invoke.deleteBoost?.(template.boostUri);
            }

            const updated = templates.filter(t => t.id !== template.id);
            onUpdate(updated);

            if (selectedTemplate === template.id) {
                setSelectedTemplate(updated.length > 0 ? updated[0].id : null);
            }

            presentToast('Template deleted', { type: ToastTypeEnum.Success, hasDismissButton: true });
        } catch (err) {
            console.error('Failed to delete template:', err);
            presentToast('Failed to delete template', { type: ToastTypeEnum.Error, hasDismissButton: true });
        }
    };

    const handleAddField = () => {
        if (!editingTemplate) return;

        const newField: CredentialField = {
            id: crypto.randomUUID(),
            name: 'New Field',
            type: 'text',
            required: false,
        };

        setEditingTemplate({
            ...editingTemplate,
            fields: [...editingTemplate.fields, newField],
        });
        setExpandedFields([...expandedFields, newField.id]);
    };

    const handleUpdateField = (fieldId: string, updates: Partial<CredentialField>) => {
        if (!editingTemplate) return;

        setEditingTemplate({
            ...editingTemplate,
            fields: editingTemplate.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f),
        });
    };

    const handleRemoveField = (fieldId: string) => {
        if (!editingTemplate) return;

        setEditingTemplate({
            ...editingTemplate,
            fields: editingTemplate.fields.filter(f => f.id !== fieldId),
        });
    };

    const toggleFieldExpanded = (fieldId: string) => {
        setExpandedFields(prev =>
            prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Credential Templates</h2>
                    <p className="text-sm text-gray-500">Manage your credential types and their fields</p>
                </div>

                <button
                    onClick={handleCreateTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Template
                </button>
            </div>

            {templates.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Award className="w-6 h-6 text-gray-400" />
                    </div>

                    <p className="text-gray-600 font-medium mb-1">No templates yet</p>
                    <p className="text-sm text-gray-500 mb-4">Create your first credential template</p>

                    <button
                        onClick={handleCreateTemplate}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create Template
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Template List */}
                    <div className="space-y-2">
                        {templates.map(template => (
                            <button
                                key={template.id}
                                onClick={() => {
                                    setSelectedTemplate(template.id);
                                    setEditingTemplate(null);
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                                    selectedTemplate === template.id
                                        ? 'border-cyan-500 bg-cyan-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    selectedTemplate === template.id ? 'bg-cyan-500' : 'bg-gray-100'
                                }`}>
                                    <Award className={`w-5 h-5 ${selectedTemplate === template.id ? 'text-white' : 'text-gray-500'}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 truncate">{template.name}</p>
                                    <p className="text-xs text-gray-500">{template.fields.length} fields</p>
                                </div>

                                {template.boostUri ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Template Detail/Edit Panel */}
                    <div className="md:col-span-2">
                        {currentTemplate && !editingTemplate && (
                            <div className="bg-gray-50 rounded-xl p-5 space-y-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{currentTemplate.name}</h3>
                                        <p className="text-sm text-gray-500">{currentTemplate.description || 'No description'}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditTemplate(currentTemplate)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => handleDeleteTemplate(currentTemplate)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs font-medium">
                                        {currentTemplate.achievementType}
                                    </span>

                                    {currentTemplate.boostUri && (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                            Published
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700">Fields</h4>

                                    <div className="space-y-1">
                                        {currentTemplate.fields.map(field => {
                                            const Icon = FIELD_TYPE_ICONS[field.type] || Type;
                                            return (
                                                <div key={field.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                                                    <Icon className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-700">{field.name}</span>
                                                    {field.required && (
                                                        <span className="text-xs text-red-500">*</span>
                                                    )}
                                                    <span className="text-xs text-gray-400 ml-auto">{field.type}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {editingTemplate && (
                            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-800">
                                        {editingTemplate.isNew ? 'New Template' : 'Edit Template'}
                                    </h3>

                                    <button
                                        onClick={handleCancelEdit}
                                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={editingTemplate.name}
                                            onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            value={editingTemplate.description}
                                            onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Achievement Type</label>
                                        <select
                                            value={editingTemplate.achievementType}
                                            onChange={(e) => setEditingTemplate({ ...editingTemplate, achievementType: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        >
                                            {ACHIEVEMENT_TYPES.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-gray-700">Fields</h4>
                                        <button
                                            onClick={handleAddField}
                                            className="flex items-center gap-1 px-2 py-1 text-sm text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add Field
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {editingTemplate.fields.map(field => {
                                            const isExpanded = expandedFields.includes(field.id);
                                            const Icon = FIELD_TYPE_ICONS[field.type] || Type;

                                            return (
                                                <div key={field.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => toggleFieldExpanded(field.id)}
                                                        className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                                                    >
                                                        <GripVertical className="w-4 h-4 text-gray-400" />
                                                        <Icon className="w-4 h-4 text-gray-500" />
                                                        <span className="flex-1 text-left text-sm font-medium text-gray-700">
                                                            {field.name}
                                                        </span>
                                                        {field.required && (
                                                            <span className="text-xs text-red-500">Required</span>
                                                        )}
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-4 h-4 text-gray-400" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="p-3 space-y-3 bg-white">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Field Name</label>
                                                                    <input
                                                                        type="text"
                                                                        value={field.name}
                                                                        onChange={(e) => handleUpdateField(field.id, { name: e.target.value })}
                                                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                                                                    <select
                                                                        value={field.type}
                                                                        onChange={(e) => handleUpdateField(field.id, { type: e.target.value as CredentialField['type'] })}
                                                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                    >
                                                                        <option value="text">Text</option>
                                                                        <option value="date">Date</option>
                                                                        <option value="number">Number</option>
                                                                        <option value="url">URL</option>
                                                                        <option value="email">Email</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between">
                                                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={field.required}
                                                                        onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                                                                        className="rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                                                                    />
                                                                    Required field
                                                                </label>

                                                                <button
                                                                    onClick={() => handleRemoveField(field.id)}
                                                                    className="flex items-center gap-1 px-2 py-1 text-sm text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={handleCancelEdit}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={handleSaveTemplate}
                                        disabled={isSaving || !editingTemplate.name}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save Template
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!currentTemplate && !editingTemplate && (
                            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl">
                                <p className="text-gray-500">Select a template to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
