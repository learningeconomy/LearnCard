import { createHash } from 'crypto';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    VC,
    type AllocateCredentialRefreshResult,
    type CredentialRefreshSigningMode,
    type PublishCredentialRefreshInput,
    type PublishCredentialRefreshNotification,
    type PublishCredentialRefreshResult,
} from '@learncard/types';
import { getCredentialEffectiveTime, getCredentialIssuerId } from '@learncard/helpers';

import { neogma } from '@instance';

import { storeCredential } from '@accesslayer/credential/create';
import { deleteCredential } from '@accesslayer/credential/delete';
import { getBoostByUri } from '@accesslayer/boost/read';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import {
    advanceCredentialRefreshHead,
    generateRefreshId,
    getCredentialRefresh,
    getCredentialRefreshCanonicalLifecycle,
    getCredentialRefreshHead,
    getCredentialRefreshVersion,
    getCredentialRefreshVersionByIdempotencyKey,
    recordCredentialRefreshNotification,
} from '@accesslayer/credential-refresh';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import type {
    CredentialRefreshRecord,
    CredentialRefreshVersionNode,
} from 'types/credential-refresh';

import { createDagJweForRecipients, getLearnCard } from './learnCard.helpers';
import { issueCredentialWithSigningAuthority } from './signingAuthority.helpers';
import {
    computeCredentialMaterialDigest,
    computeCredentialStatusDigest,
    decideCredentialRefreshNotification,
} from './credential-refresh-materiality.helpers';
import { isInitialRefreshVersionUniquenessRace } from './credential-refresh-initial-binding.helpers';
import { ensureInitialNotificationPolicy } from './credential-refresh-notification-policy.helpers';
import { getStatusListBaseUrl } from './status-list.helpers';
import { constructUri } from './uri.helpers';
import {
    addNotificationToQueue,
    buildInitialCredentialReceivedNotification,
    buildCredentialRefreshedNotification,
} from './notifications.helpers';
import { getDidWeb } from './did.helpers';
import { isRelationshipBlocked } from './connection.helpers';
import { ProfileType } from 'types/profile';

/**
 * Managed credential refresh issuance helpers (LC-2135).
 *
 * Allocation reserves an unguessable refresh service ID _before_ the credential is
 * signed. Managed send validates the signed original against the allocation,
 * verifies its proof transiently in-memory, and persists only a holder-encrypted
 * JWE — the legacy storage path that persists plaintext credential JSON is never
 * called with the plaintext VC.
 */

/** Public URL of the managed refresh endpoint for a refreshId. */
export const getCredentialRefreshServiceUrl = (refreshId: string, domain: string): string =>
    `${getStatusListBaseUrl(domain)}/refresh/${refreshId}`;

const getManagedCredentialUri = (id: string, domain: string): string =>
    constructUri('credential', id, domain);

export type AllocateCredentialRefreshParams = {
    issuerProfile: ProfileType;
    holderProfile: ProfileType;
    holderDid: string;
    credentialId: string;
    domain: string;
};

/**
 * Creates an `awaiting_claim` aggregate bound to its issuer and intended holder,
 * without any credential body (the credential does not exist yet — the returned
 * service descriptor must be embedded before proof creation).
 */
