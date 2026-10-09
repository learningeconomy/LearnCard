import { expect, test, type Locator } from '@playwright/test';

/** Check actual browser geometry: RTL must not reverse labels without reversing markers. */
const expectNumericAxis = async (
    scale: Locator,
    min: number,
    max: number,
    value: number,
    required: number
): Promise<void> => {
    await expect(scale).toBeVisible();
    const geometry = await scale.evaluate(element => {
        const track = element.firstElementChild!;
        const labels = element.lastElementChild!;
        const bounds = track.getBoundingClientRect();
        const markers = track.querySelectorAll<HTMLElement>('[style]');
        return {
            minX: labels.firstElementChild!.getBoundingClientRect().x,
            maxX: labels.lastElementChild!.getBoundingClientRect().x,
            positions: Array.from(
                markers,
                marker => (marker.getBoundingClientRect().x - bounds.x) / bounds.width
            ),
        };
    });
    expect(geometry.minX).toBeLessThan(geometry.maxX);
    expect(geometry.positions).toHaveLength(2);
    expect(geometry.positions[0]).toBeCloseTo((value - min) / (max - min), 2);
    expect(geometry.positions[1]).toBeCloseTo((required - min) / (max - min), 2);
};

test.describe('CLR numeric axes @mocked', () => {
    for (const viewport of [
        { width: 1280, height: 900 },
        { width: 390, height: 844 },
    ]) {
        test.describe(`${viewport.width}px`, () => {
            test.use({ viewport });

            for (const locale of ['en', 'ar']) {
                test(`keeps score markers aligned in ${locale}`, async ({ page }) => {
                    await page.goto('/dev/clr-transcript?insets=47,34');
                    await page.getByRole('combobox').selectOption(locale);
                    await expect(page.locator('html')).toHaveAttribute(
                        'dir',
                        locale === 'ar' ? 'rtl' : 'ltr'
                    );
                    await page
                        .getByRole('button', { name: 'Westbridge (Full)', exact: true })
                        .click();
                    await page.getByText('Military — Comprehensive', { exact: true }).click();
                    await page
                        .getByRole('button', {
                            name: 'Coordination knowledge assessment',
                            exact: true,
                        })
                        .click();
                    const modal = page.getByRole('dialog', {
                        name: 'Coordination knowledge assessment',
                        exact: true,
                    });
                    await expectNumericAxis(
                        modal.getByRole('img', {
                            name: 'Numeric scale from 0 to 100; achieved 86; passing 70',
                            exact: true,
                        }),
                        0,
                        100,
                        86,
                        70
                    );

                    // Reload closes the detail surface; the locale persists in the app.
                    await page.reload();
                    await expect(page.getByRole('combobox')).toHaveValue(locale);
                    await expect(page.locator('html')).toHaveAttribute(
                        'dir',
                        locale === 'ar' ? 'rtl' : 'ltr'
                    );
                    await page
                        .getByRole('button', { name: 'Westbridge (Full)', exact: true })
                        .click();
                    await page.getByText('General — Training Provider', { exact: true }).click();
                    await expectNumericAxis(
                        page.getByRole('img', {
                            name: 'Numeric scale from 0 to 40; achieved 36; passing 32',
                            exact: true,
                        }),
                        0,
                        40,
                        36,
                        32
                    );
                    await expectNumericAxis(
                        page.getByRole('img', {
                            name: 'Numeric scale from 0 to 100; achieved 86; passing 75',
                            exact: true,
                        }),
                        0,
                        100,
                        86,
                        75
                    );
                });
            }

            test('recovers from a malformed stored locale', async ({ page }) => {
                await page.addInitScript(() => localStorage.setItem('i18n.language', 'en--US'));
                await page.goto('/dev/clr-transcript?insets=47,34');
                await expect(
                    page.getByRole('heading', { name: 'CLR Renderer', exact: true })
                ).toBeVisible();
                await expect(page.getByRole('combobox')).toHaveValue('en');
                await expect(page.getByText('Invalid language tag: en--US')).toHaveCount(0);
            });
        });
    }
});
