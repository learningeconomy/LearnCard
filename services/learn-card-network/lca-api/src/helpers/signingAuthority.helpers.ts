import dotenv from 'dotenv';
import { MongoSigningAuthorityType, SigningAuthorityResponseType } from '@models';

dotenv.config();

export const getEndpoint = (domainName: string) => {
    return !domainName || process.env.IS_OFFLINE
        ? `http://localhost:${process.env.PORT || 3000}/api`
        : `https://${domainName}/api`;
};

export const getSigningAuthorityWithEndpoint = (
    signingAuthority: MongoSigningAuthorityType,
    domainName: string
): SigningAuthorityResponseType => {
    if (!signingAuthority.did) {
        throw new Error(`Signing authority "${signingAuthority.name}" is missing its DID.`);
    }

    return {
        ...signingAuthority,
        did: signingAuthority.did,
        endpoint: getEndpoint(domainName),
    };
};
