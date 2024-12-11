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

    return results.map(({ sent, presentation, received }) => ({
        uri: getPresentationUri(presentation.id, domain),
        to: sent.to,
        from: received.from,
        sent: sent.date,
        received: received.date,
    }));
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

    return results.map(({ source, sent, presentation, received }) => ({
        uri: getPresentationUri(presentation.id, domain),
        to: sent.to,
        from: source.profileId,
        sent: sent.date,
        received: received?.date,
    }));
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
                `NOT (presentation)-[:PRESENTATION_RECEIVED]->()${whereFrom ? `AND ${whereFrom.getStatement('text')}` : ''
                }`
            )
            .return('source, relationship, presentation')
            .limit(limit)
            .run()
    );

    return results.map(({ source, relationship, presentation }) => ({
        uri: getPresentationUri(presentation.id, domain),
        to: relationship.to,
        from: source.profileId,
        sent: relationship.date,
    }));
};
