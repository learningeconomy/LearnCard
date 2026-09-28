import { createHash } from 'node:crypto';

import { ensureShareLinkConstraints } from '../../models/share-link-constraints';
import { failShareLink } from './errors';
import { lockShare, readNodeProperties } from './helpers';
import { withShareLinkRead, withShareLinkTransaction } from './transaction';
import type { ShareLinkTransaction } from './transaction';
import type {
    ConsumeShareViewReceiptInput,
    ConsumeShareViewReceiptOutcome,
    PersistShareViewReceiptInput,
    PruneShareViewReceiptsInput,
} from './types';

/**
 * LC-2187 view-receipt repository.
 *
 * Security invariants:
 * - The raw opaque token is NEVER stored; only `sha256(token)` keyed by a
 *   uniqueness constraint. Padding values returned to ineligible viewers are
 *   never persisted, so they can never be consumed.
 * - Consume + `viewCount` increment + `lastViewedAt` happen in ONE Neo4j
 *   transaction that (1) locks the share, (2) locks the receipt, then (3)
 *   re-reads status/version/expiry/policy/consumed state. The share lock is the
 *   SAME lock revoke/update/finalize take, so an acknowledgement that races a
 *   revoke/replacement either commits before it or observes the stop and does
 *   not count.
 * - Eligibility is a conjunction of the committed snapshot policy re-read under
 *   the lock and a narrowly typed, transaction-compatible trusted policy source
 *   consulted inside the same transaction. A pre-lock boolean is never authority;
 *   absence or failure of the source is ineligible. A uniqueness constraint alone
 *   is insufficient.
 * - No remote/network I/O ever runs inside the transaction.
 */

const DEFAULT_PRUNE_LIMIT = 200;
const MAX_PRUNE_LIMIT = 1000;
const MAX_RECEIPT_TTL_SECONDS = 86_400;

const RECEIPT_HASH_RE = /^[0-9a-f]{64}$/;

/**
 * A durable receipt is only trustworthy when every required binding field is
 * present and well-formed. Malformed state must never be interpreted as a
 * permissive default, so these helpers return `null` and callers fail closed.
 */
const requiredString = (value: unknown): string | null =>
    typeof value === 'string' && value.length > 0 ? value : null;

const requiredFiniteNumber = (value: unknown): number | null =>
    typeof value === 'number' && Number.isFinite(value) ? value : null;

/**
 * Strict version validator. A durable version is a safe positive integer:
 * negative, fractional, zero, NaN and Infinity values are malformed and fail
 * closed rather than being coerced or defaulted.
 */
const requiredPositiveInteger = (value: unknown): number | null =>
    typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;

/** A required ISO timestamp that actually parses; `null`/garbage fail closed. */
const requiredInstantMs = (value: unknown): number | null => {
    if (typeof value !== 'string' || value.length === 0) return null;

    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
};

/**
 * A valid optional instant. Absent/`null` is a legitimate "unset" and returns
 * `null`; any other value MUST parse, otherwise `undefined` is returned so the
 * caller can fail closed instead of treating malformed state as unset.
 */
const optionalInstantMs = (value: unknown): number | null | undefined => {
    if (value === null || value === undefined) return null;

    return requiredInstantMs(value) ?? undefined;
};

export const hashShareViewReceipt = (receipt: string): string =>
    createHash('sha256').update(receipt, 'utf8').digest('hex');

const readReceiptByHash = async (
    tx: ShareLinkTransaction,
    receiptHash: string
): Promise<Record<string, unknown> | null> => {
    const result = await tx.run(
        'MATCH (v:ShareViewReceipt {receiptHash: $receiptHash}) RETURN v LIMIT 1',
        { receiptHash }
    );

    return readNodeProperties(result, 'v');
};

/**
 * Takes the receipt write lock. Must only run AFTER the share lock is held by
 * the same transaction, so every receipt/consume path takes locks in the same
 * share-then-receipt order as revoke/update.
 */
