import { QueryBuilder, BindParam } from 'neogma';
import { ConsentFlowTerms } from '@learncard/types';
import { Profile, ConsentFlowContract } from '@models';
import { flattenObject } from '@helpers/objects.helpers';

export const updateTermsById = async (id: string, terms: ConsentFlowTerms): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ params: flattenObject({ terms }) }))
        .match({
            related: [
                { model: Profile },
                {
                    ...Profile.getRelationshipByAlias('consentsTo'),
                    where: { id },
                    identifier: 'terms',
                },
                { model: ConsentFlowContract },
            ],
        })
        .set('terms += $params')
        .run();

    return result.summary.counters.containsUpdates();
};
