import { QueryBuilder } from 'neogma';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { Profile, ProfileInstance, ConsentFlowContract, ConsentFlowInstance } from '@models';
import { ConsentFlowType } from 'types/consentflowcontract';
import { ConsentFlowTerms, LCNProfile } from '@learncard/types';

export const isProfileConsentFlowContractAdmin = async (
    profile: ProfileInstance,
    contract: ConsentFlowInstance
) => {
    const query = new QueryBuilder().match({
        related: [
            { model: ConsentFlowContract, where: { id: contract.id } },
            `-[:${ConsentFlowContract.getRelationshipByAlias('createdBy').name}]-`,
            { identifier: 'profile', model: Profile, where: { profileId: profile.profileId } },
        ],
    });

    const result = await query.return('count(profile) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0) > 0;
};

export const getConsentFlowContractsForProfile = async (
    profile: ProfileInstance,
    { limit }: { limit: number }
): Promise<ConsentFlowType[]> => {
    const query = new QueryBuilder().match({
        related: [
            { identifier: 'contract', model: ConsentFlowContract },
            `-[:${ConsentFlowContract.getRelationshipByAlias('createdBy').name}]-`,
            { model: Profile, where: { profileId: profile.profileId } },
        ],
    });

    const results = convertQueryResultToPropertiesObjectArray<{
        contract: ConsentFlowType;
    }>(await query.return('DISTINCT contract').limit(limit).run());

    return results.map(({ contract }) => contract);
};

export const getConsentedContractsForProfile = async (
    profile: ProfileInstance,
    { limit }: { limit: number }
): Promise<
    {
        contract: ConsentFlowType;
        owner: LCNProfile;
        terms: ConsentFlowTerms;
    }[]
> => {
    const query = new QueryBuilder().match({
        related: [
            { model: Profile, where: { profileId: profile.profileId } },
            { ...Profile.getRelationshipByAlias('consentsTo'), identifier: 'terms' },
            { identifier: 'contract', model: ConsentFlowContract },
            `-[:${ConsentFlowContract.getRelationshipByAlias('createdBy').name}]-`,
            { model: Profile, identifier: 'owner' },
        ],
    });

    const results = convertQueryResultToPropertiesObjectArray<{
        contract: ConsentFlowType;
        owner: LCNProfile;
        terms: { terms: string; createdAt: string; updatedAt: string };
    }>(await query.return('DISTINCT contract, owner, terms').limit(limit).run());

    return results.map(result => ({ ...result, terms: JSON.parse(result.terms.terms) }));
};
