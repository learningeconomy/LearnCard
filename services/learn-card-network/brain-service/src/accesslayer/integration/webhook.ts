import { createHash } from 'node:crypto';

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

export type IntegrationWebhookConfigResult = {
    /** The webhook URL after the write. null when the Integration has none. */
    webhookUrl: string | null;
    /** Plaintext signing secret. Only present when this call created the first secret. */
    secret?: string;
    /** When contract events were enabled. Absent while they are disabled. */
    contractEventsEnabledAt?: string;
};

/**
 * Writes the webhook URL and the contract-events switch of an Integration and returns the
 * resulting configuration. The first time a URL is set a signing secret is created and
 * returned in plaintext; that is the only time it is returned. Returns null when the
 * Integration does not exist.
 */
export const setIntegrationWebhookConfig = async ({
    integrationId,
    webhookUrl,
    contractEventsEnabled,
}: IntegrationWebhookConfigInput): Promise<IntegrationWebhookConfigResult | null> => {
    const settingUrl = typeof webhookUrl === 'string';

    // Only stored by the query when the Integration has no secret yet.
    const newSecret = settingUrl ? generateWebhookSecret() : null;
    const newSecretEnc = newSecret ? await encryptWebhookSecret(newSecret) : null;

    // The first SET takes the node's write lock before "has no secret yet" is evaluated, so of
    // two concurrent calls exactly one creates the secret and is told so.
    const result = await neogma.queryRunner.run(
        `MATCH (integration:Integration {id: $id})
         SET integration.updatedAt = $now
         WITH integration,
             ($webhookUrl IS NOT NULL AND integration.webhookSecretEnc IS NULL) AS createsSecret
         SET integration.webhookUrl = CASE WHEN $setUrl THEN $webhookUrl ELSE integration.webhookUrl END,
             integration.webhookSecretEnc = CASE
                 WHEN createsSecret THEN $newSecretEnc
                 ELSE integration.webhookSecretEnc END,
             integration.contractEventsEnabledAt = CASE
                 WHEN $contractEventsEnabled = false THEN null
                 WHEN ($contractEventsEnabled = true OR $webhookUrl IS NOT NULL)
                     AND integration.contractEventsEnabledAt IS NULL THEN $now
                 ELSE integration.contractEventsEnabledAt END
         RETURN integration.webhookUrl AS webhookUrl,
             integration.contractEventsEnabledAt AS contractEventsEnabledAt,
             createsSecret`,
        {
            id: integrationId,
            setUrl: webhookUrl !== undefined,
            webhookUrl: webhookUrl ?? null,
            newSecretEnc,
            contractEventsEnabled: contractEventsEnabled ?? null,
            now: new Date().toISOString(),
        }
    );
    const record = result.records[0];

    if (!record) return null;

    const storedUrl: unknown = record.get('webhookUrl');
    const enabledAt: unknown = record.get('contractEventsEnabledAt');

    return {
        webhookUrl: typeof storedUrl === 'string' && storedUrl.length > 0 ? storedUrl : null,
        ...(newSecret && record.get('createsSecret') === true ? { secret: newSecret } : {}),
        ...(typeof enabledAt === 'string' && enabledAt.length > 0
            ? { contractEventsEnabledAt: enabledAt }
            : {}),
    };
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
    /**
     * When contract events were last enabled. Absent while they are disabled: the webhook can
     * still be tested then, but no feed record may be delivered to it.
     */
    contractEventsEnabledAt?: string;
};

type StoredDeliveryState = {
    webhookUrl: unknown;
    secretEnc: unknown;
    previousEnc: unknown;
    previousExpiresAt: unknown;
    contractEventsEnabledAt: unknown;
};

