import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRequestTranscript, getLogger } from 'learn-card-base';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

import * as m from '../../../paraglide/messages.js';
import { useAnalytics, AnalyticsEvents } from '@analytics';
import { isClassLinkStudentSession } from '../../../auth/classlink/classlinkProfileDefaults';
import {
    TranscriptConsentCheckbox,
    TranscriptErrorBanner,
    getTranscriptErrorMessage,
} from '../../classlink/TranscriptConsent';

const log = getLogger('onboarding-transcript-step');

export type OnboardingTranscriptEligibility = {
    eligible: boolean;
    stateDisplayName: string;
};

const NOT_ELIGIBLE: OnboardingTranscriptEligibility = { eligible: false, stateDisplayName: '' };

/**
 * Whether onboarding should offer the transcript step. Reads status imperatively
 * from the wallet that was just created (the `useTranscriptStatus` hook's data was
 * captured before the profile existed). Only ClassLink student sessions on tenants
 * with `classlinkTranscriptOptIn` qualify, and only with no request on record.
 * Any failure means "not eligible" — onboarding must never block on this.
 */
export const getOnboardingTranscriptEligibility = async (
    wallet: Pick<BespokeLearnCard, 'invoke'>,
    featureEnabled: boolean
): Promise<OnboardingTranscriptEligibility> => {
    if (!featureEnabled) return NOT_ELIGIBLE;
    if (!(await isClassLinkStudentSession())) return NOT_ELIGIBLE;

    try {
        const status = await wallet.invoke.transcriptsGetStatus();
        return {
            eligible: Boolean(status?.eligible) && !status?.latest,
            stateDisplayName: status?.stateDisplayName ?? '',
        };
    } catch (error) {
        log.warn('transcript.status.unavailable', error);
        return NOT_ELIGIBLE;
    }
};

export type TranscriptOnboardingStepProps = {
    stateDisplayName: string;
    /**
     * Called once the student has requested (`requested: true`) or skipped the
     * transcript. The parent decides what comes next (PIN step / celebrate).
     */
    onComplete: (result: { requested: boolean }) => void | Promise<void>;
};

/**
 * Onboarding step offering a ClassLink student their state transcript. Uses the
 * same consent checkbox as `TranscriptOptInCard`; the request is only sent after
 * the student ticks it. Request errors are shown inline with a retry, never
 * swallowed; the student can always skip.
 */
export const TranscriptOnboardingStep: React.FC<TranscriptOnboardingStepProps> = ({
    stateDisplayName,
    onComplete,
}) => {
    const { track } = useAnalytics();
    const requestTranscript = useRequestTranscript();
    const [consent, setConsent] = useState(false);
    const [error, setError] = useState('');
    const [isFinishing, setIsFinishing] = useState(false);
    const isBusy = requestTranscript.isPending || isFinishing;

    const finish = async (requested: boolean): Promise<void> => {
        setIsFinishing(true);
        try {
            await onComplete({ requested });
        } finally {
            setIsFinishing(false);
        }
    };

    const handleRequest = async (): Promise<void> => {
        if (!consent || isBusy) return;
        setError('');
        try {
            await requestTranscript.mutateAsync();
        } catch (err) {
            log.error('transcript.request.failed', err);
            setError(getTranscriptErrorMessage(err));
            return;
        }
        track(AnalyticsEvents.TRANSCRIPT_REQUESTED, { source: 'onboarding' });
        await finish(true);
    };

    const handleSkip = async (): Promise<void> => {
        if (isBusy) return;
        track(AnalyticsEvents.TRANSCRIPT_AUTO_ACCEPT_SKIPPED, { reason: 'onboarding_skipped' });
        await finish(false);
    };

    return (
        <div
            className="relative z-10 w-full h-full flex flex-col"
            data-testid="onboarding-transcript-step"
        >
            <div className="flex-1 flex flex-col items-center justify-center px-4 pt-[calc(var(--ion-safe-area-top,0px)+2rem)] pb-8 overflow-y-auto">
                <div className="w-full max-w-[420px] animate-fade-in-up text-center">
                    <h1 className="text-2xl font-semibold text-grayscale-900 mb-2">
                        {m['onboarding.transcript.title']()}
                    </h1>
                    <p className="text-sm text-grayscale-600 mb-8">
                        {m['onboarding.transcript.desc']()}
                    </p>

                    <div className="bg-white/80 backdrop-blur-xs border border-grayscale-200/60 rounded-3xl shadow-xs p-5 mb-6 text-left">
                        <TranscriptConsentCheckbox
                            checked={consent}
                            onChange={setConsent}
                            stateDisplayName={stateDisplayName}
                            disabled={isBusy}
                        />
                    </div>

                    {error && (
                        <div className="mb-6">
                            <TranscriptErrorBanner message={error} />
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            type="button"
                            data-testid="onboarding-transcript-get"
                            disabled={!consent || isBusy}
                            onClick={handleRequest}
                            className="w-full py-3.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-base hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-md"
                        >
                            {requestTranscript.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : error ? (
                                m['transcriptOptIn.tryAgain']()
                            ) : (
                                m['onboarding.transcript.get']()
                            )}
                        </button>
                        <button
                            type="button"
                            data-testid="onboarding-transcript-skip"
                            disabled={isBusy}
                            onClick={handleSkip}
                            className="w-full py-3.5 px-4 rounded-[20px] bg-transparent text-grayscale-600 font-medium text-base hover:bg-grayscale-50 transition-all disabled:opacity-40"
                        >
                            {m['onboarding.transcript.notNow']()}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
