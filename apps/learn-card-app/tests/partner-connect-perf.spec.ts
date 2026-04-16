/**
 * LC-1644 Partner-Connect Performance Benchmark
 *
 * Drives sdk.sendCredential({ templateAlias }) end-to-end N times via Playwright,
 * collects frontend performance.mark events and backend PerfTracker JSON logs,
 * computes p50/p95/p99 per phase, writes a markdown report, and optionally
 * asserts JIRA DoD targets.
 *
 * Usage:
 *   PERF_LABEL=baseline pnpm exec playwright test --grep="partner-connect-perf"
 *   PERF_ITERATIONS=10 PERF_WARMUP=1 PERF_LABEL=quick pnpm exec playwright test --grep="partner-connect-perf"
 *   PERF_ASSERT_TARGETS=1 PERF_LABEL=final pnpm exec playwright test --grep="partner-connect-perf"
 */

import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { aggregate, writeReport, PerfSample } from './helpers/perf-aggregator';
import { scrapeBackendPerfLogs } from './helpers/perf-log-scraper';
import { seedPerfApp, SeededPerfApp } from './helpers/seed-perf-app';
import { waitForAuthenticatedState } from './test.helpers';
import { execSync } from 'child_process';
import path from 'path';

// ── Configuration ────────────────────────────────────────────────────

const ITERATIONS = Number(process.env.PERF_ITERATIONS || 20);
const WARMUP = Number(process.env.PERF_WARMUP || 2);
const LABEL = process.env.PERF_LABEL || 'unlabeled';
const TARGET_P50_TOTAL_MS = 4000; // JIRA DoD

// ── Mock embed HTML ──────────────────────────────────────────────────

/**
 * Returns an HTML page that, when loaded inside the LCA iframe, initializes
 * the PartnerConnect SDK and exposes a global `__PERF_SEND_CREDENTIAL()` function.
 * The test clicks the "Issue Credential" button inside the iframe.
 */
function mockEmbedHtml(app: SeededPerfApp): string {
    return `<!DOCTYPE html>
<html>
<head><title>${app.displayName}</title></head>
<body>
    <h1>Perf Bench Embed App</h1>
    <button id="issue-credential-btn">Issue Credential</button>
    <div id="status">Ready</div>
    <script>
        // The host (LCA) injects the PartnerConnect SDK via postMessage.
        // We listen for the init message to get the learnCard instance.
        let learnCard = null;

        window.addEventListener('message', async (event) => {
            // PartnerConnect sends the SDK proxy on init
            if (event.data?.type === 'LC_INIT' || event.data?.method === 'init') {
                // The SDK is also available via window.__LC if the host sets it
            }
        });

        document.getElementById('issue-credential-btn').addEventListener('click', async () => {
            const status = document.getElementById('status');
            status.textContent = 'Issuing...';

            try {
                // Use the PartnerConnect SDK's sendCredential method.
                // In the LCA iframe, the SDK is available at window.LC or via postMessage.
                // For the perf harness, we'll trigger it via the host's postMessage bridge.
                if (window.LC && window.LC.sendCredential) {
                    const response = await window.LC.sendCredential({
                        templateAlias: '${app.templateAlias}',
                        templateData: { issuedAt: new Date().toISOString() },
                        preventDuplicateClaim: false,
                    });
                    status.textContent = 'Done: ' + (response.credentialUri || response.credentialId || 'OK');
                    window.__PERF_RESULT = response;
                } else {
                    // Fallback: signal the host to trigger sendCredential
                    // The LCA PartnerConnect bridge will handle it
                    status.textContent = 'Waiting for SDK...';
                    window.parent.postMessage({
                        type: 'LC_APP_EVENT',
                        event: 'send-credential',
                        data: {
                            templateAlias: '${app.templateAlias}',
                            templateData: { issuedAt: new Date().toISOString() },
                            preventDuplicateClaim: false,
                        }
                    }, '*');
                }
            } catch (error) {
                status.textContent = 'Error: ' + (error.message || error);
                window.__PERF_ERROR = error;
            }
        });
    </script>
</body>
</html>`;
}

