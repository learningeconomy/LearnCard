import { ConsentFlowTerms, LCNProfile } from '@learncard/types';
import { v4 as uuid } from 'uuid';
import { ConsentFlowContract, Profile } from '@models';
import { BindParam, QueryBuilder } from 'neogma';
import { DbContractType } from 'types/consentflowcontract';
import { flattenObject } from '@helpers/objects.helpers';

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
    terms: ConsentFlowTerms
) => {
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
                {
                    ...Profile.getRelationshipByAlias('consentsTo'),
                    properties: {
                        id: uuid(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    identifier: 'terms',
                },
                { identifier: 'contract' },
            ],
        })
        .set('terms += $params')
        .run();

    return result.summary.counters.containsUpdates();
};
