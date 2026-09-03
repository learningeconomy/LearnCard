import { TRPCError } from '@trpc/server';
import {
    LCNNotificationTypeEnumValidator,
    VC,
    type AllocateCredentialRefreshResult,
} from '@learncard/types';
import { getCredentialIssuerId } from '@learncard/helpers';

import { neogma } from '@instance';

import { storeCredential } from '@accesslayer/credential/create';
import { createSentCredentialRelationship } from '@accesslayer/credential/relationships/create';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { generateRefreshId, getCredentialRefresh } from '@accesslayer/credential-refresh';

import { createDagJweForRecipients, getLearnCard } from './learnCard.helpers';
import { getStatusListBaseUrl } from './status-list.helpers';
import { getCredentialUri } from './credential.helpers';
import { addNotificationToQueue } from './notifications.helpers';
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
