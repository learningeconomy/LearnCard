import { QueryBuilder } from 'neogma';
import type { Transaction } from 'neo4j-driver';
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
    params: LogCredentialActivityParams,
    transaction?: Transaction
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
        onBehalfOf: params.onBehalfOf,
        recipientType: params.recipientType,
        recipientIdentifier: params.recipientIdentifier,
        boostUri: params.boostUri,
        credentialUri: params.credentialUri,
        inboxCredentialId: params.inboxCredentialId,
        integrationId: params.integrationId,
        source: params.source,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    };

    await CredentialActivity.createOne(
        activityData,
        transaction ? { session: transaction } : undefined
    );

    // Create relationships SEQUENTIALLY to prevent deadlocks
    // (Parallel execution with Promise.all can cause deadlocks when multiple
    // transactions try to acquire locks on the same Profile/Boost nodes)

    if (params.actorProfileId) {
        await createPerformedByRelationship(params.actorProfileId, id, transaction);
    }

    if (params.listingId) {
        await createPerformedByListingRelationship(params.listingId, id, transaction);
    }

    if (params.boostUri) {
        let boostId: string | undefined;
        try {
            boostId = getIdFromUri(params.boostUri);
        } catch {
            // Invalid URI format, skip boost relationship
        }
        // Database failures must reach the enclosing transaction and roll it back.
        if (boostId) await createForBoostRelationship(id, boostId, transaction);
    }

    if (params.recipientType === 'profile' && params.recipientProfileId) {
        await createToRecipientRelationship(id, params.recipientProfileId, transaction);
    }

    return activityId;
};

const createPerformedByRelationship = async (
    actorProfileId: string,
    activityId: string,
    transaction?: Transaction
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
        .run(transaction);
};

const createPerformedByListingRelationship = async (
    listingId: string,
    activityId: string,
    transaction?: Transaction
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
        .run(transaction);
};

const createForBoostRelationship = async (
    activityId: string,
    boostId: string,
    transaction?: Transaction
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
        .run(transaction);
};

const createToRecipientRelationship = async (
    activityId: string,
    recipientProfileId: string,
    transaction?: Transaction
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
        .run(transaction);
};
