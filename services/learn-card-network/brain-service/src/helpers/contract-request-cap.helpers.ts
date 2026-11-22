import { environment } from '@environment';

const CONTRACT_REQUEST_CAP_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export const getContractRequestCap = (): number => environment.CONTRACT_REQUEST_CAP_PER_30_DAYS;

export const getContractRequestCapWindowStart = (now: Date): string =>
    new Date(now.getTime() - CONTRACT_REQUEST_CAP_WINDOW_MS).toISOString();

/**
 * Each entry contains an ISO timestamp and sender profile ID. Profile and email history stay
 * separate so profile-send results never depend on a private email attachment.
 */
export const recentContractRequestTimes = (channel: 'profile' | 'email'): string => {
    const isEmail = channel === 'email';
    const property = isEmail ? 'emailRequestTimes' : 'profileRequestTimes';
    return `
        [entry IN coalesce(existing.${property},
            [sentAt IN [existing.requestedAt]
                WHERE sentAt IS NOT NULL AND existing.requestedBy IS NOT NULL
                    AND coalesce(existing.addressedByEmail, false) = ${isEmail}
                | sentAt + '|' + existing.requestedBy])
            WHERE split(entry, '|')[0] > $capWindowStart]
    `;
};

export const contractRequestCountForSender = (times: string, sender: string): string => `
    size([entry IN ${times} WHERE substring(entry, size(split(entry, '|')[0]) + 1) = ${sender}])
`;
