import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
    GitMerge,
    ArrowRight,
    ArrowLeft,
    Copy,
    Check,
    RefreshCw,
    AlertCircle,
    Zap,
    FileJson,
    ChevronRight,
    Loader2,
    Save,
    Link2,
} from 'lucide-react';

import { Clipboard } from '@capacitor/clipboard';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import { IntegrationMethod, CredentialTemplate, DataMappingConfig, FieldMapping, TemplateBoostMeta, PartnerProject } from '../types';
import { CodeBlock } from '../../components/CodeBlock';

const TEMPLATE_META_VERSION = '1.0.0';

interface DataMappingStepProps {
    integrationMethod: IntegrationMethod;
    templates: CredentialTemplate[];
    project: PartnerProject | null;
    dataMapping: DataMappingConfig | null;
    onComplete: (mapping: DataMappingConfig, updatedTemplates: CredentialTemplate[]) => void;
    onBack: () => void;
}

const SAMPLE_WEBHOOK_PAYLOAD = {
    event: 'course_completed',
    user: {
        email: 'student@example.com',
        name: 'John Doe',
        id: 'user_123',
    },
    course: {
        id: 'course_456',
        title: 'Introduction to Data Science',
        sku: 'DS101',
        credits: 3,
    },
    completion: {
        date: '2024-01-15T10:30:00Z',
        grade: 'A',
        score: 95,
    },
};

