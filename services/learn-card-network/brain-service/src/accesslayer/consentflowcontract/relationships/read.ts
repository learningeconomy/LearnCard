import { QueryBuilder } from 'neogma';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { Profile, ProfileInstance, ConsentFlowContract } from '@models';
import { ConsentFlowType } from 'types/consentflowcontract';

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
