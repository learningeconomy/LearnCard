import * as m from '../../../../paraglide/messages.js';
import { useLocale } from '../../../../i18n';
import React, { useEffect, useState } from 'react';
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    Copy,
    ExternalLink,
    Info,
    KeyRound,
    Loader2,
    Rss,
    Send,
    Trash2,
    Webhook,
    XCircle,
} from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';
import type {
    IntegrationTestEventResult,
    IntegrationWebhookSecretRotation,
    LCNIntegration,
} from '@learncard/types';

import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import { useDeveloperPortal } from '../../useDeveloperPortal';

export const INTEGRATION_WEBHOOKS_DOCS_URL =
    'https://docs.learncard.com/reference/learncard-network/integration-webhooks';

interface WebhooksTabProps {
    integration: LCNIntegration;
}

const isHttpUrl = (value: string): boolean => {
    try {
        const { protocol } = new URL(value);

        return protocol === 'https:' || protocol === 'http:';
    } catch {
        return false;
    }
};

const formatDate = (value: string, locale: string): string => {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(locale);
};

/** Text for a test event that was not delivered. `error` is a fixed code from the network. */
const getTestFailureText = (result: IntegrationTestEventResult): string => {
    if (result.status !== undefined) {
        return m['developerPortal.dashboards.tabs.webhooks.testFailedStatus']({
            status: result.status,
        });
    }

    switch (result.error) {
        case 'timeout':
            return m['developerPortal.dashboards.tabs.webhooks.testFailedTimeout']();
        case 'network_error':
            return m['developerPortal.dashboards.tabs.webhooks.testFailedNetwork']();
        case 'invalid_webhook':
            return m['developerPortal.dashboards.tabs.webhooks.testFailedInvalid']();
        case 'no_webhook':
            return m['developerPortal.dashboards.tabs.webhooks.testFailedNoWebhook']();
        default:
            return m['developerPortal.dashboards.tabs.webhooks.testFailedGeneric']();
    }
};

