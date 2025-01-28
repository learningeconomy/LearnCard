import { deleteDidDocForProfile } from '@cache/did-docs';
import { Profile, DidMetadata } from '@models';
import { QueryBuilder } from 'neogma';

export const associateDidMetadataWithProfile = async (
    metadataId: string,
    profileId: string
): Promise<boolean> => {
    await new QueryBuilder()
        .match({ model: DidMetadata, identifier: 'metadata', where: { id: metadataId } })
        .match({ model: Profile, identifier: 'profile', where: { profileId } })
        .create({
            related: [
                { identifier: 'metadata' },
                DidMetadata.getRelationshipByAlias('associatedWith'),
                { identifier: 'profile' },
            ],
        })
        .run();

    await deleteDidDocForProfile(profileId);

    return true;
};
