import { beforeEach, describe, expect, it, vi } from 'vitest';

import { neogma } from '@instance';
import { Integration, Profile } from '@models';

import { createIntegration } from '@accesslayer/integration/create';
import {
    getIntegrationWebhookDeliveryConfig,
    rotateWebhookSecretForIntegration,
    setIntegrationWebhookConfig,
} from '@accesslayer/integration/webhook';

// The first hook also boots the wallet and the database connection, which can be slow.
vi.setConfig({ hookTimeout: 30_000 });

describe('getIntegrationWebhookDeliveryConfig', () => {
    let integrationId: string;

    beforeEach(async () => {
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });

        const integration = await createIntegration({ name: 'Delivery', whitelistedDomains: [] });
        integrationId = integration.id;
    });

    it('returns null for an unknown integration', async () => {
        await expect(getIntegrationWebhookDeliveryConfig('missing')).resolves.toBeNull();
    });

    it('returns null when there is no webhook URL, even with a secret', async () => {
        await expect(getIntegrationWebhookDeliveryConfig(integrationId)).resolves.toBeNull();

        await rotateWebhookSecretForIntegration(integrationId);

        await expect(getIntegrationWebhookDeliveryConfig(integrationId)).resolves.toBeNull();
    });

    it('returns the URL and the current secret', async () => {
        await setIntegrationWebhookConfig({
            integrationId,
            webhookUrl: 'https://hooks.example.com/a',
        });
        const rotation = await rotateWebhookSecretForIntegration(integrationId);

        // The secret generated with the URL is now the previous one, still valid for 24 hours.
        const config = await getIntegrationWebhookDeliveryConfig(integrationId);

        expect(config?.webhookUrl).toBe('https://hooks.example.com/a');
        expect(config?.secrets).toHaveLength(2);
        expect(config?.secrets[0]).toBe(rotation?.secret);
        expect(config?.secrets[1]).toMatch(/^whsec_[A-Za-z0-9_-]{43}$/);
        expect(config?.secrets[1]).not.toBe(rotation?.secret);
    });

    it('returns the current secret first and the previous one second after a rotation', async () => {
        await setIntegrationWebhookConfig({
            integrationId,
            webhookUrl: 'https://hooks.example.com/a',
        });
        const first = await rotateWebhookSecretForIntegration(integrationId);
        const second = await rotateWebhookSecretForIntegration(integrationId);

        await expect(getIntegrationWebhookDeliveryConfig(integrationId)).resolves.toEqual({
            webhookUrl: 'https://hooks.example.com/a',
            secrets: [second?.secret, first?.secret],
        });
    });

    it('leaves out the previous secret once it has expired', async () => {
        await setIntegrationWebhookConfig({
            integrationId,
            webhookUrl: 'https://hooks.example.com/a',
        });
        await rotateWebhookSecretForIntegration(integrationId);
        const second = await rotateWebhookSecretForIntegration(integrationId);

        await neogma.queryRunner.run(
            `MATCH (integration:Integration {id: $id})
             SET integration.webhookSecretPrevExpiresAt = '2020-01-01T00:00:00.000Z'`,
            { id: integrationId }
        );

        await expect(getIntegrationWebhookDeliveryConfig(integrationId)).resolves.toEqual({
            webhookUrl: 'https://hooks.example.com/a',
            secrets: [second?.secret],
        });
    });
});
