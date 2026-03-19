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

export const isDomainWhitelisted = (domain: string, whitelistedDomains: string[]) => {
    let domainCopy = domain;
    // Escape localhost ports
    if (domain.includes('%3A')) domainCopy = domain.replace(/%3A/g, ':');
    return whitelistedDomains.includes(domainCopy);
};
