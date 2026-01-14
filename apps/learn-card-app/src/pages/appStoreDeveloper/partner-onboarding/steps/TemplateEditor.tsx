/**
 * TemplateEditor - Single template editor using CredentialBuilder
 * Extracted from TemplateBuilderStep for better code splitting
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    Award,
    ChevronDown,
    ChevronUp,
    Trash2,
    Zap,
} from 'lucide-react';

import { BrandingConfig } from '../types';
import { 
    CredentialBuilder, 
    OBv3CredentialTemplate, 
    extractDynamicVariables,
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

    // Handle validation status changes from CredentialBuilder
    const handleValidationChange = useCallback((status: ValidationStatus, error?: string) => {
        onValidationChange?.(template.id, status, error);
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

            {/* Content - Full CredentialBuilder - only render when expanded */}
            {isExpanded && (
                <div className="h-[600px] border-t border-gray-200">
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
            )}
        </div>
    );
};

export default TemplateEditor;
