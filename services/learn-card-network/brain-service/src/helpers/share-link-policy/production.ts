import { getProfileByProfileId } from '@accesslayer/profile/read';
import { isProfileManaged } from '@accesslayer/profile/relationships/read';
import type { ShareViewEligibilitySource } from '@accesslayer/share-link/types';
import type { ShareLinkTransaction } from '@accesslayer/share-link/transaction';
import {
    isServiceProfileExemptFromGuardianship,
    transformProfileId,
} from '@helpers/profile.helpers';

import { composeShareLinkPolicy } from './resolver';
import type { ShareLinkOwnerAge, ShareLinkPolicySnapshot, ShareLinkPolicySource } from './types';

const ADULT_AGE = 18;

/** Classify persisted human age without inventing a birthdate for service profiles. */
export const ageFromPersistedProfile = (
    profile: { dob?: unknown; type?: unknown } | null,
    now: Date = new Date()
): ShareLinkOwnerAge => {
    if (!profile) return 'unknown';
    if (profile.type === 'child') return 'minor';
    if (typeof profile.dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(profile.dob)) {
        return 'unknown';
    }

    const year = Number(profile.dob.slice(0, 4));
    const month = Number(profile.dob.slice(5, 7));
    const day = Number(profile.dob.slice(8, 10));
    const birthday = new Date(Date.UTC(year, month - 1, day));
    if (
        birthday.getUTCFullYear() !== year ||
        birthday.getUTCMonth() !== month - 1 ||
        birthday.getUTCDate() !== day ||
        birthday.getTime() > now.getTime()
    ) {
        return 'unknown';
    }

    const age =
        now.getUTCFullYear() -
        year -
        (now.getUTCMonth() + 1 < month ||
        (now.getUTCMonth() + 1 === month && now.getUTCDate() < day)
            ? 1
            : 0);

    return age >= ADULT_AGE ? 'adult' : 'minor';
};

/**
 * Personal profiles require a valid persisted birthdate for tracking. Service
 * profiles are age-exempt, but an explicit child type always keeps protections.
 */
export const createProductionShareLinkPolicySource = (): ShareLinkPolicySource => ({
    resolveOwner: async profileId => {
        const profile = await getProfileByProfileId(profileId);
        const isServiceProfile = isServiceProfileExemptFromGuardianship(
            profile?.isServiceProfile,
            profile?.type
        );
        return {
            age: ageFromPersistedProfile(profile),
            isServiceProfile,
            isManaged: isServiceProfile ? false : await isProfileManaged(profileId),
        };
    },
});

/** Read current eligibility within the share lock; no request values or network I/O. */
export const resolveCurrentShareLinkPolicy = async (
    tx: ShareLinkTransaction,
    ownerProfileId: string,
    now: Date
): Promise<ShareLinkPolicySnapshot> => {
    const result = await tx.run(
        `MATCH (p:Profile {profileId: $profileId})
         OPTIONAL MATCH (p)-[:MANAGED_BY]->(directManager:Profile)
         OPTIONAL MATCH (manager:ProfileManager)-[:MANAGES]->(p)
         RETURN p.dob AS dob, p.type AS profileType,
                p.isServiceProfile AS isServiceProfile,
                (directManager IS NOT NULL OR manager IS NOT NULL) AS isManaged
         LIMIT 1`,
        { profileId: transformProfileId(ownerProfileId) }
    );
    const record = result.records[0];
    if (!record) return composeShareLinkPolicy('unknown', true);

    const profileType = record.get('profileType');
    const isServiceProfile = isServiceProfileExemptFromGuardianship(
        record.get('isServiceProfile'),
        profileType
    );
    return composeShareLinkPolicy(
        ageFromPersistedProfile({ dob: record.get('dob'), type: profileType }, now),
        isServiceProfile ? false : record.get('isManaged') !== false,
        isServiceProfile
    );
};

export const productionShareViewEligibilitySource: ShareViewEligibilitySource = {
    isEligible: async (tx, input) =>
        (await resolveCurrentShareLinkPolicy(tx, input.ownerProfileId, input.now))
            .viewCountingEnabled,
};
