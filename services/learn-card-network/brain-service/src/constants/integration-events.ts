/**
 * Result of the HTTP 410 check for the integration event feed.
 *
 * Checked against @trpc/server 11.8.0 and trpc-to-openapi 3.3.0: tRPC has no `GONE` error code
 * and no error code maps to HTTP 410, so a stale feed cursor is rejected with the fallback below.
 * `src/constants/integration-events.test.ts` fails if a tRPC upgrade changes this.
 */
export const INTEGRATION_EVENTS_HTTP_410_SUPPORTED = false;

/** Machine-readable code a client looks for to know it must take a new snapshot. */
export const CURSOR_EXPIRED_CODE = 'CURSOR_EXPIRED';

/** tRPC error code used for an expired cursor. Maps to HTTP 409. */
export const CURSOR_EXPIRED_TRPC_CODE = 'CONFLICT' as const;

/** Error message for an expired cursor. Always starts with `CURSOR_EXPIRED: `. */
export const CURSOR_EXPIRED_MESSAGE =
    'CURSOR_EXPIRED: this cursor is older than the 30-day retention window. Take a new connections snapshot, then continue from latestCursor.';

/** How long a feed record is kept. */
export const INTEGRATION_EVENT_RETENTION_DAYS = 30;
export const INTEGRATION_EVENT_RETENTION_MS =
    INTEGRATION_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/** How long the previous webhook secret stays valid after a rotation. */
export const WEBHOOK_SECRET_PREVIOUS_TTL_MS = 24 * 60 * 60 * 1000;
