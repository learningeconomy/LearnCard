import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import {
    useTranscriptStatus,
    useRequestTranscript,
    useFeatureConfig,
    Checkbox,
} from 'learn-card-base';
import { useClassLinkAuthorizeUrl } from 'learn-card-base/react-query/mutations/firebase';
import * as m from '../../paraglide/messages.js';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import { startClassLinkLogin } from '../../auth/classlink/startClassLinkLogin';

type RequestResult = { status: 'requested' | 'none_yet' | 'failed'; requestedAt: string };

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

export const TranscriptOptInCard: React.FC = () => {
    const history = useHistory();
    const features = useFeatureConfig();
    const { state: coordinatorState } = useAppAuth();
    const isReady = coordinatorState.status === 'ready';
    const queryEnabled = features.classlinkTranscriptOptIn && isReady;

    const status = useTranscriptStatus(queryEnabled);
    const request = useRequestTranscript();
    const { mutateAsync: getClassLinkAuthorizeUrl } = useClassLinkAuthorizeUrl();

    const [consent, setConsent] = useState(false);
    const [requestResult, setRequestResult] = useState<RequestResult | null>(null);
    const [submitError, setSubmitError] = useState('');
    const [reauthError, setReauthError] = useState('');
    const [reauthing, setReauthing] = useState(false);

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
            setRequestResult(await request.mutateAsync());
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
        const data = status.data;
        if (!data || data.reason === 'not_enabled') return null;

        const latest = requestResult ?? data.latest;

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
        } else if (latest?.status === 'requested') {
            content = (
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {m['transcriptOptIn.requested']()}
                </p>
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
