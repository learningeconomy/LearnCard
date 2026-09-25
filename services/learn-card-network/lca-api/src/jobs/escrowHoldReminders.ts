import { resolveTenantFromRequest, type ResolvedTenant } from '@learncard/email-templates';
import {
    expireStaleEscrowHolds,
    findEscrowHoldsDueForReminder,
    claimEscrowHoldForReminder,
    findUserKeyByAuthProvider,
} from '@models';
import { isEscrowEnabled, notifyEscrowHoldEvent } from '../services/escrow-enclave';

const DEFAULT_REMINDER_BATCH_LIMIT = 200;

export interface EscrowHoldReminderResult {
    reminded: number;
    expired: number;
    failed: number;
}

export interface RunEscrowHoldRemindersOptions {
    now?: Date;
    limit?: number;
    /**
     * Test-only seam; defaults to the real `notifyEscrowHoldEvent`. Lets
     * tests force a deterministic delivery failure without touching
     * Postmark/FCM. Real callers (the Lambda handler) never pass this, so
     * the effective public signature stays `{ now?, limit? }`.
     */
    notify?: typeof notifyEscrowHoldEvent;
}

/**
 * Given a hold's stored `tenantId`, resolves the same `ResolvedTenant` shape
 * route handlers get from `ctx.tenant`. A scheduled job has no request to
 * read headers from, so this reuses `resolveTenantFromRequest`'s third
 * resolution step directly (deploy-level id, same as `DEFAULT_TENANT_ID`)
 * rather than duplicating the id → branding lookup it already does. Holds
 * created before `tenantId` existed fall back to `DEFAULT_TENANT_ID` / the
 * package's own 'learncard' default, exactly like any other unheadered call.
 */
const resolveTenantById = (tenantId: string | undefined): ResolvedTenant =>
    resolveTenantFromRequest({}, tenantId);

/**
 * Deliberately drops the caught error's message, not just its stack: a real
 * delivery-channel rejection (Postmark/FCM) can embed the recipient address
 * in its own message text, so forwarding it here would leak PII through the
 * one logging path meant to report the failure. Mirrors
 * `notifications.ts`'s `logDeliveryFailure`, which makes the same trade-off
 * for the same reason. The error's name/constructor is still useful for
 * triage (e.g. "MongoServerError" vs "TypeError") without that risk.
 */
const logJobError = (holdId: string, error: unknown): void => {
    console.error('[escrow-hold-reminders] failed to process hold', {
        holdId,
        errorType: error instanceof Error ? error.name : typeof error,
    });
};

/**
 * Hourly maintenance job: expires stale pending holds, then sends a T-24h
 * `reminder` notification to every pending, hold-policy escrow hold whose
 * waiting period ends within 24h and that has never been reminded.
 *
 * Escrow can be entirely disabled (no `ESCROW_ENCLAVE_MODE`) on a given
 * stage/tenant deploy. Rather than a Serverless-level `schedule.enabled`
 * conditional (its value must be a literal boolean, not an interpolated env
 * string, so gating it from `${env:ESCROW_ENCLAVE_MODE}` is fragile), the
 * schedule stays always-enabled in serverless.yml and this job no-ops
 * instead — the same disabled/enabled signal the escrow router itself uses
 * via `getEscrowEnclave()` throwing when `isEscrowEnabled()` is false.
 */
export const runEscrowHoldReminders = async (
    options: RunEscrowHoldRemindersOptions = {}
): Promise<EscrowHoldReminderResult> => {
    const empty: EscrowHoldReminderResult = { reminded: 0, expired: 0, failed: 0 };
    if (!isEscrowEnabled()) return empty;

    const now = options.now ?? new Date();
    const limit = options.limit ?? DEFAULT_REMINDER_BATCH_LIMIT;
    const notify = options.notify ?? notifyEscrowHoldEvent;

    const expired = await expireStaleEscrowHolds(now);
    const candidates = await findEscrowHoldsDueForReminder(now, limit);

    let reminded = 0;
    let failed = 0;

    for (const candidate of candidates) {
        try {
            // Claim before send: only the caller that wins this atomic push
            // notifies. Losing the race (already claimed by a concurrent
            // run) is not a failure — just move on to the next candidate.
            const claimed = await claimEscrowHoldForReminder(candidate._id, now);
            if (!claimed) continue;

            const userKey = await findUserKeyByAuthProvider(
                claimed.authProvider.type,
                claimed.authProvider.id
            );
            // Account/auth-provider mapping is gone; the claim stands, so
            // this hold is never retried — a best-effort reminder has
            // nothing left to notify.
            if (!userKey) continue;

            const tenant = resolveTenantById(claimed.tenantId);

            // The claim above already is the durable 'reminder' record (see
            // claimEscrowHoldForReminder), so recordNotification is a no-op
            // here — otherwise notify()'s own post-delivery write (P5.4)
            // would push a second 'reminder' entry onto the same hold.
            // Every other event kind still self-records via notify()'s real
            // default; only this call site overrides it.
            await notify(
                { kind: 'reminder', hold: claimed, userKey, tenant },
                { recordNotification: async () => {} }
            );
            reminded += 1;
        } catch (error) {
            failed += 1;
            logJobError(candidate._id, error);
        }
    }

    return { reminded, expired, failed };
};
