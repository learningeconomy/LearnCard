import { Op, QueryBuilder, Where } from 'neogma';
import { neogma } from '@instance';
import { Credential, Profile, AppStoreListing } from '@models';
import type {
    CredentialInstance,
    CredentialRelationships,
    ProfileRelationships,
    AppStoreListingRelationships,
} from '@models';
import type { SentCredentialInfo } from '@learncard/types';

import { getCredentialUri } from '@helpers/credential.helpers';
import { inflateObject } from '@helpers/objects.helpers';

import type { CredentialType } from 'types/credential';
import type { ProfileType } from 'types/profile';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { getIdFromUri } from '@helpers/uri.helpers';
import type { CredentialIssuer } from 'types/issuer';
import { isProfileIssuer, isAppStoreListingIssuer } from 'types/issuer';

const inflateRelationshipProperties = (
    properties: Record<string, unknown>
): Record<string, unknown> & { metadata?: Record<string, unknown> } =>
    inflateObject(properties) as Record<string, unknown> & { metadata?: Record<string, unknown> };

export const getCredentialById = async (id: string): Promise<CredentialInstance | null> => {
    return Credential.findOne({ where: { id } });
};

export const getCredentialByUri = async (uri: string): Promise<CredentialInstance | null> => {
    const id = getIdFromUri(uri);

    return Credential.findOne({ where: { id } });
};

export const getReceivedCredentialsForProfile = async (
    domain: string,
    profile: ProfileType,
    { limit, from }: { limit: number; from?: string[] }
): Promise<SentCredentialInfo[]> => {
    const matchQuery = new QueryBuilder().match({
        related: [
            { identifier: 'source', model: Profile },
            { ...Profile.getRelationshipByAlias('credentialSent'), identifier: 'sent' },
            { identifier: 'credential', model: Credential },
            {
                ...Credential.getRelationshipByAlias('credentialReceived'),
                identifier: 'received',
            },
            {
                identifier: 'target',
                model: Profile,
                where: { profileId: profile.profileId },
            },
        ],
    });

    const hasFromFilter = from && from.length > 0;

    const fromQuery = hasFromFilter
        ? matchQuery.where(
              new Where({ source: { profileId: { [Op.in]: from } } }, matchQuery.getBindParam())
          )
        : matchQuery;

    // Filter out revoked credentials
    const query = fromQuery.raw(
        `${
            hasFromFilter ? 'AND' : 'WHERE'
        } (received.status IS NULL OR received.status <> "revoked")`
    );

    const results = convertQueryResultToPropertiesObjectArray<{
        sent: ProfileRelationships['credentialSent']['RelationshipProperties'];
        credential: CredentialType;
        received: CredentialRelationships['credentialReceived']['RelationshipProperties'];
    }>(await query.return('sent, credential, received').limit(limit).run());

    return results.map(({ sent, credential, received }) => {
        const sentProps = inflateRelationshipProperties(sent as unknown as Record<string, unknown>);
        const receivedProps = inflateRelationshipProperties(
            received as unknown as Record<string, unknown>
        );

        return {
            uri: getCredentialUri(credential.id, domain),
            to: sentProps.to as string,
            from: receivedProps.from as string,
            sent: sentProps.date as string,
            received: receivedProps.date as string,
            metadata: (receivedProps.metadata ?? sentProps.metadata) as
                | Record<string, unknown>
                | undefined,
        };
    });
};

