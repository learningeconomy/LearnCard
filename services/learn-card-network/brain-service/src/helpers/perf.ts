/**
 * Lightweight timing helper for LC-1644 perf instrumentation.
 * Records phase durations and emits a structured JSON log on .done().
 * Zero-cost when LC_PERF_LOG is falsy (early-return on every method).
 */
export class PerfTracker {
    private enabled: boolean;
    private phases: Record<string, number> = {};
    private t0: number;
    private last: number;
    private label: string;

    constructor(label: string) {
        this.enabled = !!process.env.LC_PERF_LOG;
        this.label = label;
        this.t0 = performance.now();
        this.last = this.t0;
    }

    mark(phase: string): void {
        if (!this.enabled) return;
        const now = performance.now();
        this.phases[phase] = now - this.last;
        this.last = now;
    }

    done(extra?: Record<string, unknown>): void {
        if (!this.enabled) return;
        const total = performance.now() - this.t0;
        // eslint-disable-next-line no-console
        console.log(
            JSON.stringify({
                perf: this.label,
                total_ms: Math.round(total),
                phases: this.phases,
                ...extra,
            })
        );
    }
}
