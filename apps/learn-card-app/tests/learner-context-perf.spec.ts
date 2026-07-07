import { mkdir, writeFile } from 'node:fs/promises';

import { expect, test, type Page } from '@playwright/test';

import { seedAppListing, mockEmbedRoute, type SeededListing } from './app-store.helpers';
import { waitForAuthenticatedState } from './test.helpers';

type BenchmarkRow = {
    scenario: 'cold' | 'prewarmed' | 'warm-repeat';
    credentialCount: number;
    iteration: number;
    sdkWallClockMs: number;
    cacheStatus?: string;
    timings?: Record<string, unknown>;
};

const BENCHMARK_IFRAME_HTML = `<!DOCTYPE html>
<html>
<head><title>Learner Context Perf Harness</title></head>
<body>
<button id="run">Run learner context benchmark</button>
<script>
const protocol = 'LEARNCARD_V1';
let sequence = 0;

const sendLearnerContextRequest = async () => {
    const requestId = 'learner-context-bench-' + (++sequence);
    const startedAt = performance.now();
    const { promise, resolve, reject } = Promise.withResolvers();
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for host response')), 60000);

    const onMessage = event => {
        const message = event.data;
        if (!message || message.protocol !== protocol || message.requestId !== requestId) return;

        window.removeEventListener('message', onMessage);
        clearTimeout(timeout);

        if (message.type === 'ERROR') {
            reject(new Error(message.error?.message || 'Host returned an error'));
            return;
        }

        const data = message.data || {};
        const sdkWallClockMs = performance.now() - startedAt;
        resolve({
            sdkWallClockMs,
            cacheStatus: data.metadata?.cacheStatus,
            timings: data.metadata?.timings,
        });
    };

    window.addEventListener('message', onMessage);
    window.parent.postMessage({
        protocol,
        action: 'REQUEST_LEARNER_CONTEXT',
        requestId,
        payload: {
            includeCredentials: true,
            includePersonalData: false,
            format: 'prompt',
            detailLevel: 'compact',
        },
    }, '*');

    return promise;
};

window.runLearnerContextBenchmark = async () => {
    const credentialCounts = [5, 50, 500];
    const rows = [];

    for (const credentialCount of credentialCounts) {
        rows.push({ scenario: 'cold', credentialCount, iteration: 0, ...(await sendLearnerContextRequest()) });
        rows.push({ scenario: 'prewarmed', credentialCount, iteration: 0, ...(await sendLearnerContextRequest()) });

        for (let iteration = 0; iteration < 20; iteration += 1) {
            rows.push({
                scenario: 'warm-repeat',
                credentialCount,
                iteration,
                ...(await sendLearnerContextRequest()),
            });
        }
    }

    return rows;
};
</script>
</body>
</html>`;

const launchEmbeddedListing = async (page: Page, listing: SeededListing) => {
    await page.goto('/launchpad');

    await expect(page.getByText(listing.displayName).first()).toBeVisible({ timeout: 30_000 });

    await page
        .locator('ion-item')
        .filter({ hasText: listing.displayName })
        .getByRole('button', { name: 'Get' })
        .click();

    const modal = page.locator('#right-modal');
    await expect(modal.getByRole('button', { name: 'Install' })).toBeVisible({ timeout: 10_000 });
    await modal.getByRole('button', { name: 'Install' }).click();

    await expect(page.getByText(/install.*\?/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Install', exact: true }).last().click();
    await expect(page.getByText(/install.*\?/i)).not.toBeVisible({ timeout: 10_000 });
    await expect(modal.getByRole('button', { name: 'Open' })).toBeVisible({ timeout: 60_000 });
    await modal.getByRole('button', { name: 'Open' }).click();
};

test.describe('learner context browser hot path benchmark', () => {
    test('records cold, prewarmed, and warm iframe timings', async ({ page }) => {
        const listing = await seedAppListing();

        await waitForAuthenticatedState(page, { profileId: 'testa' });
        await mockEmbedRoute(page, BENCHMARK_IFRAME_HTML);
        await launchEmbeddedListing(page, listing);

        const iframe = page.frameLocator(`iframe[title*="${listing.displayName}"]`);
        await expect(
            iframe.getByRole('button', { name: 'Run learner context benchmark' })
        ).toBeVisible({
            timeout: 30_000,
        });

        const rows = (await iframe.locator('body').evaluate(async () => {
            const benchmark = window.runLearnerContextBenchmark;
            if (typeof benchmark !== 'function') throw new Error('Benchmark harness missing');
            return await benchmark();
        })) as BenchmarkRow[];

        await mkdir('test-results', { recursive: true });
        await writeFile('test-results/learner-context-bench.json', JSON.stringify(rows, null, 2));

        expect(rows.length).toBeGreaterThan(0);
        expect(rows.some(row => row.scenario === 'warm-repeat')).toBe(true);
    });
});

declare global {
    interface Window {
        runLearnerContextBenchmark?: () => Promise<BenchmarkRow[]>;
    }
}
