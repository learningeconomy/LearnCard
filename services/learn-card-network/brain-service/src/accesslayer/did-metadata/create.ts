import { v4 as uuid } from 'uuid';

import { flattenObject, inflateObject } from '@helpers/objects.helpers';
import type { DidDocument } from '@learncard/types';

import { DidMetadata } from '@models';
import { BindParam, QueryBuilder } from 'neogma';
import type { DidMetadataType } from 'types/did-metadata';

export const createDidMetadata = async (input: Partial<DidDocument>): Promise<DidMetadataType> => {
    const result = await new QueryBuilder(
        new BindParam({ params: (flattenObject as any)({ ...input, id: uuid() }) })
    )
        .create({ model: DidMetadata, identifier: 'didMetadata' })
        .set('didMetadata += $params')
        .return('didMetadata')
        .limit(1)
        .run();

    const didMetadata = result.records[0]?.get('didMetadata').properties!;

    return (inflateObject as any)(didMetadata);
};
