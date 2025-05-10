import { z } from 'zod';
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

export const FlatProfileValidator = ProfileValidator.omit({ display: true }).catchall(z.any());
export type FlatProfileType = z.infer<typeof FlatProfileValidator>;

export const SigningAuthorityValidator = LCNSigningAuthorityValidator;
export type SigningAuthorityType = LCNSigningAuthorityType;

export const SigningAuthorityForUserValidator = LCNSigningAuthorityForUserValidator;
export type SigningAuthorityForUserType = LCNSigningAuthorityForUserType;

export enum LearnCardRolesEnum {
    learner = 'learner',
    guardian = 'guardian',
    teacher = 'teacher',
    admin = 'admin',
    counselor = 'counselor',
}
