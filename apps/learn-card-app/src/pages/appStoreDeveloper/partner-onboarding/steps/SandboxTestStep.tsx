import React, { useState, useMemo } from 'react';
import {
    TestTube2,
    ArrowRight,
    ArrowLeft,
    Send,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Mail,
    ExternalLink,
    Award,
    RefreshCw,
    Code,
    FileSpreadsheet,
    Webhook,
    FileStack,
    ChevronDown,
    Sparkles,
} from 'lucide-react';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import { PartnerProject, BrandingConfig, CredentialTemplate, DataMappingConfig, IntegrationMethod, fieldNameToVariable } from '../types';
import { extractDynamicVariables, OBv3CredentialTemplate } from '../components/CredentialBuilder';

interface SandboxTestStepProps {
    project: PartnerProject;
    branding: BrandingConfig;
    templates: CredentialTemplate[];
    integrationMethod: IntegrationMethod;
    dataMapping: DataMappingConfig;
    onComplete: () => void;
    onBack: () => void;
}

type TestStatus = 'idle' | 'sending' | 'success' | 'error';

// Generate smart sample data based on variable name
const getSampleValue = (varName: string): string => {
    const lower = varName.toLowerCase();

    if (lower.includes('email')) return 'jane.doe@example.com';
    if (lower.includes('date') && lower.includes('issue')) return new Date().toISOString().split('T')[0];
    if (lower.includes('date') && lower.includes('complet')) return new Date().toISOString().split('T')[0];
    if (lower.includes('date') && lower.includes('expir')) {
        const future = new Date();
        future.setFullYear(future.getFullYear() + 2);
        return future.toISOString().split('T')[0];
    }
    if (lower.includes('date')) return new Date().toISOString().split('T')[0];
    if (lower.includes('score') || lower.includes('grade')) return '95';
    if (lower.includes('credits') || lower.includes('hours')) return '3';
    if (lower.includes('recipient') && lower.includes('name')) return 'Jane Doe';
    if (lower.includes('student') && lower.includes('name')) return 'Jane Doe';
    if (lower.includes('learner') && lower.includes('name')) return 'Jane Doe';
    if (lower.includes('instructor') || lower.includes('teacher')) return 'Dr. Smith';
    if (lower.includes('course') && lower.includes('name')) return 'Introduction to Web Development';
    if (lower.includes('course') && lower.includes('id')) return 'CS101';
    if (lower.includes('department')) return 'Computer Science';
    if (lower.includes('name')) return 'Sample Name';
    if (lower.includes('description')) return 'Successfully completed all requirements';

    return 'Sample Value';
};

