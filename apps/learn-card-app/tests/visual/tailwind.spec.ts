import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const fontRequire = createRequire(path.resolve('package.json'));
const fonts = ['poppins', 'noto-sans']
    .flatMap(family =>
        [300, 400, 500, 600, 700, 800].map(weight => {
            const data = readFileSync(
                fontRequire.resolve(
                    `@fontsource/${family}/files/${family}-latin-${weight}-normal.woff2`
                )
            ).toString('base64');
            return `@font-face { font-family: '${family === 'poppins' ? 'Poppins' : 'Noto Sans'}'; font-style: normal; font-weight: ${weight}; src: url(data:font/woff2;base64,${data}) format('woff2'); }`;
        })
    )
    .join('\n');

test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-16T09:00:00Z'));
    // Exercise deterministic image/fallback states without depending on CDNs.
    await page.route(/^https?:\/\/(?!127\.0\.0\.1:3026)/, route => {
        if (route.request().resourceType() === 'image') {
            return route.fulfill({
                contentType: 'image/svg+xml',
                body: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="#E2E3E9"/><circle cx="80" cy="64" r="28" fill="#6F7590"/><path d="M24 160a56 56 0 0 1 112 0" fill="#6F7590"/></svg>',
            });
        }
        return route.abort();
    });
});

for (const state of ['active', 'pending', 'empty', 'shared']) {
    test(`${state} preserves the Tailwind 3 layout`, async ({ page }, testInfo) => {
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`/tailwind-regression.html?state=${state}`);
        const fixture = page.getByTestId('fixture');
        await expect(fixture).toBeVisible({ timeout: 90_000 });
        await expect(page.getByText('Something went wrong', { exact: true })).toHaveCount(0);
        if (state === 'active') {
            await expect(fixture.getByText('Jordan Lee wants to connect')).toBeVisible();
            await expect(
                fixture.getByText('Bachelor of Science, Computer Science', { exact: true })
            ).toBeVisible();
        }
        // Unpin the test host (the real app scrolls inside IonContent) so full-page
        // screenshots include every dashboard card, as in the Storybook host.
        await page.addStyleTag({
            content: `${fonts}\nhtml, body { position: static !important; overflow: auto !important; height: auto !important; }`,
        });
        await page.evaluate(() => document.fonts.ready);
        const styles = await fixture.evaluate(root => {
            const properties = [
                'display',
                'fontSize',
                'fontWeight',
                'lineHeight',
                'color',
                'backgroundColor',
                'paddingTop',
                'paddingRight',
                'paddingBottom',
                'paddingLeft',
                'marginTop',
                'marginBottom',
                'columnGap',
                'rowGap',
                'borderTopWidth',
                'borderTopStyle',
                'borderTopColor',
                'borderRadius',
                'maxWidth',
                'minWidth',
                'minHeight',
                'maxHeight',
                'flexShrink',
                'flexGrow',
                'gridColumn',
                'gridTemplateColumns',
                'textAlign',
                'overflow',
                'whiteSpace',
            ];
            // Capture CSS behavior rather than text-dependent heights or OS font rasterization.
            return [
                root,
                ...root.querySelectorAll(
                    'section, h1, h2, p, button, input, img, svg, [class*="grid"], [class*="space-"], .boost-generic-card-wrapper'
                ),
            ].map(node => {
                const style = getComputedStyle(node);
                const size = ['IMG', 'svg'].includes(node.tagName)
                    ? { width: style.width, height: style.height }
                    : {};
                return {
                    tag: node.tagName,
                    text: node.textContent?.trim().slice(0, 70),
                    styles: {
                        ...Object.fromEntries(
                            properties.map(key => [key, style[key as keyof CSSStyleDeclaration]])
                        ),
                        ...size,
                    },
                };
            });
        });
        expect(`${JSON.stringify(styles, null, 4)}\n`).toMatchSnapshot(`${state}-styles.json`);
        expect(errors).toEqual([]);
        await testInfo.attach(`${state}-${testInfo.project.name}`, {
            body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
            contentType: 'image/png',
        });
        if (process.env.VISUAL_SCREENSHOTS === 'true') {
            await expect(page).toHaveScreenshot(`${state}-${process.platform}.png`, {
                fullPage: true,
                animations: 'disabled',
                maxDiffPixelRatio: 0.002,
            });
        }
    });
}
