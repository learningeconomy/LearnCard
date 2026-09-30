import { resolveTenantFromRequest, type ResolvedTenant } from '@learncard/email-templates';
import {
    expireStaleEscrowHolds,
    findEscrowHoldsDueForReminder,
    claimEscrowHoldForReminder,
    findUserKeyByAuthProvider,
    findEscrowHoldsPendingStartNotification,
    releaseEscrowReminderClaim,
    recordEscrowStartNotificationAttempt,
} from '@models';
import { isEscrowEnabled, notifyEscrowHoldEvent } from '../services/escrow-enclave';

// Two queues of ten 3-second deliveries leave half the 120-second Lambda
// budget for database work. Least-recently-attempted ordering prevents starvation.
const DEFAULT_REMINDER_BATCH_LIMIT = 10;

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
    const limit = Math.max(
        1,
        Math.min(options.limit ?? DEFAULT_REMINDER_BATCH_LIMIT, DEFAULT_REMINDER_BATCH_LIMIT)
    );
    const notify = options.notify ?? notifyEscrowHoldEvent;

    const expired = await expireStaleEscrowHolds(now);
    const candidates = await findEscrowHoldsDueForReminder(now, limit);

    let reminded = 0;
    let failed = 0;

    // A hold is inserted with this marker before the route attempts delivery,
    // so Lambda freezes/timeouts cannot lose the security-critical start email.
    for (const hold of await findEscrowHoldsPendingStartNotification(limit)) {
        try {
            await recordEscrowStartNotificationAttempt(hold._id, now);
            const userKey = await findUserKeyByAuthProvider(
                hold.authProvider.type,
                hold.authProvider.id
            );
            if (
                userKey &&
                !(await notify({
                    kind: 'started',
                    hold,
                    userKey,
                    tenant: resolveTenantById(hold.tenantId),
                }))
            )
                failed += 1;
        } catch (error) {
            failed += 1;
            logJobError(hold._id, error);
        }
    }

    for (const candidate of candidates) {
        let claimed: Awaited<ReturnType<typeof claimEscrowHoldForReminder>> = null;
        try {
            // Lease before send; only successful delivery writes the sent marker.
            claimed = await claimEscrowHoldForReminder(candidate._id, now);
            if (!claimed) continue;

            const userKey = await findUserKeyByAuthProvider(
                claimed.authProvider.type,
                claimed.authProvider.id
            );
            if (!userKey) continue;

            const tenant = resolveTenantById(claimed.tenantId);

            if (await notify({ kind: 'reminder', hold: claimed, userKey, tenant })) reminded += 1;
            else failed += 1;
        } catch (error) {
            failed += 1;
            logJobError(candidate._id, error);
        } finally {
            if (claimed) await releaseEscrowReminderClaim(claimed);
        }
    }

    return { reminded, expired, failed };
};
