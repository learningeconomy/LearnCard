/**
 * OpenID4VC / OpenID4VP domain wrapper around the generic
 * {@link useErrorReporter} primitive.
 *
 * This hook translates OID4VC concepts (`surface`, `kind`, `code`,
 * `errorName`, sanitized counterparty) into the generic `tags` +
 * typed `analyticsPayload` shape that `useErrorReporter` consumes.
 * Everything else — Sentry fan-out, analytics provider fan-out, two-
 * rail independence — lives in the generic layer.
 *
 * Keeping this wrapper thin serves two goals:
 *   1. Call sites stay terse: `reportError(err, kind, { counterparty })`
 *      with no knowledge of Sentry or analytics providers.
 *   2. The next feature that wants the same "Tell LearnCard about
 *      this" affordance (credential verify, wallet sync, DID-resolve,
 *      ...) can copy this file in ~20 lines and bind its own
 *      `feature` / event without reaching into the fan-out internals.
 */

import { useCallback } from 'react';

import type { ExchangeErrorKind } from 'learn-card-base';

import { AnalyticsEvents } from '../analytics/events';
import {
    extractErrorCode,
    extractErrorName,
    getWalletVersion,
    useErrorReporter,
} from './useErrorReporter';

// Re-export `sanitizeCounterparty` here for backwards-compat with
// existing call sites that still `import { sanitizeCounterparty }
// from '../../hooks/useExchangeErrorReporting'`. New callers should
// import from `hooks/sanitize` directly.
export { sanitizeCounterparty } from './sanitize';

export interface ExchangeErrorReportContext {
    /**
     * Sanitized identifier for the counterparty — verifier `client_id`
     * (URL host only) or issuer URL (host only). Free of query strings,
     * tokens, and PII. `undefined` when we can't extract anything safe.
     */
    counterparty?: string;

    /**
     * Optional free-text the user typed in the report textarea.
     */
    userNote?: string;
}

/**
 * Build a hook for reporting OID4VC/VP exchange errors. The `surface`
 * argument is bound at hook-creation time so call sites just pass the
 * error, kind, and any per-report context.
 *
 * @example
 * ```tsx
 * const reportError = useExchangeErrorReporting('vp');
 *
 * <ExchangeErrorDisplay
 *     error={phase.error}
 *     onReport={(userNote) =>
 *         reportError(phase.error, friendly.kind, {
 *             counterparty: sanitizeCounterparty(clientId),
 *             userNote,
 *         })
 *     }
 * />
 * ```
 */
export const useExchangeErrorReporting = (surface: 'vci' | 'vp') => {
    const report = useErrorReporter({
        feature: 'openid4vc',
        analyticsEvent: AnalyticsEvents.OPENID_EXCHANGE_ERROR_REPORTED,
    });

    return useCallback(
        async (
            error: unknown,
            kind: ExchangeErrorKind,
            extras: ExchangeErrorReportContext = {}
        ) => {
            const code = extractErrorCode(error);
            const errorName = extractErrorName(error);

            await report(error, {
                // Sentry tags — keep stable + low-cardinality. The
                // generic layer strips undefined values so we can
                // pass optional fields without conditional spreads.
                tags: {
                    surface,
                    kind,
                    code,
                    errorName,
                },
                // Sentry `extra` — non-indexed, OK to include the
                // sanitized counterparty host here for debugging
                // without bloating the tag facet space.
                extra: {
                    counterparty: extras.counterparty,
                },
                userNote: extras.userNote,
                // Fully-typed via `AnalyticsEventPayloads[OPENID_EXCHANGE_ERROR_REPORTED]`.
                analyticsPayload: {
                    surface,
                    kind,
                    code,
                    errorName,
                    counterparty: extras.counterparty,
                    userNote: extras.userNote,
                    walletVersion: getWalletVersion(),
                },
            });
        },
        [surface, report]
    );
};
