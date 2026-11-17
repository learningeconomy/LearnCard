import { int } from 'neo4j-driver';

import { neogma } from '@instance';
import { ensureContractEventMaintenance } from './contract-event-maintenance.helpers';

export type ConsentFlowSuspensionSummary = { suspended: number };
export type ConsentFlowExpirySummary = { expired: number };
export type ConsentFlowDeadlineSummary = ConsentFlowSuspensionSummary & ConsentFlowExpirySummary;

type BatchOptions = {
    /** Terms handled per statement. */
    limit?: number;
    /** Stop starting new batches after this long. */
    budgetMs?: number;
};

const ACTIVE_STATUSES = ['live', 'needs_reconsent', 'suspended'];

/**
 * How far behind the watermark each expiry scan starts. `expiresAt` is a free-form ISO string,
 * so a value written with a UTC offset can sort up to 12 hours before its real time. The scan
 * re-reads that much of the index range so such a value is still found once it really expires.
 */
const EXPIRY_SCAN_OVERLAP_MS = 15 * 60 * 60_000;
const EXPIRY_SCAN_STATE_ID = 'consent-expiry-scan';

const toNumber = (value: unknown): number => {
    if (value && typeof (value as { toNumber?: unknown }).toNumber === 'function') {
        return (value as { toNumber: () => number }).toNumber();
    }

    return Number(value ?? 0);
};

const batchSizeOf = (limit: number): number => Math.max(1, Math.min(1_000, Math.trunc(limit)));

/**
 * Move expired pending re-consents to suspended; safe to run repeatedly.
 *
 * Each suspended terms also gets one integration-only `consent_suspended` event (no profile
 * deliveries), written in the same statement as the status change. The event id is
 * `${termsId}:suspended:${deadline}`, so a retry cannot create a second one.
 */
export const suspendExpiredConsentFlowTerms = async (
    now = new Date().toISOString(),
    { limit = 200, budgetMs = 20_000 }: BatchOptions = {}
): Promise<ConsentFlowSuspensionSummary> => {
    const deadline = Date.now() + budgetMs;
    const batchSize = batchSizeOf(limit);
    let suspended = 0;

    do {
        const result = await neogma.queryRunner.run(
            `MATCH (terms:ConsentFlowTerms)
             WHERE terms.status = 'needs_reconsent'
               AND terms.reconsentDeadline IS NOT NULL
               AND terms.reconsentDeadline <= $now
             WITH terms ORDER BY terms.reconsentDeadline, terms.id LIMIT $limit
             OPTIONAL MATCH (terms)-[:CONSENTS_TO]->(contract:ConsentFlowContract)
             WITH terms, head(collect(contract)) AS contract
             SET terms.status = 'suspended', terms.updatedAt = $now
             FOREACH (_ IN CASE WHEN contract IS NULL THEN [] ELSE [1] END |
                 MERGE (event:ConsentFlowEvent {id: terms.id + ':suspended:' + terms.reconsentDeadline})
                 ON CREATE SET event += {
                     kind: 'consent_suspended', contractId: contract.id, termsId: terms.id,
                     requestId: terms.\`referral.requestId\`,
                     requestedBy: terms.\`referral.requestedBy\`,
                     externalReferenceId: terms.\`referral.externalReferenceId\`,
                     integrationFanoutPending: true, createdAt: $now
                 })
             RETURN count(terms) AS suspended`,
            { now, limit: int(batchSize) }
        );
        const count = toNumber(result.records[0]?.get('suspended'));

        suspended += count;

        if (count < batchSize) break;
    } while (Date.now() < deadline);

    return { suspended };
};

type ExpiryCandidate = { id: string; expiresAt: string };

