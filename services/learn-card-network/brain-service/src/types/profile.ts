import {
    LCNProfile,
    LCNProfileValidator,
    LCNSigningAuthorityValidator,
    LCNSigningAuthorityType,
    LCNSigningAuthorityForUserValidator,
    LCNSigningAuthorityForUserType,
} from '@learncard/types';

export const ProfileValidator = LCNProfileValidator;
export type ProfileType = LCNProfile;

export const SigningAuthorityValidator = LCNSigningAuthorityValidator;
export type SigningAuthorityType = LCNSigningAuthorityType;

export const SigningAuthorityForUserValidator = LCNSigningAuthorityForUserValidator;
export type SigningAuthorityForUserType = LCNSigningAuthorityForUserType;
