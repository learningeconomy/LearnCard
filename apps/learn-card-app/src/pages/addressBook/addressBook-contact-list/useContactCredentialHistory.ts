import { useQuery } from '@tanstack/react-query';

import type { SentCredentialInfo, VC } from '@learncard/types';
import { getLogger, switchedProfileStore, useWallet } from 'learn-card-base';

const log = getLogger('contact-credential-history');
const MAX_PREVIEW_CREDENTIALS = 10;

type UseContactCredentialHistoryOptions = {
    enabled?: boolean;
    limit?: number | null;
};

export type ContactCredentialDirection = 'received' | 'sent';

export type ContactCredentialHistoryItem = {
    credential: VC;
    direction: ContactCredentialDirection;
    sentAt: string;
    uri: string;
};

export type ContactCredentialHistory = {
    items: ContactCredentialHistoryItem[];
    receivedCount: number;
    sentCount: number;
};

const resolveCredential = async (
    wallet: Awaited<ReturnType<ReturnType<typeof useWallet>['initWallet']>>,
    info: SentCredentialInfo,
    direction: ContactCredentialDirection
): Promise<ContactCredentialHistoryItem | null> => {
    try {
        const storedCredential = (await wallet.read.get(info.uri)) as VC | undefined;
        if (!storedCredential) return null;

        return {
            credential: storedCredential,
            direction,
            sentAt: info.sent,
            uri: info.uri,
        };
    } catch (error) {
        log.warn('Unable to resolve credential shared with contact', { uri: info.uri, error });
        return null;
    }
};

/** Loads credential-exchange counts and either a limited preview or the complete history. */
export const useContactCredentialHistory = (
    profileId: string | undefined,
    { enabled = true, limit = MAX_PREVIEW_CREDENTIALS }: UseContactCredentialHistoryOptions = {}
) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<ContactCredentialHistory>({
        queryKey: ['contactCredentialHistory', switchedDid ?? '', profileId ?? '', limit ?? 'all'],
        queryFn: async () => {
            if (!profileId) return { items: [], receivedCount: 0, sentCount: 0 };

            const wallet = await initWallet();
            const [sent, received] = await Promise.all([
                wallet.invoke.getSentCredentials(profileId),
                wallet.invoke.getReceivedCredentials(profileId),
            ]);

            const newestCredentialInfo = [
                ...sent.map(info => ({ info, direction: 'sent' as const })),
                ...received.map(info => ({ info, direction: 'received' as const })),
            ].sort((a, b) => Date.parse(b.info.sent) - Date.parse(a.info.sent));

            const credentialInfoToResolve =
                limit === null ? newestCredentialInfo : newestCredentialInfo.slice(0, limit);

            const resolved = await Promise.all(
                credentialInfoToResolve.map(({ info, direction }) =>
                    resolveCredential(wallet, info, direction)
                )
            );

            const items = resolved
                .filter((item): item is ContactCredentialHistoryItem => Boolean(item))
                .sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt));

            return {
                items,
                receivedCount: received.length,
                sentCount: sent.length,
            };
        },
        enabled: enabled && Boolean(profileId),
        staleTime: 60_000,
    });
};

export default useContactCredentialHistory;
