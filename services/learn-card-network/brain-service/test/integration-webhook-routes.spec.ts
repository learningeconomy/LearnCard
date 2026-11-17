import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Integration, Profile } from '@models';
import * as integrationUpdate from '@accesslayer/integration/update';
import { getIntegrationWebhookDeliveryConfig } from '@accesslayer/integration/webhook';

import { getUser } from './helpers/getClient';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let readOnlyA: Awaited<ReturnType<typeof getUser>>;

const SECRET_PATTERN = /^whsec_[A-Za-z0-9_-]{43}$/;

// The first hook also boots the wallet and the database connection, which can be slow.
vi.setConfig({ hookTimeout: 30_000 });

describe('Integration webhook routes', () => {
    let integrationId: string;

    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
        readOnlyA = await getUser('a'.repeat(64), 'integrations:read');
    });

    beforeEach(async () => {
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

        integrationId = await userA.clients.fullAuth.integrations.addIntegration({
            name: 'Hooks',
            whitelistedDomains: [],
        });
    });

    it('setIntegrationWebhook returns the signing secret once, when it creates the first one', async () => {
        const before = await userA.clients.fullAuth.integrations.getIntegration({
            id: integrationId,
        });

        expect(before?.hasWebhookSecret).toBe(false);
        expect(before?.webhookUrl).toBeUndefined();
        expect(before?.contractEventsEnabledAt).toBeUndefined();

        const registration = await userA.clients.fullAuth.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: 'https://hooks.example.com/learncard',
        });

        expect(registration.webhookUrl).toBe('https://hooks.example.com/learncard');
        expect(registration.secret).toMatch(SECRET_PATTERN);
        expect(typeof registration.contractEventsEnabledAt).toBe('string');

        // The returned secret is the one deliveries are signed with.
        const config = await getIntegrationWebhookDeliveryConfig(integrationId);

        expect(config?.secrets).toEqual([registration.secret]);

        const after = await userA.clients.fullAuth.integrations.getIntegration({
            id: integrationId,
        });

        expect(after?.webhookUrl).toBe('https://hooks.example.com/learncard');
        expect(after?.hasWebhookSecret).toBe(true);
        expect(after?.contractEventsEnabledAt).toBe(registration.contractEventsEnabledAt);
        expect(JSON.stringify(after)).not.toContain('whsec');
        expect(after).not.toHaveProperty('webhookSecretEnc');
    });

    it('setIntegrationWebhook keeps the secret and does not return it when the URL is replaced', async () => {
        const first = await userA.clients.fullAuth.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: 'https://hooks.example.com/a',
        });
        const second = await userA.clients.fullAuth.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: 'https://hooks.example.com/b',
        });

        expect(second).toEqual({
            webhookUrl: 'https://hooks.example.com/b',
            contractEventsEnabledAt: first.contractEventsEnabledAt,
        });

        const config = await getIntegrationWebhookDeliveryConfig(integrationId);

        expect(config?.webhookUrl).toBe('https://hooks.example.com/b');
        expect(config?.secrets).toEqual([first.secret]);
    });

    it('setIntegrationWebhook removes the URL with null and keeps the secret and enabled time', async () => {
        const first = await userA.clients.fullAuth.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: 'https://hooks.example.com/learncard',
        });

        await expect(
            userA.clients.fullAuth.integrations.setIntegrationWebhook({
                id: integrationId,
                webhookUrl: null,
            })
        ).resolves.toEqual({
            webhookUrl: null,
            contractEventsEnabledAt: first.contractEventsEnabledAt,
        });

        const after = await userA.clients.fullAuth.integrations.getIntegration({
            id: integrationId,
        });

        expect(after?.webhookUrl).toBeUndefined();
        expect(after?.hasWebhookSecret).toBe(true);

        // Setting a URL again reuses the secret, so nothing is returned.
        const again = await userA.clients.fullAuth.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: 'https://hooks.example.com/learncard',
        });

        expect(again.secret).toBeUndefined();
    });

    it('setIntegrationWebhook returns no secret when one was already created by a rotation', async () => {
        await userA.clients.fullAuth.integrations.rotateIntegrationWebhookSecret({
            id: integrationId,
        });

        const registration = await userA.clients.fullAuth.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: 'https://hooks.example.com/learncard',
        });

        expect(registration.secret).toBeUndefined();
        expect(registration.webhookUrl).toBe('https://hooks.example.com/learncard');
    });

    it('setIntegrationWebhook with null on a new integration creates nothing', async () => {
        await expect(
            userA.clients.fullAuth.integrations.setIntegrationWebhook({
                id: integrationId,
                webhookUrl: null,
            })
        ).resolves.toEqual({ webhookUrl: null });

        const after = await userA.clients.fullAuth.integrations.getIntegration({
            id: integrationId,
        });

        expect(after?.hasWebhookSecret).toBe(false);
        expect(after?.contractEventsEnabledAt).toBeUndefined();
    });

    it.each([
        'ftp://hooks.example.com/learncard',
        'httpx://hooks.example.com/learncard',
        'httpss://hooks.example.com/learncard',
        'not a url',
        'https://user:pass@hooks.example.com/learncard',
        'https://user@hooks.example.com/learncard',
    ])('setIntegrationWebhook rejects %j', async webhookUrl => {
        await expect(
            userA.clients.fullAuth.integrations.setIntegrationWebhook({
                id: integrationId,
                webhookUrl,
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it.each(['http://hooks.example.com/learncard', 'https://hooks.example.com/learncard'])(
        'setIntegrationWebhook accepts %j',
        async webhookUrl => {
            await expect(
                userA.clients.fullAuth.integrations.setIntegrationWebhook({
                    id: integrationId,
                    webhookUrl,
                })
            ).resolves.toMatchObject({ webhookUrl });
        }
    );

    it('setIntegrationWebhook is refused for another profile and without integrations:write', async () => {
        await expect(
            userB.clients.fullAuth.integrations.setIntegrationWebhook({
                id: integrationId,
                webhookUrl: 'https://hooks.example.com/learncard',
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            readOnlyA.clients.fullAuth.integrations.setIntegrationWebhook({
                id: integrationId,
                webhookUrl: 'https://hooks.example.com/learncard',
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

        const after = await userA.clients.fullAuth.integrations.getIntegration({
            id: integrationId,
        });

        expect(after?.webhookUrl).toBeUndefined();
    });

    it('updateIntegration no longer sets a webhook URL', async () => {
        await userA.clients.fullAuth.integrations.updateIntegration({
            id: integrationId,
            // The field was removed from the validator; an old client that still sends it is ignored.
            updates: { name: 'Renamed', webhookUrl: 'https://hooks.example.com/learncard' } as {
                name: string;
            },
        });

        const after = await userA.clients.fullAuth.integrations.getIntegration({
            id: integrationId,
        });

        expect(after?.name).toBe('Renamed');
        expect(after?.webhookUrl).toBeUndefined();
        expect(after?.hasWebhookSecret).toBe(false);
        expect(after?.contractEventsEnabledAt).toBeUndefined();
    });

    it('updateIntegration can change the name and enable contract events in one call', async () => {
        await userA.clients.fullAuth.integrations.updateIntegration({
            id: integrationId,
            updates: { name: 'Renamed', contractEventsEnabled: true },
        });

        const after = await userA.clients.fullAuth.integrations.getIntegration({
            id: integrationId,
        });

        expect(after?.name).toBe('Renamed');
        expect(typeof after?.contractEventsEnabledAt).toBe('string');
        expect(after?.hasWebhookSecret).toBe(false);
    });

    it('updateIntegration does not flip contract events when the field update fails', async () => {
        const failing = vi
            .spyOn(integrationUpdate, 'updateIntegration')
            .mockRejectedValueOnce(new Error('write failed'));

        await expect(
            userA.clients.fullAuth.integrations.updateIntegration({
                id: integrationId,
                updates: { name: 'Renamed', contractEventsEnabled: true },
            })
        ).rejects.toThrow();
        failing.mockRestore();

        const after = await userA.clients.fullAuth.integrations.getIntegration({
            id: integrationId,
        });

        expect(after?.name).toBe('Hooks');
        expect(after?.contractEventsEnabledAt).toBeUndefined();

        // Retrying the same call succeeds and applies both writes.
        await userA.clients.fullAuth.integrations.updateIntegration({
            id: integrationId,
            updates: { name: 'Renamed', contractEventsEnabled: true },
        });

        const retried = await userA.clients.fullAuth.integrations.getIntegration({
            id: integrationId,
        });

        expect(retried?.name).toBe('Renamed');
        expect(typeof retried?.contractEventsEnabledAt).toBe('string');
    });

    it('updateIntegration disables events with false and leaves the URL and secret alone', async () => {
        await userA.clients.fullAuth.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: 'https://hooks.example.com/learncard',
        });
        await userA.clients.fullAuth.integrations.updateIntegration({
            id: integrationId,
            updates: { contractEventsEnabled: false },
        });

        const after = await userA.clients.fullAuth.integrations.getIntegration({
            id: integrationId,
        });

        expect(after?.webhookUrl).toBe('https://hooks.example.com/learncard');
        expect(after?.contractEventsEnabledAt).toBeUndefined();
        expect(after?.hasWebhookSecret).toBe(true);
    });

    it('getIntegrations never returns secrets', async () => {
        await userA.clients.fullAuth.integrations.setIntegrationWebhook({
            id: integrationId,
            webhookUrl: 'https://hooks.example.com/learncard',
        });

        const page = await userA.clients.fullAuth.integrations.getIntegrations();

        expect(page.records).toHaveLength(1);
        expect(page.records[0]?.hasWebhookSecret).toBe(true);
        expect(JSON.stringify(page)).not.toContain('whsec');
    });

    it('rotateIntegrationWebhookSecret returns a secret once and keeps the previous for 24 hours', async () => {
        const first = await userA.clients.fullAuth.integrations.rotateIntegrationWebhookSecret({
            id: integrationId,
        });

        expect(first.secret).toMatch(SECRET_PATTERN);
        expect(first.previousSecretExpiresAt).toBeUndefined();

        const second = await userA.clients.fullAuth.integrations.rotateIntegrationWebhookSecret({
            id: integrationId,
        });

        expect(second.secret).toMatch(SECRET_PATTERN);
        expect(second.secret).not.toBe(first.secret);
        expect(typeof second.previousSecretExpiresAt).toBe('string');

        const read = await userA.clients.fullAuth.integrations.getIntegration({
            id: integrationId,
        });

        expect(read?.hasWebhookSecret).toBe(true);
        expect(JSON.stringify(read)).not.toContain(second.secret);
    });

    it('rotateIntegrationWebhookSecret is refused for another profile', async () => {
        await expect(
            userB.clients.fullAuth.integrations.rotateIntegrationWebhookSecret({
                id: integrationId,
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('rotateIntegrationWebhookSecret needs the integrations:write scope', async () => {
        await expect(
            readOnlyA.clients.fullAuth.integrations.rotateIntegrationWebhookSecret({
                id: integrationId,
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });
});
