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
    const indexData = await cache.get(indexKey);
    if (!indexData) return [];

    const allIds: string[] = JSON.parse(indexData);

    let startIndex = 0;
    if (options.cursor) {
        const cursorIndex = allIds.findIndex(id => id === options.cursor);
        if (cursorIndex !== -1) {
            startIndex = cursorIndex + 1;
        }
    }

    const idsToFetch = allIds.slice(startIndex, startIndex + options.limit);

    const credentials = await Promise.all(
        idsToFetch.map(id => getFederatedInboxCredentialById(id))
    );

    return credentials.filter((c): c is FederatedInboxCredential => c !== null);
};
