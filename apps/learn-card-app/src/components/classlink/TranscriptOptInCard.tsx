import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline } from 'ionicons/icons';
import type { VC } from '@learncard/types';
import {
    useTranscriptStatus,
    useRequestTranscript,
    useFeatureConfig,
    useGetCredentials,
    useWallet,
    useModal,
    getIssuerDid,
} from 'learn-card-base';
import { ClrTranscriptSurface } from 'learn-card-base/helpers/credentials/clr/renderer';
import type { LCR } from 'learn-card-base/types/credential-records';
import { useClassLinkAuthorizeUrl } from 'learn-card-base/react-query/mutations/firebase';
import { useTranscriptArrival } from '../../hooks/useTranscriptArrival';
import ClrTranscriptDetailModal from '../clr-transcript/ClrTranscriptDetailModal';
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
/** After this long, the waiting copy changes to "this can take a while". */
const TRANSCRIPT_SLOW_AFTER_MS = 15 * 60 * 1000;

type RequestResult = {
    status: 'requested' | 'none_yet' | 'failed';
    requestedAt: string;
    requestId?: string;
    receivedAt?: string;
};

type TranscriptOptInCardProps = {
    /** Where this card is rendered, for `transcript_requested` analytics only. */
    source: 'wallet' | 'school_connect';
};

const spinner = (
    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
);

const PrimaryButton: React.FC<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean; busyText?: string }
> = ({ busy, busyText, children, ...rest }) => (
    <button
        type="button"
        className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
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
    const { newModal } = useModal();
    const { initWallet } = useWallet();

    const { data: allCreds } = useGetCredentials(undefined, undefined, true);
    const transcriptEntry = allCreds?.find(
        (entry): entry is { vc: VC; uri?: string } =>
            'vc' in entry &&
            Boolean(issuerDid) &&
            getIssuerDid(entry.vc) === issuerDid &&
            Boolean(entry.vc.type?.includes('ClrCredential'))
    );
    const transcriptVc = transcriptEntry?.vc;
    const transcriptModel = transcriptVc ? normalizeClrTranscriptDisplayModel(transcriptVc) : null;
    const schoolName = transcriptModel?.header.issuerName?.value;
    const gpa = transcriptModel?.summary.gpa?.value;
    const awardedDate = transcriptModel?.header.awardedDate?.value;
    const graduationYear = awardedDate ? new Date(String(awardedDate)).getFullYear() : undefined;

    // `unreadUpdate` lives on the encrypted wallet index record, not the resolved VC.
    const { data: transcriptRecord } = useQuery({
        queryKey: ['transcriptIndexRecord', transcriptEntry?.uri],
        queryFn: async () => {
            const wallet = await initWallet();
            const records = await wallet.index.LearnCloud.get<LCR>();
            return records.find(record => record.uri === transcriptEntry?.uri) ?? null;
        },
        enabled: Boolean(transcriptEntry?.uri),
    });
    const unreadUpdate = transcriptRecord?.refresh?.unreadUpdate;
    const updatedAt = transcriptRecord?.refresh?.lastUpdatedAt;

    const openTranscript = (): void => {
        if (!transcriptModel || !transcriptVc) return;
        newModal(
            <ClrTranscriptDetailModal
                model={transcriptModel}
                boost={transcriptVc}
                boostUri={transcriptEntry?.uri}
                options={{ viewer: 'student', surface: ClrTranscriptSurface.Full }}
            />
        );
    };

    React.useEffect(() => {
        if (receivedAt && requestId && transcriptModel) {
            const key = `transcript_arrival_${requestId}`;
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, 'true');
                newModal(
                    <div className="p-8 text-center space-y-5">
                        <h2 className="text-xl font-semibold text-grayscale-900">
                            {m['transcriptOptIn.arrivedTitle']()}
                        </h2>
                        <PrimaryButton onClick={openTranscript}>
                            {m['transcriptOptIn.viewTranscript']()}
                        </PrimaryButton>
                    </div>
                );
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [receivedAt, requestId, transcriptModel, newModal]);

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
            <h2 className="text-xl font-semibold text-grayscale-900">
                {schoolName || m['transcriptOptIn.transcript']()}
            </h2>
            {transcriptModel ? (
                <>
                    <div className="text-sm text-grayscale-600 space-y-1">
                        {graduationYear && (
                            <p>{m['transcriptOptIn.gradYear']({ year: graduationYear })}</p>
                        )}
                        {gpa !== undefined && (
                            <p>{m['transcriptOptIn.gpa']({ gpa: String(gpa) })}</p>
                        )}
                    </div>
                    <PrimaryButton onClick={openTranscript}>
                        {m['transcriptOptIn.viewTranscript']()}
                    </PrimaryButton>
                </>
            ) : (
                <p
                    data-testid="transcript-optin-received-pending"
                    className="text-sm text-grayscale-600 leading-relaxed"
                >
                    {m['transcriptOptIn.receivedLoading']()}
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
export const TranscriptOptInCard: React.FC<TranscriptOptInCardProps> = ({ source }) => {
    const features = useFeatureConfig();
    const { state: coordinatorState } = useAppAuth();

    if (!features.classlinkTranscriptOptIn || coordinatorState.status !== 'ready') return null;

    return <TranscriptOptInCardContent source={source} />;
};

const TranscriptOptInCardContent: React.FC<TranscriptOptInCardProps> = ({ source }) => {
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
            const isSlow = elapsed > TRANSCRIPT_SLOW_AFTER_MS;
            content = (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        {!isSlow && !isStale && (
                            <span className="w-5 h-5 border-2 border-grayscale-300 border-t-grayscale-900 rounded-full animate-spin shrink-0" />
                        )}
                        <p className="text-sm text-grayscale-900 font-medium">
                            {m['transcriptOptIn.requestingFrom']({ state: data.stateDisplayName })}
                        </p>
                    </div>
                    {isStale ? (
                        <div data-testid="transcript-optin-stale" className="space-y-4">
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
                                    className="py-3 px-4 rounded-[20px] border border-grayscale-200 text-grayscale-900 font-medium text-sm hover:bg-grayscale-50 transition-colors"
                                    onClick={() => history.push('/notifications')}
                                >
                                    {m['transcriptOptIn.openNotifications']()}
                                </button>
                            </div>
                        </div>
                    ) : (
                        isSlow && (
                            <p className="text-sm text-grayscale-600">
                                {m['transcriptOptIn.takingAWhile']()}
                            </p>
                        )
                    )}
                </div>
            );
        } else if (latest?.status === 'none_yet') {
            // `none_yet` never expires server-side, so the student needs an explicit retry
            // (with the same consent as a first request). The server budget throttles it.
            content = (
                <div data-testid="transcript-optin-none-yet" className="space-y-4">
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {m['transcriptOptIn.noneYet']()}
                    </p>
                    {renderNewRequestGate() ?? renderRequestControls(true)}
                </div>
            );
        } else {
            // No outstanding request (or the last attempt failed, which simply re-shows
            // the opt-in so the user can retry), once eligible to request.
            content = renderNewRequestGate() ?? (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                        {m['transcriptOptIn.title']({ state: data.stateDisplayName })}
                    </h2>
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {m['transcriptOptIn.body']()}
                    </p>
                    {renderRequestControls(false)}
                </div>
            );
        }
    }

    return (
        <section
            data-testid="transcript-optin-card"
            className="w-full max-w-md mx-auto mb-5 p-6 bg-white rounded-[20px] font-poppins space-y-5"
        >
            {content}
        </section>
    );
};
