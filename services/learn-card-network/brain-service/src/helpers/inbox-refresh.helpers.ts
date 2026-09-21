import { randomUUID, createHmac } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { UnsignedVCValidator, VCValidator } from '@learncard/types';
import type {
    InboxCredentialRefreshReceipt,
    PublishCredentialRefreshInput,
    PublishCredentialRefreshResult,
    VC,
} from '@learncard/types';
import {
    canonicalizeCredentialJson,
    injectManagedRefreshService,
    getManagedRefreshServices,
    getCredentialEffectiveTime,
    getCredentialIssuerId,
    getBitstringStatusListEntries,
} from '@learncard/helpers';
import { getCredentialRefreshRuntimeEnvironment } from '@environment';
import { AUTH_GRANT_NO_ACCESS_SCOPE } from '../constants/auth-grant';
import { ensureCredentialRefreshConstraints } from '../models/credential-refresh-constraints';
import { getCredentialRefresh, generateRefreshId } from '@accesslayer/credential-refresh';
import { getInboxCredentialById } from '@accesslayer/inbox-credential/read';
import {
    advancePendingInboxRefresh,
    bindPendingInboxRefresh,
    getInboxRefreshIssue,
    getPendingInboxPublication,
    getInboxRefreshSnapshot,
} from '@accesslayer/inbox-credential/refresh';
import { getProfileByDid, getProfileByProfileId } from '@accesslayer/profile/read';
import { getProfilesThatManageAProfile } from '@accesslayer/profile/relationships/read';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import { getBoostByUri } from '@accesslayer/boost/read';
import { INBOX_DELIVERY_RETENTION_DAYS } from 'types/inbox-delivery';
import type { ProfileType } from 'types/profile';
import type { CredentialRefreshRecord } from 'types/credential-refresh';
import { userHasRequiredScopes } from './auth-grant.helpers';
import { getDidWeb } from './did.helpers';
import { encryptInboxCredential, decryptInboxCredential } from './inbox-encryption.helpers';
import {
    getCredentialRefreshServiceUrl,
    computeRefreshEtag,
    getManagedCredentialUri,
    getInitialRefreshRoot,
    sendInitialCredentialNotificationOnce,
} from './credential-refresh.helpers';
import {
    getCredentialRefreshDigestSecret,
    computeCredentialMaterialDigest,
    computeCredentialStatusDigest,
    computeCredentialSubjectDigest,
} from './credential-refresh-materiality.helpers';
import { appendBitstringStatusListEntries } from './status-list.helpers';
import { issueCredentialWithSigningAuthority } from './signingAuthority.helpers';
import { verifyManagedRefreshProof } from './credential-refresh-proof.helpers';
import { createDagJweForRecipients, getLearnCard } from './learnCard.helpers';
import { isRelationshipBlocked } from './connection.helpers';

export const assertInboxRefreshEnabled = async (scope?: string): Promise<void> => {
    if (!getCredentialRefreshRuntimeEnvironment().CREDENTIAL_REFRESH_ENABLED)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential refresh is not available' });
    if (!userHasRequiredScopes(scope ?? AUTH_GRANT_NO_ACCESS_SCOPE, 'credentials:write'))
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'This operation requires credentials:write scope',
        });
    await ensureCredentialRefreshConstraints();
};

export const inboxRefreshRequestDigest = (request: unknown): string =>
    createHmac('sha256', getCredentialRefreshDigestSecret())
        .update('inbox-refresh-issue:v1\0')
        .update(canonicalizeCredentialJson(request))
        .digest('base64url');

export const getInboxRefreshIssueKey = (issuerProfileId: string, key: string): string =>
    `${issuerProfileId}:${key}`;

export const getInboxRefreshReplay = async (
    issuerProfileId: string,
    key: string | undefined,
    requestDigest: string
) => {
    if (!key) return null;
    const existing = await getInboxRefreshIssue(getInboxRefreshIssueKey(issuerProfileId, key));
    if (existing && existing.requestDigest !== requestDigest)
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'This idempotencyKey was used for a different inbox issuance.',
        });
    return existing;
};

