/**
 * TestingTab - Sandbox Test Credential Sender
 * 
 * Allows developers to send test credentials to verify their integration works.
 * Mirrors functionality from SandboxTestStep for dashboard use.
 */

import React, { useState, useMemo } from 'react';
import {
    TestTube2,
    Send,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Mail,
    Award,
    RefreshCw,
    FileStack,
    ChevronDown,
    Sparkles,
    Zap,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import type { CredentialTemplate, BrandingConfig } from '../types';
import { useTemplateDetails } from '../hooks/useTemplateDetails';
import { 
    extractDynamicVariables, 
    OBv3CredentialTemplate,
} from '../../partner-onboarding/components/CredentialBuilder';
import { fieldNameToVariable } from '../../partner-onboarding/types';

interface TestingTabProps {
    integration: LCNIntegration;
    templates: CredentialTemplate[];
    branding?: BrandingConfig | null;
}

type TestStatus = 'idle' | 'sending' | 'success' | 'error';

type ExtendedTemplate = CredentialTemplate & {
    obv3Template?: OBv3CredentialTemplate;
    isMasterTemplate?: boolean;
    parentTemplateId?: string;
    childTemplates?: ExtendedTemplate[];
};

// Generate smart sample data based on variable name
const getSampleValue = (varName: string): string => {
    const lower = varName.toLowerCase();

    if (lower.includes('email')) return 'jane.doe@example.com';
    if (lower.includes('date') && lower.includes('issue')) return new Date().toISOString();
    if (lower.includes('date') && lower.includes('complet')) return new Date().toISOString();
    if (lower.includes('date') && lower.includes('expir')) {
        const future = new Date();
        future.setFullYear(future.getFullYear() + 2);
        return future.toISOString();
    }
    if (lower.includes('date')) return new Date().toISOString();
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

export const TestingTab: React.FC<TestingTabProps> = ({
    integration,
    templates: basicTemplates,
    branding,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    // Load full template details on-demand (not loaded by dashboard for performance)
    const { templates, isLoading: isLoadingTemplates } = useTemplateDetails(integration.id, basicTemplates);

    const [testEmail, setTestEmail] = useState('');
    const [testStatus, setTestStatus] = useState<TestStatus>('idle');
    const [testResult, setTestResult] = useState<{
        credentialId?: string;
        claimUrl?: string;
        error?: string;
    } | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    // Get issuable templates (exclude master templates, include children)
    const issuableTemplates = useMemo(() => {
        const result: ExtendedTemplate[] = [];

        (templates as ExtendedTemplate[]).forEach(t => {
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
        (templates as ExtendedTemplate[]).filter(t => t.isMasterTemplate).length
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

        return selectedTemplate.fields?.map(f => f.variableName || fieldNameToVariable(f.name || f.label || f.key || '')).filter((v): v is string => Boolean(v)) || [];
    }, [selectedTemplate]);

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

            // Use unified send() - auto-detects email recipient and handles templating
            const result = await wallet.invoke.send?.({
                type: 'boost',
                recipient: testEmail,
                templateUri: selectedTemplate.boostUri,
                templateData,
                integrationId: integration.id,
                options: {
                    branding: {
                        issuerName: branding?.displayName || integration.name,
                        issuerLogoUrl: branding?.image,
                        recipientName: templateData.recipient_name || 'Test Recipient',
                    },
                },
            });

            setTestStatus('success');
            setTestResult({
                credentialId: result?.inbox?.issuanceId || result?.credentialUri || `test_${Date.now().toString(36)}`,
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

    // Show loading state while fetching full template details
    if (isLoadingTemplates) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    if (issuableTemplates.length === 0) {
        return (
            <div className="text-center py-12">
                <TestTube2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No templates to test</p>
                <p className="text-sm text-gray-400 mt-1">Create and save templates first to test credential issuance</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Test Credential Issuance</h2>
                <p className="text-sm text-gray-500">Send a test credential to verify your integration works</p>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                <TestTube2 className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-violet-800">
                    <p className="font-medium mb-1">Sandbox Testing</p>
                    <p>
                        Send a test credential to your own email to verify everything is configured correctly.
                        Sample data will be used for dynamic fields.
                    </p>
                </div>
            </div>

            {/* Warning if templates not saved */}
            {hasUnsavedTemplates && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                        <p className="font-medium">Some templates not saved</p>
                        <p className="text-amber-700 mt-0.5">
                            Save your templates first to be able to test them. Only saved templates can be used for testing.
                        </p>
                    </div>
                </div>
            )}

            {/* Template Selector */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                    Select Template to Test
                </label>

                <div className="relative">
                    <button
                        onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                        className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                    >
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                            <Award className="w-5 h-5 text-cyan-600" />
                        </div>

                        <div className="flex-1 text-left">
                            <p className="font-medium text-gray-800">
                                {selectedTemplate?.name || 'Select a template'}
                            </p>
                            {selectedTemplate?.boostUri ? (
                                <p className="text-xs text-emerald-600">Ready to test</p>
                            ) : (
                                <p className="text-xs text-amber-600">Not saved yet</p>
                            )}
                        </div>

                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showTemplateSelector ? 'rotate-180' : ''}`} />
                    </button>

                    {showTemplateSelector && (
                        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                            {issuableTemplates.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => {
                                        setSelectedTemplateId(template.id);
                                        setShowTemplateSelector(false);
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                                        selectedTemplateId === template.id ? 'bg-cyan-50' : ''
                                    }`}
                                >
                                    <Award className={`w-4 h-4 ${
                                        selectedTemplateId === template.id ? 'text-cyan-600' : 'text-gray-400'
                                    }`} />

                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-gray-800 text-sm">{template.name}</p>
                                    </div>

                                    {template.boostUri ? (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">Saved</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">Unsaved</span>
                                    )}

                                    {selectedTemplateId === template.id && (
                                        <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {masterTemplateCount > 0 && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <FileStack className="w-3 h-3" />
                        {issuableTemplates.length} course boosts available from {masterTemplateCount} master template{masterTemplateCount !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            {/* Template Data Preview */}
            {selectedTemplate && templateVariables.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-violet-500" />
                        <label className="text-sm font-medium text-gray-700">
                            Sample Data Preview
                        </label>
                    </div>

                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                        {templateVariables.map(varName => (
                            <div key={varName} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                    {varName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </span>
                                <code className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-700">
                                    {getSampleValue(varName)}
                                </code>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Email Input */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                    Test Recipient Email
                </label>

                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                </div>

                <p className="text-xs text-gray-500">
                    We'll send a test credential to this email so you can verify the claim flow works.
                </p>
            </div>

            {/* Send Button / Result */}
            {testStatus === 'idle' && (
                <button
                    onClick={handleSendTest}
                    disabled={!canTest || !testEmail.trim() || !selectedTemplate?.boostUri}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Send className="w-5 h-5" />
                    Send Test Credential
                </button>
            )}

            {testStatus === 'sending' && (
                <div className="flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 rounded-xl">
                    <Loader2 className="w-5 h-5 text-cyan-600 animate-spin" />
                    <span className="text-gray-700 font-medium">Sending test credential...</span>
                </div>
            )}

            {testStatus === 'success' && testResult && (
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-emerald-800">Test credential sent!</p>
                            <p className="text-sm text-emerald-700 mt-1">
                                Check your email at <strong>{testEmail}</strong> for the claim link.
                            </p>
                            {testResult.credentialId && (
                                <p className="text-xs text-emerald-600 mt-2 font-mono">
                                    ID: {testResult.credentialId}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleRetry}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Send Another
                        </button>
                    </div>
                </div>
            )}

            {testStatus === 'error' && testResult && (
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-red-800">Failed to send test credential</p>
                            <p className="text-sm text-red-700 mt-1">
                                {testResult.error || 'An unknown error occurred'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleRetry}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            )}

            {/* Tips */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-gray-700">Testing Tips</span>
                </div>

                <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span>Use your own email to see exactly what recipients will receive</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span>Check that branding, credential name, and data appear correctly</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span>Complete the claim flow to verify the full experience</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};
