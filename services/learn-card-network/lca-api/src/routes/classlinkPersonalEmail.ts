import { createHash, randomInt } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { didAndChallengeRoute } from '@routes';
import cache from '@cache';
import { resolveClassLinkContext } from '@helpers/classlinkContext.helpers';
import { canDeletePersonalEmailSubject } from '@helpers/classlinkDeletion.helpers';
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

// INCR first, then compare, in one round trip: parallel calls cannot all read the old count.
const CONSUME_BUDGET = `
local used = redis.call('INCR', KEYS[1])
if redis.call('TTL', KEYS[1]) < 0 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return used
`;

/**
 * Atomically check one guess against the issued code. The attempt is counted before the
 * comparison, so concurrent guesses cannot exceed the per-code limit; the code is deleted on
 * a match or once the limit is reached. KEYS: code, attempts. ARGV: expected, limit, ttl.
 */
const CHECK_CODE = `
local stored = redis.call('GET', KEYS[1])
if not stored then return 'missing' end
local attempts = redis.call('INCR', KEYS[2])
if redis.call('TTL', KEYS[2]) < 0 then
    redis.call('EXPIRE', KEYS[2], ARGV[3])
end
local limit = tonumber(ARGV[2])
if attempts > limit then
    redis.call('DEL', KEYS[1])
    return 'locked'
end
if stored == ARGV[1] then
    redis.call('DEL', KEYS[1], KEYS[2])
    return 'ok'
end
if attempts >= limit then redis.call('DEL', KEYS[1]) end
return 'wrong'
`;

const getRedis = () => cache.redis ?? cache.node;

/**
 * Count one use of a per-DID budget and refuse once it is spent. The increment and the
 * check are one atomic script, so a burst of parallel calls cannot overrun the budget.
 * Fails open on Redis errors, like the shared limiter: the budget is a speed bump, and the
 * code check below does not fail open.
 */
const consumeBudget = async (
    key: string,
    limit: number,
    windowSeconds: number,
    message: string
): Promise<void> => {
    let used: number;
    try {
        used = Number(await getRedis().eval(CONSUME_BUDGET, 1, key, windowSeconds)) || 0;
    } catch {
        return;
    }
    if (used > limit) throw tooMany(message);
};

const codeKey = (identityKey: string): string =>
    `classlink-personal-email:${sha256Hex(identityKey)}`;
/** Wrong guesses against the current code. Reset whenever a new code is issued. */
const attemptKey = (identityKey: string): string =>
    `classlink-personal-email-attempts:${sha256Hex(identityKey)}`;

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
            await cache.set(codeKey(identity.identityKey), JSON.stringify({ email, code }), 300);
            // The attempt limit applies per issued code.
            await getRedis().del(attemptKey(identity.identityKey));
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
            const { identity, userKey } = await validateEmail(ctx.user.did, email);
            const result = await getRedis().eval(
                CHECK_CODE,
                2,
                codeKey(identity.identityKey),
                attemptKey(identity.identityKey),
                JSON.stringify({ email, code }),
                PERSONAL_EMAIL_ATTEMPT_LIMIT,
                300
            );
            if (result !== 'ok')
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid or expired code. Please try again.',
                });
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
            // Release the replaced address, so it stops signing in to this account and is
            // not left behind by account deletion (which only knows the current address).
            const previous = identity.personalEmail?.trim().toLowerCase();
            if (
                previous &&
                previous !== email &&
                (await canDeletePersonalEmailSubject(previous, identity.subject, userKey))
            )
                await getAuthSubjectsCollection().deleteOne({
                    identityKey: `email:${previous}`,
                    subject: identity.subject,
                });
            await updateClassLinkIdentity(identity.identityKey, {
                personalEmail: email,
                personalEmailVerifiedAt: new Date(),
            });
            return { success: true };
        }),
};
