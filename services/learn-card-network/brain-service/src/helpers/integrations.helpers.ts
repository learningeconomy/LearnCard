import type { IntegrationWebhookState } from '@learncard/types';

import { IntegrationType } from 'types/integration';

/**
 * Stored Integration properties that are never part of the public Integration:
 * encrypted webhook secrets, the event sequence bookkeeping, and webhook delivery health
 * (which only the getIntegrationWebhook route returns, in its own shape).
 */
export const PRIVATE_INTEGRATION_PROPERTIES = [
    'webhookSecretEnc',
    'webhookSecretPrevEnc',
    'webhookSecretPrevExpiresAt',
    'webhookSecretVersion',
    'webhookLastSuccessAt',
    'webhookLastFailureAt',
    'webhookLastFailureReason',
    'eventSeq',
    'eventPurgedThroughSeq',
    'eventSeqLock',
] as const;

/**
 * Turn a stored Integration into its public shape: remove private properties, compute
 * hasWebhookSecret, and parse guideState from a JSON string to an object if present.
 */
export const parseIntegration = (integration: IntegrationType): IntegrationType => {
    const stored = integration as unknown as Record<string, unknown>;
    const publicProperties: Record<string, unknown> = { ...stored };

    for (const key of PRIVATE_INTEGRATION_PROPERTIES) delete publicProperties[key];

    publicProperties.hasWebhookSecret =
        typeof stored.webhookSecretEnc === 'string' && stored.webhookSecretEnc.length > 0;

    const parsed = publicProperties as unknown as IntegrationType;

    if (parsed.guideState && typeof parsed.guideState === 'string') {
        try {
            return { ...parsed, guideState: JSON.parse(parsed.guideState) };
        } catch {
            return parsed;
        }
    }

    return parsed;
};

/**
 * State of an Integration's webhook: `disabled` without a URL or while contract events are
 * disabled, `failing` when the most recent delivery attempt failed (a failure later than the
 * last success, or failures and no success yet), `active` otherwise.
 */
export const deriveIntegrationWebhookState = ({
    webhookUrl,
    contractEventsEnabledAt,
    lastSuccessAt,
    lastFailureAt,
}: {
    webhookUrl: string | null;
    contractEventsEnabledAt?: string;
    lastSuccessAt?: string;
    lastFailureAt?: string;
}): IntegrationWebhookState => {
    if (!webhookUrl || !contractEventsEnabledAt) return 'disabled';
    if (!lastFailureAt) return 'active';
    if (!lastSuccessAt) return 'failing';

    return Date.parse(lastFailureAt) > Date.parse(lastSuccessAt) ? 'failing' : 'active';
};

/**
 * Extract contractUri from a listing's launch_config_json
 */
export const getContractUriFromLaunchConfig = (listing?: {
    launch_config_json?: string;
}): string | undefined => {
    if (!listing?.launch_config_json) return undefined;

    try {
        const launchConfig = JSON.parse(listing.launch_config_json);
        return launchConfig.contractUri;
    } catch {
        return undefined;
    }
};

/**
 * Extract contractUri from an integration's guideState.
 * Checks both the embed app guide path and the consent flow guide path.
 */
export const getContractUriFromGuideState = (
    integration?: IntegrationType | null
): string | undefined => {
    const guideState = integration?.guideState as
        | {
              config?: {
                  consentFlowConfig?: { contractUri?: string };
                  embedAppConfig?: {
                      featureConfig?: {
                          'request-data-consent'?: { contractUri?: string };
                      };
                  };
              };
          }
        | undefined;

    return (
        guideState?.config?.embedAppConfig?.featureConfig?.['request-data-consent']?.contractUri ||
        guideState?.config?.consentFlowConfig?.contractUri
    );
};

export const isDomainWhitelisted = (domain: string, whitelistedDomains: string[]) => {
    let domainCopy = domain;
    // Escape localhost ports
    if (domain.includes('%3A')) domainCopy = domain.replace(/%3A/g, ':');
    return whitelistedDomains.includes(domainCopy);
};
