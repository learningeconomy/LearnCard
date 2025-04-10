import { v4 as uuid } from 'uuid';

import { flattenObject, inflateObject } from '@helpers/objects.helpers';
import { AuthGrant } from '@models';
import { BindParam, QueryBuilder } from 'neogma';
import { AuthGrantType } from 'types/auth-grant';

export const createAuthGrant = async (input: Partial<AuthGrantType>): Promise<AuthGrantType> => {
    const result = await new QueryBuilder(
        new BindParam({ params: (flattenObject as any)({ ...input, id: uuid() }) })
    )
        .create({ model: AuthGrant, identifier: 'authGrant' })
        .set('authGrant += $params')
        .return('authGrant')
        .limit(1)
        .run();

    const authGrant = result.records[0]?.get('authGrant').properties!;

    return (inflateObject as any)(authGrant);
};
