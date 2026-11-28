// Times how long a cold page load takes to show a page's own content (not the start-up shell),
// under fixed throttling, in a fresh signed-out browser each run. Lighthouse reports the start-up
// shell as FCP and, for this SPA, an LCP dominated by unrelated start-up downloads, so this measures
// the moment that matters to a visitor directly.
// Usage: node scripts/perf/first-content.mjs <url> <visible text> <runs> <out.json>
// Throttling (Chromium CDP): 4x CPU slowdown, 150 ms latency, 1.6 Mbps down / 750 Kbps up (Lighthouse's
// mobile "slow 4G" numbers).
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const [url, text, runsArg = '5', output] = process.argv.slice(2);
if (!url || !text || !output) throw new Error('Usage: first-content.mjs <url> <text> <runs> <out.json>');
const runs = Number(runsArg);

const median = values => {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const browser = await chromium.launch();
const samples = [];
try {
    for (let run = 0; run < runs; run += 1) {
        const context = await browser.newContext({ viewport: { width: 412, height: 823 } });
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        await cdp.send('Network.enable');
        await cdp.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: 150,
            downloadThroughput: (1.6 * 1024 * 1024) / 8,
            uploadThroughput: (750 * 1024) / 8,
        });
        await page.goto(url, { waitUntil: 'commit' });
        await page.getByText(text, { exact: false }).first().waitFor({ timeout: 120_000 });
        const visibleAt = await page.evaluate(() => performance.now());
        const fcp = await page.evaluate(
            () => performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null
        );
        samples.push({ contentVisible: Math.round(visibleAt), fcp: fcp && Math.round(fcp) });
        await context.close();
    }
} finally {
    await browser.close();
}
const result = {
    url,
    text,
    runs,
    median: { contentVisible: median(samples.map(sample => sample.contentVisible)) },
    samples,
    method: 'Playwright Chromium, fresh context per run, CDP 4x CPU + 150 ms / 1.6 Mbps; time from navigation start until the text is visible (includes Playwright polling, the same for every build).',
};
writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ url, median: result.median, samples }));
