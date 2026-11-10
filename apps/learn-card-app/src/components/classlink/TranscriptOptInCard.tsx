import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, timeOutline, documentTextOutline } from 'ionicons/icons';
import type { VC } from '@learncard/types';
import {
    useTranscriptStatus,
    useRequestTranscript,
    useFeatureConfig,
    walletStore,
    switchedProfileStore,
    getLogger,
    useWallet,
    getIssuerDid,
} from 'learn-card-base';
import type { LCR } from 'learn-card-base/types/credential-records';
import { useClassLinkAuthorizeUrl } from 'learn-card-base/react-query/mutations/firebase';
import { useTranscriptArrival } from '../../hooks/useTranscriptArrival';
import { useReceivedTranscript } from '../../hooks/useReceivedTranscript';
import { readTranscriptReceipt, storeTranscriptReceipt } from '../../hooks/transcriptReceipt';
import { tryFetchResolvedCredential } from 'learn-card-base/react-query/queries/credentialResolution';
import PassportCredentialCard from '../../pages/wallet/activity-feed/PassportCredentialCard';
import { getTranscriptCategory } from './transcriptCategory';
import { normalizeClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/display';
import { useAnalytics, AnalyticsEvents } from '@analytics';
import * as m from '../../paraglide/messages.js';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import { Capacitor } from '@capacitor/core';
import { runClassLinkLogin } from '../../auth/classlink/startClassLinkLogin';
import {
    TranscriptConsentCheckbox,
    TranscriptErrorBanner as ErrorBanner,
    getTranscriptErrorMessage as errorMessage,
} from './TranscriptConsent';

/** After this long without arrival, the card offers manual recovery instead of waiting. */
export const TRANSCRIPT_STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const log = getLogger('transcript-display');
export const TRANSCRIPT_RESOLUTION_WAIT_MS = 10_000;

type RequestResult = {
    status: 'requested' | 'none_yet' | 'failed';
    requestedAt: string;
    requestId?: string;
    receivedAt?: string;
};

type TranscriptOptInCardProps = {
    /** Where this card is rendered, for `transcript_requested` analytics only. */
    source: 'wallet' | 'school_connect';
    variant?: 'card' | 'banner';
};

const spinner = (
    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
);

const PrimaryButton: React.FC<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean; busyText?: string }
> = ({ busy, busyText, children, ...rest }) => (
    <button
        type="button"
        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        {...rest}
    >
        {busy ? (
            <span className="flex items-center justify-center gap-2">
                {spinner}
                {busyText}
            </span>
        ) : (
            children
        )}
    </button>
);

type ReceivedTranscriptProps = {
    issuerDid: string | undefined;
    requestId: string | undefined;
    receivedAt: string;
};

/**
 * Received state. Mounted only once the server reports `receivedAt`, so the
 * whole-wallet credential lookup below never runs for anyone who has not received
 * a transcript. If the credential has not resolved locally yet, the card still
 * shows "received" (from the server timestamp) rather than the opt-in form.
 */
