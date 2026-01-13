/**
 * CredentialBuilder - Main interactive OBv3 credential template builder
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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

import { BoostCategoryOptionsEnum, BoostPageViewMode, useWallet } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { BoostEarnedCard } from '../../../../../components/boost/boost-earned-card/BoostEarnedCard';

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

type TabId = 'builder' | 'preview' | 'json';

interface CredentialBuilderProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    issuerName?: string;
    issuerImage?: string;
    onTestIssue?: (credential: Record<string, unknown>) => Promise<{ success: boolean; error?: string; result?: unknown }>;
}

export const CredentialBuilder: React.FC<CredentialBuilderProps> = ({
    template,
    onChange,
    issuerName,
    onTestIssue,
    issuerImage,
}) => {
    const { initWallet } = useWallet();
    const [userDid, setUserDid] = useState<string>('did:web:preview');
    const [activeTab, setActiveTab] = useState<TabId>('builder');

    // Fetch user's DID from wallet
    useEffect(() => {
        const fetchDid = async () => {
            try {
                const wallet = await initWallet();
                const did = wallet.id.did();

                if (did) setUserDid(did);
            } catch (e) {
                // Keep default preview DID
            }
        };

        fetchDid();
    }, [initWallet]);
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

    // Build preview credential with sample values filled in
    const previewCredential = useMemo(() => {
        const json = templateToJson(template);

        // Replace dynamic variables with sample values (same logic as test issuance)
        const replaceDynamicVariables = (obj: unknown): unknown => {
            if (typeof obj === 'string') {
                return obj.replace(/\{\{(\w+)\}\}/g, (_match, varName) => {
                    const lowerVar = varName.toLowerCase();

                    if (lowerVar.includes('date') || lowerVar.includes('time')) {
                        return new Date().toISOString();
                    }

                    const humanized = varName.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                    return `[${humanized}]`;
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

        const rendered = replaceDynamicVariables(json) as Record<string, unknown>;

        // Add preview issuer info
        return {
            ...rendered,
            issuer: userDid,
            validFrom: new Date().toISOString(),
        };
    }, [template, userDid]);

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
                        onClick={() => setActiveTab('preview')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === 'preview'
                                ? 'bg-cyan-100 text-cyan-700'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Eye className="w-4 h-4" />
                        Preview
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

            {/* Custom Schema Warning */}
            {template.schemaType && template.schemaType !== 'obv3' && (
                <div className="px-4 py-3 bg-violet-50 border-b border-violet-200">
                    <p className="text-sm text-violet-800">
                        <strong>Custom Credential Schema</strong>
                    </p>
                    <p className="text-xs text-violet-600 mt-1">
                        This credential uses a {template.schemaType === 'clr2' ? 'CLR 2.0' : 'custom'} schema. 
                        The Builder UI is not available for this credential type. Use the <strong>JSON</strong> tab to edit directly.
                    </p>
                </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && activeTab === 'builder' && template.schemaType === 'obv3' && (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-200">
                    <p className="text-xs text-amber-700">
                        <strong>Missing required fields:</strong> {validationErrors.join(', ')}
                    </p>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'builder' && template.schemaType !== 'obv3' && template.schemaType ? (
                    <div className="h-full flex items-center justify-center p-8">
                        <div className="text-center max-w-md">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-100 flex items-center justify-center">
                                <Code className="w-8 h-8 text-violet-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-800 mb-2">
                                JSON-Only Mode
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                This credential uses a {template.schemaType === 'clr2' ? 'CLR 2.0' : 'custom'} schema 
                                that doesn't map to the OBv3 builder fields. Switch to the JSON tab to edit this credential directly.
                            </p>
                            <button
                                type="button"
                                onClick={() => setActiveTab('json')}
                                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                            >
                                Open JSON Editor
                            </button>
                        </div>
                    </div>
                ) : activeTab === 'builder' ? (
                    <div className="h-full overflow-y-auto p-4 space-y-3">
                        <CredentialInfoSection
                            template={template}
                            onChange={onChange}
                            isExpanded={expandedSections.has('credential')}
                            onToggle={() => toggleSection('credential')}
                        />

                        <IssuerSection
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

                    </div>
                ) : activeTab === 'preview' ? (
                    <div className="h-full overflow-y-auto p-6">
                        <div className="space-y-6">
                            <p className="text-sm text-gray-600 text-center">
                                This is how your credential will appear to recipients:
                            </p>

                            {/* Credential Card Preview */}
                            <div className="flex justify-center py-4">
                                <div className="w-[180px]">
                                    <BoostEarnedCard
                                        credential={previewCredential as any}
                                        categoryType={getDefaultCategoryForCredential(previewCredential as any) || BoostCategoryOptionsEnum.achievement}
                                        boostPageViewMode={BoostPageViewMode.Card}
                                        useWrapper={false}
                                        verifierState={false}
                                        className="shadow-lg"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                                <p className="text-xs text-cyan-800 text-center">
                                    <strong>Tip:</strong> Click the credential card above to open the full detail view,
                                    just like recipients will see it in their wallet.
                                </p>
                            </div>

                            {!template.image?.value && !template.credentialSubject.achievement?.image?.value && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-xs text-amber-800 text-center">
                                        <strong>Note:</strong> Add an image to make your credential more visually distinctive!
                                    </p>
                                </div>
                            )}

                            {dynamicVariables.length > 0 && (
                                <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                                    <p className="text-xs text-violet-800 text-center">
                                        <strong>Dynamic fields:</strong> This preview shows placeholder values.
                                        The actual credential will use data from your API.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <JsonPreview
                        template={template}
                        onChange={onChange}
                        isEditable
                        onTestIssue={onTestIssue}
                    />
                )}
            </div>
        </div>
    );
};

export default CredentialBuilder;
