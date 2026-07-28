import React, { useCallback } from 'react';

import { useToast, ToastTypeEnum } from 'learn-card-base';

import ClaimFeedbackToast, { CLAIM_FEEDBACK_TOAST_DURATION_MS } from './ClaimFeedbackToast';
import { canPromptForFeedback } from './feedbackGovernor';
import { useFeedbackPrivacyEligibility } from './useFeedbackEligibility';
import * as m from '../paraglide/messages.js';

export const useClaimSuccessToast = () => {
    const { presentToast } = useToast();
    const privacyEligible = useFeedbackPrivacyEligibility();

    return useCallback(() => {
        // Governor state is checked at call time (not render time) so budget
        // consumed between render and claim can't show a stale feedback toast.
        if (privacyEligible && canPromptForFeedback('claim_interaction')) {
            presentToast(<ClaimFeedbackToast surface="claim_interaction" />, {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
                duration: CLAIM_FEEDBACK_TOAST_DURATION_MS,
            });

            return;
        }

        presentToast(m['toasts.credentialClaimed'](), {
            type: ToastTypeEnum.Success,
            hasDismissButton: true,
        });
    }, [privacyEligible, presentToast]);
};

export default useClaimSuccessToast;
