/**
 * LC-1644 benchmark aggregator — percentile stats + markdown report.
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface PhaseStats {
    label: string;
    n: number;
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    mean: number;
}

export function percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    if (sorted.length === 1) return sorted[0]!;
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]!;
}

export function aggregate(samples: Array<{ label: string; ms: number }>): Map<string, PhaseStats> {
    const groups = new Map<string, number[]>();

    for (const s of samples) {
        let arr = groups.get(s.label);
        if (!arr) {
            arr = [];
            groups.set(s.label, arr);
        }
        arr.push(s.ms);
    }

    const stats = new Map<string, PhaseStats>();

    for (const [label, values] of groups) {
        const sorted = [...values].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);

        stats.set(label, {
            label,
            n: sorted.length,
            p50: Math.round(percentile(sorted, 50)),
            p95: Math.round(percentile(sorted, 95)),
            p99: Math.round(percentile(sorted, 99)),
            min: Math.round(sorted[0]!),
            max: Math.round(sorted[sorted.length - 1]!),
            mean: Math.round(sum / sorted.length),
        });
    }

    return stats;
}

// ---------------------------------------------------------------------------
// Report writer
// ---------------------------------------------------------------------------

export interface ReportOptions {
    outPath: string;
    label: string;
    commitSha: string;
    iterations: number;
    warmup: number;
    stats: Map<string, PhaseStats>;
    targetTotalMs?: number;
    errors?: number;
}

export async function writeReport(opts: ReportOptions): Promise<void> {
    const dir = path.dirname(opts.outPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const lines: string[] = [];
    lines.push(`# LC-1644 Backend Benchmark: ${opts.label}`);
    lines.push('');
    lines.push(`| Meta | Value |`);
    lines.push(`|------|-------|`);
    lines.push(`| Commit | \`${opts.commitSha.slice(0, 8)}\` |`);
    lines.push(`| Date | ${new Date().toISOString()} |`);
    lines.push(`| Iterations | ${opts.iterations} (+${opts.warmup} warmup) |`);
    if (opts.targetTotalMs) {
        lines.push(`| Target p50 total | ≤${opts.targetTotalMs}ms |`);
    }
    if (opts.errors) {
        lines.push(`| Errors | ${opts.errors} |`);
    }
    lines.push('');

    // Sort stats: client total first, then backend total, then phases alphabetically
    const sortedStats = [...opts.stats.values()].sort((a, b) => {
        if (a.label === 'client:appEvent:total') return -1;
        if (b.label === 'client:appEvent:total') return 1;
        if (a.label === 'handleSendCredentialEvent') return -1;
        if (b.label === 'handleSendCredentialEvent') return 1;
        if (a.label.startsWith('handleSendCredentialEvent:') && !b.label.startsWith('handleSendCredentialEvent:')) return -1;
        if (!a.label.startsWith('handleSendCredentialEvent:') && b.label.startsWith('handleSendCredentialEvent:')) return 1;
        return a.label.localeCompare(b.label);
    });

    lines.push(`| Phase | n | p50 (ms) | p95 (ms) | p99 (ms) | min | max | mean |`);
    lines.push(`|-------|---|----------|----------|----------|-----|-----|------|`);

    for (const s of sortedStats) {
        const highlight = opts.targetTotalMs && s.label === 'client:appEvent:total'
            ? (s.p50 <= opts.targetTotalMs ? ' ✅' : ' ❌')
            : '';
        lines.push(
            `| ${s.label} | ${s.n} | ${s.p50} | ${s.p95} | ${s.p99} | ${s.min} | ${s.max} | ${s.mean} |${highlight}`
        );
    }

    lines.push('');

    fs.writeFileSync(opts.outPath, lines.join('\n'), 'utf8');
}
