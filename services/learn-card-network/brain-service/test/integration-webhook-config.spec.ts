import { beforeEach, describe, expect, it, vi } from 'vitest';

import { neogma } from '@instance';
import { Integration, Profile } from '@models';

import { createIntegration } from '@accesslayer/integration/create';
import { readIntegrationById } from '@accesslayer/integration/read';
import {
    rotateWebhookSecretForIntegration,
    setIntegrationWebhookConfig,
} from '@accesslayer/integration/webhook';
import { decryptWebhookSecret } from '@helpers/integration-webhook-secret.helpers';

const readStored = async (id: string): Promise<Record<string, unknown>> => {
    const result = await neogma.queryRunner.run(
        'MATCH (integration:Integration {id: $id}) RETURN integration',
        { id }
    );

    return result.records[0]?.get('integration').properties ?? {};
};

const SECRET_PATTERN = /^whsec_[A-Za-z0-9_-]{43}$/;

// The first hook also boots the wallet and the database connection, which can be slow.
vi.setConfig({ hookTimeout: 30_000 });

describe('Integration webhook configuration (access layer)', () => {
    let integrationId: string;

    beforeEach(async () => {
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });

        const integration = await createIntegration({ name: 'Hooks', whitelistedDomains: [] });
        integrationId = integration.id;
    });

    it('generates a secret and enables events the first time a URL is set', async () => {
        const updated = await setIntegrationWebhookConfig({
            integrationId,
            webhookUrl: 'https://hooks.example.com/a',
        });
        const stored = await readStored(integrationId);

        expect(updated).toBe(true);
        expect(stored.webhookUrl).toBe('https://hooks.example.com/a');
        expect(typeof stored.contractEventsEnabledAt).toBe('string');
        expect(String(stored.webhookSecretEnc).startsWith('lc-whsec-jwe:v1:')).toBe(true);
        expect(String(stored.webhookSecretEnc)).not.toContain('whsec_');
        await expect(decryptWebhookSecret(String(stored.webhookSecretEnc))).resolves.toMatch(
            SECRET_PATTERN
        );
    });

    it('keeps the secret and the enabled time when the URL changes', async () => {
        await setIntegrationWebhookConfig({ integrationId, webhookUrl: 'https://a.example.com' });
        const first = await readStored(integrationId);

        await setIntegrationWebhookConfig({ integrationId, webhookUrl: 'https://b.example.com' });
        const second = await readStored(integrationId);

        expect(second.webhookUrl).toBe('https://b.example.com');
        expect(second.webhookSecretEnc).toBe(first.webhookSecretEnc);
        expect(second.contractEventsEnabledAt).toBe(first.contractEventsEnabledAt);
    });

    it('enables the feed without a webhook and without a secret', async () => {
        await setIntegrationWebhookConfig({ integrationId, contractEventsEnabled: true });
        const stored = await readStored(integrationId);

        expect(typeof stored.contractEventsEnabledAt).toBe('string');
        expect(stored.webhookUrl).toBeUndefined();
        expect(stored.webhookSecretEnc).toBeUndefined();
    });

    it('removes the URL with null but keeps the secret and the feed', async () => {
        await setIntegrationWebhookConfig({ integrationId, webhookUrl: 'https://a.example.com' });
        await setIntegrationWebhookConfig({ integrationId, webhookUrl: null });
        const stored = await readStored(integrationId);

        expect(stored.webhookUrl).toBeUndefined();
        expect(typeof stored.webhookSecretEnc).toBe('string');
        expect(typeof stored.contractEventsEnabledAt).toBe('string');
    });

    it('disables events with contractEventsEnabled false, even with a URL in the same call', async () => {
        await setIntegrationWebhookConfig({
            integrationId,
            webhookUrl: 'https://a.example.com',
            contractEventsEnabled: false,
        });
        const stored = await readStored(integrationId);

        expect(stored.webhookUrl).toBe('https://a.example.com');
        expect(stored.contractEventsEnabledAt).toBeUndefined();
    });

    it('leaves the URL alone when webhookUrl is not passed', async () => {
        await setIntegrationWebhookConfig({ integrationId, webhookUrl: 'https://a.example.com' });
        await setIntegrationWebhookConfig({ integrationId, contractEventsEnabled: true });

        expect((await readStored(integrationId)).webhookUrl).toBe('https://a.example.com');
    });

    it('returns false for an unknown integration', async () => {
        await expect(
            setIntegrationWebhookConfig({ integrationId: 'missing', contractEventsEnabled: true })
        ).resolves.toBe(false);
        await expect(rotateWebhookSecretForIntegration('missing')).resolves.toBeNull();
    });

    it('rotates: first reveal has no previous secret', async () => {
        const rotation = await rotateWebhookSecretForIntegration(integrationId);
        const stored = await readStored(integrationId);

        expect(rotation?.secret).toMatch(SECRET_PATTERN);
        expect(rotation?.previousSecretExpiresAt).toBeUndefined();
        expect(stored.webhookSecretPrevEnc).toBeUndefined();
        expect(stored.webhookSecretPrevExpiresAt).toBeUndefined();
        await expect(decryptWebhookSecret(String(stored.webhookSecretEnc))).resolves.toBe(
            rotation?.secret
        );
    });

    it('rotates: keeps the previous secret for 24 hours', async () => {
        const first = await rotateWebhookSecretForIntegration(integrationId);
        const before = Date.now();
        const second = await rotateWebhookSecretForIntegration(integrationId);
        const stored = await readStored(integrationId);

        expect(second?.secret).not.toBe(first?.secret);
        expect(stored.webhookSecretPrevExpiresAt).toBe(second?.previousSecretExpiresAt);

        const expiresInMs = new Date(String(second?.previousSecretExpiresAt)).getTime() - before;
        expect(expiresInMs).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 1000);
        expect(expiresInMs).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 60 * 1000);

        await expect(decryptWebhookSecret(String(stored.webhookSecretPrevEnc))).resolves.toBe(
            first?.secret
        );
        await expect(decryptWebhookSecret(String(stored.webhookSecretEnc))).resolves.toBe(
            second?.secret
        );
    });

    it('never exposes secrets through readIntegrationById', async () => {
        await setIntegrationWebhookConfig({ integrationId, webhookUrl: 'https://a.example.com' });
        await rotateWebhookSecretForIntegration(integrationId);

        const read = await readIntegrationById(integrationId);

        expect(read?.webhookUrl).toBe('https://a.example.com');
        expect(read?.hasWebhookSecret).toBe(true);
        expect(typeof read?.contractEventsEnabledAt).toBe('string');
        expect(read).not.toHaveProperty('webhookSecretEnc');
        expect(read).not.toHaveProperty('webhookSecretPrevEnc');
        expect(read).not.toHaveProperty('webhookSecretPrevExpiresAt');
        expect(JSON.stringify(read)).not.toContain('whsec');
    });
});