export const DataMappingStep: React.FC<DataMappingStepProps> = ({
    integrationMethod,
    templates,
    project,
    dataMapping,
    onComplete,
    onBack,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const [webhookUrl] = useState(dataMapping?.webhookUrl || `https://api.learncard.com/webhooks/${Date.now().toString(36)}`);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [samplePayload, setSamplePayload] = useState<Record<string, unknown> | null>(
        dataMapping?.samplePayload || null
    );
    const [mappings, setMappings] = useState<FieldMapping[]>(dataMapping?.mappings || []);
    const [isWaiting, setIsWaiting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>(templates[0]?.id || '');
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

    const integrationId = project?.id;

    // Extract all field paths from sample payload
    const sourceFields = useMemo(() => {
        if (!samplePayload) return [];

        const extractPaths = (obj: Record<string, unknown>, prefix = ''): string[] => {
            const paths: string[] = [];

            for (const [key, value] of Object.entries(obj)) {
                const path = prefix ? `${prefix}.${key}` : key;

                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    paths.push(...extractPaths(value as Record<string, unknown>, path));
                } else {
                    paths.push(path);
                }
            }

            return paths;
        };

        return extractPaths(samplePayload);
    }, [samplePayload]);

    // Get target fields from selected template
    const targetFields = useMemo(() => {
        const template = templates.find(t => t.id === selectedTemplate);
        return template?.fields.map(f => f.name) || [];
    }, [templates, selectedTemplate]);

    const handleCopyUrl = async () => {
        await Clipboard.write({ string: webhookUrl });
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    const handleSimulateWebhook = () => {
        setIsWaiting(true);

        // Simulate receiving a webhook after 2 seconds
        setTimeout(() => {
            setSamplePayload(SAMPLE_WEBHOOK_PAYLOAD);
            setIsWaiting(false);
        }, 2000);
    };

    // Handle selecting a source field
    const handleSelectSource = (source: string) => {
        if (selectedSource === source) {
            setSelectedSource(null);
        } else {
            setSelectedSource(source);

            // If a target is already selected, create the mapping
            if (selectedTarget) {
                setMappings([...mappings, { sourceField: source, targetField: selectedTarget }]);
                setSelectedSource(null);
                setSelectedTarget(null);
            }
        }
    };

    // Handle selecting a target field
    const handleSelectTarget = (target: string) => {
        if (selectedTarget === target) {
            setSelectedTarget(null);
        } else {
            setSelectedTarget(target);

            // If a source is already selected, create the mapping
            if (selectedSource) {
                setMappings([...mappings, { sourceField: selectedSource, targetField: target }]);
                setSelectedSource(null);
                setSelectedTarget(null);
            }
        }
    };

    const handleRemoveMapping = (index: number) => {
        setMappings(mappings.filter((_, i) => i !== index));
    };

    // Apply mappings to templates' field.sourceMapping
    const applyMappingsToTemplates = (): CredentialTemplate[] => {
        return templates.map(template => {
            if (template.id !== selectedTemplate) return template;

            return {
                ...template,
                isDirty: true,
                fields: template.fields.map(field => {
                    const mapping = mappings.find(m => m.targetField === field.name);
                    return {
                        ...field,
                        sourceMapping: mapping?.sourceField || field.sourceMapping,
                    };
                }),
            };
        });
    };

    // Save templates with mappings back to boosts
    const saveTemplatesToBoosts = useCallback(async (updatedTemplates: CredentialTemplate[]) => {
        if (!integrationId) return;

        const wallet = await initWalletRef.current();

        for (const template of updatedTemplates) {
            if (!template.boostUri) continue;

            const boostMeta: TemplateBoostMeta = {
                integrationId,
                templateConfig: {
                    fields: template.fields,
                    achievementType: template.achievementType,
                    version: TEMPLATE_META_VERSION,
                },
            };

            try {
                await wallet.invoke.updateBoost(template.boostUri, {
                    meta: boostMeta,
                } as Parameters<typeof wallet.invoke.updateBoost>[1]);
            } catch (err) {
                console.error('Failed to update boost with mappings:', err);
                throw err;
            }
        }
    }, [integrationId]);

    // Handle save and continue
    const handleSaveAndContinue = async () => {
        setIsSaving(true);

        try {
            const updatedTemplates = applyMappingsToTemplates();

            // Save mappings to boosts
            await saveTemplatesToBoosts(updatedTemplates);

            presentToast('Field mappings saved!', { type: ToastTypeEnum.Success, hasDismissButton: true });

            onComplete(
                { webhookUrl, samplePayload: samplePayload || undefined, mappings },
                updatedTemplates
            );
        } catch (err) {
            console.error('Failed to save mappings:', err);
            presentToast('Failed to save mappings', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setIsSaving(false);
        }
    };

    const canProceed = integrationMethod === 'csv' || integrationMethod === 'api' || (samplePayload && mappings.length > 0);

    // Render based on integration method
    if (integrationMethod === 'api') {
        return (
            <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                    <Zap className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />

                    <div className="text-sm text-violet-800">
                        <p className="font-medium mb-1">API Integration</p>
                        <p>
                            Use the LearnCard SDK to issue credentials programmatically. 
                            You have full control over when and how credentials are issued.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-medium text-gray-800">Issue a Credential</h3>

                    <CodeBlock
                        code={`import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ 
    apiKey: process.env.LEARNCARD_API_KEY,
    network: true 
});

// Issue credential when course is completed
async function issueCourseCredential(userId, courseData) {
    const credential = await learnCard.invoke.issueCredential({
        type: 'OpenBadgeCredential',
        recipient: userId,
        templateId: '${templates[0]?.id || 'your_template_id'}',
        data: {
            courseName: courseData.title,
            completionDate: new Date().toISOString(),
            grade: courseData.grade,
        }
    });
    
    return credential;
}`}
                    />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <button
                        onClick={() => onComplete({ mappings: [], webhookUrl: undefined }, templates)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                    >
                        Continue to Testing
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    if (integrationMethod === 'csv') {
        return (
            <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

                    <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">CSV Upload</p>
                        <p>
                            Download a template CSV file, fill it with your completion data, 
                            and upload it to issue credentials in bulk.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-medium text-gray-800">CSV Template</h3>

                    <p className="text-sm text-gray-600">
                        Your CSV should include the following columns based on your credential template:
                    </p>

                    <div className="p-4 bg-gray-50 rounded-xl">
                        <code className="text-sm text-gray-700">
                            {templates[0]?.fields.map(f => f.name.toLowerCase().replace(/\s+/g, '_')).join(', ') || 'recipient_name, issue_date'}
                        </code>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors">
                        Download CSV Template
                    </button>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <button
                        onClick={() => onComplete({ mappings: [], webhookUrl: undefined }, templates)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                    >
                        Continue to Testing
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // Webhook integration (default)
    return (
        <div className="space-y-6">
            {/* Webhook URL */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <GitMerge className="w-5 h-5 text-emerald-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">Your Webhook URL</h3>
                        <p className="text-sm text-gray-500">Configure this in your LMS settings</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl">
                    <code className="flex-1 text-sm text-gray-600 font-mono truncate">
                        {webhookUrl}
                    </code>

                    <button
                        onClick={handleCopyUrl}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {copiedUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Sample Payload / Simulate */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FileJson className="w-5 h-5 text-blue-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">Capture Sample Event</h3>
                        <p className="text-sm text-gray-500">Send a test event from your LMS or simulate one</p>
                    </div>
                </div>

                {!samplePayload ? (
                    <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center">
                        {isWaiting ? (
                            <div className="space-y-3">
                                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
                                <p className="text-sm text-gray-600">Waiting for webhook event...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">
                                    Send a test "course completed" event from your LMS, or click below to simulate one.
                                </p>

                                <button
                                    onClick={handleSimulateWebhook}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Simulate Test Event
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                            <Check className="w-4 h-4" />
                            Event captured successfully!
                        </div>

                        <div className="p-4 bg-gray-900 rounded-xl overflow-x-auto">
                            <pre className="text-xs text-gray-300">
                                {JSON.stringify(samplePayload, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            {/* Field Mapping */}
            {samplePayload && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                            <GitMerge className="w-5 h-5 text-violet-600" />
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-800">Map Fields</h3>
                            <p className="text-sm text-gray-500">Connect your data to credential fields</p>
                        </div>
                    </div>

                    {templates.length > 1 && (
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        >
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    )}

                    {/* Current Mappings */}
                    {mappings.length > 0 && (
                        <div className="space-y-2">
                            {mappings.map((mapping, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg"
                                >
                                    <code className="text-sm text-gray-700">{mapping.sourceField}</code>

                                    <ChevronRight className="w-4 h-4 text-gray-400" />

                                    <code className="text-sm text-emerald-700 font-medium">{mapping.targetField}</code>

                                    <button
                                        onClick={() => handleRemoveMapping(idx)}
                                        className="ml-auto p-1 text-gray-400 hover:text-red-500 rounded"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Link2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <p className="text-xs text-blue-800">
                            <strong>How to map:</strong> Click a source field on the left, then click a target field on the right to connect them. 
                            You can select them in any order.
                        </p>
                    </div>

                    {/* Two-column selection UI */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                                Source Fields (Your Data)
                                {selectedSource && <span className="ml-2 text-cyan-600">→ Select target</span>}
                            </label>

                            <div className="space-y-1 max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                {sourceFields
                                    .filter(f => !mappings.some(m => m.sourceField === f))
                                    .map(field => {
                                        const isSelected = selectedSource === field;
                                        return (
                                            <button
                                                key={field}
                                                onClick={() => handleSelectSource(field)}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                                                    isSelected
                                                        ? 'bg-cyan-500 text-white shadow-md'
                                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                <code className={isSelected ? 'text-white' : 'text-gray-700'}>{field}</code>
                                            </button>
                                        );
                                    })}

                                {sourceFields.filter(f => !mappings.some(m => m.sourceField === f)).length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-2">All source fields mapped</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                                Target Fields (Credential)
                                {selectedTarget && <span className="ml-2 text-cyan-600">← Select source</span>}
                            </label>

                            <div className="space-y-1 max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                {targetFields
                                    .filter(f => !mappings.some(m => m.targetField === f))
                                    .map(field => {
                                        const isSelected = selectedTarget === field;
                                        return (
                                            <button
                                                key={field}
                                                onClick={() => handleSelectTarget(field)}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                                                    isSelected
                                                        ? 'bg-emerald-500 text-white shadow-md'
                                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                                }`}
                                            >
                                                <code className={isSelected ? 'text-white' : 'text-emerald-700'}>{field}</code>
                                            </button>
                                        );
                                    })}

                                {targetFields.filter(f => !mappings.some(m => m.targetField === f)).length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-2">All target fields mapped</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Selection hint */}
                    {(selectedSource || selectedTarget) && (
                        <div className="flex items-center justify-center gap-2 p-2 bg-cyan-50 rounded-lg text-sm text-cyan-700">
                            {selectedSource && <code className="bg-cyan-500 text-white px-2 py-0.5 rounded">{selectedSource}</code>}
                            {selectedSource && selectedTarget && <ChevronRight className="w-4 h-4" />}
                            {selectedTarget && <code className="bg-emerald-500 text-white px-2 py-0.5 rounded">{selectedTarget}</code>}
                            {(selectedSource && !selectedTarget) && <span>Now select a target field →</span>}
                            {(selectedTarget && !selectedSource) && <span>← Now select a source field</span>}
                        </div>
                    )}

                    {/* Unmapped warning */}
                    {targetFields.filter(f => !mappings.some(m => m.targetField === f)).length > 0 && mappings.length > 0 && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800">
                                {targetFields.filter(f => !mappings.some(m => m.targetField === f)).length} credential field(s) still need to be mapped.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={handleSaveAndContinue}
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
