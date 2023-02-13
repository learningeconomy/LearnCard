import { QueryBuilder } from 'neogma';
import {
    Presentation,
    PresentationInstance,
    PresentationRelationships,
    Profile,
    ProfileInstance,
    ProfileRelationships,
} from '@models';
import { SentCredentialInfo } from '@learncard/types';

import { getPresentationUri } from '@helpers/presentation.helpers';

import { PresentationType } from 'types/presentation';
import { ProfileType } from 'types/profile';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';

export const getPresentationById = async (id: string): Promise<PresentationInstance | null> => {
    return Presentation.findOne({ where: { id } });
};

export const getReceivedPresentationsForProfile = async (
    domain: string,
    profile: ProfileInstance,
    limit: number
): Promise<SentCredentialInfo[]> => {
    const results = convertQueryResultToPropertiesObjectArray<{
        sent: ProfileRelationships['presentationSent']['RelationshipProperties'];
        presentation: PresentationType;
        received: PresentationRelationships['presentationReceived']['RelationshipProperties'];
    }>(
        await new QueryBuilder()
            .match({
                related: [
                    { identifier: 'source', model: Profile },
                    { ...Profile.getRelationshipByAlias('presentationSent'), identifier: 'sent' },
                    { identifier: 'presentation', model: Presentation },
                    {
                        ...Presentation.getRelationshipByAlias('presentationReceived'),
                        identifier: 'received',
                    },
                    { identifier: 'target', model: Profile, where: { handle: profile.handle } },
                ],
            })
            .return('sent, presentation, received')
            .limit(limit)
            .run()
    );

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
    profile: ProfileInstance,
    limit: number
): Promise<SentCredentialInfo[]> => {
    const results = convertQueryResultToPropertiesObjectArray<{
        source: ProfileType;
        sent: ProfileRelationships['presentationSent']['RelationshipProperties'];
        presentation: PresentationType;
        received?: PresentationRelationships['presentationReceived']['RelationshipProperties'];
    }>(
        await new QueryBuilder()
            .match({
                related: [
                    { identifier: 'source', model: Profile, where: { handle: profile.handle } },
                    { ...Profile.getRelationshipByAlias('presentationSent'), identifier: 'sent' },
                    { identifier: 'presentation', model: Presentation },
                ],
            })
            .match({
                optional: true,
                related: [
                    { identifier: 'presentation', model: Presentation },
                    {
                        ...Presentation.getRelationshipByAlias('presentationReceived'),
                        identifier: 'received',
                    },
                    { identifier: 'target', model: Profile },
                ],
            })
            .return('source, sent, presentation, received')
            .limit(limit)
            .run()
    );

    return results.map(({ source, sent, presentation, received }) => ({
        uri: getPresentationUri(presentation.id, domain),
        to: sent.to,
        from: source.handle,
        sent: sent.date,
        received: received?.date,
    }));
};

export const getIncomingPresentationsForProfile = async (
    domain: string,
    profile: ProfileInstance,
    limit: number
): Promise<SentCredentialInfo[]> => {
    const results = convertQueryResultToPropertiesObjectArray<{
        source: ProfileType;
        relationship: ProfileRelationships['presentationSent']['RelationshipProperties'];
        presentation: PresentationType;
    }>(
        await new QueryBuilder()
            .match({
                related: [
                    { identifier: 'source', model: Profile },
                    {
                        ...Profile.getRelationshipByAlias('presentationSent'),
                        identifier: 'relationship',
                        where: { to: profile.handle },
                    },
                    { identifier: 'presentation', model: Presentation },
                ],
            })
            // Don't return credentials that have been accepted
            .where('NOT (presentation)-[:PRESENTATION_RECEIVED]->()')
            .return('source, relationship, presentation')
            .limit(limit)
            .run()
    );

    return results.map(({ source, relationship, presentation }) => ({
        uri: getPresentationUri(presentation.id, domain),
        to: relationship.to,
        from: source.handle,
        sent: relationship.date,
    }));
};
