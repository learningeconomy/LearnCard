import dotenv from 'dotenv';
import type { MongoSigningAuthorityType } from '@models';

dotenv.config();

export const getEndpoint = (domainName: string) => {
    return !domainName || process.env.IS_OFFLINE
        ? `http://localhost:${process.env.PORT || 3000}/api`
        : `https://${domainName}/api`;
}

export const getSigningAuthorityWithEndpoint = (sa: MongoSigningAuthorityType, domainName: string) => {
    return {
        ...sa,
        endpoint: getEndpoint(domainName)
    }
}