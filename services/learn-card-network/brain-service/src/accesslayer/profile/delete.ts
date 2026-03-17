import { Profile } from '@models';
import { neogma } from '@instance';
import { ProfileType } from 'types/profile';

export const deleteProfile = async (profile: ProfileType): Promise<void> => {
    // Delete contact methods owned by this profile to prevent orphaned nodes
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[:HAS_CONTACT_METHOD]->(cm:ContactMethod)
         DETACH DELETE cm`,
        { profileId: profile.profileId }
    );

    await Profile.delete({ detach: true, where: { profileId: profile.profileId } });
};
