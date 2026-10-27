import { startVerificationListing } from '../../../../../apps/learn-card-app/scripts/verification/journeys/app-store-seed.ts';

/** Real install/launch UI proof; known flag messages and OS handoff require staging/device QA. */
export default async function verifyMessageNavigation(v) {
    const listing = await v.step(null, 'message-listing-setup', () => startVerificationListing(v));
    try {
        const page = await v.step(null, 'message-sign-in', () =>
            v.newPage('message-navigation', { signInAs: v.actors.learner })
        );
        const learner = await v.step(null, 'message-check-installation', async () => {
            const wallet = await v.sdk(v.actors.learner);
            v.expect(await wallet.invoke.isAppInstalled(listing.listingId)).toBe(false);
            return wallet;
        });
        const preview = async () => {
            const messages = page.getByRole('button', { name: 'Messages', exact: true });
            const previewButton = await v.step(null, 'message-open-preview', async () => {
                if (!(await messages.isVisible()))
                    await page.getByRole('button', { name: /^Dev Debug/ }).click();
                await messages.click();
                const button = page.getByRole('button', { name: 'Preview JSON', exact: true });
                if (!(await button.isVisible()))
                    await page.getByRole('button', { name: 'Preview', exact: true }).click();
                return button;
            });
            await page
                .getByPlaceholder(
                    '{ "title": "Test", "actions": [{ "label": "OK", "style": "primary", "action": { "type": "dismiss" } }] }'
                )
                .fill(
                    JSON.stringify({
                        title: 'Open your learning app',
                        actions: [
                            {
                                label: 'Continue in app',
                                action: {
                                    type: 'openApp',
                                    listingId: listing.listingId,
                                    path: '/?messageEntry=1#lesson',
                                },
                            },
                        ],
                    })
                );
            await v.step(null, 'message-preview-action', async () => {
                await previewButton.click();
                await page.getByRole('button', { name: 'Continue in app', exact: true }).click();
            });
            if (await messages.isVisible())
                await page.getByRole('button', { name: /^Dev Debug/ }).click();
        };
        const assertFrame = async () => {
            await v.expect(page).toHaveURL(/\/apps\//);
            const frame = page.getByTitle(`${listing.displayName} - Full Screen`);
            await v.expect(frame).toBeVisible();
            const src = new URL(await frame.getAttribute('src'));
            v.expect(src.origin).toBe(listing.appUrl);
            v.expect(src.searchParams.get('messageEntry')).toBe('1');
            v.expect(src.searchParams.get('lc_host_override')).toBe(new URL(v.baseUrl).origin);
            v.expect(src.hash).toBe('#lesson');
            await v
                .expect(
                    frame
                        .contentFrame()
                        .getByRole('heading', { name: 'LearnCard Partner App Demo', exact: true })
                )
                .toBeVisible({ timeout: 60_000 });
        };
        await v.step(page, 'message-install-and-open', async () => {
            await preview();
            await v.expect(page).toHaveURL(/\/app\/.*launch=1/);
            await page.getByRole('button', { name: 'Install', exact: true }).click();
            await v
                .expect(page.getByRole('heading', { name: 'Install App', exact: true }))
                .toBeVisible();
            await page.getByRole('button', { name: 'Install', exact: true }).last().click();
            await assertFrame();
            v.expect(await learner.invoke.isAppInstalled(listing.listingId)).toBe(true);
        });
        await v.step(page, 'message-back-skips-listing', async () => {
            await page.goBack();
            await v.expect(page).toHaveURL(/\/(wallet|dashboard|passport)$/);
        });
        await v.step(page, 'message-installed-launch-after-reload', async () => {
            await page.reload();
            await preview();
            await assertFrame();
            await page.goBack();
            await v.expect(page).toHaveURL(/\/(wallet|dashboard|passport)$/);
        });
        await v.step(page, 'unknown-message-route-returns-home', async () => {
            await page.goto(`${v.baseUrl}/m/verification-unknown-message`);
            await v.expect(page).toHaveURL(/\/(wallet|dashboard|passport)$/);
            await v.expect(page.getByRole('dialog')).toHaveCount(0);
        });
        return {
            verified: [
                'install-consent',
                'initial-page',
                'installed-launch',
                'back-history',
                'unknown-message-route',
            ],
            notCovered: [
                'known-flag-deep-links',
                'analytics-delivery',
                'native-handoff',
                'Safari',
                'ScoutPass',
            ],
        };
    } finally {
        await listing.stop();
    }
}
