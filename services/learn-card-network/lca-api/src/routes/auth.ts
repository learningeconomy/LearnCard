import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { t, openRoute } from '@routes';
import cache from '@cache';
import { getDel } from '@cache/getDel';
import { issueLoginTicket } from '@cache/login-tickets';
import { getOrCreateAuthSubject } from '../models/AuthSubject';
import { getSocialProviderConfig, verifySocialIdToken } from '@helpers/social-token.helpers';

const resultSchema = z.object({
    success: z.boolean(),
    ticket: z.string().optional(),
    error: z.string().optional(),
});

const RATE_PREFIX = 'oidc:rate:';
const ATTEMPT_TTL_SECONDS = 10 * 60;
// Only failed attempts count. The per-IP ceiling is a backstop for shared NATs
// (schools, offices); the per-email limit is what actually blocks code guessing.
const MAX_FAILED_ATTEMPTS_PER_IP = 50;
const MAX_FAILED_ATTEMPTS_PER_EMAIL = 5;

const INVALID_CODE_ERROR = 'Invalid or expired code.';
const INVALID_SOCIAL_ERROR = 'Invalid or expired sign-in. Please try again.';
const SERVER_ERROR = 'Something went wrong. Please request a new code.';
const RATE_LIMIT_ERROR = 'Too many login attempts. Please try again later.';

const rateKey = (scope: string, id: string): string => `${RATE_PREFIX}${scope}:${id}`;

const assertUnderLimit = async (key: string, max: number): Promise<void> => {
    const attempts = Number(await cache.get(key)) || 0;
    if (attempts >= max) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: RATE_LIMIT_ERROR });
    }
};

const recordFailedAttempt = async (...keys: string[]): Promise<void> => {
    const redis = cache.redis ?? cache.node;
    for (const key of keys) {
        const attempts = await redis.incr(key);
        if (attempts === 1) await redis.expire(key, ATTEMPT_TTL_SECONDS);
    }
};

const isUnauthorized = (error: unknown): boolean =>
    error instanceof TRPCError && error.code === 'UNAUTHORIZED';

export const authRouter = t.router({
    requestLoginTicket: openRoute
        .meta({ openapi: { method: 'POST', path: '/auth/login-ticket', tags: ['Auth'] } })
        .input(z.object({ email: z.string().trim().email(), code: z.string().length(6) }))
        .output(resultSchema)
        .mutation(async ({ input, ctx }) => {
            const email = input.email.trim().toLowerCase();
            const ipKey = rateKey('email-login-ticket', ctx.clientIp ?? 'unknown');
            const emailKey = rateKey('email', email);
            await assertUnderLimit(ipKey, MAX_FAILED_ATTEMPTS_PER_IP);
            await assertUnderLimit(emailKey, MAX_FAILED_ATTEMPTS_PER_EMAIL);

            // Match the existing email-code issuance key exactly, before identity normalization.
            // GETDEL validates and consumes in one atomic step so a code can never be replayed.
            let consumed: string | null;
            try {
                consumed = await getDel(`login-code:${input.email}:${input.code}`);
            } catch (error) {
                console.error('Error consuming login code:', error);
                return { success: false, error: SERVER_ERROR };
            }
            if (!consumed) {
                await recordFailedAttempt(ipKey, emailKey);
                return { success: false, error: INVALID_CODE_ERROR };
            }

            try {
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
            } catch (error) {
                console.error('Error issuing login ticket after consuming code:', error);
                return { success: false, error: SERVER_ERROR };
            }
        }),
    requestSocialLoginTicket: openRoute
        .meta({ openapi: { method: 'POST', path: '/auth/social/native', tags: ['Auth'] } })
        .input(z.object({ provider: z.enum(['google', 'apple']), idToken: z.string() }))
        .output(resultSchema)
        .mutation(async ({ input, ctx }) => {
            const ipKey = rateKey('social-login-ticket', ctx.clientIp ?? 'unknown');
            await assertUnderLimit(ipKey, MAX_FAILED_ATTEMPTS_PER_IP);
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
            } catch (error) {
                if (isUnauthorized(error)) {
                    await recordFailedAttempt(ipKey);
                    return { success: false, error: INVALID_SOCIAL_ERROR };
                }
                console.error('Error issuing social login ticket:', error);
                return { success: false, error: INVALID_SOCIAL_ERROR };
            }
        }),
});
