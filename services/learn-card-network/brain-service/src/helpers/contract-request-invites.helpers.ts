import { TRPCError } from '@trpc/server';
import { resolveBranding } from '@learncard/email-templates';
import type { ResolvedTenant, TenantBranding } from '@learncard/email-templates';
import type { SendContractRequest, SendContractRequestResult } from '@learncard/types';

import { createContractRequestInvite } from '@accesslayer/contract-request-invite/create';
import {
    claimContractRequestInviteEmail,
    expireContractRequestInvite,
} from '@accesslayer/contract-request-invite/update';
import {
    getContractOwnerDisplayName,
    getOverdueContractRequestInvites,
    getProfileIdsWithVerifiedEmail,
} from '@accesslayer/contract-request-invite/read';
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
 * email has an account or what that account's consent state is.
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
    });
    if (!result)
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'The contract changed. Review it and try again.',
        });

    // The invite's integration request_sent event goes out before an attach can add its own
    // request events, which keeps the feed in order. The worker retries what this misses.
    if (result.created) await tryFanOutContractIntegrationEvents(contract.id);

    // An identical pending retry returns the same request ID and sends nothing.
    if (result.created) {
        try {
            const profileIds = await getProfileIdsWithVerifiedEmail(email);
            if (profileIds.length === 0) {
                if (await claimContractRequestInviteEmail(contract.id, result.invite.id))
                    await sendContractRequestInviteEmail({
                        email,
                        referrerName: profile.displayName,
                        contractOwnerName: await getContractOwnerDisplayName(contract.id),
                        branding: tenant?.emailBranding,
                    });
            } else {
                for (const profileId of profileIds)
                    await attachContractRequestInvitesForProfile({ profileId }, domain);
            }
        } catch {
            console.warn('contract_request_invite: delivery_failed');
        }
    }
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
 * Daily maintenance: marks overdue pending invites expired. Attached invites never expire.
 * Bounded per run; what is left is handled by the next run. Returns the number expired.
 */
export const expireContractRequestInvites = async (): Promise<number> => {
    let expired = 0;
    for (let batch = 0; batch < INVITE_EXPIRY_MAX_BATCHES; batch += 1) {
        const overdue = await getOverdueContractRequestInvites(INVITE_EXPIRY_BATCH_SIZE);
        let expiredInBatch = 0;
        for (const { contractId, inviteId } of overdue) {
            try {
                const invite = await expireContractRequestInvite(contractId, inviteId);
                if (invite) expiredInBatch += 1;
            } catch {
                console.warn('contract_request_invite: expire_failed');
            }
        }
        expired += expiredInBatch;
        if (overdue.length < INVITE_EXPIRY_BATCH_SIZE || expiredInBatch === 0) break;
    }
    return expired;
};
