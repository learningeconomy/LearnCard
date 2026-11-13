import { expect, test, type Page } from '@playwright/test';
import type { VC } from '@learncard/types';
import {
    createClrVerificationFixture,
    createClrVerificationScaleFixture,
} from './fixtures/clr-verification.fixture';

const liveServers = new Set<() => Promise<void>>();
test.afterEach(async () => {
    await Promise.all([...liveServers].map(close => close()));
    liveServers.clear();
});
test.beforeEach(async ({ page }) => {
    // Registry discovery is isolated; credential proofs and status lists are real.
    await page.route(
        /^https:\/\/registries\.learncard\.com\/(?:known|untrusted)-did-registries\.json$/,
        route => route.fulfill({ status: 200, json: [] })
    );
});

const openFixture = async (page: Page, credential: VC) => {
    await page.addInitScript(credential => {
        (
            window as Window & { __CLR_VERIFICATION_FIXTURE__?: Record<string, unknown> }
        ).__CLR_VERIFICATION_FIXTURE__ = credential;
    }, credential);
    await page.goto('/dev/clr-transcript');
    const summary = page.getByTestId('clr-verification-summary');
    await expect(summary).toBeVisible({ timeout: 30_000 });
    return summary;
};

test('verifies 50 real records with exactly five cold did:web lookups @mocked', async ({
    page,
}, testInfo) => {
    const fixture = await createClrVerificationScaleFixture();
    liveServers.add(fixture.close);
    const didRequests: string[] = [];
    page.on('request', request => {
        if (request.method() === 'GET' && request.url().endsWith('/did.json'))
            didRequests.push(request.url());
    });
    await openFixture(page, fixture.credential);
    await expect(page.getByTestId('clr-outer-verification')).toContainText(/^Verified/, {
        timeout: 30_000,
    });
    await expect(page.getByRole('button', { name: /^District record \d+$/ })).toHaveCount(50);
    // Ten same-publisher successes stay quiet; forty other-issuer records are marked.
    await expect(page.getByTestId('clr-record-verification')).toHaveCount(40);
    await expect(
        page.getByTestId('clr-record-verification').filter({ hasText: /^Verified$/ })
    ).toHaveCount(40);
    expect(Object.keys(fixture.didDocuments)).toHaveLength(5);
    expect(fixture.counters.didGets).toBe(5);
    expect(didRequests).toHaveLength(5);
    expect(new Set(didRequests).size).toBe(5);
    await testInfo.attach('cold-did-lookups', {
        body: JSON.stringify({ recordCount: 50, didRequests, counters: fixture.counters }),
        contentType: 'application/json',
    });
});

