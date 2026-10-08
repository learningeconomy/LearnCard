import type { LCNIntegration, LCNIntegrationUpdateType } from '@learncard/types';

const APP_URL_KEY = 'publishedFromAppUrl';
export const EMBED_APP_GUIDE = 'embed-app';

type IntegrationLike = Pick<LCNIntegration, 'id' | 'name'> &
    Partial<Pick<LCNIntegration, 'guideType' | 'guideState'>>;

const readAppUrl = (integration: IntegrationLike): unknown =>
    (integration.guideState as Record<string, unknown> | undefined)?.[APP_URL_KEY];

/**
 * Finds the project a publish link belongs to. Projects remember the app address they
 * were published from; older ones were named after the app's host.
 */
export const findIntegrationForApp = <T extends IntegrationLike>(
    integrations: T[] | undefined,
    appUrl: string
): T | undefined => {
    const host = new URL(appUrl).host;
    return (
        integrations?.find(integration => readAppUrl(integration) === appUrl) ??
        integrations?.find(integration => integration.name === host)
    );
};

/**
 * Updates that make a project look like the app it publishes: named after the app and
 * shown with the simple app dashboard. Returns null when nothing needs to change.
 */
export const getAppIntegrationRepair = (
    integration: IntegrationLike,
    { appUrl, appName }: { appUrl: string; appName: string }
): LCNIntegrationUpdateType | null => {
    const host = new URL(appUrl).host;
    const name = appName.trim();
    const updates: LCNIntegrationUpdateType = {};

    if (name && integration.name === host) updates.name = name;
    if (integration.guideType !== EMBED_APP_GUIDE) updates.guideType = EMBED_APP_GUIDE;
    if (readAppUrl(integration) !== appUrl) {
        updates.guideState = { ...(integration.guideState ?? {}), [APP_URL_KEY]: appUrl };
    }

    return Object.keys(updates).length > 0 ? updates : null;
};
