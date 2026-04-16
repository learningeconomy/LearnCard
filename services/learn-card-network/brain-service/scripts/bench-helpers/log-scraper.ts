/**
 * LC-1644 log scraper — scrapes PerfTracker JSON lines from docker compose logs.
 *
 * Requires brain-service running with LC_PERF_LOG=1.
 */

import { execFileSync } from 'child_process';

export interface BackendPerfSample {
    label: string;
    totalMs: number;
    phases: Record<string, number>;
    [k: string]: unknown;
}

export interface ScrapeOptions {
    /** ISO timestamp for --since filter */
    since: string;
    /** Path to compose file (default: auto-detect) */
    composeFile?: string;
}

/**
 * Scrape structured perf JSON from brain-service docker logs.
 *
 * PerfTracker emits lines like:
 *   {"perf":"handleSendCredentialEvent","total_ms":N,"phases":{...}}
 */
export function scrapeBackendPerfLogs(opts: ScrapeOptions): BackendPerfSample[] {
    const composeFile = opts.composeFile;

    const dockerArgs = [
        'compose',
        ...(composeFile ? ['-f', composeFile] : []),
        'logs',
        'brain',
        '--since',
        opts.since,
        '--no-log-prefix',
    ];

    let stdout: string;
    try {
        stdout = execFileSync('docker', dockerArgs, { encoding: 'utf8' });
    } catch (e) {
        console.warn(`[log-scraper] docker compose logs failed: ${(e as Error).message}`);
        return [];
    }

    const lines = stdout.split('\n');
    const samples: BackendPerfSample[] = [];

    for (const line of lines) {
        if (!line.includes('"perf":')) continue;
        try {
            const obj = JSON.parse(line.trim());
            if (obj.perf && typeof obj.total_ms === 'number') {
                samples.push({
                    label: obj.perf,
                    totalMs: obj.total_ms,
                    phases: obj.phases || {},
                    ...obj,
                });
            }
        } catch {
            // Not valid JSON — skip
        }
    }

    return samples;
}
