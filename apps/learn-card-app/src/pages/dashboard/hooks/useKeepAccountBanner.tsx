import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { ModalTypes, useModal } from 'learn-card-base';
import { isPublicComputerMode, isWebAuthnSupported } from '@learncard/sss-key-manager';
import firstStartupStore, {
    RECOVERY_PROMPT_SNOOZE_MS,
} from 'learn-card-base/stores/firstStartupStore';

import { AnalyticsEvents, useAnalytics } from '@analytics';
import { KeepAccountStep } from '../../../components/classlink/KeepAccountStep';
import { useKeepAccountAskedThisSession } from '../../../components/classlink/keepAccountSession';
import { useKeepAccountOffer } from '../../../components/classlink/useKeepAccountOffer';
import { useKeepAccountTitle } from '../../../components/classlink/useKeepAccountTitle';
import { useAppAuth } from '../../../providers/AuthCoordinatorProvider';
import type { DashboardKeepAccountViewModel } from '../DashboardView.types';

/** Same length as the recovery banner's snooze. */
export const KEEP_ACCOUNT_SNOOZE_MS = RECOVERY_PROMPT_SNOOZE_MS;
/** After this many snoozes the banner stops asking, like the recovery banner's backup tier. */
export const KEEP_ACCOUNT_MAX_SNOOZES = 2;
/**
 * Longest the slot waits for the account's escrow state after sign-in (it arrives after
 * `ready`), so the banner never shows before the recovery banner's "create a PIN" tier
 * claims the slot, nor leaves it empty when escrow never answers.
 */
export const KEEP_ACCOUNT_ESCROW_WAIT_MS = 4000;
const SNOOZE_KEY_PREFIX = 'classlink_keep_account_snoozed_until_';
const SNOOZE_COUNT_KEY_PREFIX = 'classlink_keep_account_snooze_count_';

/** Short non-reversible suffix so the raw DID is not stored. */
const hashDid = (did: string): number =>
    Array.from(did).reduce((hash, char) => (Math.imul(31, hash) + char.charCodeAt(0)) | 0, 0);

/** Per-account key for when the snooze ends. */
export const getKeepAccountSnoozeKey = (did: string): string =>
    `${SNOOZE_KEY_PREFIX}${hashDid(did)}`;

/** Per-account key for how many times the banner was snoozed. */
export const getKeepAccountSnoozeCountKey = (did: string): string =>
    `${SNOOZE_COUNT_KEY_PREFIX}${hashDid(did)}`;

type SnoozeState = { until: number; count: number };

const readSnooze = (did: string | undefined): SnoozeState => {
    if (!did) return { until: 0, count: 0 };
    try {
        return {
            until: Number(localStorage.getItem(getKeepAccountSnoozeKey(did))) || 0,
            count: Number(localStorage.getItem(getKeepAccountSnoozeCountKey(did))) || 0,
        };
    } catch {
        return { until: 0, count: 0 };
    }
};

/**
 * The dashboard's ClassLink "keep your account" banner. `banner` is set only while it
 * should show; `pending` is true while the answer is still loading, so the slot can stay
 * empty instead of showing the recovery banner first.
 *
 * Driven by the server (`getAccountContinuity`): it invites the user to add a personal
 * email to sign in with (`email`), then, once the email is in, to create a PIN (`pin`,
 * escrow accounts), to enter the current PIN once so the backup follows the new sign-in
 * email (`confirmPin`, only on the login that holds it; the recovery banner's snooze and
 * tier never hide it) or add a passkey / recovery phrase (`method`, accounts that cannot
 * have escrow here). The PIN and passkey asks open their overlay straight away; the
 * email and the PIN confirm open the step in a sheet. It never
 * takes the slot from the recovery banner's urgent prompt (activation pending, public
 * computer) or its "create a PIN" tier (it waits for the escrow state that decides that
 * tier), never shows in a session that already asked (onboarding, the transcript sheet),
 * and stops after two snoozes.
 *
 * Snoozing uses its own per-account key. Snoozing the PIN or passkey ask also snoozes the
 * recovery banner, and a snoozed recovery banner hides those asks, so snoozing either one
 * never reveals the other asking for the same thing.
 */
