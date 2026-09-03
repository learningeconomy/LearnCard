import { createHash } from 'crypto';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    LCNNotificationTypeEnumValidator,
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
import { createSentCredentialRelationship } from '@accesslayer/credential/relationships/create';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import {
    advanceCredentialRefreshHead,
    generateRefreshId,
    getCredentialRefresh,
    getCredentialRefreshHead,
    recordCredentialRefreshNotification,
} from '@accesslayer/credential-refresh';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import type { CredentialRefreshRecord } from 'types/credential-refresh';

import { createDagJweForRecipients, getLearnCard } from './learnCard.helpers';
import { issueCredentialWithSigningAuthority } from './signingAuthority.helpers';
import {
    computeCredentialMaterialDigest,
    decideCredentialRefreshNotification,
} from './credential-refresh-materiality.helpers';
import { getStatusListBaseUrl } from './status-list.helpers';
import { getCredentialUri } from './credential.helpers';
import {
    addNotificationToQueue,
    buildCredentialRefreshedNotification,
} from './notifications.helpers';
import { getNotificationMessage } from './notificationMessages';
import { resolveRecipientLocale } from './getRecipientLocale.helpers';
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
        issuerDid: issuerProfile.did,
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
    domain: string;
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
    const { issuerProfile, refreshId, credential, domain } = params;

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

    // Fail before writing anything when the aggregate is already bound. The unique
    // refreshVersionKey constraint is the backstop for concurrent double-sends.
    const existingRoot = await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})-[:ROOT]->(root:Credential)
         RETURN root.id AS id LIMIT 1`,
        { refreshId }
    );

    if (existingRoot.records.length > 0) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Credential refresh is already bound to a credential',
        });
    }

    // Transient plaintext verification — the result is never persisted.
    const learnCard = await getLearnCard();
    const verification = await learnCard.invoke.verifyCredential(credential);

    if (verification.errors.length > 0 || !verification.checks.includes('proof')) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Credential proof could not be verified',
        });
    }

    // Holder-only encryption: the brain DID must NOT be a recipient.
    const jwe = await createDagJweForRecipients(credential, [aggregate.holderDid]);

    const credentialInstance = await storeCredential(jwe);

    const now = new Date().toISOString();

    // Bind the aggregate to the original immutable credential node: ROOT and HEAD
    // both point at version 1.
    await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})
         MATCH (root:Credential {id: $rootCredentialNodeId})
         CREATE (refresh)-[:ROOT]->(root)
         CREATE (refresh)-[:HEAD]->(root)
         SET root.refreshId = $refreshId,
             root.version = 1,
             root.refreshVersionKey = $versionKey,
             root.publishedAt = $now,
             root.signingMode = 'issuer-signed'
         RETURN refresh`,
        {
            refreshId,
            rootCredentialNodeId: credentialInstance.id,
            versionKey: `${refreshId}:1`,
            now,
        }
    );

    await createSentCredentialRelationship(
        { type: 'profile', profile: issuerProfile },
        holderProfile,
        credentialInstance
    );

    const uri = getCredentialUri(credentialInstance.id, domain);

    await addNotificationToQueue({
        type: LCNNotificationTypeEnumValidator.enum.CREDENTIAL_RECEIVED,
        to: holderProfile,
        from: issuerProfile,
        message: getNotificationMessage(
            'credentialReceived',
            resolveRecipientLocale(holderProfile),
            {
                from: issuerProfile.displayName,
            }
        ),
        data: { vcUris: [uri] },
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
const computeRefreshEtag = (encryptedCredential: string): string =>
    createHash('sha256').update(encryptedCredential).digest('base64url');

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

    if (verification.errors.length > 0 || !verification.checks.includes('proof')) {
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

    // Idempotent retry: the key that produced the current version is stored on the
    // aggregate, so a retry short-circuits and returns the exact prior result.
    if (idempotencyKey && aggregate.idempotencyKey === idempotencyKey) {
        const head = await getCredentialRefreshHead(refreshId);

        return {
            refreshId,
            version: aggregate.currentVersion,
            publishedAt: aggregate.lastPublishedAt ?? head?.publishedAt ?? '',
            notification: head?.notificationOutcome ?? 'suppressed',
        };
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
        // body as supplied, so the completed credential is checked for proof + ID.
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

        if (signedCredential.id !== aggregate.credentialId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Credential ID does not match the allocated refresh',
            });
        }

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

    const notification: PublishCredentialRefreshNotification = decideCredentialRefreshNotification({
        state: aggregate.state,
        notifyHolder,
        previousDigest: aggregate.materialDigest,
        nextDigest,
    });

    // Holder-only encryption: the brain DID must NOT be a recipient.
    const jwe = await createDagJweForRecipients(signedCredential, [aggregate.holderDid]);
    const encryptedCredential = JSON.stringify(jwe);
    const etag = computeRefreshEtag(encryptedCredential);

    const advance = await advanceCredentialRefreshHead({
        refreshId,
        expectedVersion: aggregate.currentVersion,
        encryptedCredential,
        signingMode,
        idempotencyKey,
        etag,
        materialDigest: nextDigest,
        updateSummary,
        effectiveAt:
            effectiveTime !== undefined ? new Date(effectiveTime).toISOString() : undefined,
        notificationOutcome: notification,
    });

    if (advance.status === 'conflict') {
        // A concurrent publication advanced the head first; nothing was written.
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Credential refresh was updated concurrently; retry the publication',
        });
    }

    if (advance.status === 'replay') {
        const replayedHead = await getCredentialRefreshHead(refreshId);

        return {
            refreshId,
            version: advance.version,
            publishedAt: advance.publishedAt ?? replayedHead?.publishedAt ?? '',
            notification: replayedHead?.notificationOutcome ?? 'suppressed',
        };
    }

    // Notification event emission (LC-2136). Best-effort, strictly after the
    // durable publication: the opaque CREDENTIAL_REFRESHED event carries only the
    // refreshId, version, route key, and delivery-window key — no credential
    // content. A delivery failure is logged for observability and never rolls
    // back the published version. Idempotent replays returned above return the
    // recorded decision without re-emitting.
    if (notification === 'queued') {
        try {
            const holderProfile = aggregate.holderProfileId
                ? await getProfileByProfileId(aggregate.holderProfileId)
                : null;

            if (holderProfile) {
                const event = buildCredentialRefreshedNotification({
                    holderProfile,
                    issuerProfile,
                    refreshId,
                    version: advance.version,
                });

                await addNotificationToQueue(event.notification);

                await recordCredentialRefreshNotification({
                    refreshId,
                    notificationId: event.notificationId,
                    deliveryKey: event.deliveryKey,
                    notifiedAt: event.notifiedAt,
                });
            }
        } catch (error) {
            console.error(
                'Credential Refresh Helpers - Failed to enqueue CREDENTIAL_REFRESHED notification:',
                error
            );
        }
    }

    return {
        refreshId,
        version: advance.version,
        publishedAt: advance.publishedAt ?? new Date().toISOString(),
        notification,
    };
};
