import { createHash, randomInt, randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { accountRoute, type Context } from '@routes';
import cache from '@cache';
import {
    loadAccountContinuity,
    logAccountContinuityEvent,
} from '@helpers/accountContinuity.helpers';
import { resolveClassLinkContext } from '@helpers/classlinkContext.helpers';
import { canDeletePersonalEmailSubject } from '@helpers/classlinkDeletion.helpers';
import { maskEmail } from '@helpers/maskEmail';
import { isSyntheticEmail } from '@helpers/syntheticEmail.helpers';
import { ACCOUNT_CONTINUITY_REASONS, type AccountContinuityReason } from 'types/accountContinuity';
import { getDeliveryService, getFrom } from '../services/delivery';
import {
    findAuthSubjectByIdentityKey,
    ensureAuthSubjectIndexes,
    getAuthSubjectsCollection,
    getOrCreateAuthSubjectLinkedTo,
} from '../models/AuthSubject';
import {
    getClassLinkIdentitiesCollection,
    updateClassLinkIdentity,
} from '../models/ClassLinkIdentity';
import {
    clearRecoveryEmailIfUnchanged,
    EscrowPinStatusValidator,
    getEscrowPinStatus,
    hasOtherVerifiedRecoveryEmailHolder,
    hasUsableEscrow,
    isRecoveryMethodConfirmed,
    setRecoveryEmailByUserKeyId,
    type MongoUserKeyType,
} from '../models/UserKey';

const personalEmail = z.string().trim().toLowerCase().email().max(254);
const conflict = (): never => {
    throw new TRPCError({
        code: 'CONFLICT',
        message: 'This email is already used by another account.',
    });
};

/** Refusal copy per reason. Clients should key off the reason code, not this text. */
const CONTINUITY_REFUSALS: Record<AccountContinuityReason, string> = {
    disabled: 'Adding a personal email is not available yet.',
    district_off: 'Your school has not turned on personal emails.',
    students_excluded: 'Your school does not let students add a personal email.',
    status_unknown: 'We could not check your account. Please try again later.',
    below_minimum_age: 'You are not old enough to add a personal email.',
    age_unknown: 'Add your date of birth to your profile to add a personal email.',
    approval_required: 'A parent or guardian needs to approve this first.',
};

/** Address checks (start or verify) allowed per account per 10 minutes. */
const PERSONAL_EMAIL_CHECK_LIMIT = 20;
/** Codes sent per account per 10 minutes. */
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
 * Count one use of a per-account budget and refuse once it is spent. The increment and the
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

/** Longest a personal-email change may hold the per-account lock (safety expiry). */
const EMAIL_CHANGE_LOCK_SECONDS = 30;
const RELEASE_LOCK = `
if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end
return 0
`;

/**
 * Run a personal-email change (verify or remove) while holding a per-account Redis lock, so
 * the two never interleave: each reads the identity, sign-in link and recovery email inside
 * the lock and writes all three before another change starts. Fails closed: if the lock is
 * held or Redis is down, nothing is written and the caller is asked to retry.
 */
const withEmailChangeLock = async <T>(accountDid: string, fn: () => Promise<T>): Promise<T> => {
    const key = `classlink:lock:personal-email:${sha256Hex(accountDid)}`;
    const token = randomUUID();
    const busy = (): never => {
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Another change to your email is in progress. Please try again.',
        });
    };
    let acquired: unknown;
    try {
        acquired = await getRedis().set(key, token, 'EX', EMAIL_CHANGE_LOCK_SECONDS, 'NX');
    } catch {
        busy();
    }
    if (!acquired) busy();
    try {
        return await fn();
    } finally {
        await getRedis()
            .eval(RELEASE_LOCK, 1, key, token)
            .catch(() => undefined);
    }
};

const codeKey = (identityKey: string): string =>
    `classlink-personal-email:${sha256Hex(identityKey)}`;
/** Wrong guesses against the current code. Reset whenever a new code is issued. */
const attemptKey = (identityKey: string): string =>
    `classlink-personal-email-attempts:${sha256Hex(identityKey)}`;

type AccountContext = Pick<Context, 'authorizationHeader' | 'tenant'> & {
    user: { did: string; isChallengeValid: boolean; accountDid: string };
};

/**
 * Validate the address for the caller's ClassLink account. Rate-limited per account so the
 * flow cannot be used to probe which addresses have LearnCard accounts. Whether the address
 * is already taken is only revealed once the caller has proven they read the code (see
 * `assertEmailAvailable`), so `start` answers the same for every address. Refuses with
 * `FORBIDDEN` and `cause.reason` (a stable `AccountContinuityReason`) when the account
 * continuity policy does not allow a personal email for this account.
 */
