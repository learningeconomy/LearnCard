import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { t, openRoute } from '@routes';
import cache from '@cache';
import { issueLoginTicket } from '@cache/login-tickets';
import { getOrCreateAuthSubject } from '../models/AuthSubject';
import { getSocialProviderConfig, verifySocialIdToken } from '@helpers/social-token.helpers';

const resultSchema = z.object({
    success: z.boolean(),
    ticket: z.string().optional(),
    error: z.string().optional(),
});

const enforceRateLimit = async (clientIp: string, scope: string): Promise<void> => {
    const redis = cache.redis ?? cache.node;
    const key = `oidc:rate:${scope}:${clientIp}`;
    const attempts = await redis.incr(key);
    if (attempts === 1) await redis.expire(key, 600);
    if (attempts > 10) {
        throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many login attempts. Please try again later.',
        });
    }
};

export const authRouter = t.router({
    requestLoginTicket: openRoute
        .meta({ openapi: { method: 'POST', path: '/auth/login-ticket', tags: ['Auth'] } })
        .input(z.object({ email: z.string().trim().email(), code: z.string().length(6) }))
        .output(resultSchema)
        .mutation(async ({ input, ctx }) => {
            await enforceRateLimit(ctx.clientIp ?? 'unknown', 'email-login-ticket');
            try {
                // Match the existing email-code issuance key exactly, before identity normalization.
                const key = `login-code:${input.email}:${input.code}`;
                if (!(await cache.get(key)))
                    return { success: false, error: 'Invalid or expired code.' };
                await cache.delete([key]);
                const email = input.email.trim().toLowerCase();
                const identityKey = `email:${email}`;
                const record = await getOrCreateAuthSubject(identityKey, {
                    email,
                    emailVerified: true,
                });
                const ticket = await issueLoginTicket({
                    subject: record.subject,
                    email,
                    emailVerified: true,
                    identityKey,
                });
                return { success: true, ticket };
            } catch {
                return { success: false, error: 'Invalid or expired code.' };
            }
        }),
    requestSocialLoginTicket: openRoute
        .meta({ openapi: { method: 'POST', path: '/auth/social/native', tags: ['Auth'] } })
        .input(z.object({ provider: z.enum(['google', 'apple']), idToken: z.string() }))
        .output(resultSchema)
        .mutation(async ({ input, ctx }) => {
            await enforceRateLimit(ctx.clientIp ?? 'unknown', 'social-login-ticket');
            if (!getSocialProviderConfig(input.provider)) {
                return {
                    success: false,
                    error: `Sign-in with ${input.provider} is not configured.`,
                };
            }
            try {
                const claims = await verifySocialIdToken(input.provider, input.idToken);
                const identityKey = `${input.provider}:${claims.sub}`;
                const record = await getOrCreateAuthSubject(identityKey, {
                    email: claims.email,
                    emailVerified: true,
                    displayName: claims.name,
                    pictureUrl: claims.picture,
                });
                const ticket = await issueLoginTicket({
                    subject: record.subject,
                    identityKey,
                    email: claims.email,
                    emailVerified: true,
                    name: claims.name,
                    picture: claims.picture,
                });
                return { success: true, ticket };
            } catch {
                return { success: false, error: 'Invalid or expired sign-in. Please try again.' };
            }
        }),
});
