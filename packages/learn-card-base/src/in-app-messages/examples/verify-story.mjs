/** Run with lc verify script on an owned Linux stack; this is preview-only UI proof. */
export default async function verifyStory(v) {
    const page = await v.newPage('in-app-story', { signInAs: v.actors.learner });
    await v.step(page, 'open-story-preview', async () => {
        await page.getByRole('button', { name: /^Dev Debug/ }).click();
        await page.getByRole('button', { name: 'Messages', exact: true }).click();
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        await page.getByRole('button', { name: 'Story walkthrough', exact: true }).click();
        await v.expect(page.getByRole('dialog')).toBeVisible();
        await v
            .expect(page.getByRole('heading', { name: 'Your achievements, together' }))
            .toBeVisible();
    });
    await v.step(page, 'navigate-and-dismiss-story', async () => {
        const dialog = page.getByRole('dialog');
        await dialog.getByRole('button', { name: 'Next', exact: true }).click();
        await v
            .expect(dialog.getByRole('heading', { name: 'Choose your next step' }))
            .toBeVisible();
        for (const width of [991, 992, 768]) {
            await page.setViewportSize({ width, height: 900 });
            await v
                .expect(dialog.getByRole('heading', { name: 'Choose your next step' }))
                .toBeVisible();
            await v.expect(dialog.getByRole('button', { name: 'Done', exact: true })).toBeVisible();
        }
        await dialog.getByRole('button', { name: 'Previous', exact: true }).click();
        await v
            .expect(dialog.getByRole('heading', { name: 'Your achievements, together' }))
            .toBeVisible();
        await dialog.getByRole('button', { name: 'Next', exact: true }).press('ArrowRight');
        await dialog.getByRole('button', { name: 'Done', exact: true }).click();
        await v.expect(dialog).toHaveCount(0);
        await v
            .expect(page.getByRole('button', { name: 'Story walkthrough', exact: true }))
            .toBeVisible();
    });
    return {
        verified: [
            'story-preview',
            'bounded-navigation',
            'responsive-screen-state',
            'final-action',
        ],
        notCovered: ['flag-delivery', 'analytics', 'iframe', 'native'],
    };
}
