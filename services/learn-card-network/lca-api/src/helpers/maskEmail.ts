/**
 * Mask an email address for safe display.
 *
 * Examples:
 *   jackson@gmail.com → j******@gmail.com
 *   ab@example.org    → a*@example.org
 *   a@example.org     → a@example.org (single char — nothing to mask)
 */
export const maskEmail = (email: string): string => {
    const atIndex = email.indexOf('@');

    if (atIndex <= 0) return '****@****';

    const local = email.slice(0, atIndex);
    const domain = email.slice(atIndex);

    if (local.length <= 1) return `${local}${domain}`;

    return `${local[0]}${'*'.repeat(local.length - 1)}${domain}`;
};
