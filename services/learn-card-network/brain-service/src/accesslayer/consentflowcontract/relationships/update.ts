import { QueryBuilder, BindParam } from 'neogma';
import { v4 as uuid } from 'uuid';
import { ConsentFlowTerms as ConsentFlowTermsType } from '@learncard/types';
import { ConsentFlowTerms, ConsentFlowTransaction } from '@models';
import { flattenObject } from '@helpers/objects.helpers';

export const updateTermsById = async (
    id: string,
    {
        terms,
        expiresAt,
        liveSyncing,
        oneTime,
    }: { terms: ConsentFlowTermsType; expiresAt?: string; liveSyncing?: boolean; oneTime?: boolean }
): Promise<boolean> => {
    const result = await new QueryBuilder(
        new BindParam({
            params: flattenObject({
                terms,
                updatedAt: new Date().toISOString(),
                status: oneTime ? 'stale' : 'live',
                ...(typeof expiresAt === 'string' ? { expiresAt } : {}), // Allow removing by passing ''
                ...(liveSyncing ? { liveSyncing } : {}),
                ...(oneTime ? { oneTime } : {}),
            }),
        })
    )
        .match({ model: ConsentFlowTerms, where: { id }, identifier: 'terms' })
        .set('terms += $params')
        .with('terms')
        .create({
            related: [
                { identifier: 'terms' },
                ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                {
                    identifier: 'transaction',
                    model: ConsentFlowTransaction,
                    properties: {
                        id: uuid(),
                        action: 'update',
                        date: new Date().toISOString(),
                        ...(expiresAt ? { expiresAt } : {}),
                        ...(oneTime ? { oneTime } : {}),
                    },
                },
            ],
        })
        .set('transaction += $params')
        .run();

    return result.summary.counters.containsUpdates();
};

export const withdrawTermsById = async (id: string): Promise<boolean> => {
    const result = await new QueryBuilder()
        .match({ model: ConsentFlowTerms, where: { id }, identifier: 'terms' })
        .set('terms.status = "withdrawn"')
        .with('terms')
        .create({
            related: [
                { identifier: 'terms' },
                ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                {
                    identifier: 'transaction',
                    model: ConsentFlowTransaction,
                    properties: {
                        id: uuid(),
                        action: 'withdraw',
                        date: new Date().toISOString(),
                    },
                },
            ],
        })
        .run();

    return result.summary.counters.containsUpdates();
};