export const allocateCredentialRefresh = async (
    params: AllocateCredentialRefreshParams
): Promise<AllocateCredentialRefreshResult> => {
    const { issuerProfile, holderProfile, holderDid, credentialId, domain } = params;

    const refreshId = generateRefreshId();
    const now = new Date().toISOString();

    const props = {
        refreshId,
        issuerProfileId: issuerProfile.profileId,
        // Credentials issued through the network plugin use the profile's public
        // did:web identity. `issuerProfile.did` is the internal controller did:key,
        // so persisting it here would reject the normal SDK-issued credential when
        // the allocation is bound after signing.
        issuerDid: getDidWeb(domain, issuerProfile.profileId),
        holderProfileId: holderProfile.profileId,
        holderDid,
        credentialId,
        state: 'awaiting_claim',
        // Version 1 is reserved for the original credential that will be bound by
        // the managed send.
        currentVersion: 1,
        createdAt: now,
        updatedAt: now,
    };

    await neogma.queryRunner.run(
        `MATCH (issuer:Profile {profileId: $issuerProfileId})
         MATCH (holder:Profile {profileId: $holderProfileId})
         CREATE (refresh:CredentialRefresh $props)
         CREATE (issuer)-[:ISSUED_REFRESH]->(refresh)
         CREATE (holder)-[:HELD_REFRESH]->(refresh)
         RETURN refresh`,
        {
            issuerProfileId: issuerProfile.profileId,
            holderProfileId: holderProfile.profileId,
            props,
        }
    );

    return {
        refreshId,
        refreshService: {
            id: getCredentialRefreshServiceUrl(refreshId, domain),
            type: '1EdTechCredentialRefresh',
            authorization: { type: 'LearnCardDIDAuth' },
        },
    };
};

/** Collects the subject identifiers of a credential (single object or array form). */
const getCredentialSubjectIds = (credential: VC): string[] => {
    const subjects = Array.isArray(credential.credentialSubject)
        ? credential.credentialSubject
        : [credential.credentialSubject];

    return subjects
        .map(subject => (subject as { id?: string } | undefined)?.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);
};

/** True when the credential carries the exact service descriptor produced at allocation. */
const hasAllocatedRefreshService = (credential: VC, refreshId: string, domain: string): boolean => {
    const refreshService = (credential as unknown as Record<string, unknown>).refreshService;

    if (!refreshService) return false;

    const services = Array.isArray(refreshService) ? refreshService : [refreshService];
    const expectedId = getCredentialRefreshServiceUrl(refreshId, domain);

    return services.some(
        service =>
            service &&
            typeof service === 'object' &&
            (service as { id?: unknown }).id === expectedId &&
            (service as { type?: unknown }).type === '1EdTechCredentialRefresh'
    );
};

export type SendRefreshableCredentialParams = {
    issuerProfile: ProfileType;
    refreshId: string;
    credential: VC;
    /**
     * Optional boost the credential was issued from. When present, the stored
     * credential instance is linked INSTANCE_OF the boost so canonical boost
     * recipient management (recipient lists, revocation) sees it.
     */
    boostUri?: string;
    /** Suppress the initial CREDENTIAL_RECEIVED notification for this delivery. */
    skipNotification?: boolean;
    domain: string;
};

type InitialRefreshRoot = {
    rootId: string;
    materialDigest?: string;
    credentialStatusDigest?: string;
    boostId?: string;
};

const getInitialRefreshRoot = async (refreshId: string): Promise<InitialRefreshRoot | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})-[:ROOT]->(root:Credential)
         OPTIONAL MATCH (root)-[:INSTANCE_OF]->(boost:Boost)
         WITH refresh, root, head(collect(DISTINCT boost.id)) AS inferredBoostId
         RETURN root.id AS rootId,
                coalesce(refresh.rootMaterialDigest, refresh.materialDigest) AS materialDigest,
                refresh.credentialStatusDigest AS credentialStatusDigest,
                coalesce(refresh.boostId, inferredBoostId) AS boostId
         LIMIT 1`,
        { refreshId }
    );
    const row = result.records[0];

    if (!row) return null;

    return {
        rootId: row.get('rootId'),
        materialDigest: row.get('materialDigest') ?? undefined,
        credentialStatusDigest: row.get('credentialStatusDigest') ?? undefined,
        boostId: row.get('boostId') ?? undefined,
    };
};

const assertInitialCredentialMatches = (
    root: InitialRefreshRoot,
    materialDigest: string,
    credentialStatusDigest: string,
    boostId?: string
): void => {
    if (
        !root.materialDigest ||
        !root.credentialStatusDigest ||
        root.materialDigest !== materialDigest ||
        root.credentialStatusDigest !== credentialStatusDigest
    ) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Credential refresh is already bound to a different credential',
        });
    }

    if ((root.boostId ?? null) !== (boostId ?? null)) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Credential refresh is already bound to a different boost',
        });
    }
};

const ensureInitialRefreshRelationships = async (params: {
    refreshId: string;
    issuerProfileId: string;
    holderProfileId: string;
    boostId?: string;
}): Promise<string | undefined> => {
    const { refreshId, issuerProfileId, holderProfileId, boostId } = params;
    const now = new Date().toISOString();
    const result = await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})-[:ROOT]->(root:Credential)
         WHERE coalesce(refresh.boostId, '') = coalesce($boostId, '')
         MATCH (issuer:Profile {profileId: $issuerProfileId})
         OPTIONAL MATCH (boost:Boost {id: $boostId})
         MERGE (issuer)-[sent:CREDENTIAL_SENT {to: $holderProfileId}]->(root)
         ON CREATE SET sent.date = $now
         FOREACH (_ IN CASE WHEN boost IS NULL THEN [] ELSE [1] END |
             MERGE (root)-[:INSTANCE_OF]->(boost)
         )
         RETURN root.id AS rootId`,
        {
            refreshId,
            issuerProfileId,
            holderProfileId,
            boostId: boostId ?? null,
            now,
        }
    );

    return result.records[0]?.get('rootId') ?? undefined;
};

