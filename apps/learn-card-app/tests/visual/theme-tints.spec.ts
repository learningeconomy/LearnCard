import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.route(/^https?:\/\/(?!127\.0\.0\.1:3026)/, route => route.abort());
});

test('category card and row retain 30% background alpha with important theme colors', async ({
    page,
}) => {
    await page.goto('/tests/visual/tailwind-regression.html?state=tints');
    for (const mode of ['card', 'row']) {
        const button = page.getByTestId(`tint-${mode}`).getByRole('button');
        await expect(button).toBeVisible();
        const alpha = await button.evaluate(element => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            const context = canvas.getContext('2d')!;
            context.fillStyle = getComputedStyle(element).backgroundColor;
            context.fillRect(0, 0, 1, 1);
            return context.getImageData(0, 0, 1, 1).data[3];
        });
        expect(alpha).toBe(77);
    }
});

test('border utilities preserve Ionic reset behavior and explicit solid borders', async ({
    page,
}) => {
    await page.goto('/tests/visual/tailwind-regression.html?state=tints');
    await expect(page.getByTestId('ionic-border')).toHaveCSS('border-top-style', 'none');
    await expect(page.getByTestId('solid-border')).toHaveCSS('border-top-style', 'solid');
    await expect(page.getByTestId('solid-border')).toHaveCSS('border-top-width', '1px');
});

// Earned credential cards use two padded IonCols per row. Losing host padding
// makes adjacent rows touch even when each card's own styling is correct.
test('Ionic grid gutters survive preflight and explicit utilities still win', async ({
    page,
}, testInfo) => {
    if (testInfo.project.name === 'webkit-mobile') {
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'userAgent', {
                get: () =>
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 Version/16.4 Mobile/15E148 Safari/604.1',
            });
        });
    }
    await page.goto('/tests/visual/tailwind-regression.html?state=tints');
    const grid = page.getByTestId('credential-gutters');
    const col = grid.locator('ion-col').first();
    await expect(grid).toHaveCSS('padding-top', '20px');
    await expect(grid).toHaveCSS('padding-left', '5px');
    await expect(col).toHaveCSS('padding', '5px');
    const cards = await grid.getByTestId('gutter-card').evaluateAll(elements =>
        elements.map(element => {
            const { x, y, width, height } = element.getBoundingClientRect();
            return { x, y, width, height };
        })
    );
    expect(cards[1].x - (cards[0].x + cards[0].width)).toBe(10);
    expect(cards[2].y - (cards[0].y + cards[0].height)).toBe(10);
    await expect(page.getByTestId('explicit-grid-spacing')).toHaveCSS('padding', '0px');
    await expect(page.getByTestId('explicit-grid-spacing').locator('ion-col')).toHaveCSS(
        'padding',
        '0px'
    );
    // Ionic must continue to resolve responsive custom properties.
    await grid.evaluate(element =>
        (element as HTMLElement).style.setProperty('--ion-grid-column-padding', '9px')
    );
    await expect(col).toHaveCSS('padding', '9px');
});
