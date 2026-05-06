/**
 * From-address helpers
 *
 * Builds formatted "From" addresses for outbound emails.
 * Provider-agnostic — just constructs the string.
 *
 * When `branding` is provided (from tenant context), the brand name and
 * domain are pulled from the branding object so emails show the correct
 * tenant identity (e.g. "VetPass <login@vetpass.app>").
 */

import type { TenantBranding } from '@learncard/email-templates';

const BRAND_NAME = process.env.POSTMARK_BRAND_NAME ?? '';
const FROM_DOMAIN = process.env.POSTMARK_FROM_EMAIL ?? '';

/**
 * Build a formatted "From" address, e.g. `"LearnCard <login@learncard.com>"`.
 *
 * @param mailbox  - The mailbox prefix (default `'login'`)
 * @param brand    - Display name (default from env `POSTMARK_BRAND_NAME`)
 * @param domain   - Email domain (default from env `POSTMARK_FROM_EMAIL`)
 * @param branding - Optional tenant branding; overrides `brand` and `domain` when present
 */
export const getFrom = ({
    mailbox = 'login',
    brand = BRAND_NAME,
    domain = FROM_DOMAIN,
    branding,
}: {
    mailbox?: string;
    brand?: string;
    domain?: string;
    branding?: Partial<TenantBranding>;
} = {}): string => {
    const resolvedBrand = branding?.brandName || brand;
    const resolvedDomain = branding?.fromDomain || domain;

    if (!resolvedDomain) return `${resolvedBrand || 'App'} <${mailbox}@localhost>`;

    return `${resolvedBrand} <${mailbox}@${resolvedDomain}>`;
};
