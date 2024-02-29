import { QueryBuilder, Where, Op } from 'neogma';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { Profile, ProfileInstance, ConsentFlowContract, ConsentFlowInstance } from '@models';
import { ConsentFlowTermsType, ConsentFlowType } from 'types/consentflowcontract';
import { LCNProfile } from '@learncard/types';
import { getIdFromUri } from '@helpers/uri.helpers';

export const isProfileConsentFlowContractAdmin = async (
    profile: ProfileInstance,
    contract: ConsentFlowInstance
): Promise<boolean> => {
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

export const hasProfileConsentedToContract = async (
    profile: ProfileInstance,
    contract: ConsentFlowInstance
): Promise<boolean> => {
    const query = new QueryBuilder().match({
        related: [
            { model: Profile, where: { profileId: profile.profileId } },
            { ...Profile.getRelationshipByAlias('consentsTo'), identifier: 'terms' },
            { model: ConsentFlowContract, where: { id: contract.id } },
        ],
    });

    const result = await query.return('count(terms) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0) > 0;
};

export const getContractTermsForProfile = async (
    profile: ProfileInstance,
    contract: ConsentFlowInstance
): Promise<ConsentFlowTermsType | null> => {
    const result = await profile.findRelationships({
        alias: 'consentsTo',
        where: { target: { id: contract.id }, relationship: {} },
    });

    return result.length > 0 ? result[0]!.relationship : null;
};

export const getContractTermsById = async (
    id: string
): Promise<{
    terms: ConsentFlowTermsType;
    consenter: LCNProfile;
    contract: ConsentFlowType;
} | null> => {
    const result = await Profile.findRelationships({
        alias: 'consentsTo',
        where: { relationship: { id } },
    });

    return result.length > 0
        ? {
            terms: result[0]!.relationship,
            consenter: result[0]!.source,
            contract: result[0]!.target,
        }
        : null;
};

export const getContractTermsByUri = async (
    uri: string
): Promise<{
    terms: ConsentFlowTermsType;
    consenter: LCNProfile;
    contract: ConsentFlowType;
} | null> => {
    return getContractTermsById(getIdFromUri(uri));
};

export const getConsentFlowContractsForProfile = async (
    profile: ProfileInstance,
    { limit, cursor }: { limit: number; cursor?: string }
): Promise<ConsentFlowType[]> => {
    const _query = new QueryBuilder().match({
        related: [
            { identifier: 'contract', model: ConsentFlowContract },
            `-[:${ConsentFlowContract.getRelationshipByAlias('createdBy').name}]-`,
            { model: Profile, where: { profileId: profile.profileId } },
        ],
    });

    const query = cursor
        ? _query.where(
            new Where({ contract: { updatedAt: { [Op.gt]: cursor } } }, _query.getBindParam())
        )
        : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        contract: ConsentFlowType;
    }>(await query.return('DISTINCT contract').orderBy('contract.updatedAt').limit(limit).run());

    return results.map(({ contract }) => contract);
};

export const getConsentedContractsForProfile = async (
    profile: ProfileInstance,
    { limit, cursor }: { limit: number; cursor?: string }
): Promise<
    {
        contract: ConsentFlowType;
        owner: LCNProfile;
        terms: ConsentFlowTermsType;
    }[]
> => {
    const _query = new QueryBuilder().match({
        related: [
            { model: Profile, where: { profileId: profile.profileId } },
            { ...Profile.getRelationshipByAlias('consentsTo'), identifier: 'terms' },
            { identifier: 'contract', model: ConsentFlowContract },
            `-[:${ConsentFlowContract.getRelationshipByAlias('createdBy').name}]-`,
            { model: Profile, identifier: 'owner' },
        ],
    });

    const query = cursor
        ? _query.where(
            new Where({ terms: { updatedAt: { [Op.gt]: cursor } } }, _query.getBindParam())
        )
        : _query;

    return convertQueryResultToPropertiesObjectArray<{
        contract: ConsentFlowType;
        owner: LCNProfile;
        terms: ConsentFlowTermsType;
    }>(
        await query
            .return('DISTINCT contract, owner, terms')
            .orderBy('terms.updatedAt')
            .limit(limit)
            .run()
    );
};
