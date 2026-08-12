import * as m from '../../../../paraglide/messages.js';
import { TransP } from '../../../../i18n/TransP';
import { getLogger } from 'learn-card-base';
const log = getLogger('consent-flow-testing-tab');
/**
 * ConsentFlowTestingTab - Test consent redirect and credential sending
 *
 * Provides:
 * - Live consent URL preview with "Open Consent Flow" button
 * - Send test credential to a DID (from consent callback)
 * - Verify callback parameters
 */

import React, { useState, useMemo } from 'react';
import {
    TestTube2,
    Send,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ExternalLink,
    Award,
    RefreshCw,
    ChevronDown,
    Info,
    Link2,
    Code,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';

import type { CredentialTemplate } from '../types';
import { getAppBaseUrl } from '../../../../config/bootstrapTenantConfig';
import type { GuideState } from '../../guides/types';
import { useTemplateDetails } from '../hooks/useTemplateDetails';
import { CodeOutputPanel } from '../../guides/shared/CodeOutputPanel';

interface ConsentFlowTestingTabProps {
    integration: LCNIntegration;
    templates: CredentialTemplate[];
}

type TestStatus = 'idle' | 'sending' | 'success' | 'error';

export const ConsentFlowTestingTab: React.FC<ConsentFlowTestingTabProps> = ({
    integration,
    templates: basicTemplates,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const { templates, isLoading: isLoadingTemplates } = useTemplateDetails(
        integration.id,
        basicTemplates
    );

    const [testDid, setTestDid] = useState('');
    const [testStatus, setTestStatus] = useState<TestStatus>('idle');
    const [testResult, setTestResult] = useState<{
        credentialUri?: string;
        error?: string;
    } | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    // Pull saved config from integration's guide state
    const guideState = integration?.guideState as GuideState | undefined;
    const savedConfig = guideState?.config?.consentFlowConfig as
        | {
              contractUri?: string;
              redirectUrl?: string;
          }
        | undefined;

    const contractUri = savedConfig?.contractUri || '';
    const redirectUrl = savedConfig?.redirectUrl || '';

    const consentUrl = useMemo(() => {
        if (!contractUri) return '';
        const params = new URLSearchParams({ uri: contractUri });
        if (redirectUrl) params.set('returnTo', redirectUrl);
        return `${getAppBaseUrl()}/consent-flow?${params.toString()}`;
    }, [contractUri, redirectUrl]);

    // Get sendable templates
    const sendableTemplates = useMemo(() => templates.filter(t => t.boostUri), [templates]);

    const selectedTemplate = useMemo(() => {
        if (selectedTemplateId) return sendableTemplates.find(t => t.id === selectedTemplateId);
        return sendableTemplates[0];
    }, [sendableTemplates, selectedTemplateId]);

    const handleSendTest = async () => {
        if (!testDid.trim() || !selectedTemplate?.boostUri) {
            presentToast(
                m['developerPortal.dashboards.tabs.consentFlowTesting.enterDidAndTemplate'](),
                {
                    type: ToastTypeEnum.Error,
                }
            );
            return;
        }

        setTestStatus('sending');
        setTestResult(null);

        try {
            const wallet = await initWallet();

            const result = await wallet.invoke.send?.({
                type: 'boost',
                recipient: testDid.trim(),
                contractUri: contractUri || undefined,
                templateUri: selectedTemplate.boostUri,
                integrationId: integration.id,
            });

            setTestStatus('success');
            setTestResult({
                credentialUri: result?.credentialUri || result?.uri,
            });

            presentToast(
                m['developerPortal.dashboards.tabs.consentFlowTesting.credentialSentSuccess'](),
                { type: ToastTypeEnum.Success }
            );
        } catch (err) {
            log.error('Test send failed:', err);
            setTestStatus('error');
            setTestResult({
                error:
                    err instanceof Error
                        ? err.message
                        : m[
                              'developerPortal.dashboards.tabs.consentFlowTesting.sendFailedFallback'
                          ](),
            });
        }
    };

    if (isLoadingTemplates) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">
                    {m['developerPortal.dashboards.tabs.consentFlowTesting.title']()}
                </h2>
                <p className="text-sm text-gray-500">
                    {m['developerPortal.dashboards.tabs.consentFlowTesting.description']()}
                </p>
            </div>

            {/* Step 1: Test Consent Redirect */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                        <Link2 className="w-4 h-4 text-cyan-600" />
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-800 text-sm">
                            {m['developerPortal.dashboards.tabs.consentFlowTesting.step1Title']()}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {m['developerPortal.dashboards.tabs.consentFlowTesting.step1Desc']()}
                        </p>
                    </div>
                </div>

                {consentUrl ? (
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1 font-medium">
                                {m[
                                    'developerPortal.dashboards.tabs.consentFlowTesting.consentUrl'
                                ]()}
                            </p>
                            <code className="text-xs text-gray-700 break-all">{consentUrl}</code>
                        </div>

                        <a
                            href={consentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-xl text-sm font-medium hover:bg-cyan-600 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            {m[
                                'developerPortal.dashboards.tabs.consentFlowTesting.openConsentFlow'
                            ]()}
                        </a>
                    </div>
                ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800">
                            <strong>
                                {m[
                                    'developerPortal.dashboards.tabs.consentFlowTesting.missingConfig'
                                ]()}
                                :
                            </strong>{' '}
                            {m[
                                'developerPortal.dashboards.tabs.consentFlowTesting.missingConfigDesc'
                            ]()}
                        </p>
                    </div>
                )}
            </div>

            {/* Step 2: Verify Callback */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                        <Code className="w-4 h-4 text-violet-600" />
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-800 text-sm">
                            {m['developerPortal.dashboards.tabs.consentFlowTesting.step2Title']()}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {m['developerPortal.dashboards.tabs.consentFlowTesting.step2Desc']()}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <code className="text-xs font-semibold text-gray-700">did</code>
                        <p className="text-xs text-gray-500 mt-1">
                            {m['developerPortal.dashboards.tabs.consentFlowTesting.didParamDesc']()}
                        </p>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <code className="text-xs font-semibold text-gray-700">vp</code>
                        <p className="text-xs text-gray-500 mt-1">
                            {m['developerPortal.dashboards.tabs.consentFlowTesting.vpParamDesc']()}
                        </p>
                    </div>
                </div>

                <CodeOutputPanel
                    title={m[
                        'developerPortal.dashboards.tabs.consentFlowTesting.exampleCallback'
                    ]()}
                    snippets={{
                        curl: `GET ${
                            redirectUrl || 'https://your-app.com/api/learncard/callback'
                        }?did=did:web:...&vp=eyJhbGciOiJFZDI1NTE5...`,
                    }}
                />
            </div>

            {/* Step 3: Send Test Credential */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Send className="w-4 h-4 text-emerald-600" />
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-800 text-sm">
                            {m['developerPortal.dashboards.tabs.consentFlowTesting.step3Title']()}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {m['developerPortal.dashboards.tabs.consentFlowTesting.step3Desc']()}
                        </p>
                    </div>
                </div>

                {sendableTemplates.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800">
                            <strong>
                                {m[
                                    'developerPortal.dashboards.tabs.consentFlowTesting.noSavedTemplates'
                                ]()}
                                :
                            </strong>{' '}
                            {m[
                                'developerPortal.dashboards.tabs.consentFlowTesting.noSavedTemplatesDesc'
                            ]()}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Template Selector */}
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-600">
                                {m['developerPortal.dashboards.tabs.consentFlowTesting.template']()}
                            </label>
                            <div className="relative">
                                <button
                                    onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                                    className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                                >
                                    <Award className="w-4 h-4 text-cyan-600" />

                                    <span className="flex-1 text-left text-sm text-gray-800">
                                        {selectedTemplate?.name ||
                                            m[
                                                'developerPortal.dashboards.tabs.consentFlowTesting.selectTemplate'
                                            ]()}
                                    </span>

                                    <ChevronDown
                                        className={`w-4 h-4 text-gray-400 transition-transform ${
                                            showTemplateSelector ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                {showTemplateSelector && (
                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                        {sendableTemplates.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => {
                                                    setSelectedTemplateId(t.id);
                                                    setShowTemplateSelector(false);
                                                }}
                                                className={`w-full flex items-center gap-2 p-3 text-sm hover:bg-gray-50 ${
                                                    selectedTemplateId === t.id ? 'bg-cyan-50' : ''
                                                }`}
                                            >
                                                <Award className="w-4 h-4 text-gray-400" />
                                                <span className="flex-1 text-left text-gray-800">
                                                    {t.name}
                                                </span>
                                                {selectedTemplateId === t.id && (
                                                    <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* DID Input */}
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-600">
                                {m[
                                    'developerPortal.dashboards.tabs.consentFlowTesting.recipientDid'
                                ]()}{' '}
                                <span className="text-gray-400">
                                    {m[
                                        'developerPortal.dashboards.tabs.consentFlowTesting.recipientDidHint'
                                    ]()}
                                </span>
                            </label>

                            <input
                                type="text"
                                value={testDid}
                                onChange={e => setTestDid(e.target.value)}
                                placeholder={m[
                                    'developerPortal.dashboards.tabs.consentFlowTesting.didPlaceholder'
                                ]()}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono"
                            />
                        </div>

                        {/* Send Button / Result */}
                        {testStatus === 'idle' && (
                            <button
                                onClick={handleSendTest}
                                disabled={!testDid.trim() || !selectedTemplate?.boostUri}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <Send className="w-4 h-4" />
                                {m[
                                    'developerPortal.dashboards.tabs.consentFlowTesting.sendTestCredential'
                                ]()}
                            </button>
                        )}

                        {testStatus === 'sending' && (
                            <div className="flex items-center justify-center gap-3 px-6 py-3 bg-gray-100 rounded-xl">
                                <Loader2 className="w-5 h-5 text-cyan-600 animate-spin" />
                                <span className="text-gray-700 font-medium text-sm">
                                    {m[
                                        'developerPortal.dashboards.tabs.consentFlowTesting.sendingCredential'
                                    ]()}
                                </span>
                            </div>
                        )}

                        {testStatus === 'success' && testResult && (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="font-medium text-emerald-800 text-sm">
                                            {m[
                                                'developerPortal.dashboards.tabs.consentFlowTesting.credentialSent'
                                            ]()}
                                        </p>
                                        <p className="text-xs text-emerald-700 mt-1">
                                            {m[
                                                'developerPortal.dashboards.tabs.consentFlowTesting.credentialSentDesc'
                                            ]()}
                                        </p>
                                        {testResult.credentialUri && (
                                            <p className="text-xs text-emerald-600 mt-2 font-mono break-all">
                                                {m[
                                                    'developerPortal.dashboards.tabs.consentFlowTesting.credentialUri'
                                                ]({ uri: testResult.credentialUri })}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setTestStatus('idle');
                                        setTestResult(null);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    {m[
                                        'developerPortal.dashboards.tabs.consentFlowTesting.sendAnother'
                                    ]()}
                                </button>
                            </div>
                        )}

                        {testStatus === 'error' && testResult && (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="font-medium text-red-800 text-sm">
                                            {m[
                                                'developerPortal.dashboards.tabs.consentFlowTesting.sendFailed'
                                            ]()}
                                        </p>
                                        <p className="text-xs text-red-700 mt-1">
                                            {testResult.error}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setTestStatus('idle');
                                        setTestResult(null);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    {m[
                                        'developerPortal.dashboards.tabs.consentFlowTesting.tryAgain'
                                    ]()}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Tips */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-gray-700">
                        {m['developerPortal.dashboards.tabs.consentFlowTesting.testingTips']()}
                    </span>
                </div>

                <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span>
                            {m[
                                'developerPortal.dashboards.tabs.consentFlowTesting.tipSecondAccount'
                            ]()}
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span>
                            <TransP
                                m={
                                    m[
                                        'developerPortal.dashboards.tabs.consentFlowTesting.tipCallbackDid'
                                    ]
                                }
                                components={[<code className="bg-gray-200 px-1 rounded text-xs" />]}
                            />
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span>
                            {m[
                                'developerPortal.dashboards.tabs.consentFlowTesting.tipConnections'
                            ]()}
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
};
