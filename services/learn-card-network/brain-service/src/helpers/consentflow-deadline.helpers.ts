import { int } from 'neo4j-driver';

import { neogma } from '@instance';
import { ensureContractEventMaintenance } from './contract-event-maintenance.helpers';
import { ACCEPTED_VERSION_PREDICATE, isConsentUnexpired } from './consent-expiry.helpers';
import {
    computeNextShareUntilFromProperties,
    shareUntilEntriesOfProperties,
} from './consent-share-until.helpers';

export type ConsentFlowSuspensionSummary = { suspended: number };
export type ConsentFlowExpirySummary = { expired: number };
export type ConsentFlowShareUntilSummary = { shareUntilPassed: number };
export type ConsentFlowDeadlineSummary = ConsentFlowSuspensionSummary &
    ConsentFlowExpirySummary &
    ConsentFlowShareUntilSummary;

type BatchOptions = {
    /** Terms handled per statement. */
    limit?: number;
    /** Stop starting new batches after this long. */
    budgetMs?: number;
};

const ACTIVE_STATUSES = ['live', 'needs_reconsent', 'suspended'];

/**
 * How far behind the watermark each expiry scan starts. `expiresAt` of terms is a free-form ISO
 * string, so a value written with a UTC offset does not sort at its real instant. A value with a
 * negative offset sorts before its real instant (up to 12 hours): the overlap re-reads that much
 * of the index range, so it is still caught once it really expires. A value with a positive
 * offset sorts after its real instant (up to about 14 hours): it is found late, once the scan
 * range reaches its sort position, rather than missed. Version `expiresAt` is validated as UTC,
 * so this concerns terms `expiresAt`.
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
    label: 'ConsentFlowTerms' | 'ConsentFlowContractVersion',
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
                     ? `AND ${notYetEmittedFor('node', 'node.expiresAt')} AND node.status IN $statuses`
                     : 'AND (node.expiryEventsEmittedFor IS NULL OR node.expiryEventsEmittedFor <> node.expiresAt)'
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

/** Terms ids read by one walk of a contract when a version of it expired. */
const EXPIRY_WALK_WINDOW = 5_000;

/**
 * Cypher predicate: true while the terms node has not emitted `consent_expired` for the given
 * expiry instant. `terms.expiredEventFor` lists every expiry instant already emitted.
 */
const notYetEmittedFor = (termsAlias: string, expiresAtExpression: string): string =>
    `NOT ${expiresAtExpression} IN coalesce(${termsAlias}.expiredEventFor, [])`;

/**
 * Shared tail of both expiry statements. Expects `terms`, `contract` and `expiredAt` (the
 * expiry instant that passed, exactly as stored). Remembers the instant on the terms and
 * records one event for it: the event id contains the instant, so the same expiry can never
 * produce a second event, while a later, different expiry of the same terms produces a new one.
 */
const MARK_EXPIRED_CYPHER = `
    SET terms.expiredEventFor = coalesce(terms.expiredEventFor, []) + expiredAt
    MERGE (event:ConsentFlowEvent {id: terms.id + ':expired:' + expiredAt})
    ON CREATE SET event += {
        kind: 'consent_expired', contractId: contract.id, termsId: terms.id,
        requestId: terms.\`referral.requestId\`,
        requestedBy: terms.\`referral.requestedBy\`,
        externalReferenceId: terms.\`referral.externalReferenceId\`,
        integrationFanoutPending: true, createdAt: $now
    }
    RETURN count(terms) AS expired`;

