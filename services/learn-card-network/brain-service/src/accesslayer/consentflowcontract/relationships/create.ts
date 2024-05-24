import {
    ConsentFlowTerms as ConsentFlowTermsType,
    ConsentFlowTransaction,
    LCNNotificationTypeEnumValidator,
    LCNProfile,
} from '@learncard/types';
import { v4 as uuid } from 'uuid';
import {
    ConsentFlowContract,
    ConsentFlowTerms,
    ConsentFlowTransaction as ConsentFlowTransactionModel,
    Profile,
} from '@models';
import { BindParam, QueryBuilder } from 'neogma';
import { DbContractType, FlatDbTermsType } from 'types/consentflowcontract';
import { flattenObject, inflateObject } from '@helpers/objects.helpers';
import { reconsentTerms } from './update';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';

export const setCreatorForContract = async (contract: DbContractType, profile: LCNProfile) => {
    return ConsentFlowContract.relateTo({
        alias: 'createdBy',
        where: {
            source: { id: contract.id },
            target: { profileId: profile.profileId },
        },
    });
};

export const consentToContract = async (
    consenter: LCNProfile,
    { contract, contractOwner }: { contract: DbContractType; contractOwner: LCNProfile },
    {
        terms,
        expiresAt,
        oneTime,
    }: { terms: ConsentFlowTermsType; expiresAt?: string; liveSyncing?: boolean; oneTime?: boolean }
) => {
    const existing = convertQueryResultToPropertiesObjectArray<{
        terms: FlatDbTermsType;
    }>(
        await new QueryBuilder()
            .match({
                related: [
                    { model: Profile, where: { profileId: consenter.profileId } },
                    ConsentFlowTerms.getRelationshipByAlias('createdBy'),
                    { model: ConsentFlowTerms, identifier: 'terms' },
                    ConsentFlowTerms.getRelationshipByAlias('consentsTo'),
                    { model: ConsentFlowContract, where: { id: contract.id } },
                ],
            })
            .return('terms')
            .run()
    );

    if (existing.length > 0) {
        return reconsentTerms(
            { terms: inflateObject(existing[0]!.terms), consenter, contract, contractOwner },
            { terms, expiresAt, oneTime }
        );
    }

    const transaction = {
        id: uuid(),
        action: 'consent',
        date: new Date().toISOString(),
        ...(expiresAt ? { expiresAt } : {}),
        ...(oneTime ? { oneTime } : {}),
    } as const satisfies ConsentFlowTransaction;

    const result = await new QueryBuilder(new BindParam({ params: flattenObject({ terms }) }))
        .match({
            multiple: [
                {
                    model: Profile,
                    where: { profileId: consenter.profileId },
                    identifier: 'profile',
                },
                { model: ConsentFlowContract, where: { id: contract.id }, identifier: 'contract' },
            ],
        })
        .create({
            related: [
                { identifier: 'profile' },
                ConsentFlowTerms.getRelationshipByAlias('createdBy'),
                {
                    model: ConsentFlowTerms,
                    properties: {
                        id: uuid(),
                        status: oneTime ? 'stale' : 'live',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        ...(expiresAt ? { expiresAt } : {}),
                        ...(oneTime ? { oneTime } : {}),
                    },
                    identifier: 'terms',
                },
                ConsentFlowTerms.getRelationshipByAlias('consentsTo'),
                { identifier: 'contract' },
            ],
        })
        .create({
            related: [
                {
                    identifier: 'transaction',
                    model: ConsentFlowTransactionModel,
                    properties: transaction,
                },
                ConsentFlowTransactionModel.getRelationshipByAlias('isFor'),
                { identifier: 'terms' },
            ],
        })
        .set('terms += $params')
        .set('transaction += $params')
        .run();

    await addNotificationToQueue({
        type: LCNNotificationTypeEnumValidator.enum.CONSENT_FLOW_TRANSACTION,
        from: consenter,
        to: contractOwner,
        message: {
            title: 'New Consent Transaction',
            body: `${consenter.displayName} has just consented to ${contract.name}!`,
        },
        data: { transaction },
    });

    return result.summary.counters.containsUpdates();
};
