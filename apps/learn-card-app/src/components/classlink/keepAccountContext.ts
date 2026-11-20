import type { ClassLinkAccountContinuity } from '@learncard/lca-api-plugin';
import { getSSSConfig } from 'learn-card-base';

import { useAppAuth } from '../../providers/AuthCoordinatorProvider';

/**
 * The step this session can act on, from the server's `nextStep`:
 * - `confirmPin` only on the login that holds the sign-in email (`primaryUid`); any other
 *   login of the account gets `otherUid` (finish by signing in with the sign-in email).
 * - `pin` becomes `method` when escrow cannot enroll here: escrow off for the app, or the
 *   account is not enrolled and the coordinator's last escrow refresh left it so (the
 *   staged-rollout gate, opted out or disabled). lca-api cannot see the rollout gate.
 * - `done` and `email` become `confirmEmail` on the login that holds the sign-in email
 *   when the backup of an account without a PIN still names another address
 *   (`contactStale`: after a removal, whose answer is `email`, or on a device that never
 *   typed the sign-in email) and this device has not confirmed the sign-in email
 *   (`contactConfirmed === false`): the silent re-seal cannot run, so the user types the
 *   address once, which cuts the old address off first. With it confirmed, the step
 *   re-seals silently.
 */
export type KeepAccountStepKind =
    ClassLinkAccountContinuity['nextStep'] | 'otherUid' | 'confirmEmail';

export type KeepAccountSessionContext = {
    /** The session's uid (`authUser.id`). */
    sessionUid?: string;
    /** The coordinator's published `escrowEnrollment` (undefined while unknown). */
    escrowEnrollment?: string;
    /** Escrow is off for this app (`escrowEnclaveMode: 'off'`). */
    escrowOff?: boolean;
    /**
     * The session's sign-in email is the address confirmed on this device
     * (`getConfirmedContact`); `false` when it is not, undefined when unknown.
     */
    contactConfirmed?: boolean;
};

export const resolveKeepAccountStep = (
    continuity: ClassLinkAccountContinuity,
    context: KeepAccountSessionContext
): KeepAccountStepKind => {
    const step = continuity.nextStep;
    if (
        (step === 'done' || step === 'email') &&
        continuity.contactStale &&
        continuity.pinState === 'none' &&
        !!context.sessionUid &&
        context.sessionUid === continuity.primaryUid &&
        context.contactConfirmed === false
    )
        return 'confirmEmail';
    if (step === 'confirmPin')
        return context.sessionUid && context.sessionUid === continuity.primaryUid
            ? 'confirmPin'
            : 'otherUid';
    if (
        step === 'pin' &&
        (context.escrowOff ||
            context.escrowEnrollment === 'not-enrolled' ||
            context.escrowEnrollment === 'opted-out' ||
            context.escrowEnrollment === 'disabled')
    )
        return 'method';
    return step;
};

/**
 * Whether an entry point should invite the user: add a personal email (when the server
 * allows one), then, once it is in, create a PIN (escrow accounts), confirm the current PIN
 * (the backup still names the old contact; only on the login that holds the sign-in email),
 * type the sign-in email once (`confirmEmail`: the same, for an account without a PIN)
 * or add a passkey or recovery phrase (`method`: accounts that cannot have escrow here).
 * Each host decides which of these it asks for.
 */
export const needsKeepAccount = (
    continuity: ClassLinkAccountContinuity | undefined,
    context: KeepAccountSessionContext = {}
): boolean => {
    if (!continuity) return false;
    const step = resolveKeepAccountStep(continuity, context);
    return (
        step === 'pin' ||
        step === 'confirmPin' ||
        step === 'confirmEmail' ||
        step === 'method' ||
        (step === 'email' && continuity.personalEmail.allowed)
    );
};

/** This session's context for `resolveKeepAccountStep`, from the coordinator. */
export const useKeepAccountSessionContext = (): KeepAccountSessionContext => {
    const { state, getConfirmedContact } = useAppAuth();
    let escrowOff: boolean;
    try {
        escrowOff = getSSSConfig().escrowEnclaveMode === 'off';
    } catch {
        escrowOff = false;
    }
    if (state.status !== 'ready') return { escrowOff };
    const sessionEmail = state.authUser?.email?.trim().toLowerCase();
    return {
        sessionUid: state.authUser?.id,
        escrowEnrollment: state.escrowEnrollment,
        escrowOff,
        contactConfirmed: !!sessionEmail && getConfirmedContact(state.did) === sessionEmail,
    };
};
