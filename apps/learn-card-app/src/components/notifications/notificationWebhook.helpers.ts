const PRODUCTION_NOTIFICATIONS_URL = 'https://api.learncard.app/api/notifications/send';
const STAGING_NOTIFICATIONS_URL = 'https://staging.api.learncard.app/api/notifications/send';
const STAGING_PROFILE_PREFIX = 'did:web:staging.network.learncard.com:users:';

/** Fill missing destinations and repair the known staging-to-production default leak.
 * Custom destinations and profiles on other networks must remain untouched.
 */
export const shouldUpdateNotificationsWebhook = (
    profile: { did?: string; notificationsWebhook?: string } | undefined,
    notificationsEndpoint: string
): boolean => {
    if (!profile) return false;
    if (!profile.notificationsWebhook?.trim()) return true;

    return (
        notificationsEndpoint === STAGING_NOTIFICATIONS_URL &&
        Boolean(profile.did?.startsWith(STAGING_PROFILE_PREFIX)) &&
        profile.notificationsWebhook === PRODUCTION_NOTIFICATIONS_URL
    );
};
