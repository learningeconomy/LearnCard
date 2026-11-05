/**
 * In-memory latency/outcome recorder. Holds numbers and fixed labels only.
 *
 * Latency is kept as separate ok and failed series: a fast refusal (a 429, a 503
 * from a shed request) must not pull the ok percentiles down. Outcomes labelled
 * `throttled_by_client_ip` are lca-api's per-IP PIN limiter answering, not a
 * capacity failure: they are counted on their own and excluded from `failed` and
 * from the stop-on-error ratio.
 */
export const THROTTLED_BY_CLIENT_IP = 'throttled_by_client_ip';

export interface LatencySummary {
    p50: number;
    p95: number;
    p99: number;
    max: number;
}

export interface OutcomeSummary {
    count: number;
    ok: number;
    errors: Record<string, number>;
    /** Successful operations only. */
    latencyMs: LatencySummary | null;
    /** Every non-ok outcome (capacity errors and client-IP throttling). */
    failedLatencyMs: LatencySummary | null;
}

/** Nearest-rank percentile of an ascending array. */
export const percentile = (sorted: number[], p: number): number => {
    if (sorted.length === 0) return 0;
    const rank = Math.ceil((p / 100) * sorted.length);
    return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1];
};

const round = (value: number): number => Math.round(value * 10) / 10;
const roundRate = (value: number): number => Math.round(value * 1000) / 1000;

export const summarizeLatency = (values: number[]): LatencySummary | null => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    return {
        p50: round(percentile(sorted, 50)),
        p95: round(percentile(sorted, 95)),
        p99: round(percentile(sorted, 99)),
        max: round(sorted[sorted.length - 1]),
    };
};

class Outcome {
    okLatencies: number[] = [];
    failedLatencies: number[] = [];
    errors: Record<string, number> = {};
    add(ms: number, reason?: string): void {
        if (reason === undefined) {
            this.okLatencies.push(ms);
            return;
        }
        this.failedLatencies.push(ms);
        this.errors[reason] = (this.errors[reason] ?? 0) + 1;
    }
    summary(): OutcomeSummary {
        return {
            count: this.okLatencies.length + this.failedLatencies.length,
            ok: this.okLatencies.length,
            errors: { ...this.errors },
            latencyMs: summarizeLatency(this.okLatencies),
            failedLatencyMs: summarizeLatency(this.failedLatencies),
        };
    }
}

export type DropReason = 'in_flight' | 'stopped' | 'no_user' | 'pin_pool_busy';

class StageStats {
    started = 0;
    late = 0;
    maxLateMs = 0;
    dropped: Partial<Record<DropReason, number>> = {};
    scenarios = new Map<string, Outcome>();
    steps = new Map<string, Outcome>();
    completed = 0;
    /** Non-ok outcomes other than client-IP throttling. */
    failed = 0;
    throttled = 0;
}

export interface StageInfo {
    label: string;
    targetRate: number;
    durationSec: number;
    scheduled: number;
}

export class Recorder {
    private readonly stats: StageStats[];
    constructor(private readonly stages: StageInfo[]) {
        this.stats = stages.map(() => new StageStats());
    }

    private outcome(map: Map<string, Outcome>, name: string): Outcome {
        let value = map.get(name);
        if (!value) map.set(name, (value = new Outcome()));
        return value;
    }

    started(stage: number): void {
        this.stats[stage].started += 1;
    }
    late(stage: number, lateMs: number): void {
        const stats = this.stats[stage];
        stats.late += 1;
        stats.maxLateMs = Math.max(stats.maxLateMs, lateMs);
    }
    dropped(stage: number, reason: DropReason): void {
        const dropped = this.stats[stage].dropped;
        dropped[reason] = (dropped[reason] ?? 0) + 1;
    }
    step(stage: number, name: string, ms: number, reason?: string): void {
        this.outcome(this.stats[stage].steps, name).add(ms, reason);
    }
    scenario(stage: number, name: string, ms: number, reason?: string): void {
        const stats = this.stats[stage];
        this.outcome(stats.scenarios, name).add(ms, reason);
        stats.completed += 1;
        if (reason === THROTTLED_BY_CLIENT_IP) stats.throttled += 1;
        else if (reason !== undefined) stats.failed += 1;
    }

    /**
     * Fraction of failed scenarios in a stage, once it has `minimum` completions.
     * Client-IP throttling is not a failure here (see the file header).
     */
    errorRate(stage: number, minimum = 20): number {
        const stats = this.stats[stage];
        return stats.completed < minimum ? 0 : stats.failed / stats.completed;
    }

    /** One fixed-format progress line (counts and latencies only; ok latency first). */
    progressLine(stage: number, inFlight: number, elapsedSec: number): string {
        const stats = this.stats[stage];
        const outcomes = [...stats.scenarios.values()];
        const ok = summarizeLatency(outcomes.flatMap(outcome => outcome.okLatencies));
        const failed = summarizeLatency(outcomes.flatMap(outcome => outcome.failedLatencies));
        const dropped = Object.values(stats.dropped).reduce((sum, n) => sum + (n ?? 0), 0);
        return (
            `progress stage=${this.stages[stage].label} t=${Math.round(elapsedSec)}s ` +
            `started=${stats.started}/${this.stages[stage].scheduled} in_flight=${inFlight} ` +
            `ok=${stats.completed - stats.failed - stats.throttled} failed=${stats.failed} ` +
            `throttled_by_client_ip=${stats.throttled} dropped=${dropped} late=${stats.late} ` +
            `ok_p50_ms=${ok?.p50 ?? '-'} ok_p95_ms=${ok?.p95 ?? '-'} ok_p99_ms=${ok?.p99 ?? '-'} ` +
            `ok_max_ms=${ok?.max ?? '-'} failed_p50_ms=${failed?.p50 ?? '-'} failed_p95_ms=${failed?.p95 ?? '-'}`
        );
    }

    summary(): Record<string, unknown>[] {
        return this.stages.map((info, index) => {
            const stats = this.stats[index];
            const ok = stats.completed - stats.failed - stats.throttled;
            const map = (outcomes: Map<string, Outcome>) =>
                Object.fromEntries(
                    [...outcomes.entries()].map(([name, outcome]) => [name, outcome.summary()])
                );
            return {
                stage: info.label,
                targetRate: info.targetRate,
                durationSec: info.durationSec,
                scheduled: info.scheduled,
                started: stats.started,
                dropped: { ...stats.dropped },
                late: stats.late,
                maxLateMs: Math.round(stats.maxLateMs),
                achievedStartRate:
                    info.durationSec > 0 ? roundRate(stats.started / info.durationSec) : null,
                completed: stats.completed,
                ok,
                failed: stats.failed,
                throttledByClientIp: stats.throttled,
                achievedOkRate: info.durationSec > 0 ? roundRate(ok / info.durationSec) : null,
                scenarios: map(stats.scenarios),
                steps: map(stats.steps),
            };
        });
    }
}
