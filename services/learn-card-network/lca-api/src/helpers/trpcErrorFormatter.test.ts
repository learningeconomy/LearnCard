import { describe, expect, it } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';
import { formatTrpcError } from './trpcErrorFormatter';

const t = initTRPC.create({ errorFormatter: formatTrpcError });
const router = t.router({
    refuse: t.procedure.query(() => {
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Choose a new PIN to continue.',
            cause: { reason: 'pin_change_required' },
        });
    }),
    plain: t.procedure.query(() => {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nope.' });
    }),
    unsafe: t.procedure.query(() => {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Nope.',
            cause: { reason: 'Contains user@example.com', email: 'user@example.com' },
        });
    }),
});

const shapeOf = async (path: 'refuse' | 'plain' | 'unsafe') => {
    const error = await router
        .createCaller({})
        [path]()
        .catch((rejection: unknown) => rejection as TRPCError);
    return t._config.errorFormatter({
        error: error as TRPCError,
        type: 'query',
        path,
        input: undefined,
        ctx: {},
        shape: {
            message: (error as TRPCError).message,
            code: -32603,
            data: { code: (error as TRPCError).code, httpStatus: 400, path },
        },
    });
};

describe('formatTrpcError', () => {
    it('copies a stable cause.reason to data.reason', async () => {
        expect((await shapeOf('refuse')).data).toMatchObject({
            reason: 'pin_change_required',
        });
    });

    it('adds nothing without a reason, and never forwards other cause fields', async () => {
        expect((await shapeOf('plain')).data).not.toHaveProperty('reason');
        const unsafe = await shapeOf('unsafe');
        expect(unsafe.data).not.toHaveProperty('reason');
        expect(JSON.stringify(unsafe)).not.toContain('example.com');
    });
});
