import { QueryBuilder, BindParam } from 'neogma';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { Profile, ProfileInstance, ConsentFlowContract, ConsentFlowTerms } from '@models';
import {
    DbTermsType,
    FlatDbTermsType,
    DbContractType,
    FlatDbContractType,
} from 'types/consentflowcontract';
import { ConsentFlowContractQuery, ConsentFlowTermsQuery, LCNProfile } from '@learncard/types';
import { getIdFromUri } from '@helpers/uri.helpers';
import { flattenObject, inflateObject } from '@helpers/objects.helpers';

export const isProfileConsentFlowContractAdmin = async (
    profile: ProfileInstance,
    contract: DbContractType
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
    profile: ProfileInstance | string,
    contract: DbContractType
): Promise<boolean> => {
    const query = new QueryBuilder().match({
        related: [
            {
                model: Profile,
                where: { profileId: typeof profile === 'string' ? profile : profile.profileId },
            },
            { ...ConsentFlowTerms.getRelationshipByAlias('createdBy') },
            { model: ConsentFlowTerms, identifier: 'terms', where: { status: 'live' } },
            { ...ConsentFlowTerms.getRelationshipByAlias('consentsTo') },
            { model: ConsentFlowContract, where: { id: contract.id } },
        ],
    });

    const result = await query.return('count(terms) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0) > 0;
};

export const getContractDetailsById = async (
    id: string
): Promise<{ contractOwner: LCNProfile; contract: DbContractType } | null> => {
    const query = new QueryBuilder().match({
        related: [
            { model: ConsentFlowContract, where: { id }, identifier: 'contract' },
            `-[:${ConsentFlowContract.getRelationshipByAlias('createdBy').name}]-`,
            { identifier: 'profile', model: Profile },
        ],
    });

    const result = convertQueryResultToPropertiesObjectArray<{
        contract: FlatDbContractType;
        profile: LCNProfile;
    }>(await query.return('contract, profile').run());

    return result.length > 0
        ? { contract: inflateObject(result[0]!.contract), contractOwner: result[0]!.profile }
        : null;
};

export const getContractDetailsByUri = async (
    uri: string
): Promise<{ contractOwner: LCNProfile; contract: DbContractType } | null> => {
    const id = getIdFromUri(uri);

    return getContractDetailsById(id);
};

export const getContractTermsForProfile = async (
    profile: ProfileInstance | string,
    contract: DbContractType
): Promise<DbTermsType | null> => {
    const result = convertQueryResultToPropertiesObjectArray<{
        terms: FlatDbTermsType;
    }>(
        await new QueryBuilder()
            .match({
                related: [
                    {
                        model: Profile,
                        where: {
                            profileId: typeof profile === 'string' ? profile : profile.profileId,
                        },
                    },
                    ConsentFlowTerms.getRelationshipByAlias('createdBy'),
                    { model: ConsentFlowTerms, identifier: 'terms' },
                    ConsentFlowTerms.getRelationshipByAlias('consentsTo'),
                    { model: ConsentFlowContract, where: { id: contract.id } },
                ],
            })
            .return('terms')
            .run()
    );

    return result.length > 0 ? inflateObject<DbTermsType>(result[0]!.terms) : null;
};

export const getContractTermsById = async (
    id: string
): Promise<{
    terms: DbTermsType;
    consenter: LCNProfile;
    contract: DbContractType;
} | null> => {
    const result = convertQueryResultToPropertiesObjectArray<{
        consenter: LCNProfile;
        terms: FlatDbTermsType;
        contract: FlatDbContractType;
    }>(
        await new QueryBuilder()
            .match({
                related: [
                    { model: Profile, identifier: 'consenter' },
                    ConsentFlowTerms.getRelationshipByAlias('createdBy'),
                    { model: ConsentFlowTerms, identifier: 'terms', where: { id } },
                    ConsentFlowTerms.getRelationshipByAlias('consentsTo'),
                    { model: ConsentFlowContract, identifier: 'contract' },
                ],
            })
            .return('consenter, terms, contract')
            .run()
    );

    return result.length > 0
        ? {
            consenter: result[0]!.consenter,
            terms: inflateObject(result[0]!.terms),
            contract: inflateObject(result[0]!.contract),
        }
        : null;
};

export const getContractTermsByUri = async (
    uri: string
): Promise<{
    terms: DbTermsType;
    consenter: LCNProfile;
    contract: DbContractType;
} | null> => {
    return getContractTermsById(getIdFromUri(uri));
};

export const getConsentFlowContractsForProfile = async (
    profile: ProfileInstance,
    {
        query: matchQuery = {},
        limit,
        cursor,
    }: { query?: ConsentFlowContractQuery; limit: number; cursor?: string }
): Promise<DbContractType[]> => {
    const _query = new QueryBuilder(
        new BindParam({ params: flattenObject({ contract: matchQuery }), cursor })
    )
        .match({
            related: [
                {
                    identifier: 'contract',
                    model: ConsentFlowContract,
                },
                `-[:${ConsentFlowContract.getRelationshipByAlias('createdBy').name}]-`,
                { model: Profile, where: { profileId: profile.profileId } },
            ],
        })
        .where('all(key IN keys($params) WHERE contract[key] = $params[key])');

    const query = cursor ? _query.raw('AND contract.updatedAt > $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        contract: FlatDbContractType;
    }>(await query.return('DISTINCT contract').orderBy('contract.updatedAt').limit(limit).run());

    return results.map(({ contract }) => inflateObject(contract));
};

export const getConsentedContractsForProfile = async (
    profile: ProfileInstance,
    {
        query: matchQuery = {},
        limit,
        cursor,
    }: { query?: ConsentFlowTermsQuery; limit: number; cursor?: string }
): Promise<
    {
        contract: DbContractType;
        owner: LCNProfile;
        terms: DbTermsType;
    }[]
> => {
    const _query = new QueryBuilder(
        new BindParam({ params: flattenObject({ terms: matchQuery }), cursor })
    )
        .match({
            related: [
                { model: Profile, where: { profileId: profile.profileId } },
                ConsentFlowTerms.getRelationshipByAlias('createdBy'),
                { identifier: 'terms', model: ConsentFlowTerms },
                ConsentFlowTerms.getRelationshipByAlias('consentsTo'),
                { identifier: 'contract', model: ConsentFlowContract },
                `-[:${ConsentFlowContract.getRelationshipByAlias('createdBy').name}]-`,
                { model: Profile, identifier: 'owner' },
            ],
        })
        .where('all(key IN keys($params) WHERE terms[key] = $params[key])');

    const query = cursor ? _query.raw('AND terms.updatedAt > $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        contract: FlatDbContractType;
        owner: LCNProfile;
        terms: FlatDbTermsType;
    }>(
        await query
            .return('DISTINCT contract, owner, terms')
            .orderBy('terms.updatedAt')
            .limit(limit)
            .run()
    );

    return results.map(result => ({
        ...result,
        contract: inflateObject(result.contract),
        terms: inflateObject(result.terms),
    }));
};
