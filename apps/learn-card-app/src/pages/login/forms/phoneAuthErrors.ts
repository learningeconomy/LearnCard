import * as m from '../../../paraglide/messages.js';

/** Max incorrect codes per sent SMS — mirrors LOGIN_VERIFY_MAX_ATTEMPTS_PER_EMAIL in lca-api. */
export const MAX_PHONE_CODE_ATTEMPTS = 5;

/** Resend countdown length, matching the email login flow. */
export const RESEND_CODE_COOLDOWN_MS = 30000;

export type PhoneAuthErrorKind =
    | 'invalidPhoneNumber'
    | 'invalidCode'
    | 'tooManyAttempts'
    | 'tooManyRequests'
    | 'quotaExceeded'
    | 'network'
    | 'cancelled'
    | 'generic';

const toText = (error: unknown): string => {
    if (typeof error === 'string') return error;
    if (typeof error === 'number') return String(error);
    if (error && typeof error === 'object') {
        const { code, message } = error as { code?: unknown; message?: unknown };
        return [code, message].filter(value => typeof value === 'string').join(' ');
    }
    return '';
};

/**
 * Classifies raw Firebase web codes (`auth/too-many-requests`), web SDK messages
 * (`Firebase: Error (auth/...)`), and native SDK messages into a stable kind.
 */
export const classifyPhoneAuthError = (error: unknown): PhoneAuthErrorKind => {
    const text = toText(error).toLowerCase();

    if (!text) return 'generic';
    if (text.includes('phone verification cancelled')) return 'cancelled';
    if (
        text.includes('too-many-requests') ||
        text.includes('too_many_requests') ||
        text.includes('unusual activity') ||
        text.includes('too many requests')
    ) {
        return 'tooManyRequests';
    }
    if (text.includes('quota-exceeded') || text.includes('quota exceeded')) return 'quotaExceeded';
    if (
        text.includes('expired') ||
        text.includes('invalid-verification-code') ||
        text.includes('missing-verification-code') ||
        text.includes('verification code') ||
        text.includes('invalid code')
    ) {
        return 'invalidCode';
    }
    if (
        text.includes('invalid-phone-number') ||
        text.includes('missing-phone-number') ||
        text.includes('phone number')
    ) {
        return 'invalidPhoneNumber';
    }
    if (text.includes('network-request-failed') || text.includes('network')) return 'network';

    return 'generic';
};

/** Resolve at render so the message follows the active locale. */
export const getPhoneAuthErrorMessage = (kind: PhoneAuthErrorKind): string => {
    switch (kind) {
        case 'invalidPhoneNumber':
            return m['login.phone.error.invalidPhoneNumber']();
        case 'invalidCode':
            return m['login.phone.error.invalidCode']();
        case 'tooManyAttempts':
            return m['login.phone.error.tooManyAttempts']();
        case 'tooManyRequests':
            return m['login.phone.error.tooManyRequests']();
        case 'quotaExceeded':
            return m['login.phone.error.quotaExceeded']();
        case 'network':
            return m['login.phone.error.network']();
        case 'cancelled':
        case 'generic':
        default:
            return m['login.phone.error.generic']();
    }
};
