import { useGetProfile } from 'learn-card-base';

/** Enrich a DID fallback without changing the credential's signed display model. */
export const useClrLearnerIdentity = (learnerName?: string) => {
    const profileId = learnerName?.match(/^did:web:[^:]+:users:([^:#/]+)$/)?.[1];
    const { data: profile } = useGetProfile(profileId, Boolean(profileId));
    // Profile queries use the configured network; never substitute another network's user.
    const matchingProfile = profile?.did === learnerName ? profile : undefined;

    return {
        displayName:
            matchingProfile?.displayName ||
            matchingProfile?.profileId ||
            learnerName ||
            'Unknown learner',
        image: matchingProfile?.image,
    };
};