const lockReceipt = async (
    tx: ShareLinkTransaction,
    receiptHash: string
): Promise<Record<string, unknown> | null> => {
    const result = await tx.run(
        `MATCH (v:ShareViewReceipt {receiptHash: $receiptHash})
         SET v.lockTick = coalesce(v.lockTick, 0) + 1
         RETURN v`,
        { receiptHash }
    );

    return readNodeProperties(result, 'v');
};

/**
 * Persists one eligible receipt. Returns `false` (never throws for the caller's
 * counting decision) when a hash collision, malformed input, stale share,
 * missing/unverifiable eligibility source or ineligible owner makes the node
 * unwritable; the public route still returns an identically shaped padding
 * token, so no eligibility-dependent response shape is exposed.
 *
 * The share lock is taken FIRST (the same lock revoke/update/finalize take),
 * then the complete current tuple/status/version/expiry is re-read under it,
 * then the trusted policy source is consulted inside the same transaction, and
 * only then is the receipt created. A pre-lock boolean is never authority.
 */
export const persistShareViewReceipt = async (
    input: PersistShareViewReceiptInput
): Promise<boolean> => {
    const receiptHash = hashShareViewReceipt(input.receipt);
    if (!RECEIPT_HASH_RE.test(receiptHash)) return false;

    // Required full binding. A receipt missing any immutable identity field must
    // never be written, because consume could not distinguish it from a receipt
    // for a different revision.
    const namespace = requiredString(input.namespace);
    const ownerProfileId = requiredString(input.ownerProfileId);
    const shareId = requiredString(input.shareId);
    const objectRef = requiredString(input.objectRef);
    const operationId = requiredString(input.operationId);
    const shareVersion = requiredPositiveInteger(input.shareVersion);
    const contentVersion = requiredPositiveInteger(input.contentVersion);
    const ttlSeconds = requiredFiniteNumber(input.ttlSeconds);

    if (
        namespace === null ||
        ownerProfileId === null ||
        shareId === null ||
        objectRef === null ||
        operationId === null ||
        shareVersion === null ||
        contentVersion === null ||
        ttlSeconds === null ||
        ttlSeconds < 0 ||
        ttlSeconds > MAX_RECEIPT_TTL_SECONDS
    ) {
        return false;
    }

    // No trusted, transaction-compatible eligibility source means no write. The
    // production age source is unknown today, so production passes no source and
    // never issues a receipt or a count.
    const eligibilitySource = input.eligibilitySource;
    if (!eligibilitySource) return false;

    await ensureShareLinkConstraints();

    const now = input.now ?? (() => new Date());

    try {
        return await withShareLinkTransaction(async tx => {
            // Share lock FIRST (same lock revoke/update/finalize take).
            const shareProps = await lockShare(tx, shareId);
            if (!shareProps) return false;

            const currentNamespace = requiredString(shareProps.namespace);
            const currentOwner = requiredString(shareProps.ownerProfileId);
            const status = requiredString(shareProps.status);
            const contentState = requiredString(shareProps.contentState);
            const currentVersion = requiredPositiveInteger(shareProps.version);
            const currentContentVersion = requiredPositiveInteger(shareProps.contentVersion);
            const currentObjectRef = requiredString(shareProps.activeObjectRef);
            const currentOperationId = requiredString(shareProps.activeObjectOperationId);

            if (
                currentNamespace === null ||
                currentNamespace !== namespace ||
                currentOwner === null ||
                currentOwner !== ownerProfileId ||
                status !== 'active' ||
                contentState !== 'finalized' ||
                currentVersion === null ||
                currentVersion !== shareVersion ||
                currentContentVersion === null ||
                currentContentVersion !== contentVersion ||
                currentObjectRef === null ||
                currentObjectRef !== objectRef ||
                currentOperationId === null ||
                currentOperationId !== operationId
            ) {
                return false;
            }

            if (
                shareProps.minorPolicyViewCountingEnabled !== true ||
                shareProps.minorPolicyResolved !== true ||
                shareProps.minorPolicyIsMinor !== false
            )
                return false;

            // Optional share expiry: absent/null is unlimited, but a malformed
            // value must never be interpreted as unlimited.
            const shareExpiresMs = optionalInstantMs(shareProps.expiresAt);
            if (shareExpiresMs === undefined) return false;

            // Clock sampled only AFTER the blocking share lock, so a delayed lock
            // can never produce a receipt whose TTL was computed against stale time.
            const lockedNow = now();
            if (shareExpiresMs !== null && shareExpiresMs <= lockedNow.getTime()) return false;

            // Trusted policy source consulted under the same lock. A throwing or
            // non-true result is ineligible and writes nothing.
            let eligible: boolean;
            try {
                eligible = await eligibilitySource.isEligible(tx, {
                    namespace,
                    ownerProfileId,
                    shareId,
                    shareVersion,
                    contentVersion,
                    objectRef,
                    operationId,
                    now: lockedNow,
                });
            } catch {
                return false;
            }
            if (eligible !== true) return false;

            // Eligibility may itself wait on graph locks; sample again before writing.
            const writeNow = now();
            if (shareExpiresMs !== null && shareExpiresMs <= writeNow.getTime()) return false;
            const nowIso = writeNow.toISOString();
            const expiresAt = new Date(writeNow.getTime() + ttlSeconds * 1000).toISOString();

            // CREATE, not MERGE: the `receiptHash` uniqueness constraint turns a
            // collision into a typed failure instead of silently rebinding an
            // existing receipt (and its future count) to a different immutable
            // object. On collision we return `false` and count nothing.
            await tx.run(
                `CREATE (v:ShareViewReceipt {
                     receiptHash: $receiptHash,
                     namespace: $namespace,
                     ownerProfileId: $ownerProfileId,
                     shareId: $shareId,
                     shareVersion: $shareVersion,
                     contentVersion: $contentVersion,
                     objectRef: $objectRef,
                     operationId: $operationId,
                     createdAt: $now,
                     expiresAt: $expiresAt,
                     consumedAt: null
                 })`,
                {
                    receiptHash,
                    namespace,
                    ownerProfileId,
                    shareId,
                    shareVersion,
                    contentVersion,
                    objectRef,
                    operationId,
                    now: nowIso,
                    expiresAt,
                }
            );

            return true;
        });
    } catch {
        // A collision/constraint race is not an eligibility signal. Fail closed
        // on counting (the receipt simply never exists) without changing shape.
        return false;
    }
};

