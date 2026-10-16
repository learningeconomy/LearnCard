import { randomBytes } from 'node:crypto';

import { expect } from '../expect';
import type { FeatureDefinition } from '../types';
import {
    UI_TIMEOUT,
    assertStoredCredential,
    claimFromNotifications,
    issueSelfBadge,
    openStoredBadge,
    personalizeBadge,
    readIssuer,
} from './shared';

export const credentialsFeature: FeatureDefinition = {
    id: 'credentials',
    title: 'Boost yourself, reopen the stored credential, send a badge a peer claims',
    surface: 'web',
    entries: ['wallet-self-issue', 'wallet-detail-persistence', 'wallet-peer-claim'],
    run: async context => {
        const { learner, recipient } = context.actors;
        const title = `Verify self ${randomBytes(4).toString('hex')}`;
        const peerTitle = `Verify peer ${randomBytes(4).toString('hex')}`;
        const page = await context.newPage('credentials-issuer', { signInAs: learner });
        const recipientPage = await context.newPage('credentials-recipient', {
            signInAs: recipient,
        });

        await context.step(page, 'wallet-self-issue', () => issueSelfBadge(page, title));
        const { selfIssuer, selfCredential } = await context.step(
            page,
            'wallet-detail-persistence',
            async () => {
                const selfIssuer = await readIssuer(await openStoredBadge(page, title));
                const learnerLc = await context.sdk(learner);
                const selfCredential = await assertStoredCredential(learnerLc, {
                    title,
                    issuerDid: learnerLc.id.did(),
                    subjectDid: learnerLc.id.did(),
                });
                await context.record('self-stored-credential-proof', selfCredential);
                return { selfIssuer, selfCredential };
            }
        );
        await context.step(page, 'wallet-peer-send', async () => {
            await personalizeBadge(page, peerTitle);
            await page.getByPlaceholder('Search people...').fill(recipient.profileId);
            const result = page.getByRole('button').filter({
                has: page.getByText(`@${recipient.profileId}`, { exact: true }),
            });
            await expect(result).toHaveCount(1, { timeout: UI_TIMEOUT });
            await result.click();
            const send = page.getByRole('button', { name: 'Send Badge', exact: true });
            await expect(send).toBeEnabled();
            await send.click();
            await expect(
                page.getByRole('heading', { name: 'Badge sent!', exact: true })
            ).toBeVisible({
                timeout: UI_TIMEOUT,
            });
        });
        const { recipientIssuer, peerCredential } = await context.step(
            recipientPage,
            'wallet-peer-claim',
            async () => {
                await claimFromNotifications(recipientPage, peerTitle);
                const recipientIssuer = await readIssuer(
                    await openStoredBadge(recipientPage, peerTitle)
                );
                expect(recipientIssuer).toBe(selfIssuer);
                const recipientLc = await context.sdk(recipient);
                const peerCredential = await assertStoredCredential(recipientLc, {
                    title: peerTitle,
                    issuerDid: selfCredential.issuerDid,
                    subjectDid: recipientLc.id.did(),
                });
                await context.record('peer-stored-credential-proof', peerCredential);
                return { recipientIssuer, peerCredential };
            }
        );
        return {
            entries: ['wallet-self-issue', 'wallet-detail-persistence', 'wallet-peer-claim'],
            observations: {
                issuerProfileId: learner.profileId,
                recipientProfileId: recipient.profileId,
                selfTitle: title,
                peerTitle,
                selfIssuer,
                recipientIssuer,
                selfCredential,
                peerCredential,
            },
        };
    },
};
