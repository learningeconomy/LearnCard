import * as m from '../../../../paraglide/messages.js';
import { useLocale } from '../../../../i18n';
import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    checkmarkCircleOutline,
    checkmarkOutline,
    closeCircleOutline,
    copyOutline,
    informationCircleOutline,
    keyOutline,
    linkOutline,
    openOutline,
    pulseOutline,
    radioOutline,
    refreshOutline,
    sendOutline,
    trashOutline,
    warningOutline,
} from 'ionicons/icons';
import { Clipboard } from '@capacitor/clipboard';
import type {
    IntegrationTestEventResult,
    IntegrationWebhookState,
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

const STATE_BADGE_CLASS: Record<IntegrationWebhookState, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    failing: 'bg-red-100 text-red-700',
    disabled: 'bg-grayscale-100 text-grayscale-600',
};

const getStateLabel = (state: IntegrationWebhookState): string => {
    switch (state) {
        case 'active':
            return m['developerPortal.dashboards.tabs.webhooks.healthStateActive']();
        case 'failing':
            return m['developerPortal.dashboards.tabs.webhooks.healthStateFailing']();
        default:
            return m['developerPortal.dashboards.tabs.webhooks.healthStateDisabled']();
    }
};

const getStateHint = (state: IntegrationWebhookState): string => {
    switch (state) {
        case 'active':
            return m['developerPortal.dashboards.tabs.webhooks.healthStateActiveHint']();
        case 'failing':
            return m['developerPortal.dashboards.tabs.webhooks.healthStateFailingHint']();
        default:
            return m['developerPortal.dashboards.tabs.webhooks.healthStateDisabledHint']();
    }
};

/** Text for the fixed failure code of a delivery attempt, for example `http_401` or `timeout`. */
const getFailureReasonText = (reason: string): string => {
    const httpStatus = /^http_(\d{3})$/.exec(reason)?.[1];

    if (httpStatus) {
        return m['developerPortal.dashboards.tabs.webhooks.reasonHttp']({ status: httpStatus });
    }

    switch (reason) {
        case 'timeout':
            return m['developerPortal.dashboards.tabs.webhooks.reasonTimeout']();
        case 'network_error':
            return m['developerPortal.dashboards.tabs.webhooks.reasonNetwork']();
        case 'redirect':
            return m['developerPortal.dashboards.tabs.webhooks.reasonRedirect']();
        case 'invalid_webhook':
            return m['developerPortal.dashboards.tabs.webhooks.reasonInvalid']();
        default:
            return m['developerPortal.dashboards.tabs.webhooks.reasonOther']();
    }
};

const isRateLimitError = (error: unknown): boolean =>
    (error as { data?: { code?: string } } | null)?.data?.code === 'TOO_MANY_REQUESTS';