/**
 * Returns the owner bound to a persisted receipt, or `null` for any unknown or
 * padding token. The caller uses this only to re-resolve authoritative policy
 * BEFORE the consume transaction; the transaction re-reads the binding under the
 * locks, so this pre-read is never authority by itself.
 */
export const readShareViewReceiptOwner = async (
    receipt: string,
    namespace: string
): Promise<string | null> => {
    const receiptHash = hashShareViewReceipt(receipt);
    if (!RECEIPT_HASH_RE.test(receiptHash)) return null;

    const trustedNamespace = requiredString(namespace);
    if (trustedNamespace === null) return null;

    await ensureShareLinkConstraints();

    const props = await withShareLinkRead(runner => readReceiptByHash(runner, receiptHash));

    if (!props) return null;

    // A valid token minted in a different namespace is not this deployment's
    // receipt. The persisted namespace must match the trusted configured one.
    const receiptNamespace = requiredString(props.namespace);
    if (receiptNamespace === null || receiptNamespace !== trustedNamespace) return null;

    const owner = requiredString(props.ownerProfileId);
    return owner;
};

/**
 * Atomically consumes one eligible receipt and increments the share view
 * counter exactly once, even under concurrent duplicate acknowledgements.
 *
 * The whole guard chain runs under the share lock and then the receipt lock:
 * - share must exist, be `active`/`finalized`, unexpired, and still bound to
 *   the same `contentVersion`/owner/namespace as the receipt;
 * - the receipt must exist, be unconsumed and unexpired;
 * - counting requires BOTH the freshly resolved authoritative policy and the
 *   committed snapshot policy to permit it.
 *
 * Any guard failure performs no write. Time is sampled after the locks are held.
 */
