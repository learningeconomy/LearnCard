import React, { useState } from 'react';
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
} from 'lucide-react';

import { PartnerProject, BrandingConfig, CredentialTemplate, DataMappingConfig } from '../types';

interface SandboxTestStepProps {
    project: PartnerProject;
    branding: BrandingConfig;
    templates: CredentialTemplate[];
    dataMapping: DataMappingConfig;
    onComplete: () => void;
    onBack: () => void;
}

type TestStatus = 'idle' | 'sending' | 'success' | 'error';

export const SandboxTestStep: React.FC<SandboxTestStepProps> = ({
    project,
    branding,
    templates,
    dataMapping,
    onComplete,
    onBack,
}) => {
    const [testEmail, setTestEmail] = useState('');
    const [testStatus, setTestStatus] = useState<TestStatus>('idle');
    const [testResult, setTestResult] = useState<{
        credentialId?: string;
        error?: string;
    } | null>(null);

    const handleSendTest = async () => {
        if (!testEmail.trim()) return;

        setTestStatus('sending');
        setTestResult(null);

        // Simulate sending a test credential
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Simulate success (in real implementation, this would call the API)
        setTestStatus('success');
        setTestResult({
            credentialId: `cred_${Date.now().toString(36)}`,
        });
    };

    const handleRetry = () => {
        setTestStatus('idle');
        setTestResult(null);
    };

    return (
        <div className="space-y-6">
            {/* Info */}
            <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                <TestTube2 className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />

                <div className="text-sm text-violet-800">
                    <p className="font-medium mb-1">Sandbox Testing</p>
                    <p>
                        Let's make sure everything works before going live. Send yourself a test 
                        credential to verify your configuration is correct.
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
                        <p className="font-medium text-gray-800">{branding.issuerName}</p>
                    </div>

                    <div>
                        <p className="text-gray-500">Templates</p>
                        <p className="font-medium text-gray-800">{templates.length} configured</p>
                    </div>

                    <div>
                        <p className="text-gray-500">Field Mappings</p>
                        <p className="font-medium text-gray-800">{dataMapping.mappings.length} mapped</p>
                    </div>
                </div>
            </div>

            {/* Test Credential Preview */}
            <div className="p-4 border border-gray-200 rounded-xl">
                <h3 className="font-medium text-gray-800 mb-3">Test Credential Preview</h3>

                <div
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: branding.secondaryColor }}
                >
                    <div className="flex items-start gap-4">
                        {branding.logoUrl ? (
                            <img
                                src={branding.logoUrl}
                                alt="Logo"
                                className="w-16 h-16 object-contain rounded-lg bg-white"
                            />
                        ) : (
                            <div
                                className="w-16 h-16 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: branding.primaryColor }}
                            >
                                <Award className="w-8 h-8 text-white" />
                            </div>
                        )}

                        <div className="flex-1">
                            <p className="font-semibold text-gray-800">
                                {templates[0]?.name || 'Course Completion Certificate'}
                            </p>

                            <p className="text-sm text-gray-600 mb-2">
                                Issued by {branding.issuerName}
                            </p>

                            <div className="flex flex-wrap gap-2 text-xs">
                                {templates[0]?.fields.slice(0, 3).map(field => (
                                    <span
                                        key={field.id}
                                        className="px-2 py-1 bg-white/50 rounded"
                                    >
                                        {field.name}: <span className="text-gray-500">[Sample Data]</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Send Test */}
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
                                    disabled={!testEmail.trim()}
                                    className="flex items-center gap-2 px-6 py-3 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                    Send Test
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500">
                            We'll issue a test credential and send it to this email address. 
                            You can view it in the LearnCard wallet or via the email link.
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
