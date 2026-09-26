import { getProfileByProfileId } from '@accesslayer/profile/read';
import { isProfileManaged } from '@accesslayer/profile/relationships/read';
import type { ShareViewEligibilitySource } from '@accesslayer/share-link/types';
import type { ShareLinkTransaction } from '@accesslayer/share-link/transaction';
import { transformProfileId } from '@helpers/profile.helpers';

import { composeShareLinkPolicy } from './resolver';
import type { ShareLinkOwnerAge, ShareLinkPolicySnapshot, ShareLinkPolicySource } from './types';

const ADULT_AGE = 18;

/** A missing or malformed birthdate never grants view tracking. */
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
 * Profile birthdate is persisted server-side, but self-reported rather than
 * independently verified. Unknown dates and child profiles stay restricted.
 */
export const createProductionShareLinkPolicySource = (options?: {
    resolveOwnerAge?: (profileId: string) => Promise<ShareLinkOwnerAge>;
}): ShareLinkPolicySource => ({
    resolveOwnerAge:
        options?.resolveOwnerAge ??
        (async profileId => ageFromPersistedProfile(await getProfileByProfileId(profileId))),
    isManaged: isProfileManaged,
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
                (directManager IS NOT NULL OR manager IS NOT NULL) AS isManaged
         LIMIT 1`,
        { profileId: transformProfileId(ownerProfileId) }
    );
    const record = result.records[0];
    if (!record) return composeShareLinkPolicy('unknown', true);

    return composeShareLinkPolicy(
        ageFromPersistedProfile({ dob: record.get('dob'), type: record.get('profileType') }, now),
        record.get('isManaged') !== false
    );
};

export const productionShareViewEligibilitySource: ShareViewEligibilitySource = {
    isEligible: async (tx, input) =>
        (await resolveCurrentShareLinkPolicy(tx, input.ownerProfileId, input.now))
            .viewCountingEnabled,
};
