import type { VC } from '@learncard/types';

import type { DuplicateCredentialLookup } from '../../credentials/duplicate-credential/findDuplicateCredential';

type NotificationCredentialData = {
    metadata?: Record<string, unknown>;
};

/**
 * Uses server-provided Boost identity when available and content matching for legacy notifications.
 */
export const getNotificationDuplicateLookup = (
    credential: VC | undefined,
    data: NotificationCredentialData | undefined
): DuplicateCredentialLookup => {
    const metadataBoostUri = data?.metadata?.boostUri;
    const nestedCredential = (credential as (VC & { boostCredential?: VC }) | undefined)
        ?.boostCredential;
    const credentialBoostUri = credential?.boostId ?? nestedCredential?.boostId;
    const boostUri =
        typeof metadataBoostUri === 'string' && metadataBoostUri
            ? metadataBoostUri
            : credentialBoostUri;

    return boostUri ? { boostUri } : { compareByContent: true };
};