const sendInitialCredentialNotificationOnce = async (params: {
    refreshId: string;
    uri: string;
    issuerProfile: ProfileType;
    holderProfile: ProfileType;
    initialNotificationSuppressed: boolean;
}): Promise<void> => {
    const { refreshId, uri, issuerProfile, holderProfile, initialNotificationSuppressed } = params;

    if (initialNotificationSuppressed) return;

    const current = await getCredentialRefresh(refreshId);

    if (current?.initialNotificationSentAt) return;

    await addNotificationToQueue(
        buildInitialCredentialReceivedNotification({
            holderProfile,
            issuerProfile,
            refreshId,
            uri,
        })
    );

    const now = new Date().toISOString();
    await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})
         SET refresh.initialNotificationSentAt = coalesce(refresh.initialNotificationSentAt, $now),
             refresh.updatedAt = $now`,
        { refreshId, now }
    );
};

/**
 * Binds the signed original credential to a previously allocated refresh aggregate.
 *
 * The plaintext VC is handled only within this request: its proof is verified and
 * its invariants are checked against the allocation, then it is encrypted to the
 * intended holder and only the resulting JWE is persisted. Creates the normal
 * CREDENTIAL_SENT relationship plus ROOT/HEAD bindings and records version 1.
 */
export const sendRefreshableCredential = async (
    params: SendRefreshableCredentialParams
): Promise<string> => {
    const {
        issuerProfile,
        refreshId,
        credential,
        boostUri,
        skipNotification = false,
        domain,
    } = params;

    const aggregate = await getCredentialRefresh(refreshId);

    if (!aggregate) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential refresh not found' });
    }

    if (aggregate.issuerProfileId !== issuerProfile.profileId) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Profile did not allocate this credential refresh',
        });
    }

    if (credential.id !== aggregate.credentialId) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Credential ID does not match the allocated refresh',
        });
    }

    const credentialIssuerDid = getCredentialIssuerId(credential);
    const publicIssuerDid = getDidWeb(domain, issuerProfile.profileId);

    // A profile controls both its internal controller did:key and its public network
    // did:web. The network plugin normally issues with did:web, while lower-level
    // callers may legitimately issue with the controller DID. Bind the aggregate to
    // whichever controlled identity appears on version 1; later versions must match
    // that exact normalized issuer.
    if (
        !credentialIssuerDid ||
        ![issuerProfile.did, publicIssuerDid].includes(credentialIssuerDid)
    ) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Credential issuer does not match the allocated refresh',
        });
    }

    if (!getCredentialSubjectIds(credential).includes(aggregate.holderDid)) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Credential subject does not match the intended holder',
        });
    }

    if (!hasAllocatedRefreshService(credential, refreshId, domain)) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Credential does not contain the allocated refresh service',
        });
    }

    const holderProfile = aggregate.holderProfileId
        ? await getProfileByProfileId(aggregate.holderProfileId)
        : null;

    if (!holderProfile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Recipient profile not found' });
    }

    if (await isRelationshipBlocked(issuerProfile, holderProfile)) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profile not found. Are you sure this person exists?',
        });
    }

    // Resolve the optional boost anchor up front so an unknown boost fails before any write.
    const boost = boostUri ? await getBoostByUri(decodeURIComponent(boostUri)) : undefined;

    if (boostUri && !boost) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Boost not found' });
    }

    if (boost) {
        const ownership = await neogma.queryRunner.run(
            `MATCH (boost:Boost {id: $boostId})-[:CREATED_BY]->
                   (:Profile {profileId: $issuerProfileId})
             RETURN boost LIMIT 1`,
            { boostId: boost.id, issuerProfileId: issuerProfile.profileId }
        );

        if (ownership.records.length === 0) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Profile does not own this boost',
            });
        }
    }

    // Transient plaintext proof verification — the result is never persisted.
    // Do not dereference credentialStatus here: the descriptor is fingerprinted below,
    // while canonical lifecycle revocation is enforced by the graph relationships.
    const learnCard = await getLearnCard();
    const verification = await learnCard.invoke.verifyCredential(credential, {
        checks: ['proof'],
    });

    if (
        verification.errors.length > 0 ||
        verification.warnings.length > 0 ||
        !verification.checks.includes('proof')
    ) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Credential proof could not be verified',
        });
    }

    const rootMaterialDigest = computeCredentialMaterialDigest(
        credential as unknown as Record<string, unknown>
    );
    const credentialStatusDigest = computeCredentialStatusDigest(
        (credential as unknown as Record<string, unknown>).credentialStatus
    );

    const existingRoot = await getInitialRefreshRoot(refreshId);

    if (existingRoot) {
        assertInitialCredentialMatches(
            existingRoot,
            rootMaterialDigest,
            credentialStatusDigest,
            boost?.id
        );

        const rootId = await ensureInitialRefreshRelationships({
            refreshId,
            issuerProfileId: issuerProfile.profileId,
            holderProfileId: holderProfile.profileId,
            boostId: boost?.id,
        });

        if (!rootId) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Credential refresh initial delivery could not be resumed',
            });
        }

        const uri = getManagedCredentialUri(rootId, domain);
        const initialNotificationSuppressed = await ensureInitialNotificationPolicy(
            refreshId,
            skipNotification
        );
        await sendInitialCredentialNotificationOnce({
            refreshId,
            uri,
            issuerProfile,
            holderProfile,
            initialNotificationSuppressed,
        });

        return uri;
    }

    // Holder-only encryption: the brain DID must NOT be a recipient.
    const jwe = await createDagJweForRecipients(credential, [aggregate.holderDid]);

    const credentialInstance = await storeCredential(jwe);

    const now = new Date().toISOString();

    // Bind ROOT/HEAD and the canonical sent/boost relationships in one transaction.
    let boundRecordsLength = 0;

    try {
        const bound = await neogma.queryRunner.run(
            `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})
         WHERE NOT EXISTS { MATCH (refresh)-[:ROOT]->(:Credential) }
         MATCH (root:Credential {id: $rootCredentialNodeId})
         MATCH (issuer:Profile {profileId: $issuerProfileId})
         OPTIONAL MATCH (boost:Boost {id: $boostId})
         CREATE (refresh)-[:ROOT]->(root)
         CREATE (refresh)-[:HEAD]->(root)
         CREATE (issuer)-[:CREDENTIAL_SENT {to: $holderProfileId, date: $now}]->(root)
         FOREACH (_ IN CASE WHEN boost IS NULL THEN [] ELSE [1] END |
             CREATE (root)-[:INSTANCE_OF]->(boost)
         )
         SET root.refreshId = $refreshId,
             root.version = 1,
             root.refreshVersionKey = $versionKey,
             root.publishedAt = $now,
             root.signingMode = 'issuer-signed',
             refresh.issuerDid = $credentialIssuerDid,
             refresh.materialDigest = $materialDigest,
             refresh.rootMaterialDigest = $materialDigest,
             refresh.credentialStatusDigest = $credentialStatusDigest,
             refresh.boostId = $boostId,
             refresh.initialNotificationSuppressed = $initialNotificationSuppressed,
             refresh.lastPublishedAt = $now,
             refresh.updatedAt = $now
         RETURN refresh`,
            {
                refreshId,
                rootCredentialNodeId: credentialInstance.id,
                issuerProfileId: issuerProfile.profileId,
                holderProfileId: holderProfile.profileId,
                boostId: boost?.id ?? null,
                versionKey: `${refreshId}:1`,
                now,
                credentialIssuerDid,
                materialDigest: rootMaterialDigest,
                credentialStatusDigest,
                initialNotificationSuppressed: skipNotification,
            }
        );

        boundRecordsLength = bound.records.length;
    } catch (error) {
        if (!isInitialRefreshVersionUniquenessRace(error)) throw error;

        // The bind transaction rolled back. Continue through the normal losing-race
        // cleanup and winning-root verification path below.
    }

    if (boundRecordsLength === 0) {
        try {
            await deleteCredential(credentialInstance);
        } catch (error) {
            console.error(
                'Credential Refresh Helpers - Failed to delete losing initial credential:',
                error
            );
        }

        const concurrentlyBoundRoot = await getInitialRefreshRoot(refreshId);

        if (!concurrentlyBoundRoot) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Credential refresh was bound concurrently; retry initial delivery',
            });
        }

        assertInitialCredentialMatches(
            concurrentlyBoundRoot,
            rootMaterialDigest,
            credentialStatusDigest,
            boost?.id
        );

        const rootId = await ensureInitialRefreshRelationships({
            refreshId,
            issuerProfileId: issuerProfile.profileId,
            holderProfileId: holderProfile.profileId,
            boostId: boost?.id,
        });

        if (!rootId) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Credential refresh initial delivery could not be resumed',
            });
        }

        const uri = getManagedCredentialUri(rootId, domain);
        const initialNotificationSuppressed = await ensureInitialNotificationPolicy(
            refreshId,
            skipNotification
        );
        await sendInitialCredentialNotificationOnce({
            refreshId,
            uri,
            issuerProfile,
            holderProfile,
            initialNotificationSuppressed,
        });

        return uri;
    }

    const uri = getManagedCredentialUri(credentialInstance.id, domain);
    const initialNotificationSuppressed = await ensureInitialNotificationPolicy(
        refreshId,
        skipNotification
    );
    await sendInitialCredentialNotificationOnce({
        refreshId,
        uri,
        issuerProfile,
        holderProfile,
        initialNotificationSuppressed,
    });

    return uri;
};

// --- Publication (LC-2135) -----------------------------------------------------

/**
 * Route-level refinement of the Task 1 contract's permissive signing-authority
 * descriptor: resolving ownership requires the registered name + endpoint.
 */
const SigningAuthorityReferenceValidator = z
    .object({
        type: z.string().min(1),
        name: z.string().min(1),
        endpoint: z.string().min(1),
    })
    .catchall(z.any());

/** Opaque ETag derived from the stored encrypted bytes (never from plaintext). */
export const computeRefreshEtag = (encryptedCredential: string): string =>
    createHash('sha256').update(encryptedCredential).digest('base64url');

const deliverCredentialRefreshNotification = async (params: {
    version: CredentialRefreshVersionNode;
    issuerProfile: ProfileType;
    holderProfile: ProfileType;
}): Promise<PublishCredentialRefreshNotification> => {
    const { version, issuerProfile, holderProfile } = params;

    if (version.notificationDeliveredAt) return 'queued';

    const event = buildCredentialRefreshedNotification({
        holderProfile,
        issuerProfile,
        refreshId: version.refreshId,
        version: version.version,
        notificationId: version.notificationId,
        deliveryKey: version.notificationDeliveryKey,
        notifiedAt: version.notificationCreatedAt,
    });

    try {
        await addNotificationToQueue(event.notification);
        await recordCredentialRefreshNotification({
            refreshId: version.refreshId,
            version: version.version,
            notificationId: event.notificationId,
            deliveryKey: event.deliveryKey,
            notifiedAt: event.notifiedAt,
        });

        return 'queued';
    } catch (error) {
        console.error(
            'Credential Refresh Helpers - Failed to enqueue CREDENTIAL_REFRESHED notification:',
            error
        );

        return 'delivery-failed';
    }
};

const resolveCredentialRefreshReplayNotification = async (params: {
    version: CredentialRefreshVersionNode;
    aggregate: CredentialRefreshRecord;
    issuerProfile: ProfileType;
}): Promise<PublishCredentialRefreshNotification> => {
    const { version, aggregate, issuerProfile } = params;
    const persistedOutcome = version.notificationOutcome ?? 'suppressed';

    if (persistedOutcome !== 'queued') return persistedOutcome;

    const holderProfile = aggregate.holderProfileId
        ? await getProfileByProfileId(aggregate.holderProfileId)
        : null;

    return holderProfile
        ? deliverCredentialRefreshNotification({ version, issuerProfile, holderProfile })
        : 'delivery-failed';
};

/**
 * Acceptance hook for publications made while the credential was awaiting claim.
 * Failed delivery remains pending and is re-driven by an idempotent acceptance retry.
 */
export const deliverPendingCredentialRefreshNotificationForAcceptedCredential = async (params: {
    credentialNodeId: string;
    issuerProfile: ProfileType;
    holderProfile: ProfileType;
}): Promise<PublishCredentialRefreshNotification> => {
    const { credentialNodeId, issuerProfile, holderProfile } = params;
    const result = await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh)-[:ROOT]->(:Credential {id: $credentialNodeId})
         RETURN refresh.refreshId AS refreshId, refresh.state AS state
         LIMIT 1`,
        { credentialNodeId }
    );
    const refreshId = result.records[0]?.get('refreshId');
    const state = result.records[0]?.get('state');

    if (!refreshId || state !== 'active') return 'not-applicable';

    const head = await getCredentialRefreshHead(refreshId);

    if (!head?.notificationPendingAfterClaim) {
        return head?.notificationDeliveredAt ? 'queued' : 'not-applicable';
    }

    return deliverCredentialRefreshNotification({
        version: head,
        issuerProfile,
        holderProfile,
    });
};