/**
 * Records one integration-only `consent_expired` event for every active terms whose expiry
 * has passed. The terms status is not changed.
 *
 * An event belongs to one expiry instant: its id is `${termsId}:expired:${expiresAt}` and the
 * instant is added to `terms.expiredEventFor`. The same expiry therefore emits exactly once,
 * and a later, different expiry emits again: terms that expired with version 1, were renewed
 * by accepting version 2, and expire again with version 2 get a second event. When the terms'
 * own expiry and the accepted version's expiry are different instants and both pass, each
 * emits one event; a receiver treats `consent_expired` for an already expired consent as a
 * repeat.
 *
 * Expiry follows the rule of the consented-data reads (see consent-expiry.helpers): the
 * terms' own `expiresAt`, or the `expiresAt` of the contract version the consenter accepted.
 * The contract node's `expiresAt` is not used, so terms awaiting re-consent after a contract
 * update expire with the version they accepted, not with the newest one.
 *
 * Work is found through the `expiresAt` indexes (terms and contract versions) over a bounded
 * range: from a stored watermark (minus a fixed overlap) up to now. Because that overlap
 * re-reads the same versions on every pass, a version whose terms were all walked records
 * `expiryEventsEmittedFor = expiresAt` and is skipped while its expiry is unchanged. The watermark only
 * advances when the range was read to the end, so an interrupted pass is repeated. The first
 * pass starts at now, not at the beginning of history. Category-level `shareUntil` is handled by
 * `emitShareUntilPassedEvents`.
 */
