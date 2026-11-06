import { createHash, randomInt } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { didAndChallengeRoute } from '@routes';
import cache from '@cache';
import { getDel } from '@cache/getDel';
import { isRateLimited, recordFailure } from '@helpers/rate-limit.helpers';
import { resolveClassLinkContext } from '@helpers/classlinkContext.helpers';
import { isSyntheticEmail } from '@helpers/syntheticEmail.helpers';
import { getDeliveryService, getFrom } from '../services/delivery';
import {
    findAuthSubjectByIdentityKey,
    ensureAuthSubjectIndexes,
    getAuthSubjectsCollection,
    getOrCreateAuthSubjectLinkedTo,
} from '../models/AuthSubject';
import { updateClassLinkIdentity } from '../models/ClassLinkIdentity';

const personalEmail = z.string().trim().toLowerCase().email().max(254);
const conflict = (): never => {
    throw new TRPCError({
        code: 'CONFLICT',
        message: 'This email is already used by another account.',
    });
};

/** Address checks (start or verify) allowed per DID per 10 minutes. */
const PERSONAL_EMAIL_CHECK_LIMIT = 20;
/** Codes sent per DID per 10 minutes. */
const PERSONAL_EMAIL_SEND_LIMIT = 3;
/** Wrong codes allowed per issued code before it is invalidated. */
const PERSONAL_EMAIL_ATTEMPT_LIMIT = 5;

const sha256Hex = (value: string): string => createHash('sha256').update(value).digest('hex');

const tooMany = (message: string): TRPCError =>
    new TRPCError({ code: 'TOO_MANY_REQUESTS', message });

/**
 * Count one use of a per-DID budget and refuse once it is spent. Uses the shared
 * failures-only limiter, recording every call because each call is the costed action.
 */
const consumeBudget = async (
    key: string,
    limit: number,
    windowSeconds: number,
    message: string
): Promise<void> => {
    if (await isRateLimited(key, limit)) throw tooMany(message);
    await recordFailure(key, windowSeconds);
};

/**
 * Validate the address for the caller's ClassLink account. Rate-limited per DID so the
 * flow cannot be used to probe which addresses have LearnCard accounts. Whether the address
 * is already taken is only revealed once the caller has proven they read the code (see
 * `assertEmailAvailable`), so `start` answers the same for every address.
 */
const validateEmail = async (did: string, email: string) => {
    await consumeBudget(
        `classlink:rate:personal-email-check:${sha256Hex(did)}`,
        PERSONAL_EMAIL_CHECK_LIMIT,
        600,
        'Too many attempts. Please try again later.'
    );
    const context = await resolveClassLinkContext(did);
    if (!context.tenant)
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'School settings are unavailable. Please try again later.',
        });
    if (isSyntheticEmail(email))
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Enter an email address you can receive mail at.',
        });
    const domain = email.split('@')[1];
    const schoolDomain = context.identity.email?.split('@')[1]?.toLowerCase();
    if (
        domain === schoolDomain ||
        context.tenant.allowedEmailDomains.some(allowed => allowed.toLowerCase() === domain)
    ) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Use a personal email, not your school email',
        });
    }
    return context;
};

/** Refuse an address another account already signs in with. Call only after code proof. */
const assertEmailAvailable = async (email: string, subject: string): Promise<void> => {
    const existing = await findAuthSubjectByIdentityKey(`email:${email}`);
    if (existing && existing.subject !== subject) conflict();
};

export const personalEmailProcedures = {
    getPersonalEmail: didAndChallengeRoute
        .output(z.object({ email: z.string().optional(), verified: z.boolean() }))
        .query(async ({ ctx }) => {
            const { identity } = await resolveClassLinkContext(ctx.user.did);
            return {
                email: identity.personalEmail,
                verified: Boolean(identity.personalEmail && identity.personalEmailVerifiedAt),
            };
        }),
    startPersonalEmail: didAndChallengeRoute
        .input(z.object({ email: personalEmail }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input: { email }, ctx }) => {
            const { identity } = await validateEmail(ctx.user.did, email);
            await consumeBudget(
                `classlink:rate:personal-email-send:${sha256Hex(ctx.user.did)}`,
                PERSONAL_EMAIL_SEND_LIMIT,
                600,
                'Too many codes requested. Please try again later.'
            );
            const code = randomInt(100000, 1000000).toString();
            // Keyed by the identity (stable across Firebase provider changes).
            const key = `classlink-personal-email:${sha256Hex(identity.identityKey)}`;
            await cache.set(key, JSON.stringify({ email, code }), 300);
            try {
                await getDeliveryService().send({
                    to: email,
                    templateAlias: 'login-verification-code',
                    templateModel: {
                        verificationCode: code,
                        verificationEmail: email,
                        recipient: { name: email },
                    },
                    branding: ctx.tenant?.emailBranding,
                    from: getFrom({ mailbox: 'login', branding: ctx.tenant?.emailBranding }),
                });
            } catch {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Unable to send your code. Please try again.',
                });
            }
            return { success: true };
        }),
    verifyPersonalEmail: didAndChallengeRoute
        .input(z.object({ email: personalEmail, code: z.string().regex(/^\d{6}$/) }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input: { email, code }, ctx }) => {
            const { identity } = await validateEmail(ctx.user.did, email);
            const key = `classlink-personal-email:${sha256Hex(identity.identityKey)}`;
            const stored = await cache.get(key);
            const invalid = () =>
                new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid or expired code. Please try again.',
                });
            if (!stored) throw invalid();
            const expected = JSON.stringify({ email, code });
            if (stored !== expected) {
                // Scope failures to this issuance, without exposing the code in cache keys.
                const attemptKey = `classlink-personal-email-attempts:${sha256Hex(identity.identityKey)}:${createHash('sha256').update(stored).digest('hex')}`;
                await recordFailure(attemptKey, 300);
                if (await isRateLimited(attemptKey, PERSONAL_EMAIL_ATTEMPT_LIMIT)) {
                    const redis = cache.redis ?? cache.node;
                    await redis.eval(
                        "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0",
                        1,
                        key,
                        stored
                    );
                }
                throw invalid();
            }
            if ((await getDel(key)) !== expected) throw invalid();
            // The caller proved they read the code, so it is safe to say the address is taken.
            await assertEmailAvailable(email, identity.subject);
            // Reserve without modifying existing attributes, including when another
            // account races the initial lookup. Subjects are immutable after insertion.
            await ensureAuthSubjectIndexes();
            try {
                await getAuthSubjectsCollection().updateOne(
                    { identityKey: `email:${email}` },
                    {
                        $setOnInsert: {
                            identityKey: `email:${email}`,
                            subject: identity.subject,
                            email,
                            emailVerified: true,
                            createdAt: new Date(),
                            lastLoginAt: new Date(),
                        },
                    },
                    { upsert: true }
                );
            } catch (error) {
                if (
                    typeof error !== 'object' ||
                    error === null ||
                    !('code' in error) ||
                    error.code !== 11000
                )
                    throw error;
            }
            const linked = await findAuthSubjectByIdentityKey(`email:${email}`);
            if (!linked || linked.subject !== identity.subject) conflict();
            await getOrCreateAuthSubjectLinkedTo(`email:${email}`, identity.subject, {
                email,
                emailVerified: true,
            });
            await updateClassLinkIdentity(identity.identityKey, {
                personalEmail: email,
                personalEmailVerifiedAt: new Date(),
            });
            return { success: true };
        }),
};
