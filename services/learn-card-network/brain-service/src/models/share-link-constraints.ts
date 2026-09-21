import { neogma } from '@instance';

/**
 * Uniqueness rules required for the LC-2187 share lifecycle.
 *
 * A uniqueness constraint alone does not serialize two transactions consuming one
 * reservation; the repository additionally holds a `:ShareLink` write lock before
 * reading status/version/reservation state. These rules are the hard backstop that
 * makes the resulting race fail closed instead of forking state.
 */
const SHARE_LINK_CONSTRAINT_QUERIES = [
    // A share id is globally unique across namespaces.
    'CREATE CONSTRAINT share_link_id_unique IF NOT EXISTS FOR (s:ShareLink) REQUIRE (s.id) IS UNIQUE',
    // One idempotency record per (namespace, owner, operation kind, client request).
    'CREATE CONSTRAINT share_link_operation_key_unique IF NOT EXISTS FOR (o:ShareLinkOperation) REQUIRE (o.namespace, o.ownerProfileId, o.opKind, o.clientRequestId) IS UNIQUE',
    // At most one in-flight reservation per share.
    'CREATE CONSTRAINT share_link_reservation_share_unique IF NOT EXISTS FOR (r:ShareLinkReservation) REQUIRE (r.shareId) IS UNIQUE',
    // Cleanup is bound to exactly one immutable object reference.
    'CREATE CONSTRAINT share_content_cleanup_object_unique IF NOT EXISTS FOR (c:ShareContentCleanupJob) REQUIRE (c.objectRef) IS UNIQUE',
    // One persisted receipt node per opaque token hash (the token itself is never stored).
    'CREATE CONSTRAINT share_view_receipt_hash_unique IF NOT EXISTS FOR (v:ShareViewReceipt) REQUIRE (v.receiptHash) IS UNIQUE',
];

/**
 * Non-unique indexes that keep the lifecycle queries bounded. Index creation is
 * idempotent and shares the same readiness gate as the constraints.
 */
const SHARE_LINK_INDEX_QUERIES = [
    'CREATE INDEX share_link_ns_owner_idx IF NOT EXISTS FOR (s:ShareLink) ON (s.namespace, s.ownerProfileId)',
    // Bounded owner-list keyset pagination: filters on the leading
    // (namespace, ownerProfileId) prefix and orders by the immutable
    // (createdAt, id) key without a full scan/sort.
    'CREATE INDEX share_link_ns_owner_created_idx IF NOT EXISTS FOR (s:ShareLink) ON (s.namespace, s.ownerProfileId, s.createdAt, s.id)',
    'CREATE INDEX share_link_status_idx IF NOT EXISTS FOR (s:ShareLink) ON (s.status)',
    'CREATE INDEX share_link_operation_operation_id_idx IF NOT EXISTS FOR (o:ShareLinkOperation) ON (o.operationId)',
    'CREATE INDEX share_link_operation_share_id_idx IF NOT EXISTS FOR (o:ShareLinkOperation) ON (o.shareId)',
    'CREATE INDEX share_link_reservation_lease_idx IF NOT EXISTS FOR (r:ShareLinkReservation) ON (r.leaseExpiresAt)',
    // Bounded recovery discovery enumerates expired reservations for one namespace.
    'CREATE INDEX share_link_reservation_ns_lease_idx IF NOT EXISTS FOR (r:ShareLinkReservation) ON (r.namespace, r.leaseExpiresAt)',
    'CREATE INDEX share_content_cleanup_due_idx IF NOT EXISTS FOR (c:ShareContentCleanupJob) ON (c.status, c.nextAttemptAt)',
    // One-shot receipt pruning is bounded by expiry/consumed state.
    'CREATE INDEX share_view_receipt_expiry_idx IF NOT EXISTS FOR (v:ShareViewReceipt) ON (v.expiresAt)',
    'CREATE INDEX share_view_receipt_share_idx IF NOT EXISTS FOR (v:ShareViewReceipt) ON (v.namespace, v.shareId)',
];

type Neo4jSchemaError = {
    code?: string;
};

const isEquivalentSchemaRuleRace = (error: unknown): boolean =>
    (error as Neo4jSchemaError | undefined)?.code ===
    'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists';

const createShareLinkSchema = async (): Promise<void> => {
    for (const query of [...SHARE_LINK_CONSTRAINT_QUERIES, ...SHARE_LINK_INDEX_QUERIES]) {
        try {
            await neogma.queryRunner.run(query);
        } catch (error) {
            // Concurrent service starts can both observe a missing rule before one
            // wins creation. The losing CREATE is equivalent to the desired ready state.
            if (!isEquivalentSchemaRuleRace(error)) throw error;
        }
    }
};

let constraintReadiness: Promise<void> | undefined;

/**
 * Ensures the uniqueness rules and indexes required for the share lifecycle.
 *
 * Every public repository method awaits this before its transaction, so a caller
 * can never observe the "constraints not initialized" window. Concurrent callers
 * share one attempt; a failed attempt is cleared so a later request can retry
 * instead of leaving the repository permanently unavailable.
 */
export const ensureShareLinkConstraints = (): Promise<void> => {
    if (!constraintReadiness) {
        const pendingReadiness = createShareLinkSchema();
        constraintReadiness = pendingReadiness;

        void pendingReadiness.catch(() => {
            if (constraintReadiness === pendingReadiness) constraintReadiness = undefined;
        });
    }

    return constraintReadiness;
};

/** Exposed for focused tests that assert the exact schema statements. */
export const SHARE_LINK_SCHEMA_QUERIES = [
    ...SHARE_LINK_CONSTRAINT_QUERIES,
    ...SHARE_LINK_INDEX_QUERIES,
] as const;