export const consumeShareViewReceipt = async (
    input: ConsumeShareViewReceiptInput
): Promise<ConsumeShareViewReceiptOutcome> => {
    const receiptHash = hashShareViewReceipt(input.receipt);
    if (!RECEIPT_HASH_RE.test(receiptHash)) return 'not_found';

    const trustedNamespace = requiredString(input.namespace);
    if (trustedNamespace === null) return 'not_found';

    await ensureShareLinkConstraints();

    const now = input.now ?? (() => new Date());

    try {
        return await withShareLinkTransaction(async tx => {
            // Discover the share from durable receipt state only; no caller field
            // other than the opaque token is trusted.
            const discovered = await readReceiptByHash(tx, receiptHash);
            if (!discovered) return 'not_found';

            const shareId = requiredString(discovered.shareId);
            if (!shareId) return 'not_found';

            // Share lock FIRST (same lock revoke/update/finalize take).
            const shareProps = await lockShare(tx, shareId);
            if (!shareProps) return 'not_found';

            // Then the receipt lock, then re-read both under the locks.
            const receiptProps = await lockReceipt(tx, receiptHash);
            if (!receiptProps) return 'not_found';

            // Production time sampled AFTER both locks are held.
            const lockedNow = now();

            // Complete, well-formed immutable binding. Every identity/version
            // field is required; malformed durable state fails closed and can
            // never be interpreted as a default.
            const namespace = requiredString(shareProps.namespace);
            const ownerProfileId = requiredString(shareProps.ownerProfileId);
            const status = requiredString(shareProps.status);
            const contentState = requiredString(shareProps.contentState);
            const contentVersion = requiredPositiveInteger(shareProps.contentVersion);
            const shareVersion = requiredPositiveInteger(shareProps.version);
            const shareObjectRef = requiredString(shareProps.activeObjectRef);
            const shareOperationId = requiredString(shareProps.activeObjectOperationId);

            const receiptNamespace = requiredString(receiptProps.namespace);
            const receiptOwner = requiredString(receiptProps.ownerProfileId);
            const receiptShareId = requiredString(receiptProps.shareId);
            const receiptShareVersion = requiredPositiveInteger(receiptProps.shareVersion);
            const receiptContentVersion = requiredPositiveInteger(receiptProps.contentVersion);
            const receiptObjectRef = requiredString(receiptProps.objectRef);
            const receiptOperationId = requiredString(receiptProps.operationId);
            const receiptExpiresMs = requiredInstantMs(receiptProps.expiresAt);

            // Optional instants: absent/null is valid "unset"; a malformed
            // value must never be read as unset/unlimited.
            const consumedAtMs = optionalInstantMs(receiptProps.consumedAt);
            const shareExpiresMs = optionalInstantMs(shareProps.expiresAt);
            if (consumedAtMs === undefined || shareExpiresMs === undefined) return 'not_found';

            // The trusted configured namespace must match BOTH the receipt and the
            // share. A token from another namespace can never be consumed here.
            if (
                namespace === null ||
                namespace !== trustedNamespace ||
                receiptNamespace === null ||
                receiptNamespace !== trustedNamespace
            ) {
                return 'binding_mismatch';
            }

            if (
                ownerProfileId === null ||
                shareId === '' ||
                shareObjectRef === null ||
                shareOperationId === null ||
                shareVersion === null ||
                contentVersion === null
            ) {
                return 'not_found';
            }

            // A malformed receipt version is unreadable durable state, not a
            // binding mismatch to compare; fail closed before any write.
            if (receiptShareVersion === null || receiptContentVersion === null) {
                return 'not_found';
            }

            if (
                receiptOwner !== ownerProfileId ||
                receiptShareId !== shareId ||
                // Full immutable identity, not just the content version.
                receiptShareVersion !== shareVersion ||
                receiptObjectRef !== shareObjectRef ||
                receiptOperationId !== shareOperationId
            ) {
                return 'binding_mismatch';
            }
            // A present `consumedAt` is authoritative: a malformed non-null value
            // must never be treated as "unconsumed". Absence/null is unconsumed.
            if (consumedAtMs !== null) return 'already_consumed';
            // Required, parseable receipt expiry. Missing/garbage fails closed.
            if (receiptExpiresMs === null || receiptExpiresMs <= lockedNow.getTime()) {
                return 'expired';
            }
            if (status !== 'active' || contentState !== 'finalized') return 'not_active';
            if (shareExpiresMs !== null && shareExpiresMs <= lockedNow.getTime()) {
                return 'not_active';
            }
            if (receiptContentVersion !== contentVersion) return 'version_mismatch';

            const committedEligible =
                shareProps.minorPolicyViewCountingEnabled === true &&
                shareProps.minorPolicyResolved === true &&
                shareProps.minorPolicyIsMinor === false;

            // Counting requires BOTH the committed snapshot policy and the
            // transaction-compatible trusted policy source to permit it. There
            // is no pre-lock boolean authority; an absent source is ineligible.
            if (!committedEligible) return 'ineligible';

            const eligibilitySource = input.eligibilitySource;
            if (!eligibilitySource) return 'ineligible';

            let eligible: boolean;
            try {
                eligible = await eligibilitySource.isEligible(tx, {
                    namespace,
                    ownerProfileId,
                    shareId,
                    shareVersion,
                    contentVersion,
                    objectRef: shareObjectRef,
                    operationId: shareOperationId,
                    now: lockedNow,
                });
            } catch {
                return 'ineligible';
            }
            if (eligible !== true) return 'ineligible';

            const writeNow = now();
            if (receiptExpiresMs <= writeNow.getTime()) return 'expired';
            if (shareExpiresMs !== null && shareExpiresMs <= writeNow.getTime())
                return 'not_active';
            const nowIso = writeNow.toISOString();

            const write = await tx.run(
                `MATCH (v:ShareViewReceipt {receiptHash: $receiptHash})
                 MATCH (s:ShareLink {id: $shareId})
                 SET v.consumedAt = $now,
                     s.viewCount = coalesce(s.viewCount, 0) + 1,
                     s.lastViewedAt = $now`,
                { receiptHash, shareId, now: nowIso }
            );

            if (!write) return 'not_found';
            return 'consumed';
        });
    } catch {
        return 'not_found';
    }
};

