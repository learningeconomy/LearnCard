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
