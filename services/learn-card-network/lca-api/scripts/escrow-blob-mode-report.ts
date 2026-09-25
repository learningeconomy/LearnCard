#!/usr/bin/env bun
/**
 * P6.2 — Escrow blob mode report.
 *
 * Read-only report over the `userkeys` and `escrowholds` collections:
 *   - escrow blob counts grouped by `escrowBlob.enclaveMode` and `escrowBlob.enclaveKeyId`
 *   - count of users with an enabled `escrowPin` (present, not disabled, matching the
 *     current `shareVersion` — same definition as `getEscrowPinStatus` in
 *     `src/models/UserKey.ts`)
 *   - pending `EscrowHold` counts grouped by `releasePolicy`
 *   - count of users who have opted out of escrow (`escrowOptedOutAt` set)
 *   - a "re-seal" breakdown: how many escrow blobs are sealed for the currently
 *     configured active enclave mode vs. a different ("stale") one
 *
 * This script NEVER writes to the database and NEVER prints PII — no DIDs,
 * emails, contact methods, or Mongo `_id`s, only counts.
 *
 * Usage:
 *   bun scripts/escrow-blob-mode-report.ts [--json] [--publish-metrics]
 *
 * Flags:
 *   --json              Print a single JSON object instead of a human-readable table.
 *   --publish-metrics   Print the CloudWatch `PutMetricData` payload (namespace
 *                        `LearnCard/Escrow`, metrics `EscrowBlobs` dimensioned by
 *                        `EnclaveMode` and `EscrowBlobsStale`) that a caller with AWS
 *                        SDK access should forward to CloudWatch.
 *
 *                        lca-api does not depend on `@aws-sdk/client-cloudwatch`
 *                        (only `services/learn-card-network/ai-agent` does in this
 *                        monorepo), so this script does not publish metrics itself —
 *                        see "CloudWatch metric emission" below.
 *
 * Environment:
 *   Same as the lca-api server: `SEED`, `MONGO_URI`, `MONGO_DB_NAME` (see
 *   `.env.example`). `SEED` is required by environment parsing even though this
 *   script never uses it. Point `MONGO_URI` at the environment you want to report
 *   on (e.g. a staging replica) before running.
 *
 * CloudWatch metric emission:
 *   `--publish-metrics` never imports or requires an AWS SDK. It only prints the
 *   exact `MetricData` payload. Forward it with the P7.1 monitor Lambda (which
 *   already carries AWS SDK access) or any ops job that does, e.g.:
 *
 *     bun scripts/escrow-blob-mode-report.ts --json --publish-metrics \
 *       | jq .metricsPayload \
 *       | <your-cloudwatch-forwarder>
 *
 * Known limitations:
 *   - "Stale" here means `escrowBlob.enclaveMode` does not match the currently
 *     configured active mode (`ESCROW_ENCLAVE_MODE=remote` → `nitro`, otherwise
 *     `software`) — the same comparison `assertFreshEscrowBlob` makes in
 *     `src/routes/escrow.ts`. It does NOT detect `enclaveKeyId` (measurement)
 *     rotation staleness, because that requires a live call to the enclave's
 *     attestation endpoint (`getEscrowBlobStaleReason` in
 *     `src/services/escrow-enclave/index.ts`), which this offline counts report
 *     deliberately avoids depending on.
 *   - `UserKey` has no tenant field, so a per-tenant breakdown of escrow blobs is
 *     not possible and is intentionally not reported (see `byEnclaveMode` /
 *     `byEnclaveKeyId` instead). `EscrowHold` does carry an optional `tenantId`,
 *     but it was added after most holds existed and is not present on every
 *     document, so it isn't reported here either — a "tenant breakdown" would
 *     misleadingly undercount if only holds happened to be tenant-tagged.
 */

import type { Collection } from 'mongodb';

import { getUserKeysCollection, type MongoUserKeyType } from '../src/models/UserKey';
import { getEscrowHoldsCollection, type EscrowHold } from '../src/models/EscrowHold';
import { environment } from '../src/config/environment';
import { client as mongoClient } from '../src/mongo';

export type ActiveEnclaveMode = 'software' | 'nitro';

