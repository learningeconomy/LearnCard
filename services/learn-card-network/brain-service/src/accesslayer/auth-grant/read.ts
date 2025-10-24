import { BindParam, QueryBuilder } from 'neogma';
import { AuthGrant, Profile } from '@models';
import { AuthGrantQuery, AuthGrantType, AuthGrantStatusValidator } from '@learncard/types';
import { ProfileType } from 'types/profile';
import { inflateObject } from '@helpers/objects.helpers';
import { getProfileIdFromDid } from '@helpers/did.helpers';
import {
    convertObjectRegExpToNeo4j,
    buildWhereForQueryBuilder,
    convertQueryResultToPropertiesObjectArray,
} from '@helpers/neo4j.helpers';
import { AUTH_GRANT_NO_ACCESS_SCOPE } from 'src/constants/auth-grant';

export const getAuthGrantById = async (id: string): Promise<AuthGrantType | null> => {
    const result = await new QueryBuilder()
        .match({
            model: AuthGrant,
            identifier: 'authGrant',
            where: { id },
        })
        .return('authGrant')
        .limit(1)
        .run();

    const authGrant = result.records[0]?.get('authGrant').properties;

    if (!authGrant) return null;

    return (inflateObject as any)(authGrant);
};

export const getAuthGrantsForProfile = async (
    profile: ProfileType,
    {
        limit,
        cursor,
        query: matchQuery = {},
    }: { limit: number; cursor?: string; query?: AuthGrantQuery }
): Promise<Array<AuthGrantType & { created: string }>> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder('authGrant', convertedQuery as any);
    
    const _query = new QueryBuilder(new BindParam({ cursor, ...queryParams }))
        .match({
            related: [
                { identifier: 'authGrant', model: AuthGrant },
                AuthGrant.getRelationshipByAlias('authorizesAuthGrant'),
                { model: Profile, where: { profileId: profile.profileId } },
            ],
        })
        .where(whereClause);

    const query = cursor ? _query.raw('AND authGrant.createdAt < $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        authGrant: AuthGrantType;
    }>(
        await query
            .return('DISTINCT authGrant')
            .orderBy('authGrant.createdAt DESC')
            .limit(limit)
            .run()
    );

    return results.map(result => ({
        ...(inflateObject as any)(result.authGrant as any),
        created: result.authGrant.createdAt,
    }));
};

export const isAuthGrantAssociatedWithProfile = async (
    authGrantId: string,
    profileId: string
): Promise<boolean> => {
    const result = await new QueryBuilder()
        .match({
            model: AuthGrant,
            identifier: 'authGrant',
            where: { id: authGrantId },
        })
        .match({
            related: [
                { identifier: 'authGrant' },
                AuthGrant.getRelationshipByAlias('authorizesAuthGrant'),
                { model: Profile, where: { profileId } },
            ],
        })
        .return('authGrant')
        .limit(1)
        .run();

    return result.records.length > 0;
};

export const isAuthGrantChallengeValidForDID = async (
    challenge: string,
    did: string
): Promise<{ isChallengeValid: boolean; scope: string }> => {
    // TODO: Ideally, this transformation isn't required and we could use DID directly.
    const profileId = getProfileIdFromDid(did);
    if (!profileId) return { isChallengeValid: false, scope: AUTH_GRANT_NO_ACCESS_SCOPE };

    const currentTime = new Date().toISOString();
    const result = await new QueryBuilder()
        .match({
            model: AuthGrant,
            identifier: 'authGrant',
            where: { challenge, status: AuthGrantStatusValidator.Values.active },
        })
        .raw(`WHERE (authGrant.expiresAt IS NULL OR authGrant.expiresAt >= '${currentTime}')`)
        .match({
            related: [
                { identifier: 'authGrant' },
                AuthGrant.getRelationshipByAlias('authorizesAuthGrant'),
                { model: Profile, where: { profileId } },
            ],
        })
        .return('authGrant')
        .limit(1)
        .run();

    const authGrant = result.records[0]?.get('authGrant').properties;
    return {
        isChallengeValid: result.records.length > 0,
        scope: authGrant?.scope || AUTH_GRANT_NO_ACCESS_SCOPE,
    };
};
