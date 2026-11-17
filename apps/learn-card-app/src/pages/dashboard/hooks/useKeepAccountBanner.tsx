import React, { useEffect, useState } from 'react';
import { ModalTypes, useModal } from 'learn-card-base';
import { isPublicComputerMode } from '@learncard/sss-key-manager';
import { RECOVERY_PROMPT_SNOOZE_MS } from 'learn-card-base/stores/firstStartupStore';

import { AnalyticsEvents, useAnalytics } from '@analytics';
import { KeepAccountStep } from '../../../components/classlink/KeepAccountStep';
import { useKeepAccountOffer } from '../../../components/classlink/useKeepAccountOffer';
import { useAppAuth } from '../../../providers/AuthCoordinatorProvider';
import type { DashboardKeepAccountViewModel } from '../DashboardView.types';

/** Same length as the recovery banner's snooze, but a separate, per-account key. */
export const KEEP_ACCOUNT_SNOOZE_MS = RECOVERY_PROMPT_SNOOZE_MS;
const SNOOZE_KEY_PREFIX = 'classlink_keep_account_snoozed_until_';

/** Short non-reversible key so the raw DID is not stored. */
export const getKeepAccountSnoozeKey = (did: string): string =>
    `${SNOOZE_KEY_PREFIX}${Array.from(did).reduce(
        (hash, char) => (Math.imul(31, hash) + char.charCodeAt(0)) | 0,
        0
    )}`;

const readSnoozedUntil = (did: string | undefined): number => {
    if (!did) return 0;
    try {
        return Number(localStorage.getItem(getKeepAccountSnoozeKey(did))) || 0;
    } catch {
        return 0;
    }
};

/**
 * The dashboard's ClassLink "keep your account" banner. `banner` is set only while it
 * should show; `pending` is true while the server answer is still loading, so the slot can
 * stay empty instead of showing the recovery banner first. Driven by the server
 * (`getAccountContinuity`), not by recovery-method counts: it shows while an email or
 * user-held recovery method is still missing, even when the account already has escrow.
 * Never offered while the account's activation is pending or on a public computer, where
 * the recovery banner's urgent prompt must keep the slot. Snoozing uses its own key.
 */
export const useKeepAccountBanner = (): {
    banner?: DashboardKeepAccountViewModel;
    pending: boolean;
} => {
    const { state, recoveryActivationPending } = useAppAuth();
    const urgentRecovery = recoveryActivationPending || isPublicComputerMode();
    const { offer, pending, continuity } = useKeepAccountOffer(!urgentRecovery);
    const did = state.status === 'ready' ? state.did : undefined;
    const { track } = useAnalytics();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.BottomSheet,
    });
    const [snoozedUntil, setSnoozedUntil] = useState(() => readSnoozedUntil(did));

    useEffect(() => {
        setSnoozedUntil(readSnoozedUntil(did));
    }, [did]);

    if (!offer || !continuity || !did || snoozedUntil > Date.now()) return { pending };

    const step = continuity.nextStep === 'method' ? 'method' : 'email';

    const banner: DashboardKeepAccountViewModel = {
        step,
        onStart: () => {
            newModal(
                <div className="p-6 bg-white rounded-t-[20px] max-h-[90vh] overflow-y-auto">
                    <KeepAccountStep
                        variant="sheet"
                        source="dashboard"
                        onComplete={() => closeModal()}
                        onDismiss={() => closeModal()}
                        onBeforeMethod={() => closeModal()}
                    />
                </div>,
                { className: 'bg-transparent!' }
            );
        },
        onSnooze: () => {
            const until = Date.now() + KEEP_ACCOUNT_SNOOZE_MS;
            try {
                localStorage.setItem(getKeepAccountSnoozeKey(did), String(until));
            } catch {
                /* Still snoozed for this session when storage is unavailable. */
            }
            setSnoozedUntil(until);
            track(AnalyticsEvents.KEEP_ACCOUNT_DISMISSED, { source: 'dashboard', step });
        },
    };
    return { banner, pending: false };
};