const KNOWN_ENCLAVE_MODES: readonly ActiveEnclaveMode[] = ['software', 'nitro'];
const KNOWN_RELEASE_POLICIES: readonly EscrowHold['releasePolicy'][] = ['hold', 'pin'];

/** Mirrors `activeEscrowClientMode()` in `src/services/escrow-enclave/index.ts`,
 * re-derived directly from the env var so this script has no import-time
 * dependency on that module (which is mid-edit as part of this same plan). */
export const activeModeFromEnv = (mode: string | undefined): ActiveEnclaveMode =>
    mode === 'remote' ? 'nitro' : 'software';

export interface RawEscrowCounts {
    totalUserKeys: number;
    enclaveModeCounts: { mode: string; count: number }[];
    enclaveKeyIdCounts: { keyId: string; count: number }[];
    escrowPinEnabledCount: number;
    optedOutCount: number;
    pendingHoldsByPolicy: { policy: string; count: number }[];
}

export interface EscrowBlobModeReport {
    generatedAt: string;
    activeEnclaveMode: ActiveEnclaveMode;
    totals: {
        userKeys: number;
        escrowBlobs: number;
        escrowPinEnabled: number;
        optedOut: number;
        pendingHolds: number;
    };
    byEnclaveMode: Record<string, number>;
    byEnclaveKeyId: Record<string, number>;
    pendingHoldsByReleasePolicy: Record<string, number>;
    reseal: {
        activeCount: number;
        staleCount: number;
        /** Rounded to 2 decimal places; 0 when there are no escrow blobs at all. */
        staleRatePercent: number;
    };
}

/**
 * Pure formatting/aggregation-shaping logic — no Mongo access. Takes the raw
 * per-bucket counts from `queryEscrowCounts` and produces the final report,
 * filling in zero counts for known enclave modes / release policies that had
 * no matching documents, while still surfacing any unexpected ("unknown")
 * values verbatim rather than silently dropping them.
 */
export const buildReport = (
    raw: RawEscrowCounts,
    activeEnclaveMode: ActiveEnclaveMode,
    now: Date = new Date()
): EscrowBlobModeReport => {
    const byEnclaveMode: Record<string, number> = Object.fromEntries(
        KNOWN_ENCLAVE_MODES.map(mode => [mode, 0])
    );
    for (const { mode, count } of raw.enclaveModeCounts) {
        byEnclaveMode[mode] = (byEnclaveMode[mode] ?? 0) + count;
    }

    const byEnclaveKeyId: Record<string, number> = {};
    for (const { keyId, count } of raw.enclaveKeyIdCounts) {
        byEnclaveKeyId[keyId] = (byEnclaveKeyId[keyId] ?? 0) + count;
    }

    const pendingHoldsByReleasePolicy: Record<string, number> = Object.fromEntries(
        KNOWN_RELEASE_POLICIES.map(policy => [policy, 0])
    );
    for (const { policy, count } of raw.pendingHoldsByPolicy) {
        pendingHoldsByReleasePolicy[policy] = (pendingHoldsByReleasePolicy[policy] ?? 0) + count;
    }

    const escrowBlobs = Object.values(byEnclaveMode).reduce((sum, count) => sum + count, 0);
    const activeCount = byEnclaveMode[activeEnclaveMode] ?? 0;
    const staleCount = escrowBlobs - activeCount;
    const staleRatePercent =
        escrowBlobs === 0 ? 0 : Math.round((staleCount / escrowBlobs) * 10_000) / 100;
    const pendingHolds = Object.values(pendingHoldsByReleasePolicy).reduce(
        (sum, count) => sum + count,
        0
    );

    return {
        generatedAt: now.toISOString(),
        activeEnclaveMode,
        totals: {
            userKeys: raw.totalUserKeys,
            escrowBlobs,
            escrowPinEnabled: raw.escrowPinEnabledCount,
            optedOut: raw.optedOutCount,
            pendingHolds,
        },
        byEnclaveMode,
        byEnclaveKeyId,
        pendingHoldsByReleasePolicy,
        reseal: { activeCount, staleCount, staleRatePercent },
    };
};

