/**
 * TemplateEditor - Single template editor using CredentialBuilder
 * Extracted from TemplateBuilderStep for better code splitting
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    Award,
    Check,
    ChevronDown,
    ChevronUp,
    Copy,
    Loader2,
    Plus,
    Trash2,
    X,
    Zap,
} from 'lucide-react';

import { BrandingConfig } from '../types';
import {
    CredentialBuilder,
    OBv3CredentialTemplate,
    extractDynamicVariables,
    validateTemplate,
    type ValidationStatus as BuilderValidationStatus,
} from '../components/CredentialBuilder';
import { ExtendedTemplate, ValidationStatus, legacyToOBv3, obv3ToLegacy } from './templateBuilderUtils';

interface TemplateEditorProps {
    template: ExtendedTemplate;
    branding: BrandingConfig | null;
    onChange: (template: ExtendedTemplate) => void;
    onDelete: () => void;
    isExpanded: boolean;
    onToggle: () => void;
    onTestIssue?: (credential: Record<string, unknown>) => Promise<{ success: boolean; error?: string; result?: unknown }>;
    onValidationChange?: (templateId: string, status: ValidationStatus, error?: string) => void;
    validationStatus?: ValidationStatus;
    /** Called when user explicitly saves this template */
    onSave?: () => void;
    /** Called when user cancels editing (for new unsaved templates) */
    onCancel?: () => void;
    /** Whether this template is currently being saved */
    isSaving?: boolean;
    /** Whether this is a new unsaved template */
    isNew?: boolean;
    /** Boost URI for this template (for copy-to-clipboard) */
    boostUri?: string;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
    template,
    branding,
    onChange,
    onDelete,
    isExpanded,
    onToggle,
    onTestIssue,
    onValidationChange,
    validationStatus = 'unknown',
    onSave,
    onCancel,
    isSaving = false,
    isNew = false,
    boostUri,
}) => {
    const [copiedUri, setCopiedUri] = useState(false);

    // Initialize OBv3 template from legacy or existing
    const [obv3Template, setObv3Template] = useState<OBv3CredentialTemplate>(() => {
        if (template.obv3Template) {
            return template.obv3Template;
        }

        return legacyToOBv3(template, branding?.displayName, branding?.image);
    });

    const dynamicVars = useMemo(() => extractDynamicVariables(obv3Template), [obv3Template]);

    // Track builder validation status locally
    const [builderValidationStatus, setBuilderValidationStatus] = useState<BuilderValidationStatus>('unknown');

    // Structural validation errors
    const structuralErrors = useMemo(
        () => (isExpanded ? validateTemplate(obv3Template) : []),
        [isExpanded, obv3Template]
    );

    const canSave = structuralErrors.length === 0 && builderValidationStatus !== 'invalid';

    const handleTemplateChange = useCallback((newObv3: OBv3CredentialTemplate) => {
        setObv3Template(newObv3);

        // Convert back to legacy format and notify parent
        const legacyTemplate = obv3ToLegacy(newObv3, template) as ExtendedTemplate;
        legacyTemplate.obv3Template = newObv3;
        onChange(legacyTemplate);
    }, [template, onChange]);

    // Handle validation status changes from CredentialBuilder
    const handleValidationChange = useCallback((status: BuilderValidationStatus, error?: string) => {
        setBuilderValidationStatus(status);
        onValidationChange?.(template.id, status as unknown as ValidationStatus, error);
    }, [template.id, onValidationChange]);

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

                <div className="flex-1 text-left min-w-0">
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

                    {boostUri && (
                        <div
                            className="flex items-center gap-1.5 mt-1 cursor-default"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <code className="text-xs text-gray-400 font-mono truncate">
                                {boostUri}
                            </code>
                            <button
                                type="button"
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        await navigator.clipboard.writeText(boostUri);
                                        setCopiedUri(true);
                                        setTimeout(() => setCopiedUri(false), 1500);
                                    } catch { /* fallback: no-op */ }
                                }}
                                className="flex-shrink-0 p-1 text-gray-400 hover:text-cyan-600 rounded transition-colors"
                                title="Copy template URI"
                            >
                                {copiedUri ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                    <Copy className="w-3 h-3" />
                                )}
                            </button>
                        </div>
                    )}
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

            {/* Content - Full CredentialBuilder - only render when expanded */}
            {isExpanded && (
                <div className="border-t border-gray-200">
                    <div className="h-[600px]">
                        <CredentialBuilder
                            template={obv3Template}
                            onChange={handleTemplateChange}
                            issuerName={branding?.displayName}
                            issuerImage={branding?.image}
                            onTestIssue={onTestIssue}
                            onValidationChange={handleValidationChange}
                            initialValidationStatus={validationStatus}
                        />
                    </div>

                    {/* Save / Cancel buttons */}
                    {onSave && (
                        <div className="p-3 bg-gray-50 border-t border-gray-200 space-y-2">
                            {structuralErrors.length > 0 && (
                                <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                    <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-700">
                                        {structuralErrors.map(e => e.message).join('. ')}
                                    </p>
                                </div>
                            )}

                            {builderValidationStatus === 'invalid' && structuralErrors.length === 0 && (
                                <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                    <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-700">
                                        Template has validation errors. Fix the issues shown above before saving.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                {onCancel && (
                                    <button
                                        onClick={onCancel}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                )}

                                <button
                                    onClick={onSave}
                                    disabled={isSaving || !canSave}
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {isNew ? 'Creating...' : 'Saving...'}
                                        </>
                                    ) : isNew ? (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Create Template
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TemplateEditor;
