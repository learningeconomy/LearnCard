import { randomBytes } from 'node:crypto';

import { expect } from '../expect';
import type { FeatureDefinition } from '../types';
import { UI_TIMEOUT, issueSelfBadge, openStoredBadge, readIssuer } from './shared';

export const sharingFeature: FeatureDefinition = {
    id: 'sharing',
    title: 'Copy a real credential share link and open it as an anonymous viewer',
    surface: 'web',
    entries: ['share-menu-copy', 'share-anonymous-view'],
    run: async context => {
        const title = `Verify share ${randomBytes(4).toString('hex')}`;
        const page = await context.newPage('sharing-owner', { signInAs: context.actors.learner });
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
            origin: context.baseUrl,
        });
        const issuer = await context.step(page, 'sharing-create-earned-credential', async () => {
            await issueSelfBadge(page, title);
            return readIssuer(await openStoredBadge(page, title));
        });
        const copiedUrl = await context.step(page, 'share-menu-copy', async () => {
            await page
                .getByRole('dialog')
                .getByRole('button', { name: 'More options', exact: true })
                .click();
            await page.getByRole('button', { name: 'Share', exact: true }).click();
            const copy = page.getByRole('button', { name: 'Copy Link', exact: true });
            await expect(copy).toBeVisible({ timeout: UI_TIMEOUT });
            await expect(
                page.getByRole('img', { name: 'Share QR code', exact: true })
            ).toBeVisible();
            await copy.click();
            const url = await page.evaluate(() => navigator.clipboard.readText());
            // Links are built as https://{tenant host}/share-boost?uri=&seed=&pin= (bearer query).
            const link = new URL(url);
            expect(link.host).toBe(new URL(context.baseUrl).host);
            expect(link.pathname).toBe('/share-boost');
            for (const param of ['uri', 'seed', 'pin'])
                expect(link.searchParams.get(param)).toBeTruthy();
            await expect(page.getByText(url, { exact: true })).toBeVisible();
            // Leave the bearer link/QR screen before the step's automatic "after" capture.
            await page.goto('/wallet');
            await expect(
                page.getByRole('button', { name: 'Open profile', exact: true })
            ).toBeVisible();
            return url;
        });
        // Share links are always https://{tenant host}. The local stack has no TLS, so open the
        // identical host, path, and query over http. Nothing else about the copied link changes.
        const viewerUrl = copiedUrl.replace(/^https:/, 'http:');
        const viewer = await context.newPage('sharing-anonymous');
        await context.step(viewer, 'share-anonymous-view', async () => {
            for (const load of [() => viewer.goto(viewerUrl), () => viewer.reload()]) {
                await load();
                await expect(
                    viewer.getByRole('button', { name: 'Login', exact: true })
                ).toBeVisible({
                    timeout: UI_TIMEOUT,
                });
                await expect(viewer.getByText(title, { exact: true }).first()).toBeVisible({
                    timeout: UI_TIMEOUT,
                });
                await expect(viewer.locator('.issued-by:visible')).toHaveText(issuer);
            }
        });
        return {
            observations: {
                ownerProfileId: context.actors.learner.profileId,
                title,
                issuer,
                sharedOrigin: new URL(copiedUrl).origin,
                linkFormat: 'https://{host}/share-boost?uri=&seed=&pin=',
                openedOverHttpBecauseLocalStackHasNoTls: true,
            },
        };
    },
};
