import { TRPCError } from '@trpc/server';

/**
 * A deterministic rejection before issuance has any persistent or delivery side effects.
 * Only throw this during preflight; batch callers can safely release their reservation.
 * Error codes alone cannot establish this boundary: a later write can also return a 4xx.
 */
export class InboxIssuancePreflightError extends TRPCError {}
