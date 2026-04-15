import { Profile } from '@models';
import { neogma } from '@instance';
import { ProfileType } from 'types/profile';

export const deleteProfile = async (profile: ProfileType): Promise<void> => {
    // Expire any pending guardian credentials this profile was waiting on approval for
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[:CREATED_INBOX_CREDENTIAL]->(ic:InboxCredential)
         WHERE ic.guardianStatus = 'AWAITING_GUARDIAN'
         SET ic.guardianStatus = 'GUARDIAN_REJECTED', ic.currentStatus = 'EXPIRED'`,
        { profileId: profile.profileId }
    );

    // Expire any pending guardian credentials this profile was supposed to approve (guardian side)
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[:HAS_CONTACT_METHOD]->(cm:ContactMethod {type: 'email'})
         MATCH (ic:InboxCredential {guardianStatus: 'AWAITING_GUARDIAN'})
         WHERE ic.guardianEmail = cm.value
         SET ic.guardianStatus = 'GUARDIAN_REJECTED', ic.currentStatus = 'EXPIRED'`,
        { profileId: profile.profileId }
    );

    // Delete contact methods owned by this profile to prevent orphaned nodes
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[:HAS_CONTACT_METHOD]->(cm:ContactMethod)
         DETACH DELETE cm`,
        { profileId: profile.profileId }
    );

    await Profile.delete({ detach: true, where: { profileId: profile.profileId } });
};
