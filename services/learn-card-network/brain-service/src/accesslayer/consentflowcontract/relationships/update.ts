import { QueryBuilder, BindParam } from 'neogma';
import { v4 as uuid } from 'uuid';
import {
    ConsentFlowTerms as ConsentFlowTermsType,
    ConsentFlowTransaction as ConsentFlowTransactionType,
    LCNNotificationTypeEnumValidator,
    LCNProfile,
} from '@learncard/types';
import { ConsentFlowTerms, ConsentFlowTransaction } from '@models';
import { flattenObject } from '@helpers/objects.helpers';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { DbContractType, DbTermsType } from 'types/consentflowcontract';

export const reconsentTerms = async (
    relationship: {
        terms: DbTermsType;
        consenter: LCNProfile;
        contract: DbContractType;
        contractOwner: LCNProfile;
    },
    {
        terms,
        expiresAt,
        oneTime,
    }: { terms: ConsentFlowTermsType; expiresAt?: string; oneTime?: boolean }
): Promise<boolean> => {
    const transaction = {
        id: uuid(),
        action: 'consent',
        date: new Date().toISOString(),
        ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
        ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
    } as const satisfies ConsentFlowTransactionType;

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
        .match({
            model: ConsentFlowTerms,
            where: { id: relationship.terms.id },
            identifier: 'terms',
        })
        .set('terms += $params')
        .with('terms')
        .create({
            related: [
                {
                    identifier: 'transaction',
                    model: ConsentFlowTransaction,
                    properties: transaction,
                },
                ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                { identifier: 'terms' },
            ],
        })
        .set('transaction += $params')
        .run();

    await addNotificationToQueue({
        type: LCNNotificationTypeEnumValidator.enum.CONSENT_FLOW_TRANSACTION,
        from: relationship.consenter,
        to: relationship.contractOwner,
        message: {
            title: 'New Consent Transaction',
            body: `${relationship.consenter.displayName} has just reconsented to ${relationship.contract.name}!`,
        },
        data: { transaction },
    });

    return result.summary.counters.containsUpdates();
};

export const updateTerms = async (
    relationship: {
        terms: DbTermsType;
        consenter: LCNProfile;
        contract: DbContractType;
        contractOwner: LCNProfile;
    },
    {
        terms,
        expiresAt,
        oneTime,
    }: { terms: ConsentFlowTermsType; expiresAt?: string; oneTime?: boolean }
): Promise<boolean> => {
    const transaction = {
        id: uuid(),
        action: 'update',
        date: new Date().toISOString(),
        ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
        ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
    } as const satisfies ConsentFlowTransactionType;

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
        .match({
            model: ConsentFlowTerms,
            where: { id: relationship.terms.id },
            identifier: 'terms',
        })
        .set('terms += $params')
        .with('terms')
        .create({
            related: [
                {
                    identifier: 'transaction',
                    model: ConsentFlowTransaction,
                    properties: transaction,
                },
                ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                { identifier: 'terms' },
            ],
        })
        .set('transaction += $params')
        .run();

    await addNotificationToQueue({
        type: LCNNotificationTypeEnumValidator.enum.CONSENT_FLOW_TRANSACTION,
        from: relationship.consenter,
        to: relationship.contractOwner,
        message: {
            title: 'New Consent Transaction',
            body: `${relationship.consenter.displayName} has just updated their terms to ${relationship.contract.name}!`,
        },
        data: { transaction },
    });

    return result.summary.counters.containsUpdates();
};

export const withdrawTerms = async (relationship: {
    terms: DbTermsType;
    consenter: LCNProfile;
    contract: DbContractType;
    contractOwner: LCNProfile;
}): Promise<boolean> => {
    const transaction = {
        id: uuid(),
        action: 'withdraw',
        date: new Date().toISOString(),
    } as const satisfies ConsentFlowTransactionType;

    const result = await new QueryBuilder()
        .match({
            model: ConsentFlowTerms,
            where: { id: relationship.terms.id },
            identifier: 'terms',
        })
        .set('terms.status = "withdrawn"')
        .with('terms')
        .create({
            related: [
                {
                    identifier: 'transaction',
                    model: ConsentFlowTransaction,
                    properties: transaction,
                },
                ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                { identifier: 'terms' },
            ],
        })
        .run();

    await addNotificationToQueue({
        type: LCNNotificationTypeEnumValidator.enum.CONSENT_FLOW_TRANSACTION,
        from: relationship.consenter,
        to: relationship.contractOwner,
        message: {
            title: 'New Consent Transaction',
            body: `${relationship.consenter.displayName} has just withdrawn their terms to ${relationship.contract.name}!`,
        },
        data: { transaction },
    });

    return result.summary.counters.containsUpdates();
};
