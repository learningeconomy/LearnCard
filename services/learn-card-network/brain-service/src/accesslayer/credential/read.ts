import { Op, QueryBuilder, Where } from 'neogma';
import {
    Credential,
    CredentialInstance,
    CredentialRelationships,
    Profile,
    ProfileRelationships,
} from '@models';
import { SentCredentialInfo } from '@learncard/types';

import { getCredentialUri } from '@helpers/credential.helpers';
import { inflateObject } from '@helpers/objects.helpers';

import { CredentialType } from 'types/credential';
import { ProfileType } from 'types/profile';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { getIdFromUri } from '@helpers/uri.helpers';

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
        `${hasFromFilter ? 'AND' : 'WHERE'} (received.status IS NULL OR received.status <> "revoked")`
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
            metadata: (receivedProps.metadata ?? sentProps.metadata) as Record<string, unknown> | undefined,
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
    const whereFrom =
        from && from.length > 0
            ? new Where({ source: { profileId: { [Op.in]: from } } })
            : undefined;

    const results = convertQueryResultToPropertiesObjectArray<{
        source: ProfileType;
        relationship: ProfileRelationships['credentialSent']['RelationshipProperties'];
        credential: CredentialType;
    }>(
        await new QueryBuilder(whereFrom?.getBindParam())
            .match({
                related: [
                    { identifier: 'source', model: Profile },
                    {
                        ...Profile.getRelationshipByAlias('credentialSent'),
                        identifier: 'relationship',
                        where: { to: profile.profileId },
                    },
                    { identifier: 'credential', model: Credential },
                ],
            })
            // Don't return credentials that have been accepted
            .where(
                `NOT (credential)-[:CREDENTIAL_RECEIVED]->()${whereFrom ? `AND ${whereFrom.getStatement('text')}` : ''
                }`
            )
            .return('source, relationship, credential')
            .limit(limit)
            .run()
    );

    return results.map(({ source, relationship, credential }) => {
        const relationshipProps = inflateRelationshipProperties(
            relationship as unknown as Record<string, unknown>
        );

        return {
            uri: getCredentialUri(credential.id, domain),
            to: relationshipProps.to as string,
            from: source.profileId,
            sent: relationshipProps.date as string,
            metadata: relationshipProps.metadata as Record<string, unknown> | undefined,
        };
    });
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
    const { Boost } = await import('@models');

    // Use credentialSent to find credentials (exists for both pending and claimed)
    // Then optionally match credentialReceived to check revocation status
    const results = convertQueryResultToPropertiesObjectArray<{
        credential: CredentialType;
    }>(
        await new QueryBuilder()
            .match({
                related: [
                    { identifier: 'boost', model: Boost, where: { id: boostId } },
                    { ...Credential.getRelationshipByAlias('instanceOf'), direction: 'in' },
                    { identifier: 'credential', model: Credential },
                    {
                        ...Profile.getRelationshipByAlias('credentialSent'),
                        identifier: 'sent',
                        direction: 'in',
                    },
                    { identifier: 'sender', model: Profile },
                ],
            })
            .where(`sent.to = "${profileId}"`)
            .match({
                optional: true,
                related: [
                    { identifier: 'credential' },
                    {
                        ...Credential.getRelationshipByAlias('credentialReceived'),
                        identifier: 'received',
                    },
                    { identifier: 'recipient', model: Profile, where: { profileId } },
                ],
            })
            // Use WITH barrier pattern for correct filtering
            .with('credential, received')
            .where('received IS NULL OR coalesce(received.status, "") <> "revoked"')
            .return('credential')
            .limit(1)
            .run()
    );

    if (results.length === 0) {
        return null;
    }

    return Credential.findOne({ where: { id: results[0]!.credential.id } });
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
