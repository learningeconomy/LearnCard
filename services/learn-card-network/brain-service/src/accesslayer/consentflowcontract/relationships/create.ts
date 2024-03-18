import { ConsentFlowTerms as ConsentFlowTermsType, LCNProfile } from '@learncard/types';
import { v4 as uuid } from 'uuid';
import { ConsentFlowContract, ConsentFlowTerms, ConsentFlowTransaction, Profile } from '@models';
import { BindParam, QueryBuilder } from 'neogma';
import { DbContractType } from 'types/consentflowcontract';
import { flattenObject } from '@helpers/objects.helpers';
import { updateTermsById } from './update';

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
    profile: LCNProfile,
    contract: DbContractType,
    {
        terms,
        expiresAt,
        oneTime,
    }: { terms: ConsentFlowTermsType; expiresAt?: string; liveSyncing?: boolean; oneTime?: boolean }
) => {
    const existing = await new QueryBuilder()
        .match({
            related: [
                { model: Profile, where: { profileId: profile.profileId } },
                ConsentFlowTerms.getRelationshipByAlias('createdBy'),
                { model: ConsentFlowTerms, identifier: 'terms' },
                ConsentFlowTerms.getRelationshipByAlias('consentsTo'),
                { model: ConsentFlowContract, where: { id: contract.id } },
            ],
        })
        .return('terms')
        .run();

    if (existing.records.length > 0) {
        return updateTermsById(existing.records[0]?.get('id'), {
            terms,
            expiresAt,
            oneTime,
        });
    }

    const result = await new QueryBuilder(new BindParam({ params: flattenObject({ terms }) }))
        .match({
            multiple: [
                { model: Profile, where: { profileId: profile.profileId }, identifier: 'profile' },
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
                { identifier: 'terms' },
                ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                {
                    identifier: 'transaction',
                    model: ConsentFlowTransaction,
                    properties: {
                        id: uuid(),
                        action: 'consent',
                        date: new Date().toISOString(),
                        ...(expiresAt ? { expiresAt } : {}),
                        ...(oneTime ? { oneTime } : {}),
                    },
                },
            ],
        })
        .set('terms += $params')
        .set('transaction += $params')
        .run();

    return result.summary.counters.containsUpdates();
};
