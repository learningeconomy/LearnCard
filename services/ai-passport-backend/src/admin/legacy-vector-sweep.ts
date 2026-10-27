import { legacyVectorInventory } from '../constants/collections';
import { db, type ChatDB } from '../db';
import { fenceLegacySweepPoints, getQdrantClient } from '../db/qdrant';
import { assertCurrentAiConsent, runWithAiPrivacyContext } from '../ai/privacy';
import { AiConsentError } from '../learncard/consent';
import { isDataErasureRequested, withOwnerOperation } from '../services/dataErasure';

// Bounded, dry-run-first sweep of the six legacy openai1536 collections.
// Credential points are swept when their source is gone, or when the URI is
// outside the owner's current consent receipt. Chat points are swept when
// their thread is gone. Nova collections are never read or written here.
//
// Each call scans at most `pages` pages of at most 256 points and returns a
// cursor. Applying records every swept point as a permanently deleted
// reference (the existing fence ledger) inside the owner's write transaction,
// rechecking the source, thread and a fresh consent receipt there, and then
// tombstones it in Qdrant. A repeat run finds nothing new: tombstoned points
// are filtered out and a ledger write is idempotent.

export const SWEEP_PAGE_SIZE = 256;
export const SWEEP_MAX_PAGES = 8;

export type SweepCursor = { collectionIndex: number; offset?: string | number };
type Reason = 'source_missing' | 'unshared' | 'thread_missing';
type Skip =
    | 'unattributable'
    | 'owner_erased'
    | 'consent_unavailable'
    | 'current_incarnation'
    | 'ownership_conflict';

export type SweepReport = {
    apply: boolean;
    pages: number;
    scanned: number;
    kept: number;
    candidates: Record<Reason, number>;
    fenced: Record<Reason, number>;
    // Candidates that no longer qualified on the transactional recheck.
    keptOnRecheck: number;
    skipped: Record<Skip, number>;
    byCollection: Record<string, { scanned: number; candidates: number; fenced: number }>;
    done: boolean;
    cursor?: SweepCursor;
};

export type SweepConsent = (did: string) => Promise<ReadonlySet<string> | undefined>;

// Fresh receipt for one owner, or undefined when no current grant can be
// established. Without a receipt nothing is swept as unshared.
const currentSharedUris: SweepConsent = did =>
    runWithAiPrivacyContext(did, async () => {
        try {
            return new Set((await assertCurrentAiConsent('embedding')).credentialUris);
        } catch (error) {
            if (error instanceof AiConsentError) return undefined;
            throw error;
        }
    });

type Candidate = {
    id: string | number;
    key: string;
    reason: Reason;
    sourceEpoch?: string;
};

const emptyReasons = (): Record<Reason, number> => ({
    source_missing: 0,
    unshared: 0,
    thread_missing: 0,
});