export const getSentCredentialsForProfile = async (
    domain: string,
    profile: ProfileType,
    { limit, to }: { limit: number; to?: string[] }
): Promise<SentCredentialInfo[]> => {
    const matchQuery = new QueryBuilder().match({
        related: [
            {
                identifier: 'source',
                model: Profile,
                where: { profileId: profile.profileId },
            },
            { ...Profile.getRelationshipByAlias('credentialSent'), identifier: 'sent' },
            { identifier: 'credential', model: Credential },
        ],
    });

    const whereQuery =
        to && to.length > 0
            ? matchQuery.where(
                  new Where({ sent: { to: { [Op.in]: to } } }, matchQuery.getBindParam())
              )
            : matchQuery;

    const query = whereQuery.match({
        optional: true,
        related: [
            { identifier: 'credential', model: Credential },
            {
                ...Credential.getRelationshipByAlias('credentialReceived'),
                identifier: 'received',
            },
            { identifier: 'target', model: Profile },
        ],
    });

    const results = convertQueryResultToPropertiesObjectArray<{
        source: ProfileType;
        sent: ProfileRelationships['credentialSent']['RelationshipProperties'];
        credential: CredentialType;
        received?: CredentialRelationships['credentialReceived']['RelationshipProperties'];
    }>(await query.return('source, sent, credential, received').limit(limit).run());

    return results.map(({ source, sent, credential, received }) => {
        const sentProps = inflateRelationshipProperties(sent as unknown as Record<string, unknown>);
        const receivedProps = received
            ? inflateRelationshipProperties(received as unknown as Record<string, unknown>)
            : undefined;

        return {
            uri: getCredentialUri(credential.id, domain),
            to: sentProps.to as string,
            from: source.profileId,
            sent: sentProps.date as string,
            received: receivedProps?.date as string | undefined,
            metadata: (sentProps.metadata ?? receivedProps?.metadata) as
                | Record<string, unknown>
                | undefined,
        };
    });
};

export const getIncomingCredentialsForProfile = async (
    domain: string,
    profile: ProfileType,
    { limit, from }: { limit: number; from?: string[] }
): Promise<SentCredentialInfo[]> => {
    const safeLimit = Math.max(0, Math.trunc(limit));

    const result = await neogma.queryRunner.run(
        `MATCH (source)-[relationship:CREDENTIAL_SENT {to: $profileId}]->(credential:Credential)
         WHERE (source:Profile OR source:AppStoreListing)
           AND NOT (credential)-[:CREDENTIAL_RECEIVED]->()
           ${from && from.length > 0 ? 'AND ((source:Profile AND source.profileId IN $from) OR (source:AppStoreListing AND source.listing_id IN $from))' : ''}
         RETURN source, relationship, credential
         ORDER BY relationship.date DESC
         LIMIT ${safeLimit}`,
        {
            profileId: profile.profileId,
            from: from ?? [],
        }
    );

    return result.records.map(record => {
        const sourceNode = record.get('source') as { properties?: Record<string, unknown> };
        const relationshipNode = record.get('relationship') as {
            properties?: Record<string, unknown>;
        };
        const credentialNode = record.get('credential') as { properties?: Record<string, unknown> };

        const source = inflateObject<Record<string, unknown>>(sourceNode?.properties ?? {});
        const relationshipProps = inflateRelationshipProperties(relationshipNode?.properties ?? {});
        const credential = inflateObject<CredentialType>(
            (credentialNode?.properties ?? {}) as CredentialType
        );

        return {
            uri: getCredentialUri(credential.id, domain),
            to: relationshipProps.to as string,
            from: (source.profileId ?? source.listing_id) as string,
            sent: relationshipProps.date as string,
            metadata: relationshipProps.metadata as Record<string, unknown> | undefined,
        };
    });
};

export interface CredentialStatusForBoostAndProfile {
    credential: CredentialInstance;
    sentDate?: string;
    receivedDate?: string;
    status: 'pending' | 'claimed' | 'revoked';
}