/** Reads one page of an indexed `expiresAt` range, after the given (expiresAt, id) position. */
const readExpiryCandidates = async (
    label: 'ConsentFlowTerms' | 'ConsentFlowContract',
    range: { from: string; now: string },
    after: ExpiryCandidate | undefined,
    batchSize: number
): Promise<ExpiryCandidate[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (node:${label})
         USING INDEX node:${label}(expiresAt)
         WHERE node.expiresAt > $from AND node.expiresAt <= $now
             AND ($afterExpiresAt IS NULL OR node.expiresAt > $afterExpiresAt
                 OR (node.expiresAt = $afterExpiresAt AND node.id > $afterId))
             ${
                 label === 'ConsentFlowTerms'
                     ? 'AND node.expiredEventAt IS NULL AND node.status IN $statuses'
                     : ''
             }
         RETURN node.id AS id, node.expiresAt AS expiresAt
         ORDER BY node.expiresAt, node.id LIMIT $limit`,
        {
            ...range,
            afterExpiresAt: after?.expiresAt ?? null,
            afterId: after?.id ?? null,
            statuses: ACTIVE_STATUSES,
            limit: int(batchSize),
        }
    );

    return result.records.flatMap(row => {
        const id: unknown = row.get('id');
        const expiresAt: unknown = row.get('expiresAt');

        return typeof id === 'string' && typeof expiresAt === 'string' ? [{ id, expiresAt }] : [];
    });
};

/** Shared tail of both expiry statements: mark the terms and record its event exactly once. */
const MARK_EXPIRED_CYPHER = `
    SET terms.expiredEventAt = $now
    MERGE (event:ConsentFlowEvent {id: terms.id + ':expired'})
    ON CREATE SET event += {
        kind: 'consent_expired', contractId: contract.id, termsId: terms.id,
        requestId: terms.\`referral.requestId\`,
        requestedBy: terms.\`referral.requestedBy\`,
        externalReferenceId: terms.\`referral.externalReferenceId\`,
        integrationFanoutPending: true, createdAt: $now
    }
    RETURN count(terms) AS expired`;

/**
 * Records one integration-only `consent_expired` event (id `${termsId}:expired`) for every
 * active terms whose own `expiresAt`, or whose contract's `expiresAt`, has passed, and sets
 * `terms.expiredEventAt` so each terms emits once. The terms status is not changed.
 *
 * Work is found through the `expiresAt` indexes over a bounded range: from a stored watermark
 * (minus a fixed overlap) up to now. The watermark only advances when the range was read to
 * the end, so an interrupted pass is repeated. The first pass starts at now, not at the
 * beginning of history. Category-level `shareUntil` is out of scope.
 */
export const emitExpiredConsentEvents = async (
    now = new Date().toISOString(),
    { limit = 200, budgetMs = 20_000 }: BatchOptions = {}
): Promise<ConsentFlowExpirySummary> => {
    const deadline = Date.now() + budgetMs;
    const batchSize = batchSizeOf(limit);
    const nowMs = Date.parse(now);
    let expired = 0;

    await ensureContractEventMaintenance();

    const state = await neogma.queryRunner.run(
        `MERGE (state:ConsentFlowJobState {id: $id})
         ON CREATE SET state.through = $now
         RETURN state.through AS through`,
        { id: EXPIRY_SCAN_STATE_ID, now }
    );
    const stored: unknown = state.records[0]?.get('through');
    const throughMs = typeof stored === 'string' ? Date.parse(stored) : Number.NaN;
    const range = {
        from: new Date(
            (Number.isNaN(throughMs) ? nowMs : Math.min(throughMs, nowMs)) - EXPIRY_SCAN_OVERLAP_MS
        ).toISOString(),
        now,
    };
    // The exact comparison happens here: unparseable values are skipped, never passed to datetime().
    const hasExpired = ({ expiresAt }: ExpiryCandidate): boolean => Date.parse(expiresAt) <= nowMs;

    let after: ExpiryCandidate | undefined;

    for (;;) {
        if (Date.now() >= deadline) return { expired };

        const candidates = await readExpiryCandidates('ConsentFlowTerms', range, after, batchSize);
        const due = candidates.filter(hasExpired);

        if (due.length > 0) {
            const result = await neogma.queryRunner.run(
                `MATCH (terms:ConsentFlowTerms)
                 WHERE terms.expiresAt IN $expiries AND terms.id IN $ids
                     AND terms.expiredEventAt IS NULL AND terms.status IN $statuses
                 MATCH (terms)-[:CONSENTS_TO]->(contract:ConsentFlowContract)
                 WITH terms, head(collect(contract)) AS contract
                 ${MARK_EXPIRED_CYPHER}`,
                {
                    expiries: [...new Set(due.map(candidate => candidate.expiresAt))],
                    ids: due.map(candidate => candidate.id),
                    statuses: ACTIVE_STATUSES,
                    now,
                }
            );

            expired += toNumber(result.records[0]?.get('expired'));
        }

        if (candidates.length < batchSize) break;
        after = candidates[candidates.length - 1];
    }

    after = undefined;

    for (;;) {
        if (Date.now() >= deadline) return { expired };

        const contracts = await readExpiryCandidates(
            'ConsentFlowContract',
            range,
            after,
            batchSize
        );

        for (const contract of contracts.filter(hasExpired)) {
            for (;;) {
                if (Date.now() >= deadline) return { expired };

                const result = await neogma.queryRunner.run(
                    `MATCH (contract:ConsentFlowContract)
                     WHERE contract.expiresAt = $expiresAt AND contract.id = $id
                     MATCH (terms:ConsentFlowTerms)-[:CONSENTS_TO]->(contract)
                     WHERE terms.expiredEventAt IS NULL AND terms.status IN $statuses
                     WITH contract, terms ORDER BY terms.id LIMIT $limit
                     ${MARK_EXPIRED_CYPHER}`,
                    { ...contract, statuses: ACTIVE_STATUSES, now, limit: int(batchSize) }
                );
                const count = toNumber(result.records[0]?.get('expired'));

                expired += count;

                if (count < batchSize) break;
            }
        }

        if (contracts.length < batchSize) break;
        after = contracts[contracts.length - 1];
    }

    // Both ranges were read to the end, so the next pass can start from here.
    await neogma.queryRunner.run(
        `MATCH (state:ConsentFlowJobState {id: $id})
         WHERE state.through IS NULL OR state.through < $now
         SET state.through = $now`,
        { id: EXPIRY_SCAN_STATE_ID, now }
    );

    return { expired };
};

/**
 * One pass of the consentFlowDeadline job: suspend overdue re-consents, then record expiry
 * events. A failing expiry scan is retried by the next pass and never hides the suspensions.
 */
export const runConsentFlowDeadlinePass = async ({
    limit = 200,
    budgetMs = 20_000,
}: BatchOptions = {}): Promise<ConsentFlowDeadlineSummary> => {
    const startedAt = Date.now();
    const { suspended } = await suspendExpiredConsentFlowTerms(undefined, { limit, budgetMs });
    let expired = 0;

    try {
        ({ expired } = await emitExpiredConsentEvents(undefined, {
            limit,
            budgetMs: Math.max(0, budgetMs - (Date.now() - startedAt)),
        }));
    } catch {
        // Never log identifiers.
        console.warn('integration_events: expiry_scan_failed');
    }

    return { suspended, expired };
};
