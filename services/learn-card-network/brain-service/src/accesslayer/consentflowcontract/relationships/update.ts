import { QueryBuilder, BindParam } from 'neogma';
import { ConsentFlowTerms } from '@learncard/types';
import { Profile, ConsentFlowContract } from '@models';
import { flattenObject } from '@helpers/objects.helpers';

export const updateTermsById = async (
    id: string,
    {
        terms,
        expiresAt,
        liveSyncing,
        oneTime,
    }: { terms: ConsentFlowTerms; expiresAt?: string; liveSyncing?: boolean; oneTime?: boolean }
): Promise<boolean> => {
    const result = await new QueryBuilder(
        new BindParam({
            params: flattenObject({
                terms,
                ...(typeof expiresAt === 'string' ? { expiresAt } : {}), // Allow removing by passing ''
                ...(liveSyncing ? { liveSyncing } : {}),
                ...(oneTime ? { oneTime } : {}),
            }),
        })
    )
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
