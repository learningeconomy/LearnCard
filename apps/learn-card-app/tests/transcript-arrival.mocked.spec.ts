import { expect, test } from './fixtures/mocked-test';

const HARNESS = '/transcript-arrival-harness.html';
const SHOTS = 'test-results/transcript-arrival';

test.describe('Transcript Arrival @mocked', () => {
    test('Requesting -> arrived: reveals the transcript with no Accept button', async ({
        page,
    }) => {
        await page.goto(`${HARNESS}?scenario=requesting-arrived`);

        // useTranscriptArrival auto-detects the matching incoming credential, claims
        // it, and marks the request received — the card then reveals the transcript
        // with no separate Accept step. The mocked wallet resolves fast enough that
        // the transient "Requesting…" state (covered by the Non-matching case below
        // and by useTranscriptArrival's own unit tests) may not be reliably observable here.
        await expect(page.getByText('Added to your account')).toBeVisible();
        await expect(page.getByText('Example High School')).toBeVisible();
        await expect(page.getByRole('button', { name: 'View Transcript' }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: /Accept/ })).toHaveCount(0);

        const markReceivedCalls = await page.evaluate(
            () => window.transcriptArrivalHarness.markReceivedCalls
        );
        expect(markReceivedCalls).toEqual(['req-harness-1']);
    });

    test('Non-matching credential: stays Requesting and never auto-accepts', async ({ page }) => {
        await page.goto(`${HARNESS}?scenario=non-matching-sender`);
        await expect(page.getByText('Your school is preparing your transcript')).toBeVisible();

        await page.waitForTimeout(1000);
        await expect(page.getByText('Your school is preparing your transcript')).toBeVisible();

        const markReceivedCalls = await page.evaluate(
            () => window.transcriptArrivalHarness.markReceivedCalls
        );
        expect(markReceivedCalls).toEqual([]);

        // The request is older than a day, so the card offers a manual path rather
        // than an indefinite spinner: check again, or accept it from notifications.
        await expect(page.getByRole('button', { name: 'Check Again' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Open Notifications' })).toBeVisible();
    });

    test('Arrival sheet: shown once per request, not on reload', async ({ page }) => {
        await page.goto(`${HARNESS}?scenario=arrived-sheet`);
        await expect(page.getByText('Your transcript arrived')).toBeVisible();
        await expect(page.getByRole('button', { name: 'View Transcript' }).first()).toBeVisible();

        await page.reload();
        await expect(page.getByText('Your transcript arrived')).toHaveCount(0);
        // The card itself still shows the arrived state after reload.
        await expect(page.getByText('Added to your account')).toBeVisible();
    });

    test('Mobile: no horizontal overflow at 375px', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(`${HARNESS}?scenario=arrived-sheet`);
        await expect(page.getByText('Added to your account')).toBeVisible();

        const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow).toBeLessThanOrEqual(0);
        await page.screenshot({ path: `${SHOTS}/mobile.png`, fullPage: true });
    });
});
