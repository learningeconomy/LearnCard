/**
 * SMS template rendering — tenant-aware replacement for sms.helpers.ts.
 *
 * Replaces the hardcoded "LearnCard" in SMS text with the tenant's brand name.
 */

import type { TenantBranding } from './branding';
import { resolveBranding } from './branding';

// ---------------------------------------------------------------------------
// SMS template data shapes
// ---------------------------------------------------------------------------

export interface SmsInboxClaimData {
    claimUrl: string;
    recipient?: { name?: string };
    issuer?: { name?: string };
    credential?: { name?: string; type?: string };
}

export interface SmsVerificationData {
    verificationToken: string;
}

export type SmsTemplateId = 'inbox-claim' | 'contact-method-verification';

export interface SmsTemplateDataMap {
    'inbox-claim': SmsInboxClaimData;
    'contact-method-verification': SmsVerificationData;
}

// ---------------------------------------------------------------------------
// renderSms()
// ---------------------------------------------------------------------------

/**
 * Render a branded SMS body for the given template.
 *
 * @returns The SMS body string, or `undefined` if the templateId is unknown.
 */
export function renderSms<T extends SmsTemplateId>(
    templateId: T,
    branding: Partial<TenantBranding> | TenantBranding,
    data: SmsTemplateDataMap[T],
): string | undefined {
    const resolved = resolveBranding(branding);

    switch (templateId) {
        case 'inbox-claim': {
            const d = data as SmsInboxClaimData;
            const greeting = d.recipient?.name ? `Hello, ${d.recipient.name}! ` : '';
            const credType = d.credential?.type ?? 'credential';
            const credName = d.credential?.name ?? 'Unnamed Credential';
            const issuerPart = d.issuer?.name ? ` from ${d.issuer.name}.` : '.';

            return `${greeting}You have a new ${credType}, "${credName}"${issuerPart} Claim it here: ${d.claimUrl}`;
        }

        case 'contact-method-verification': {
            const d = data as SmsVerificationData;

            return `Your ${resolved.brandName} verification code is: ${d.verificationToken}`;
        }

        default:
            return undefined;
    }
}
