import { randomUUID } from 'crypto';
import { beforeAll, afterAll, afterEach, beforeEach, describe, it, expect } from 'vitest';
import { client } from '@mongo';
import {
    createUserKeysIndexes,
    getUserKeysCollection,
    upsertUserKeyByAuthProvider,
    createEscrowHoldsIndexes,
    getEscrowHoldsCollection,
    createEscrowHold,
    findEscrowHoldById,
    completeEscrowHold,
    cancelEscrowHold,
    generateEscrowResumeToken,
    hashEscrowResumeToken,
    recordEscrowHoldNotification,
    computeEffectiveReleaseAfter,
    findEscrowHoldsDueForReminder,
    findEscrowHoldsPendingStartNotification,
    findEscrowHoldsPendingEnclaveCancellation,
    claimEscrowHoldForReminder,
    releaseEscrowReminderClaim,
    recordEscrowStartNotificationAttempt,
    recordEscrowEnclaveCancelAttempt,
    ESCROW_RELEASE_TIME_MARGIN_MS,
    ESCROW_RELEASE_WARNING_GAP_MS,
    type AuthProviderMapping,
} from '@models';
import {
    __setEscrowEnclaveForTests,
    getEscrowEnclave,
    notifyEscrowHoldEvent,
} from '../../src/services/escrow-enclave';
import { escrowCancelTokenMatches, hashEscrowCancelToken } from '@helpers/escrowCancelToken';
import { runEscrowHoldReminders } from '../../src/jobs/escrowHoldReminders';

const HOUR = 60 * 60 * 1000;
const seededProviderIds: string[] = [];

const makeProvider = (): AuthProviderMapping => {
    const provider: AuthProviderMapping = {
        type: 'firebase',
        id: `escrow-reminder-job-${randomUUID()}`,
    };
    seededProviderIds.push(provider.id);
    return provider;
};

/** Every seed() call gets its own authProvider (see test/models/escrow.spec.ts
 * for why: only one pending hold-policy hold is allowed per authProvider). */
const seed = async (
    releaseAfter: Date,
    releasePolicy: 'hold' | 'pin' = 'hold',
    holdId = randomUUID()
) => {
    const provider = makeProvider();
    await upsertUserKeyByAuthProvider(
        { type: 'email', value: `${provider.id}@example.com` },
        provider,
        {
            primaryDid: 'did:key:test',
            authShare: { encryptedData: 'data', encryptedDek: 'dek', iv: 'iv' },
        }
    );
    return createEscrowHold({
        holdRecord: {
            hold: {
                holdId,
                did: 'did:key:test',
                shareVersion: 1,
                blobHash: 'ab'.repeat(32),
                enrollmentEpoch: 1,
                releasePolicy: 'hold',
                clientEphemeralPublicKey: 'public-key',
                createdLo: 0,
                createdHi: 0,
                policyVersion: 1,
                signature: 'test-signature',
            },
            holdDurationMs: 0,
            ledgerSeq: 0,
        },
        authProvider: provider,
        primaryDid: 'did:key:test',
        shareVersion: 1,
        identityProofType: 'auth-token',
        requestedAt: new Date(),
        releaseAfter,
        releasePolicy,
        clientEphemeralPublicKey: 'public-key',
        resumeTokenHash: hashEscrowResumeToken(generateEscrowResumeToken()),
    });
};

beforeAll(async () => {
    process.env.IS_E2E_TEST = 'true';
    process.env.SEED ||= 'a'.repeat(64);
    process.env.ESCROW_ENCLAVE_MODE = 'software';
    process.env.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON = JSON.stringify({
        dummy: 'x'.repeat(10),
    });
    process.env.ESCROW_ENCLAVE_ACTIVE_KEY_ID = 'dummy';
    __setEscrowEnclaveForTests(undefined);
    await client.connect();
    await createUserKeysIndexes();
    await createEscrowHoldsIndexes();
});

// The reminder job scans every due hold (including overdue catch-up), so holds
// left behind by other spec files sharing this Mongo would be picked up.
beforeEach(async () => {
    await getEscrowHoldsCollection().deleteMany({});
});

