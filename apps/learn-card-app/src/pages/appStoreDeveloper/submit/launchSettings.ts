import type { LaunchType } from '@learncard/types';
import { isAppBuilderPreviewHost } from '@learncard/partner-connect-core';

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

export type AddressProblem = 'local' | 'preview' | 'insecure' | 'invalid';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', '0.0.0.0'];

/** Why learners couldn't reach an address, or null if it's a public https address. */
export const getAddressProblem = (address: string | undefined): AddressProblem | null => {
    if (!address?.trim()) return null;
    try {
        const { protocol, hostname } = new URL(address.trim());
        const host = hostname.toLowerCase();
        if (LOCAL_HOSTS.includes(host) || host.endsWith('.localhost') || host.endsWith('.local')) {
            return 'local';
        }
        if (isAppBuilderPreviewHost(host)) return 'preview';
        if (protocol !== 'https:') return 'insecure';
        return null;
    } catch {
        return 'invalid';
    }
};

const ADDRESS_PROBLEM_HINTS: Record<AddressProblem, string> = {
    local: 'Use your public address to submit',
    preview: 'Use your published address to submit',
    insecure: 'Use an https:// address to submit',
    invalid: 'Fix the address to submit',
};

/** The first missing or unusable launch setting, phrased for the submit footer, or null. */
export const getLaunchSettingsError = (type: LaunchType, config: LaunchConfig): string | null => {
    const missing = getMissingLaunchSetting(type, config);
    if (missing) return missing;

    const problem = getAddressProblem(getLaunchAddress(type, config));
    return problem ? ADDRESS_PROBLEM_HINTS[problem] : null;
};

const getMissingLaunchSetting = (type: LaunchType, config: LaunchConfig): string | null => {
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
