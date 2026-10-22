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
        'share-deleted-preview-recovery',
        'share-endorsed-preview-stability',
        'share-anonymous-view',
    ],
    run: async context => {
        const title = `Verify share ${randomBytes(4).toString('hex')}`;
        const page = await context.newPage('sharing-owner', { signInAs: context.actors.learner });
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
            origin: context.baseUrl,
        });
        const publishPreview = async (credentialTitle: string): Promise<URL> => {
            await page.goto('/socialBadges', { waitUntil: 'domcontentloaded' });
            const badge = page.getByText(credentialTitle, { exact: true }).first();
            await expect(badge).toBeVisible({ timeout: UI_TIMEOUT });
            await badge.click();
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
            const link = new URL(
                new URL((await post.getAttribute('href'))!).searchParams.get('url')!
            );
            // Leave bearer-link UI before the step's automatic "after" screenshot.
            await page.goto('/wallet');
            await expect(
                page.getByRole('button', { name: 'Open profile', exact: true })
            ).toBeVisible();
            return link;
        };
        const readPreview = (link: URL, uri = link.searchParams.get('uri')!): Promise<Response> => {
            const endpoint = new URL(
                `${context.stack.brainApi}/credential-share-previews/${link.searchParams.get('preview')}`
            );
            endpoint.searchParams.set('shareUri', uri);
            return fetch(endpoint);
        };
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
        const publicLink = await context.step(page, 'share-public-preview-isolation', async () => {
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
            const shared = await publishPreview(title);
            const response = await readPreview(shared);
            expect(response.status).toBe(200);
            expect((await response.json()).name).toBe(title);
            const [after] = await wallet.invoke.learnCloudRead({ _id: unrelatedId });
            expect(after).toEqual(before);
            return shared;
        });
        await context.step(page, 'share-deleted-preview-recovery', async () => {
            const wallet = await context.sdk(context.actors.learner);
            const deletedId = publicLink.searchParams.get('preview')!;
            const [before] = await wallet.invoke.learnCloudRead({
                randomSeed: publicLink.searchParams.get('seed')!,
            });
            expect(before.publicPreviewId).toBe(deletedId);
            expect(await wallet.invoke.deleteCredentialSharePreview(deletedId)).toBe(true);
            expect((await readPreview(publicLink)).status).toBe(404);
            const replacement = await publishPreview(title);
            const replacementId = replacement.searchParams.get('preview')!;
            expect(replacementId).not.toBe(deletedId);
            expect(replacement.searchParams.get('uri')).toBe(publicLink.searchParams.get('uri'));
            const current = await readPreview(replacement);
            expect(current.status).toBe(200);
            expect((await current.json()).name).toBe(title);
            const [after] = await wallet.invoke.learnCloudRead({ _id: before._id });
            expect(after).toEqual({ ...before, publicPreviewId: replacementId });
            expect((await readPreview(publicLink)).status).toBe(404);
        });
        await context.step(page, 'share-endorsed-preview-stability', async () => {
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
            const first = await publishPreview(endorsedTitle);
            const second = await publishPreview(endorsedTitle);
            expect(second.searchParams.get('uri')).not.toBe(first.searchParams.get('uri'));
            expect(second.searchParams.get('preview')).not.toBe(first.searchParams.get('preview'));
            for (const link of [first, second]) {
                const response = await readPreview(link);
                expect(response.status).toBe(200);
                expect((await response.json()).name).toBe(endorsedTitle);
            }
            expect((await readPreview(second, first.searchParams.get('uri')!)).status).toBe(404);
            const graph = await context.inspect.neo4j(
                `MATCH (:Profile {profileId: '${context.actors.learner.profileId}'})-[:PUBLISHED_CREDENTIAL_SHARE_PREVIEW]->(preview:CredentialSharePreview) RETURN count(preview) AS n`
            );
            expect(graph).toMatch(/^n\n3$/m);
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
