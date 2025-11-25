import { SIGNING_AUTHORITIES_COLLECTION, MongoSigningAuthorityType } from '@models';
import mongodb from '@mongo';

export const getSigningAuthoritiesCollection = () => {
    return mongodb.collection<MongoSigningAuthorityType>(SIGNING_AUTHORITIES_COLLECTION);
};

export const SigningAuthorities = getSigningAuthoritiesCollection();

SigningAuthorities.createIndex({ ownerDid: 1, name: 1 }, { unique: true });
