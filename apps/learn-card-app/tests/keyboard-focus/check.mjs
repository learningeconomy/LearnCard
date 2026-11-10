import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, webkit } from '@playwright/test';

const origin = process.env.KEYBOARD_REVIEW_URL ?? 'http://127.0.0.1:3038';

for (const [engine, name] of [
    [chromium, 'Chromium'],
    [webkit, 'WebKit'],
]) {
    const browser = await engine.launch();
    try {
        const page = await browser.newPage({
            viewport: { width: 375, height: 667 },
            isMobile: true,
            hasTouch: true,
        });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`${origin}/tests/keyboard-focus/form.html`);
        await page.getByLabel('Location', { exact: true }).click();
        await page.evaluate(() => {
            window.__keyboardReviewHeight = 367;
            Object.defineProperty(window.visualViewport, 'height', {
                configurable: true,
                get: () => window.__keyboardReviewHeight,
            });
            window.visualViewport.dispatchEvent(new Event('resize'));
        });
        await page.waitForTimeout(600);
        const composite = await page.evaluate(() => {
            const input = document.querySelector('input[aria-label="Location"]');
            const wrapper = input.parentElement;
            const scroller = document.querySelector('[data-testid="scroller"]');
            return {
                bottom: input.getBoundingClientRect().bottom,
                scrollBottom: scroller.getBoundingClientRect().bottom,
                radius: getComputedStyle(wrapper).borderRadius,
                ring: getComputedStyle(wrapper).boxShadow,
                innerRing: getComputedStyle(input).boxShadow,
                height: document.querySelector('aside').getBoundingClientRect().height,
            };
        });
        assert.equal(composite.height, 367);
        assert.ok(composite.bottom <= composite.scrollBottom - 15);
        assert.notEqual(composite.radius, '0px');
        assert.notEqual(composite.ring, 'none');
        assert.equal(composite.innerRing, 'none');

        await page.getByLabel('Summary', { exact: true }).click();
        await page.waitForTimeout(500);
        const lastField = await page.evaluate(() => ({
            bottom: document.querySelector('textarea').getBoundingClientRect().bottom,
            scrollBottom: document.querySelector('[data-testid="scroller"]').getBoundingClientRect()
                .bottom,
        }));
        assert.ok(lastField.bottom <= lastField.scrollBottom - 15);

        await page.evaluate(() => {
            window.__keyboardReviewHeight = 667;
            window.visualViewport.dispatchEvent(new Event('resize'));
        });
        await page.waitForTimeout(600);
        assert.equal(
            await page.evaluate(() =>
                document.documentElement.hasAttribute('data-lc-keyboard-open')
            ),
            false
        );
        assert.equal(
            await page.locator('aside').evaluate(element => element.getBoundingClientRect().height),
            667
        );
        for (const width of [320, 375, 430, 1280]) {
            await page.setViewportSize({ width, height: 667 });
            await page.goto(`${origin}/tests/keyboard-focus/resume.html`);
            await page.getByRole('heading', { name: 'Your Resume' }).waitFor();
            const header = page.locator('ion-header');
            const before = await header.boundingBox();
            const buttons = await header.locator('button').evaluateAll(elements =>
                elements.map(element => {
                    const rect = element.getBoundingClientRect();
                    return {
                        left: rect.left,
                        right: rect.right,
                        width: rect.width,
                        height: rect.height,
                    };
                })
            );
            assert.ok(buttons.every(button => button.left >= -1 && button.right <= width + 1));
            assert.ok(buttons.every(button => button.width >= 43 && button.height >= 43));
            await page.getByRole('button', { name: 'Preview', exact: true }).waitFor();
            await page.getByRole('button', { name: 'Save', exact: true }).waitFor();
            await page.getByRole('textbox', { name: 'Brief professional summary...' }).click();
            await page.evaluate(() => {
                window.__keyboardReviewHeight = 367;
                Object.defineProperty(window.visualViewport, 'height', {
                    configurable: true,
                    get: () => window.__keyboardReviewHeight,
                });
                window.visualViewport.dispatchEvent(new Event('resize'));
            });
            await page.waitForTimeout(600);
            const after = await header.boundingBox();
            assert.ok(Math.abs(after.y - before.y) < 1, 'header stays at the top while editing');
            const summary = await page
                .getByRole('textbox', { name: 'Brief professional summary...' })
                .evaluate(element => ({
                    bottom: element.getBoundingClientRect().bottom,
                    shadow: getComputedStyle(element).boxShadow,
                    wrapperShadow: getComputedStyle(element.parentElement).boxShadow,
                    wrapperRadius: getComputedStyle(element.parentElement).borderRadius,
                }));
            assert.ok(summary.bottom <= 352, 'summary stays above the keyboard');
            assert.equal(summary.shadow, 'none');
            assert.notEqual(summary.wrapperShadow, 'none');
            assert.notEqual(summary.wrapperRadius, '0px');
            if (width === 375)
                await page.screenshot({
                    path: join(
                        process.env.KEYBOARD_REVIEW_OUTPUT ?? tmpdir(),
                        `${name.toLowerCase()}-resume-after.png`
                    ),
                });
        }
        assert.deepEqual(errors, []);
        console.log(
            `${name}: field reveal, focus change, rounded rings, dismissal, and resume header at 320/375/430/1280px passed`
        );
    } finally {
        await browser.close();
    }
}
