import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Integration, Profile } from '@models';

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

    it('updateIntegration sets the webhook URL and exposes only public fields', async () => {
        const before = await userA.clients.fullAuth.integrations.getIntegration({
            id: integrationId,
        });

        expect(before?.hasWebhookSecret).toBe(false);
        expect(before?.webhookUrl).toBeUndefined();
        expect(before?.contractEventsEnabledAt).toBeUndefined();

        await expect(
            userA.clients.fullAuth.integrations.updateIntegration({
                id: integrationId,
                updates: { webhookUrl: 'https://hooks.example.com/learncard' },
            })
        ).resolves.toBe(true);

        const after = await userA.clients.fullAuth.integrations.getIntegration({
            id: integrationId,
        });

        expect(after?.webhookUrl).toBe('https://hooks.example.com/learncard');
        expect(after?.hasWebhookSecret).toBe(true);
        expect(typeof after?.contractEventsEnabledAt).toBe('string');
        expect(JSON.stringify(after)).not.toContain('whsec');
        expect(after).not.toHaveProperty('webhookSecretEnc');
    });

    it('updateIntegration can change the name and the webhook in one call', async () => {
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

    it('updateIntegration removes the URL with null and disables events with false', async () => {
        await userA.clients.fullAuth.integrations.updateIntegration({
            id: integrationId,
            updates: { webhookUrl: 'https://hooks.example.com/learncard' },
        });
        await userA.clients.fullAuth.integrations.updateIntegration({
            id: integrationId,
            updates: { webhookUrl: null, contractEventsEnabled: false },
        });

        const after = await userA.clients.fullAuth.integrations.getIntegration({
            id: integrationId,
        });

        expect(after?.webhookUrl).toBeUndefined();
        expect(after?.contractEventsEnabledAt).toBeUndefined();
        expect(after?.hasWebhookSecret).toBe(true);
    });

    it('updateIntegration rejects a URL that is not http(s)', async () => {
        await expect(
            userA.clients.fullAuth.integrations.updateIntegration({
                id: integrationId,
                updates: { webhookUrl: 'ftp://hooks.example.com/learncard' },
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('getIntegrations never returns secrets', async () => {
        await userA.clients.fullAuth.integrations.updateIntegration({
            id: integrationId,
            updates: { webhookUrl: 'https://hooks.example.com/learncard' },
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