const ReceivedTranscript: React.FC<ReceivedTranscriptProps> = ({
    issuerDid,
    requestId,
    receivedAt,
}) => {
    const { initWallet } = useWallet();
    const history = useHistory();
    const [timedOut, setTimedOut] = useState(false);
    const {
        entry: transcriptEntry,
        model: transcriptModel,
        accountDid,
    } = useReceivedTranscript({ issuerDid, requestId });
    const resolved = Boolean(transcriptModel);

    React.useEffect(() => {
        setTimedOut(false);
        if (resolved) return;
        const timer = setTimeout(() => {
            setTimedOut(true);
            log.warn('transcript-display.resolution.timeout');
        }, TRANSCRIPT_RESOLUTION_WAIT_MS);
        return () => clearTimeout(timer);
    }, [accountDid, requestId, resolved]);

    // `unreadUpdate` lives on the encrypted wallet index record, not the resolved VC.
    const { data: transcriptRecord } = useQuery({
        queryKey: ['transcriptIndexRecord', accountDid, transcriptEntry?.uri],
        queryFn: async () => {
            const indexWallet = await initWallet();
            const records = await indexWallet.index.LearnCloud.get<LCR>(
                { uri: transcriptEntry?.uri },
                { cache: 'skip-cache' }
            );
            return records.find(record => record.uri === transcriptEntry?.uri) ?? null;
        },
        enabled: Boolean(transcriptEntry?.uri),
    });
    const unreadUpdate = transcriptRecord?.refresh?.unreadUpdate;
    const updatedAt = transcriptRecord?.refresh?.lastUpdatedAt;

    return (
        <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <IonIcon icon={checkmarkCircleOutline} className="text-emerald-500" />
                    {m['transcriptOptIn.addedToAccount']()}
                </span>
                {unreadUpdate && updatedAt && (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                        {m['transcriptOptIn.updated']({
                            date: new Date(updatedAt).toLocaleDateString(),
                        })}
                    </span>
                )}
            </div>
            {transcriptModel && transcriptEntry ? (
                <PassportCredentialCard
                    className="w-fit"
                    record={{
                        ...transcriptRecord,
                        uri: transcriptEntry.uri,
                        category: getTranscriptCategory(transcriptEntry.vc, transcriptRecord),
                    }}
                />
            ) : timedOut ? (
                <div className="space-y-3">
                    <p className="text-sm text-grayscale-600">
                        {m['transcriptOptIn.inPassport']()}
                    </p>
                    <PrimaryButton onClick={() => history.push('/passport')}>
                        {m['transcriptOptIn.viewInPassport']()}
                    </PrimaryButton>
                </div>
            ) : (
                <p
                    data-testid="transcript-optin-received-pending"
                    role="status"
                    className="flex items-center gap-2 text-sm text-grayscale-600 leading-relaxed"
                >
                    <span
                        aria-hidden="true"
                        className="w-4 h-4 border-2 border-grayscale-200 border-t-grayscale-600 rounded-full animate-spin"
                    />
                    {m['transcriptOptIn.finishingUp']()}
                </p>
            )}
        </div>
    );
};

/**
 * Wallet / School Connect transcript card. Renders (and fetches) nothing unless the
 * tenant enables `classlinkTranscriptOptIn` and the account is ready; all queries
 * live in the gated inner component so other tenants pay no network cost.
 */
export const TranscriptOptInCard: React.FC<TranscriptOptInCardProps> = ({ source, variant }) => {
    const features = useFeatureConfig();
    const { state: coordinatorState } = useAppAuth();

    if (!features.classlinkTranscriptOptIn || coordinatorState.status !== 'ready') return null;

    return <TranscriptOptInCardContent source={source} variant={variant} />;
};

