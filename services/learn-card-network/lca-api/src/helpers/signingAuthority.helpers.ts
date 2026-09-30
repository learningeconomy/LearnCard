import { environment } from '@environment';
import { MongoSigningAuthorityType, SigningAuthorityResponseType } from '@models';

export const getEndpoint = (domainName: string) => {
    return !domainName || environment.IS_OFFLINE
        ? `http://localhost:${environment.PORT || 3000}/api`
        : `https://${domainName}/api`;
};

export const getSigningAuthorityWithEndpoint = (
    signingAuthority: MongoSigningAuthorityType & { did: string },
    domainName: string
): SigningAuthorityResponseType => {
    return {
        _id: signingAuthority._id,
        name: signingAuthority.name,
        ownerDid: signingAuthority.ownerDid,
        did: signingAuthority.did,
        endpoint: getEndpoint(domainName),
    };
};
