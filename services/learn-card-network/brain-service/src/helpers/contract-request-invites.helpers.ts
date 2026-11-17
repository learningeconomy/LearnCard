import { resolveBranding } from '@learncard/email-templates';
import type { TenantBranding } from '@learncard/email-templates';

import { getDeliveryService } from '@services/delivery/delivery.factory';
import { getPendingContractRequestInvitesForProfile } from '@accesslayer/contract-request-invite/read';
import type { ProfileType } from 'types/profile';
import { createRequestForProfile } from './contract-requests.helpers';

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
