import { Op, QueryBuilder, Where } from 'neogma';
import {
    Presentation,
    PresentationInstance,
    PresentationRelationships,
    Profile,
    ProfileRelationships,
} from '@models';
import { SentCredentialInfo } from '@learncard/types';

import { getPresentationUri } from '@helpers/presentation.helpers';

import { PresentationType } from 'types/presentation';
import { ProfileType } from 'types/profile';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { getIdFromUri } from '@helpers/uri.helpers';
import { inflateObject } from '@helpers/objects.helpers';

const inflateRelationshipProperties = (
    properties: Record<string, unknown>
): Record<string, unknown> & { metadata?: Record<string, unknown> } =>
    inflateObject(properties) as Record<string, unknown> & { metadata?: Record<string, unknown> };

export const getPresentationById = async (id: string): Promise<PresentationInstance | null> => {
    return Presentation.findOne({ where: { id } });
};

export const getPresentationByUri = async (uri: string): Promise<PresentationInstance | null> => {
    const id = getIdFromUri(uri);

    return Presentation.findOne({ where: { id } });
};

export const getReceivedPresentationsForProfile = async (
    domain: string,
    profile: ProfileType,
    {
        limit,
        from,
    }: {
        limit: number;
        from?: string[];
    }
): Promise<SentCredentialInfo[]> => {
    const matchQuery = new QueryBuilder().match({
        related: [
            { identifier: 'source', model: Profile },
            { ...Profile.getRelationshipByAlias('presentationSent'), identifier: 'sent' },
            { identifier: 'presentation', model: Presentation },
            {
                ...Presentation.getRelationshipByAlias('presentationReceived'),
                identifier: 'received',
            },
            {
                identifier: 'target',
                model: Profile,
                where: { profileId: profile.profileId },
            },
        ],
    });

    const query =
        from && from.length > 0
            ? matchQuery.where(
                  new Where({ source: { profileId: { [Op.in]: from } } }, matchQuery.getBindParam())
              )
            : matchQuery;

    const results = convertQueryResultToPropertiesObjectArray<{
        sent: ProfileRelationships['presentationSent']['RelationshipProperties'];
        presentation: PresentationType;
        received: PresentationRelationships['presentationReceived']['RelationshipProperties'];
    }>(await query.return('sent, presentation, received').limit(limit).run());

    return results.map(({ sent, presentation, received }) => {
        const sentProps = inflateRelationshipProperties(sent as unknown as Record<string, unknown>);
        const receivedProps = inflateRelationshipProperties(
            received as unknown as Record<string, unknown>
        );

        return {
            uri: getPresentationUri(presentation.id, domain),
            to: sentProps.to as string,
            from: receivedProps.from as string,
            sent: sentProps.date as string,
            received: receivedProps.date as string,
            metadata: (receivedProps.metadata ?? sentProps.metadata) as
                Record<string, unknown> | undefined,
        };
    });
};

export const getSentPresentationsForProfile = async (
    domain: string,
    profile: ProfileType,
    {
        limit,
        to,
    }: {
        limit: number;
        to?: string[];
    }
): Promise<SentCredentialInfo[]> => {
    const matchQuery = new QueryBuilder().match({
        related: [
            {
                identifier: 'source',
                model: Profile,
                where: { profileId: profile.profileId },
            },
            { ...Profile.getRelationshipByAlias('presentationSent'), identifier: 'sent' },
            { identifier: 'presentation', model: Presentation },
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
            { identifier: 'presentation', model: Presentation },
            {
                ...Presentation.getRelationshipByAlias('presentationReceived'),
                identifier: 'received',
            },
            { identifier: 'target', model: Profile },
        ],
    });

    const results = convertQueryResultToPropertiesObjectArray<{
        source: ProfileType;
        sent: ProfileRelationships['presentationSent']['RelationshipProperties'];
        presentation: PresentationType;
        received?: PresentationRelationships['presentationReceived']['RelationshipProperties'];
    }>(await query.return('source, sent, presentation, received').limit(limit).run());

    return results.map(({ source, sent, presentation, received }) => {
        const sentProps = inflateRelationshipProperties(sent as unknown as Record<string, unknown>);
        const receivedProps = received
            ? inflateRelationshipProperties(received as unknown as Record<string, unknown>)
            : undefined;

        return {
            uri: getPresentationUri(presentation.id, domain),
            to: sentProps.to as string,
            from: source.profileId,
            sent: sentProps.date as string,
            received: receivedProps?.date as string | undefined,
            metadata: (sentProps.metadata ?? receivedProps?.metadata) as
                Record<string, unknown> | undefined,
        };
    });
};

export const getIncomingPresentationsForProfile = async (
    domain: string,
    profile: ProfileType,
    {
        limit,
        from,
    }: {
        limit: number;
        from?: string[];
    }
): Promise<SentCredentialInfo[]> => {
    const whereFrom =
        from && from.length > 0
            ? new Where({ source: { profileId: { [Op.in]: from } } })
            : undefined;

    const results = convertQueryResultToPropertiesObjectArray<{
        source: ProfileType;
        relationship: ProfileRelationships['presentationSent']['RelationshipProperties'];
        presentation: PresentationType;
    }>(
        await new QueryBuilder(whereFrom?.getBindParam())
            .match({
                related: [
                    { identifier: 'source', model: Profile },
                    {
                        ...Profile.getRelationshipByAlias('presentationSent'),
                        identifier: 'relationship',
                        where: { to: profile.profileId },
                    },
                    { identifier: 'presentation', model: Presentation },
                ],
            })
            // Don't return presentations that have been accepted
            .where(
                `NOT (presentation)-[:PRESENTATION_RECEIVED]->()${
                    whereFrom ? `AND ${whereFrom.getStatement('text')}` : ''
                }`
            )
            .return('source, relationship, presentation')
            .limit(limit)
            .run()
    );

    return results.map(({ source, relationship, presentation }) => {
        const relationshipProps = inflateRelationshipProperties(
            relationship as unknown as Record<string, unknown>
        );

        return {
            uri: getPresentationUri(presentation.id, domain),
            to: relationshipProps.to as string,
            from: source.profileId,
            sent: relationshipProps.date as string,
            metadata: relationshipProps.metadata,
        };
    });
};
