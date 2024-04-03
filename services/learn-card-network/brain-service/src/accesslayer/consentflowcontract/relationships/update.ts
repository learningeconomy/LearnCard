import { QueryBuilder, BindParam } from 'neogma';
import { v4 as uuid } from 'uuid';
import { ConsentFlowTerms as ConsentFlowTermsType } from '@learncard/types';
import { ConsentFlowTerms, ConsentFlowTransaction } from '@models';
import { flattenObject } from '@helpers/objects.helpers';

export const reconsentTermsById = async (
    id: string,
    {
        terms,
        expiresAt,
        oneTime,
    }: { terms: ConsentFlowTermsType; expiresAt?: string; oneTime?: boolean }
): Promise<boolean> => {
    const result = await new QueryBuilder(
        new BindParam({
            params: flattenObject({
                terms,
                updatedAt: new Date().toISOString(),
                status: oneTime ? 'stale' : 'live',
                ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
                ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
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
                        action: 'consent',
                        date: new Date().toISOString(),
                        ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
                        ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
                    },
                },
            ],
        })
        .set('transaction += $params')
        .run();

    return result.summary.counters.containsUpdates();
};

export const updateTermsById = async (
    id: string,
    {
        terms,
        expiresAt,
        oneTime,
    }: { terms: ConsentFlowTermsType; expiresAt?: string; oneTime?: boolean }
): Promise<boolean> => {
    const result = await new QueryBuilder(
        new BindParam({
            params: flattenObject({
                terms,
                updatedAt: new Date().toISOString(),
                status: oneTime ? 'stale' : 'live',
                ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
                ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
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
                        ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
                        ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
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
