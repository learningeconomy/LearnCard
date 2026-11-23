import { describe, expect, it } from 'vitest';
import { TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import { TRPC_ERROR_CODES_BY_KEY } from '@trpc/server/rpc';

import {
    CURSOR_EXPIRED_CODE,
    CURSOR_EXPIRED_MESSAGE,
    CURSOR_EXPIRED_TRPC_CODE,
    INTEGRATION_EVENTS_HTTP_410_SUPPORTED,
    INTEGRATION_EVENT_RETENTION_DAYS,
    INTEGRATION_EVENT_RETENTION_MS,
    WEBHOOK_SECRET_PREVIOUS_TTL_MS,
} from './integration-events';

describe('integration event constants', () => {
    it('records that the installed tRPC cannot return HTTP 410', () => {
        const codes = Object.keys(TRPC_ERROR_CODES_BY_KEY) as TRPCError['code'][];
        const statuses = codes.map(code => getHTTPStatusCodeFromError(new TRPCError({ code })));

        expect(codes).not.toContain('GONE');
        expect(statuses.includes(410)).toBe(INTEGRATION_EVENTS_HTTP_410_SUPPORTED);
        expect(INTEGRATION_EVENTS_HTTP_410_SUPPORTED).toBe(false);
    });

    it('uses CONFLICT (409) with a CURSOR_EXPIRED message as the fallback', () => {
        expect(CURSOR_EXPIRED_TRPC_CODE).toBe('CONFLICT');
        expect(getHTTPStatusCodeFromError(new TRPCError({ code: CURSOR_EXPIRED_TRPC_CODE }))).toBe(
            409
        );
        expect(CURSOR_EXPIRED_CODE).toBe('CURSOR_EXPIRED');
        expect(CURSOR_EXPIRED_MESSAGE.startsWith('CURSOR_EXPIRED: ')).toBe(true);
    });

    it('keeps feed records for 30 days and a rotated secret for 24 hours', () => {
        expect(INTEGRATION_EVENT_RETENTION_DAYS).toBe(30);
        expect(INTEGRATION_EVENT_RETENTION_MS).toBe(30 * 24 * 60 * 60 * 1000);
        expect(WEBHOOK_SECRET_PREVIOUS_TTL_MS).toBe(24 * 60 * 60 * 1000);
    });
});
