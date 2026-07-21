import React, { useCallback } from 'react';

import { useToast, ToastTypeEnum } from 'learn-card-base';

import ClaimFeedbackToast, { CLAIM_FEEDBACK_TOAST_DURATION_MS } from './ClaimFeedbackToast';
import { useFeedbackEligibility } from './useFeedbackEligibility';
import * as m from '../paraglide/messages.js';

export const useClaimSuccessToast = () => {
    const { presentToast } = useToast();
    const feedbackEligible = useFeedbackEligibility('claim_interaction');

    return useCallback(() => {
        if (feedbackEligible) {
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
    }, [feedbackEligible, presentToast]);
};

export default useClaimSuccessToast;
