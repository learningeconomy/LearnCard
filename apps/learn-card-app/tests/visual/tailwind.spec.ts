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

const cardFonts = [
    { id: 'jacques-francois', family: 'Jacques Francois', weights: [400] },
    { id: 'sacramento', family: 'Sacramento', weights: [400] },
    { id: 'mouse-memoirs', family: 'Mouse Memoirs', weights: [400] },
    { id: 'montserrat', family: 'Montserrat', weights: [400, 500, 600, 700, 800] },
]
    .flatMap(({ id, family, weights }) =>
        weights.map(weight => {
            const data = readFileSync(
                fontRequire.resolve(`@fontsource/${id}/files/${id}-latin-${weight}-normal.woff2`)
            ).toString('base64');
            return `@font-face { font-family: '${family}'; font-style: normal; font-weight: ${weight}; src: url(data:font/woff2;base64,${data}) format('woff2'); }`;
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

for (const state of [
    'active',
    'pending',
    'empty',
    'shared',
    'credential',
    'credential-details',
    'issue',
    'issue-json',
    'apps',
    'app-details',
]) {
    test(`${state} preserves the Tailwind 3 layout`, async ({ page }, testInfo) => {
        const expanded = !['active', 'pending', 'empty', 'shared'].includes(state);
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`/tests/visual/tailwind-regression.html?state=${state}`);
        const fixture = page.getByTestId('fixture');
        await expect(fixture).toBeVisible({ timeout: 90_000 });
        await expect(page.getByText('Something went wrong', { exact: true })).toHaveCount(0);
        if (
            [
                'credential',
                'credential-details',
                'issue',
                'issue-json',
                'apps',
                'app-details',
            ].includes(state)
        ) {
            // Compare settled UI states, including the JSON toggle's color transition.
            await page.addStyleTag({
                content:
                    '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }',
            });
        }
        if (state === 'active') {
            await expect(fixture.getByText('Jordan Lee wants to connect')).toBeVisible();
            await expect(
                fixture.getByText('Bachelor of Science, Computer Science', { exact: true })
            ).toBeVisible();
        }
        if (state.startsWith('issue')) {
            await expect(page.getByPlaceholder('e.g. Web Development Fundamentals')).toHaveValue(
                'Community Leadership'
            );
            if (state === 'issue-json') {
                // Its text label is visually hidden at phone widths; the button remains visible.
                await page
                    .locator('button')
                    .filter({ hasText: /^JSON$/ })
                    .click();
                await expect(page.locator('textarea.font-mono')).toBeVisible();
            }
            await expect(page.getByTestId('issue-submit')).toBeEnabled();
        }
        if (state === 'apps' || state === 'app-details') {
            await expect(
                fixture.getByText('Community Academy', { exact: true }).first()
            ).toBeVisible();
        }
        if (state.startsWith('credential')) {
            await expect(
                fixture.getByText('Project Management Professional (PMP)', { exact: true }).first()
            ).toBeVisible();
        }
        // Unpin the test host (the real app scrolls inside IonContent) so full-page
        // screenshots include every dashboard card, as in the Storybook host.
        await page.addStyleTag({
            content: `${fonts}${expanded ? cardFonts : ''}\nhtml, body { position: static !important; overflow: auto !important; height: auto !important; scrollbar-width: none; } html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }`,
        });
        if (['issue', 'issue-json', 'apps', 'app-details'].includes(state)) {
            // Expand Ionic's inner scroller for a complete page capture, including
            // the form fields below the fold. Keep the production layout/styles.
            await page.addStyleTag({
                content: `
                [data-testid="fixture"] > .ion-page { position: relative; inset: auto; height: auto; min-height: 100vh; contain: none; overflow: visible; }
                [data-testid="fixture"] ion-content { height: auto; min-height: calc(100vh - 64px); flex: none; contain: none; --overflow: visible; }
                [data-testid="fixture"] ion-content::part(scroll) { position: relative; inset: auto; overflow: visible; }
            `,
            });
        }
        await page.evaluate(() => document.fonts.ready);
        const styles = await fixture.evaluate((root, includeFontFamily) => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            const context = canvas.getContext('2d')!;
            // Normalize equivalent Tailwind 4 color(srgb ...) serialization to
            // the original rgb()/rgba() values without changing the references.
            const normalizeColor = (value: string): string => {
                if (!/^(color\(|color-mix\(|oklch\(|oklab\()/i.test(value)) return value;
                const alphaMatch = value.match(/\/\s*([\d.]+)\s*\)$/);
                const alpha = alphaMatch ? Number(alphaMatch[1]) : 1;
                context.clearRect(0, 0, 1, 1);
                // Convert the opaque color to avoid 8-bit premultiplication loss.
                context.fillStyle = alphaMatch ? value.replace(/\/\s*[\d.]+\s*\)$/, ')') : value;
                context.fillRect(0, 0, 1, 1);
                const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
                return alpha === 1
                    ? `rgb(${r}, ${g}, ${b})`
                    : `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 1_000_000) / 1_000_000})`;
            };
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
                ...(includeFontFamily ? ['fontFamily'] : []),
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
                            properties.map(key => [
                                key,
                                key === 'color' || key.endsWith('Color')
                                    ? normalizeColor(
                                          String(style[key as keyof CSSStyleDeclaration])
                                      )
                                    : key === 'borderRadius' &&
                                        /^([\d.e+]+)px$/.test(String(style.borderRadius)) &&
                                        parseFloat(style.borderRadius) > 9999
                                      ? '9999px'
                                      : style[key as keyof CSSStyleDeclaration],
                            ])
                        ),
                        ...size,
                    },
                };
            });
        }, expanded);
        await testInfo.attach(`${state}-${testInfo.project.name}`, {
            body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
            contentType: 'image/png',
        });
        expect(`${JSON.stringify(styles, null, 4)}\n`).toMatchSnapshot(`${state}-styles.json`);
        expect(errors).toEqual([]);
        if (process.env.VISUAL_SCREENSHOTS === 'true') {
            await expect(page).toHaveScreenshot(`${state}-${process.platform}.png`, {
                fullPage: true,
                animations: 'disabled',
                maxDiffPixelRatio: 0.002,
            });
        }
        if (state === 'shared') {
            // Preserve the public card's existing keyboard-focus contract.
            const button = page.locator('.boost-generic-card-button');
            await page.keyboard.press('Tab');
            // Mobile WebKit's default Tab policy skips buttons. Check the same
            // focus-visible treatment after keyboard-modality programmatic focus.
            if (testInfo.project.name === 'webkit-mobile') {
                await button.focus();
                await page.keyboard.press('ArrowRight');
            }
            await expect(button).toBeFocused();
            await expect(button).toHaveCSS('outline-style', 'none');
            const frame = page.locator('.boost-generic-card-wrapper');
            await expect(frame).toHaveCSS('box-shadow', /rgb\(255, 255, 255\).*2px/);
            await expect(frame).toHaveCSS('box-shadow', /rgb\(64, 203, 166\).*4px/);
        }
    });
}
