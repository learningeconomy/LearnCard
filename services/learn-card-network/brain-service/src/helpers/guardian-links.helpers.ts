import { getContactMethodsForProfile } from '@accesslayer/contact-method/read';
import { getApprovedInboxCredentialsByGuardianEmail, getProfileForInboxCredential } from '@accesslayer/inbox-credential/read';
import { getProfilesThatManageAProfile } from '@accesslayer/profile/relationships/read';
import { createProfileManager } from '@accesslayer/profile-manager/create';
import { createManagesRelationship } from '@accesslayer/profile-manager/relationships/create';
import { ProfileType } from 'types/profile';

type GuardianLinkResult = {
    childProfileId: string;
    childDisplayName: string;
    managerId: string | null;
};

/**
 * For a given profile (assumed to be a guardian), finds all inbox credentials
 * where guardianEmail matches the profile's verified email and guardianStatus
 * is GUARDIAN_APPROVED, then establishes ProfileManager → MANAGES relationships
 * for each child profile.
 *
 * Safe to call server-side — only creates relationships, no credential state
 * changes or wallet interactions.
 */
export async function claimPendingGuardianLinksForProfile(
    profile: ProfileType
): Promise<GuardianLinkResult[]> {
    console.log('[claimPendingGuardianLinks] Starting for profile:', profile.profileId, 'did:', profile.did);

    const contactMethods = await getContactMethodsForProfile(profile.did);
    const verifiedEmail = contactMethods.find(
        cm => cm.type === 'email' && cm.isVerified
    );
    if (!verifiedEmail) {
        console.log('[claimPendingGuardianLinks] No verified email found. ContactMethods:', contactMethods.map(cm => ({ type: cm.type, value: cm.value, isVerified: cm.isVerified })));
        return [];
    }
    console.log('[claimPendingGuardianLinks] Verified email:', verifiedEmail.value);

    const approvedCredentials = await getApprovedInboxCredentialsByGuardianEmail(
        verifiedEmail.value
    );
    console.log('[claimPendingGuardianLinks] Approved credentials found:', approvedCredentials.length);
    if (approvedCredentials.length === 0) return [];

    const results: GuardianLinkResult[] = [];

    for (const inboxCredential of approvedCredentials) {
        try {
            const childProfile = await getProfileForInboxCredential(inboxCredential.id);
            if (!childProfile) {
                console.log('[claimPendingGuardianLinks] No child profile found for credential:', inboxCredential.id);
                continue;
            }
            console.log('[claimPendingGuardianLinks] Found child profile:', childProfile.profileId, 'for credential:', inboxCredential.id);

            const existingManagers = await getProfilesThatManageAProfile(childProfile.profileId);
            const alreadyManages = existingManagers.some(m => m.profileId === profile.profileId);

            let managerId: string | null = null;

            if (!alreadyManages) {
                console.log('[claimPendingGuardianLinks] Creating MANAGES relationship:', profile.profileId, '->', childProfile.profileId);
                const manager = await createProfileManager({
                    displayName: profile.displayName ?? 'Guardian',
                    managerType: 'guardian',
                });
                await Promise.all([
                    createManagesRelationship(manager.id, childProfile.profileId),
                    manager.relateTo({
                        alias: 'administratedBy',
                        where: { profileId: profile.profileId },
                    }),
                ]);
                managerId = manager.id;
                console.log('[claimPendingGuardianLinks] MANAGES relationship created, managerId:', managerId);
            } else {
                console.log('[claimPendingGuardianLinks] Already manages child:', childProfile.profileId);
            }

            results.push({
                childProfileId: childProfile.profileId,
                childDisplayName: childProfile.displayName ?? childProfile.profileId,
                managerId,
            });
        } catch (err) {
            console.error('[claimPendingGuardianLinksForProfile] Failed to process credential:', inboxCredential.id, err);
        }
    }

    return results;
}
