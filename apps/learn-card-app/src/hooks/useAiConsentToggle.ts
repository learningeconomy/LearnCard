import { useCallback } from 'react';

import { ToastTypeEnum, useUpdatePreferences, useGetCurrentLCNUser, useToast } from 'learn-card-base';

import useAutoConsentLearnCardAi from './useAutoConsentLearnCardAi';
import { useGuardianGate } from './useGuardianGate';

type AiToggleDeps = {
    /** If true, child-profile consent flow is needed (else simple preference update) */
    isChildProfile: boolean;
};

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
export const useAiConsentToggle = ({ isChildProfile }: AiToggleDeps) => {
    const { mutateAsync: updatePreferencesAsync } = useUpdatePreferences();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { presentToast } = useToast();
    const { guardedAction } = useGuardianGate();
    const { autoConsentLearnCardAi, withdrawLearnCardAiConsent } = useAutoConsentLearnCardAi();

    const handleAiToggle = useCallback(
        async (enabled: boolean) => {
            // ---- Case 1: Turning OFF for a child profile ----
            // Withdraw consent first, then update preferences.
            // If preference update fails, we re-consent to restore the contract.
            if (!enabled && isChildProfile) {
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
                    // Rollback: restore preferences to enabled since we couldn't withdraw consent
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

            // ---- Case 2: Simple toggle (adult or turning off non-child) ----
            if (!enabled || !isChildProfile) {
                try {
                    await updatePreferencesAsync({ aiEnabled: enabled });
                } catch {
                    presentToast('Something went wrong. Please try again.', {
                        type: ToastTypeEnum.Error,
                    });
                }
                return;
            }

            // ---- Case 3: Turning ON for a child profile (guardian-gated) ----
            // Update preferences first, then consent. Roll back if consent fails.
            await guardedAction(
                async () => {
                    try {
                        await updatePreferencesAsync({ aiEnabled: true });
                    } catch {
                        presentToast('Something went wrong. Please try again.', {
                            type: ToastTypeEnum.Error,
                        });
                        return;
                    }

                    const consented = await autoConsentLearnCardAi({
                        enabled: true,
                        userOverrides: {
                            displayName: currentLCNUser?.displayName ?? '',
                            image: currentLCNUser?.image ?? '',
                        },
                    });

                    if (!consented) {
                        // Rollback: undo the preference update since consent failed
                        try {
                            await updatePreferencesAsync({ aiEnabled: false });
                        } catch {
                            // Best effort rollback
                        }
                        presentToast('Something went wrong. Please try again.', {
                            type: ToastTypeEnum.Error,
                        });
                    }
                },
                { ignorePriorVerification: true }
            );
        },
        [
            autoConsentLearnCardAi,
            currentLCNUser?.displayName,
            currentLCNUser?.image,
            guardedAction,
            isChildProfile,
            presentToast,
            updatePreferencesAsync,
            withdrawLearnCardAiConsent,
        ]
    );

    return { handleAiToggle };
};