const serviceFor = (refreshId: string, domain: string) => ({
    id: getCredentialRefreshServiceUrl(refreshId, domain),
    type: 'LearnCardCredentialRefresh2026' as const,
    authorization: { type: 'LearnCardDIDAuth' as const },
});

/** Metadata only: status coordinates are public mechanisms, never credential claims. */
export const getInboxRefreshReceipt = async (
    refreshId: string,
    domain: string
): Promise<InboxCredentialRefreshReceipt> => {
    const aggregate = await getCredentialRefresh(refreshId);
    if (!aggregate)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential refresh not found' });
    const status = aggregate.inboxCredentialStatus
        ? JSON.parse(aggregate.inboxCredentialStatus)
        : undefined;
    return {
        refreshId,
        refreshService: serviceFor(refreshId, domain),
        credentialId: aggregate.credentialId,
        issuerDid: aggregate.issuerDid,
        ...(aggregate.holderDid ? { holderDid: aggregate.holderDid } : {}),
        ...(status ? { credentialStatus: status } : {}),
    };
};

export const prepareInboxRefresh = async (
    credential: unknown,
    issuer: ProfileType,
    domain: string
) => {
    const body = UnsignedVCValidator.parse(credential);
    if (
        body.proof ||
        !body.type.includes('VerifiableCredential') ||
        body.type.includes('VerifiablePresentation') ||
        Array.isArray(body.credentialSubject)
    ) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
                'Inbox refresh requires an unsigned credential with a single subject and a signing authority.',
        });
    }
    if (getManagedRefreshServices(body).length)
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
                'Inbox refresh allocates its own refresh service; omit an existing managed service.',
        });
    const refreshId = generateRefreshId();
    const issuerDid = getDidWeb(domain, issuer.profileId);
    // Inbox is explicitly addressed by verified contact; the eventual claimant binds the subject.
    const { id: _id, did: _did, ...subject } = body.credentialSubject;
    const prepared = injectManagedRefreshService(
        await appendBitstringStatusListEntries(
            {
                ...body,
                id: body.id || `urn:uuid:${randomUUID()}`,
                issuer: issuerDid,
                credentialSubject: subject,
            },
            issuer.profileId,
            domain
        ),
        serviceFor(refreshId, domain)
    );
    const now = new Date().toISOString();
    return {
        credential: prepared,
        aggregate: {
            refreshId,
            issuerProfileId: issuer.profileId,
            issuerDid,
            credentialId: prepared.id!,
            state: 'pending_holder',
            currentVersion: 1,
            createdAt: now,
            updatedAt: now,
            credentialStatusDigest: computeCredentialStatusDigest(prepared.credentialStatus),
            inboxCredentialStatus: JSON.stringify(prepared.credentialStatus ?? null),
            materialDigest: computeCredentialMaterialDigest(prepared),
        },
    };
};

