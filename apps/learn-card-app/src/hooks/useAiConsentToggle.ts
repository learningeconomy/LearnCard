import { useCallback } from 'react';

import {
    ToastTypeEnum,
    useUpdatePreferences,
    useToast,
    switchedProfileStore,
} from 'learn-card-base';

import useAutoConsentLearnCardAi from './useAutoConsentLearnCardAi';
import { useGuardianGate } from './useGuardianGate';

/**
 * Shared hook for toggling AI features with transaction-like consistency
 * between the consent contract and stored preferences.
 *
 * Strategy: "Preferences-first with rollback"
 * 1. Update preferences optimistically (fire-and-forget via mutate)
 * 2. Perform the consent/withdraw operation
 * 3. If consent fails, roll back preferences to the previous value
 *
 * This avoids the original bug where consent could succeed but preferences
 * could fail (or vice versa), leaving state inconsistent.
 */
export const useAiConsentToggle = () => {
    const { mutateAsync: updatePreferencesAsync } = useUpdatePreferences();
    const { presentToast } = useToast();
    const { guardedAction } = useGuardianGate();
    const { autoConsentLearnCardAi, withdrawLearnCardAiConsent } = useAutoConsentLearnCardAi();
    const profileType = switchedProfileStore.use.profileType();
    const isChildProfile = profileType === 'child';

    const handleAiToggle = useCallback(
        async (enabled: boolean) => {
            // ---- Case 1: Turning OFF ----
            // Update preferences first, then withdraw consent.
            // If withdrawal fails, restore preferences so state stays consistent.
            if (!enabled) {
                try {
                    await updatePreferencesAsync({ aiEnabled: false });
                } catch {
                    presentToast('Something went wrong. Please try again.', {
                        type: ToastTypeEnum.Error,
                    });
                    return;
                }

                const withdrawn = await withdrawLearnCardAiConsent();
                if (!withdrawn) {
                    // Rollback: restore preferences to enabled since we couldn't withdraw consent.
                    try {
                        await updatePreferencesAsync({ aiEnabled: true });
                    } catch {
                        // Best effort rollback — at least we tried
                    }
                    presentToast('Something went wrong. Please try again.', {
                        type: ToastTypeEnum.Error,
                    });
                }
                return;
            }

            const syncConsent = async () => {
                try {
                    await updatePreferencesAsync({ aiEnabled: true });
                } catch {
                    presentToast('Something went wrong. Please try again.', {
                        type: ToastTypeEnum.Error,
                    });
                    return;
                }

                const consented = await autoConsentLearnCardAi({ enabled: true });

                if (!consented) {
                    // Rollback: undo the preference update since consent failed.
                    try {
                        await updatePreferencesAsync({ aiEnabled: false });
                    } catch {
                        // Best effort rollback
                    }
                    presentToast('Something went wrong. Please try again.', {
                        type: ToastTypeEnum.Error,
                    });
                }
            };

            // ---- Case 2: Turning ON ----
            // Update preferences first, then consent. Roll back if consent fails.
            if (isChildProfile) {
                await guardedAction(syncConsent, { ignorePriorVerification: true });
                return;
            }

            await syncConsent();
        },
        [
            autoConsentLearnCardAi,
            guardedAction,
            presentToast,
            updatePreferencesAsync,
            withdrawLearnCardAiConsent,
            isChildProfile,
        ]
    );

    return { handleAiToggle };
};
