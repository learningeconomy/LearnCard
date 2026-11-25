import { expect } from '../expect';
import type { FeatureDefinition } from '../types';
import { UI_TIMEOUT } from './shared';

export const contactsFeature: FeatureDefinition = {
    id: 'contacts',
    title: 'Find a person by handle, request a connection, accept it from Alerts, both see it',
    surface: 'web',
    entries: ['contacts-search', 'contacts-request', 'contacts-accept', 'contacts-mutual'],
    run: async context => {
        const { learner, recipient } = context.actors;
        const page = await context.newPage('contacts-requester', { signInAs: learner });
        const other = await context.newPage('contacts-recipient', { signInAs: recipient });

        await context.step(page, 'contacts-search', async () => {
            await page.getByRole('link', { name: 'Contacts', exact: true }).click();
            await page
                .getByRole('textbox', { name: 'Search', exact: true })
                .fill(recipient.profileId);
            const result = page
                .getByRole('listitem')
                .filter({ hasText: `@${recipient.profileId}` });
            await expect(result).toHaveCount(1, { timeout: UI_TIMEOUT });
            await expect(result.getByRole('button', { name: 'Request Connection' })).toBeVisible();
        });
        await context.step(page, 'contacts-request', async () => {
            await page
                .getByRole('listitem')
                .filter({ hasText: `@${recipient.profileId}` })
                .getByRole('button', { name: 'Request Connection' })
                .click();
            const confirm = page.getByRole('alertdialog', {
                name: 'Are you sure you want to send a connection request?',
            });
            await confirm.getByRole('button', { name: 'Confirm', exact: true }).click();
            await expect(confirm).toBeHidden();
        });
        await context.step(other, 'contacts-accept', async () => {
            await other.goto('/notifications');
            const accept = other.getByRole('button', { name: /^accept$/i });
            await expect(accept).toHaveCount(1, { timeout: UI_TIMEOUT });
            await accept.click();
            await expect(other.getByText('Accepted').first()).toBeVisible({ timeout: UI_TIMEOUT });
        });
        await context.step(page, 'contacts-mutual', async () => {
            // Each side, after a reload, lists the other; the network agrees.
            for (const [viewer, counterpart] of [
                [page, recipient],
                [other, learner],
            ] as const) {
                await viewer.goto('/contacts');
                await viewer.reload();
                await expect(viewer.getByRole('button', { name: '1 Contacts' })).toBeVisible({
                    timeout: UI_TIMEOUT,
                });
                await viewer.getByRole('button', { name: '1 Contacts' }).click();
                await expect(viewer.getByText(`@${counterpart.profileId}`).first()).toBeVisible({
                    timeout: UI_TIMEOUT,
                });
            }
            const connections = await (await context.sdk(learner)).invoke.getConnections();
            expect(connections.map(profile => profile.profileId)).toContain(recipient.profileId);
        });
        return {
            observations: { requester: learner.profileId, accepter: recipient.profileId },
        };
    },
};