/** Pending publications remain unsigned; finalization adds the verified holder before signing. */
export const publishPendingInboxRefresh = async (
    aggregate: CredentialRefreshRecord,
    issuer: ProfileType,
    input: PublishCredentialRefreshInput,
    domain: string
): Promise<PublishCredentialRefreshResult> => {
    const replay = await getPendingInboxPublication(aggregate.refreshId, input.idempotencyKey);
    if (replay) return replay;
    if (input.mode !== 'signing-authority')
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
                'Pending inbox refresh requires unsigned content in signing-authority mode; the holder is bound at claim.',
        });
    const inbox = await getInboxCredentialById(aggregate.inboxCredentialId!);
    if (!inbox || inbox.currentStatus !== 'PENDING' || Date.parse(inbox.expiresAt) <= Date.now())
        throw new TRPCError({ code: 'CONFLICT', message: 'Inbox credential is no longer pending' });
    const authority = inbox.signingAuthority;
    if (
        !authority?.endpoint ||
        !authority.name ||
        input.signingAuthority.endpoint !== authority.endpoint ||
        String(input.signingAuthority.name).toLowerCase() !== authority.name.toLowerCase() ||
        !(await getSigningAuthorityForUserByName(issuer, authority.endpoint, authority.name))
    )
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Publication must use the inbox issuance signing authority',
        });
    const body = input.credential;
    const previous = UnsignedVCValidator.parse(
        JSON.parse(await decryptInboxCredential(inbox.credential))
    );
    if (
        body.proof ||
        Array.isArray(body.credentialSubject) ||
        body.id !== aggregate.credentialId ||
        getCredentialIssuerId(body) !== aggregate.issuerDid ||
        computeCredentialSubjectDigest(body.credentialSubject) !==
            computeCredentialSubjectDigest(previous.credentialSubject) ||
        body.boostId !== previous.boostId ||
        computeCredentialStatusDigest(body.credentialStatus) !== aggregate.credentialStatusDigest ||
        canonicalizeCredentialJson(body.refreshService) !==
            canonicalizeCredentialJson(previous.refreshService)
    )
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
                'Pending update must preserve credential identity, issuer, subject, boost, status and refresh service.',
        });
    const previousTime = getCredentialEffectiveTime(previous);
    const nextTime = getCredentialEffectiveTime(body);
    if (previousTime !== undefined && nextTime !== undefined && nextTime < previousTime)
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Credential effective time is older than the current version',
        });
    const prepared = injectManagedRefreshService(body, serviceFor(aggregate.refreshId, domain));
    const result = await advancePendingInboxRefresh({
        refreshId: aggregate.refreshId,
        expectedVersion: aggregate.currentVersion,
        credential: await encryptInboxCredential(JSON.stringify(prepared)),
        credentialName: typeof prepared.name === 'string' ? prepared.name : undefined,
        materialDigest: computeCredentialMaterialDigest(prepared),
        idempotencyKey: input.idempotencyKey,
        updateSummary: input.updateSummary,
    });
    if (!result)
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Inbox refresh changed during publication; retry with current state.',
        });
    return result;
};

