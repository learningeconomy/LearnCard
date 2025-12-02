import { networkStore } from 'learn-card-base/stores/NetworkStore';
import { LCA_API_ENDPOINT, SCOUTPASS_API_ENDPOINT } from './Networks';

export const DEFAULT_LCA_NOTIFICATIONS_ENDPOINT =
    'https://api.learncard.app/api/notifications/send';
export const DEFAULT_SCOUTPASS_NOTIFICATIONS_ENDPOINT =
    'https://api.scoutnetwork.org/api/notifications/send';

export const getNotificationsEndpoint = (): string => {
    const apiEndpoint = API_URL || networkStore.get.apiEndpoint();
    if (!apiEndpoint || apiEndpoint === LCA_API_ENDPOINT) return DEFAULT_LCA_NOTIFICATIONS_ENDPOINT;
    if (apiEndpoint === SCOUTPASS_API_ENDPOINT) return DEFAULT_SCOUTPASS_NOTIFICATIONS_ENDPOINT;

    if (apiEndpoint.includes('trpc')) return apiEndpoint.replace('trpc', 'api/notifications/send');

    return DEFAULT_LCA_NOTIFICATIONS_ENDPOINT;
};
