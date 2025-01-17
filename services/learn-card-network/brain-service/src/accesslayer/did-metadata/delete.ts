import { DidMetadata } from '@models';
import { deleteDidDocForProfile } from '@cache/did-docs';
import { getProfilesAssociatedWithMetadata } from './relationships/read';

export const deleteDidMetadata = async (id: string): Promise<void> => {
    const profiles = await getProfilesAssociatedWithMetadata(id);

    await Promise.all([
        DidMetadata.delete({ detach: true, where: { id } }),
        ...profiles.map(profile => deleteDidDocForProfile(profile.profileId)),
    ]);
};
