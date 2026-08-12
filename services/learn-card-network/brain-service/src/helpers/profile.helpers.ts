import { getProfileByProfileId } from '@accesslayer/profile/read';
import { createProfile } from '@accesslayer/profile/create';
import { getProfileIdFromDid } from './did.helpers';
import { ProfileType } from 'types/profile';

export const transformProfileId = (rawInput: string): string =>
    rawInput.toLowerCase().replace(':', '%3A');

/**
 * Gets or creates a federated profile for cross-instance credential sending.
 * Federated profiles use email-like format: profileId@service-domain to avoid collisions.
 *
 * @param senderDid - The sender's full DID (e.g., did:web:localhost%3A4001:users:fred)
 * @param senderServiceDid - The sender's service DID (e.g., did:web:localhost%3A4001)
 * @param displayName - The sender's display name
 * @returns The federated profile
 */
export const getOrCreateFederatedProfile = async (
    senderDid: string,
    senderServiceDid: string,
    displayName: string
): Promise<ProfileType> => {
    const profileId = getProfileIdFromDid(senderDid);
    if (!profileId) {
        throw new Error(`Could not extract profileId from sender DID: ${senderDid}`);
    }

    const serviceParts = senderServiceDid.split(':');
    if (serviceParts.length < 3) {
        throw new Error(`Invalid service DID format: ${senderServiceDid}`);
    }
    const serviceDomain = serviceParts[2];

    const federatedProfileId = `${profileId}@${serviceDomain}`;

    const existingProfile = await getProfileByProfileId(federatedProfileId);
    if (existingProfile) {
        return existingProfile;
    }

    const newProfile = await createProfile({
        profileId: federatedProfileId,
        did: senderDid,
        displayName: displayName || federatedProfileId,
        shortBio: '',
        bio: '',
    } as unknown as Parameters<typeof createProfile>[0]);

    return newProfile;
};
