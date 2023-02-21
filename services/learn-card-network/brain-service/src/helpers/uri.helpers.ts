import { TRPCError } from '@trpc/server';

export const getIdFromUri = (uri: string): string => {
    const parts = uri.split(':');

    if (parts.length !== 4) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid URI',
        });
    }

    const [lc, method, _domain, id] = parts as [string, string, string, string];

    if (lc !== 'lc' || method !== 'network') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot get ID from URI',
        });
    }

    return id;
};
