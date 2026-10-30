import { termsReferralSnapshotCypher } from '@helpers/consent-referral.helpers';
import { QueryBuilder, BindParam } from 'neogma';
import type { Transaction } from 'neo4j-driver';
import { v4 as uuid } from 'uuid';

import {
    CredentialInstance,
    Credential,
    Boost,
    BoostInstance,
    Role,
    Profile,
    ConsentFlowTransaction,
    AppStoreListing,
} from '@models';
import { flattenObject } from '@helpers/objects.helpers';
import { ProfileType } from 'types/profile';
import { CredentialIssuer, getIssuerOwnerProfile, isAppStoreListingIssuer } from 'types/issuer';
import { clearDidWebCacheForChildProfileManagers } from '@accesslayer/boost/relationships/update';
import { getBoostIdForCredentialInstance } from '@accesslayer/credential/relationships/read';
import { DbTermsType } from 'types/consentflowcontract';
import { TRPCError } from '@trpc/server';
import { runAudienceMutation } from '@accesslayer/consentflowcontract/relationships/recipients';

export const createSentCredentialRelationship = async (
    issuer: CredentialIssuer,
    to: ProfileType,
    credential: CredentialInstance,
    metadata?: Record<string, unknown>,
    activityId?: string,
    integrationId?: string,
    transaction?: Transaction
): Promise<void> => {
    const properties = flattenObject({
        to: to.profileId,
        date: new Date().toISOString(),
        ...(metadata ? { metadata } : {}),
        ...(activityId ? { activityId } : {}),
        ...(integrationId ? { integrationId } : {}),
    });

    // Always write the Profile -> CREDENTIAL_SENT -> Credential edge from the
    // issuer's owner profile. Many existing queries (getBoostRecipients, etc.)
    // match on this specific shape, so maintaining this invariant prevents
    // silent regressions when credentials are issued via alternative issuer
    // types (e.g., AppStoreListing).
    const ownerProfile = getIssuerOwnerProfile(issuer);

    await new QueryBuilder(new BindParam({ params: properties }))
        .match({
            related: [
                {
                    model: Profile,
                    where: { profileId: ownerProfile.profileId },
                    identifier: 'profile',
                },
            ],
        })
        .match({
            related: [
                { model: Credential, where: { id: credential.id }, identifier: 'credential' },
            ],
        })
        .create(
            `(profile)-[r:${Profile.getRelationshipByAlias('credentialSent').name}]->(credential)`
        )
        .set('r = $params')
        .run(transaction);

    // If the issuer is an AppStoreListing, additionally write the
    // AppStoreListing -> CREDENTIAL_SENT -> Credential edge so that
    // listing-scoped queries (getCredentialsByIssuer, getCredentialsSentByListingToProfile)
    // can attribute the credential to the listing without having to traverse
    // the owner profile.
    if (isAppStoreListingIssuer(issuer)) {
        await new QueryBuilder(new BindParam({ params: properties }))
            .match({
                related: [
                    {
                        model: AppStoreListing,
                        where: { listing_id: issuer.listing.listing_id },
                        identifier: 'listing',
                    },
                ],
            })
            .match({
                related: [
                    { model: Credential, where: { id: credential.id }, identifier: 'credential' },
                ],
            })
            .create(
                `(listing)-[r:${
                    AppStoreListing.getRelationshipByAlias('credentialSent').name
                }]->(credential)`
            )
            .set('r = $params')
            .run(transaction);
    }
};

export const createListingSentCredentialRelationship = async (
    listingId: string,
    to: ProfileType,
    credential: CredentialInstance,
    metadata?: Record<string, unknown>,
    activityId?: string,
    integrationId?: string
): Promise<void> => {
    const properties = flattenObject({
        to: to.profileId,
        date: new Date().toISOString(),
        ...(metadata ? { metadata } : {}),
        ...(activityId ? { activityId } : {}),
        ...(integrationId ? { integrationId } : {}),
    });

    await new QueryBuilder(new BindParam({ params: properties }))
        .match({
            related: [
                {
                    model: AppStoreListing,
                    where: { listing_id: listingId },
                    identifier: 'listing',
                },
            ],
        })
        .match({
            related: [
                { model: Credential, where: { id: credential.id }, identifier: 'credential' },
            ],
        })
        .create(
            `(listing)-[r:${
                AppStoreListing.getRelationshipByAlias('credentialSent').name
            }]->(credential)`
        )
        .set('r = $params')
        .run();
};

export const createReceivedCredentialRelationship = async (
    to: ProfileType,
    from: ProfileType | { listing_id: string },
    credential: CredentialInstance,
    metadata?: Record<string, unknown>,
    transaction?: Transaction
): Promise<void> => {
    const fromId = 'profileId' in from ? from.profileId : from.listing_id;
    const properties = flattenObject({
        from: fromId,
        date: new Date().toISOString(),
        ...(metadata ? { metadata } : {}),
    });

    await new QueryBuilder(new BindParam({ params: properties }))
        .match({
            related: [
                { model: Credential, where: { id: credential.id }, identifier: 'credential' },
            ],
        })
        .match({
            related: [
                { model: Profile, where: { profileId: to.profileId }, identifier: 'profile' },
            ],
        })
        .create(
            `(credential)-[r:${
                Credential.getRelationshipByAlias('credentialReceived').name
            }]->(profile)`
        )
        .set('r = $params')
        .run(transaction);
};

