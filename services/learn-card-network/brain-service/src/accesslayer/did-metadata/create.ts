import { v4 as uuid } from 'uuid';

import { flattenObject, inflateObject } from '@helpers/objects.helpers';
import { DidDocument } from '@learncard/types';

import { DidMetadata } from '@models';
import { BindParam, QueryBuilder } from 'neogma';
import { DidMetadataType } from 'types/did-metadata';

export const createDidMetadata = async (input: Partial<DidDocument>): Promise<DidMetadataType> => {
    const what = (flattenObject as any)({ ...input, id: uuid() });

    console.log({ what, input });
    console.log((inflateObject as any)(what));

    const result = await new QueryBuilder(new BindParam({ params: what }))
        .create({ model: DidMetadata, identifier: 'didMetadata' })
        .set('didMetadata += $params')
        .return('didMetadata')
        .limit(1)
        .run();

    const didMetadata = result.records[0]?.get('didMetadata').properties!;

    return (inflateObject as any)(didMetadata);
};