/**
 * Shared invariants every published version must satisfy, checked on the signed VC
 * (issuer-signed mode) or on the unsigned body before proof creation
 * (signing-authority mode). Error messages are deliberately generic — credential
 * content must never appear in exception messages, tracing attributes, or logs.
 */
const assertRefreshVersionInvariants = (
    credential: VC,
    aggregate: CredentialRefreshRecord,
    domain: string
): void => {
    if (credential.id !== aggregate.credentialId) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Credential ID does not match the allocated refresh',
        });
    }

    if (getCredentialIssuerId(credential) !== aggregate.issuerDid) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Credential issuer does not match the allocated refresh',
        });
    }

    if (!getCredentialSubjectIds(credential).includes(aggregate.holderDid)) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Credential subject does not match the intended holder',
        });
    }

    if (!hasAllocatedRefreshService(credential, aggregate.refreshId, domain)) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Credential does not contain the allocated refresh service',
        });
    }

    if (
        !aggregate.credentialStatusDigest ||
        computeCredentialStatusDigest(
            (credential as unknown as Record<string, unknown>).credentialStatus
        ) !== aggregate.credentialStatusDigest
    ) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Credential status does not match the original credential',
        });
    }
};

/**
 * Transient in-memory proof verification; the plaintext result is never persisted.
 * Only the proof check runs: the credentialStatus check would fetch remote status
 * list credentials at publish time (availability + SSRF hazard), and revocation
 * state moves through its own lifecycle rather than the refresh publication path.
 */
