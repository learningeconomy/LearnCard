import type { LaunchType } from '@learncard/types';

import type { LaunchConfig } from '../types';

export const LAUNCH_TYPE_LABELS: Record<LaunchType, string> = {
    EMBEDDED_IFRAME: 'Runs inside LearnCard',
    DIRECT_LINK: 'Opens in a new tab',
    CONSENT_REDIRECT: 'Connects, then goes to your site',
    AI_TUTOR: 'AI tutor',
    SECOND_SCREEN: 'Pairs with a second screen',
    SERVER_HEADLESS: 'Runs on a server',
};

export const parseLaunchConfig = (json: string | undefined): LaunchConfig => {
    try {
        const parsed: unknown = json ? JSON.parse(json) : {};
        return parsed && typeof parsed === 'object' ? (parsed as LaunchConfig) : {};
    } catch {
        return {};
    }
};

/** The one address that best describes where a launch type sends people. */
export const getLaunchAddress = (type: LaunchType, config: LaunchConfig): string | undefined => {
    switch (type) {
        case 'CONSENT_REDIRECT':
            return config.redirectUri;
        case 'SERVER_HEADLESS':
            return config.webhookUrl;
        case 'AI_TUTOR':
            return config.aiTutorUrl;
        default:
            return config.url;
    }
};

export const getLaunchSummary = (type: LaunchType, config: LaunchConfig): string => {
    const address = getLaunchAddress(type, config);
    return address ? `${LAUNCH_TYPE_LABELS[type]} · ${address}` : LAUNCH_TYPE_LABELS[type];
};

/** The first missing launch setting, phrased for the submit footer, or null. */
export const getLaunchSettingsError = (type: LaunchType, config: LaunchConfig): string | null => {
    switch (type) {
        case 'CONSENT_REDIRECT':
            if (!config.contractUri) return 'Choose what to ask permission for to submit';
            if (!config.redirectUri) return 'Add where people go next to submit';
            return null;
        case 'SERVER_HEADLESS':
            return config.webhookUrl ? null : 'Add your server address to submit';
        case 'AI_TUTOR':
            return config.aiTutorUrl ? null : "Add your tutor's address to submit";
        default:
            return config.url ? null : 'Add a link to submit';
    }
};
