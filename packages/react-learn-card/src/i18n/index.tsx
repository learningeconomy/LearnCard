/**
 * Lightweight i18n adapter for `@learncard/react`.
 *
 * This is a PUBLISHED SDK consumed by external third parties who have no
 * Paraglide, no app providers, and no catalog. So the rule is: render English
 * with zero configuration, and only *optionally* accept translations.
 *
 * Components call `useT()`. With no provider mounted, `useT()` returns the
 * co-located English default (zero-config English for every consumer). A
 * consumer that wants localization mounts `<I18nProvider resolve={fn} locale={l}>`
 * where `fn` maps a key to a translated string using whatever i18n they use
 * (Paraglide, i18next, a static map — the SDK doesn't care).
 *
 * Kept intentionally dependency-free and self-contained (a ~40-line copy also
 * lives in learn-card-base) so the SDK pulls in no i18n runtime.
 */
import React, { createContext, useCallback, useContext, useMemo } from 'react';

export type I18nResolver = (key: string, params?: Record<string, unknown>) => string | undefined;

type I18nContextValue = { resolve: I18nResolver; locale: string };

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * English defaults co-located with the SDK. One entry per extracted string.
 * Keys are unprefixed; a host app namespaces them (e.g. `sdk.`) in its catalog.
 */
export const EN_DEFAULTS: Record<string, string> = {
    'verification.selfIssued': 'Self Issued',
    'verification.trustedIssuer': 'Trusted Issuer',
    'verification.unknownIssuer': 'Unknown Issuer',
    'verification.appIssuer': 'Trusted App',
    'verification.untrustedIssuer': 'Untrusted Issuer',
    'credential.by': 'By',
    'verification.title': 'Credential Verifications',
    'verification.infoText':
        'Credential verifications check the cryptographic proof of digital credentials to ensure their authenticity and accuracy.',
    'verification.status.success': 'Success',
    'verification.status.error': 'Error',
    'verification.status.failed': 'Failed',
    'verification.check.proof': 'Proof',
    'verification.check.status': 'Status',
    'verification.check.expiration': 'Expiration',
    'verification.message.valid': 'Valid',
    'verification.message.invalid': 'Invalid',
    'verification.message.notRevoked': 'Not Revoked',
    'verification.message.revoked': 'Revoked',
    'verification.message.suspended': 'Suspended',
    'verification.message.doesNotExpire': 'Does Not Expire',
    'verification.message.expired': 'Expired',
    'verification.message.active': 'Active',
    'verification.message.couldNotVerify': 'Boost Credential could not be verified.',
    'credential.lifecycle.revoked': 'Revoked',
    'credential.lifecycle.suspended': 'Suspended',
};

/** Minimal `{var}` interpolation — no dependency. */
const interpolate = (str: string, params?: Record<string, unknown>): string =>
    params
        ? str.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : `{${k}}`))
        : str;

export const I18nProvider: React.FC<{
    resolve: I18nResolver;
    locale: string;
    children: React.ReactNode;
}> = ({ resolve, locale, children }) => {
    const value = useMemo<I18nContextValue>(() => ({ resolve, locale }), [resolve, locale]);
    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

/**
 * Returns a translate function. Resolution order:
 *   1. host resolver (consumer catalog) if a provider is mounted and has the key
 *   2. co-located English default (interpolated)
 *   3. the key itself (last-resort)
 */
export const useT = (): ((key: string, params?: Record<string, unknown>) => string) => {
    const ctx = useContext(I18nContext);
    return useCallback(
        (key: string, params?: Record<string, unknown>) => {
            const fromHost = ctx?.resolve(key, params);
            if (fromHost != null) return fromHost;
            const def = EN_DEFAULTS[key];
            return def != null ? interpolate(def, params) : key;
        },
        [ctx]
    );
};