for (const viewport of [
    { name: 'desktop', width: 1280, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
]) {
    test(`verifies real multi-issuer CLR on ${viewport.name} without layout shift @mocked`, async ({
        page,
    }, testInfo) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const fixture = await createClrVerificationFixture();
        liveServers.add(fixture.close);
        const blocked: { url: string; release: () => void }[] = [];
        await page.route(`${new URL(fixture.statusListUrl).origin}/**/did.json`, async route => {
            await new Promise<void>(release =>
                blocked.push({ url: route.request().url(), release })
            );
            await route.continue();
        });
        try {
            const summary = await openFixture(page, fixture.credential);
            await expect.poll(() => blocked.length).toBe(3);
            await page.evaluate(() => document.fonts.ready);
            const geometry = async () => ({
                header: await summary.boundingBox(),
                rows: await page
                    .getByTestId('clr-record-verification')
                    .locator('..')
                    .evaluateAll(elements =>
                        elements.map(element => {
                            const { x, y, width, height } = element.getBoundingClientRect();
                            return { x, y, width, height };
                        })
                    ),
            });
            const initial = await geometry();
            expect(initial.rows).toHaveLength(4);
            blocked.find(request => request.url.includes('/state/'))!.release();
            blocked.find(request => request.url.includes('/district-a/'))!.release();
            await expect(
                page.getByTestId('clr-record-verification').filter({ hasText: /^Verified$/ })
            ).toHaveCount(2);
            await expect(page.getByTestId('clr-outer-verification')).toContainText(
                'Checking verification'
            );
            const intermediate = await geometry();
            blocked.find(request => request.url.includes('/district-b/'))!.release();
            await expect(page.getByTestId('clr-outer-verification')).toContainText(/^Verified/);
            await expect(
                page.getByTestId('clr-record-verification').filter({ hasText: /^Revoked$/ })
            ).toHaveCount(1);
            await expect(
                page
                    .getByTestId('clr-record-verification')
                    .filter({ hasText: 'Signature could not be confirmed' })
            ).toHaveCount(1);
            const settled = await geometry();
            for (const observed of [intermediate, settled]) {
                expect(observed.header).not.toBeNull();
                for (const [before, after] of [
                    [initial.header!, observed.header!],
                    ...initial.rows.map((row, index) => [row, observed.rows[index]]),
                ]) {
                    for (const metric of ['x', 'y', 'width', 'height'] as const)
                        expect(Math.abs(before[metric] - after[metric])).toBeLessThanOrEqual(1);
                }
            }
            expect(fixture.counters.didGets).toBe(3);
            expect(fixture.counters.statusGets).toBe(1);
            await page.screenshot({
                path: testInfo.outputPath(`${viewport.name}-en.png`),
                fullPage: true,
            });
            await page.getByTestId('clr-record-verification').first().scrollIntoViewIfNeeded();
            await page.screenshot({
                path: testInfo.outputPath(`${viewport.name}-records-en.png`),
                fullPage: true,
            });
            await page.getByTestId('clr-record-verification').last().scrollIntoViewIfNeeded();
            await page.screenshot({
                path: testInfo.outputPath(`${viewport.name}-records-end-en.png`),
                fullPage: true,
            });
            await summary.scrollIntoViewIfNeeded();

            const details = summary.locator('details[aria-label]').first();
            const disclosure = details.locator('summary').first();
            await disclosure.focus();
            await page.keyboard.press('Enter');
            await expect(details).toHaveAttribute('open', '');
            await expect(
                details.getByText(fixture.issuerDids[0], { exact: false }).first()
            ).toBeVisible();
            await page.screenshot({
                path: testInfo.outputPath(`${viewport.name}-issuer-details.png`),
                fullPage: true,
            });
            await disclosure.press('Enter');

            for (const locale of [
                {
                    value: 'es',
                    control: 'Language',
                    verified: 'Verificado',
                    revoked: 'Revocado',
                    invalid: 'No se pudo confirmar la firma',
                },
                {
                    value: 'fr',
                    control: 'Idioma',
                    verified: 'Vérifié',
                    revoked: 'Révoqué',
                    invalid: 'La signature n’a pas pu être confirmée',
                },
                {
                    value: 'ar',
                    control: 'Langue',
                    verified: 'تم التحقق',
                    revoked: 'ملغاة',
                    invalid: 'تعذر تأكيد التوقيع',
                },
            ]) {
                await page
                    .getByRole('combobox', { name: locale.control, exact: true })
                    .selectOption(locale.value);
                await expect(page.getByTestId('clr-outer-verification')).toContainText(
                    locale.verified
                );
                await expect(
                    page.getByTestId('clr-record-verification').filter({ hasText: locale.verified })
                ).toHaveCount(2);
                await expect(
                    page.getByTestId('clr-record-verification').filter({ hasText: locale.revoked })
                ).toHaveCount(1);
                await expect(
                    page.getByTestId('clr-record-verification').filter({ hasText: locale.invalid })
                ).toHaveCount(1);
                await page.screenshot({
                    path: testInfo.outputPath(`${viewport.name}-${locale.value}.png`),
                    fullPage: true,
                });
                await page.getByTestId('clr-record-verification').first().scrollIntoViewIfNeeded();
                await page.screenshot({
                    path: testInfo.outputPath(`${viewport.name}-records-${locale.value}.png`),
                    fullPage: true,
                });
            }
        } finally {
            blocked.forEach(request => request.release());
        }
    });
}

test('keeps unavailable DID results neutral and retries in place after recovery @mocked', async ({
    page,
}) => {
    const fixture = await createClrVerificationFixture();
    liveServers.add(fixture.close);
    let unavailable = true;
    await page.route('**/district-*/did.json', route =>
        unavailable ? route.fulfill({ status: 503 }) : route.continue()
    );
    const summary = await openFixture(page, fixture.credential);
    await expect(summary).toContainText('Could not verify right now', { timeout: 30_000 });
    await expect(
        page
            .getByTestId('clr-record-verification')
            .filter({ hasText: 'Signature could not be confirmed' })
    ).toHaveCount(0);
    unavailable = false;
    const retry = summary.getByRole('button', { name: 'Retry verification', exact: true });
    await retry.click();
    await expect(page.getByTestId('clr-outer-verification')).toContainText(/^Verified/);
    await expect(
        page.getByTestId('clr-record-verification').filter({ hasText: /^Verified$/ })
    ).toHaveCount(2);
    await expect(
        page.getByTestId('clr-record-verification').filter({ hasText: /^Revoked$/ })
    ).toHaveCount(1);
    await expect(
        page
            .getByTestId('clr-record-verification')
            .filter({ hasText: 'Signature could not be confirmed' })
    ).toHaveCount(1);
    await expect(retry).toBeFocused();
});
