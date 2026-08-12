import { randomUUID } from 'crypto';

import { captureBenchEvent, flushBenchEvents } from '@helpers/posthog.helpers';
import { summarize, type Summary } from '@helpers/percentile.helpers';

export type BenchIterationResult = {
    iteration: number;
    error?: string;
    total_ms: number;
    parallel_reads_ms: number;
    owner_and_sa_reads_ms: number;
    sa_issue_ms: number;
    sa_http_ms: number;
    sa_didauthvp_ms: number;
    log_activity_and_send_boost_ms: number;
};

export type BenchSummary = {
    iteration_count: number;
    errors: number;
    total: Summary;
    sa_issue: Summary;
    sa_http: Summary;
    parallel_reads: Summary;
    owner_and_sa_reads: Summary;
    log_activity_and_send_boost: Summary;
};

export type BenchRunResult = {
    runId: string;
    perIteration: BenchIterationResult[];
    summary: BenchSummary;
    posthogDashboardUrl?: string;
};

const phaseFromTracker = (
    captured: { total_ms: number; phases: Record<string, number> },
    name: string
): number => Math.round(captured.phases[name] ?? 0);

export const runBench = async (params: {
    iterations: number;
    warmup: number;
    runLabel: string;
    listingId: string;
    recipientProfileId: string;
    runIteration: () => Promise<{
        captured: { total_ms: number; phases: Record<string, number> };
        saHttpMs: number;
        saDidAuthVpMs: number;
    }>;
}): Promise<BenchRunResult> => {
    const runId = randomUUID();
    const { iterations, warmup, runLabel, listingId, recipientProfileId, runIteration } = params;

    for (let i = 0; i < warmup; i++) {
        try {
            await runIteration();
        } catch {
            // ignore — warmup failures should not abort the run
        }
    }

    const perIteration: BenchIterationResult[] = [];

    for (let i = 0; i < iterations; i++) {
        try {
            const { captured, saHttpMs, saDidAuthVpMs } = await runIteration();

            const result: BenchIterationResult = {
                iteration: i,
                total_ms: Math.round(captured.total_ms),
                parallel_reads_ms: phaseFromTracker(captured, 'parallelReads'),
                owner_and_sa_reads_ms: phaseFromTracker(captured, 'ownerAndSaReads'),
                sa_issue_ms: phaseFromTracker(captured, 'saIssue'),
                sa_http_ms: Math.round(saHttpMs),
                sa_didauthvp_ms: Math.round(saDidAuthVpMs),
                log_activity_and_send_boost_ms: phaseFromTracker(
                    captured,
                    'logActivityAndSendBoost'
                ),
            };
            perIteration.push(result);

            await captureBenchEvent('bench.appevent.iteration', {
                run_id: runId,
                run_label: runLabel,
                was_first_iteration: i === 0,
                listing_id: listingId,
                recipient_profile_id: recipientProfileId,
                ...result,
            });
        } catch (err) {
            perIteration.push({
                iteration: i,
                error: err instanceof Error ? err.message : String(err),
                total_ms: 0,
                parallel_reads_ms: 0,
                owner_and_sa_reads_ms: 0,
                sa_issue_ms: 0,
                sa_http_ms: 0,
                sa_didauthvp_ms: 0,
                log_activity_and_send_boost_ms: 0,
            });
        }
    }

    const successful = perIteration.filter(r => !r.error);
    const summary: BenchSummary = {
        iteration_count: perIteration.length,
        errors: perIteration.length - successful.length,
        total: summarize(successful.map(r => r.total_ms)),
        sa_issue: summarize(successful.map(r => r.sa_issue_ms)),
        sa_http: summarize(successful.map(r => r.sa_http_ms)),
        parallel_reads: summarize(successful.map(r => r.parallel_reads_ms)),
        owner_and_sa_reads: summarize(successful.map(r => r.owner_and_sa_reads_ms)),
        log_activity_and_send_boost: summarize(
            successful.map(r => r.log_activity_and_send_boost_ms)
        ),
    };

    await captureBenchEvent('bench.appevent.run', {
        run_id: runId,
        run_label: runLabel,
        listing_id: listingId,
        recipient_profile_id: recipientProfileId,
        iteration_count: summary.iteration_count,
        errors: summary.errors,
        total_p50: summary.total.p50,
        total_p95: summary.total.p95,
        total_p99: summary.total.p99,
        sa_issue_p50: summary.sa_issue.p50,
        sa_issue_p95: summary.sa_issue.p95,
        sa_issue_p99: summary.sa_issue.p99,
        sa_http_p50: summary.sa_http.p50,
        sa_http_p95: summary.sa_http.p95,
        sa_http_p99: summary.sa_http.p99,
        parallel_reads_p50: summary.parallel_reads.p50,
        parallel_reads_p95: summary.parallel_reads.p95,
        parallel_reads_p99: summary.parallel_reads.p99,
        owner_and_sa_reads_p50: summary.owner_and_sa_reads.p50,
        owner_and_sa_reads_p95: summary.owner_and_sa_reads.p95,
        owner_and_sa_reads_p99: summary.owner_and_sa_reads.p99,
        log_activity_and_send_boost_p50: summary.log_activity_and_send_boost.p50,
        log_activity_and_send_boost_p95: summary.log_activity_and_send_boost.p95,
        log_activity_and_send_boost_p99: summary.log_activity_and_send_boost.p99,
    });

    await flushBenchEvents();

    const posthogHost = process.env.POSTHOG_HOST;
    const posthogDashboardUrl = posthogHost
        ? `${posthogHost}/events?eventFilter=bench.appevent&runId=${runId}`
        : undefined;

    return { runId, perIteration, summary, posthogDashboardUrl };
};
