import { BindParam, QueryBuilder } from 'neogma';
import { AuthGrant, Profile } from '@models';
import { AuthGrantQuery, AuthGrantType } from 'types/auth-grant';
import { ProfileType } from 'types/profile';
import { inflateObject } from '@helpers/objects.helpers';
import {
    convertObjectRegExpToNeo4j,
    getMatchQueryWhere,
    convertQueryResultToPropertiesObjectArray,
} from '@helpers/neo4j.helpers';
import { AUTH_GRANT_READ_ONLY_SCOPE, AUTH_GRANT_ACTIVE_STATUS } from 'src/constants/auth-grant';

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
    const _query = new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery), cursor })
    )
        .match({
            related: [
                { identifier: 'authGrant', model: AuthGrant },
                AuthGrant.getRelationshipByAlias('authorizesAuthGrant'),
                { model: Profile, where: { profileId: profile.profileId } },
            ],
        })
        .where(getMatchQueryWhere('authGrant'));

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
    const currentTime = new Date().toISOString();
    const result = await new QueryBuilder()
        .match({
            model: AuthGrant,
            identifier: 'authGrant',
            where: { challenge, status: AUTH_GRANT_ACTIVE_STATUS },
        })
        .raw(`WHERE authGrant.expiresAt >= '${currentTime}'`)
        .match({
            related: [
                { identifier: 'authGrant' },
                AuthGrant.getRelationshipByAlias('authorizesAuthGrant'),
                { model: Profile, where: { did } },
            ],
        })
        .return('authGrant')
        .limit(1)
        .run();

    const authGrant = result.records[0]?.get('authGrant').properties;
    return {
        isChallengeValid: result.records.length > 0,
        scope: authGrant?.scope || AUTH_GRANT_READ_ONLY_SCOPE,
    };
};
