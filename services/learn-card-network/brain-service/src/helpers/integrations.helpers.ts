import { IntegrationType } from 'types/integration';

/**
 * Parse guideState from JSON string to object if present
 */
export const parseIntegration = (integration: IntegrationType): IntegrationType => {
    if (integration.guideState && typeof integration.guideState === 'string') {
        try {
            return { ...integration, guideState: JSON.parse(integration.guideState) };
        } catch {
            return integration;
        }
    }

    return integration;
};

/**
 * Extract contractUri from a listing's launch_config_json
 */
export const getContractUriFromLaunchConfig = (
    listing?: { launch_config_json?: string }
): string | undefined => {
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