/** Claim/finalize share this path. A racing publish forces a re-read and a fresh signature. */
export const finalizeInboxRefresh = async (params: {
    inboxId: string;
    holderDid: string;
    holderProfile?: ProfileType | null;
    domain: string;
    accepted?: boolean;
}): Promise<{ credential: VC; uri: string }> => {
    const { inboxId, holderDid, holderProfile, domain, accepted = true } = params;
    if (!getCredentialRefreshRuntimeEnvironment().CREDENTIAL_REFRESH_ENABLED)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential refresh is not available' });
    for (let attempt = 0; attempt < 3; attempt++) {
        const snapshot = await getInboxRefreshSnapshot(inboxId);
        const inbox = snapshot?.inbox;
        if (
            !inbox?.refreshId ||
            inbox.currentStatus !== 'PENDING' ||
            Date.parse(inbox.expiresAt) <= Date.now() ||
            (inbox.guardianStatus && inbox.guardianStatus !== 'GUARDIAN_APPROVED')
        )
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Inbox credential is no longer eligible for claim',
            });
        const aggregate = snapshot?.aggregate;
        if (!aggregate || aggregate.state !== 'pending_holder')
            throw new TRPCError({ code: 'CONFLICT', message: 'Inbox credential is already bound' });
        const issuer = await getProfileByDid(inbox.issuerDid);
        if (!issuer || (holderProfile && (await isRelationshipBlocked(issuer, holderProfile))))
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
        const authority =
            inbox.signingAuthority?.endpoint && inbox.signingAuthority?.name
                ? await getSigningAuthorityForUserByName(
                      issuer,
                      inbox.signingAuthority.endpoint,
                      inbox.signingAuthority.name
                  )
                : null;
        if (!authority)
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Signing authority not found' });
        const template = UnsignedVCValidator.parse(
            JSON.parse(await decryptInboxCredential(inbox.credential))
        );
        if (Array.isArray(template.credentialSubject))
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Inbox refresh requires one subject',
            });
        const unsigned = injectManagedRefreshService(
            {
                ...template,
                issuer: aggregate.issuerDid,
                credentialSubject: { ...template.credentialSubject, id: holderDid },
            },
            serviceFor(aggregate.refreshId, domain)
        );
        const credential = VCValidator.parse(
            (
                await issueCredentialWithSigningAuthority(
                    { type: 'profile', profile: issuer },
                    unsigned,
                    authority,
                    domain,
                    false,
                    undefined,
                    false
                )
            ).credential
        );
        if (
            credential.id !== aggregate.credentialId ||
            getCredentialIssuerId(credential) !== aggregate.issuerDid ||
            computeCredentialSubjectDigest(credential.credentialSubject) !==
                computeCredentialSubjectDigest(unsigned.credentialSubject) ||
            computeCredentialStatusDigest(credential.credentialStatus) !==
                aggregate.credentialStatusDigest ||
            canonicalizeCredentialJson(credential.refreshService) !==
                canonicalizeCredentialJson(unsigned.refreshService) ||
            computeCredentialMaterialDigest(credential) !==
                computeCredentialMaterialDigest(unsigned)
        )
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Signing authority changed the prepared inbox credential',
            });
        await verifyManagedRefreshProof(
            (await getLearnCard()).invoke,
            credential,
            aggregate.issuerDid
        );
        const managers = holderProfile
            ? await getProfilesThatManageAProfile(holderProfile.profileId)
            : [];
        const encrypted = JSON.stringify(
            await createDagJweForRecipients(credential, [
                ...new Set([holderProfile?.did ?? holderDid, ...managers.map(p => p.did)]),
            ])
        );
        const boost = inbox.boostUri ? await getBoostByUri(inbox.boostUri) : null;
        if (inbox.boostUri && !boost)
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Boost not found' });
        const id = randomUUID();
        const now = new Date().toISOString();
        const materialDigest = computeCredentialMaterialDigest(credential);
        const etag = computeRefreshEtag(encrypted);
        const effectiveTime = getCredentialEffectiveTime(credential);
        const bound = await bindPendingInboxRefresh({
            inboxId,
            refreshId: aggregate.refreshId,
            expectedVersion: aggregate.currentVersion,
            issuerProfileId: issuer.profileId,
            holderDid,
            holderProfileId: holderProfile?.profileId,
            boostId: boost?.id,
            accepted,
            deliveryCredential: encrypted,
            deliveryExpiresAt: new Date(
                Date.now() + INBOX_DELIVERY_RETENTION_DAYS * 86400000
            ).toISOString(),
            root: {
                id,
                credential: encrypted,
                statusEntries: JSON.stringify(getBitstringStatusListEntries(credential)),
                refreshId: aggregate.refreshId,
                version: aggregate.currentVersion,
                refreshVersionKey: `${aggregate.refreshId}:${aggregate.currentVersion}`,
                publishedAt: aggregate.lastPublishedAt ?? now,
                signingMode: 'signing-authority',
                ...(effectiveTime === undefined
                    ? {}
                    : { effectiveAt: new Date(effectiveTime).toISOString() }),
                ...(aggregate.updateSummary ? { updateSummary: aggregate.updateSummary } : {}),
                etag,
            },
            aggregate: {
                etag,
                initialNotificationSuppressed:
                    accepted || issuer.profileId === holderProfile?.profileId,
                materialDigest,
                rootMaterialDigest: materialDigest,
                credentialSubjectDigest: computeCredentialSubjectDigest(
                    credential.credentialSubject
                ),
                ...(boost ? { boostId: boost.id } : {}),
            },
        });
        if (bound) return { credential, uri: getManagedCredentialUri(id, domain) };
    }
    throw new TRPCError({
        code: 'CONFLICT',
        message: 'Inbox refresh changed during claim; retry.',
    });
};

/** Resume the initial notification after binding committed but delivery failed. No re-signing. */
export const resumeInboxRefreshDelivery = async (
    refreshId: string,
    domain: string
): Promise<void> => {
    const aggregate = await getCredentialRefresh(refreshId);
    if (!aggregate?.holderProfileId || aggregate.initialNotificationSuppressed) return;
    const root = await getInitialRefreshRoot(refreshId);
    if (!root) return;
    const [issuerProfile, holderProfile] = await Promise.all([
        getProfileByProfileId(aggregate.issuerProfileId),
        getProfileByProfileId(aggregate.holderProfileId),
    ]);
    if (!issuerProfile || !holderProfile) return;
    await sendInitialCredentialNotificationOnce({
        refreshId,
        uri: getManagedCredentialUri(root.rootId, domain),
        issuerProfile,
        holderProfile,
        initialNotificationSuppressed: false,
    });
};
