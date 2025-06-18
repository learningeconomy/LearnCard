import { QueryBuilder } from 'neogma';
import { DidMetadata } from '@models';
import type { DidMetadataType } from 'types/did-metadata';
import { inflateObject } from '@helpers/objects.helpers';

export const getDidMetadataById = async (id: string): Promise<DidMetadataType | null> => {
    const result = await new QueryBuilder()
        .match({
            model: DidMetadata,
            identifier: 'metadata',
            where: { id },
        })
        .return('metadata')
        .limit(1)
        .run();

    const metadata = result.records[0]?.get('metadata').properties;

    if (!metadata) return null;

    return (inflateObject as any)(metadata);
};
