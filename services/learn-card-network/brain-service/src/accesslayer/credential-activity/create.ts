import { QueryBuilder } from 'neogma';
import { v4 as uuid } from 'uuid';

import { CredentialActivity, Profile, Boost, AppStoreListing } from '@models';
import { LogCredentialActivityParams } from 'types/activity';
import { getIdFromUri } from '@helpers/uri.helpers';

/**
 * Creates a credential activity record with relationships.
 * Relationships are created sequentially (not in parallel) to prevent deadlocks
 * that can occur when multiple concurrent transactions try to lock the same nodes.
 */
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

    // Create relationships SEQUENTIALLY to prevent deadlocks
    // (Parallel execution with Promise.all can cause deadlocks when multiple
    // transactions try to acquire locks on the same Profile/Boost nodes)

    await createPerformedByRelationship(params.actorProfileId, id);

    if (params.listingId) {
        await createPerformedByListingRelationship(params.listingId, id);
    }

    if (params.boostUri) {
        try {
            const boostId = getIdFromUri(params.boostUri);

            if (boostId) {
                await createForBoostRelationship(id, boostId);
            }
        } catch {
            // Invalid URI format, skip boost relationship
        }
    }

    if (params.recipientType === 'profile' && params.recipientProfileId) {
        await createToRecipientRelationship(id, params.recipientProfileId);
    }

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
};

const createPerformedByListingRelationship = async (
    listingId: string,
    activityId: string
): Promise<void> => {
    await new QueryBuilder()
        .match({
            model: AppStoreListing,
            where: { listing_id: listingId },
            identifier: 'listing',
        })
        .match({
            model: CredentialActivity,
            where: { id: activityId },
            identifier: 'activity',
        })
        .create('(listing)-[:PERFORMED_BY_LISTING]->(activity)')
        .run();
};

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
