import { QueryBuilder, BindParam } from 'neogma';
import mapValues from 'lodash/mapValues';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { Profile, ConsentFlowContract, ConsentFlowTerms, ConsentFlowTransaction } from '@models';
import {
    DbTermsType,
    FlatDbTermsType,
    DbContractType,
    FlatDbContractType,
    FlatDbTransactionType,
    DbTransactionType,
} from 'types/consentflowcontract';
import {
    ConsentFlowContractData,
    ConsentFlowContractQuery,
    ConsentFlowDataQuery,
    ConsentFlowTermsQuery,
    ConsentFlowTransactionsQuery,
    LCNProfile,
} from '@learncard/types';
import { getIdFromUri } from '@helpers/uri.helpers';
import { flattenObject, inflateObject } from '@helpers/objects.helpers';
import { convertDataQueryToNeo4jQuery } from '@helpers/contract.helpers';
import { ProfileType } from 'types/profile';

export const isProfileConsentFlowContractAdmin = async (
    profile: ProfileType,
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
    profile: ProfileType | string,
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
    profile: ProfileType | string,
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
    contractOwner: LCNProfile;
} | null> => {
    const result = convertQueryResultToPropertiesObjectArray<{
        consenter: LCNProfile;
        terms: FlatDbTermsType;
        contract: FlatDbContractType;
        contractOwner: LCNProfile;
    }>(
        await new QueryBuilder()
            .match({
                related: [
                    { model: Profile, identifier: 'consenter' },
                    ConsentFlowTerms.getRelationshipByAlias('createdBy'),
                    { model: ConsentFlowTerms, identifier: 'terms', where: { id } },
                    ConsentFlowTerms.getRelationshipByAlias('consentsTo'),
                    { model: ConsentFlowContract, identifier: 'contract' },
                    `-[:${ConsentFlowContract.getRelationshipByAlias('createdBy').name}]-`,
                    { identifier: 'contractOwner', model: Profile },
                ],
            })
            .return('consenter, terms, contract, contractOwner')
            .run()
    );

    return result.length > 0
        ? {
            consenter: result[0]!.consenter,
            terms: inflateObject(result[0]!.terms),
            contract: inflateObject(result[0]!.contract),
            contractOwner: result[0]!.contractOwner,
        }
        : null;
};

export const getContractTermsByUri = async (
    uri: string
): Promise<{
    terms: DbTermsType;
    consenter: LCNProfile;
    contract: DbContractType;
    contractOwner: LCNProfile;
} | null> => {
    return getContractTermsById(getIdFromUri(uri));
};

export const getConsentFlowContractsForProfile = async (
    profile: ProfileType,
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
    profile: ProfileType,
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

export const getConsentedDataForProfile = async (
    profileId: string,
    { query = {}, limit, cursor }: { query?: ConsentFlowDataQuery; limit: number; cursor?: string }
): Promise<ConsentFlowContractData[]> => {
    const _dbQuery = new QueryBuilder(
        new BindParam({
            params: flattenObject({ terms: convertDataQueryToNeo4jQuery(query) }),
            cursor,
        })
    ).match({
        related: [
            { identifier: 'terms', model: ConsentFlowTerms },
            ConsentFlowTerms.getRelationshipByAlias('consentsTo'),
            { model: ConsentFlowContract },
            ConsentFlowContract.getRelationshipByAlias('createdBy'),
            { model: Profile, where: { profileId } },
        ],
        // The following is custom Cypher logic that has the following behavior:
        // If query key is true, ensure all resulting terms have that key
        // If query key is false, ensure no resulting terms have that key
        // If query key is not present, return all terms whether they have it or not
    }).where(`
all(key IN keys($params) WHERE 
    CASE $params[key]
        WHEN true THEN terms[key] IS NOT NULL AND terms[key] <> []
        WHEN false THEN terms[key] IS NULL OR terms[key] = []
    END
)
`);

    const dbQuery = cursor ? _dbQuery.raw('terms.updatedAt < $cursor') : _dbQuery;

    const results = convertQueryResultToPropertiesObjectArray<{
        terms: FlatDbTermsType;
    }>(await dbQuery.return('DISTINCT terms').orderBy('terms.updatedAt DESC').limit(limit).run());

    const terms = results.map(result => inflateObject<any>(result.terms));

    return terms.map(term => ({
        date: term.updatedAt!,
        credentials: {
            categories: mapValues(
                term.terms.read.credentials.categories,
                category => category.shared ?? []
            ),
        },
        personal: term.terms.read.personal,
    }));
};

export const getConsentedDataForContract = async (
    id: string,
    { query = {}, limit, cursor }: { query?: ConsentFlowDataQuery; limit: number; cursor?: string }
): Promise<ConsentFlowContractData[]> => {
    const _dbQuery = new QueryBuilder(
        new BindParam({
            params: flattenObject({ terms: flattenObject(convertDataQueryToNeo4jQuery(query)) }),
            cursor,
        })
    ).match({
        related: [
            { identifier: 'terms', model: ConsentFlowTerms },
            ConsentFlowTerms.getRelationshipByAlias('consentsTo'),
            { model: ConsentFlowContract, where: { id: id } },
        ],
        // The following is custom Cypher logic that has the following behavior:
        // If query key is true, ensure all resulting terms have that key
        // If query key is false, ensure no resulting terms have that key
        // If query key is not present, return all terms whether they have it or not
    }).where(`
all(key IN keys($params) WHERE 
    CASE $params[key]
        WHEN true THEN terms[key] IS NOT NULL AND terms[key] <> []
        WHEN false THEN terms[key] IS NULL OR terms[key] = []
    END
)
`);

    const dbQuery = cursor ? _dbQuery.where('terms.updatedAt < $cursor') : _dbQuery;

    const results = convertQueryResultToPropertiesObjectArray<{
        terms: FlatDbTermsType;
    }>(await dbQuery.return('DISTINCT terms').orderBy('terms.updatedAt DESC').limit(limit).run());

    const terms = results.map(result => inflateObject<any>(result.terms));

    return terms.map(term => ({
        date: term.updatedAt!,
        credentials: {
            categories: mapValues(
                term.terms.read.credentials.categories,
                category => category.shared ?? []
            ),
        },
        personal: term.terms.read.personal,
    }));
};

export const getTransactionsForTerms = async (
    termsId: string,
    {
        query: matchQuery = {},
        limit,
        cursor,
    }: { query?: ConsentFlowTransactionsQuery; limit: number; cursor?: string }
): Promise<DbTransactionType[]> => {
    const _query = new QueryBuilder(new BindParam({ params: flattenObject(matchQuery), cursor }))
        .match({
            related: [
                { identifier: 'transaction', model: ConsentFlowTransaction },
                ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                { model: ConsentFlowTerms, where: { id: termsId } },
            ],
        })
        .where('all(key IN keys($params) WHERE transaction[key] = $params[key])');

    const query = cursor ? _query.raw('AND transaction.date < $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        transaction: FlatDbTransactionType;
    }>(
        await query
            .return('DISTINCT transaction')
            .orderBy('transaction.date DESC')
            .limit(limit)
            .run()
    );

    return results.map(result => inflateObject(result.transaction));
};
