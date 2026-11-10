import assert from 'node:assert/strict';
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
        assert.deepEqual(errors, []);
        console.log(
            `${name}: field reveal, focus change, rounded composite ring, dismissal passed`
        );
    } finally {
        await browser.close();
    }
}