export const setDefaultClaimedRole = async (
    profile: ProfileType,
    credential: CredentialInstance,
    transaction?: Transaction
): Promise<void> => {
    await new QueryBuilder()
        .match({
            related: [
                { identifier: 'credential', model: Credential, where: { id: credential.id } },
                {
                    ...Credential.getRelationshipByAlias('instanceOf'),
                    identifier: 'instanceOf',
                    direction: 'out',
                },
                { identifier: 'boost', model: Boost },
                Boost.getRelationshipByAlias('claimRole'),
                { identifier: 'role', model: Role },
            ],
        })
        .with('boost, role')
        .match({ model: Profile, where: { profileId: profile.profileId }, identifier: 'profile' })
        .where(
            `NOT EXISTS { MATCH (profile)-[:${
                Boost.getRelationshipByAlias('hasRole').name
            }]-(boost)}`
        )
        .create({
            related: [
                { identifier: 'profile' },
                `-[:${Boost.getRelationshipByAlias('hasRole').name} { roleId: role.id }]->`,
                { identifier: 'boost' },
            ],
        })
        .run(transaction);

    // An enclosing transaction invalidates caches only after its writes commit.
    if (transaction) return;

    try {
        const boostId = await getBoostIdForCredentialInstance(credential);

        if (boostId) await clearDidWebCacheForChildProfileManagers(boostId);
    } catch (error) {
        console.error('Could not clear did:web cache for accepted boost credential', error);
    }
};

/**
 * Commit delivery and its audit entry under the same lock as access updates.
 * Signing may have awaited an external service; the captured grant is not authority.
 */
export const createContractCredentialRelationships = async ({
    issuer,
    writerProfileId,
    recipient,
    credential,
    boost,
    terms,
    metadata,
    activityId,
    integrationId,
    listingId,
    allowConsumedOneTime = false,
}: {
    issuer: CredentialIssuer;
    writerProfileId: string;
    recipient: ProfileType;
    credential: CredentialInstance;
    boost: BoostInstance;
    terms: DbTermsType;
    metadata?: Record<string, unknown>;
    activityId?: string;
    integrationId?: string;
    listingId?: string;
    allowConsumedOneTime?: boolean;
}): Promise<void> => {
    const date = new Date().toISOString();
    const owner = getIssuerOwnerProfile(issuer);
    const listingIds = [
        ...new Set([
            ...(isAppStoreListingIssuer(issuer) ? [issuer.listing.listing_id] : []),
            ...(listingId ? [listingId] : []),
        ]),
    ];
    const result = await runAudienceMutation(
        new QueryBuilder(
            new BindParam({
                termsId: terms.id,
                expectedVersion: terms.consentedVersion,
                issuerId: owner.profileId,
                writerProfileId,
                recipientId: recipient.profileId,
                credentialId: credential.id,
                boostId: boost.id,
                listingIds,
                allowConsumedOneTime,
                sent: flattenObject({
                    to: recipient.profileId,
                    date,
                    ...(metadata ? { metadata } : {}),
                    ...(activityId ? { activityId } : {}),
                    ...(integrationId ? { integrationId } : {}),
                }),
                transactionId: uuid(),
                date,
            })
        ).raw(`
                MATCH (terms:ConsentFlowTerms {id:$termsId})-[:CONSENTS_TO]->(contract:ConsentFlowContract)
                SET contract.audienceLock = coalesce(contract.audienceLock, 0) + 1
                WITH terms, contract
                WHERE coalesce(contract.status, 'active') <> 'retired'
                  AND contract.currentVersion = $expectedVersion
                  AND terms.consentedVersion = $expectedVersion
                  AND (terms.status = 'live' OR
                    ($allowConsumedOneTime AND terms.status = 'consumed' AND terms.oneTime = true))
                  AND (terms.expiresAt IS NULL OR trim(terms.expiresAt) = '' OR datetime(terms.expiresAt) > datetime.realtime())
                  AND (contract.expiresAt IS NULL OR trim(contract.expiresAt) = '' OR datetime(contract.expiresAt) > datetime.realtime())
                  AND NOT $writerProfileId IN coalesce(terms['terms.deniedWriters'], [])
                  AND EXISTS { MATCH (contract)-[:CREATED_BY|CAN_WRITE]->(:Profile {profileId:$writerProfileId}) }
                  AND EXISTS { MATCH (:Profile {profileId:$recipientId})-[:CREATED_BY]->(terms) }
                MATCH (credential:Credential {id:$credentialId}), (boost:Boost {id:$boostId}),
                    (issuer:Profile {profileId:$issuerId})
                WHERE boost.category IS NULL OR terms['terms.write.credentials.categories.' + boost.category] = true
                OPTIONAL MATCH (listing:AppStoreListing) WHERE listing.listing_id IN $listingIds
                WITH terms, contract, credential, boost, issuer, collect(DISTINCT listing) AS listings
                WHERE size(listings) = size($listingIds)
                CREATE (credential)-[:${Credential.getRelationshipByAlias('instanceOf').name}]->(boost)
                CREATE (issuer)-[sent:${Profile.getRelationshipByAlias('credentialSent').name}]->(credential)
                SET sent = $sent
                FOREACH (listing IN listings |
                    CREATE (listing)-[delivery:CREDENTIAL_SENT]->(credential)
                    SET delivery = $sent)
                CREATE (transaction:ConsentFlowTransaction {id:$transactionId, action:'write', date:$date, boostId:$boostId})
                    -[:${ConsentFlowTransaction.getRelationshipByAlias('isFor').name}]->(terms)
                ${termsReferralSnapshotCypher()}
                CREATE (credential)-[:${Credential.getRelationshipByAlias('issuedViaTransaction').name} {date:$date}]->(transaction)
                RETURN transaction.id AS id
            `)
    );
    if (!result.records.length) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'User has not yet approved the latest version of this contract',
        });
    }
};
