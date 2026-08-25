import { useQuery } from '@tanstack/react-query';

import type { SentCredentialInfo, VC } from '@learncard/types';
import {
    getLogger,
    isBoostCredential,
    switchedProfileStore,
    unwrapBoostCredential,
    useWallet,
} from 'learn-card-base';

const log = getLogger('contact-credential-history');

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

        const credential = (
            isBoostCredential(storedCredential)
                ? unwrapBoostCredential(storedCredential)
                : storedCredential
        ) as VC;

        return {
            credential,
            direction,
            sentAt: info.sent,
            uri: info.uri,
        };
    } catch (error) {
        log.warn('Unable to resolve credential shared with contact', { uri: info.uri, error });
        return null;
    }
};

/** Loads the credentials exchanged directly between the current user and one contact. */
export const useContactCredentialHistory = (profileId: string | undefined, enabled = true) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<ContactCredentialHistory>({
        queryKey: ['contactCredentialHistory', switchedDid ?? '', profileId ?? ''],
        queryFn: async () => {
            if (!profileId) return { items: [], receivedCount: 0, sentCount: 0 };

            const wallet = await initWallet();
            const [sent, received] = await Promise.all([
                wallet.invoke.getSentCredentials(profileId),
                wallet.invoke.getReceivedCredentials(profileId),
            ]);

            const resolved = await Promise.all([
                ...sent.map(info => resolveCredential(wallet, info, 'sent')),
                ...received.map(info => resolveCredential(wallet, info, 'received')),
            ]);

            const items = resolved
                .filter((item): item is ContactCredentialHistoryItem => Boolean(item))
                .sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt));

            return {
                items,
                receivedCount: items.filter(item => item.direction === 'received').length,
                sentCount: items.filter(item => item.direction === 'sent').length,
            };
        },
        enabled: enabled && Boolean(profileId),
        staleTime: 60_000,
    });
};

export default useContactCredentialHistory;
