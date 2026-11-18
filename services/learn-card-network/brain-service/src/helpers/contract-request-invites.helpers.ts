import { TRPCError } from '@trpc/server';
import { isInt } from 'neo4j-driver';
import { resolveBranding } from '@learncard/email-templates';
import type { ResolvedTenant, TenantBranding } from '@learncard/email-templates';
import type { SendContractRequest, SendContractRequestResult } from '@learncard/types';

import { createContractRequestInvite } from '@accesslayer/contract-request-invite/create';
import {
    claimContractRequestInviteEmail,
    expireContractRequestInvite,
    finishContractRequestInviteDelivery,
    releaseContractRequestInviteEmail,
    retryContractRequestInviteDelivery,
} from '@accesslayer/contract-request-invite/update';
import {
    getContractOwnerDisplayName,
    getDueContractRequestInviteDeliveries,
    getOverdueContractRequestInvites,
    getProfileIdsWithVerifiedEmail,
} from '@accesslayer/contract-request-invite/read';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { defaultDomain } from './integration-events.helpers';
import type { ContractRequestInviteType } from '@accesslayer/contract-request-invite/read';
import { normalizeInviteEmail } from './invite-email.helpers';

import { getDeliveryService } from '@services/delivery/delivery.factory';
import { getPendingContractRequestInvitesForProfile } from '@accesslayer/contract-request-invite/read';
import type { ProfileType } from 'types/profile';
import { authorizeContractRequestSend, createRequestForProfile } from './contract-requests.helpers';
import { tryFanOutContractIntegrationEvents } from './contract-events.helpers';

/** The most invites one call converts. Bounds the work done inside a request. */
export const CONTRACT_REQUEST_INVITE_ATTACH_LIMIT = 20;

/**
 * Converts pending invites addressed to the profile's verified emails into requests.
 * Call it after an email becomes verified on a profile. It never throws: a failure
 * leaves the invite pending, and a later call or the invite's expiry handles it.
 * Returns the number of invites that became requests.
 */
export const attachContractRequestInvitesForProfile = async (
    profile: Pick<ProfileType, 'profileId'>,
    domain: string,
    limit: number = CONTRACT_REQUEST_INVITE_ATTACH_LIMIT
): Promise<number> => {
    let attached = 0;
    try {
        const pending = await getPendingContractRequestInvitesForProfile(profile.profileId, limit);
        for (const { contractId, invite } of pending) {
            try {
                const request = await createRequestForProfile({
                    contractId,
                    targetProfileId: profile.profileId,
                    senderProfileId: invite.requestedBy,
                    requestId: invite.id,
                    externalReferenceId: invite.externalReferenceId,
                    message: invite.message,
                    domain,
                    inviteId: invite.id,
                });
                if (request) attached += 1;
            } catch {
                console.warn('contract_request_invite: attach_failed');
            }
        }
    } catch {
        console.warn('contract_request_invite: attach_failed');
    }
    return attached;
};

/**
 * Sends the `contract-request-invite` email. Returns false when delivery fails.
 * Never logs the address or the provider error, which can contain the address.
 */
export const sendContractRequestInviteEmail = async ({
    email,
    referrerName,
    contractOwnerName,
    branding,
}: {
    email: string;
    referrerName?: string;
    contractOwnerName?: string;
    /** Branding of the tenant that sent the request (`ctx.tenant?.emailBranding`). */
    branding?: Partial<TenantBranding>;
}): Promise<boolean> => {
    const contactMethod = { type: 'email' as const, value: email };
    try {
        await getDeliveryService(contactMethod).send({
            contactMethod,
            templateId: 'contract-request-invite',
            templateModel: {
                inviteUrl: resolveBranding(branding).appUrl.replace(/\/+$/, ''),
                referrer: { name: referrerName },
                contractOwner: { name: contractOwnerName },
            },
            branding,
        });
        return true;
    } catch {
        console.warn('contract_request_invite: email_failed');
        return false;
    }
};

/**
 * Sends a contract request to an email address. It always creates (or reuses) an invite and
 * always answers `{ requestId, status: 'pending' }`, so the answer does not reveal whether the
 * email has an account or what that account's consent state is. Delivery (attach or email) is
 * left to `deliverContractRequestInvites`.
 */
export const sendContractRequestToEmail = async (
    input: SendContractRequest,
    profile: ProfileType,
    domain: string,
    tenant?: Pick<ResolvedTenant, 'id' | 'emailBranding'>
): Promise<SendContractRequestResult> => {
    const contract = await authorizeContractRequestSend(input.contractUri, profile);
    const email = normalizeInviteEmail(input.targetEmail ?? '');
    if (!email) throw new TRPCError({ code: 'BAD_REQUEST', message: 'targetEmail is required' });

    const result = await createContractRequestInvite({
        contractId: contract.id,
        email,
        senderProfileId: profile.profileId,
        externalReferenceId: input.externalReferenceId,
        message: input.message,
        tenantId: tenant?.id,
        domain,
        ...(tenant?.emailBranding ? { emailBranding: tenant.emailBranding } : {}),
    });
    if (!result)
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'The contract changed. Review it and try again.',
        });

    // Integrations hear about the send now. Looking the email up, attaching to a profile and
    // sending the invite email all happen in the delivery worker, so this answer takes the same
    // time whether or not the email has an account.
    if (result.created) await tryFanOutContractIntegrationEvents(contract.id);

    return { requestId: result.invite.id, status: 'pending' };
};

