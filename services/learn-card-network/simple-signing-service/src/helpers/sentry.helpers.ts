import * as Sentry from '@sentry/serverless';
import { TRPC_ERROR_CODE_HTTP_STATUS } from 'trpc-to-openapi';
import type { TRPCError } from '@trpc/server';

/**
 * Error codes that are expected/non-critical and should not be sent to Sentry.
 * These typically represent user errors or expected authentication failures.
 */
const IGNORED_ERROR_CODES = ['BAD_REQUEST', 'NOT_FOUND', 'FORBIDDEN'];

/**
 * Determines if an error should be reported to Sentry based on its code.
 */
export const shouldReportError = (errorCode: string): boolean => {
    return !IGNORED_ERROR_CODES.includes(errorCode);
};

/**
 * Standardized tRPC error handler for Sentry.
 * Only captures unexpected/critical errors to reduce noise.
 */
export const handleTrpcError = ({
    error,
    ctx,
    path,
}: {
    error: TRPCError;
    ctx: unknown;
    path: string;
}): void => {
    error.stack = error.stack?.replace('Mr: ', '');
    error.name = error.message;

    // Check if this is an invalid challenge error (expected, should not report)
    const isInvalidChallenge =
        error.code === 'UNAUTHORIZED' &&
        !(ctx as { user?: { isChallengeValid?: boolean } })?.user?.isChallengeValid;

    // Only capture unexpected/critical errors
    // Filter out expected errors (BAD_REQUEST, NOT_FOUND, FORBIDDEN) and invalid challenge attempts
    if (shouldReportError(error.code) && !isInvalidChallenge) {
        Sentry.captureException(error, {
            extra: { ctx, path },
            level: error.code === 'INTERNAL_SERVER_ERROR' ? 'error' : 'warning',
        });
    }

    Sentry.getActiveTransaction()?.setHttpStatus(TRPC_ERROR_CODE_HTTP_STATUS[error.code]);
};

/**
 * Sentry beforeSend hook to filter out expected/non-critical errors.
 * This provides a second layer of filtering at the Sentry SDK level.
 */
export const sentryBeforeSend: NonNullable<Sentry.AWSLambda.NodeOptions['beforeSend']> = (
    event,
    hint
) => {
    const error = hint.originalException;

    if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;

        if (IGNORED_ERROR_CODES.includes(code)) {
            return null;
        }
    }

    return event;
};

/**
 * Returns the appropriate traces sample rate based on environment.
 * Production: 10% sampling for meaningful data with reduced quota usage.
 * Staging/Dev: 1% sampling to minimize costs while still catching issues.
 */
export const getTracesSampleRate = (): number => {
    const env = process.env.SENTRY_ENV;

    if (env === 'production') {
        return 0.1;
    }

    return 0.01;
};