/**
 * Explicit one-shot pruning of expired/consumed receipt nodes.
 *
 * `MATCH ... WITH v LIMIT n DETACH DELETE v RETURN count(*)` reclaims at most
 * `limit` nodes per call. It never touches `ShareLink`,
 * `ShareLinkOperation`, reservations, cleanup jobs or share content — those
 * have their own retention rules. The disabled maintenance pass invokes this
 * with a bounded limit and an explicit no-inline-retry graph transaction.
 */
export const pruneShareViewReceipts = async (
    input: PruneShareViewReceiptsInput
): Promise<number> => {
    const namespace = requiredString(input.namespace);
    if (namespace === null) {
        failShareLink('INVALID_INPUT', 'a trusted namespace is required for receipt pruning');
    }

    if (input.limit !== undefined && (!Number.isFinite(input.limit) || input.limit < 1)) {
        // Never let NaN/Infinity reach Cypher as an unbounded or malformed limit.
        failShareLink('INVALID_INPUT', 'receipt prune limit must be a positive finite number');
    }

    const requested = input.limit ?? DEFAULT_PRUNE_LIMIT;
    const limit = Math.max(1, Math.min(MAX_PRUNE_LIMIT, Math.floor(requested)));
    const nowIso = (input.now ?? new Date()).toISOString();

    await ensureShareLinkConstraints();

    return withShareLinkRead(async runner => {
        const result = await runner.run(
            `MATCH (v:ShareViewReceipt {namespace: $namespace})
             WHERE (v.expiresAt IS NOT NULL AND v.expiresAt <= $now)
                OR v.consumedAt IS NOT NULL
             WITH v LIMIT toInteger($limit)
             DETACH DELETE v
             RETURN count(*) AS deleted`,
            { namespace, now: nowIso, limit }
        );

        const raw = result.records[0]?.get('deleted') as
            number | { toNumber?: () => number } | undefined;
        if (typeof raw === 'number') return raw;
        if (raw && typeof raw.toNumber === 'function') return raw.toNumber();

        return 0;
    }, input.transaction);
};