afterEach(async () => {
    const ids = seededProviderIds.splice(0);
    if (ids.length === 0) return;
    await getUserKeysCollection().deleteMany({ 'authProviders.id': { $in: ids } });
    await getEscrowHoldsCollection().deleteMany({ 'authProvider.id': { $in: ids } });
});

afterAll(async () => {
    delete process.env.ESCROW_ENCLAVE_MODE;
    delete process.env.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON;
    delete process.env.ESCROW_ENCLAVE_ACTIVE_KEY_ID;
    __setEscrowEnclaveForTests(undefined);
    await client.close();
});

describe('runEscrowHoldReminders', () => {
    describe.each(['reminder', 'started', 'cancelled'] as const)('%s queue ordering', queue => {
        it.each([false, true])(
            'keeps tied batches stable and rotates retries (previously attempted: %s)',
            async previouslyAttempted => {
                const now = new Date();
                const previousAttempt = new Date(now.getTime() - HOUR);
                // More than a default delivery batch. Insert backwards so physical
                // insertion order cannot accidentally satisfy the expected ID order.
                const ids = Array.from(
                    { length: 13 },
                    (_, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`
                );
                for (const id of [...ids].reverse()) {
                    await seed(new Date(now.getTime() + HOUR), 'hold', id);
                }
                await getEscrowHoldsCollection().updateMany(
                    {},
                    {
                        $set: {
                            requestedAt: previousAttempt,
                            ...(queue === 'started' ? { startedNotificationPending: true } : {}),
                            ...(queue === 'cancelled'
                                ? {
                                      status: 'cancelled' as const,
                                      enclaveCancelPendingAt: previousAttempt,
                                      enclaveCancelAttempts: previouslyAttempted ? 2 : 0,
                                  }
                                : previouslyAttempted
                                  ? queue === 'reminder'
                                      ? { reminderAttemptedAt: previousAttempt }
                                      : { startedNotificationAttemptedAt: previousAttempt }
                                  : {}),
                        },
                    }
                );
                const readBatch = () =>
                    queue === 'reminder'
                        ? findEscrowHoldsDueForReminder(now, 5)
                        : queue === 'started'
                          ? findEscrowHoldsPendingStartNotification(5)
                          : findEscrowHoldsPendingEnclaveCancellation(5);

                for (let repeat = 0; repeat < 3; repeat += 1) {
                    expect((await readBatch()).map(hold => hold._id)).toEqual(ids.slice(0, 5));
                }
                // Failed deliveries remain eligible. Updating their real attempt
                // markers must put untouched rows first, even with tied timestamps.
                for (let offset = 0; offset < ids.length; offset += 5) {
                    const batch = await readBatch();
                    const remaining = Math.min(5, ids.length - offset);
                    expect(batch.slice(0, remaining).map(hold => hold._id)).toEqual(
                        ids.slice(offset, offset + remaining)
                    );
                    for (const hold of batch) {
                        if (queue === 'reminder') {
                            const claimed = await claimEscrowHoldForReminder(hold._id, now);
                            expect(claimed).not.toBeNull();
                            if (claimed) await releaseEscrowReminderClaim(claimed);
                        } else if (queue === 'started') {
                            await recordEscrowStartNotificationAttempt(hold._id, now);
                        } else {
                            expect(await recordEscrowEnclaveCancelAttempt(hold._id)).toBe(true);
                        }
                    }
                }
            }
        );
    });

    it('bounds cancellation retries and gives unattempted cancellations priority', async () => {
        const now = new Date();
        const holds = await Promise.all(
            Array.from({ length: 4 }, () => seed(new Date(now.getTime() + 7 * 24 * HOUR)))
        );
        for (const hold of holds) await cancelEscrowHold(hold._id, 'did');
        // These legacy test records lack ciphertext: fail closed, but still rotate
        // the bounded queue rather than retrying the same first ones forever. The
        // default 15s enclave timeout fits two calls in the job's 30s enclave budget.
        await runEscrowHoldReminders({ now, limit: 200 });
        const firstRun = await Promise.all(holds.map(hold => findEscrowHoldById(hold._id)));
        expect(firstRun.map(hold => hold?.enclaveCancelAttempts).sort()).toEqual([0, 0, 1, 1]);
        const unattempted = firstRun
            .filter(hold => hold?.enclaveCancelAttempts === 0)
            .sort((left, right) => left!._id.localeCompare(right!._id))[0]!;
        await runEscrowHoldReminders({ now, limit: 1 });
        expect((await findEscrowHoldById(unattempted._id))?.enclaveCancelAttempts).toBe(1);
        for (const hold of holds) {
            const stored = await findEscrowHoldById(hold._id);
            expect(stored?.enclaveCancelPendingAt).toBeInstanceOf(Date);
            expect(stored?.enclaveCancelConfirmedAt).toBeUndefined();
        }
    });

    it('budgets both queues and moves failed starts behind unattempted holds', async () => {
        const now = new Date();
        const starts = await Promise.all(
            Array.from({ length: 11 }, () => seed(new Date(now.getTime() + 7 * 24 * HOUR)))
        );
        await getEscrowHoldsCollection().updateMany(
            { _id: { $in: starts.map(hold => hold._id) } },
            { $set: { startedNotificationPending: true } }
        );
        const reminder = await seed(new Date(now.getTime() + HOUR));
        const attempts: string[] = [];
        const notify: typeof notifyEscrowHoldEvent = async event => {
            attempts.push(event.hold._id);
            return false;
        };
        await runEscrowHoldReminders({ now, limit: 200, notify });
        expect(attempts).toHaveLength(11); // Ten starts plus one reminder, not 200 starts.
        expect(attempts).toContain(reminder._id);
        const untouched = starts.find(hold => !attempts.includes(hold._id))!;
        attempts.length = 0;
        await runEscrowHoldReminders({ now: new Date(now.getTime() + HOUR / 2), limit: 1, notify });
        expect(attempts[0]).toBe(untouched._id);
        expect(attempts[1]).toBe(reminder._id);
    });

    it('calls the enclave sendReleaseWarning instead of its own reminder notification for an authority-mode hold', async () => {
        const now = new Date();
        const hold = await seed(new Date(now.getTime() + HOUR));
        await getEscrowHoldsCollection().updateOne(
            { _id: hold._id },
            { $set: { requiresConfirmation: true, confirmedAt: now } }
        );
        const calls: { holdId: string; expectedDid: string }[] = [];
        // This file has no per-test enclave reset (unlike keys-escrow.spec.ts's
        // beforeEach): Object.assign mutates the shared software singleton in
        // place, so it must be cleaned up or it leaks into every later test.
        const software = getEscrowEnclave() as unknown as Record<string, unknown>;
        software.sendReleaseWarning = async (params: { holdId: string; expectedDid: string }) => {
            calls.push(params);
            return { success: true as const };
        };
        try {
            const notified: string[] = [];
            const notify: typeof notifyEscrowHoldEvent = async event => {
                notified.push(event.hold._id);
                return true;
            };
            const result = await runEscrowHoldReminders({ now, notify });
            expect(result.reminded).toBe(1);
            expect(calls).toEqual([
                { holdId: hold.holdRecord.hold.holdId, expectedDid: hold.primaryDid },
            ]);
            expect(notified).toHaveLength(0);
            const stored = await findEscrowHoldById(hold._id);
            // P2-a: a successful enclave warning is now acknowledged in Mongo
            // (previously left empty forever, causing a re-send every run).
            expect(stored?.notifications.map(entry => entry.kind)).toEqual(['reminder']);
        } finally {
            delete software.sendReleaseWarning;
        }
    });

    it('sends the release warning exactly once across consecutive hourly runs (P2-a)', async () => {
        const now = new Date();
        const hold = await seed(new Date(now.getTime() + HOUR));
        await getEscrowHoldsCollection().updateOne(
            { _id: hold._id },
            { $set: { requiresConfirmation: true, confirmedAt: now } }
        );
        const calls: { holdId: string; expectedDid: string }[] = [];
        const software = getEscrowEnclave() as unknown as Record<string, unknown>;
        software.sendReleaseWarning = async (params: { holdId: string; expectedDid: string }) => {
            calls.push(params);
            return { success: true as const };
        };
        try {
            const first = await runEscrowHoldReminders({ now });
            const secondRun = await runEscrowHoldReminders({ now: new Date(now.getTime() + HOUR) });
            expect(first.reminded).toBe(1);
            expect(secondRun.reminded).toBe(0);
            expect(calls).toHaveLength(1);
            expect(
                (await findEscrowHoldById(hold._id))?.notifications.map(entry => entry.kind)
            ).toEqual(['reminder']);
        } finally {
            delete software.sendReleaseWarning;
        }
    });

    it('a lost acknowledgment write is safe to retry and eventually stops re-calling the enclave (P2-a)', async () => {
        const now = new Date();
        const hold = await seed(new Date(now.getTime() + HOUR));
        await getEscrowHoldsCollection().updateOne(
            { _id: hold._id },
            { $set: { requiresConfirmation: true, confirmedAt: now } }
        );
        const calls: { holdId: string; expectedDid: string }[] = [];
        const software = getEscrowEnclave() as unknown as Record<string, unknown>;
        software.sendReleaseWarning = async (params: { holdId: string; expectedDid: string }) => {
            calls.push(params);
            return {
                receipt: {
                    version: 1 as const,
                    kind: calls.length === 1 ? ('commit' as const) : ('snapshot' as const),
                    keyId: 'test-key',
                    measurement: Array.from({ length: 32 }, () => 0),
                    payload:
                        calls.length === 1
                            ? 'AQ=='
                            : Buffer.from(
                                  JSON.stringify([
                                      'learncard-authority-hold-snapshot-v2',
                                      params.holdId,
                                      Array.from({ length: 32 }, () => 7),
                                      'pending',
                                      now.getTime(),
                                      now.getTime(),
                                      'g1',
                                  ])
                              ).toString('base64'),
                    signature: Buffer.alloc(64).toString('base64'),
                },
                releaseWarningSentAtMs: now.getTime(),
            };
        };
        try {
            const first = await runEscrowHoldReminders({ now });
            expect(first.reminded).toBe(1);
            expect(calls).toHaveLength(1);
            // Simulate the acknowledgment write being lost (e.g. a crash right
            // after a successful enclave call) rather than mocking Mongo, so
            // this exercises the job's own catch-up path: a real enclave would
            // not re-send or move its timestamp on this retry (covered by the
            // Rust-side idempotence test), but lca-api must not get stuck
            // either, so it retries until its own acknowledgment lands.
            await getEscrowHoldsCollection().updateOne(
                { _id: hold._id },
                { $set: { notifications: [], releaseAfter: hold.releaseAfter } }
            );
            const second = await runEscrowHoldReminders({ now });
            expect(second.reminded).toBe(1);
            expect(calls).toHaveLength(2);
            expect(
                (await findEscrowHoldById(hold._id))?.notifications.map(entry => entry.kind)
            ).toEqual(['reminder']);
            const third = await runEscrowHoldReminders({ now });
            expect(third.reminded).toBe(0);
            expect(calls).toHaveLength(2);
        } finally {
            delete software.sendReleaseWarning;
        }
    });

    // [B] A catch-up warning sent well after the 7-day window elapsed (an
    // outage, or the job simply not running for a while) must advertise an
    // availability time derived from the LATER gate — the enclave's own
    // `release_warning_sent_hi_ms + 24h` — not the hold's original,
    // long-since-passed creation/confirmation-based estimate, which would
    // otherwise keep telling the client it's ready when the enclave would
    // still refuse release.
    it('[B] an overdue warning advances the stored releaseAfter to the warning-based availability time', async () => {
        const now = new Date();
        // Confirmed 10 days ago: its own 7-day-plus-margin gate has long
        // since passed, so only the warning-based gate can be the later one.
        const confirmedAt = new Date(now.getTime() - 10 * 24 * HOUR);
        const hold = await seed(new Date(confirmedAt.getTime() + HOUR));
        await getEscrowHoldsCollection().updateOne(
            { _id: hold._id },
            { $set: { requiresConfirmation: true, confirmedAt } }
        );
        const releaseWarningSentAtMs = now.getTime();
        const software = getEscrowEnclave() as unknown as Record<string, unknown>;
        software.sendReleaseWarning = async () => ({
            receipt: {
                version: 1 as const,
                kind: 'commit' as const,
                keyId: 'test-key',
                measurement: Array.from({ length: 32 }, () => 0),
                payload: 'AQ==',
                signature: Buffer.alloc(64).toString('base64'),
            },
            releaseWarningSentAtMs,
        });
        try {
            const result = await runEscrowHoldReminders({ now });
            expect(result.reminded).toBe(1);
            const stored = await findEscrowHoldById(hold._id);
            const expected = computeEffectiveReleaseAfter({
                confirmedAtMs: confirmedAt.getTime(),
                holdDurationMs: hold.holdRecord.holdDurationMs,
                releaseWarningSentAtMs,
            });
            // Sanity: the warning-based gate really is the later one here.
            expect(expected.getTime()).toBe(
                releaseWarningSentAtMs +
                    ESCROW_RELEASE_WARNING_GAP_MS +
                    ESCROW_RELEASE_TIME_MARGIN_MS
            );
            expect(stored?.releaseAfter.getTime()).toBe(expected.getTime());
            // And specifically later than the original (long-passed) estimate.
            expect(stored!.releaseAfter.getTime()).toBeGreaterThan(hold.releaseAfter.getTime());
        } finally {
            delete software.sendReleaseWarning;
        }
    });

    it('retries an undelivered start notification with a cancel link', async () => {
        const now = new Date();
        const hold = await seed(new Date(now.getTime() + 7 * 24 * HOUR));
        await getEscrowHoldsCollection().updateOne(
            { _id: hold._id },
            { $set: { startedNotificationPending: true } }
        );
        const failed = await runEscrowHoldReminders({
            now,
            notify: event =>
                notifyEscrowHoldEvent(event, {
                    send: async () => {
                        throw new Error('Postmark unavailable');
                    },
                    sendPush: async () => ({ successCount: 1, failureCount: 0, failedTokens: [] }),
                }),
        });
        expect(failed.failed).toBe(1);
        expect((await findEscrowHoldById(hold._id))?.startedNotificationPending).toBe(true);
        let cancelUrl = '';
        await runEscrowHoldReminders({
            now,
            notify: event =>
                notifyEscrowHoldEvent(event, {
                    send: async notification => {
                        if ('templateModel' in notification)
                            cancelUrl = String(notification.templateModel.cancelUrl);
                    },
                    sendPush: async () => ({ successCount: 0, failureCount: 0, failedTokens: [] }),
                }),
        });
        const stored = await findEscrowHoldById(hold._id);
        expect(stored?.startedNotificationPending).toBe(false);
        expect(stored?.notifications.map(entry => entry.kind)).toEqual(['started']);
        expect(cancelUrl).toContain(hold._id);
    });

    it('failed reminder delivery preserves the original cancel link and retries next run', async () => {
        const now = new Date();
        const hold = await seed(new Date(now.getTime() + HOUR));
        const originalToken = 'a'.repeat(64);
        await getEscrowHoldsCollection().updateOne(
            { _id: hold._id },
            { $set: { cancelTokenHash: hashEscrowCancelToken(originalToken) } }
        );
        const result = await runEscrowHoldReminders({
            now,
            notify: event =>
                notifyEscrowHoldEvent(event, {
                    send: async () => {
                        throw new Error('Postmark unavailable');
                    },
                    sendPush: async () => ({ successCount: 1, failureCount: 0, failedTokens: [] }),
                }),
        });
        expect(result.failed).toBe(1);
        const stored = await findEscrowHoldById(hold._id);
        expect(escrowCancelTokenMatches(stored!, originalToken)).toBe(true);
        expect(stored?.notifications).toEqual([]);
        expect((await runEscrowHoldReminders({ now })).reminded).toBe(1);
        expect(escrowCancelTokenMatches((await findEscrowHoldById(hold._id))!, originalToken)).toBe(
            true
        );
    });

    it('reminds a hold due within 24h exactly once, even racing two full job runs', async () => {
        const now = new Date();
        const hold = await seed(new Date(now.getTime() + 23 * HOUR));

        const [a, b] = await Promise.all([
            runEscrowHoldReminders({ now }),
            runEscrowHoldReminders({ now }),
        ]);

        expect(a.reminded + b.reminded).toBe(1);
        expect(a.failed + b.failed).toBe(0);
        const stored = await findEscrowHoldById(hold._id);
        expect(stored?.notifications.filter(entry => entry.kind === 'reminder')).toHaveLength(1);
    });

    it('does not remind a hold due more than 24h out', async () => {
        const now = new Date();
        const hold = await seed(new Date(now.getTime() + 25 * HOUR));

        const result = await runEscrowHoldReminders({ now });

        expect(result.reminded).toBe(0);
        expect((await findEscrowHoldById(hold._id))?.notifications).toEqual([]);
    });

    it('skips completed and cancelled holds', async () => {
        const now = new Date();
        const completed = await seed(new Date(now.getTime() + HOUR));
        await completeEscrowHold(completed._id);
        const cancelled = await seed(new Date(now.getTime() + 2 * HOUR));
        await cancelEscrowHold(cancelled._id, 'did');

        const result = await runEscrowHoldReminders({ now });

        expect(result.reminded).toBe(0);
        expect((await findEscrowHoldById(completed._id))?.notifications).toEqual([]);
        expect((await findEscrowHoldById(cancelled._id))?.notifications).toEqual([]);
    });

    it('skips holds already reminded', async () => {
        const now = new Date();
        const hold = await seed(new Date(now.getTime() + HOUR));
        await recordEscrowHoldNotification(hold._id, 'reminder');

        const result = await runEscrowHoldReminders({ now });

        expect(result.reminded).toBe(0);
        expect((await findEscrowHoldById(hold._id))?.notifications).toHaveLength(1);
    });

    it('expires stale holds and reports the count alongside reminders sent in the same run', async () => {
        const now = new Date();
        const stale = await seed(new Date(now.getTime() - 31 * 24 * HOUR));
        const due = await seed(new Date(now.getTime() + HOUR));

        const result = await runEscrowHoldReminders({ now });

        expect(result.expired).toBe(1);
        expect(result.reminded).toBe(1);
        expect((await findEscrowHoldById(stale._id))?.status).toBe('expired');
        expect((await findEscrowHoldById(due._id))?.notifications.map(entry => entry.kind)).toEqual(
            ['reminder']
        );
    });

    it('counts a notifier failure without marking sent and retries on the next run', async () => {
        const now = new Date();
        const hold = await seed(new Date(now.getTime() + HOUR));

        const result = await runEscrowHoldReminders({
            now,
            notify: async () => {
                throw new Error('delivery exploded');
            },
        });

        expect(result).toEqual({ reminded: 0, expired: 0, failed: 1 });
        const stored = await findEscrowHoldById(hold._id);
        expect(stored?.notifications.map(entry => entry.kind)).toEqual([]);
        const rerun = await runEscrowHoldReminders({ now });
        expect(rerun).toEqual({ reminded: 1, expired: 0, failed: 0 });
    });

    it('no-ops without touching the database when escrow is disabled', async () => {
        const now = new Date();
        const stale = await seed(new Date(now.getTime() - 31 * 24 * HOUR));
        delete process.env.ESCROW_ENCLAVE_MODE;
        __setEscrowEnclaveForTests(undefined);

        try {
            const result = await runEscrowHoldReminders({ now });
            expect(result).toEqual({ reminded: 0, expired: 0, failed: 0 });
            expect((await findEscrowHoldById(stale._id))?.status).toBe('pending');
        } finally {
            process.env.ESCROW_ENCLAVE_MODE = 'software';
            __setEscrowEnclaveForTests(undefined);
        }
    });
});
