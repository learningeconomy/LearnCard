import type { CapturedAppManifest } from '@learncard/partner-connect-core';

const PERMISSION_LABELS: Record<string, string> = {
    request_identity: 'Sign people in',
    send_credential: 'Give out credentials',
    launch_feature: 'Open built-in features',
    request_consent: 'Ask permission to use learner info',
    template_issuance: 'Check who received a credential',
    credential_by_id: 'Look up a specific credential',
    credential_search: "Search the learner's credentials",
};

export const getPermissionLabel = (permission: string): string => {
    const known = PERMISSION_LABELS[permission];
    if (known) return known;

    const words = permission.replace(/[_-]+/g, ' ').trim().toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
};

const pluralize = (count: number, singular: string, plural: string): string =>
    `${count} ${count === 1 ? singular : plural}`;

export const describeManifest = (manifest: CapturedAppManifest): string[] => {
    const lines: string[] = [];

    if (manifest.permissions.includes('request_identity')) {
        lines.push('Signs people in with their account');
    }
    if (manifest.templates.length > 0) {
        lines.push(
            `Gives out ${pluralize(manifest.templates.length, 'kind of credential', 'kinds of credentials')}`
        );
    }
    if (manifest.consentRequests.length > 0 || manifest.permissions.includes('request_consent')) {
        lines.push('Asks permission before using learner info');
    }
    if (manifest.usedNotifications) lines.push('Sends notifications');
    if (manifest.counterKeys.length > 0) lines.push('Tracks progress');
    if (manifest.featuresLaunched.length > 0) lines.push('Opens built-in features');

    return lines;
};
