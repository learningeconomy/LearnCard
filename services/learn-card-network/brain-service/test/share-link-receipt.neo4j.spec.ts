import { randomBytes, randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { neogma } from '@instance';

import {
    consumeShareViewReceipt,
    hashShareViewReceipt,
    persistShareViewReceipt,
    pruneShareViewReceipts,
    readShareViewReceiptOwner,
} from '../src/accesslayer/share-link/receipt';
import type { ShareViewEligibilitySource } from '../src/accesslayer/share-link/types';
import { ensureShareLinkConstraints } from '../src/models/share-link-constraints';

/**
 * LC-2187 view-receipt repository against a REAL Neo4j (disposable
 * testcontainer through the shared harness).
 *
 * The graph locking, uniqueness constraint and consume+increment transaction are
 * real. There is no remote store or policy network here: the eligible-policy
 * source below reads a PERSISTED test policy node inside the same transaction,
 * so it proves the under-lock check observes a concurrent tightening rather than
 * asserting a constant callback.
 */

const NAMESPACE = 'receipt-test-ns';
const OWNER = 'owner-1';
const NOW = new Date('2026-09-21T00:00:00.000Z');
const OBJECT_REF = 'object-ref';
const OPERATION_ID = randomUUID();

/**
 * Test-only persisted policy source. It reads a `TestShareViewPolicy` node with
 * the SAME transaction runner the receipt check uses, so a policy change
 * committed while the consume transaction is blocked on the share lock is
 * observed by the under-lock re-read.
 */
const testPolicySource: ShareViewEligibilitySource = {
    isEligible: async (tx, input) => {
        const result = await tx.run(
            `MATCH (p:TestShareViewPolicy {namespace: $namespace, ownerProfileId: $owner})
             RETURN p.eligible AS eligible`,
            { namespace: input.namespace, owner: input.ownerProfileId }
        );

        return result.records[0]?.get('eligible') === true;
    },
};

const denyPolicySource: ShareViewEligibilitySource = {
    isEligible: async () => false,
};

const setTestPolicy = async (eligible: boolean, namespace = NAMESPACE): Promise<void> => {
    await neogma.queryRunner.run(
        `MERGE (p:TestShareViewPolicy {namespace: $namespace, ownerProfileId: $owner})
         SET p.eligible = $eligible`,
        { namespace, owner: OWNER, eligible }
    );
};

type SeedOverrides = Partial<{
    namespace: string;
    status: string;
    contentState: string;
    contentVersion: number;
    expiresAt: string | null;
    viewCountingEnabled: boolean;
    policyResolved: boolean;
    isMinor: boolean | null;
}>;

const seedShare = async (overrides: SeedOverrides = {}): Promise<string> => {
    const id = randomBytes(16).toString('base64url');
    const props: Record<string, unknown> = {
        id,
        namespace: overrides.namespace ?? NAMESPACE,
        ownerProfileId: OWNER,
        version: 1,
        contentVersion: overrides.contentVersion ?? 1,
        generation: 1,
        status: overrides.status ?? 'active',
        contentState: overrides.contentState ?? 'finalized',
        activeObjectRef: OBJECT_REF,
        activeObjectOperationId: OPERATION_ID,
        activeContentHash: 'content-hash',
        activeContentBytes: 32,
        activeRecoveryHash: 'recovery-hash',
        lastOperationId: randomUUID(),
        createdByClientRequestId: randomUUID(),
        title: 'Shared credentials',
        selectedCount: 1,
        viewCount: 0,
        minorPolicyIsMinor: overrides.isMinor ?? false,
        minorPolicyResolved: overrides.policyResolved ?? true,
        minorPolicyDefaultExpiryDays: 365,
        minorPolicyViewCountingEnabled: overrides.viewCountingEnabled ?? true,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
    };

    if (overrides.expiresAt) props.expiresAt = overrides.expiresAt;

    await neogma.queryRunner.run('CREATE (s:ShareLink) SET s = $props', { props });

    return id;
};

const readShare = async (
    shareId: string
): Promise<{ viewCount: number; lastViewedAt: string | null }> => {
    const result = await neogma.queryRunner.run(
        'MATCH (s:ShareLink {id: $shareId}) RETURN s.viewCount AS viewCount, s.lastViewedAt AS lastViewedAt',
        { shareId }
    );
    const record = result.records[0];

    return {
        viewCount: Number(record?.get('viewCount') ?? 0),
        lastViewedAt: (record?.get('lastViewedAt') as string | null) ?? null,
    };
};

const readConsumedAt = async (receipt: string): Promise<string | null> => {
    const result = await neogma.queryRunner.run(
        'MATCH (v:ShareViewReceipt {receiptHash: $receiptHash}) RETURN v.consumedAt AS consumedAt',
        { receiptHash: hashShareViewReceipt(receipt) }
    );

    return (result.records[0]?.get('consumedAt') as string | null) ?? null;
};

const receiptFor = (): string => randomBytes(32).toString('base64url');

const clearGraph = async (): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (n) WHERE n:ShareLink OR n:ShareViewReceipt OR n:TestShareViewPolicy DETACH DELETE n`
    );
};

describe('share view receipt repository (real Neo4j)', () => {
    beforeAll(async () => {
        await ensureShareLinkConstraints();
    });

    beforeEach(async () => {
        await clearGraph();
        // Every test starts with an explicitly persisted, eligible test policy.
        await setTestPolicy(true);
    });

    afterAll(async () => {
        await clearGraph();
    });

    it.each(['persist', 'consume'] as const)(
        'rechecks expiry after awaited eligibility during %s',
        async stage => {
            const shareId = await seedShare({
                expiresAt: new Date(NOW.getTime() + 1000).toISOString(),
            });
            const receipt = receiptFor();
            let clock = NOW;
            const slowSource: ShareViewEligibilitySource = {
                isEligible: async (tx, input) => {
                    const eligible = await testPolicySource.isEligible(tx, input);
                    clock = new Date(NOW.getTime() + 2000);
                    return eligible;
                },
            };
            const input = {
                receipt,
                namespace: NAMESPACE,
                ownerProfileId: OWNER,
                shareId,
                contentVersion: 1,
                shareVersion: 1,
                objectRef: OBJECT_REF,
                operationId: OPERATION_ID,
                ttlSeconds: 600,
                now: () => clock,
                eligibilitySource: stage === 'persist' ? slowSource : testPolicySource,
            };
            if (stage === 'persist') {
                expect(await persistShareViewReceipt(input)).toBe(false);
            } else {
                expect(await persistShareViewReceipt(input)).toBe(true);
                expect(
                    await consumeShareViewReceipt({
                        receipt,
                        namespace: NAMESPACE,
                        now: () => clock,
                        eligibilitySource: slowSource,
                    })
                ).not.toBe('consumed');
                expect((await readShare(shareId)).viewCount).toBe(0);
            }
        }
    );

    it('does not persist when the committed counting policy is disabled', async () => {
        const shareId = await seedShare({ viewCountingEnabled: false });
        const receipt = receiptFor();
        expect(
            await persistShareViewReceipt({
                receipt,
                namespace: NAMESPACE,
                ownerProfileId: OWNER,
                shareId,
                contentVersion: 1,
                shareVersion: 1,
                objectRef: OBJECT_REF,
                operationId: OPERATION_ID,
                ttlSeconds: 600,
                now: () => NOW,
                eligibilitySource: testPolicySource,
            })
        ).toBe(false);
        expect(await readShareViewReceiptOwner(receipt, NAMESPACE)).toBeNull();
    });

    it('rejects a receipt for a different immutable object at the same content version', async () => {
        const shareId = await seedShare();
        const receipt = receiptFor();
        await persistShareViewReceipt({
            receipt,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            contentVersion: 1,
            shareVersion: 1,
            objectRef: 'different-object',
            operationId: OPERATION_ID,
            ttlSeconds: 600,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });
        expect(
            await consumeShareViewReceipt({
                receipt,
                namespace: NAMESPACE,
                eligibilitySource: testPolicySource,
                now: () => NOW,
            })
        ).not.toBe('consumed');
        expect((await readShare(shareId)).viewCount).toBe(0);
    });

    it('persists, consumes and increments exactly once, then rejects the duplicate', async () => {
        const shareId = await seedShare();
        const receipt = receiptFor();

        await persistShareViewReceipt({
            receipt,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            contentVersion: 1,
            shareVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 600,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });

        expect(await readShareViewReceiptOwner(receipt, NAMESPACE)).toBe(OWNER);

        await expect(
            consumeShareViewReceipt({
                receipt,
                namespace: NAMESPACE,
                eligibilitySource: testPolicySource,
                now: () => NOW,
            })
        ).resolves.toBe('consumed');

        const after = await readShare(shareId);
        expect(after.viewCount).toBe(1);
        expect(after.lastViewedAt).not.toBeNull();
        expect(await readConsumedAt(receipt)).not.toBeNull();

        await expect(
            consumeShareViewReceipt({
                receipt,
                namespace: NAMESPACE,
                eligibilitySource: testPolicySource,
                now: () => NOW,
            })
        ).resolves.toBe('already_consumed');
        expect((await readShare(shareId)).viewCount).toBe(1);
    });

    it('increments exactly once under concurrent duplicate acknowledgements', async () => {
        const shareId = await seedShare();
        const receipt = receiptFor();

        await persistShareViewReceipt({
            receipt,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            contentVersion: 1,
            shareVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 600,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });

        const outcomes = await Promise.all(
            Array.from({ length: 5 }, () =>
                consumeShareViewReceipt({
                    receipt,
                    namespace: NAMESPACE,
                    eligibilitySource: testPolicySource,
                    now: () => NOW,
                })
            )
        );

        expect(outcomes.filter(outcome => outcome === 'consumed')).toHaveLength(1);
        expect(
            outcomes.every(outcome => outcome === 'consumed' || outcome === 'already_consumed')
        ).toBe(true);
        expect((await readShare(shareId)).viewCount).toBe(1);
    });

    it('persists nothing and counts nothing for an ineligible, unknown or padding token', async () => {
        const shareId = await seedShare();

        // Unknown/padding token: never in the graph.
        await expect(
            consumeShareViewReceipt({
                receipt: receiptFor(),
                namespace: NAMESPACE,
                eligibilitySource: testPolicySource,
                now: () => NOW,
            })
        ).resolves.toBe('not_found');

        // Persisted receipt but the fresh authoritative policy says ineligible.
        const receipt = receiptFor();
        await persistShareViewReceipt({
            receipt,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            contentVersion: 1,
            shareVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 600,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });

        await expect(
            consumeShareViewReceipt({
                receipt,
                namespace: NAMESPACE,
                eligibilitySource: denyPolicySource,
                now: () => NOW,
            })
        ).resolves.toBe('ineligible');

        expect((await readShare(shareId)).viewCount).toBe(0);
        expect(await readConsumedAt(receipt)).toBeNull();
    });

    it('refuses to count when the committed policy has become ineligible (policy transition)', async () => {
        const shareId = await seedShare();
        const receipt = receiptFor();

        await persistShareViewReceipt({
            receipt,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            contentVersion: 1,
            shareVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 600,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });

        await neogma.queryRunner.run(
            'MATCH (s:ShareLink {id: $shareId}) SET s.minorPolicyViewCountingEnabled = false',
            { shareId }
        );

        // Eligibility source still permits; the tightened committed snapshot must veto.
        await expect(
            consumeShareViewReceipt({
                receipt,
                namespace: NAMESPACE,
                eligibilitySource: testPolicySource,
                now: () => NOW,
            })
        ).resolves.toBe('ineligible');

        expect((await readShare(shareId)).viewCount).toBe(0);
    });

    it('does not count a receipt for a superseded or stopped or expired share', async () => {
        const shareId = await seedShare();
        const receipt = receiptFor();
        await persistShareViewReceipt({
            receipt,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            contentVersion: 1,
            shareVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 600,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });

        // Content replacement: version moves on, receipt stays bound to v1.
        await neogma.queryRunner.run(
            'MATCH (s:ShareLink {id: $shareId}) SET s.contentVersion = 2',
            { shareId }
        );
        await expect(
            consumeShareViewReceipt({
                receipt,
                namespace: NAMESPACE,
                eligibilitySource: testPolicySource,
                now: () => NOW,
            })
        ).resolves.toBe('version_mismatch');
        expect((await readShare(shareId)).viewCount).toBe(0);

        // Revoke.
        await neogma.queryRunner.run(
            `MATCH (s:ShareLink {id: $shareId}) SET s.status = 'stopped', s.stoppedAt = $now`,
            { shareId, now: NOW.toISOString() }
        );
        await expect(
            consumeShareViewReceipt({
                receipt,
                namespace: NAMESPACE,
                eligibilitySource: testPolicySource,
                now: () => NOW,
            })
        ).resolves.toBe('not_active');
        expect((await readShare(shareId)).viewCount).toBe(0);
    });

    it('rejects an expired receipt via the clock sampled after locks', async () => {
        const shareId = await seedShare();
        const receipt = receiptFor();
        await persistShareViewReceipt({
            receipt,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            contentVersion: 1,
            shareVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 600,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });

        const later = new Date(NOW.getTime() + 601_000);
        await expect(
            consumeShareViewReceipt({
                receipt,
                namespace: NAMESPACE,
                eligibilitySource: testPolicySource,
                now: () => later,
            })
        ).resolves.toBe('expired');
        expect((await readShare(shareId)).viewCount).toBe(0);
    });

    it('samples time after a lock-blocked acknowledgement, not before', async () => {
        const shareId = await seedShare();
        const receipt = receiptFor();
        // Receipt expires 700ms after NOW.
        await persistShareViewReceipt({
            receipt,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            contentVersion: 1,
            shareVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 600,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });
        await neogma.queryRunner.run(
            `MATCH (v:ShareViewReceipt) WHERE v.shareId = $shareId SET v.expiresAt = $expiresAt`,
            { shareId, expiresAt: new Date(NOW.getTime() + 700).toISOString() }
        );

        // Hold the share lock for longer than the receipt TTL.
        const driver = neogma.queryRunner.getDriver();
        const blocker = driver.session();
        const blockerTx = await blocker.beginTransaction();
        await blockerTx.run(
            'MATCH (s:ShareLink {id: $shareId}) SET s.lockTick = coalesce(s.lockTick,0) + 1',
            { shareId }
        );

        const started = Date.now();
        const pending = consumeShareViewReceipt({
            receipt,
            namespace: NAMESPACE,
            eligibilitySource: testPolicySource,
            // Real clock: must sample after the lock is acquired.
            now: () => new Date(NOW.getTime() + (Date.now() - started)),
        });

        await new Promise(resolve => setTimeout(resolve, 1_200));
        await blockerTx.commit();
        await blocker.close();

        await expect(pending).resolves.toBe('expired');
        expect((await readShare(shareId)).viewCount).toBe(0);
    });

    it('prunes only expired/consumed receipts, never share state', async () => {
        const shareId = await seedShare();

        const expired = receiptFor();
        const consumed = receiptFor();
        const live = receiptFor();

        await persistShareViewReceipt({
            receipt: expired,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            contentVersion: 1,
            shareVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 0,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });
        await persistShareViewReceipt({
            receipt: consumed,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            contentVersion: 1,
            shareVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 600,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });
        await persistShareViewReceipt({
            receipt: live,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            contentVersion: 1,
            shareVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 600,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });

        await consumeShareViewReceipt({
            receipt: consumed,
            namespace: NAMESPACE,
            eligibilitySource: testPolicySource,
            now: () => NOW,
        });

        const deleted = await pruneShareViewReceipts({
            namespace: NAMESPACE,
            limit: 100,
            now: NOW,
        });

        expect(deleted).toBe(2);
        expect(await readShareViewReceiptOwner(live, NAMESPACE)).toBe(OWNER);
        expect(await readShareViewReceiptOwner(expired, NAMESPACE)).toBeNull();
        expect(await readShareViewReceiptOwner(consumed, NAMESPACE)).toBeNull();

        // Share state is untouched by pruning.
        const result = await neogma.queryRunner.run(
            'MATCH (s:ShareLink {id: $shareId}) RETURN count(s) AS count',
            { shareId }
        );
        expect(Number(result.records[0]?.get('count') ?? 0)).toBe(1);
    });

    it('never consumes a receipt minted in another namespace', async () => {
        const shareId = await seedShare();
        const receipt = receiptFor();
        await persistShareViewReceipt({
            receipt,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            shareVersion: 1,
            contentVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 600,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });

        expect(await readShareViewReceiptOwner(receipt, 'other-ns')).toBeNull();
        await expect(
            consumeShareViewReceipt({
                receipt,
                namespace: 'other-ns',
                eligibilitySource: testPolicySource,
                now: () => NOW,
            })
        ).resolves.toBe('binding_mismatch');
        expect(await readShareViewReceiptOwner(receipt, NAMESPACE)).toBe(OWNER);
        expect((await readShare(shareId)).viewCount).toBe(0);
    });

    it('prunes only the requested namespace', async () => {
        const shareId = await seedShare();
        const otherShareId = await seedShare({ namespace: 'other-ns' });
        await setTestPolicy(true, 'other-ns');
        const mine = receiptFor();
        const other = receiptFor();
        await persistShareViewReceipt({
            receipt: mine,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            shareVersion: 1,
            contentVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 0,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });
        await persistShareViewReceipt({
            receipt: other,
            namespace: 'other-ns',
            ownerProfileId: OWNER,
            shareId: otherShareId,
            shareVersion: 1,
            contentVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 0,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });

        expect(await pruneShareViewReceipts({ namespace: NAMESPACE, now: NOW })).toBe(1);
        expect(await readShareViewReceiptOwner(mine, NAMESPACE)).toBeNull();
        expect(await readShareViewReceiptOwner(other, 'other-ns')).toBe(OWNER);
    });

    it('never counts malformed durable receipt state', async () => {
        const shareId = await seedShare();
        const missingExpiry = receiptFor();
        const missingIdentity = receiptFor();
        const badConsumedAt = receiptFor();
        const badReceiptExpiry = receiptFor();
        const fractionalVersion = receiptFor();
        const negativeVersion = receiptFor();

        const receipts = [
            missingExpiry,
            missingIdentity,
            badConsumedAt,
            badReceiptExpiry,
            fractionalVersion,
            negativeVersion,
        ];
        for (const receipt of receipts) {
            const ok = await persistShareViewReceipt({
                receipt,
                namespace: NAMESPACE,
                ownerProfileId: OWNER,
                shareId,
                shareVersion: 1,
                contentVersion: 1,
                objectRef: OBJECT_REF,
                operationId: OPERATION_ID,
                ttlSeconds: 600,
                now: () => NOW,
                eligibilitySource: testPolicySource,
            });
            expect(ok).toBe(true);
        }

        await neogma.queryRunner.run(
            `MATCH (v:ShareViewReceipt {receiptHash: $hash}) SET v.expiresAt = null`,
            { hash: hashShareViewReceipt(missingExpiry) }
        );
        await neogma.queryRunner.run(
            `MATCH (v:ShareViewReceipt {receiptHash: $hash}) SET v.objectRef = null`,
            { hash: hashShareViewReceipt(missingIdentity) }
        );
        // A non-string consumedAt must not become "unconsumed".
        await neogma.queryRunner.run(
            `MATCH (v:ShareViewReceipt {receiptHash: $hash}) SET v.consumedAt = 12345`,
            { hash: hashShareViewReceipt(badConsumedAt) }
        );
        // A garbage receipt expiry must fail closed, not become unlimited.
        await neogma.queryRunner.run(
            `MATCH (v:ShareViewReceipt {receiptHash: $hash}) SET v.expiresAt = 'not-a-date'`,
            { hash: hashShareViewReceipt(badReceiptExpiry) }
        );
        // Negative/fractional versions are malformed, not coerced.
        await neogma.queryRunner.run(
            `MATCH (v:ShareViewReceipt {receiptHash: $hash}) SET v.contentVersion = 1.5`,
            { hash: hashShareViewReceipt(fractionalVersion) }
        );
        await neogma.queryRunner.run(
            `MATCH (v:ShareViewReceipt {receiptHash: $hash}) SET v.shareVersion = -1`,
            { hash: hashShareViewReceipt(negativeVersion) }
        );

        const consume = (receipt: string) =>
            consumeShareViewReceipt({
                receipt,
                namespace: NAMESPACE,
                eligibilitySource: testPolicySource,
                now: () => NOW,
            });

        await expect(consume(missingExpiry)).resolves.toBe('expired');
        await expect(consume(missingIdentity)).resolves.toBe('binding_mismatch');
        await expect(consume(badConsumedAt)).resolves.toBe('not_found');
        await expect(consume(badReceiptExpiry)).resolves.toBe('expired');
        await expect(consume(fractionalVersion)).resolves.toBe('not_found');
        await expect(consume(negativeVersion)).resolves.toBe('not_found');

        expect((await readShare(shareId)).viewCount).toBe(0);
        for (const receipt of [missingExpiry, missingIdentity, badReceiptExpiry]) {
            expect(await readConsumedAt(receipt)).toBeNull();
        }
        // The malformed marker is left untouched (never rewritten to a real
        // consumption instant) and the counter never moved.
        expect(await readConsumedAt(badConsumedAt)).not.toBeNull();
    });

    it('treats a malformed share expiry as not_active, never unlimited', async () => {
        const shareId = await seedShare();
        const receipt = receiptFor();
        await persistShareViewReceipt({
            receipt,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            shareVersion: 1,
            contentVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 600,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });

        await neogma.queryRunner.run(`MATCH (s:ShareLink {id: $shareId}) SET s.expiresAt = 12345`, {
            shareId,
        });

        await expect(
            consumeShareViewReceipt({
                receipt,
                namespace: NAMESPACE,
                eligibilitySource: testPolicySource,
                now: () => NOW,
            })
        ).resolves.toBe('not_found');
        expect((await readShare(shareId)).viewCount).toBe(0);
    });

    it('re-reads the persisted policy under the share lock and honors a concurrent tightening', async () => {
        const shareId = await seedShare();
        const receipt = receiptFor();
        await persistShareViewReceipt({
            receipt,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            shareVersion: 1,
            contentVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 600,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        });

        // Hold the share lock so the consume transaction blocks after receipt
        // discovery but before it reads the persisted policy.
        const driver = neogma.queryRunner.getDriver();
        const blocker = driver.session();
        const blockerTx = await blocker.beginTransaction();
        await blockerTx.run(
            'MATCH (s:ShareLink {id: $shareId}) SET s.lockTick = coalesce(s.lockTick,0) + 1',
            { shareId }
        );

        const pending = consumeShareViewReceipt({
            receipt,
            namespace: NAMESPACE,
            eligibilitySource: testPolicySource,
            now: () => NOW,
        });

        // Give the consume transaction time to block on the share lock, then
        // tighten the SAME persisted policy node it will read under the lock.
        await new Promise(resolve => setTimeout(resolve, 250));
        await setTestPolicy(false);
        await blockerTx.commit();
        await blocker.close();

        await expect(pending).resolves.toBe('ineligible');
        expect((await readShare(shareId)).viewCount).toBe(0);
        expect(await readConsumedAt(receipt)).toBeNull();
    });

    it('writes no receipt when the trusted eligibility source is absent', async () => {
        const shareId = await seedShare();
        const receipt = receiptFor();

        await expect(
            persistShareViewReceipt({
                receipt,
                namespace: NAMESPACE,
                ownerProfileId: OWNER,
                shareId,
                shareVersion: 1,
                contentVersion: 1,
                objectRef: OBJECT_REF,
                operationId: OPERATION_ID,
                ttlSeconds: 600,
                now: () => NOW,
            })
        ).resolves.toBe(false);

        expect(await readShareViewReceiptOwner(receipt, NAMESPACE)).toBeNull();
    });

    it('writes no receipt when the source denies or when the current share is not active', async () => {
        const shareId = await seedShare();
        const denied = receiptFor();

        await expect(
            persistShareViewReceipt({
                receipt: denied,
                namespace: NAMESPACE,
                ownerProfileId: OWNER,
                shareId,
                shareVersion: 1,
                contentVersion: 1,
                objectRef: OBJECT_REF,
                operationId: OPERATION_ID,
                ttlSeconds: 600,
                now: () => NOW,
                eligibilitySource: denyPolicySource,
            })
        ).resolves.toBe(false);
        expect(await readShareViewReceiptOwner(denied, NAMESPACE)).toBeNull();

        // The pre-lock caller may believe the share is active, but the under-lock
        // re-read observes the stop and refuses the write.
        await neogma.queryRunner.run(
            `MATCH (s:ShareLink {id: $shareId}) SET s.status = 'stopped', s.stoppedAt = $now`,
            { shareId, now: NOW.toISOString() }
        );
        const stopped = receiptFor();
        await expect(
            persistShareViewReceipt({
                receipt: stopped,
                namespace: NAMESPACE,
                ownerProfileId: OWNER,
                shareId,
                shareVersion: 1,
                contentVersion: 1,
                objectRef: OBJECT_REF,
                operationId: OPERATION_ID,
                ttlSeconds: 600,
                now: () => NOW,
                eligibilitySource: testPolicySource,
            })
        ).resolves.toBe(false);
        expect(await readShareViewReceiptOwner(stopped, NAMESPACE)).toBeNull();
    });

    it('rejects malformed persist bindings and never rebinds on a collision', async () => {
        const shareId = await seedShare();
        const receipt = receiptFor();

        const base = {
            receipt,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId,
            shareVersion: 1,
            contentVersion: 1,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            ttlSeconds: 600,
            now: () => NOW,
            eligibilitySource: testPolicySource,
        };

        await expect(persistShareViewReceipt({ ...base, shareVersion: -1 })).resolves.toBe(false);
        await expect(persistShareViewReceipt({ ...base, contentVersion: 1.5 })).resolves.toBe(
            false
        );
        await expect(persistShareViewReceipt({ ...base, objectRef: '' })).resolves.toBe(false);

        // First create succeeds; a second create on the same hash is a collision
        // and must not rebind the existing node.
        await expect(persistShareViewReceipt(base)).resolves.toBe(true);
        await expect(persistShareViewReceipt(base)).resolves.toBe(false);

        const result = await neogma.queryRunner.run(
            `MATCH (v:ShareViewReceipt {receiptHash: $hash}) RETURN count(v) AS count`,
            { hash: hashShareViewReceipt(receipt) }
        );
        expect(Number(result.records[0]?.get('count') ?? 0)).toBe(1);
    });
});
