import { randomBytes, randomUUID } from 'node:crypto';

import { prepareFixtureById } from '@learncard/credential-library';

import { expect } from '../expect';
import type { FeatureDefinition } from '../types';
import { UI_TIMEOUT, issueSelfBadge, openStoredBadge, readIssuer } from './shared';
import { boostTemplate } from './sdk';

export const sharingFeature: FeatureDefinition = {
    id: 'sharing',
    title: 'Copy a real credential share link and open it as an anonymous viewer',
    surface: 'web',
    entries: [
        'share-menu-copy',
        'share-public-preview-isolation',
        'share-endorsed-preview-reuse',
        'share-anonymous-view',
    ],
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
        await context.step(page, 'share-public-preview-isolation', async () => {
            const wallet = await context.sdk(context.actors.learner);
            const unrelatedIndex = {
                type: 'shared-credentials',
                sharedCredentialUri: `urn:another-credential:${randomUUID()}`,
                uri: `urn:another-presentation:${randomUUID()}`,
                randomSeed: randomBytes(30).toString('hex'),
                pin: '4321',
            };
            await wallet.invoke.learnCloudCreate(unrelatedIndex);
            const [before] = await wallet.invoke.learnCloudRead({
                sharedCredentialUri: unrelatedIndex.sharedCredentialUri,
            });
            expect(before).toMatchObject({ ...unrelatedIndex, _id: expect.any(String) });
            const unrelatedId = before._id;
            await openStoredBadge(page, title);
            await page
                .getByRole('dialog')
                .getByRole('button', { name: 'More options', exact: true })
                .click();
            await page.getByRole('button', { name: 'Share', exact: true }).click();
            const enable = page.getByRole('button', { name: 'Enable Public Preview', exact: true });
            await expect(enable).toBeEnabled({ timeout: UI_TIMEOUT });
            await enable.click();
            const post = page.getByRole('link', { name: 'Post to LinkedIn', exact: true });
            await expect(post).toHaveAttribute('href', /preview%3D/i, { timeout: UI_TIMEOUT });
            const composer = new URL((await post.getAttribute('href'))!);
            const shared = new URL(composer.searchParams.get('url')!);
            // Leave bearer-link UI before recording or asserting storage invariants.
            await page.goto('/wallet');
            const target = new URL(
                `${context.stack.brainApi}/credential-share-previews/${shared.searchParams.get('preview')}`
            );
            target.searchParams.set('shareUri', shared.searchParams.get('uri')!);
            const response = await fetch(target);
            expect(response.status).toBe(200);
            expect((await response.json()).name).toBe(title);
            const [after] = await wallet.invoke.learnCloudRead({ _id: unrelatedId });
            expect(after).toEqual(before);
        });
        await context.step(page, 'share-endorsed-preview-reuse', async () => {
            const wallet = await context.sdk(context.actors.learner);
            const endorser = await context.sdk(context.actors.recipient);
            const endorsedTitle = `Verify endorsed ${randomBytes(4).toString('hex')}`;
            const credentialId = `urn:uuid:${randomUUID()}`;
            const credential = await wallet.invoke.issueCredential({
                ...boostTemplate(wallet.id.did(), endorsedTitle),
                id: credentialId,
            });
            const credentialUri = await wallet.store.LearnCloud.uploadEncrypted!(credential);
            await wallet.index.LearnCloud.add({
                id: randomUUID(),
                uri: credentialUri,
                category: 'Social Badge',
            });
            const template = prepareFixtureById('obv3/endorsement-credential', {
                issuerDid: endorser.id.did(),
            });
            template['@context'] = credential['@context'];
            template.issuer = endorser.id.did();
            template.name = `Endorsement for ${endorsedTitle}`;
            template.description = 'A synthetic endorsement for the owned verification journey.';
            template.credentialSubject = {
                id: credentialId,
                type: ['EndorsementSubject'],
                endorsementComment: 'Observed in the owned verification stack.',
            };
            delete template.credentialStatus;
            delete template.credentialSchema;
            const endorsement = await endorser.invoke.issueCredential(template);
            const verified = await wallet.invoke.verifyCredential(endorsement);
            expect(verified.errors).toEqual([]);
            expect(verified.checks).toContain('proof');
            await wallet.index.LearnCloud.add({
                id: randomUUID(),
                uri: await wallet.store.LearnCloud.uploadEncrypted!(endorsement),
                category: 'Endorsement',
                originalCredentialId: credentialId,
                visibility: 'public',
            });
            const publish = async () => {
                await page.goto('/socialBadges', { waitUntil: 'domcontentloaded' });
                const badge = page.getByText(endorsedTitle, { exact: true }).first();
                await expect(badge).toBeVisible({ timeout: UI_TIMEOUT });
                await badge.click();
                await page
                    .getByRole('dialog')
                    .getByRole('button', { name: 'More options', exact: true })
                    .click();
                await page.getByRole('button', { name: 'Share', exact: true }).click();
                const enable = page.getByRole('button', {
                    name: 'Enable Public Preview',
                    exact: true,
                });
                await expect(enable).toBeEnabled({ timeout: UI_TIMEOUT });
                await enable.click();
                const post = page.getByRole('link', { name: 'Post to LinkedIn', exact: true });
                await expect(post).toHaveAttribute('href', /preview%3D/i, { timeout: UI_TIMEOUT });
                const link = new URL(
                    new URL((await post.getAttribute('href'))!).searchParams.get('url')!
                );
                await page.goto('/wallet');
                return link;
            };
            const first = await publish();
            const second = await publish();
            expect(second.searchParams.get('uri')).not.toBe(first.searchParams.get('uri'));
            expect(second.searchParams.get('preview')).toBe(first.searchParams.get('preview'));
            const endpoint = new URL(
                `${context.stack.brainApi}/credential-share-previews/${second.searchParams.get('preview')}`
            );
            endpoint.searchParams.set('shareUri', first.searchParams.get('uri')!);
            expect((await fetch(endpoint)).status).toBe(404);
            endpoint.searchParams.set('shareUri', second.searchParams.get('uri')!);
            const current = await fetch(endpoint);
            expect(current.status).toBe(200);
            expect((await current.json()).name).toBe(endorsedTitle);
            const graph = await context.inspect.neo4j(
                `MATCH (:Profile {profileId: '${context.actors.learner.profileId}'})-[:PUBLISHED_CREDENTIAL_SHARE_PREVIEW]->(preview:CredentialSharePreview) RETURN count(preview) AS n`
            );
            expect(graph).toMatch(/^n\n2$/m);
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