const TranscriptOptInCardContent: React.FC<TranscriptOptInCardProps> = ({ source, variant }) => {
    const history = useHistory();
    const { track } = useAnalytics();

    const status = useTranscriptStatus(true);
    const request = useRequestTranscript();
    const { mutateAsync: getClassLinkAuthorizeUrl } = useClassLinkAuthorizeUrl();

    const [consent, setConsent] = useState(false);
    const [requestResult, setRequestResult] = useState<RequestResult | null>(null);
    const [submitError, setSubmitError] = useState('');
    const [reauthError, setReauthError] = useState('');
    const [reauthing, setReauthing] = useState(false);

    const data = status.data;
    const latest = data?.latest ?? requestResult;

    const { isPollingExhausted, checkAgain } = useTranscriptArrival({
        status: latest?.status,
        issuerDid: data?.issuerDid,
        issuerProfileId: data?.issuerProfileId,
        requestId: latest?.requestId,
        requestedAt: latest?.requestedAt,
        receivedAt: latest?.receivedAt,
    });

    // A FORBIDDEN/NOT_FOUND response means the signed-in user isn't a ClassLink
    // user at all, so the card must hide silently rather than show an error.
    const trpcCode = (status.error as { data?: { code?: string } } | null)?.data?.code;
    if (trpcCode === 'FORBIDDEN' || trpcCode === 'NOT_FOUND') return null;

    if (status.isLoading || (!status.isError && !status.isFetched)) return null;

    if (variant === 'banner') {
        if (!data?.eligible || latest?.receivedAt || status.isError) return null;
        const waiting = latest?.status === 'requested';
        const failed = latest?.status === 'failed' || latest?.status === 'none_yet';
        return (
            <section
                data-testid="transcript-optin-banner"
                className={`mb-4 flex items-center gap-3 rounded-[20px] px-4 py-3 font-poppins ${waiting || failed ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}
            >
                <IonIcon
                    icon={waiting ? timeOutline : documentTextOutline}
                    className="shrink-0 text-xl"
                />
                <p className="flex-1 text-sm">
                    {waiting
                        ? m['transcriptOptIn.preparingTranscript']()
                        : failed
                          ? m['transcriptOptIn.bannerFailed']()
                          : m['transcriptOptIn.bannerTitle']()}
                </p>
                {!waiting && (
                    <button
                        type="button"
                        className="shrink-0 rounded-[20px] bg-grayscale-900 px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                        onClick={() => history.push('/school-connect')}
                    >
                        {failed ? m['transcriptOptIn.tryAgain']() : m['transcriptOptIn.getIt']()}
                    </button>
                )}
            </section>
        );
    }

    const submit = async () => {
        if (!consent || request.isPending) return;
        setSubmitError('');
        try {
            const result = await request.mutateAsync();
            // Each request (including a retry after `none_yet`) needs its own consent.
            setConsent(false);
            setRequestResult(result);
            if (result.status === 'requested') {
                void track(AnalyticsEvents.TRANSCRIPT_REQUESTED, { source });
            }
        } catch (err) {
            setSubmitError(errorMessage(err));
        }
    };

    const reauth = async () => {
        if (reauthing) return;
        setReauthing(true);
        setReauthError('');
        const outcome = await runClassLinkLogin(
            getClassLinkAuthorizeUrl,
            path => history.push(path),
            window.location.pathname,
            'connect'
        );
        // 'handled' (native sheet closed / timed out): the callback route already shows
        // its own message, so only a genuine failure gets the inline error.
        if (outcome === 'failed') setReauthError(m['transcriptOptIn.error']());
        // On native the callback runs in-app and this card stays mounted underneath it.
        if (outcome !== 'started' || Capacitor.isNativePlatform()) setReauthing(false);
    };

    const recheck = (): void => {
        checkAgain();
        void status.refetch();
    };

    const requestHeader = data ? (
        <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <IonIcon icon={documentTextOutline} className="text-2xl" />
            </div>
            <div className="flex-1">
                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                    {m['transcriptOptIn.title']({ state: data.stateDisplayName })}
                </h2>
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {m['transcriptOptIn.body']()}
                </p>
            </div>
        </div>
    ) : null;

    let content: React.ReactNode;

    /**
     * Fresh ClassLink authentication (and a state student ID) is only needed to send a
     * NEW request, so this gate is applied where a request would be offered, never in
     * front of an already received or outstanding transcript.
     */
    const renderNewRequestGate = (): React.ReactNode => {
        if (data?.reason === 'reauth_required') {
            return (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-grayscale-900">
                        {m['transcriptOptIn.reauthRequired']()}
                    </h2>
                    {reauthError && <ErrorBanner message={reauthError} />}
                    <PrimaryButton
                        data-testid="transcript-optin-reauth"
                        disabled={reauthing}
                        busy={reauthing}
                        busyText={m['transcriptOptIn.reauthing']()}
                        onClick={reauth}
                    >
                        {m['transcriptOptIn.reauthButton']()}
                    </PrimaryButton>
                </div>
            );
        }
        if (data?.reason === 'no_state_id') {
            return (
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {m['transcriptOptIn.noStateId']()}
                </p>
            );
        }
        return null;
    };

    /** Consent + submit, shared by the first request and every retry. */
    const renderRequestControls = (retry: boolean): React.ReactNode => (
        <>
            {submitError && <ErrorBanner message={submitError} />}
            <TranscriptConsentCheckbox
                checked={consent}
                onChange={setConsent}
                stateDisplayName={data?.stateDisplayName ?? ''}
            />
            <div>
                <PrimaryButton
                    data-testid="transcript-optin-submit"
                    disabled={!consent || request.isPending}
                    busy={request.isPending}
                    busyText={m['transcriptOptIn.requesting']()}
                    onClick={submit}
                >
                    {retry || submitError
                        ? m['transcriptOptIn.tryAgain']()
                        : m['transcriptOptIn.submit']()}
                </PrimaryButton>
            </div>
        </>
    );

    if (status.isError) {
        content = (
            <div className="space-y-4">
                <ErrorBanner message={errorMessage(status.error)} />
                <PrimaryButton onClick={() => status.refetch()}>
                    {m['transcriptOptIn.tryAgain']()}
                </PrimaryButton>
            </div>
        );
    } else {
        if (!data || data.reason === 'not_enabled') return null;

        if (latest?.receivedAt) {
            content = (
                <ReceivedTranscript
                    issuerDid={data.issuerDid}
                    requestId={latest.requestId}
                    receivedAt={latest.receivedAt}
                />
            );
        } else if (latest?.status === 'requested') {
            const elapsed = Date.now() - new Date(latest.requestedAt).getTime();
            const isStale = isPollingExhausted || elapsed > TRANSCRIPT_STALE_AFTER_MS;
            const isUntrackable = !data.issuerDid || !data.issuerProfileId;

            if (isUntrackable) {
                content = (
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <IonIcon icon={checkmarkCircleOutline} className="text-2xl" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                                    {m['transcriptOptIn.requestSent']()}
                                </h2>
                                <p className="text-sm text-grayscale-600 leading-relaxed">
                                    {m['transcriptOptIn.untrackableBody']()}
                                </p>
                            </div>
                        </div>
                        <PrimaryButton onClick={() => history.push('/notifications')}>
                            {m['transcriptOptIn.openNotifications']()}
                        </PrimaryButton>
                    </div>
                );
            } else {
                content = (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                                <IonIcon icon={timeOutline} className="text-amber-500" />
                                {m['transcriptOptIn.waiting']()}
                            </span>
                        </div>
                        <h2 className="text-xl font-semibold text-grayscale-900">
                            {m['transcriptOptIn.preparingTranscript']()}
                        </h2>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {m['transcriptOptIn.willAddWhenArrives']()}
                        </p>

                        {isStale ? (
                            <div data-testid="transcript-optin-stale" className="space-y-4 mt-4">
                                <p className="text-sm text-grayscale-600 leading-relaxed">
                                    {m['transcriptOptIn.checkManually']()}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <PrimaryButton
                                        data-testid="transcript-optin-check-again"
                                        onClick={recheck}
                                    >
                                        {m['transcriptOptIn.checkAgain']()}
                                    </PrimaryButton>
                                    <button
                                        type="button"
                                        data-testid="transcript-optin-open-notifications"
                                        className="w-full py-3 px-4 rounded-[20px] border border-grayscale-200 text-grayscale-900 font-medium text-sm hover:bg-grayscale-50 transition-colors"
                                        onClick={() => history.push('/notifications')}
                                    >
                                        {m['transcriptOptIn.openNotifications']()}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4">
                                <div className="w-full h-1 bg-grayscale-200 rounded-full overflow-hidden mb-4">
                                    <div className="h-full bg-amber-400 w-full animate-pulse" />
                                </div>
                                <button
                                    type="button"
                                    onClick={recheck}
                                    className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                                >
                                    {m['transcriptOptIn.checkNow']()}
                                </button>
                            </div>
                        )}
                    </div>
                );
            }
        } else if (latest?.status === 'none_yet') {
            // `none_yet` never expires server-side, so the student needs an explicit retry
            // (with the same consent as a first request). The server budget throttles it.
            content = (
                <div data-testid="transcript-optin-none-yet" className="space-y-4">
                    {requestHeader}
                    <div className="p-3 bg-grayscale-10 border border-grayscale-200 rounded-2xl">
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {m['transcriptOptIn.noneYet']()}
                        </p>
                    </div>
                    {renderNewRequestGate() ?? renderRequestControls(true)}
                </div>
            );
        } else {
            // No outstanding request (or the last attempt failed, which simply re-shows
            // the opt-in so the user can retry), once eligible to request.
            content = renderNewRequestGate() ?? (
                <div className="space-y-4">
                    {requestHeader}
                    {latest?.status === 'failed' && (
                        <ErrorBanner message={m['transcriptOptIn.error']()} />
                    )}
                    {renderRequestControls(latest?.status === 'failed')}
                </div>
            );
        }
    }

    // The Passport card brings its own chrome; nesting it in this card would double it.
    const showsPassportCard = Boolean(data && data.reason !== 'not_enabled' && latest?.receivedAt);
    return (
        <section
            data-testid="transcript-optin-card"
            className={
                showsPassportCard
                    ? 'w-full font-poppins'
                    : 'w-full rounded-[20px] bg-white p-6 shadow-sm border border-grayscale-200 font-poppins'
            }
        >
            {content}
        </section>
    );
};