const readStoredDeliveryState = async (
    integrationId: string
): Promise<StoredDeliveryState | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (integration:Integration {id: $id})
         RETURN integration.webhookUrl AS webhookUrl,
             integration.webhookSecretEnc AS secretEnc,
             integration.webhookSecretPrevEnc AS previousEnc,
             integration.webhookSecretPrevExpiresAt AS previousExpiresAt,
             integration.contractEventsEnabledAt AS contractEventsEnabledAt`,
        { id: integrationId }
    );
    const record = result.records[0];

    if (!record) return null;

    return {
        webhookUrl: record.get('webhookUrl'),
        secretEnc: record.get('secretEnc'),
        previousEnc: record.get('previousEnc'),
        previousExpiresAt: record.get('previousExpiresAt'),
        contractEventsEnabledAt: record.get('contractEventsEnabledAt'),
    };
};

const isUsablePrevious = (state: StoredDeliveryState): boolean =>
    typeof state.previousEnc === 'string' &&
    typeof state.previousExpiresAt === 'string' &&
    Date.parse(state.previousExpiresAt) > Date.now();

/**
 * SHA-256 hex of everything the delivery configuration is built from (URL, enabled time and the
 * stored encrypted secrets). It identifies a configuration without exposing or decrypting any
 * secret, and changes whenever the URL, the switch or a secret changes.
 */
const fingerprintOf = (state: StoredDeliveryState): string =>
    createHash('sha256')
        .update(
            JSON.stringify([
                state.webhookUrl ?? null,
                state.contractEventsEnabledAt ?? null,
                state.secretEnc ?? null,
                isUsablePrevious(state) ? state.previousEnc : null,
            ])
        )
        .digest('hex');

const buildDeliveryConfig = async (
    state: StoredDeliveryState
): Promise<IntegrationWebhookDeliveryConfig | null> => {
    const { webhookUrl, secretEnc, previousEnc, contractEventsEnabledAt } = state;

    if (typeof webhookUrl !== 'string' || webhookUrl.length === 0) return null;
    if (typeof secretEnc !== 'string' || secretEnc.length === 0) return null;

    const secrets = [await decryptWebhookSecret(secretEnc)];

    if (isUsablePrevious(state)) {
        try {
            secrets.push(await decryptWebhookSecret(String(previousEnc)));
        } catch {
            // The current secret alone still produces a valid signature.
            console.warn('integration_events: previous_secret_unreadable');
        }
    }

    return {
        webhookUrl,
        secrets,
        ...(typeof contractEventsEnabledAt === 'string' && contractEventsEnabledAt.length > 0
            ? { contractEventsEnabledAt }
            : {}),
    };
};

/**
 * Reads what signed delivery needs: the webhook URL, the decrypted signing secrets and whether
 * contract events are enabled. Returns null when the Integration does not exist, has no webhook
 * URL, or has no secret. The result must never be returned by a route or written to a log.
 */
export const getIntegrationWebhookDeliveryConfig = async (
    integrationId: string
): Promise<IntegrationWebhookDeliveryConfig | null> => {
    const state = await readStoredDeliveryState(integrationId);

    return state ? buildDeliveryConfig(state) : null;
};

export type IntegrationWebhookDeliverySnapshot = {
    /** Fingerprint of the stored state the config was built from. null when there is no Integration. */
    fingerprint: string | null;
    config: IntegrationWebhookDeliveryConfig | null;
};

/** Like getIntegrationWebhookDeliveryConfig, plus the fingerprint of the state it was read from. */
export const getIntegrationWebhookDeliverySnapshot = async (
    integrationId: string
): Promise<IntegrationWebhookDeliverySnapshot> => {
    const state = await readStoredDeliveryState(integrationId);

    if (!state) return { fingerprint: null, config: null };

    return { fingerprint: fingerprintOf(state), config: await buildDeliveryConfig(state) };
};

/**
 * One cheap read that tells whether the delivery configuration changed: returns the fingerprint
 * of the stored state without decrypting anything. null when the Integration does not exist.
 */
export const getIntegrationWebhookDeliveryFingerprint = async (
    integrationId: string
): Promise<string | null> => {
    const state = await readStoredDeliveryState(integrationId);

    return state ? fingerprintOf(state) : null;
};
