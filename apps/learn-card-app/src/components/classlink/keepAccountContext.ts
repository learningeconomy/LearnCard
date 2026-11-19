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
 */
export type KeepAccountStepKind = ClassLinkAccountContinuity['nextStep'] | 'otherUid';

export type KeepAccountSessionContext = {
    /** The session's uid (`authUser.id`). */
    sessionUid?: string;
    /** The coordinator's published `escrowEnrollment` (undefined while unknown). */
    escrowEnrollment?: string;
    /** Escrow is off for this app (`escrowEnclaveMode: 'off'`). */
    escrowOff?: boolean;
};

export const resolveKeepAccountStep = (
    continuity: ClassLinkAccountContinuity,
    context: KeepAccountSessionContext
): KeepAccountStepKind => {
    const step = continuity.nextStep;
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
 * (the backup still names the old contact; only on the login that holds the sign-in email)
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
        step === 'method' ||
        (step === 'email' && continuity.personalEmail.allowed)
    );
};

/** This session's context for `resolveKeepAccountStep`, from the coordinator. */
export const useKeepAccountSessionContext = (): KeepAccountSessionContext => {
    const { state } = useAppAuth();
    let escrowOff: boolean;
    try {
        escrowOff = getSSSConfig().escrowEnclaveMode === 'off';
    } catch {
        escrowOff = false;
    }
    return state.status === 'ready'
        ? {
              sessionUid: state.authUser?.id,
              escrowEnrollment: state.escrowEnrollment,
              escrowOff,
          }
        : { escrowOff };
};
