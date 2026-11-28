// Runs Lighthouse (mobile preset: emulated Moto G Power, slow 4G and 4x CPU slowdown) several
// times against one URL and reports the median FCP and LCP.
// Usage: node scripts/perf/lighthouse.mjs <url> <runs> <out.json>
// THROTTLING=devtools applies the throttling while the page loads instead of simulating it from an
// unthrottled trace (the default). Simulation models every request the page made before LCP, which
// for this SPA includes start-up work unrelated to the first screen, so devtools is the closer one.
// Set CHROME_PATH to a Chromium binary (for example Playwright's) when no system Chrome exists.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, runsArg = '3', output] = process.argv.slice(2);
if (!url || !output) throw new Error('Usage: lighthouse.mjs <url> <runs> <out.json>');
const runs = Number(runsArg);
const throttling = process.env.THROTTLING ?? 'simulate';
const median = samples => {
    const values = samples.filter(value => value !== null);
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const dir = mkdtempSync(join(tmpdir(), 'lc-lighthouse-'));
const samples = [];
try {
    for (let run = 0; run < runs; run += 1) {
        const report = join(dir, `run-${run}.json`);
        execFileSync(
            'npx',
            [
                '--yes',
                'lighthouse@13.6.0',
                url,
                '--only-categories=performance',
                '--output=json',
                `--output-path=${report}`,
                '--quiet',
                `--throttling-method=${throttling}`,
                '--chrome-flags=--headless=new --no-sandbox',
            ],
            { stdio: ['ignore', 'ignore', 'inherit'] }
        );
        const { audits, runtimeError } = JSON.parse(readFileSync(report, 'utf8'));
        if (runtimeError) throw new Error(`${runtimeError.code}: ${runtimeError.message}`);
        samples.push({
            fcp: audits['first-contentful-paint'].numericValue,
            lcp: audits['largest-contentful-paint'].numericValue,
            // Missing when the page never goes network-idle (devtools throttling, DIDKit download).
            tbt: audits['total-blocking-time'].numericValue ?? null,
            // Unthrottled timings from the same trace, for a sanity check on the simulated ones.
            observedFcp: audits.metrics.details?.items[0].observedFirstContentfulPaint ?? null,
            observedLcp: audits.metrics.details?.items[0].observedLargestContentfulPaint ?? null,
        });
    }
} finally {
    rmSync(dir, { recursive: true, force: true });
}
const result = {
    url,
    runs,
    median: {
        fcp: median(samples.map(sample => sample.fcp)),
        lcp: median(samples.map(sample => sample.lcp)),
        tbt: median(samples.map(sample => sample.tbt)),
        observedFcp: median(samples.map(sample => sample.observedFcp)),
        observedLcp: median(samples.map(sample => sample.observedLcp)),
    },
    samples,
    method: `npx lighthouse@13.6.0, default mobile preset, throttling-method=${throttling}, headless Chromium, performance category only.`,
};
writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ url, median: result.median }));
