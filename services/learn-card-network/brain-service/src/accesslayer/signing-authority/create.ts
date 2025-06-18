import { SigningAuthority, type SigningAuthorityInstance } from '@models';
import { getSigningAuthorityByEndpoint } from './read';

export const createSigningAuthority = async (
    endpoint: string
): Promise<SigningAuthorityInstance> => {
    return SigningAuthority.createOne({ endpoint });
};

export const upsertSigningAuthority = async (
    endpoint: string
): Promise<SigningAuthorityInstance> => {
    const existing = await getSigningAuthorityByEndpoint(endpoint);
    return existing ?? SigningAuthority.createOne({ endpoint });
};
