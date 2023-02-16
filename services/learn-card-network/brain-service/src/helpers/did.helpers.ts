import { ProfileInstance } from '@models';
import { ProfileType } from 'types/profile';

/** Generates a did:web for a user given the domain of the app */
export const getDidWeb = (domain: string, profileId: string): string =>
    `did:web:${domain}:users:${profileId}`;

/** Generates a did:web for a user given the domain of the app */
export const updateDidForProfile = (
    domain: string,
    profile: ProfileType | ProfileInstance
): ProfileType => ({
    ...('dataValues' in profile ? profile.dataValues : profile),
    did: getDidWeb(domain, profile.profileId),
});