export interface CloudWatchMetricDatum {
    MetricName: 'EscrowBlobs' | 'EscrowBlobsStale';
    Value: number;
    Unit: 'Count';
    /** ISO-8601. The forwarder should parse this into whatever `Date`/timestamp
     * shape its AWS SDK client expects — kept as a string here so this module
     * has zero AWS SDK type dependency. */
    Timestamp: string;
    Dimensions?: { Name: 'EnclaveMode'; Value: string }[];
}

export interface CloudWatchMetricPayload {
    Namespace: string;
    MetricData: CloudWatchMetricDatum[];
}

export const CLOUDWATCH_NAMESPACE = 'LearnCard/Escrow';

/** Pure: shapes a report into a CloudWatch `PutMetricData` payload. Never
 * imports an AWS SDK — see the script header's "CloudWatch metric emission". */
export const buildCloudWatchMetricPayload = (
    report: EscrowBlobModeReport
): CloudWatchMetricPayload => {
    const timestamp = report.generatedAt;
    const MetricData: CloudWatchMetricDatum[] = Object.entries(report.byEnclaveMode).map(
        ([mode, count]) => ({
            MetricName: 'EscrowBlobs',
            Value: count,
            Unit: 'Count',
            Timestamp: timestamp,
            Dimensions: [{ Name: 'EnclaveMode', Value: mode }],
        })
    );
    MetricData.push({
        MetricName: 'EscrowBlobsStale',
        Value: report.reseal.staleCount,
        Unit: 'Count',
        Timestamp: timestamp,
    });
    return { Namespace: CLOUDWATCH_NAMESPACE, MetricData };
};

const pad = (value: string, width: number): string => value.padEnd(width, ' ');

export const formatReportTable = (report: EscrowBlobModeReport): string => {
    const lines: string[] = [];
    lines.push(`Escrow blob mode report — generated ${report.generatedAt}`);
    lines.push(`Active enclave mode: ${report.activeEnclaveMode}`);
    lines.push('');
    lines.push('Totals:');
    lines.push(`  UserKey documents:      ${report.totals.userKeys}`);
    lines.push(`  Users with escrow blob: ${report.totals.escrowBlobs}`);
    lines.push(`  Escrow PIN enabled:     ${report.totals.escrowPinEnabled}`);
    lines.push(`  Opted out of escrow:    ${report.totals.optedOut}`);
    lines.push(`  Pending holds:          ${report.totals.pendingHolds}`);
    lines.push('');
    lines.push('Escrow blobs by enclaveMode:');
    for (const [mode, count] of Object.entries(report.byEnclaveMode)) {
        lines.push(`  ${pad(mode, 14)} ${count}`);
    }
    lines.push('');
    lines.push('Escrow blobs by enclaveKeyId:');
    const keyIdEntries = Object.entries(report.byEnclaveKeyId);
    if (keyIdEntries.length === 0) lines.push('  (none)');
    for (const [keyId, count] of keyIdEntries) {
        lines.push(`  ${pad(keyId, 28)} ${count}`);
    }
    lines.push('');
    lines.push('Pending holds by releasePolicy:');
    for (const [policy, count] of Object.entries(report.pendingHoldsByReleasePolicy)) {
        lines.push(`  ${pad(policy, 14)} ${count}`);
    }
    lines.push('');
    lines.push(
        `Re-seal status: ${report.reseal.activeCount} on active mode (${report.activeEnclaveMode}), ` +
            `${report.reseal.staleCount} stale (${report.reseal.staleRatePercent}%). ` +
            `"Stale" = escrowBlob.enclaveMode !== active mode only; does not detect ` +
            `enclaveKeyId rotation — see script header "Known limitations".`
    );
    lines.push('');
    lines.push('Tenant breakdown: unavailable — UserKey has no tenant field.');
    return lines.join('\n');
};

interface UserKeyFacetResult {
    totalUserKeys: { count: number }[];
    enclaveModeCounts: { _id: string | null; count: number }[];
    enclaveKeyIdCounts: { _id: string | null; count: number }[];
    escrowPinEnabled: { count: number }[];
    optedOut: { count: number }[];
}

/**
 * Impure: runs the counting queries. Never writes. Blob-related counts come
 * from a single `$facet` aggregation over the UserKey collection; pending
 * hold counts are a separate aggregation over the (distinct) EscrowHold
 * collection.
 */
