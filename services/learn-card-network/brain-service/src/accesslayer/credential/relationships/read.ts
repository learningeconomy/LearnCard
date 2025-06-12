import { inflateObject } from '@helpers/objects.helpers';
import {
    CredentialInstance,
    Profile,
    ProfileRelationships,
    ConsentFlowTerms,
    ConsentFlowTransaction,
    Boost,
    Credential,
    ConsentFlowContract,
} from '@models';
import { ProfileType } from 'types/profile';
import { BindParam, QueryBuilder } from 'neogma';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { CredentialType } from 'types/credential';
import { BoostType } from 'types/boost';
import { DbContractType, DbTermsType, DbTransactionType } from 'types/consentflowcontract';

export const getCredentialSentToProfile = async (
    id: string,
    to: ProfileType
): Promise<
    | {
        source: ProfileType;
        relationship: ProfileRelationships['credentialSent']['RelationshipProperties'];
        target: CredentialInstance;
    }
    | undefined
> => {
    const data = (
        await Profile.findRelationships({
            alias: 'credentialSent',
            where: { relationship: { to: to.profileId }, target: { id } },
        })
    )[0];

    if (!data) return undefined;

    return { ...data, source: inflateObject(data.source.dataValues as any) };
};

export const getCredentialOwner = async (
    credential: CredentialInstance
): Promise<ProfileType | undefined> => {
    const id = credential.id;

    const owner = (
        await Profile.findRelationships({ alias: 'credentialSent', where: { target: { id } } })
    )[0]?.source;

    if (!owner) return undefined;

    return inflateObject<ProfileType>(owner.dataValues as any);
};

export const getCredentialReceivedByProfile = async (
    credentialId: string,
    profile: ProfileType
): Promise<boolean> => {
    const relationships = await Credential.findRelationships({
        alias: 'credentialReceived',
        where: {
            source: { id: credentialId },
            target: { profileId: profile.profileId },
        },
    });

    return relationships.length > 0;
};

/**
 * Gets credentials that were issued via a specific contract terms relationship
 *
 * @param termsId The ID of the contract terms
 * @param options Options for pagination and filtering
 * @returns Array of credential objects with boost and category information
 */
export const getCredentialsForContractTerms = async (
    termsId: string,
    options: {
        limit?: number;
        cursor?: string;
        includeReceived?: boolean;
        profileId?: string;
    } = {}
) => {
    const { limit = 25, cursor, includeReceived = true, profileId } = options;

    let query = new QueryBuilder(new BindParam({ cursor }))
        .match({
            related: [
                { identifier: 'terms', model: ConsentFlowTerms, where: { id: termsId } },
                {
                    ...ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                    identifier: 'isFor',
                    direction: 'in',
                },
                { identifier: 'transaction', model: ConsentFlowTransaction },
                {
                    ...Credential.getRelationshipByAlias('issuedViaTransaction'),
                    identifier: 'issuedVia',
                    direction: 'in',
                },
                { identifier: 'credential', model: Credential },
                Credential.getRelationshipByAlias('instanceOf'),
                { identifier: 'boost', model: Boost },
            ],
        })
        .with('credential, boost, issuedVia.date as date, transaction');

    if (!includeReceived && profileId) {
        query = query
            .match({
                related: [
                    { identifier: 'credential' },
                    {
                        ...Credential.getRelationshipByAlias('credentialReceived'),
                        identifier: 'receivedRel',
                    },
                    { model: Profile, where: { profileId } },
                ],
                optional: true,
            })
            .with('credential, boost, date, transaction, receivedRel')
            .where('receivedRel IS NULL');
    }

    if (cursor) query = query.where('date < $cursor');

    const results = convertQueryResultToPropertiesObjectArray<{
        boost: BoostType;
        date: string;
        credential: CredentialType;
        transaction: string;
    }>(
        await query
            .orderBy('date DESC')
            .limit(limit)
            .return(`credential, boost, date, transaction`)
            .run()
    );

    return results.map(record => ({
        date: record.date,
        credentialUri: record.credential.id, // Will be converted to URI in route
        boostUri: record.boost.id, // Will be converted to URI in route
        category: record.boost.category,
        transaction: record.transaction,
    }));
};

/**
 * Gets all credentials that were issued via any contract terms for a profile
 *
 * @param profileId The ID of the profile to get credentials for
 * @param options Options for pagination and filtering
 * @returns Array of credential objects with boost and category information
 */
export const getAllCredentialsForProfileTerms = async (
    profileId: string,
    options: {
        limit?: number;
        cursor?: string;
        includeReceived?: boolean;
    } = {}
) => {
    const { limit = 25, cursor, includeReceived = true } = options;

    // Get credentials linked via transactions for any terms owned by this profile
    let query = new QueryBuilder(new BindParam({ cursor })).match({
        related: [
            { identifier: 'profile', model: Profile, where: { profileId } },
            { ...ConsentFlowTerms.getRelationshipByAlias('createdBy'), direction: 'out' },
            { identifier: 'terms', model: ConsentFlowTerms },
            {
                ...ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                identifier: 'isFor',
                direction: 'in',
            },
            {
                identifier: 'transaction',
                model: ConsentFlowTransaction,
                where: { action: 'write' },
            },
            {
                ...Credential.getRelationshipByAlias('issuedViaTransaction'),
                direction: 'in',
                identifier: 'issuedVia',
            },
            { identifier: 'credential', model: Credential },
            Credential.getRelationshipByAlias('instanceOf'),
            { identifier: 'boost', model: Boost },
        ],
    });

    if (!includeReceived) {
        query = query.where(
            `NOT EXISTS { MATCH (credential)-[:${Credential.getRelationshipByAlias('credentialReceived').name
            }]-(profile) }`
        );
    }

    query = query.with('credential, boost, issuedVia.date as date, terms, transaction');

    if (cursor) query = query.where('date < $cursor');

    query = query.match({
        related: [
            { identifier: 'terms' },
            ConsentFlowTerms.getRelationshipByAlias('consentsTo'),
            { identifier: 'contract', model: ConsentFlowContract },
        ],
    });

    if (cursor) query = query.where('date < $cursor');

    const results = convertQueryResultToPropertiesObjectArray<{
        boost: BoostType;
        date: string;
        credential: CredentialType;
        terms: DbTermsType;
        transaction: DbTransactionType;
        contract: DbContractType;
    }>(
        await query
            .orderBy('date DESC')
            .limit(limit)
            .return('credential, boost, date, terms, transaction, contract')
            .run()
    );

    return results.map(record => ({
        date: record.date,
        credential: record.credential,
        boost: inflateObject<any>(record.boost),
        category: record.boost.category,
        terms: inflateObject<any>(record.terms),
        contract: inflateObject<any>(record.contract),
        transaction: inflateObject<any>(record.transaction),
    }));
};
