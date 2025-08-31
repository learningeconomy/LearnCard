import { v4 as uuid } from 'uuid';
import { BindParam, QueryBuilder } from 'neogma';

import { flattenObject, inflateObject } from '@helpers/objects.helpers';
import { Integration } from '@models';
import { IntegrationCreateType, IntegrationType } from 'types/integration';

export const createIntegration = async (
    input: IntegrationCreateType
): Promise<IntegrationType> => {
    const params = flattenObject({
        id: uuid(),
        name: input.name,
        description: input.description,
        publishableKey: uuid(),
        whitelistedDomains: input.whitelistedDomains ?? [],
    });

    const result = await new QueryBuilder(new BindParam({ params }))
        .create({ model: Integration, identifier: 'integration' })
        .set('integration += $params')
        .return('integration')
        .limit(1)
        .run();

    const integration = result.records[0]?.get('integration').properties!;

    return (inflateObject as any)(integration);
};
