import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRPCError } from '@trpc/server';

const sentry = vi.hoisted(() => ({
    captureException: vi.fn(),
    setHttpStatus: vi.fn(),
}));

vi.mock('@sentry/serverless', () => ({
    captureException: sentry.captureException,
    getActiveTransaction: () => ({ setHttpStatus: sentry.setHttpStatus }),
}));
vi.mock('@environment', () => ({ environment: { SENTRY_ENV: 'test' } }));

import { handleTrpcError, sentryBeforeSend, shouldReportError } from './sentry.helpers';

const event: Parameters<typeof sentryBeforeSend>[0] = { event_id: 'event', type: undefined };

describe('sentry helpers', () => {
    beforeEach(() => {
        sentry.captureException.mockClear();
        sentry.setHttpStatus.mockClear();
    });

    it('does not capture a repeated contract consent conflict', () => {
        const error = new TRPCError({
            code: 'CONFLICT',
            message: "You've already consented to this contract!",
        });

        handleTrpcError({ error, ctx: {}, path: 'contracts.consentToContract' });

        expect(sentry.captureException).not.toHaveBeenCalled();
        expect(sentry.setHttpStatus).toHaveBeenCalledWith(409);
        expect(sentryBeforeSend(event, { originalException: error })).toBeNull();
    });

    it.each(['BAD_REQUEST', 'NOT_FOUND', 'FORBIDDEN', 'CONFLICT'])(
        'treats %s as an expected client error',
        code => {
            expect(shouldReportError(code)).toBe(false);
        }
    );

    it('still captures unexpected server errors', () => {
        const error = new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'boom' });

        handleTrpcError({ error, ctx: {}, path: 'contracts.consentToContract' });

        expect(sentry.captureException).toHaveBeenCalledWith(
            error,
            expect.objectContaining({ level: 'error' })
        );
        expect(sentryBeforeSend(event, { originalException: error })).toBe(event);
    });
});
