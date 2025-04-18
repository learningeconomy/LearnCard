import { QueryBuilder, BindParam } from 'neogma';
import { flattenObject } from '@helpers/objects.helpers';
import { DidMetadata } from '@models';
import { DidMetadataType } from 'types/did-metadata';
import { DidDocument } from '@learncard/types';
import { getProfilesAssociatedWithMetadata } from './relationships/read';
import { deleteDidDocForProfile } from '@cache/did-docs';

export const updateDidMetadata = async (
    metadata: DidMetadataType,
    updates: Partial<DidDocument>
) => {
    const newUpdates = (flattenObject as any)({ ...metadata, ...updates });

    const query = new QueryBuilder(new BindParam({ params: newUpdates }))
        .match({ model: DidMetadata, where: { id: metadata.id }, identifier: 'metadata' })
        .set('metadata = {}')
        .set('metadata += $params');

    const result = await query.run();

    if (result.summary.updateStatistics.containsUpdates()) {
        const profiles = await getProfilesAssociatedWithMetadata(metadata.id);

        await Promise.all(profiles.map(profile => deleteDidDocForProfile(profile.profileId)));

        return true;
    }

    return false;
};
