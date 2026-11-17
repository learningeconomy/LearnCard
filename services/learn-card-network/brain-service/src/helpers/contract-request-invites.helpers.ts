import { resolveBranding } from '@learncard/email-templates';
import type { TenantBranding } from '@learncard/email-templates';

import { getDeliveryService } from '@services/delivery/delivery.factory';

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