// ── Test ─────────────────────────────────────────────────────────────

test.describe('Partner-Connect performance benchmark', () => {
    test('sendCredential({ templateAlias }) — p50/p95/p99 per phase', async ({ page, context }) => {
        test.setTimeout(10 * 60_000); // 10 min for 20 iterations

        const commitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        const testStartTs = new Date().toISOString();

        // ── Step 1: Seed test data ────────────────────────────────────
        const app = await seedPerfApp();

        // ── Step 2: Authenticate ──────────────────────────────────────
        await waitForAuthenticatedState(page, { profileId: 'testa' });

        // ── Step 3: Mock embed URL ────────────────────────────────────
        const embedHtml = mockEmbedHtml(app);
        await page.route(`${app.embedUrl}/**`, async route => {
            await route.fulfill({
                status: 200,
                contentType: 'text/html',
                body: embedHtml,
            });
        });

        // ── Step 4: Collect frontend perf samples ─────────────────────
        const frontendSamples: PerfSample[] = [];
        page.on('console', msg => {
            const text = msg.text();
            if (!text.includes('"perf":')) return;
            try {
                const evt = JSON.parse(text);
                if (!evt.perf) return;
                frontendSamples.push({
                    iteration: -1, // filled below
                    timestamp: Date.now(),
                    source: 'frontend',
                    label: evt.perf,
                    ms: evt.ms ?? evt.total_ms,
                });
            } catch {
                // not valid JSON — ignore
            }
        });

        // ── Step 5: Run iterations ────────────────────────────────────
        for (let i = 0; i < WARMUP + ITERATIONS; i++) {
            const isWarmup = i < WARMUP;
            const iterationIdx = i - WARMUP;

            console.log(
                `[perf] ${isWarmup ? 'warmup' : 'iteration'} ${isWarmup ? i + 1 : iterationIdx + 1}/${isWarmup ? WARMUP : ITERATIONS}`
            );

            // Navigate to launchpad and find the seeded app
            await page.goto('/launchpad');

            // Wait for the seeded listing to appear
            await expect(page.getByText(app.displayName).first()).toBeVisible({
                timeout: 30_000,
            });

            // Click "Get" to open the detail modal (or "Open" if already installed)
            const getItem = page
                .locator('ion-item')
                .filter({ hasText: app.displayName })
                .getByRole('button', { name: 'Get' });

            const openItem = page
                .locator('ion-item')
                .filter({ hasText: app.displayName })
                .getByRole('button', { name: 'Open' });

            // First iteration: need to install
            if (i === 0) {
                await getItem.click();

                const modal = page.locator('#right-modal');
                await expect(modal.getByRole('button', { name: 'Install' })).toBeVisible({
                    timeout: 10_000,
                });
                await modal.getByRole('button', { name: 'Install' }).click();

                // AppInstallConsentModal
                await expect(page.getByText(/install.*\?/i)).toBeVisible({ timeout: 10_000 });
                await page.getByRole('button', { name: 'Install', exact: true }).last().click();
                await expect(page.getByText(/install.*\?/i)).not.toBeVisible({ timeout: 10_000 });

                // Wait for "Open" button
                await expect(modal.getByRole('button', { name: 'Open' })).toBeVisible({
                    timeout: 60_000,
                });
                await modal.getByRole('button', { name: 'Open' }).click();
            } else {
                // Already installed — navigate via LaunchPad
                // Click "Get" or find the listing and click through to open
                const hasOpen = await openItem.isVisible().catch(() => false);
                if (hasOpen) {
                    await openItem.click();
                } else {
                    await getItem.click();
                    const modal = page.locator('#right-modal');
                    await expect(modal.getByRole('button', { name: 'Open' })).toBeVisible({
                        timeout: 10_000,
                    });
                    await modal.getByRole('button', { name: 'Open' }).click();
                }
            }

            // Wait for the iframe to load
            const iframe = page.locator(`iframe[title*="${app.displayName}"]`);
            await expect(iframe).toBeVisible({ timeout: 30_000 });

            // Get the iframe's frame
            const frame = iframe.contentFrame();
            await expect(frame!.locator('#issue-credential-btn')).toBeVisible({ timeout: 10_000 });

            // Clear previous perf samples for this iteration
            const preSampleCount = frontendSamples.length;

            // Click the "Issue Credential" button inside the embed iframe
            await frame!.locator('#issue-credential-btn').click();

            // Wait for the CredentialClaimModal to appear and click "Accept" (or "Add to Wallet")
            // The claim modal is in the host page (not the iframe)
            const acceptButton = page.getByRole('button', { name: /accept|add to wallet|claim/i });
            await expect(acceptButton.first()).toBeVisible({ timeout: 30_000 });
            await acceptButton.first().click();

            // Wait for success state (modal closes or success message appears)
            await page.waitForTimeout(2_000); // Allow async operations to complete

            // Tag new frontend samples with iteration index
            for (let s = preSampleCount; s < frontendSamples.length; s++) {
                frontendSamples[s].iteration = isWarmup ? -1 : iterationIdx;
            }

            // Dismiss any remaining modals by navigating away
            if (!isWarmup || i < WARMUP + ITERATIONS - 1) {
                await page.goto('/wallet').catch(() => {});
            }
        }

        // ── Step 6: Scrape backend perf logs ──────────────────────────
        const backendSamples = await scrapeBackendPerfLogs({ since: testStartTs });

        // ── Step 7: Aggregate ─────────────────────────────────────────
        // Filter out warmup samples
        const filteredFrontend = frontendSamples.filter(s => s.iteration >= 0);
        // Tag backend samples with iteration -1 (we can't reliably match to iterations)
        const taggedBackend = backendSamples.map(s => ({ ...s, iteration: -1 }));

        const allSamples = [...filteredFrontend, ...taggedBackend];

        // Flatten: backend samples have `phases` sub-record → emit one sample per phase
        const flat: PerfSample[] = [];
        for (const s of allSamples) {
            if (s.phases && typeof s.phases === 'object') {
                for (const [phase, ms] of Object.entries(s.phases)) {
                    flat.push({
                        ...s,
                        label: `${s.label}:${phase}`,
                        ms: Math.round(ms),
                        totalMs: undefined,
                        phases: undefined,
                    });
                }
                if (s.totalMs != null) {
                    flat.push({ ...s, ms: s.totalMs });
                }
            } else {
                flat.push(s);
            }
        }

        const stats = aggregate(flat);

        // ── Step 8: Write report ──────────────────────────────────────
        const outPath = path.join(
            'docs/superpowers/reports',
            `${new Date().toISOString().slice(0, 10)}-lc-1644-${LABEL}.md`
        );

        await writeReport({
            outPath,
            label: LABEL,
            commitSha,
            iterations: ITERATIONS,
            stats,
            targetTotalMs: TARGET_P50_TOTAL_MS,
        });

        // ── Step 9: Assertions ────────────────────────────────────────

        // Soft assertion: backend must emit handleSendCredentialEvent perf
        const totalStats = stats.get('handleSendCredentialEvent');
        if (!totalStats) {
            console.warn(
                '[perf] WARNING: No handleSendCredentialEvent samples found. ' +
                    'Is LC_PERF_LOG=1 set in compose-local.yaml?'
            );
        }

        // Hard assertions gated on PERF_ASSERT_TARGETS=1
        if (process.env.PERF_ASSERT_TARGETS === '1') {
            expect(totalStats, 'backend must emit handleSendCredentialEvent perf').toBeTruthy();
            expect(
                totalStats!.p50,
                `p50 total latency target (<${TARGET_P50_TOTAL_MS}ms)`
            ).toBeLessThan(TARGET_P50_TOTAL_MS);

            const claimTotal = stats.get('claim:claim-accept');
            if (claimTotal) {
                expect(claimTotal.p99, 'claim accept p99 should be under 15s').toBeLessThan(15_000);
            }
        }
    });
});
