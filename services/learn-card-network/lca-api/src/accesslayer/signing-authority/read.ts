import { MongoSigningAuthorityType } from '@models';
import { SigningAuthorities } from '.';

export const getSigningAuthorityById = async (
    _id: string
): Promise<MongoSigningAuthorityType | null | undefined> => {
    return SigningAuthorities.findOne({ _id });
};

export const getSigningAuthorityForDid = async (
    ownerDid: string,
    name: string
): Promise<MongoSigningAuthorityType | null | undefined> => {
    return SigningAuthorities.findOne({ ownerDid, name });
};

export const getSigningAuthoritiesForDid = async (
    ownerDid: string
): Promise<MongoSigningAuthorityType[]> => {
    return SigningAuthorities.find({ ownerDid }).toArray();
};
