import { resolveTenantFromRequest, type ResolvedTenant } from '@learncard/email-templates';
import {
    expireStaleEscrowHolds,
    findEscrowHoldsPendingEnclaveCancellation,
    countEscrowCancellationsNearRelease,
    findEscrowHoldsDueForReminder,
    claimEscrowHoldForReminder,
    findUserKeyByAuthProvider,
    findEscrowHoldsPendingStartNotification,
    releaseEscrowReminderClaim,
    recordEscrowStartNotificationAttempt,
    recordEscrowHoldNotification,
    computeEffectiveReleaseAfter,
} from '@models';
import { environment } from '@environment';
import {
    cancelHoldInEnclave,
    logEscrowCancellationPending,
} from '../services/escrow-enclave/cancellation';
import {
    getEscrowEnclave,
    isEscrowEnabled,
    notifyEscrowHoldEvent,
} from '../services/escrow-enclave';

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
    const now = options.now ?? new Date();
    if (!isEscrowEnabled()) {
        // Disabling recovery must not silence outstanding revocation alarms.
        if (await countEscrowCancellationsNearRelease(now)) logEscrowCancellationPending(true);
        return empty;
    }
    const limit = Math.max(
        1,
        Math.min(options.limit ?? DEFAULT_REMINDER_BATCH_LIMIT, DEFAULT_REMINDER_BATCH_LIMIT)
    );
    const notify = options.notify ?? notifyEscrowHoldEvent;

    const expired = await expireStaleEscrowHolds(now);
    const candidates = await findEscrowHoldsDueForReminder(now, limit);

    let reminded = 0;
    let failed = 0;

    // Budget at most 30s of enclave calls beside the two 30s delivery queues.
    // Attempts ordering ensures a repeatedly unavailable cancellation cannot starve others.
    const cancelLimit = Math.min(
        limit,
        3,
        Math.max(1, Math.floor(30_000 / environment.ESCROW_ENCLAVE_REMOTE_TIMEOUT_MS))
    );
    for (const hold of await findEscrowHoldsPendingEnclaveCancellation(cancelLimit)) {
        try {
            const userKey = hold.enclaveEnvelope
                ? undefined
                : await findUserKeyByAuthProvider(hold.authProvider.type, hold.authProvider.id);
            if (!(await cancelHoldInEnclave(hold, userKey, now))) failed += 1;
        } catch (error) {
            failed += 1;
            logJobError(hold._id, error);
        }
    }
    // Check the whole backlog, not only this run's bounded retry batch.
    if (await countEscrowCancellationsNearRelease(now)) logEscrowCancellationPending(true);

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

    // P9.1 (attack C): `sendReleaseWarning` is defined only by the remote
    // (nitro/authority) backend — software mode never produces a hold the
    // enclave itself must warn about, since it has no confirmation step to
    // have gated release behind in the first place.
    const sendReleaseWarning = getEscrowEnclave().sendReleaseWarning;
    for (const candidate of candidates) {
        let claimed: Awaited<ReturnType<typeof claimEscrowHoldForReminder>> = null;
        try {
            // Lease before send; only successful delivery writes the sent marker.
            claimed = await claimEscrowHoldForReminder(candidate._id, now);
            if (!claimed) continue;

            // P9.1 (attack C): an authority-mode Hold-policy hold's security
            // channel is the enclave's own sealed-blob-sourced email, not this
            // Mongo-recipient-sourced one, which an attacker who controls the
            // suppressed-notification side of the threat model could silence
            // or redirect. send-release-warning both notifies the real owner
            // and records the timestamp release is independently gated on.
            if (sendReleaseWarning && claimed.releasePolicy !== 'pin' && claimed.holdRecord) {
                const { releaseWarningSentAtMs } = await sendReleaseWarning({
                    holdId: claimed.holdRecord.hold.holdId,
                    expectedDid: claimed.primaryDid,
                });
                // P2-a: the enclave call above is idempotent (a repeat never
                // resends or moves its recorded timestamp), so persisting
                // this acknowledgment AFTER it succeeds is safe to retry: if
                // this write is lost (crash, Mongo failure), the hold stays
                // selected next run, the enclave call is a no-op, and this
                // write finally lands. Without it, every run re-called the
                // enclave for every hold in the 24h window forever.
                // [B]: also persist the effective availability from the
                // authoritative confirmation/warning times — a late
                // (catch-up) warning can push real availability later than
                // the hold's existing stored `releaseAfter` estimate, which
                // otherwise keeps advertising an already-passed deadline.
                await recordEscrowHoldNotification(
                    claimed._id,
                    'reminder',
                    claimed.confirmedAt
                        ? computeEffectiveReleaseAfter({
                              confirmedAtMs: claimed.confirmedAt.getTime(),
                              holdDurationMs: claimed.holdRecord.holdDurationMs,
                              releaseWarningSentAtMs,
                          })
                        : undefined
                );
                reminded += 1;
                continue;
            }

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
