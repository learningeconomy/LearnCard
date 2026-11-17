import { beforeEach, describe, expect, it, vi } from 'vitest';

import { neogma } from '@instance';
import { Integration, Profile } from '@models';

import { createIntegration } from '@accesslayer/integration/create';
import { readIntegrationById } from '@accesslayer/integration/read';
import {
    getIntegrationWebhookDeliveryConfig,
    readIntegrationWebhookStatus,
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

        expect(updated).toEqual({
            webhookUrl: 'https://hooks.example.com/a',
            secret: expect.stringMatching(SECRET_PATTERN),
            contractEventsEnabledAt: stored.contractEventsEnabledAt,
        });
        expect(stored.webhookUrl).toBe('https://hooks.example.com/a');
        expect(typeof stored.contractEventsEnabledAt).toBe('string');
        await expect(decryptWebhookSecret(String(stored.webhookSecretEnc))).resolves.toBe(
            updated?.secret
        );
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

    it('returns the first secret to exactly one of two concurrent registrations', async () => {
        const results = await Promise.all([
            setIntegrationWebhookConfig({ integrationId, webhookUrl: 'https://a.example.com' }),
            setIntegrationWebhookConfig({ integrationId, webhookUrl: 'https://b.example.com' }),
        ]);
        const secrets = results.flatMap(result => (result?.secret ? [result.secret] : []));
        const stored = await readStored(integrationId);

        expect(secrets).toHaveLength(1);
        await expect(decryptWebhookSecret(String(stored.webhookSecretEnc))).resolves.toBe(
            secrets[0]
        );
    });

    it('returns null for an unknown integration', async () => {
        await expect(
            setIntegrationWebhookConfig({ integrationId: 'missing', contractEventsEnabled: true })
        ).resolves.toBeNull();
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

    it('overlapping rotations each keep the secret of the one before as previous', async () => {
        const created = await setIntegrationWebhookConfig({
            integrationId,
            webhookUrl: 'https://hooks.example.com/a',
        });
        const original = String(created?.secret);
        const ROTATIONS = 8;

        // Hold the node's write lock in another transaction while the rotations start, so all of
        // them are in flight together. Rotations that read the secret before taking the lock all
        // see the original one; rotations that lock first queue up and see each other's.
        const session = neogma.driver.session();
        const holder = session.beginTransaction();

        let rotations: Awaited<ReturnType<typeof rotateWebhookSecretForIntegration>>[];

        try {
            await holder.run(
                'MATCH (integration:Integration {id: $id}) SET integration.lockProbe = 1',
                {
                    id: integrationId,
                }
            );

            const pending = Array.from({ length: ROTATIONS }, () =>
                rotateWebhookSecretForIntegration(integrationId)
            );

            await new Promise(resolve => setTimeout(resolve, 1_000));
            await holder.commit();
            rotations = await Promise.all(pending);
        } finally {
            await session.close();
        }

        const returned = rotations.map(rotation => String(rotation?.secret));
        const config = await getIntegrationWebhookDeliveryConfig(integrationId);
        const status = await readIntegrationWebhookStatus(integrationId);

        // Every rotation counted exactly once.
        expect(new Set(returned).size).toBe(ROTATIONS);
        expect(status?.secretVersion).toBe(1 + ROTATIONS);
        // Every rotation had a previous secret to keep.
        expect(
            rotations.every(rotation => typeof rotation?.previousSecretExpiresAt === 'string')
        ).toBe(true);

        // The stored pair is two of the returned secrets: the last rotation's secret and the one
        // the rotation before it made current. The original is no longer kept.
        expect(config?.secrets).toHaveLength(2);

        const [current, previous] = config?.secrets ?? [];

        expect(returned).toContain(current);
        expect(returned).toContain(previous);
        expect(previous).not.toBe(current);
        expect(config?.secrets).not.toContain(original);
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
