import type { VC } from '@learncard/types';

export interface InboxDelivery {
    id: string;
    credential: VC;
}

/** Match transport metadata without modifying the signed credential. */
export const getInboxDeliveryId = (
    credential: VC,
    deliveries: InboxDelivery[] = [],
    credentialIndex?: number
): string | undefined => {
    const candidate = credentialIndex === undefined ? undefined : deliveries[credentialIndex];
    if (candidate && JSON.stringify(candidate.credential) === JSON.stringify(credential)) {
        return candidate.id;
    }
    return deliveries.find(
        delivery => JSON.stringify(delivery.credential) === JSON.stringify(credential)
    )?.id;
};