export async function sweepLegacyVectors({
    apply,
    pages = 1,
    cursor,
    database = db,
    consent = currentSharedUris,
    beforeApply,
}: {
    apply: boolean;
    pages?: number;
    cursor?: SweepCursor;
    database?: ChatDB;
    consent?: SweepConsent;
    /** Test seam: runs after a page is classified and before it is applied. */
    beforeApply?: (collection: string) => Promise<void>;
}): Promise<SweepReport> {
    if (!Number.isInteger(pages) || pages < 1 || pages > SWEEP_MAX_PAGES)
        throw new Error(`Sweep page limit must be 1–${SWEEP_MAX_PAGES}`);
    const collections = legacyVectorInventory;
    let position: SweepCursor = cursor ?? { collectionIndex: 0 };
    if (
        !Number.isInteger(position.collectionIndex) ||
        position.collectionIndex < 0 ||
        position.collectionIndex > collections.length
    )
        throw new Error('Invalid sweep cursor');
    const report: SweepReport = {
        apply,
        pages: 0,
        scanned: 0,
        kept: 0,
        candidates: emptyReasons(),
        fenced: emptyReasons(),
        keptOnRecheck: 0,
        skipped: {
            unattributable: 0,
            owner_erased: 0,
            consent_unavailable: 0,
            current_incarnation: 0,
            ownership_conflict: 0,
        },
        byCollection: {},
        done: false,
    };
    const client = getQdrantClient();
    while (report.pages < pages && position.collectionIndex < collections.length) {
        const { collection, ownerField } = collections[position.collectionIndex];
        const kind = ownerField === 'did' ? 'credential' : 'thread';
        const keyField = kind === 'credential' ? 'uri' : 'threadId';
        const stats = (report.byCollection[collection] ??= {
            scanned: 0,
            candidates: 0,
            fenced: 0,
        });
        let next: string | number | undefined;
        if ((await client.collectionExists(collection)).exists) {
            const page = await client.scroll(collection, {
                filter: { must_not: [{ key: 'erased', match: { value: true } }] },
                limit: SWEEP_PAGE_SIZE,
                ...(position.offset === undefined ? {} : { offset: position.offset }),
                with_payload: [ownerField, keyField, 'sourceEpoch'],
                with_vector: false,
            });
            const byOwner = new Map<
                string,
                { id: string | number; key: string; sourceEpoch?: string }[]
            >();
            for (const point of page.points) {
                report.scanned += 1;
                stats.scanned += 1;
                const owner = point.payload?.[ownerField];
                const key = point.payload?.[keyField];
                if (
                    typeof owner !== 'string' ||
                    !owner.startsWith('did:') ||
                    typeof key !== 'string' ||
                    !key.trim()
                ) {
                    report.skipped.unattributable += 1;
                    continue;
                }
                const epoch = point.payload?.sourceEpoch;
                const list = byOwner.get(owner) ?? [];
                list.push({
                    id: point.id,
                    key,
                    ...(typeof epoch === 'string' ? { sourceEpoch: epoch } : {}),
                });
                byOwner.set(owner, list);
            }
            for (const [owner, points] of byOwner) {
                if (await isDataErasureRequested(owner)) {
                    // Whole-owner erasure fences these through its own ledger.
                    report.skipped.owner_erased += points.length;
                    continue;
                }
                const present = await database.presentLegacySweepSources(
                    owner,
                    kind,
                    points.map(point => point.key)
                );
                let shared: ReadonlySet<string> | undefined;
                if (kind === 'credential' && points.some(point => present.has(point.key)))
                    shared = await withOwnerOperation(owner, () => consent(owner));
                const candidates: Candidate[] = [];
                for (const point of points) {
                    if (!present.has(point.key)) {
                        candidates.push({
                            ...point,
                            reason: kind === 'credential' ? 'source_missing' : 'thread_missing',
                        });
                    } else if (kind === 'thread') {
                        report.kept += 1;
                    } else if (!shared) {
                        report.skipped.consent_unavailable += 1;
                    } else if (shared.has(point.key)) {
                        report.kept += 1;
                    } else if (
                        point.sourceEpoch !== undefined &&
                        point.sourceEpoch === present.get(point.key)
                    ) {
                        // A re-share reuses this incarnation's point IDs; ordinary
                        // ingestion cleanup owns these.
                        report.skipped.current_incarnation += 1;
                    } else {
                        candidates.push({ ...point, reason: 'unshared' });
                    }
                }
                for (const candidate of candidates) report.candidates[candidate.reason] += 1;
                stats.candidates += candidates.length;
                if (!apply || !candidates.length) continue;
                await beforeApply?.(collection);
                await withOwnerOperation(owner, async () => {
                    const fresh = candidates.some(candidate => candidate.reason === 'unshared')
                        ? await consent(owner)
                        : undefined;
                    let accepted: (string | number)[];
                    try {
                        accepted = await database.fenceSweptLegacyVectorPoints(
                            owner,
                            collection,
                            kind,
                            candidates,
                            fresh
                        );
                    } catch (error) {
                        // A point already registered to another owner is never swept.
                        if ((error as { code?: number }).code === 11000) {
                            report.skipped.ownership_conflict += candidates.length;
                            return;
                        }
                        throw error;
                    }
                    await fenceLegacySweepPoints(owner, collection, accepted, database);
                    const fenced = new Set(accepted);
                    for (const candidate of candidates) {
                        if (fenced.has(candidate.id)) report.fenced[candidate.reason] += 1;
                        else report.keptOnRecheck += 1;
                    }
                    stats.fenced += accepted.length;
                });
            }
            const offset = page.next_page_offset;
            if (typeof offset === 'string' || typeof offset === 'number') next = offset;
        }
        report.pages += 1;
        position =
            next === undefined
                ? { collectionIndex: position.collectionIndex + 1 }
                : { collectionIndex: position.collectionIndex, offset: next };
    }
    report.done = position.collectionIndex >= collections.length;
    if (!report.done) report.cursor = position;
    return report;
}