/** Text for a test event that was not delivered. `error` is a fixed code from the network. */
const getTestFailureText = (result: IntegrationTestEventResult): string => {
    if (result.error === 'redirect') {
        return m['developerPortal.dashboards.tabs.webhooks.testFailedRedirect']({
            status: result.httpStatus ?? 0,
        });
    }

    if (result.httpStatus !== undefined) {
        return m['developerPortal.dashboards.tabs.webhooks.testFailedStatus']({
            status: result.httpStatus,
            latency: result.latencyMs ?? 0,
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
    const {
        useUpdateIntegration,
        useSetIntegrationWebhook,
        useIntegrationWebhook,
        useRotateIntegrationWebhookSecret,
        useRevealedWebhookSecret,
        useSendIntegrationTestEvent,
    } = useDeveloperPortal();

    const updateIntegration = useUpdateIntegration();
    const setWebhook = useSetIntegrationWebhook();
    const health = useIntegrationWebhook(integration.id);
    const rotateSecret = useRotateIntegrationWebhookSecret();
    // Kept in the query cache, not here, so it survives leaving this tab until dismissed.
    const { revealed, dismiss: dismissSecret } = useRevealedWebhookSecret(integration.id);
    const sendTestEvent = useSendIntegrationTestEvent();

    const savedUrl = integration.webhookUrl ?? '';
    const eventsEnabledAt = integration.contractEventsEnabledAt;
    const eventsEnabled = Boolean(eventsEnabledAt);

    const [urlInput, setUrlInput] = useState(savedUrl);
    const [secretCopied, setSecretCopied] = useState(false);
    const [testResult, setTestResult] = useState<IntegrationTestEventResult | null>(null);

    useEffect(() => {
        setUrlInput(savedUrl);
    }, [savedUrl]);

    // A secret and a test result belong to one integration only. The secret is keyed by
    // integration id in the cache, so only this integration's secret is ever shown.
    useEffect(() => {
        setSecretCopied(false);
        setTestResult(null);
    }, [integration.id]);

    const trimmedUrl = urlInput.trim();
    const urlIsValid = isHttpUrl(trimmedUrl);
    const urlChanged = trimmedUrl !== savedUrl;
    const showUrlError = trimmedUrl.length > 0 && !urlIsValid;
    const isSaving = updateIntegration.isPending || setWebhook.isPending;

    const showError = (message: string): void => {
        presentToast(message, { type: ToastTypeEnum.Error, hasDismissButton: true });
    };

    const saveUrl = async (): Promise<void> => {
        if (!urlIsValid || !urlChanged) return;

        try {
            // The secret returned by the first registration is stored by the mutation hook,
            // so it survives this tab unmounting. It is never logged or written to web storage.
            await setWebhook.mutateAsync({
                id: integration.id,
                webhookUrl: trimmedUrl,
            });
            setSecretCopied(false);

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
            await setWebhook.mutateAsync({ id: integration.id, webhookUrl: null });
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

    const rotate = async (): Promise<void> => {
        try {
            // The new secret is stored by the mutation hook, so it survives this tab unmounting.
            await rotateSecret.mutateAsync(integration.id);
            setSecretCopied(false);
        } catch {
            showError(m['developerPortal.dashboards.tabs.webhooks.rotateFailed']());
        }
    };

    const copySecret = async (): Promise<void> => {
        if (!revealed) return;

        try {
            await Clipboard.write({ string: revealed.secret });
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
        } catch (error) {
            showError(
                isRateLimitError(error)
                    ? m['developerPortal.dashboards.tabs.webhooks.testRateLimited']()
                    : m['developerPortal.dashboards.tabs.webhooks.testRequestFailed']()
            );
        }
    };

    const hasSecret = Boolean(integration.hasWebhookSecret) || revealed !== null;
    const status = health.data ?? null;

    return (
        <div className="space-y-v3-6">
            <div>
                <h2 className="text-xl font-semibold text-grayscale-900">
                    {m['developerPortal.dashboards.tabs.webhooks.title']()}
                </h2>
                <p className="text-sm text-grayscale-600">
                    {m['developerPortal.dashboards.tabs.webhooks.description']()}
                </p>
            </div>

            <div className="p-3 bg-grayscale-10 border border-grayscale-200 rounded-2xl flex items-start gap-2.5">
                <IonIcon
                    icon={informationCircleOutline}
                    aria-hidden
                    className="text-grayscale-900 text-lg mt-0.5 shrink-0"
                />
                <div className="text-sm text-grayscale-700 leading-relaxed">
                    <p>{m['developerPortal.dashboards.tabs.webhooks.separateNote']()}</p>
                    <a
                        href={INTEGRATION_WEBHOOKS_DOCS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 font-medium text-grayscale-900 underline"
                    >
                        {m['developerPortal.dashboards.tabs.webhooks.docsLink']()}
                        <IonIcon icon={openOutline} aria-hidden className="text-sm" />
                    </a>
                </div>
            </div>

            <p
                role="status"
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    eventsEnabled
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-grayscale-100 text-grayscale-600'
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
                className="p-4 border border-grayscale-200 rounded-[20px] bg-white space-y-v3-3"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-grayscale-100 rounded-xl flex items-center justify-center shrink-0">
                        <IonIcon
                            icon={linkOutline}
                            aria-hidden
                            className="text-xl text-grayscale-900"
                        />
                    </div>
                    <div>
                        <h3 id="webhooks-url-title" className="font-medium text-grayscale-900">
                            {m['developerPortal.dashboards.tabs.webhooks.urlTitle']()}
                        </h3>
                        <p className="text-sm text-grayscale-600">
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
                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl font-mono text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                />

                {showUrlError && (
                    <p id="webhooks-url-error" className="text-sm text-red-700">
                        {m['developerPortal.dashboards.tabs.webhooks.urlInvalid']()}
                    </p>
                )}

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={saveUrl}
                        disabled={isSaving || !urlIsValid || !urlChanged}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSaving && (
                            <span
                                aria-hidden
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                            />
                        )}
                        {m['developerPortal.dashboards.tabs.webhooks.saveUrl']()}
                    </button>

                    {savedUrl && (
                        <button
                            type="button"
                            onClick={removeUrl}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <IonIcon icon={trashOutline} aria-hidden className="text-base" />
                            {m['developerPortal.dashboards.tabs.webhooks.removeUrl']()}
                        </button>
                    )}
                </div>
            </section>

            {/* Event feed */}
            <section
                aria-labelledby="webhooks-feed-title"
                className="p-4 border border-grayscale-200 rounded-[20px] bg-white"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-grayscale-100 rounded-xl flex items-center justify-center shrink-0">
                            <IonIcon
                                icon={radioOutline}
                                aria-hidden
                                className="text-xl text-grayscale-900"
                            />
                        </div>
                        <div>
                            <h3 id="webhooks-feed-title" className="font-medium text-grayscale-900">
                                {m['developerPortal.dashboards.tabs.webhooks.feedToggle']()}
                            </h3>
                            <p
                                id="webhooks-feed-description"
                                className="text-sm text-grayscale-600"
                            >
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
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            eventsEnabled ? 'bg-emerald-500' : 'bg-grayscale-300'
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
                className="p-4 border border-grayscale-200 rounded-[20px] bg-white space-y-v3-3"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-grayscale-100 rounded-xl flex items-center justify-center shrink-0">
                        <IonIcon
                            icon={keyOutline}
                            aria-hidden
                            className="text-xl text-grayscale-900"
                        />
                    </div>
                    <div>
                        <h3 id="webhooks-secret-title" className="font-medium text-grayscale-900">
                            {m['developerPortal.dashboards.tabs.webhooks.secretTitle']()}
                        </h3>
                        <p className="text-sm text-grayscale-600">
                            {m['developerPortal.dashboards.tabs.webhooks.secretDescription']()}
                        </p>
                    </div>
                </div>

                {revealed ? (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl space-y-v3-2">
                        <p className="text-xs font-medium text-grayscale-700">
                            {m['developerPortal.dashboards.tabs.webhooks.newSecretLabel']()}
                        </p>
                        <div className="flex items-center gap-2">
                            <code
                                dir="ltr"
                                data-testid="webhook-secret"
                                className="flex-1 min-w-0 px-3 py-2 bg-white border border-amber-100 rounded-xl text-xs font-mono text-grayscale-900 break-all"
                            >
                                {revealed.secret}
                            </code>
                            <button
                                type="button"
                                onClick={copySecret}
                                aria-label={m[
                                    'developerPortal.dashboards.tabs.webhooks.copySecret'
                                ]()}
                                title={m['developerPortal.dashboards.tabs.webhooks.copySecret']()}
                                className="p-2 text-grayscale-500 hover:text-grayscale-900 hover:bg-grayscale-10 rounded-full transition-colors shrink-0"
                            >
                                {secretCopied ? (
                                    <IonIcon
                                        icon={checkmarkOutline}
                                        aria-hidden
                                        className="text-base text-emerald-500"
                                    />
                                ) : (
                                    <IonIcon icon={copyOutline} aria-hidden className="text-base" />
                                )}
                            </button>
                        </div>
                        <p className="flex items-start gap-2 text-sm font-medium text-amber-800">
                            <IonIcon
                                icon={warningOutline}
                                aria-hidden
                                className="text-base shrink-0 mt-0.5"
                            />
                            {m['developerPortal.dashboards.tabs.webhooks.secretOnceWarning']()}
                        </p>
                        {revealed.previousSecretExpiresAt && (
                            <p className="text-sm text-amber-800">
                                {m[
                                    'developerPortal.dashboards.tabs.webhooks.previousSecretExpires'
                                ]({
                                    date: formatDate(revealed.previousSecretExpiresAt, locale),
                                })}
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={dismissSecret}
                            className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                        >
                            {m['developerPortal.dashboards.tabs.webhooks.dismissSecret']()}
                        </button>
                    </div>
                ) : (
                    <p className="text-sm text-grayscale-600">
                        {hasSecret
                            ? m['developerPortal.dashboards.tabs.webhooks.secretExists']()
                            : m['developerPortal.dashboards.tabs.webhooks.secretNone']()}
                    </p>
                )}

                {/* The first secret comes from saving a webhook URL. Rotation is for later. */}
                {hasSecret && (
                    <div>
                        <button
                            type="button"
                            onClick={rotate}
                            disabled={rotateSecret.isPending}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {rotateSecret.isPending && (
                                <span
                                    aria-hidden
                                    className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-700 rounded-full animate-spin"
                                />
                            )}
                            {m['developerPortal.dashboards.tabs.webhooks.rotateSecret']()}
                        </button>
                        <p className="text-xs text-grayscale-500 mt-2">
                            {m['developerPortal.dashboards.tabs.webhooks.rotateHint']()}
                        </p>
                    </div>
                )}
            </section>

            {/* Delivery health */}
            <section
                aria-labelledby="webhooks-health-title"
                className="p-4 border border-grayscale-200 rounded-[20px] bg-white space-y-v3-3"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-grayscale-100 rounded-xl flex items-center justify-center shrink-0">
                            <IonIcon
                                icon={pulseOutline}
                                aria-hidden
                                className="text-xl text-grayscale-900"
                            />
                        </div>
                        <div>
                            <h3
                                id="webhooks-health-title"
                                className="font-medium text-grayscale-900"
                            >
                                {m['developerPortal.dashboards.tabs.webhooks.healthTitle']()}
                            </h3>
                            <p className="text-sm text-grayscale-600">
                                {m['developerPortal.dashboards.tabs.webhooks.healthDescription']()}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => health.refetch()}
                        disabled={health.isFetching}
                        aria-label={m['developerPortal.dashboards.tabs.webhooks.healthRefresh']()}
                        title={m['developerPortal.dashboards.tabs.webhooks.healthRefresh']()}
                        className="p-2 text-grayscale-500 hover:text-grayscale-900 hover:bg-grayscale-10 rounded-full transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <IonIcon
                            icon={refreshOutline}
                            aria-hidden
                            className={`text-base ${health.isFetching ? 'animate-spin' : ''}`}
                        />
                    </button>
                </div>

                {!status && health.isError && (
                    <p role="alert" className="text-sm text-red-700">
                        {m['developerPortal.dashboards.tabs.webhooks.healthLoadFailed']()}
                    </p>
                )}

                {status && (
                    <>
                        <p className="flex flex-wrap items-center gap-2 text-sm text-grayscale-600">
                            <span
                                data-testid="webhook-state"
                                className={`px-3 py-1 rounded-full font-medium ${
                                    STATE_BADGE_CLASS[status.state]
                                }`}
                            >
                                {getStateLabel(status.state)}
                            </span>
                            <span>{getStateHint(status.state)}</span>
                        </p>

                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div>
                                <dt className="text-grayscale-500">
                                    {m[
                                        'developerPortal.dashboards.tabs.webhooks.healthLastSuccess'
                                    ]()}
                                </dt>
                                <dd
                                    className="text-grayscale-900"
                                    data-testid="webhook-last-success"
                                >
                                    {status.lastSuccessAt
                                        ? formatDate(status.lastSuccessAt, locale)
                                        : m[
                                              'developerPortal.dashboards.tabs.webhooks.healthNever'
                                          ]()}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-grayscale-500">
                                    {m[
                                        'developerPortal.dashboards.tabs.webhooks.healthLastFailure'
                                    ]()}
                                </dt>
                                <dd
                                    className="text-grayscale-900"
                                    data-testid="webhook-last-failure"
                                >
                                    {status.lastFailureAt
                                        ? formatDate(status.lastFailureAt, locale)
                                        : m[
                                              'developerPortal.dashboards.tabs.webhooks.healthNever'
                                          ]()}
                                    {status.lastFailureAt && status.lastFailureReason && (
                                        <span className="block text-grayscale-600">
                                            {getFailureReasonText(status.lastFailureReason)}
                                            <code dir="ltr" className="ms-2 font-mono text-xs">
                                                {status.lastFailureReason}
                                            </code>
                                        </span>
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-grayscale-500">
                                    {m['developerPortal.dashboards.tabs.webhooks.healthPending']()}
                                </dt>
                                <dd className="text-grayscale-900" data-testid="webhook-pending">
                                    {status.pendingDeliveries}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-grayscale-500">
                                    {m['developerPortal.dashboards.tabs.webhooks.healthRetrying']()}
                                </dt>
                                <dd className="text-grayscale-900" data-testid="webhook-retrying">
                                    {status.retryingDeliveries}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-grayscale-500">
                                    {m[
                                        'developerPortal.dashboards.tabs.webhooks.healthSecretVersion'
                                    ]()}
                                </dt>
                                <dd
                                    className="text-grayscale-900"
                                    data-testid="webhook-secret-version"
                                >
                                    {status.secretVersion > 0
                                        ? status.secretVersion
                                        : m[
                                              'developerPortal.dashboards.tabs.webhooks.healthNoSecret'
                                          ]()}
                                </dd>
                            </div>
                        </dl>
                    </>
                )}
            </section>

            {/* Test event */}
            <section
                aria-labelledby="webhooks-test-title"
                className="p-4 border border-grayscale-200 rounded-[20px] bg-white space-y-v3-3"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-grayscale-100 rounded-xl flex items-center justify-center shrink-0">
                        <IonIcon
                            icon={sendOutline}
                            aria-hidden
                            className="text-xl text-grayscale-900"
                        />
                    </div>
                    <div>
                        <h3 id="webhooks-test-title" className="font-medium text-grayscale-900">
                            {m['developerPortal.dashboards.tabs.webhooks.testTitle']()}
                        </h3>
                        <p className="text-sm text-grayscale-600">
                            {m['developerPortal.dashboards.tabs.webhooks.testDescription']()}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={sendTest}
                    disabled={!savedUrl || sendTestEvent.isPending}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {sendTestEvent.isPending && (
                        <span
                            aria-hidden
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                        />
                    )}
                    {sendTestEvent.isPending
                        ? m['developerPortal.dashboards.tabs.webhooks.sending']()
                        : m['developerPortal.dashboards.tabs.webhooks.sendTest']()}
                </button>

                {!savedUrl && (
                    <p className="text-xs text-grayscale-500">
                        {m['developerPortal.dashboards.tabs.webhooks.testNeedsUrl']()}
                    </p>
                )}

                {testResult && (
                    <p
                        role="status"
                        className={`flex items-start gap-2.5 p-3 border rounded-2xl text-sm leading-relaxed ${
                            testResult.delivered
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                : 'bg-red-50 border-red-100 text-red-700'
                        }`}
                    >
                        {testResult.delivered ? (
                            <IonIcon
                                icon={checkmarkCircleOutline}
                                aria-hidden
                                className="text-emerald-500 text-lg mt-0.5 shrink-0"
                            />
                        ) : (
                            <IonIcon
                                icon={closeCircleOutline}
                                aria-hidden
                                className="text-red-400 text-lg mt-0.5 shrink-0"
                            />
                        )}
                        <span>
                            {testResult.delivered
                                ? m['developerPortal.dashboards.tabs.webhooks.testDelivered']({
                                      status: testResult.httpStatus ?? 200,
                                      latency: testResult.latencyMs ?? 0,
                                  })
                                : getTestFailureText(testResult)}
                            {!testResult.delivered &&
                                testResult.httpStatus === undefined &&
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
