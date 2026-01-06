/**
 * CredentialBuilder - Main interactive OBv3 credential template builder
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    FileText,
    Code,
    Eye,
    Zap,
    ChevronDown,
    Sparkles,
    GraduationCap,
    Award,
    ScrollText,
    Shield,
    Users,
    Layers,
} from 'lucide-react';

import { OBv3CredentialTemplate, SectionId } from './types';
import { templateToJson, validateTemplate, extractDynamicVariables } from './utils';
import { TEMPLATE_PRESETS, getBlankTemplate } from './presets';
import { JsonPreview } from './JsonPreview';
import {
    CredentialInfoSection,
    IssuerSection,
    AchievementSection,
    RecipientSection,
    EvidenceSection,
    DatesSection,
    CustomFieldsSection,
} from './sections';

// Icon mapping for presets
const PRESET_ICONS: Record<string, React.FC<{ className?: string }>> = {
    FileText,
    GraduationCap,
    Award,
    ScrollText,
    Sparkles,
    Shield,
    Users,
    Zap,
    Layers,
};

type TabId = 'builder' | 'json';

interface CredentialBuilderProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    issuerName?: string;
    issuerImage?: string;
}

export const CredentialBuilder: React.FC<CredentialBuilderProps> = ({
    template,
    onChange,
    issuerName,
    issuerImage,
}) => {
    const [activeTab, setActiveTab] = useState<TabId>('builder');
    const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
        new Set(['credential', 'achievement'])
    );
    const [showPresetSelector, setShowPresetSelector] = useState(false);

    // Toggle section expansion
    const toggleSection = useCallback((section: SectionId) => {
        setExpandedSections(prev => {
            const next = new Set(prev);

            if (next.has(section)) {
                next.delete(section);
            } else {
                next.add(section);
            }

            return next;
        });
    }, []);

    // Apply a preset template
    const applyPreset = useCallback((presetId: string) => {
        const preset = TEMPLATE_PRESETS.find(p => p.id === presetId);

        if (preset) {
            // Deep clone the template to avoid mutation
            const newTemplate = JSON.parse(JSON.stringify(preset.template)) as OBv3CredentialTemplate;

            // Apply issuer defaults if provided
            if (issuerName && !newTemplate.issuer.name.isDynamic) {
                newTemplate.issuer.name.value = issuerName;
            }

            if (issuerImage && !newTemplate.issuer.image?.isDynamic) {
                newTemplate.issuer.image = { value: issuerImage, isDynamic: false, variableName: '' };
            }

            onChange(newTemplate);
            setShowPresetSelector(false);

            // Expand relevant sections
            setExpandedSections(new Set(['credential', 'achievement', 'issuer']));
        }
    }, [onChange, issuerName, issuerImage]);

    // Validation
    const validationErrors = useMemo(() => validateTemplate(template), [template]);
    const dynamicVariables = useMemo(() => extractDynamicVariables(template), [template]);

    return (
        <div className="h-full flex flex-col">
            {/* Tab Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('builder')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === 'builder'
                                ? 'bg-cyan-100 text-cyan-700'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        Builder
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('json')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === 'json'
                                ? 'bg-cyan-100 text-cyan-700'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Code className="w-4 h-4" />
                        JSON
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Dynamic variables badge */}
                    {dynamicVariables.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-violet-100 rounded-lg">
                            <Zap className="w-3 h-3 text-violet-600" />
                            <span className="text-xs font-medium text-violet-700">
                                {dynamicVariables.length} dynamic
                            </span>
                        </div>
                    )}

                    {/* Preset selector */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowPresetSelector(!showPresetSelector)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            Templates
                            <ChevronDown className={`w-4 h-4 transition-transform ${showPresetSelector ? 'rotate-180' : ''}`} />
                        </button>

                        {showPresetSelector && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowPresetSelector(false)}
                                />

                                <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                                    <div className="p-2 border-b border-gray-100">
                                        <p className="text-xs text-gray-500">Choose a template to start with</p>
                                    </div>

                                    <div className="max-h-80 overflow-y-auto p-2">
                                        {TEMPLATE_PRESETS.map(preset => {
                                            const IconComponent = PRESET_ICONS[preset.icon] || FileText;

                                            return (
                                                <button
                                                    key={preset.id}
                                                    type="button"
                                                    onClick={() => applyPreset(preset.id)}
                                                    className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                                >
                                                    <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <IconComponent className="w-4 h-4 text-cyan-600" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800">
                                                            {preset.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {preset.description}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && activeTab === 'builder' && (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-200">
                    <p className="text-xs text-amber-700">
                        <strong>Missing required fields:</strong> {validationErrors.join(', ')}
                    </p>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'builder' ? (
                    <div className="h-full overflow-y-auto p-4 space-y-3">
                        <CredentialInfoSection
                            template={template}
                            onChange={onChange}
                            isExpanded={expandedSections.has('credential')}
                            onToggle={() => toggleSection('credential')}
                        />

                        <IssuerSection
                            template={template}
                            onChange={onChange}
                            isExpanded={expandedSections.has('issuer')}
                            onToggle={() => toggleSection('issuer')}
                        />

                        <RecipientSection
                            template={template}
                            onChange={onChange}
                            isExpanded={expandedSections.has('recipient')}
                            onToggle={() => toggleSection('recipient')}
                        />

                        <AchievementSection
                            template={template}
                            onChange={onChange}
                            isExpanded={expandedSections.has('achievement')}
                            onToggle={() => toggleSection('achievement')}
                        />

                        <EvidenceSection
                            template={template}
                            onChange={onChange}
                            isExpanded={expandedSections.has('evidence')}
                            onToggle={() => toggleSection('evidence')}
                        />

                        <DatesSection
                            template={template}
                            onChange={onChange}
                            isExpanded={expandedSections.has('dates')}
                            onToggle={() => toggleSection('dates')}
                        />

                        <CustomFieldsSection
                            template={template}
                            onChange={onChange}
                            isExpanded={expandedSections.has('custom')}
                            onToggle={() => toggleSection('custom')}
                        />
                    </div>
                ) : (
                    <JsonPreview
                        template={template}
                        onChange={onChange}
                        isEditable
                    />
                )}
            </div>
        </div>
    );
};

export default CredentialBuilder;