const validateEmail = async (ctx: AccountContext, email: string) => {
    await consumeBudget(
        `classlink:rate:personal-email-check:${sha256Hex(ctx.user.accountDid)}`,
        PERSONAL_EMAIL_CHECK_LIMIT,
        600,
        'Too many attempts. Please try again later.'
    );
    const context = await resolveClassLinkContext(ctx.user.accountDid);
    if (!context.tenant)
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'School settings are unavailable. Please try again later.',
        });
    const continuity = await loadAccountContinuity(ctx, context.matched);
    if (!continuity.decision.allowed) {
        const { reason } = continuity.decision;
        logAccountContinuityEvent('denied', {
            tenantId: continuity.tenantId,
            reason,
            policyHash: continuity.policyHash,
        });
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: CONTINUITY_REFUSALS[reason],
            cause: { reason },
        });
    }
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
    return { ...context, continuity };
};

/**
 * Whether verifying `email` should also make it the account's recovery email. Never replaces
 * a different recovery email the user verified themselves, and skips (without failing the
 * sign-in link) an address another account already uses as its verified recovery email.
 * `replaces` lists the stored verified values the later write may overwrite (see
 * `setRecoveryEmailByUserKeyId`), so a change made in between is never overwritten.
 */
const planRecoveryEmail = async (
    userKey: MongoUserKeyType,
    previous: string | undefined,
    email: string
): Promise<{ set: boolean; skipped?: 'shared'; replaces: string[] }> => {
    const current = userKey.recoveryEmail?.trim().toLowerCase();
    const matches = current === previous || current === email;
    const replaceable = !current || !userKey.recoveryEmailVerifiedAt || matches;
    if (!replaceable || !userKey._id) return { set: false, replaces: [] };
    if (await hasOtherVerifiedRecoveryEmailHolder(email, userKey._id))
        return { set: false, skipped: 'shared', replaces: [] };
    const replaces = [email, ...(previous ? [previous] : [])];
    if (matches && userKey.recoveryEmail) replaces.push(userKey.recoveryEmail);
    return { set: true, replaces };
};

/** Refuse an address another account already signs in with. Call only after code proof. */
const assertEmailAvailable = async (email: string, subject: string): Promise<void> => {
    const existing = await findAuthSubjectByIdentityKey(`email:${email}`);
    if (existing && existing.subject !== subject) conflict();
};

