import React, { useState } from 'react';
import {
    Copy,
    Check,
    Code,
    Webhook,
    FileSpreadsheet,
    Zap,
    ExternalLink,
    Plug,
    Globe,
    Rocket,
    ToggleLeft,
    ToggleRight,
    AlertTriangle,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';
import { useDeveloperPortal } from '../../useDeveloperPortal';

interface IntegrationSettingsTabProps {
    integration: LCNIntegration;
    onStatusChange?: (status: 'active' | 'setup') => void;
}

type IntegrationMethod = 'api' | 'csv' | 'webhook';

interface MethodOption {
    id: IntegrationMethod;
    title: string;
    subtitle: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    color: string;
    bgColor: string;
    features: string[];
    recommended?: boolean;
    comingSoon?: boolean;
}

const METHODS: MethodOption[] = [
    {
        id: 'api',
        title: 'REST API',
        subtitle: 'Full control',
        description: 'Call our API directly from your backend code when you want to issue credentials.',
        icon: Code,
        color: 'text-violet-600',
        bgColor: 'bg-violet-100',
        features: [
            'Complete programmatic control',
            'Custom business logic',
            'Batch operations supported',
            'SDK available for Node.js',
        ],
        recommended: true,
    },
    {
        id: 'csv',
        title: 'CSV Upload',
        subtitle: 'Simple batch import',
        description: 'Upload a spreadsheet of completions and we\'ll issue credentials in bulk.',
        icon: FileSpreadsheet,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        features: [
            'No technical integration needed',
            'Great for initial migration',
            'Scheduled uploads supported',
            'Template download available',
        ],
    },
    {
        id: 'webhook',
        title: 'Webhook Integration',
        subtitle: 'Real-time, automated',
        description: 'Your system sends events to LearnCard when courses are completed.',
        icon: Webhook,
        color: 'text-gray-400',
        bgColor: 'bg-gray-100',
        features: [
            'Real-time credential issuance',
            'No manual intervention needed',
            'Works with most platforms',
        ],
        comingSoon: true,
    },
];

export const IntegrationSettingsTab: React.FC<IntegrationSettingsTabProps> = ({ integration, onStatusChange }) => {
    const { presentToast } = useToast();
    const { useUpdateIntegration } = useDeveloperPortal();
    const updateIntegrationMutation = useUpdateIntegration();

    const [copied, setCopied] = useState<string | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const isLive = integration.status === 'active';

    const copyValue = async (value: string, id: string) => {
        await navigator.clipboard.writeText(value);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
        presentToast('Copied!', { hasDismissButton: true });
    };

    const handleToggleLive = () => {
        if (!isLive) {
            setShowConfirmation(true);
        }
    };

    const handleConfirmGoLive = async () => {
        setShowConfirmation(false);
        setIsUpdatingStatus(true);

        try {
            await updateIntegrationMutation.mutateAsync({
                id: integration.id,
                updates: {
                    status: 'active',
                    guideState: {
                        ...(integration.guideState as Record<string, unknown> || {}),
                        completedAt: new Date().toISOString(),
                    },
                },
            });

            presentToast('Integration is now live!', { type: ToastTypeEnum.Success, hasDismissButton: true });
            onStatusChange?.('active');
        } catch (error) {
            console.error('Failed to go live:', error);
            presentToast('Failed to activate integration', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Integration Settings</h2>
                <p className="text-sm text-gray-500">API keys and configuration for your integration</p>
            </div>

            {/* Go Live Status Banner */}
            {isLive ? (
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />

                    <div className="flex-1">
                        <p className="font-medium text-emerald-800">Integration is Live!</p>
                        <p className="text-sm text-emerald-700 mt-1">
                            Your integration is active and ready to issue credentials.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-emerald-700">Live</span>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

                    <div className="flex-1">
                        <p className="font-medium text-amber-800">Test Mode Active</p>
                        <p className="text-sm text-amber-700 mt-1">
                            Your integration is in test mode. Toggle to live mode when you're ready to start issuing real credentials.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 rounded-full">
                        <span className="w-2 h-2 bg-amber-500 rounded-full" />
                        <span className="text-sm font-medium text-amber-700">Test</span>
                    </div>
                </div>
            )}

            {/* Live Toggle */}
            <div className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isLive ? 'bg-emerald-100' : 'bg-gray-100'
                        }`}>
                            <Rocket className={`w-5 h-5 ${isLive ? 'text-emerald-600' : 'text-gray-500'}`} />
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-800">Production Mode</h3>
                            <p className="text-sm text-gray-500">
                                {isLive ? 'Credentials are being issued to real users' : 'Click to activate your integration'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleToggleLive}
                        disabled={isLive || isUpdatingStatus}
                        className={`p-1 rounded-full transition-colors ${
                            isLive || isUpdatingStatus ? 'cursor-default' : 'hover:bg-gray-100'
                        }`}
                    >
                        {isUpdatingStatus ? (
                            <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
                        ) : isLive ? (
                            <ToggleRight className="w-12 h-12 text-emerald-500" />
                        ) : (
                            <ToggleLeft className="w-12 h-12 text-gray-400" />
                        )}
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Rocket className="w-6 h-6 text-emerald-600" />
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-800">Go Live?</h3>
                                <p className="text-sm text-gray-500">This will activate your integration</p>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />

                                <p className="text-sm text-amber-800">
                                    Once live, your system will start issuing real credentials to users. 
                                    Make sure you've completed testing.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleConfirmGoLive}
                                className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                            >
                                Go Live
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* API Keys Section */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                        <Plug className="w-5 h-5 text-cyan-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">API Credentials</h3>
                        <p className="text-sm text-gray-500">Use these to authenticate with LearnCard</p>
                    </div>
                </div>

                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-cyan-800">Publishable Key</label>

                        <button
                            onClick={() => copyValue(integration.publishableKey, 'key')}
                            className="text-xs text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
                        >
                            {copied === 'key' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied === 'key' ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    <div className="px-3 py-2 bg-white border border-cyan-200 rounded-lg font-mono text-sm text-gray-700 break-all">
                        {integration.publishableKey}
                    </div>

                    <p className="text-xs text-cyan-700 mt-2">
                        Safe to use in client-side code. Used for embed SDK and public API calls.
                    </p>
                </div>

                <div className="p-4 bg-gray-100 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Integration ID</label>

                        <button
                            onClick={() => copyValue(integration.id, 'id')}
                            className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                        >
                            {copied === 'id' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied === 'id' ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    <p className="font-mono text-sm text-gray-600">{integration.id}</p>
                </div>
            </div>

            {/* Whitelisted Domains */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Globe className="w-5 h-5 text-emerald-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">Whitelisted Domains</h3>
                        <p className="text-sm text-gray-500">Domains allowed to use your publishable key</p>
                    </div>
                </div>

                {integration.whitelistedDomains && integration.whitelistedDomains.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {integration.whitelistedDomains.map((domain, i) => (
                            <span key={i} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700">
                                {domain}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No domains whitelisted. All domains are allowed.</p>
                )}
            </div>

            {/* Integration Methods */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5 text-violet-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">Integration Methods</h3>
                        <p className="text-sm text-gray-500">Ways to issue credentials</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {METHODS.map((method) => {
                        const Icon = method.icon;

                        return (
                            <div
                                key={method.id}
                                className={`p-4 rounded-xl border ${
                                    method.comingSoon
                                        ? 'border-gray-200 bg-gray-50 opacity-60'
                                        : 'border-gray-200 bg-white'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 ${method.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`w-5 h-5 ${method.color}`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-gray-800">{method.title}</h4>

                                            {method.recommended && (
                                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                                                    Recommended
                                                </span>
                                            )}

                                            {method.comingSoon && (
                                                <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded">
                                                    Coming Soon
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-gray-500 mt-1">{method.subtitle}</p>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 mt-3">{method.description}</p>

                                <div className="mt-3 flex flex-wrap gap-1">
                                    {method.features.slice(0, 2).map((feature, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                                        >
                                            <Check className="w-3 h-3" />
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Documentation Link */}
            <a
                href="https://docs.learncard.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-xl text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 transition-colors"
            >
                <ExternalLink className="w-5 h-5" />
                <span className="font-medium">View API Documentation</span>
            </a>
        </div>
    );
};