export const SandboxTestStep: React.FC<SandboxTestStepProps> = ({
    project,
    branding,
    templates,
    integrationMethod,
    dataMapping,
    onComplete,
    onBack,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const [testEmail, setTestEmail] = useState('');
    const [testStatus, setTestStatus] = useState<TestStatus>('idle');
    const [testResult, setTestResult] = useState<{
        credentialId?: string;
        claimUrl?: string;
        error?: string;
    } | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    // Get issuable templates (exclude master templates)
    const issuableTemplates = useMemo(() => {
        const result: CredentialTemplate[] = [];

        templates.forEach(t => {
            if (t.isMasterTemplate && t.childTemplates?.length) {
                result.push(...t.childTemplates);
            } else if (!t.isMasterTemplate) {
                result.push(t);
            }
        });

        return result;
    }, [templates]);

    // Count master templates
    const masterTemplateCount = useMemo(() => 
        templates.filter(t => t.isMasterTemplate).length
    , [templates]);

    // Selected template for testing
    const selectedTemplate = useMemo(() => {
        if (selectedTemplateId) {
            return issuableTemplates.find(t => t.id === selectedTemplateId);
        }
        return issuableTemplates[0];
    }, [issuableTemplates, selectedTemplateId]);

    // Get template variables for preview
    const templateVariables = useMemo(() => {
        if (!selectedTemplate) return [];

        if (selectedTemplate.obv3Template) {
            try {
                return extractDynamicVariables(selectedTemplate.obv3Template as OBv3CredentialTemplate);
            } catch (e) {
                // fallback
            }
        }

        return selectedTemplate.fields?.map(f => f.variableName || fieldNameToVariable(f.name)) || [];
    }, [selectedTemplate]);

    // Integration method display
    const integrationMethodDisplay = {
        api: { icon: Code, label: 'API Integration', color: 'violet' },
        csv: { icon: FileSpreadsheet, label: 'CSV Upload', color: 'amber' },
        webhook: { icon: Webhook, label: 'Webhook', color: 'emerald' },
    }[integrationMethod];

    const handleSendTest = async () => {
        if (!testEmail.trim() || !selectedTemplate?.boostUri) {
            presentToast('Please enter an email and select a template with a saved boost', { 
                type: ToastTypeEnum.Error 
            });
            return;
        }

        setTestStatus('sending');
        setTestResult(null);

        try {
            const wallet = await initWallet();

            // Build template data with sample values
            const templateData: Record<string, string> = {};
            templateVariables.forEach(varName => {
                templateData[varName] = getSampleValue(varName);
            });

            // Fetch and render the boost template
            const boostCredential = await wallet.invoke.resolveFromLCN?.(selectedTemplate.boostUri);

            if (!boostCredential) {
                throw new Error('Could not fetch boost template');
            }

            // Render with Mustache
            const Mustache = await import('mustache');
            const renderedCredential = JSON.parse(
                Mustache.default.render(JSON.stringify(boostCredential), templateData)
            );

            console.log("Rendered credential", renderedCredential);
            renderedCredential.credentialSubject.id = wallet.id.did()
            // Send via inbox
            const result = await wallet.invoke.sendCredentialViaInbox?.({
                recipient: { type: 'email', value: testEmail },
                credential: renderedCredential,
                configuration: {
                    delivery: {
                        suppress: false,
                        template: {
                            model: {
                                issuer: { name: branding.displayName },
                                recipient: { name: templateData.recipient_name || 'Test Recipient' },
                            },
                        },
                    },
                },
            });

            setTestStatus('success');
            setTestResult({
                credentialId: result?.issuanceId || `test_${Date.now().toString(36)}`,
            });

            presentToast('Test credential sent successfully!', { type: ToastTypeEnum.Success });
        } catch (err) {
            console.error('Test send failed:', err);
            setTestStatus('error');
            setTestResult({
                error: err instanceof Error ? err.message : 'Failed to send test credential',
            });
        }
    };

    const handleRetry = () => {
        setTestStatus('idle');
        setTestResult(null);
    };

    // Check if we can test
    const canTest = issuableTemplates.length > 0 && issuableTemplates.some(t => t.boostUri);
    const hasUnsavedTemplates = issuableTemplates.some(t => !t.boostUri);

    return (
        <div className="space-y-6">
            {/* Info */}
            <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                <TestTube2 className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />

                <div className="text-sm text-violet-800">
                    <p className="font-medium mb-1">Sandbox Testing</p>
                    <p>
                        Let's make sure everything works before going live. Send yourself a test 
                        credential to verify your templates are configured correctly.
                    </p>
                </div>
            </div>

            {/* Configuration Summary */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <h3 className="font-medium text-gray-800">Configuration Summary</h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500">Project</p>
                        <p className="font-medium text-gray-800">{project.name}</p>
                    </div>

                    <div>
                        <p className="text-gray-500">Issuer</p>
                        <p className="font-medium text-gray-800">{branding.displayName || 'Not set'}</p>
                    </div>

                    <div>
                        <p className="text-gray-500">Integration</p>
                        <div className="flex items-center gap-1.5">
                            {integrationMethodDisplay && (
                                <integrationMethodDisplay.icon className={`w-4 h-4 text-${integrationMethodDisplay.color}-500`} />
                            )}
                            <p className="font-medium text-gray-800">{integrationMethodDisplay?.label}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-gray-500">Templates</p>
                        <p className="font-medium text-gray-800">
                            {issuableTemplates.length} issuable
                            {masterTemplateCount > 0 && (
                                <span className="text-gray-500 font-normal">
                                    {' '}({masterTemplateCount} master)
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Warning if no templates or unsaved */}
            {!canTest && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                        <p className="font-medium">Templates need to be saved first</p>
                        <p className="mt-1">
                            Go back to the Templates step and save your templates before testing.
                        </p>
                    </div>
                </div>
            )}

            {hasUnsavedTemplates && canTest && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                        Some templates haven't been saved yet. Only saved templates can be tested.
                    </p>
                </div>
            )}

            {/* Template Selector (if multiple) */}
            {canTest && issuableTemplates.filter(t => t.boostUri).length > 1 && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Select Template to Test
                    </label>

                    <button
                        onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                        className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Award className="w-5 h-5 text-violet-500" />
                            <span className="font-medium text-gray-800">
                                {selectedTemplate?.name || 'Select a template'}
                            </span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showTemplateSelector ? 'rotate-180' : ''}`} />
                    </button>

                    {showTemplateSelector && (
                        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-48 overflow-y-auto">
                            {issuableTemplates.filter(t => t.boostUri).map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => {
                                        setSelectedTemplateId(template.id);
                                        setShowTemplateSelector(false);
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors ${
                                        selectedTemplate?.id === template.id ? 'bg-violet-50' : ''
                                    }`}
                                >
                                    <Award className={`w-4 h-4 ${selectedTemplate?.id === template.id ? 'text-violet-500' : 'text-gray-400'}`} />
                                    <span className={selectedTemplate?.id === template.id ? 'text-violet-700 font-medium' : 'text-gray-700'}>
                                        {template.name}
                                    </span>
                                    {selectedTemplate?.id === template.id && (
                                        <CheckCircle2 className="w-4 h-4 text-violet-500 ml-auto" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Test Credential Preview */}
            {canTest && selectedTemplate && (
                <div className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-800">Test Credential Preview</h3>
                        <span className="flex items-center gap-1 text-xs text-violet-600 bg-violet-100 px-2 py-1 rounded-full">
                            <Sparkles className="w-3 h-3" />
                            Sample Data
                        </span>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-violet-50 to-cyan-50 rounded-xl border border-violet-100">
                        <div className="flex items-start gap-4">
                            {branding.image ? (
                                <img
                                    src={branding.image}
                                    alt="Logo"
                                    className="w-14 h-14 object-contain rounded-lg bg-white p-1"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-violet-500">
                                    <Award className="w-7 h-7 text-white" />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 truncate">
                                    {selectedTemplate.name}
                                </p>

                                <p className="text-sm text-gray-600 mb-3">
                                    Issued by {branding.displayName || 'Your Organization'}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {templateVariables.slice(0, 4).map(varName => (
                                        <span
                                            key={varName}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-white/70 rounded text-xs"
                                        >
                                            <span className="text-gray-500">
                                                {varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                            </span>
                                            <span className="font-medium text-gray-700">
                                                {getSampleValue(varName)}
                                            </span>
                                        </span>
                                    ))}
                                    {templateVariables.length > 4 && (
                                        <span className="px-2 py-1 text-xs text-gray-500">
                                            +{templateVariables.length - 4} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Send Test */}
            {canTest && (
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-800">Send Test Credential</h3>

                    {testStatus === 'idle' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">
                                    Your Email Address
                                </label>

                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                                        <input
                                            type="email"
                                            value={testEmail}
                                            onChange={(e) => setTestEmail(e.target.value)}
                                            placeholder="you@company.com"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                                        />
                                    </div>

                                    <button
                                        onClick={handleSendTest}
                                        disabled={!testEmail.trim() || !selectedTemplate?.boostUri}
                                        className="flex items-center gap-2 px-6 py-3 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                        Send Test
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500">
                                We'll issue a test credential with sample data and send it to this email address. 
                                Check your inbox for a claim link to view the credential.
                            </p>
                        </div>
                    )}

                {testStatus === 'sending' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />

                        <div className="text-center">
                            <p className="font-medium text-gray-800">Issuing Test Credential...</p>
                            <p className="text-sm text-gray-500">This should only take a moment</p>
                        </div>
                    </div>
                )}

                {testStatus === 'success' && testResult && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />

                            <div className="flex-1">
                                <p className="font-medium text-emerald-800">Test Credential Issued!</p>
                                <p className="text-sm text-emerald-700 mt-1">
                                    A test credential has been sent to <strong>{testEmail}</strong>.
                                </p>

                                <p className="text-xs text-emerald-600 mt-2 font-mono">
                                    ID: {testResult.credentialId}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleRetry}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Send Another
                            </button>

                            <a
                                href="#"
                                className="flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View in Wallet
                            </a>
                        </div>
                    </div>
                )}

                {testStatus === 'error' && testResult?.error && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

                            <div className="flex-1">
                                <p className="font-medium text-red-800">Test Failed</p>
                                <p className="text-sm text-red-700 mt-1">{testResult.error}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleRetry}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
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
                    onClick={onComplete}
                    disabled={testStatus !== 'success'}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Continue to Go Live
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
