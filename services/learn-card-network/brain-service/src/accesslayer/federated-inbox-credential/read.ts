import cache from '@cache';
import type { FederatedInboxCredential, CreateFederatedInboxCredentialInput } from './create';

export type { FederatedInboxCredential, CreateFederatedInboxCredentialInput };

type GetFederatedInboxCredentialsOptions = {
    limit: number;
    cursor?: string;
};

const getCacheKey = (credentialId: string): string => `federated-inbox:${credentialId}`;
const getProfileIndexKey = (profileId: string): string => `federated-inbox:index:${profileId}`;

export const getFederatedInboxCredentialById = async (
    id: string
): Promise<FederatedInboxCredential | null> => {
    const data = await cache.get(getCacheKey(id));
    if (!data) return null;
    return JSON.parse(data) as FederatedInboxCredential;
};

export const getFederatedInboxCredentialsForProfile = async (
    profileId: string,
    options: GetFederatedInboxCredentialsOptions
): Promise<FederatedInboxCredential[]> => {
    const indexKey = getProfileIndexKey(profileId);
    const allIds = await cache.lrange(indexKey, 0, -1);
    if (!allIds || allIds.length === 0) return [];

    let startIndex = 0;
    if (options.cursor) {
        const cursorIndex = allIds.findIndex((id: string) => id === options.cursor);
        if (cursorIndex !== -1) {
            startIndex = cursorIndex + 1;
        }
    }

    const idsToFetch = allIds.slice(startIndex, startIndex + options.limit);

    const credentials = await Promise.all(
        idsToFetch.map((id: string) => getFederatedInboxCredentialById(id))
    );

    return credentials.filter((c): c is FederatedInboxCredential => c !== null);
};
