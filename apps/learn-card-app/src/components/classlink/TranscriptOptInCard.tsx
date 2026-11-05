import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import type { VC } from '@learncard/types';
import {
    useTranscriptStatus,
    useRequestTranscript,
    useFeatureConfig,
    useGetCredentials,
    useWallet,
    useModal,
    Checkbox,
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
import { startClassLinkLogin } from '../../auth/classlink/startClassLinkLogin';

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

const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
    <div
        role="alert"
        className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5"
    >
        <IonIcon icon={alertCircleOutline} className="text-red-400 text-lg mt-0.5 shrink-0" />
        <span className="text-sm text-red-700 leading-relaxed">{message}</span>
    </div>
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

const errorMessage = (error: unknown): string =>
    error instanceof Error && error.message ? error.message : m['transcriptOptIn.error']();

export const TranscriptOptInCard: React.FC<TranscriptOptInCardProps> = ({ source }) => {
    const history = useHistory();
    const features = useFeatureConfig();
    const { state: coordinatorState } = useAppAuth();
    const isReady = coordinatorState.status === 'ready';
    const queryEnabled = features.classlinkTranscriptOptIn && isReady;
    const { track } = useAnalytics();

    const status = useTranscriptStatus(queryEnabled);
    const request = useRequestTranscript();
    const { mutateAsync: getClassLinkAuthorizeUrl } = useClassLinkAuthorizeUrl();
    const { newModal } = useModal();
    const { initWallet } = useWallet();

    const [consent, setConsent] = useState(false);
    const [requestResult, setRequestResult] = useState<RequestResult | null>(null);
    const [submitError, setSubmitError] = useState('');
    const [reauthError, setReauthError] = useState('');
    const [reauthing, setReauthing] = useState(false);

    const data = status.data;
    const latest = data?.latest ?? requestResult;

    useTranscriptArrival({
        status: latest?.status,
        issuerDid: data?.issuerDid,
        requestId: latest?.requestId,
        requestedAt: latest?.requestedAt,
        receivedAt: latest?.receivedAt,
    });

    const { data: allCreds } = useGetCredentials(undefined, undefined, true);
    const transcriptEntry = allCreds?.find(
        (entry): entry is { vc: VC; uri?: string } =>
            'vc' in entry &&
            getIssuerDid(entry.vc) === data?.issuerDid &&
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
        if (latest?.receivedAt && latest?.requestId && transcriptModel) {
            const key = `transcript_arrival_${latest.requestId}`;
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
    }, [latest?.receivedAt, latest?.requestId, transcriptModel, newModal]);

    if (!queryEnabled) return null;

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
        const ok = await startClassLinkLogin(
            getClassLinkAuthorizeUrl,
            path => history.push(path),
            window.location.pathname,
            'connect'
        );
        if (!ok) {
            setReauthError(m['transcriptOptIn.error']());
            setReauthing(false);
        }
    };

    let content: React.ReactNode;

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

        if (data.reason === 'reauth_required') {
            content = (
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
        } else if (data.reason === 'no_state_id') {
            content = (
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {m['transcriptOptIn.noStateId']()}
                </p>
            );
        } else if (latest?.status === 'requested' && !latest?.receivedAt) {
            const elapsed = Date.now() - new Date(latest.requestedAt).getTime();
            const isLong = elapsed > 15 * 60 * 1000;
            content = (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        {!isLong && (
                            <span className="w-5 h-5 border-2 border-grayscale-300 border-t-grayscale-900 rounded-full animate-spin shrink-0" />
                        )}
                        <p className="text-sm text-grayscale-900 font-medium">
                            {m['transcriptOptIn.requestingFrom']({ state: data.stateDisplayName })}
                        </p>
                    </div>
                    {isLong && (
                        <p className="text-sm text-grayscale-600">
                            {m['transcriptOptIn.takingAWhile']()}
                        </p>
                    )}
                </div>
            );
        } else if (latest?.receivedAt && transcriptModel) {
            content = (
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
                </div>
            );
        } else if (latest?.status === 'none_yet') {
            content = (
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {m['transcriptOptIn.noneYet']()}
                </p>
            );
        } else {
            // Eligible: no outstanding request (or the last attempt failed, which
            // simply re-shows the opt-in so the user can retry).
            content = (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                        {m['transcriptOptIn.title']({ state: data.stateDisplayName })}
                    </h2>
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {m['transcriptOptIn.body']()}
                    </p>
                    {submitError && <ErrorBanner message={submitError} />}
                    <div data-testid="transcript-optin-consent" className="inline-block">
                        <Checkbox
                            checked={consent}
                            onChange={setConsent}
                            label={m['transcriptOptIn.consent']({ state: data.stateDisplayName })}
                        />
                    </div>
                    <div>
                        <PrimaryButton
                            data-testid="transcript-optin-submit"
                            disabled={!consent || request.isPending}
                            busy={request.isPending}
                            busyText={m['transcriptOptIn.requesting']()}
                            onClick={submit}
                        >
                            {submitError
                                ? m['transcriptOptIn.tryAgain']()
                                : m['transcriptOptIn.submit']()}
                        </PrimaryButton>
                    </div>
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
