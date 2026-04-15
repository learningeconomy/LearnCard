import { QueryBuilder, BindParam } from 'neogma';
import { Profile, ProfileManager } from '@models';

/**
 * Removes the MANAGES relationship between a ProfileManager (administered by guardianProfileId)
 * and the managed child profile. This severs the guardian-child link.
 */
export const deleteManagesRelationship = async (
    guardianProfileId: string,
    childProfileId: string
): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ guardianProfileId, childProfileId }))
        .match({
            related: [
                { model: Profile, where: { profileId: guardianProfileId }, identifier: 'guardian' },
                {
                    ...ProfileManager.getRelationshipByAlias('administratedBy'),
                    direction: 'in',
                },
                { model: ProfileManager, identifier: 'pm' },
            ],
        })
        .match({
            related: [
                { identifier: 'pm' },
                { ...ProfileManager.getRelationshipByAlias('manages'), identifier: 'rel' },
                { model: Profile, where: { profileId: childProfileId }, identifier: 'child' },
            ],
        })
        .delete('rel')
        .run();

    return result.summary.counters.updates().relationshipsDeleted > 0;
};