export const personalEmailProcedures = {
    getPersonalEmail: accountRoute
        .output(z.object({ email: z.string().optional(), verified: z.boolean() }))
        .query(async ({ ctx }) => {
            const { identity } = await resolveClassLinkContext(ctx.user.accountDid);
            return {
                email: identity.personalEmail,
                verified: Boolean(identity.personalEmail && identity.personalEmailVerifiedAt),
            };
        }),
    /**
     * What the account still needs to keep working after losing school access. Never returns
     * the tenant ID, the policy or the date of birth. `nextStep`:
     * - `email`: no verified personal email, or no verified recovery email (also when it was
     *   skipped because another account uses that address).
     * - `done`: both emails, plus a confirmed method the user holds (passkey, phrase, backup)
     *   or a usable PIN on usable escrow (`pinRecoverable`): the emailed code then the PIN
     *   gets them back in.
     * - `pin`: usable escrow without a usable PIN (none, locked or stale; see `pinState`).
     * - `method`: no usable escrow (never enrolled, opted out or wiped), so only a passkey or
     *   recovery phrase can get them back in.
     */
    getAccountContinuity: accountRoute
        .output(
            z.object({
                personalEmail: z.object({
                    allowed: z.boolean(),
                    reason: z.enum(ACCOUNT_CONTINUITY_REASONS).optional(),
                }),
                emailVerified: z.boolean(),
                maskedEmail: z.string().optional(),
                recoveryEmailVerified: z.boolean(),
                hasServerConfirmedMethod: z.boolean(),
                hasUserRecoveryMethod: z.boolean(),
                pinState: EscrowPinStatusValidator.shape.state,
                pinRecoverable: z.boolean(),
                nextStep: z.enum(['email', 'pin', 'method', 'done']),
            })
        )
        .query(async ({ ctx }) => {
            const { identity, userKey, matched } = await resolveClassLinkContext(
                ctx.user.accountDid
            );
            const { decision } = await loadAccountContinuity(ctx, matched);
            const confirmed = (userKey.recoveryMethods ?? []).filter(method =>
                isRecoveryMethodConfirmed(userKey, method)
            );
            const emailVerified = Boolean(
                identity.personalEmail && identity.personalEmailVerifiedAt
            );
            const recoveryEmailVerified = Boolean(
                userKey.recoveryEmail && userKey.recoveryEmailVerifiedAt
            );
            const hasUserRecoveryMethod = confirmed.some(method => method.type !== 'escrow');
            const escrowUsable = hasUsableEscrow(userKey);
            const pin = getEscrowPinStatus(userKey);
            const pinRecoverable = escrowUsable && pin.enabled;
            const nextStep =
                !emailVerified || !recoveryEmailVerified
                    ? ('email' as const)
                    : hasUserRecoveryMethod || pinRecoverable
                      ? ('done' as const)
                      : escrowUsable
                        ? ('pin' as const)
                        : ('method' as const);
            return {
                personalEmail: decision,
                emailVerified,
                ...(identity.personalEmail
                    ? { maskedEmail: maskEmail(identity.personalEmail) }
                    : {}),
                recoveryEmailVerified,
                hasServerConfirmedMethod: confirmed.length > 0,
                hasUserRecoveryMethod,
                pinState: pin.state,
                pinRecoverable,
                nextStep,
            };
        }),
    startPersonalEmail: accountRoute
        .input(z.object({ email: personalEmail }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input: { email }, ctx }) => {
            const { identity } = await validateEmail(ctx, email);
            await consumeBudget(
                `classlink:rate:personal-email-send:${sha256Hex(ctx.user.accountDid)}`,
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
    /**
     * Prove the code, then link the address as a future sign-in and (see `planRecoveryEmail`)
     * make it the recovery email. No transactions: every write is idempotent and the identity
     * update comes last as the completion marker, so a retry after a failure converges.
     */
    verifyPersonalEmail: accountRoute
        .input(z.object({ email: personalEmail, code: z.string().regex(/^\d{6}$/) }))
        .output(
            z.object({
                success: z.boolean(),
                recoveryEmailSet: z.boolean(),
                recoveryEmailSkipped: z.literal('shared').optional(),
            })
        )
        .mutation(({ input: { email, code }, ctx }) =>
            withEmailChangeLock(ctx.user.accountDid, async () => {
                const { identity, userKey, continuity } = await validateEmail(ctx, email);
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
                // Decide before any write, so a shared address never leaves a half-finished link.
                const previous = identity.personalEmail?.trim().toLowerCase();
                const recoveryEmail = await planRecoveryEmail(userKey, previous, email);
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
                // False when the recovery email changed after the plan (compare-and-set).
                const recoveryEmailSet =
                    recoveryEmail.set && userKey._id
                        ? await setRecoveryEmailByUserKeyId(
                              userKey._id,
                              email,
                              recoveryEmail.replaces
                          )
                        : false;
                // Release the replaced address, so it stops signing in to this account and is
                // not left behind by account deletion (which only knows the current address).
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
                const audit = { tenantId: continuity.tenantId, policyHash: continuity.policyHash };
                logAccountContinuityEvent('verified', audit);
                if (recoveryEmailSet) logAccountContinuityEvent('recovery_email_set', audit);
                return {
                    success: true,
                    recoveryEmailSet,
                    ...(recoveryEmail.skipped
                        ? { recoveryEmailSkipped: recoveryEmail.skipped }
                        : {}),
                };
            })
        ),
    /**
     * Remove the personal email from all three stores: its `email:` sign-in link (under the
     * same guard as the deletion cascade), the recovery email when it is still this address,
     * and last the identity fields. Always allowed, whatever the continuity policy. Holds the
     * same per-account lock as `verifyPersonalEmail`, so a concurrent verify cannot leave a
     * new address active but untracked.
     */
    removePersonalEmail: accountRoute
        .output(z.object({ success: z.boolean() }))
        .mutation(({ ctx }) =>
            withEmailChangeLock(ctx.user.accountDid, async () => {
                const { identity, userKey } = await resolveClassLinkContext(ctx.user.accountDid);
                const address = identity.personalEmail?.trim().toLowerCase();
                if (!address) return { success: true };
                if (await canDeletePersonalEmailSubject(address, identity.subject, userKey))
                    await getAuthSubjectsCollection().deleteOne({
                        identityKey: `email:${address}`,
                        subject: identity.subject,
                    });
                if (userKey._id && userKey.recoveryEmail?.trim().toLowerCase() === address)
                    await clearRecoveryEmailIfUnchanged(userKey._id, userKey.recoveryEmail);
                // Only clear the address this call removed (defence in depth behind the lock).
                await getClassLinkIdentitiesCollection().updateOne(
                    {
                        identityKey: identity.identityKey,
                        personalEmail: identity.personalEmail,
                        personalEmailVerifiedAt: identity.personalEmailVerifiedAt ?? {
                            $exists: false,
                        },
                    },
                    {
                        $unset: { personalEmail: '', personalEmailVerifiedAt: '' },
                        $set: { updatedAt: new Date() },
                    }
                );
                logAccountContinuityEvent('removed', { tenantId: identity.tenantId });
                return { success: true };
            })
        ),
};