const verifyRefreshVersionProof = async (credential: VC): Promise<void> => {
    const learnCard = await getLearnCard();
    const verification = await learnCard.invoke.verifyCredential(credential, {
        checks: ['proof'],
    });

    if (
        verification.errors.length > 0 ||
        verification.warnings.length > 0 ||
        !verification.checks.includes('proof')
    ) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Credential proof could not be verified',
        });
    }
};

export type PublishCredentialRefreshParams = {
    issuerProfile: ProfileType;
    input: PublishCredentialRefreshInput;
    domain: string;
};

/**
 * Publishes a new immutable version of a managed refreshable credential and
 * atomically advances the aggregate head.
 *
 * Plaintext exists only transiently inside this request: invariants and proofs are
 * checked in memory, a server-keyed HMAC over the canonical user-visible projection
 * is computed for materiality, and only the holder-encrypted JWE is persisted.
 * The version chain is advanced through the single-writer compare-and-advance in
 * the access layer; losers of a concurrent race receive CONFLICT and may retry.
 */
export const publishCredentialRefresh = async (
    params: PublishCredentialRefreshParams
): Promise<PublishCredentialRefreshResult> => {
    const { issuerProfile, input, domain } = params;
    const { refreshId, idempotencyKey, notifyHolder, updateSummary } = input;

    const aggregate = await getCredentialRefresh(refreshId);

    if (!aggregate) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential refresh not found' });
    }

    if (aggregate.issuerProfileId !== issuerProfile.profileId) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Profile did not allocate this credential refresh',
        });
    }

    if (aggregate.state === 'revoked') {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Credential refresh has been revoked',
        });
    }

    const canonicalLifecycle = await getCredentialRefreshCanonicalLifecycle(refreshId);

    if (canonicalLifecycle?.revoked) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Credential refresh has been revoked',
        });
    }

    if (idempotencyKey) {
        const replayed = await getCredentialRefreshVersionByIdempotencyKey(
            refreshId,
            idempotencyKey
        );

        if (replayed) {
            const notification = await resolveCredentialRefreshReplayNotification({
                version: replayed,
                aggregate,
                issuerProfile,
            });

            return {
                refreshId,
                version: replayed.version,
                publishedAt: replayed.publishedAt,
                notification,
            };
        }
    }

    const head = await getCredentialRefreshHead(refreshId);

    if (!head) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Credential refresh is not bound to a credential yet',
        });
    }

    let signedCredential: VC;
    let signingMode: CredentialRefreshSigningMode;

    if (input.mode === 'issuer-signed') {
        signedCredential = input.signedCredential;
        signingMode = 'issuer-signed';

        assertRefreshVersionInvariants(signedCredential, aggregate, domain);
        await verifyRefreshVersionProof(signedCredential);
    } else {
        const reference = SigningAuthorityReferenceValidator.safeParse(input.signingAuthority);

        if (!reference.success) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Signing authority reference requires a name and endpoint',
            });
        }

        const signingAuthority = await getSigningAuthorityForUserByName(
            issuerProfile,
            reference.data.endpoint,
            reference.data.name.toLowerCase()
        );

        if (!signingAuthority) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Profile does not own this signing authority',
            });
        }

        // Enforce the full invariant set on the unsigned body before proof creation.
        // The signing authority is the issuer's own registered delegate and signs the
        // body as supplied, so the completed credential is rechecked in full plus proof.
        assertRefreshVersionInvariants(input.credential as VC, aggregate, domain);

        // appendCredentialStatus: false — a refresh version must preserve the
        // issuer-supplied credentialStatus descriptor; no new status-list entry is
        // allocated for a version of an already-issued credential.
        signedCredential = (await issueCredentialWithSigningAuthority(
            { type: 'profile', profile: issuerProfile },
            input.credential,
            signingAuthority,
            domain,
            false,
            undefined,
            false
        )) as VC;
        signingMode = 'signing-authority';

        assertRefreshVersionInvariants(signedCredential, aggregate, domain);
        await verifyRefreshVersionProof(signedCredential);
    }

    // Reject a strictly older effective/issuance timestamp. Equal or missing
    // timestamps are accepted: some interoperable issuers omit or reuse them, and
    // managed version ordering remains authoritative.
    const effectiveTime = getCredentialEffectiveTime(signedCredential);

    if (effectiveTime !== undefined && head.effectiveAt) {
        const headTime = Date.parse(head.effectiveAt);

        if (!Number.isNaN(headTime) && effectiveTime < headTime) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Credential effective time is older than the current version',
            });
        }
    }

    // Materiality + notification decision (transient comparison; only the keyed
    // digest is persisted). Actual event emission is wired by the notification task.
    const nextDigest = computeCredentialMaterialDigest(
        signedCredential as unknown as Record<string, unknown>
    );

    const activeNotification = decideCredentialRefreshNotification({
        state: 'active',
        notifyHolder,
        previousDigest: aggregate.materialDigest,
        nextDigest,
    });
    const notification: PublishCredentialRefreshNotification =
        aggregate.state === 'active' ? activeNotification : 'not-applicable';
    const notificationPendingAfterClaim =
        aggregate.state === 'awaiting_claim' &&
        (head.notificationPendingAfterClaim === true || activeNotification === 'queued');

    const holderProfile =
        notification === 'queued' || notificationPendingAfterClaim
            ? aggregate.holderProfileId
                ? await getProfileByProfileId(aggregate.holderProfileId)
                : null
            : null;
    const notificationEvent = holderProfile
        ? buildCredentialRefreshedNotification({
              holderProfile,
              issuerProfile,
              refreshId,
              version: aggregate.currentVersion + 1,
          })
        : undefined;

    // Holder-only encryption: the brain DID must NOT be a recipient.
    const jwe = await createDagJweForRecipients(signedCredential, [aggregate.holderDid]);
    const encryptedCredential = JSON.stringify(jwe);
    const etag = computeRefreshEtag(encryptedCredential);

    const advance = await advanceCredentialRefreshHead({
        refreshId,
        expectedVersion: aggregate.currentVersion,
        expectedState: aggregate.state,
        encryptedCredential,
        signingMode,
        idempotencyKey,
        etag,
        materialDigest: nextDigest,
        updateSummary,
        effectiveAt:
            effectiveTime !== undefined ? new Date(effectiveTime).toISOString() : undefined,
        notificationOutcome: notification,
        notificationId: notificationEvent?.notificationId,
        notificationDeliveryKey: notificationEvent?.deliveryKey,
        notificationCreatedAt: notificationEvent?.notifiedAt,
        notificationPendingAfterClaim,
    });

    if (advance.status === 'conflict') {
        // A concurrent publication advanced the head first; nothing was written.
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Credential refresh was updated concurrently; retry the publication',
        });
    }

    if (advance.status === 'replay') {
        const replayed = await getCredentialRefreshVersion(refreshId, advance.version);

        if (!replayed) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Credential refresh replay could not be resolved; retry the publication',
            });
        }

        return {
            refreshId,
            version: replayed.version,
            publishedAt: replayed.publishedAt,
            notification: await resolveCredentialRefreshReplayNotification({
                version: replayed,
                aggregate,
                issuerProfile,
            }),
        };
    }

    let deliveredNotification = notification;

    if (notification === 'queued') {
        const persistedVersion = await getCredentialRefreshVersion(refreshId, advance.version);

        deliveredNotification =
            persistedVersion && holderProfile
                ? await deliverCredentialRefreshNotification({
                      version: persistedVersion,
                      issuerProfile,
                      holderProfile,
                  })
                : 'delivery-failed';
    }

    return {
        refreshId,
        version: advance.version,
        publishedAt: advance.publishedAt ?? new Date().toISOString(),
        notification: deliveredNotification,
    };
};
