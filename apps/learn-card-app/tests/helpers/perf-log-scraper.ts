/**
 * LC-1644 Backend Perf Log Scraper
 *
 * Scrapes structured perf JSON from docker compose logs for the brain service.
 * Relies on PerfTracker (brain-service/src/helpers/perf.ts) emitting lines like:
 *   {"perf":"<label>","total_ms":N,"phases":{...}}
 */

import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { PerfSample } from './perf-aggregator';

const COMPOSE_FILE = 'compose-local.yaml';
const SERVICE = 'brain';

export interface ScrapeOptions {
    /** ISO timestamp — only scrape logs after this time */
    since: string;
    /** Working directory for docker compose (default: auto-detected) */
    composeDir?: string;
}

/**
 * Scrape backend perf logs from docker compose.
 * Returns parsed PerfSample[] or empty array on failure.
 */
export async function scrapeBackendPerfLogs(options: ScrapeOptions): Promise<PerfSample[]> {
    const { since, composeDir } = options;

    // Default compose dir: apps/learn-card-app/ (where compose-local.yaml lives)
    const cwd = composeDir || findComposeDir();
    if (!cwd) {
        console.warn(
            '[perf-log-scraper] Could not locate compose-local.yaml — skipping backend log scrape'
        );
        return [];
    }

    try {
        const sinceFlag = formatSince(since);

        const raw = execFileSync(
            'docker',
            [
                'compose',
                '-f',
                COMPOSE_FILE,
                'logs',
                SERVICE,
                '--no-log-prefix',
                '--since',
                sinceFlag,
            ],
            {
                cwd,
                encoding: 'utf-8',
                timeout: 30_000,
                maxBuffer: 10 * 1024 * 1024, // 10 MB
            }
        );

        return parsePerfLines(raw);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[perf-log-scraper] Docker log scrape failed: ${message}`);
        return [];
    }
}

/**
 * Parse lines containing `"perf":` from raw docker log output.
 */
export function parsePerfLines(raw: string): PerfSample[] {
    const samples: PerfSample[] = [];

    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.includes('"perf"')) continue;

        try {
            const obj = JSON.parse(trimmed);
            if (typeof obj.perf !== 'string') continue;

            samples.push({
                iteration: -1, // filled in by caller if needed
                timestamp: Date.now(),
                source: 'backend',
                label: obj.perf,
                totalMs: typeof obj.total_ms === 'number' ? Math.round(obj.total_ms) : undefined,
                phases:
                    obj.phases && typeof obj.phases === 'object' ? obj.phases : undefined,
            });
        } catch {
            // Not valid JSON — skip
        }
    }

    return samples;
}

/**
 * Format a since-time for docker logs.
 * Docker supports relative durations (e.g. "5m"). Convert ISO → relative.
 */
function formatSince(iso: string): string {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffSec = Math.max(1, Math.round((now - then) / 1000));

    // Cap at 60 minutes — docker compose can return enormous log buffers
    const capSec = 60 * 60;
    const sec = Math.min(diffSec, capSec);

    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.ceil(sec / 60)}m`;
    return `${Math.ceil(sec / 3600)}h`;
}

/**
 * Walk up from cwd to find the directory containing compose-local.yaml.
 */
function findComposeDir(): string | undefined {
    // In Playwright, cwd is apps/learn-card-app/
    if (existsSync(`${process.cwd()}/${COMPOSE_FILE}`)) return process.cwd();

    // Try relative to git root
    try {
        const { execSync } = require('child_process');
        const repoRoot = execSync('git rev-parse --show-toplevel', {
            encoding: 'utf-8',
        }).trim();
        const candidate = `${repoRoot}/apps/learn-card-app`;
        if (existsSync(`${candidate}/${COMPOSE_FILE}`)) return candidate;
    } catch {
        // Not in a git repo — ignore
    }

    return undefined;
}
