import type { LCNIntegration, LCNIntegrationUpdateType } from '@learncard/types';

const APP_URL_KEY = 'publishedFromAppUrl';
export const EMBED_APP_GUIDE = 'embed-app';

type IntegrationLike = Pick<LCNIntegration, 'id' | 'name'> &
    Partial<Pick<LCNIntegration, 'guideType' | 'guideState'>>;

const readAppUrl = (integration: IntegrationLike): unknown =>
    (integration.guideState as Record<string, unknown> | undefined)?.[APP_URL_KEY];

/** Address matches are hints, not proof of app identity. */
export const getAppMatch = (
    integration: IntegrationLike,
    appKey?: string,
    listingName?: string,
    suggestedName?: string
): 'reuse' | 'confirm' | 'exclude' => {
    const publishedKey = integration.guideState?.publishedAppKey;
    if (publishedKey) return publishedKey === appKey ? 'reuse' : 'exclude';
    return !appKey && listingName !== undefined && listingName === suggestedName
        ? 'reuse'
        : 'confirm';
};

/** Find a key match first, otherwise an unclaimed address-level candidate. */
export const findIntegrationForApp = <T extends IntegrationLike>(
    integrations: T[] | undefined,
    appUrl: string,
    appKey?: string
): T | undefined => {
    return (
        (appKey
            ? integrations?.find(integration => integration.guideState?.publishedAppKey === appKey)
            : undefined) ??
        integrations?.find(
            integration =>
                !integration.guideState?.publishedAppKey && readAppUrl(integration) === appUrl
        )
    );
};

/**
 * Updates that make a project look like the app it publishes: named after the app and
 * shown with the simple app dashboard. Returns null when nothing needs to change.
 */
export const getAppIntegrationRepair = (
    integration: IntegrationLike,
    { appUrl, appName, appKey }: { appUrl: string; appName: string; appKey?: string }
): LCNIntegrationUpdateType | null => {
    const host = new URL(appUrl).host;
    const name = appName.trim();
    const updates: LCNIntegrationUpdateType = {};

    if (name && integration.name === host) updates.name = name;
    if (integration.guideType !== EMBED_APP_GUIDE) updates.guideType = EMBED_APP_GUIDE;
    if (
        readAppUrl(integration) !== appUrl ||
        (appKey && integration.guideState?.publishedAppKey !== appKey)
    ) {
        updates.guideState = {
            ...(integration.guideState ?? {}),
            [APP_URL_KEY]: appUrl,
            ...(appKey ? { publishedAppKey: appKey } : {}),
        };
    }

    return Object.keys(updates).length > 0 ? updates : null;
};
