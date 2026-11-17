import { neogma } from '@instance';
import { WEBHOOK_SECRET_PREVIOUS_TTL_MS } from 'src/constants/integration-events';
import {
    decryptWebhookSecret,
    encryptWebhookSecret,
    generateWebhookSecret,
} from '@helpers/integration-webhook-secret.helpers';

export type IntegrationWebhookConfigInput = {
    integrationId: string;
    /** A string sets the URL, null removes it, undefined leaves it unchanged. */
    webhookUrl?: string | null;
    /** true enables contract events (if not already enabled), false disables them. */
    contractEventsEnabled?: boolean;
};

export type IntegrationWebhookSecretRotationResult = {
    secret: string;
    previousSecretExpiresAt?: string;
};

/**
 * Writes the webhook URL and the contract-events switch of an Integration.
 * Returns false when the Integration does not exist.
 */
export const setIntegrationWebhookConfig = async ({
    integrationId,
    webhookUrl,
    contractEventsEnabled,
}: IntegrationWebhookConfigInput): Promise<boolean> => {
    const settingUrl = typeof webhookUrl === 'string';

    // Only used by the query when the Integration has no secret yet.
    const newSecretEnc = settingUrl ? await encryptWebhookSecret(generateWebhookSecret()) : null;

    const result = await neogma.queryRunner.run(
        `MATCH (integration:Integration {id: $id})
         SET integration.webhookUrl = CASE WHEN $setUrl THEN $webhookUrl ELSE integration.webhookUrl END,
             integration.webhookSecretEnc = CASE
                 WHEN $webhookUrl IS NOT NULL AND integration.webhookSecretEnc IS NULL THEN $newSecretEnc
                 ELSE integration.webhookSecretEnc END,
             integration.contractEventsEnabledAt = CASE
                 WHEN $contractEventsEnabled = false THEN null
                 WHEN ($contractEventsEnabled = true OR $webhookUrl IS NOT NULL)
                     AND integration.contractEventsEnabledAt IS NULL THEN $now
                 ELSE integration.contractEventsEnabledAt END,
             integration.updatedAt = $now
         RETURN integration.id AS id`,
        {
            id: integrationId,
            setUrl: webhookUrl !== undefined,
            webhookUrl: webhookUrl ?? null,
            newSecretEnc,
            contractEventsEnabled: contractEventsEnabled ?? null,
            now: new Date().toISOString(),
        }
    );

    return result.records.length > 0;
};

/**
 * Stores a new signing secret and returns it in plaintext. The secret it replaces stays valid
 * for 24 hours. Returns null when the Integration does not exist.
 */
export const rotateWebhookSecretForIntegration = async (
    integrationId: string
): Promise<IntegrationWebhookSecretRotationResult | null> => {
    const secret = generateWebhookSecret();
    const secretEnc = await encryptWebhookSecret(secret);
    const now = new Date();
    const previousExpiresAt = new Date(
        now.getTime() + WEBHOOK_SECRET_PREVIOUS_TTL_MS
    ).toISOString();

    const result = await neogma.queryRunner.run(
        `MATCH (integration:Integration {id: $id})
         WITH integration, integration.webhookSecretEnc AS previous
         SET integration.webhookSecretPrevEnc = previous,
             integration.webhookSecretPrevExpiresAt = CASE
                 WHEN previous IS NULL THEN null ELSE $previousExpiresAt END,
             integration.webhookSecretEnc = $secretEnc,
             integration.updatedAt = $now
         RETURN previous IS NOT NULL AS hadPrevious`,
        { id: integrationId, secretEnc, previousExpiresAt, now: now.toISOString() }
    );

    const record = result.records[0];

    if (!record) return null;

    return record.get('hadPrevious') === true
        ? { secret, previousSecretExpiresAt: previousExpiresAt }
        : { secret };
};

export type IntegrationWebhookDeliveryConfig = {
    webhookUrl: string;
    /** Plaintext signing secrets: the current one first, then the previous one while it is valid. */
    secrets: string[];
};

/**
 * Reads what signed delivery needs: the webhook URL and the decrypted signing secrets.
 * Returns null when the Integration does not exist, has no webhook URL, or has no secret.
 * The result must never be returned by a route or written to a log.
 */
export const getIntegrationWebhookDeliveryConfig = async (
    integrationId: string
): Promise<IntegrationWebhookDeliveryConfig | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (integration:Integration {id: $id})
         RETURN integration.webhookUrl AS webhookUrl,
             integration.webhookSecretEnc AS secretEnc,
             integration.webhookSecretPrevEnc AS previousEnc,
             integration.webhookSecretPrevExpiresAt AS previousExpiresAt`,
        { id: integrationId }
    );
    const record = result.records[0];

    if (!record) return null;

    const webhookUrl: unknown = record.get('webhookUrl');
    const secretEnc: unknown = record.get('secretEnc');
    const previousEnc: unknown = record.get('previousEnc');
    const previousExpiresAt: unknown = record.get('previousExpiresAt');

    if (typeof webhookUrl !== 'string' || webhookUrl.length === 0) return null;
    if (typeof secretEnc !== 'string' || secretEnc.length === 0) return null;

    const secrets = [await decryptWebhookSecret(secretEnc)];

    if (
        typeof previousEnc === 'string' &&
        typeof previousExpiresAt === 'string' &&
        Date.parse(previousExpiresAt) > Date.now()
    ) {
        try {
            secrets.push(await decryptWebhookSecret(previousEnc));
        } catch {
            // The current secret alone still produces a valid signature.
            console.warn('integration_events: previous_secret_unreadable');
        }
    }

    return { webhookUrl, secrets };
};
