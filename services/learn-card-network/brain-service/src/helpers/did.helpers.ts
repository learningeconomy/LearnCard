import { ProfileType } from 'types/profile';

/** Generates a did:web for a user given the domain of the app */
export const getDidWeb = (domain: string, handle: string): string =>
    `did:web:${domain}:users:${handle}`;

/** Generates a did:web for a user given the domain of the app */
export const updateDidForProfile = (domain: string, profile: ProfileType): ProfileType => ({
    ...profile,
    did: getDidWeb(domain, profile.handle),
});
