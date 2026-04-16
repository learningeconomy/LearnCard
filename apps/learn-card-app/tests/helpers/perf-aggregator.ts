/**
 * LC-1644 Performance Aggregator
 *
 * Collects frontend/backend perf samples, computes percentile stats,
 * and writes a markdown benchmark report.
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Types ────────────────────────────────────────────────────────────

export interface PerfSample {
    iteration: number;
    timestamp: number;
    source: 'frontend' | 'backend';
    /** e.g. "handleSendCredentialEvent" or "claim:mount-credentialResolved" */
    label: string;
    /** backend: total duration in ms */
    totalMs?: number;
    /** backend: per-phase durations in ms */
    phases?: Record<string, number>;
    /** frontend: single duration in ms */
    ms?: number;
}

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

// ── Math ─────────────────────────────────────────────────────────────

/**
 * Returns the p-th percentile from a sorted numeric array.
 * Uses linear interpolation (R-8 / Hyndman-Fan method would be overkill here).
 */
export function percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    if (sorted.length === 1) return sorted[0];

    const idx = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    const frac = idx - lo;

    if (lo === hi) return sorted[lo];
    return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

/**
 * Aggregate samples grouped by label into PhaseStats.
 * Each label gets its own p50/p95/p99/min/max/mean.
 */
export function aggregate(samples: PerfSample[]): Map<string, PhaseStats> {
    const byLabel = new Map<string, number[]>();

    for (const s of samples) {
        const ms = s.ms ?? s.totalMs;
        if (ms == null || ms < 0) continue;
        const arr = byLabel.get(s.label) ?? [];
        arr.push(ms);
        byLabel.set(s.label, arr);
    }

    const stats = new Map<string, PhaseStats>();
    for (const [label, vals] of byLabel) {
        const sorted = [...vals].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);
        stats.set(label, {
            label,
            n: sorted.length,
            p50: Math.round(percentile(sorted, 50)),
            p95: Math.round(percentile(sorted, 95)),
            p99: Math.round(percentile(sorted, 99)),
            min: Math.round(sorted[0]),
            max: Math.round(sorted[sorted.length - 1]),
            mean: Math.round(sum / sorted.length),
        });
    }

    return stats;
}

// ── Report Writer ────────────────────────────────────────────────────

/**
 * Renders a markdown report from aggregated phase stats.
 * Designed to match the table format in docs/superpowers/reports/2026-04-16-lc-1644-baseline.md.
 */
export async function writeReport(args: {
    outPath: string;
    label: string;
    commitSha: string;
    iterations: number;
    stats: Map<string, PhaseStats>;
    /** JIRA DoD target for p50 total (ms). Default: 4000 */
    targetTotalMs?: number;
}): Promise<void> {
    const {
        outPath,
        label,
        commitSha,
        iterations,
        stats,
        targetTotalMs = 4000,
    } = args;

    const date = new Date().toISOString().slice(0, 10);
    const lines: string[] = [];

    lines.push(`# LC-1644 Benchmark Report — ${label}`);
    lines.push('');
    lines.push(`- **Date:** ${date}`);
    lines.push(`- **Commit:** \`${commitSha.slice(0, 12)}\``);
    lines.push(`- **Iterations:** ${iterations} (+ ${process.env.PERF_WARMUP || 2} warmup, excluded)`);
    lines.push(`- **DoD target:** p50 total < ${targetTotalMs} ms`);
    lines.push('');

    // Helper to render a stats table for a group of labels
    const renderSection = (heading: string, labelOrder: string[]) => {
        lines.push(`## ${heading}`);
        lines.push('');
        lines.push('| Phase | n | p50 (ms) | p95 (ms) | p99 (ms) | min | max | mean |');
        lines.push('|-------|---:|---------:|---------:|---------:|----:|----:|-----:|');

        for (const lbl of labelOrder) {
            const s = stats.get(lbl);
            if (!s) continue;
            const bold = lbl.includes('total') ? '**' : '';
            lines.push(
                `| ${bold}${lbl}${bold} | ${s.n} | ${s.p50} | ${s.p95} | ${s.p99} | ${s.min} | ${s.max} | ${s.mean} |`
            );
        }
        lines.push('');
    };

    // Group labels by prefix
    const allLabels = [...stats.keys()];

    // Backend labels
    const backendLabels = allLabels.filter(
        l =>
            l.startsWith('handleSendCredentialEvent') ||
            l.startsWith('issueCredentialWithSigningAuthority')
    );
    // Sub-groups
    const sendCredLabels = backendLabels.filter(l => l.startsWith('handleSendCredentialEvent'));
    const saLabels = backendLabels.filter(l => l.startsWith('issueCredentialWithSigningAuthority'));

    // Frontend labels
    const frontendLabels = allLabels.filter(l => l.startsWith('claim:'));

    if (sendCredLabels.length > 0) {
        // Put total first, then phases sorted alphabetically
        const totalLabel = sendCredLabels.find(l => !l.includes(':'));
        const phaseLabels = sendCredLabels.filter(l => l.includes(':')).sort();
        renderSection(
            'handleSendCredentialEvent (brain-service)',
            [totalLabel, ...phaseLabels].filter(Boolean) as string[]
        );
    }

    if (saLabels.length > 0) {
        const totalLabel = saLabels.find(l => !l.includes(':'));
        const phaseLabels = saLabels.filter(l => l.includes(':')).sort();
        renderSection(
            'issueCredentialWithSigningAuthority',
            [totalLabel, ...phaseLabels].filter(Boolean) as string[]
        );
    }

    if (frontendLabels.length > 0) {
        renderSection('CredentialClaimModal (frontend)', frontendLabels.sort());
    }

    // Verdict
    const totalStats = stats.get('handleSendCredentialEvent');
    if (totalStats) {
        const pass = totalStats.p50 < targetTotalMs;
        lines.push('## Verdict');
        lines.push('');
        lines.push(
            pass
                ? `✅ **PASS** — p50 total = ${totalStats.p50} ms (< ${targetTotalMs} ms target)`
                : `❌ **FAIL** — p50 total = ${totalStats.p50} ms (≥ ${targetTotalMs} ms target)`
        );
        lines.push('');
    } else {
        lines.push('## Verdict');
        lines.push('');
        lines.push('⚠️ No `handleSendCredentialEvent` samples found. Backend perf logging may be disabled.');
        lines.push('');
    }

    lines.push('---');
    lines.push(`_Generated by \`partner-connect-perf.spec.ts\` at ${new Date().toISOString()}_`);
    lines.push('');

    // Ensure output directory exists
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
    console.log(`[perf-aggregator] Report written to ${outPath}`);
}
