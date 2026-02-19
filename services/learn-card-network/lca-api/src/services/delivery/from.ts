/**
 * From-address helpers
 *
 * Builds formatted "From" addresses for outbound emails.
 * Provider-agnostic — just constructs the string.
 */

const BRAND_NAME = process.env.POSTMARK_BRAND_NAME ?? '';
const FROM_DOMAIN = process.env.POSTMARK_FROM_EMAIL ?? '';

/**
 * Build a formatted "From" address, e.g. `"LearnCard <login@learncard.com>"`.
 *
 * @param mailbox  - The mailbox prefix (default `'login'`)
 * @param brand    - Display name (default from env `POSTMARK_BRAND_NAME`)
 * @param domain   - Email domain (default from env `POSTMARK_FROM_EMAIL`)
 */
export const getFrom = ({
    mailbox = 'login',
    brand = BRAND_NAME,
    domain = FROM_DOMAIN,
}: {
    mailbox?: string;
    brand?: string;
    domain?: string;
} = {}): string => {
    if (!domain) return `${brand || 'App'} <${mailbox}@localhost>`;

    return `${brand} <${mailbox}@${domain}>`;
};