export const emitExpiredConsentEvents = async (
    now = new Date().toISOString(),
    {
        limit = 200,
        budgetMs = 20_000,
        walkWindow = EXPIRY_WALK_WINDOW,
    }: BatchOptions & {
        /** Terms ids read by one walk of a contract. Only tests pass a smaller value. */
        walkWindow?: number;
    } = {}
): Promise<ConsentFlowExpirySummary> => {
    const deadline = Date.now() + budgetMs;
    const batchSize = batchSizeOf(limit);
    const windowSize = Math.max(1, Math.trunc(walkWindow));
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
                     AND ${notYetEmittedFor('terms', 'terms.expiresAt')}
                     AND terms.status IN $statuses
                 MATCH (terms)-[:CONSENTS_TO]->(contract:ConsentFlowContract)
                 WITH terms, head(collect(contract)) AS contract, terms.expiresAt AS expiredAt
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

        const versions = await readExpiryCandidates(
            'ConsentFlowContractVersion',
            range,
            after,
            batchSize
        );

        for (const version of versions.filter(hasExpired)) {
            for (;;) {
                // Leaving here, the version is not marked, so the next pass walks it again.
                if (Date.now() >= deadline) return { expired };

                // One walk of the contract's terms finds a window of ids; they are then marked by
                // id. Walking the contract once per small batch instead would cost a full walk
                // for every batch. Only the terms that accepted exactly this version expire with it.
                const found = await neogma.queryRunner.run(
                    `MATCH (accepted:ConsentFlowContractVersion)
                     WHERE accepted.expiresAt = $expiresAt AND accepted.id = $id
                     MATCH (contract:ConsentFlowContract)-[:HAS_VERSION]->(accepted)
                     MATCH (terms:ConsentFlowTerms)-[:CONSENTS_TO]->(contract)
                     WHERE ${notYetEmittedFor('terms', 'accepted.expiresAt')}
                         AND terms.status IN $statuses
                         AND ${ACCEPTED_VERSION_PREDICATE}
                     RETURN terms.id AS termsId
                     ORDER BY termsId LIMIT $window`,
                    { ...version, statuses: ACTIVE_STATUSES, window: int(windowSize) }
                );
                const termsIds = found.records.flatMap(row => {
                    const termsId: unknown = row.get('termsId');

                    return typeof termsId === 'string' ? [termsId] : [];
                });

                for (let index = 0; index < termsIds.length; index += batchSize) {
                    if (Date.now() >= deadline) return { expired };

                    // The conditions are checked again: a terms may have changed since the read.
                    const result = await neogma.queryRunner.run(
                        `MATCH (accepted:ConsentFlowContractVersion)
                         WHERE accepted.expiresAt = $expiresAt AND accepted.id = $id
                         MATCH (contract:ConsentFlowContract)-[:HAS_VERSION]->(accepted)
                         MATCH (terms:ConsentFlowTerms)
                         USING INDEX terms:ConsentFlowTerms(id)
                         WHERE terms.id IN $termsIds
                             AND ${notYetEmittedFor('terms', 'accepted.expiresAt')}
                             AND terms.status IN $statuses
                             AND ${ACCEPTED_VERSION_PREDICATE}
                             AND (terms)-[:CONSENTS_TO]->(contract)
                         WITH contract, terms, accepted.expiresAt AS expiredAt
                         ${MARK_EXPIRED_CYPHER}`,
                        {
                            ...version,
                            termsIds: termsIds.slice(index, index + batchSize),
                            statuses: ACTIVE_STATUSES,
                            now,
                        }
                    );

                    expired += toNumber(result.records[0]?.get('expired'));
                }

                if (termsIds.length < windowSize) break;
            }

            // The terms walk reached its end, so this expiry instant is fully handled. A later
            // change of the version's expiresAt no longer matches the marker and is scanned again.
            await neogma.queryRunner.run(
                `MATCH (version:ConsentFlowContractVersion {id: $id})
                 WHERE version.expiresAt = $expiresAt
                 SET version.expiryEventsEmittedFor = $expiresAt`,
                version
            );
        }

        if (versions.length < batchSize) break;
        after = versions[versions.length - 1];
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

const SHARE_UNTIL_BACKFILL_STATE_ID = 'share-until-backfill-v1';

/** Passes in a row in which no terms could be updated before the share-until scan gives up. */
const SHARE_UNTIL_MAX_STALLED_READS = 3;

type ShareUntilWrite = {
    termsId: string;
    expectedNext: string;
    mutationVersion: ReturnType<typeof int>;
    next: string | null;
    contractId: string | null;
    emits: { id: string; category: string }[];
};

/**
 * Records one integration-only `consent_updated` event (reason `share_until_passed`) for each
 * category whose `shareUntil` date has passed. The consent stays live: only that category's
 * shared data stops being returned by the data reads.
 *
 * Work is found through the index on `terms.nextShareUntil`, the earliest date in the future
 * among a consent's shared categories (kept up to date by every terms write, see
 * consent-share-until.helpers). Terms with `nextShareUntil <= now` are read in bounded batches
 * and the comparison is repeated exactly in JS. Each terms is handled in one statement that
 * creates the events and moves `nextShareUntil` to the next future date (or removes it), so a
 * crash cannot repeat a date forever. The statement only applies while the terms still have the
 * `nextShareUntil` and the `mutationVersion` that were read. A terms edit keeps a due
 * `nextShareUntil` unchanged, so the value alone would not show that the categories changed in
 * between; the version does. Terms that changed are read again and handled from the fresh read,
 * so a date added by that edit is never overwritten. The event id
 * `${termsId}:share_until:${category}:${shareUntilIso}` is merged, so a retry creates nothing.
 *
 * Only categories dated at or after the stored `nextShareUntil` are reported: that value was the
 * earliest future date when the terms were written, so anything earlier had already passed
 * before and is never reported. Only live, needs_reconsent and suspended terms whose consent has
 * not expired emit. An expired consent emits nothing but keeps tracking its later dates;
 * withdrawn terms lose `nextShareUntil`. Failures are left to the caller.
 */
export const emitShareUntilPassedEvents = async (
    now = new Date().toISOString(),
    { limit = 200, budgetMs = 20_000 }: BatchOptions = {}
): Promise<ConsentFlowShareUntilSummary> => {
    const deadline = Date.now() + budgetMs;
    const batchSize = batchSizeOf(limit);
    const nowMs = Date.parse(now);
    let shareUntilPassed = 0;
    let stalledReads = 0;

    await ensureContractEventMaintenance();

    do {
        const found = await neogma.queryRunner.run(
            `MATCH (terms:ConsentFlowTerms)
             USING INDEX terms:ConsentFlowTerms(nextShareUntil)
             WHERE terms.nextShareUntil <= $now
             WITH terms ORDER BY terms.nextShareUntil, terms.id LIMIT $limit
             OPTIONAL MATCH (terms)-[:CONSENTS_TO]->(contract:ConsentFlowContract)
             OPTIONAL MATCH (contract)-[:HAS_VERSION]->(accepted:ConsentFlowContractVersion)
                 WHERE ${ACCEPTED_VERSION_PREDICATE}
             RETURN properties(terms) AS props, contract.id AS contractId,
                 accepted IS NOT NULL AS hasAcceptedVersion,
                 accepted.expiresAt AS acceptedExpiresAt`,
            { now, limit: int(batchSize) }
        );
        const writes: ShareUntilWrite[] = [];

        for (const row of found.records) {
            const props: Record<string, unknown> = row.get('props');
            const expectedNext = props.nextShareUntil;
            const termsId = props.id;

            if (typeof expectedNext !== 'string' || typeof termsId !== 'string') continue;

            const contractId: unknown = row.get('contractId');
            const active =
                typeof props.status === 'string' && ACTIVE_STATUSES.includes(props.status);
            const unexpired = isConsentUnexpired(
                {
                    termsExpiresAt: props.expiresAt,
                    hasAcceptedVersion: row.get('hasAcceptedVersion') === true,
                    acceptedVersionExpiresAt: row.get('acceptedExpiresAt'),
                },
                nowMs
            );
            const expectedMs = Date.parse(expectedNext);
            const emits =
                active && unexpired && typeof contractId === 'string'
                    ? shareUntilEntriesOfProperties(props)
                          .filter(entry => entry.at <= nowMs && entry.at >= expectedMs)
                          .map(entry => ({
                              id: `${termsId}:share_until:${entry.category}:${entry.shareUntil}`,
                              category: entry.category,
                          }))
                    : [];

            writes.push({
                termsId,
                expectedNext,
                mutationVersion: int(toNumber(props.mutationVersion)),
                // An expired consent keeps its later dates: a contract update can make it live
                // again (expiry_extended) without a terms write to recompute them.
                next: active ? computeNextShareUntilFromProperties(props, nowMs) : null,
                contractId: typeof contractId === 'string' ? contractId : null,
                emits,
            });
        }

        if (writes.length === 0) break;

        const result = await neogma.queryRunner.run(
            `UNWIND $writes AS write
             MATCH (terms:ConsentFlowTerms {id: write.termsId})
             WHERE terms.nextShareUntil = write.expectedNext
                 AND coalesce(terms.mutationVersion, 0) = write.mutationVersion
             SET terms.nextShareUntil = write.next
             FOREACH (emit IN write.emits |
                 MERGE (event:ConsentFlowEvent {id: emit.id})
                 ON CREATE SET event += {
                     kind: 'consent_updated', reason: 'share_until_passed',
                     contractId: write.contractId, termsId: terms.id,
                     requestId: terms.\`referral.requestId\`,
                     requestedBy: terms.\`referral.requestedBy\`,
                     externalReferenceId: terms.\`referral.externalReferenceId\`,
                     integrationFanoutPending: true, createdAt: $now
                 })
             RETURN count(terms) AS handled`,
            { writes, now }
        );

        shareUntilPassed += result.summary.counters.updates().nodesCreated;

        const handled = toNumber(result.records[0]?.get('handled'));

        // Terms that could not be updated were changed by a concurrent write: they are still due,
        // so the next read returns them again with their new content. A few reads without any
        // progress end the pass; the next pass continues.
        stalledReads = handled === 0 ? stalledReads + 1 : 0;

        if (stalledReads >= SHARE_UNTIL_MAX_STALLED_READS) break;
        if (handled === found.records.length && found.records.length < batchSize) break;
    } while (Date.now() < deadline);

    return { shareUntilPassed };
};

/**
 * One-off backfill of `nextShareUntil` for consents written before the field existed. A
 * `ConsentFlowJobState` cursor walks the terms in id order, a bounded batch at a time; once the
 * end is reached the state records `completedAt` and later calls read only that node.
 *
 * The first call stores its time as `startedAt`, and every later call computes against that same
 * cutoff: a terms gets the earliest date after the cutoff. Dates before the cutoff had passed
 * before the feature ran, so they yield no value and no event. A date that passes while the
 * backfill is still walking is after the cutoff, so it is written even though it is already due;
 * the share-until scan then finds it and reports it like any other passed date.
 *
 * A value is only written for terms that have none yet, and only while the terms still have the
 * `mutationVersion` that was read, so a concurrent terms write (which sets the field itself) is
 * never overwritten. Safe to repeat and to run concurrently.
 */
export const backfillNextShareUntil = async (
    now = new Date().toISOString(),
    { limit = 200, budgetMs = 20_000 }: BatchOptions = {}
): Promise<{ backfilled: number; done: boolean }> => {
    const deadline = Date.now() + budgetMs;
    const batchSize = batchSizeOf(limit);
    let backfilled = 0;

    await ensureContractEventMaintenance();

    const state = await neogma.queryRunner.run(
        `MERGE (state:ConsentFlowJobState {id: $id})
         SET state.startedAt = coalesce(state.startedAt, $now)
         RETURN state.completedAt AS completedAt, state.cursor AS cursor,
             state.startedAt AS startedAt`,
        { id: SHARE_UNTIL_BACKFILL_STATE_ID, now }
    );

    if (state.records[0]?.get('completedAt')) return { backfilled, done: true };

    const startedAt: unknown = state.records[0]?.get('startedAt');
    const startedMs = typeof startedAt === 'string' ? Date.parse(startedAt) : Number.NaN;
    // The same cutoff for every pass of the walk, not the time of this pass.
    const cutoffMs = Number.isNaN(startedMs) ? Date.parse(now) : startedMs;

    const storedCursor: unknown = state.records[0]?.get('cursor');
    let cursor = typeof storedCursor === 'string' ? storedCursor : '';

    do {
        const page = await neogma.queryRunner.run(
            `MATCH (terms:ConsentFlowTerms)
             WHERE terms.id > $cursor
             WITH terms ORDER BY terms.id LIMIT $limit
             RETURN properties(terms) AS props`,
            { cursor, limit: int(batchSize) }
        );
        const writes = page.records.flatMap(row => {
            const props: Record<string, unknown> = row.get('props');
            const active =
                typeof props.status === 'string' && ACTIVE_STATUSES.includes(props.status);
            const next = active ? computeNextShareUntilFromProperties(props, cutoffMs) : null;

            if (typeof props.id !== 'string') return [];
            // A value that is already there was written by a terms write; keep it, even when due.
            if (next === null || props.nextShareUntil != null) return [];

            return [
                {
                    termsId: props.id,
                    mutationVersion: int(toNumber(props.mutationVersion)),
                    next,
                },
            ];
        });

        if (writes.length > 0) {
            const result = await neogma.queryRunner.run(
                `UNWIND $writes AS write
                 MATCH (terms:ConsentFlowTerms {id: write.termsId})
                 WHERE coalesce(terms.mutationVersion, 0) = write.mutationVersion
                 SET terms.nextShareUntil = write.next
                 RETURN count(terms) AS updated`,
                { writes }
            );

            backfilled += toNumber(result.records[0]?.get('updated'));
        }

        const last: unknown = page.records.at(-1)?.get('props')?.id;

        if (typeof last === 'string') cursor = last;

        const finished = page.records.length < batchSize;

        await neogma.queryRunner.run(
            `MATCH (state:ConsentFlowJobState {id: $id})
             SET state.cursor = $cursor
             FOREACH (_ IN CASE WHEN $finished THEN [1] ELSE [] END |
                 SET state.completedAt = coalesce(state.completedAt, $now))`,
            { id: SHARE_UNTIL_BACKFILL_STATE_ID, cursor, finished, now }
        );

        if (finished) return { backfilled, done: true };
    } while (Date.now() < deadline);

    return { backfilled, done: false };
};

/**
 * One pass of the consentFlowDeadline job: suspend overdue re-consents, record expiry events, then
 * record share-until events and advance the one-off `nextShareUntil` backfill. A failing scan is
 * retried by the next pass and never hides the earlier work.
 */
export const runConsentFlowDeadlinePass = async ({
    limit = 200,
    budgetMs = 20_000,
}: BatchOptions = {}): Promise<ConsentFlowDeadlineSummary> => {
    const startedAt = Date.now();
    const remaining = (): number => Math.max(0, budgetMs - (Date.now() - startedAt));
    const { suspended } = await suspendExpiredConsentFlowTerms(undefined, { limit, budgetMs });
    let expired = 0;
    let shareUntilPassed = 0;

    try {
        ({ expired } = await emitExpiredConsentEvents(undefined, {
            limit,
            budgetMs: remaining(),
        }));
    } catch {
        // Never log identifiers.
        console.warn('integration_events: expiry_scan_failed');
    }

    try {
        ({ shareUntilPassed } = await emitShareUntilPassedEvents(undefined, {
            limit,
            budgetMs: remaining(),
        }));
        await backfillNextShareUntil(undefined, { limit, budgetMs: remaining() });
    } catch {
        console.warn('integration_events: share_until_scan_failed');
    }

    return { suspended, expired, shareUntilPassed };
};
