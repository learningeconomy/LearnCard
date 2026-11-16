import React from 'react';
import { getLogger } from 'learn-card-base';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

import { isClassLinkStudentSession } from '../../../auth/classlink/classlinkProfileDefaults';
import { TranscriptRequestFlow } from '../../classlink/TranscriptRequestFlow';

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
    return (
        <div
            className="relative z-10 w-full h-full flex flex-col"
            data-testid="onboarding-transcript-step"
        >
            <div className="flex-1 flex flex-col items-center justify-center px-4 pt-[calc(var(--ion-safe-area-top,0px)+2rem)] pb-8 overflow-y-auto">
                <TranscriptRequestFlow
                    variant="onboarding"
                    stateDisplayName={stateDisplayName}
                    onDone={onComplete}
                />
            </div>
        </div>
    );
};
