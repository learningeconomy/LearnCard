import * as m from '../../../../paraglide/messages.js';
import { useLocale } from '../../../../i18n';
import { mDynamic } from '../../../../i18n/mDynamic';
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
import type {
    ConsentFlowContractChanges,
    ConsentFlowContractDetails,
    ConsentFlowContractUpdateResult,
    LCNIntegration,
} from '@learncard/types';
import { buildContractUpdatePreview } from '@learncard/helpers';
import type { CredentialTemplate } from '../types';
import type { GuideState } from '../../guides/types';
import { useTemplateDetails } from '../hooks/useTemplateDetails';
import { getAppBaseUrl } from '../../../../config/bootstrapTenantConfig';
import { CodeOutputPanel } from '../../guides/shared/CodeOutputPanel';

import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';
import ContractUpdateReview from '../../../consentFlow/ContractUpdateReview';

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
    const [contractUpdatePreview, setContractUpdatePreview] = useState<{
        contract: ConsentFlowContractDetails;
        result: ConsentFlowContractUpdateResult;
        reason?: string;
    } | null>(null);
    const locale = useLocale();
    const localizedContractUpdatePreview = useMemo(() => {
        if (!contractUpdatePreview) return undefined;
        const { result, contract } = contractUpdatePreview;
        const rows = result.preview.rows;
        return buildContractUpdatePreview({
            name: contract.name,
            kind: result.kind,
            diff: {
                added: rows.filter(row => row.change === 'added').map(row => row.scope),
                removed: rows.filter(row => row.change === 'removed').map(row => row.scope),
                changed: rows.filter(row => row.change === 'changed').map(row => row.scope),
            },
            translate: mDynamic,
        });
    }, [contractUpdatePreview, locale]);

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
    const [contractUpdatePreviewLoading, setContractUpdatePreviewLoading] = useState(false);
    const [contractUpdatePreviewError, setContractUpdatePreviewError] = useState('');
    const [contractUpdateChanges, setContractUpdateChanges] = useState('');
    const [contractUpdateReason, setContractUpdateReason] = useState('');

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
    const handlePreviewContractUpdate = async () => {
        setContractUpdatePreviewLoading(true);
        setContractUpdatePreviewError('');
        try {
            if (!contractUri) throw new Error('Choose a contract before creating a preview.');
            const changes = JSON.parse(contractUpdateChanges) as ConsentFlowContractChanges &
                NonNullable<ConsentFlowContractChanges['contract']>;
            if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
                throw new SyntaxError('Expected a changes object');
            }
            const wallet = await initWallet();
            const contract = await wallet.invoke.getContract(contractUri);
            if (!contract) throw new Error('Could not load the current contract.');
            const reason = contractUpdateReason.trim() || undefined;
            const result = await wallet.invoke.updateContract(contractUri, changes, {
                dryRun: true,
                reason,
            });
            setContractUpdatePreview({
                contract: {
                    ...contract,
                    name: changes.name ?? contract.name,
                    image: changes.image ?? contract.image,
                },
                result,
                reason,
            });
        } catch (error) {
            setContractUpdatePreviewError(
                error instanceof SyntaxError
                    ? 'Enter a JSON object with valid changes.'
                    : error instanceof Error && error.message.includes('A reason is required')
                      ? 'Add a short reason for the additional access.'
                      : 'Could not create a preview. Check your changes and try again.'
            );
        } finally {
            setContractUpdatePreviewLoading(false);
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
        <div className="space-y-v3-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">
                    {m['developerPortal.dashboards.tabs.consentFlowTesting.title']()}
                </h2>
                <p className="text-sm text-gray-500">
                    {m['developerPortal.dashboards.tabs.consentFlowTesting.description']()}
                </p>
            </div>

            {/* Step 1: Test Consent Redirect */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-v3-4">
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
                    <div className="space-y-v3-3">
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
            <section className="space-y-4 rounded-[20px] border border-grayscale-200 bg-white p-5 font-poppins">
                <div>
                    <h3 className="text-sm font-medium text-grayscale-900">Preview an update</h3>
                    <p className="mt-1 text-xs text-grayscale-600">
                        Preview your proposed changes. Nothing will be saved.
                    </p>
                </div>
                <div>
                    <label
                        htmlFor="contract-update-changes"
                        className="mb-1.5 block text-xs font-medium text-grayscale-700"
                    >
                        Changes (JSON)
                    </label>
                    <textarea
                        id="contract-update-changes"
                        value={contractUpdateChanges}
                        onChange={event => setContractUpdateChanges(event.target.value)}
                        disabled={contractUpdatePreviewLoading}
                        rows={6}
                        placeholder={'{"subtitle":"Updated app information"}'}
                        className="w-full rounded-xl border border-grayscale-300 bg-white px-4 py-3 font-mono text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="mt-1 text-xs text-grayscale-500">
                        Category lists replace their current section. Include existing entries you
                        want to keep.
                    </p>
                </div>
                <div>
                    <label
                        htmlFor="contract-update-reason"
                        className="mb-1.5 block text-xs font-medium text-grayscale-700"
                    >
                        Reason for additional access
                    </label>
                    <input
                        id="contract-update-reason"
                        value={contractUpdateReason}
                        onChange={event => setContractUpdateReason(event.target.value)}
                        maxLength={140}
                        disabled={contractUpdatePreviewLoading}
                        placeholder="Explain what changes for your users"
                        className="w-full rounded-xl border border-grayscale-300 bg-white px-4 py-3 text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <button
                    type="button"
                    disabled={
                        !contractUri ||
                        !contractUpdateChanges.trim() ||
                        contractUpdatePreviewLoading
                    }
                    onClick={() => void handlePreviewContractUpdate()}
                    className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {contractUpdatePreviewLoading ? (
                        <>
                            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                            Preparing preview...
                        </>
                    ) : (
                        'Preview update'
                    )}
                </button>
                {contractUpdatePreviewError && (
                    <p role="alert" className="text-sm text-red-700">
                        {contractUpdatePreviewError}
                    </p>
                )}
            </section>

            {/* Step 2: Verify Callback */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-v3-4">
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
                        }?challenge=...&vp=eyJhbGciOiJFZDI1NTE5...`,
                    }}
                />
            </div>

            {/* Step 3: Send Test Credential */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-v3-4">
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
                        <div className="space-y-v3-2">
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
                        <div className="space-y-v3-2">
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
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono"
                            />
                        </div>

                        {/* Send Button / Result */}
                        {testStatus === 'idle' && (
                            <button
                                onClick={handleSendTest}
                                disabled={!testDid.trim() || !selectedTemplate?.boostUri}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r/srgb from-cyan-500 to-emerald-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                            <div className="space-y-v3-3">
                                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
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
                            <div className="space-y-v3-3">
                                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
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

                <ul className="text-sm text-gray-600 space-y-v3-2">
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
                                components={[
                                    <code
                                        key="callback-value"
                                        className="bg-gray-200 px-1 rounded-sm text-xs"
                                    />,
                                ]}
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
            {contractUpdatePreview && localizedContractUpdatePreview && (
                <ContractUpdateReview
                    open
                    name={contractUpdatePreview.contract.name}
                    image={contractUpdatePreview.contract.image}
                    reason={contractUpdatePreview.reason}
                    preview={localizedContractUpdatePreview}
                    unchangedRows={[]}
                    readOnly
                    onClose={() => setContractUpdatePreview(null)}
                />
            )}
        </div>
    );
};
