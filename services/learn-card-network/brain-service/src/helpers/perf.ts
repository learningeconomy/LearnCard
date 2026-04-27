/**
 * Lightweight timing helper for LC-1644 perf instrumentation.
 * Records phase durations always; only emits structured JSON to console
 * when LC_PERF_LOG is truthy. Use .capture() to read timings programmatically.
 */
export class PerfTracker {
    private logToConsole: boolean;
    private phases: Record<string, number> = {};
    private t0: number;
    private last: number;
    private label: string;

    constructor(label: string) {
        this.logToConsole = !!process.env.LC_PERF_LOG;
        this.label = label;
        this.t0 = performance.now();
        this.last = this.t0;
    }

    mark(phase: string): void {
        const now = performance.now();
        this.phases[phase] = now - this.last;
        this.last = now;
    }

    capture(): { total_ms: number; phases: Record<string, number> } {
        const total_ms = performance.now() - this.t0;
        return { total_ms, phases: { ...this.phases } };
    }

    done(extra?: Record<string, unknown>): void {
        if (!this.logToConsole) return;
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
