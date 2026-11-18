import { TRPCError } from '@trpc/server';

/**
 * Route-boundary error mapping: any unexpected failure in `run` becomes a 500 with a fixed
 * message. tRPC sends `error.message` to the client, and a raw Mongo error's message can name
 * hosts or topology, so the original only travels as `cause` (logs, Sentry). TRPCErrors the
 * handler throws on purpose pass through unchanged (LC-2434).
 */
export const withInternalError = async <T>(message: string, run: () => Promise<T>): Promise<T> => {
    try {
        return await run();
    } catch (cause) {
        if (cause instanceof TRPCError) throw cause;

        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message, cause });
    }
};