export const queryEscrowCounts = async (
    userKeys: Collection<MongoUserKeyType>,
    escrowHolds: Collection<EscrowHold>
): Promise<RawEscrowCounts> => {
    const [facetResult] = await userKeys
        .aggregate<UserKeyFacetResult>([
            {
                $facet: {
                    totalUserKeys: [{ $count: 'count' }],
                    enclaveModeCounts: [
                        { $match: { escrowBlob: { $exists: true } } },
                        { $group: { _id: '$escrowBlob.enclaveMode', count: { $sum: 1 } } },
                    ],
                    enclaveKeyIdCounts: [
                        { $match: { escrowBlob: { $exists: true } } },
                        { $group: { _id: '$escrowBlob.enclaveKeyId', count: { $sum: 1 } } },
                    ],
                    // Same definition as getEscrowPinStatus() in src/models/UserKey.ts:
                    // present, not disabled, and sealed for the current shareVersion.
                    escrowPinEnabled: [
                        {
                            $match: {
                                escrowPin: { $exists: true },
                                'escrowPin.disabledAt': { $exists: false },
                                $expr: { $eq: ['$escrowPin.shareVersion', '$shareVersion'] },
                            },
                        },
                        { $count: 'count' },
                    ],
                    optedOut: [
                        { $match: { escrowOptedOutAt: { $exists: true } } },
                        { $count: 'count' },
                    ],
                },
            },
        ])
        .toArray();

    // Legacy rows predate the releasePolicy field and are treated as 'hold'
    // everywhere else in the codebase (see EscrowHold.ts's own $or filters).
    const pendingHoldsAgg = await escrowHolds
        .aggregate<{ _id: string; count: number }>([
            { $match: { status: 'pending' } },
            { $group: { _id: { $ifNull: ['$releasePolicy', 'hold'] }, count: { $sum: 1 } } },
        ])
        .toArray();

    return {
        totalUserKeys: facetResult?.totalUserKeys[0]?.count ?? 0,
        enclaveModeCounts: (facetResult?.enclaveModeCounts ?? []).map(({ _id, count }) => ({
            mode: _id ?? 'unknown',
            count,
        })),
        enclaveKeyIdCounts: (facetResult?.enclaveKeyIdCounts ?? []).map(({ _id, count }) => ({
            keyId: _id ?? 'unknown',
            count,
        })),
        escrowPinEnabledCount: facetResult?.escrowPinEnabled[0]?.count ?? 0,
        optedOutCount: facetResult?.optedOut[0]?.count ?? 0,
        pendingHoldsByPolicy: pendingHoldsAgg.map(({ _id, count }) => ({ policy: _id, count })),
    };
};

const main = async (): Promise<void> => {
    const args = new Set(process.argv.slice(2));
    const jsonOutput = args.has('--json');
    const publishMetrics = args.has('--publish-metrics');

    try {
        const raw = await queryEscrowCounts(getUserKeysCollection(), getEscrowHoldsCollection());
        const activeEnclaveMode = activeModeFromEnv(environment.ESCROW_ENCLAVE_MODE);
        const report = buildReport(raw, activeEnclaveMode);
        const metricsPayload = publishMetrics ? buildCloudWatchMetricPayload(report) : undefined;

        if (jsonOutput) {
            console.log(JSON.stringify({ report, metricsPayload }, null, 2));
        } else {
            console.log(formatReportTable(report));
        }

        if (publishMetrics && !jsonOutput) {
            console.log('');
            console.log(
                'lca-api has no @aws-sdk/client-cloudwatch dependency (only ' +
                    'services/learn-card-network/ai-agent does in this monorepo). ' +
                    'Forward this payload to CloudWatch PutMetricData from the P7.1 ' +
                    'monitor Lambda or an ops job that already has AWS SDK access:'
            );
            console.log(JSON.stringify(metricsPayload, null, 2));
        }
    } finally {
        await mongoClient.close();
    }
};

if (import.meta.main) {
    main().catch(err => {
        console.error('escrow-blob-mode-report failed:', err);
        process.exit(1);
    });
}
