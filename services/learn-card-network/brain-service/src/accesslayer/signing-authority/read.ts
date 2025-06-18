import { SigningAuthority, type SigningAuthorityInstance } from '@models';

export const getSigningAuthorityByEndpoint = async (
    endpoint: string
): Promise<SigningAuthorityInstance | null> => {
    return SigningAuthority.findOne({ where: { endpoint } });
};