export const WebhooksTab: React.FC<WebhooksTabProps> = ({ integration }) => {
    const locale = useLocale();
    const { presentToast } = useToast();
    const { useUpdateIntegration, useRotateIntegrationWebhookSecret, useSendIntegrationTestEvent } =
        useDeveloperPortal();

    const updateIntegration = useUpdateIntegration();
    const rotateSecret = useRotateIntegrationWebhookSecret();
    const sendTestEvent = useSendIntegrationTestEvent();

    const savedUrl = integration.webhookUrl ?? '';
    const eventsEnabledAt = integration.contractEventsEnabledAt;
    const eventsEnabled = Boolean(eventsEnabledAt);

    const [urlInput, setUrlInput] = useState(savedUrl);
    const [rotation, setRotation] = useState<IntegrationWebhookSecretRotation | null>(null);
    const [secretCopied, setSecretCopied] = useState(false);
    const [testResult, setTestResult] = useState<IntegrationTestEventResult | null>(null);

    useEffect(() => {
        setUrlInput(savedUrl);
    }, [savedUrl]);

    // A secret and a test result belong to one integration only.
    useEffect(() => {
        setRotation(null);
        setTestResult(null);
    }, [integration.id]);

    const trimmedUrl = urlInput.trim();
    const urlIsValid = isHttpUrl(trimmedUrl);
    const urlChanged = trimmedUrl !== savedUrl;
    const showUrlError = trimmedUrl.length > 0 && !urlIsValid;
    const isSaving = updateIntegration.isPending;

    const showError = (message: string): void => {
        presentToast(message, { type: ToastTypeEnum.Error, hasDismissButton: true });
    };

    const saveUrl = async (): Promise<void> => {
        if (!urlIsValid || !urlChanged) return;

        try {
            await updateIntegration.mutateAsync({
                id: integration.id,
                updates: { webhookUrl: trimmedUrl },
            });
            setTestResult(null);
            presentToast(m['developerPortal.dashboards.tabs.webhooks.urlSaved'](), {
                hasDismissButton: true,
            });
        } catch {
            showError(m['developerPortal.dashboards.tabs.webhooks.saveFailed']());
        }
    };

    const removeUrl = async (): Promise<void> => {
        try {
            await updateIntegration.mutateAsync({
                id: integration.id,
                updates: { webhookUrl: null },
            });
            setUrlInput('');
            setTestResult(null);
            presentToast(m['developerPortal.dashboards.tabs.webhooks.urlRemoved'](), {
                hasDismissButton: true,
            });
        } catch {
            showError(m['developerPortal.dashboards.tabs.webhooks.saveFailed']());
        }
    };

    const toggleEvents = async (): Promise<void> => {
        const next = !eventsEnabled;

        try {
            await updateIntegration.mutateAsync({
                id: integration.id,
                updates: { contractEventsEnabled: next },
            });
            presentToast(
                next
                    ? m['developerPortal.dashboards.tabs.webhooks.feedEnabled']()
                    : m['developerPortal.dashboards.tabs.webhooks.feedDisabled'](),
                { hasDismissButton: true }
            );
        } catch {
            showError(m['developerPortal.dashboards.tabs.webhooks.saveFailed']());
        }
    };

    const createSecret = async (): Promise<void> => {
        try {
            // The secret stays in component state only. It is never logged or stored.
            setRotation(await rotateSecret.mutateAsync(integration.id));
            setSecretCopied(false);
        } catch {
            showError(m['developerPortal.dashboards.tabs.webhooks.rotateFailed']());
        }
    };

    const copySecret = async (): Promise<void> => {
        if (!rotation) return;

        try {
            await Clipboard.write({ string: rotation.secret });
            setSecretCopied(true);
            setTimeout(() => setSecretCopied(false), 2000);
            presentToast(m['developerPortal.dashboards.tabs.webhooks.secretCopied'](), {
                hasDismissButton: true,
            });
        } catch {
            showError(m['developerPortal.dashboards.tabs.webhooks.copyFailed']());
        }
    };

    const sendTest = async (): Promise<void> => {
        setTestResult(null);

        try {
            setTestResult(await sendTestEvent.mutateAsync(integration.id));
        } catch {
            showError(m['developerPortal.dashboards.tabs.webhooks.testRequestFailed']());
        }
    };

    const hasSecret = Boolean(integration.hasWebhookSecret) || rotation !== null;

    return (
        <div className="space-y-v3-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">
                    {m['developerPortal.dashboards.tabs.webhooks.title']()}
                </h2>
                <p className="text-sm text-gray-500">
                    {m['developerPortal.dashboards.tabs.webhooks.description']()}
                </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                    <p>{m['developerPortal.dashboards.tabs.webhooks.separateNote']()}</p>
                    <a
                        href={INTEGRATION_WEBHOOKS_DOCS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 font-medium underline"
                    >
                        {m['developerPortal.dashboards.tabs.webhooks.docsLink']()}
                        <ExternalLink aria-hidden className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>

            <p
                role="status"
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    eventsEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}
            >
                {eventsEnabledAt
                    ? m['developerPortal.dashboards.tabs.webhooks.statusEnabled']({
                          date: formatDate(eventsEnabledAt, locale),
                      })
                    : m['developerPortal.dashboards.tabs.webhooks.statusDisabled']()}
            </p>

            {/* Webhook URL */}
            <section
                aria-labelledby="webhooks-url-title"
                className="p-4 border border-gray-200 rounded-xl bg-white space-y-v3-3"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center shrink-0">
                        <Webhook aria-hidden className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                        <h3 id="webhooks-url-title" className="font-medium text-gray-800">
                            {m['developerPortal.dashboards.tabs.webhooks.urlTitle']()}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {m['developerPortal.dashboards.tabs.webhooks.urlDescription']()}
                        </p>
                    </div>
                </div>

                <input
                    type="url"
                    dir="ltr"
                    value={urlInput}
                    onChange={event => setUrlInput(event.target.value)}
                    aria-labelledby="webhooks-url-title"
                    aria-invalid={showUrlError}
                    aria-describedby={showUrlError ? 'webhooks-url-error' : undefined}
                    placeholder={m['developerPortal.dashboards.tabs.webhooks.urlPlaceholder']()}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                />

                {showUrlError && (
                    <p id="webhooks-url-error" className="text-sm text-red-600">
                        {m['developerPortal.dashboards.tabs.webhooks.urlInvalid']()}
                    </p>
                )}

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={saveUrl}
                        disabled={isSaving || !urlIsValid || !urlChanged}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                    >
                        {isSaving && <Loader2 aria-hidden className="w-4 h-4 animate-spin" />}
                        {m['developerPortal.dashboards.tabs.webhooks.saveUrl']()}
                    </button>

                    {savedUrl && (
                        <button
                            type="button"
                            onClick={removeUrl}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                            <Trash2 aria-hidden className="w-4 h-4" />
                            {m['developerPortal.dashboards.tabs.webhooks.removeUrl']()}
                        </button>
                    )}
                </div>
            </section>

            {/* Event feed */}
            <section
                aria-labelledby="webhooks-feed-title"
                className="p-4 border border-gray-200 rounded-xl bg-white"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                            <Rss aria-hidden className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <h3 id="webhooks-feed-title" className="font-medium text-gray-800">
                                {m['developerPortal.dashboards.tabs.webhooks.feedToggle']()}
                            </h3>
                            <p id="webhooks-feed-description" className="text-sm text-gray-500">
                                {m['developerPortal.dashboards.tabs.webhooks.feedDescription']()}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        role="switch"
                        aria-checked={eventsEnabled}
                        aria-labelledby="webhooks-feed-title"
                        aria-describedby="webhooks-feed-description"
                        onClick={toggleEvents}
                        disabled={isSaving}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                            eventsEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                    >
                        <span
                            aria-hidden
                            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                                eventsEnabled
                                    ? 'translate-x-5 rtl:-translate-x-5'
                                    : 'translate-x-0.5 rtl:-translate-x-0.5'
                            }`}
                        />
                    </button>
                </div>
            </section>

            {/* Signing secret */}
            <section
                aria-labelledby="webhooks-secret-title"
                className="p-4 border border-gray-200 rounded-xl bg-white space-y-v3-3"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                        <KeyRound aria-hidden className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 id="webhooks-secret-title" className="font-medium text-gray-800">
                            {m['developerPortal.dashboards.tabs.webhooks.secretTitle']()}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {m['developerPortal.dashboards.tabs.webhooks.secretDescription']()}
                        </p>
                    </div>
                </div>

                {rotation ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-v3-2">
                        <p className="text-xs font-medium text-gray-600">
                            {m['developerPortal.dashboards.tabs.webhooks.newSecretLabel']()}
                        </p>
                        <div className="flex items-center gap-2">
                            <code
                                dir="ltr"
                                data-testid="webhook-secret"
                                className="flex-1 min-w-0 px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-mono break-all"
                            >
                                {rotation.secret}
                            </code>
                            <button
                                type="button"
                                onClick={copySecret}
                                aria-label={m[
                                    'developerPortal.dashboards.tabs.webhooks.copySecret'
                                ]()}
                                title={m['developerPortal.dashboards.tabs.webhooks.copySecret']()}
                                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors shrink-0"
                            >
                                {secretCopied ? (
                                    <Check aria-hidden className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <Copy aria-hidden className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        <p className="flex items-start gap-2 text-sm font-medium text-amber-800">
                            <AlertTriangle aria-hidden className="w-4 h-4 shrink-0 mt-0.5" />
                            {m['developerPortal.dashboards.tabs.webhooks.secretOnceWarning']()}
                        </p>
                        {rotation.previousSecretExpiresAt && (
                            <p className="text-sm text-amber-800">
                                {m[
                                    'developerPortal.dashboards.tabs.webhooks.previousSecretExpires'
                                ]({
                                    date: formatDate(rotation.previousSecretExpiresAt, locale),
                                })}
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-gray-600">
                        {hasSecret
                            ? m['developerPortal.dashboards.tabs.webhooks.secretExists']()
                            : m['developerPortal.dashboards.tabs.webhooks.secretNone']()}
                    </p>
                )}

                <div>
                    <button
                        type="button"
                        onClick={createSecret}
                        disabled={rotateSecret.isPending}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
                    >
                        {rotateSecret.isPending && (
                            <Loader2 aria-hidden className="w-4 h-4 animate-spin" />
                        )}
                        {hasSecret
                            ? m['developerPortal.dashboards.tabs.webhooks.rotateSecret']()
                            : m['developerPortal.dashboards.tabs.webhooks.createSecret']()}
                    </button>
                    {hasSecret && (
                        <p className="text-xs text-gray-500 mt-2">
                            {m['developerPortal.dashboards.tabs.webhooks.rotateHint']()}
                        </p>
                    )}
                </div>
            </section>

            {/* Test event */}
            <section
                aria-labelledby="webhooks-test-title"
                className="p-4 border border-gray-200 rounded-xl bg-white space-y-v3-3"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                        <Send aria-hidden className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 id="webhooks-test-title" className="font-medium text-gray-800">
                            {m['developerPortal.dashboards.tabs.webhooks.testTitle']()}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {m['developerPortal.dashboards.tabs.webhooks.testDescription']()}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={sendTest}
                    disabled={!savedUrl || sendTestEvent.isPending}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                    {sendTestEvent.isPending && (
                        <Loader2 aria-hidden className="w-4 h-4 animate-spin" />
                    )}
                    {sendTestEvent.isPending
                        ? m['developerPortal.dashboards.tabs.webhooks.sending']()
                        : m['developerPortal.dashboards.tabs.webhooks.sendTest']()}
                </button>

                {!savedUrl && (
                    <p className="text-xs text-gray-500">
                        {m['developerPortal.dashboards.tabs.webhooks.testNeedsUrl']()}
                    </p>
                )}

                {testResult && (
                    <p
                        role="status"
                        className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                            testResult.delivered
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-red-50 text-red-800'
                        }`}
                    >
                        {testResult.delivered ? (
                            <CheckCircle2 aria-hidden className="w-4 h-4 shrink-0 mt-0.5" />
                        ) : (
                            <XCircle aria-hidden className="w-4 h-4 shrink-0 mt-0.5" />
                        )}
                        <span>
                            {testResult.delivered
                                ? m['developerPortal.dashboards.tabs.webhooks.testDelivered']({
                                      status: testResult.status ?? 200,
                                  })
                                : getTestFailureText(testResult)}
                            {!testResult.delivered &&
                                testResult.status === undefined &&
                                testResult.error && (
                                    <code dir="ltr" className="ms-2 font-mono text-xs">
                                        {testResult.error}
                                    </code>
                                )}
                        </span>
                    </p>
                )}
            </section>
        </div>
    );
};
