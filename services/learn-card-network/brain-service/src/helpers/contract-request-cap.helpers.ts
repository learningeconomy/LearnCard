import { environment } from '@environment';

const CONTRACT_REQUEST_CAP_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export const getContractRequestCap = (): number => environment.CONTRACT_REQUEST_CAP_PER_30_DAYS;

export const getContractRequestCapWindowStart = (now: Date): string =>
    new Date(now.getTime() - CONTRACT_REQUEST_CAP_WINDOW_MS).toISOString();

/** Pre-cap requests contribute their original timestamp when one was recorded. */
export const recentContractRequestTimes = `
    [sentAt IN coalesce(existing.requestTimes, [sentAt IN [existing.requestedAt] WHERE sentAt IS NOT NULL])
        WHERE sentAt > $capWindowStart]
`;
