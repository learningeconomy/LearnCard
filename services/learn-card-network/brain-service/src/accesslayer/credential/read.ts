import { QueryBuilder } from 'neogma';
import {
    Credential,
    CredentialInstance,
    CredentialRelationships,
    Profile,
    ProfileInstance,
    ProfileRelationships,
} from '@models';
import { SentCredentialInfo } from '@learncard/types';

import { getCredentialUri } from '@helpers/credential.helpers';

import { CredentialType } from 'types/credential';
import { ProfileType } from 'types/profile';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';

export const getCredentialById = async (id: string): Promise<CredentialInstance | null> => {
    return Credential.findOne({ where: { id } });
};

export const getReceivedCredentialsForProfile = async (
    domain: string,
    profile: ProfileInstance,
    limit: number
): Promise<SentCredentialInfo[]> => {
    const results = convertQueryResultToPropertiesObjectArray<{
        sent: ProfileRelationships['credentialSent']['RelationshipProperties'];
        credential: CredentialType;
        received: CredentialRelationships['credentialReceived']['RelationshipProperties'];
    }>(
        await new QueryBuilder()
            .match({
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
            })
            .return('sent, credential, received')
            .limit(limit)
            .run()
    );

    return results.map(({ sent, credential, received }) => ({
        uri: getCredentialUri(credential.id, domain),
        to: sent.to,
        from: received.from,
        sent: sent.date,
        received: received.date,
    }));
};

export const getSentCredentialsForProfile = async (
    domain: string,
    profile: ProfileInstance,
    limit: number
): Promise<SentCredentialInfo[]> => {
    const results = convertQueryResultToPropertiesObjectArray<{
        source: ProfileType;
        sent: ProfileRelationships['credentialSent']['RelationshipProperties'];
        credential: CredentialType;
        received?: CredentialRelationships['credentialReceived']['RelationshipProperties'];
    }>(
        await new QueryBuilder()
            .match({
                related: [
                    {
                        identifier: 'source',
                        model: Profile,
                        where: { profileId: profile.profileId },
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
            })
            .return('source, sent, credential, received')
            .limit(limit)
            .run()
    );

    return results.map(({ source, sent, credential, received }) => ({
        uri: getCredentialUri(credential.id, domain),
        to: sent.to,
        from: source.profileId,
        sent: sent.date,
        received: received?.date,
    }));
};

export const getIncomingCredentialsForProfile = async (
    domain: string,
    profile: ProfileInstance,
    limit: number
): Promise<SentCredentialInfo[]> => {
    const results = convertQueryResultToPropertiesObjectArray<{
        source: ProfileType;
        relationship: ProfileRelationships['credentialSent']['RelationshipProperties'];
        credential: CredentialType;
    }>(
        await new QueryBuilder()
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
            .where('NOT (credential)-[:CREDENTIAL_RECEIVED]->()')
            .return('source, relationship, credential')
            .limit(limit)
            .run()
    );

    return results.map(({ source, relationship, credential }) => ({
        uri: getCredentialUri(credential.id, domain),
        to: relationship.to,
        from: source.profileId,
        sent: relationship.date,
    }));
};
