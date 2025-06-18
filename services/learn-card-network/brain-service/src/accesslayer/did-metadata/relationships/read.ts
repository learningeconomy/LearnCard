import { Profile, DidMetadata } from '@models';
import { QueryBuilder } from 'neogma';

import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import type { FlatProfileType, ProfileType } from 'types/profile';
import { inflateObject } from '@helpers/objects.helpers';
import type { DidMetadataType, FlatDidMetadataType } from 'types/did-metadata';

export const getProfilesAssociatedWithMetadata = async (id: string): Promise<ProfileType[]> => {
    const results = convertQueryResultToPropertiesObjectArray<{
        profile: FlatProfileType;
    }>(
        await new QueryBuilder()
            .match({
                related: [
                    { model: DidMetadata, where: { id } },
                    DidMetadata.getRelationshipByAlias('associatedWith'),
                    { model: Profile, identifier: 'profile' },
                ],
            })
            .return('DISTINCT profile')
            .run()
    );

    return results.map(({ profile }) => inflateObject<ProfileType>(profile as any));
};

export const getDidMetadataForProfile = async (profileId: string): Promise<DidMetadataType[]> => {
    const results = convertQueryResultToPropertiesObjectArray<{
        metadata: FlatDidMetadataType;
    }>(
        await new QueryBuilder()
            .match({
                related: [
                    { model: DidMetadata, identifier: 'metadata' },
                    DidMetadata.getRelationshipByAlias('associatedWith'),
                    { model: Profile, where: { profileId } },
                ],
            })
            .return('DISTINCT metadata')
            .run()
    );

    return results.map(({ metadata }) => (inflateObject as any)(metadata));
};

export const isDidMetadataAssociatedWithProfile = async (
    metadataId: string,
    profileId: string
): Promise<boolean> => {
    const query = new QueryBuilder().match({
        related: [
            { model: DidMetadata, where: { id: metadataId } },
            { ...DidMetadata.getRelationshipByAlias('associatedWith') },
            { identifier: 'profile', model: Profile, where: { profileId } },
        ],
    });

    const result = await query.return('count(profile) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0) > 0;
};