/**
 * An invite that has not become a request, in the shape of a request addressed to an email.
 * An overdue pending invite reads as expired even before the daily job marks it.
 */
export const contractRequestFromInvite = (
    invite: ContractRequestInviteType
): {
    requestId: string;
    status: 'pending' | 'cancelled' | 'expired';
    externalReferenceId?: string;
    requestedAt: string;
    expiresAt: string;
    target: { email: string };
} => ({
    requestId: invite.id,
    status:
        invite.status === 'cancelled' || invite.status === 'expired'
            ? invite.status
            : invite.expiresAt <= new Date().toISOString()
              ? 'expired'
              : 'pending',
    ...(invite.externalReferenceId ? { externalReferenceId: invite.externalReferenceId } : {}),
    requestedAt: invite.requestedAt,
    expiresAt: invite.expiresAt,
    target: { email: invite.email },
});

const INVITE_EXPIRY_BATCH_SIZE = 200;
const INVITE_EXPIRY_MAX_BATCHES = 10;

/**
 * Daily maintenance: expires overdue invites, and attached email-addressed requests that are
 * still pending past the same date. Each records `request_expired` for integrations.
 * Bounded per run; what is left is handled by the next run. Returns the number expired.
 */
export const expireContractRequestInvites = async (): Promise<number> => {
    let expired = 0;
    for (let batch = 0; batch < INVITE_EXPIRY_MAX_BATCHES; batch += 1) {
        const overdue = await getOverdueContractRequestInvites(INVITE_EXPIRY_BATCH_SIZE);
        let expiredInBatch = 0;
        let handledInBatch = 0;
        for (const { contractId, inviteId } of overdue) {
            try {
                const invite = await expireContractRequestInvite(contractId, inviteId);
                handledInBatch += 1;
                if (invite) expiredInBatch += 1;
            } catch {
                console.warn('contract_request_invite: expire_failed');
            }
        }
        expired += expiredInBatch;
        if (overdue.length < INVITE_EXPIRY_BATCH_SIZE || handledInBatch === 0) break;
    }
    return expired;
};

const INVITE_DELIVERY_MAX_ATTEMPTS = 8;
/** Neo4j returns stored counters as Integer objects. */
const toNumber = (value: unknown): number =>
    isInt(value) ? value.toNumber() : typeof value === 'number' ? value : 0;
/** Backoff after a failed invite email: 1, 2, 4 ... minutes, capped at one hour. */
const inviteDeliveryDelayMs = (attempts: number): number =>
    Math.min(60 * 60_000, 60_000 * 2 ** Math.max(0, attempts));

/**
 * Worker pass for new email-addressed sends. For each invite that is due it attaches the invite
 * to the profiles that have the email verified, or, when there are none, sends the invite email
 * (at most 3 per contract and address in 24 hours). A failed email is retried with backoff and
 * given up after INVITE_DELIVERY_MAX_ATTEMPTS. Never throws for one invite. Returns how many
 * invites it finished.
 */
export const deliverContractRequestInvites = async ({
    limit = 50,
    budgetMs = 10_000,
}: { limit?: number; budgetMs?: number } = {}): Promise<number> => {
    const startedAt = Date.now();
    let finished = 0;
    for (const { contractId, invite } of await getDueContractRequestInviteDeliveries(limit)) {
        if (Date.now() - startedAt > budgetMs) break;
        try {
            if (invite.status !== 'pending' || invite.attachedProfileId) {
                await finishContractRequestInviteDelivery(invite.id);
                finished += 1;
                continue;
            }
            const domain = invite.domain ?? defaultDomain();
            const profileIds = await getProfileIdsWithVerifiedEmail(invite.email);
            if (profileIds.length > 0) {
                for (const profileId of profileIds)
                    await attachContractRequestInvitesForProfile({ profileId }, domain);
                await finishContractRequestInviteDelivery(invite.id);
                finished += 1;
                continue;
            }
            if (!(await claimContractRequestInviteEmail(contractId, invite.id))) {
                // Already emailed, or the address reached its limit: nothing more to send.
                await finishContractRequestInviteDelivery(invite.id);
                finished += 1;
                continue;
            }
            const sent = await sendContractRequestInviteEmail({
                email: invite.email,
                referrerName: (await getProfileByProfileId(invite.requestedBy))?.displayName,
                contractOwnerName: await getContractOwnerDisplayName(contractId),
                ...(invite.emailBranding ? { branding: JSON.parse(invite.emailBranding) } : {}),
            });
            if (sent) {
                await finishContractRequestInviteDelivery(invite.id);
                finished += 1;
                continue;
            }
            await releaseContractRequestInviteEmail(contractId, invite.id);
            const attempts = toNumber(invite.deliveryAttempts) + 1;
            if (attempts >= INVITE_DELIVERY_MAX_ATTEMPTS) {
                console.warn('contract_request_invite: delivery_abandoned');
                await finishContractRequestInviteDelivery(invite.id);
                finished += 1;
            } else {
                await retryContractRequestInviteDelivery(
                    invite.id,
                    new Date(Date.now() + inviteDeliveryDelayMs(attempts)).toISOString()
                );
            }
        } catch {
            console.warn('contract_request_invite: delivery_failed');
        }
    }
    return finished;
};
