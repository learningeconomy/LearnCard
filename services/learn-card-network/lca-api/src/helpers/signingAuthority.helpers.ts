import dotenv from 'dotenv';
import { MongoSigningAuthorityType, SigningAuthorityResponseType } from '@models';

dotenv.config();

export const getEndpoint = (domainName: string) => {
    return !domainName || process.env.IS_OFFLINE
        ? `http://localhost:${process.env.PORT || 3000}/api`
        : `https://${domainName}/api`;
};

export const getSigningAuthorityWithEndpoint = (
    signingAuthority: MongoSigningAuthorityType & { did: string },
    domainName: string
): SigningAuthorityResponseType => {
    return {
        ...signingAuthority,
        endpoint: getEndpoint(domainName),
    };
};
