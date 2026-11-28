// Runs Lighthouse (mobile preset: emulated Moto G Power, simulated slow 4G and 4x CPU slowdown)
// several times against one URL and reports the median FCP and LCP.
// Usage: node scripts/perf/lighthouse.mjs <url> <runs> <out.json>
// Set CHROME_PATH to a Chromium binary (for example Playwright's) when no system Chrome exists.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, runsArg = '3', output] = process.argv.slice(2);
if (!url || !output) throw new Error('Usage: lighthouse.mjs <url> <runs> <out.json>');
const runs = Number(runsArg);
const median = values => {
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
                '--chrome-flags=--headless=new --no-sandbox',
            ],
            { stdio: ['ignore', 'ignore', 'inherit'] }
        );
        const { audits, runtimeError } = JSON.parse(readFileSync(report, 'utf8'));
        if (runtimeError) throw new Error(`${runtimeError.code}: ${runtimeError.message}`);
        samples.push({
            fcp: audits['first-contentful-paint'].numericValue,
            lcp: audits['largest-contentful-paint'].numericValue,
            tbt: audits['total-blocking-time'].numericValue,
            lcpElement:
                audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node
                    ?.snippet ?? null,
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
    },
    samples,
    method: 'npx lighthouse@13.6.0, default mobile preset (simulated throttling), headless Chromium, performance category only.',
};
writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ url, median: result.median }));
