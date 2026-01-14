import { QueryBuilder } from 'neogma';
import { v4 as uuid } from 'uuid';

import { CredentialActivity, Profile, Boost } from '@models';
import { LogCredentialActivityParams } from 'types/activity';
import { getIdFromUri } from '@helpers/uri.helpers';

export const createCredentialActivity = async (
    params: LogCredentialActivityParams
): Promise<string> => {
    const id = uuid();
    const activityId = params.activityId || uuid();
    const timestamp = new Date().toISOString();

    const activityData = {
        id,
        activityId,
        eventType: params.eventType,
        timestamp,
        actorProfileId: params.actorProfileId,
        recipientType: params.recipientType,
        recipientIdentifier: params.recipientIdentifier,
        boostUri: params.boostUri,
        credentialUri: params.credentialUri,
        inboxCredentialId: params.inboxCredentialId,
        integrationId: params.integrationId,
        source: params.source,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    };

    await CredentialActivity.createOne(activityData);

    const relationshipPromises: Promise<void>[] = [];

    relationshipPromises.push(
        createPerformedByRelationship(params.actorProfileId, id)
    );

    if (params.boostUri) {
        try {
            const boostId = getIdFromUri(params.boostUri);

            if (boostId) {
                relationshipPromises.push(createForBoostRelationship(id, boostId));
            }
        } catch {
            // Invalid URI format, skip boost relationship
        }
    }

    if (params.recipientType === 'profile' && params.recipientProfileId) {
        relationshipPromises.push(
            createToRecipientRelationship(id, params.recipientProfileId)
        );
    }

    await Promise.all(relationshipPromises);

    return activityId;
};

const createPerformedByRelationship = async (
    actorProfileId: string,
    activityId: string
): Promise<void> => {
    await new QueryBuilder()
        .match({
            model: Profile,
            where: { profileId: actorProfileId },
            identifier: 'profile',
        })
        .match({
            model: CredentialActivity,
            where: { id: activityId },
            identifier: 'activity',
        })
        .create('(profile)-[:PERFORMED]->(activity)')
        .run();
}

const createForBoostRelationship = async (
    activityId: string,
    boostId: string
): Promise<void> => {
    await new QueryBuilder()
        .match({
            model: CredentialActivity,
            where: { id: activityId },
            identifier: 'activity',
        })
        .match({
            model: Boost,
            where: { id: boostId },
            identifier: 'boost',
        })
        .create('(activity)-[:FOR_BOOST]->(boost)')
        .run();
};

const createToRecipientRelationship = async (
    activityId: string,
    recipientProfileId: string
): Promise<void> => {
    await new QueryBuilder()
        .match({
            model: CredentialActivity,
            where: { id: activityId },
            identifier: 'activity',
        })
        .match({
            model: Profile,
            where: { profileId: recipientProfileId },
            identifier: 'recipient',
        })
        .create('(activity)-[:TO_RECIPIENT]->(recipient)')
        .run();
};