export const useKeepAccountBanner = (): {
    banner?: DashboardKeepAccountViewModel;
    pending: boolean;
} => {
    const {
        state,
        capabilities,
        recoveryActivationPending,
        recoveryMethodCount,
        openPinSetup,
        openRecoverySetup,
    } = useAppAuth();
    const urgentRecovery = recoveryActivationPending || isPublicComputerMode();
    const askedThisSession = useKeepAccountAskedThisSession();
    const {
        offer,
        pending,
        continuity,
        step: sessionStep,
    } = useKeepAccountOffer(!urgentRecovery && !askedThisSession);
    const keepAccountTitle = useKeepAccountTitle(offer);
    const did = state.status === 'ready' ? state.did : undefined;
    const { track } = useAnalytics();
    const queryClient = useQueryClient();
    const recoverySnoozedUntil = firstStartupStore.useTracked.recoveryPromptSnoozedUntil();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.BottomSheet,
    });
    const [snooze, setSnooze] = useState(() => readSnooze(did));

    useEffect(() => {
        setSnooze(readSnooze(did));
    }, [did]);

    // The recovery banner's "create a PIN" tier (snooze aside) owns this ask.
    const pinFirstEligible =
        state.status === 'ready' &&
        capabilities.recovery &&
        recoveryMethodCount === 0 &&
        state.escrowEnrollment === 'enrolled' &&
        state.escrowPin?.enabled === false;
    // Escrow state is published a moment after `ready`; until then that tier may still
    // claim the slot. Wait for it, but not forever (escrow off, or its check failed).
    const escrowUnknown =
        state.status === 'ready' &&
        capabilities.recovery &&
        recoveryMethodCount === 0 &&
        state.escrowEnrollment === undefined;
    const [escrowWaitOver, setEscrowWaitOver] = useState(false);
    useEffect(() => {
        if (!escrowUnknown) return;
        const timer = setTimeout(() => setEscrowWaitOver(true), KEEP_ACCOUNT_ESCROW_WAIT_MS);
        return () => clearTimeout(timer);
    }, [escrowUnknown]);
    const recoverySnoozed = recoverySnoozedUntil > Date.now();
    // Until the method count is known, the recovery banner may still claim the slot.
    const methodCountPending = capabilities.recovery && recoveryMethodCount === null;

    if (!offer || !continuity || !sessionStep || !did) return { pending };
    // `done` and `otherUid` never reach here (`offer` is false); this narrows the type.
    if (sessionStep === 'done' || sessionStep === 'otherUid') return { pending: false };
    const step = sessionStep;
    // The PIN confirm is this banner's own ask (the recovery banner never makes it): its
    // slot, snooze and tier never hide it, only its own snooze does.
    const confirming = step === 'confirmPin';
    if (methodCountPending || keepAccountTitle.pending) return { pending: true };
    if (!confirming && escrowUnknown && !escrowWaitOver) return { pending: true };
    if (!confirming && pinFirstEligible && !recoverySnoozed) return { pending: false };
    if (snooze.count >= KEEP_ACCOUNT_MAX_SNOOZES || snooze.until > Date.now()) {
        return { pending: false };
    }
    // The recovery banner asks for the same PIN or passkey: one snooze quiets both.
    if (step !== 'email' && !confirming && (pinFirstEligible || recoverySnoozed))
        return { pending: false };

    const refresh = (): void => {
        void queryClient.invalidateQueries({ queryKey: ['classlinkAccountContinuity'] });
    };
    const pinLocked = step === 'pin' && continuity.pinState === 'locked';
    const phrase = Capacitor.isNativePlatform() || !isWebAuthnSupported();

    const openSheet = (): void => {
        newModal(
            <div className="p-6 bg-white rounded-t-[20px] max-h-[90vh] overflow-y-auto">
                <KeepAccountStep
                    variant="sheet"
                    source="dashboard"
                    onComplete={() => closeModal()}
                    onDismiss={() => closeModal()}
                    onBeforeOverlay={() => closeModal()}
                    // Back in place to confirm, once the passkey or phrase is saved.
                    onOverlayComplete={openSheet}
                />
            </div>,
            { className: 'bg-transparent!' }
        );
    };

    // The banner already asked; its overlay opens straight away.
    const start = (): void => {
        // The email and the PIN confirm are asked in the sheet (the confirm needs no
        // overlay: it is a single PIN entry, with "choose a new PIN" inside).
        if (step === 'email' || step === 'confirmPin') {
            openSheet();
            return;
        }
        track(AnalyticsEvents.KEEP_ACCOUNT_SHOWN, { source: 'dashboard', step });
        const completed = (): void => {
            track(AnalyticsEvents.KEEP_ACCOUNT_STEP_COMPLETED, { source: 'dashboard', step });
            refresh();
        };
        if (step === 'pin') {
            openPinSetup({
                reason: pinLocked ? 'pin-locked' : 'first-time',
                onComplete: completed,
            });
        } else {
            openRecoverySetup({
                initialMethod: phrase ? 'phrase' : 'passkey',
                autoStart: true,
                onCompleted: completed,
            });
        }
    };

    const banner: DashboardKeepAccountViewModel = {
        step,
        pinLocked,
        phrase: step === 'method' && phrase,
        title: keepAccountTitle.title,
        onStart: start,
        onSnooze: () => {
            const next = { until: Date.now() + KEEP_ACCOUNT_SNOOZE_MS, count: snooze.count + 1 };
            try {
                localStorage.setItem(getKeepAccountSnoozeKey(did), String(next.until));
                localStorage.setItem(getKeepAccountSnoozeCountKey(did), String(next.count));
            } catch {
                /* Still snoozed for this session when storage is unavailable. */
            }
            // The same ask in the recovery banner stays quiet for as long.
            if (step !== 'email' && step !== 'confirmPin')
                firstStartupStore.set.recoveryPromptSnoozedUntil(next.until);
            setSnooze(next);
            track(AnalyticsEvents.KEEP_ACCOUNT_DISMISSED, { source: 'dashboard', step });
        },
    };
    return { banner, pending: false };
};
