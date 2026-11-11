import { SIGNING_AUTHORITIES_COLLECTION, MongoSigningAuthorityType } from '@models';
import mongodb from '@mongo';

export const getSigningAuthoritiesCollection = () => {
    return mongodb.collection<MongoSigningAuthorityType>(SIGNING_AUTHORITIES_COLLECTION);
};

export const SigningAuthorities = getSigningAuthoritiesCollection();

// Fire-and-forget at module load; see accesslayer/notifications for why it must not reject.
SigningAuthorities.createIndex({ ownerDid: 1, name: 1 }, { unique: true }).catch(error => {
    console.error('Signing authority unique index creation failed:', error);
});
