import type { TRPCDefaultErrorShape } from '@trpc/server';

/** A stable refusal code: lowercase words joined by underscores (e.g. `pin_change_required`). */
const STABLE_REASON = /^[a-z]+(?:_[a-z]+)*$/;

/**
 * tRPC never sends `cause` to clients. Refusals that carry a stable `cause.reason` code (the
 * ClassLink continuity reasons, `account_moved`, `busy`, `placeholder_escrow`,
 * `pin_change_required`) copy it to `data.reason`, so clients branch on the code rather than
 * the message. Anything else in `cause` stays on the server.
 */
export const formatTrpcError = <Shape extends TRPCDefaultErrorShape>({
    shape,
    error,
}: {
    shape: Shape;
    error: { cause?: unknown };
}): Shape | (Shape & { data: Shape['data'] & { reason: string } }) => {
    const reason =
        error.cause && typeof error.cause === 'object'
            ? (error.cause as { reason?: unknown }).reason
            : undefined;
    if (typeof reason !== 'string' || reason.length > 64 || !STABLE_REASON.test(reason))
        return shape;
    return { ...shape, data: { ...shape.data, reason } };
};
