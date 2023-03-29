import { SigningAuthority, SigningAuthorityInstance } from '@models';

export const getSigningAuthorityByEndpoint = async (endpoint: string): Promise<SigningAuthorityInstance | null> => {
    return SigningAuthority.findOne({ where: { endpoint } });
};
