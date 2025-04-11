import { ProfileInstance } from '@models';
import { ProfileType } from 'types/profile';

/** Generates a did:web for a user given the domain of the app */
export const getDidWeb = (domain: string, profileId: string): string =>
    `did:web:${domain}:users:${profileId}`;

/** Generates a did:web for a user given the domain of the app */
export const getManagedDidWeb = (domain: string, id: string): string =>
    `did:web:${domain}:manager:${id}`;

/** Generates a did:web for a user given the domain of the app */
export const updateDidForProfile = (domain: string, profile: ProfileType): ProfileType => ({
    ...profile,
    did: getDidWeb(domain, profile.profileId),
});

export const updateDidForProfiles = (
    domain: string,
    profiles: (ProfileType | ProfileInstance)[]
): ProfileType[] =>
    profiles.map(profile => ({
        ...('dataValues' in profile ? profile.dataValues : profile),
        did: getDidWeb(domain, profile.profileId),
    }));

/** Extracts the profileId from a user's did:web */
export const getProfileIdFromDid = (did: string): string | undefined => {
    if (!did || !did.startsWith('did:web:')) {
        return undefined; // Not a did:web
    }

    const parts = did.split(':');
    // Expected format: did:web:domain:users:profileId (5 parts minimum)
    if (parts.length < 5 || parts[3] !== 'users') {
        return undefined; // Not the expected user did:web format
    }

    // The profileId is the 5th part (index 4)
    return parts[4];
};