export const getCredentialStatusForBoostAndProfile = async (
    boostId: string,
    profileId: string
): Promise<CredentialStatusForBoostAndProfile | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (boost:Boost {id: $boostId})<-[:INSTANCE_OF]-(credential:Credential)
         MATCH (sender)-[sent:CREDENTIAL_SENT {to: $profileId}]->(credential)
         WHERE (sender:Profile OR sender:AppStoreListing)
         OPTIONAL MATCH (credential)-[received:CREDENTIAL_RECEIVED]->(:Profile {profileId: $profileId})
         RETURN credential, sent, received
         ORDER BY coalesce(received.date, sent.date) DESC
         LIMIT 1`,
        { boostId, profileId }
    );

    const record = result.records[0];
    if (!record) {
        return null;
    }

    const credentialProps = inflateObject<CredentialType>(
        ((record.get('credential') as { properties?: Record<string, unknown> })?.properties ??
            {}) as CredentialType
    );
    const credential = await Credential.findOne({ where: { id: credentialProps.id } });
    if (!credential) {
        return null;
    }

    const sentProps = inflateRelationshipProperties(
        ((record.get('sent') as { properties?: Record<string, unknown> })?.properties ?? {})
    );
    const receivedNode = record.get('received') as { properties?: Record<string, unknown> } | null;
    const receivedProps = receivedNode?.properties
        ? inflateRelationshipProperties(receivedNode.properties)
        : undefined;

    const rawStatus = receivedProps?.status;
    const status = rawStatus === 'revoked' ? 'revoked' : receivedProps ? 'claimed' : 'pending';

    return {
        credential,
        sentDate: sentProps.date as string | undefined,
        receivedDate: receivedProps?.date as string | undefined,
        status,
    };
};

/**
 * Get a credential instance for a specific boost and profile.
 * This is used to find the credential that was issued when a profile claimed a boost.
 * Looks via credentialSent (which exists for pending and claimed) and filters out revoked credentials.
 */
export const getCredentialInstanceForBoostAndProfile = async (
    boostId: string,
    profileId: string
): Promise<CredentialInstance | null> => {
    const credentialStatus = await getCredentialStatusForBoostAndProfile(boostId, profileId);

    if (!credentialStatus || credentialStatus.status === 'revoked') {
        return null;
    }

    return credentialStatus.credential;
};

/**
 * Get all credential URIs that have been revoked for a specific profile.
 * This is used by the frontend to sync and remove revoked credentials from the learn-cloud index.
 */
export const getRevokedCredentialUrisForProfile = async (
    domain: string,
    profile: ProfileType
): Promise<string[]> => {
    const results = convertQueryResultToPropertiesObjectArray<{
        credential: CredentialType;
    }>(
        await new QueryBuilder()
            .match({
                related: [
                    { identifier: 'credential', model: Credential },
                    {
                        ...Credential.getRelationshipByAlias('credentialReceived'),
                        identifier: 'received',
                    },
                    {
                        identifier: 'profile',
                        model: Profile,
                        where: { profileId: profile.profileId },
                    },
                ],
            })
            .where('received.status = "revoked"')
            .return('credential')
            .run()
    );

    return results.map(({ credential }) => getCredentialUri(credential.id, domain));
};

/**
 * Get credentials sent by a specific issuer (Profile or AppStoreListing)
 */
export const getCredentialsByIssuer = async (
    issuer: CredentialIssuer,
    domain: string,
    options?: {
        limit?: number;
        cursor?: string;
        includeRevoked?: boolean;
    }
): Promise<{
    credentials: Array<{
        uri: string;
        to: string;
        date: string;
        status?: string;
    }>;
    hasMore: boolean;
    cursor?: string;
}> => {
    const { limit = 50, cursor, includeRevoked = false } = options ?? {};

    // Query based on issuer type
    if (isProfileIssuer(issuer)) {
        // Query Profile.credentialSent relationships
        const query = new QueryBuilder()
            .match({
                related: [
                    {
                        identifier: 'source',
                        model: Profile,
                        where: { profileId: issuer.profile.profileId },
                    },
                    { ...Profile.getRelationshipByAlias('credentialSent'), identifier: 'sent' },
                    { identifier: 'credential', model: Credential },
                ],
            })
            .match({
                optional: true,
                related: [
                    { identifier: 'credential', model: Credential },
                    {
                        ...Credential.getRelationshipByAlias('credentialReceived'),
                        identifier: 'received',
                    },
                    { identifier: 'target', model: Profile },
                ],
            });

        // Apply cursor if provided
        let paginatedQuery = query;
        if (cursor) {
            paginatedQuery = query.where(`sent.date < "${cursor}"`);
        }

        // Filter out revoked credentials unless includeRevoked is true
        if (!includeRevoked) {
            paginatedQuery = paginatedQuery.where(
                `(received.status IS NULL OR received.status <> "revoked")`
            );
        }

        const results = convertQueryResultToPropertiesObjectArray<{
            sent: ProfileRelationships['credentialSent']['RelationshipProperties'];
            credential: CredentialType;
            received?: CredentialRelationships['credentialReceived']['RelationshipProperties'];
        }>(
            await paginatedQuery
                .return('sent, credential, received')
                .limit(limit + 1)
                .run()
        );

        const hasMore = results.length > limit;
        const paginatedResults = hasMore ? results.slice(0, limit) : results;

        const credentials = paginatedResults.map(({ sent, credential, received }) => {
            const sentProps = inflateRelationshipProperties(
                sent as unknown as Record<string, unknown>
            );
            const receivedProps = received
                ? inflateRelationshipProperties(received as unknown as Record<string, unknown>)
                : undefined;

            return {
                uri: getCredentialUri(credential.id, domain),
                to: sentProps.to as string,
                date: sentProps.date as string,
                status: receivedProps?.status as string | undefined,
            };
        });

        const lastCredential = credentials[credentials.length - 1];

        return {
            credentials,
            hasMore,
            cursor: hasMore && lastCredential ? lastCredential.date : undefined,
        };
    }

    if (isAppStoreListingIssuer(issuer)) {
        // Query AppStoreListing.credentialSent relationships
        const query = new QueryBuilder()
            .match({
                related: [
                    {
                        identifier: 'source',
                        model: AppStoreListing,
                        where: { listing_id: issuer.listing.listing_id },
                    },
                    {
                        ...AppStoreListing.getRelationshipByAlias('credentialSent'),
                        identifier: 'sent',
                    },
                    { identifier: 'credential', model: Credential },
                ],
            })
            .match({
                optional: true,
                related: [
                    { identifier: 'credential', model: Credential },
                    {
                        ...Credential.getRelationshipByAlias('credentialReceived'),
                        identifier: 'received',
                    },
                    { identifier: 'target', model: Profile },
                ],
            });

        // Apply cursor if provided
        let paginatedQuery = query;
        if (cursor) {
            paginatedQuery = query.where(`sent.date < "${cursor}"`);
        }

        // Filter out revoked credentials unless includeRevoked is true
        if (!includeRevoked) {
            paginatedQuery = paginatedQuery.where(
                `(received.status IS NULL OR received.status <> "revoked")`
            );
        }

        const results = convertQueryResultToPropertiesObjectArray<{
            sent: AppStoreListingRelationships['credentialSent']['RelationshipProperties'];
            credential: CredentialType;
            received?: CredentialRelationships['credentialReceived']['RelationshipProperties'];
        }>(
            await paginatedQuery
                .return('sent, credential, received')
                .limit(limit + 1)
                .run()
        );

        const hasMore = results.length > limit;
        const paginatedResults = hasMore ? results.slice(0, limit) : results;

        const credentials = paginatedResults.map(({ sent, credential, received }) => {
            const sentProps = inflateRelationshipProperties(
                sent as unknown as Record<string, unknown>
            );
            const receivedProps = received
                ? inflateRelationshipProperties(received as unknown as Record<string, unknown>)
                : undefined;

            return {
                uri: getCredentialUri(credential.id, domain),
                to: sentProps.to as string,
                date: sentProps.date as string,
                status: receivedProps?.status as string | undefined,
            };
        });

        const lastCredential = credentials[credentials.length - 1];

        return {
            credentials,
            hasMore,
            cursor: hasMore && lastCredential ? lastCredential.date : undefined,
        };
    }

    throw new Error('Integration issuer type not supported for credential queries');
};
