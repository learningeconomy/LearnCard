import { createHash, randomInt } from 'node:crypto';
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
import { contactDigest } from '@helpers/escrowContactDigest';
import { getAdminAuth } from '@helpers/firebaseAdminAuth.helpers';
import {
    demotePersonalEmail,
    getEmailChangeLockKey,
    getFirebaseUserOrUndefined,
    hasLiveSchoolEmailAlias,
    planPrimaryEmail,
    promotePersonalEmail,
    rollbackPrimaryEmailRecord,
    withEmailChangeLock,
    type EmailChangeLock,
} from '@helpers/classlinkPrimaryEmail.helpers';
import { isEscrowEnabled, isEscrowRemoteMode } from '../services/escrow-enclave';
import { ACCOUNT_CONTINUITY_REASONS, type AccountContinuityReason } from 'types/accountContinuity';
import { getDeliveryService, getFrom } from '../services/delivery';
import {
    findAuthSubjectByIdentityKey,
    ensureAuthSubjectIndexes,
    getAuthSubjectsCollection,
    getOrCreateAuthSubjectLinkedTo,
} from '../models/AuthSubject';
import {
    findClassLinkIdentityByIdentityKey,
    getClassLinkIdentitiesCollection,
    updateClassLinkIdentity,
    type ClassLinkPrimaryEmail,
    type MongoClassLinkIdentityType,
} from '../models/ClassLinkIdentity';
import {
    clearRecoveryEmailIfUnchanged,
    EscrowPinStatusValidator,
    findUserKeyByDid,
    getEscrowPinStatus,
    hasUsableEscrow,
    isRecoveryMethodConfirmed,
    setContactMethodIfUnchanged,
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

/** Run under the per-account email-change lock (see `withEmailChangeLock`). */
const withAccountLock = async <T>(
    accountDid: string,
    fn: (lock: EmailChangeLock) => Promise<T>
): Promise<T> => withEmailChangeLock(await getEmailChangeLockKey(accountDid), fn);

/** A `pending` promotion older than this was interrupted; the reconcile demotes it. */
const PENDING_PROMOTION_MAX_AGE_MS = 10 * 60 * 1000;

const normalize = (email: string | null | undefined): string | undefined =>
    email?.trim().toLowerCase() || undefined;

/** The promotion replaced a placeholder (synthetic or absent) contact. */
const replacedPlaceholder = (record: ClassLinkPrimaryEmail): boolean =>
    !record.prevContactMethod ||
    (record.prevContactMethod.type === 'email' && isSyntheticEmail(record.prevContactMethod.value));

const isDuplicateKey = (error: unknown): boolean =>
    typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;

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

/** Refuse an address another account already signs in with. Call only after code proof. */
const assertEmailAvailable = async (email: string, subject: string): Promise<void> => {
    const existing = await findAuthSubjectByIdentityKey(`email:${email}`);
    if (existing && existing.subject !== subject) conflict();
};

/**
 * Best-effort reconcile, under the lock: demote a promotion recorded as `demotePending`
 * (a rebind, revoke or the login orphan guard could not demote it) or left `pending` for over
 * 10 minutes (an interrupted verify). Returns whether it changed anything. Never throws.
 */
const reconcilePrimaryEmail = async (
    accountDid: string,
    identity: MongoClassLinkIdentityType,
    userKey: MongoUserKeyType
): Promise<boolean> => {
    const record = identity.primaryEmail;
    const stalePending =
        record?.state === 'pending' &&
        Date.now() - new Date(record.at).getTime() > PENDING_PROMOTION_MAX_AGE_MS;
    if (!identity.demotePending && !stalePending) return false;
    try {
        await withAccountLock(accountDid, async lock => {
            const fresh = await findClassLinkIdentityByIdentityKey(identity.identityKey);
            if (fresh)
                await demotePersonalEmail({
                    auth: getAdminAuth(),
                    identity: fresh,
                    userKey,
                    reason: identity.demotePending?.reason ?? 'interrupted',
                    lock,
                });
        });
        return true;
    } catch {
        console.warn('classlink.primary_email.reconcile_failed');
        return false;
    }
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
     * the tenant ID, the policy or the date of birth.
     *
     * - `emailPrimary`: the verified personal email is T's Firebase email (the sign-in email);
     *   `primaryUid` is T, for the client's same-session check. A promotion whose Firebase
     *   email drifted reports false (the user re-verifies).
     * - `signInEmailSource`: `personal` (promoted) or `account` (T already signs in with its
     *   own real, non-school email; verify only links an alias).
     * - `hasSchoolEmail`: the school email still signs in (trusted domain, `email:` subject,
     *   ClassLink sign-in within the district's idle limit).
     * - `contactStale` (remote escrow only): the sealed escrow contact is not the sign-in email.
     *   A UX hint from `escrowContactDigest`, never a security control.
     * - `canRemove`: false for a placeholder account with usable escrow (change only).
     *
     * `nextStep`: `confirmPin` (re-seal by entering the current PIN), `email`, `done`, `pin`
     * (create one; also for a promoted placeholder account), `method` (passkey or phrase).
     *
     * Also the reconcile: a `demotePending` or a `pending` promotion older than 10 minutes is
     * demoted best-effort under the lock before answering.
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
                emailPrimary: z.boolean(),
                primaryUid: z.string().optional(),
                signInEmailSource: z.enum(['personal', 'account']).optional(),
                hasSchoolEmail: z.boolean(),
                contactStale: z.boolean(),
                canRemove: z.boolean(),
                hasServerConfirmedMethod: z.boolean(),
                hasUserRecoveryMethod: z.boolean(),
                pinState: EscrowPinStatusValidator.shape.state,
                pinRecoverable: z.boolean(),
                nextStep: z.enum(['confirmPin', 'email', 'pin', 'method', 'done']),
            })
        )
        .query(async ({ ctx }) => {
            let context = await resolveClassLinkContext(ctx.user.accountDid);
            if (await reconcilePrimaryEmail(ctx.user.accountDid, context.identity, context.userKey))
                context = await resolveClassLinkContext(ctx.user.accountDid);
            const { identity, userKey, matched } = context;
            const { decision } = await loadAccountContinuity(ctx, matched);
            const confirmed = (userKey.recoveryMethods ?? []).filter(method =>
                isRecoveryMethodConfirmed(userKey, method)
            );
            const emailVerified = Boolean(
                identity.personalEmail && identity.personalEmailVerifiedAt
            );
            const record = identity.primaryEmail;
            const uid = record?.uid ?? identity.firebaseUid;
            const auth = getAdminAuth();
            const tUser = auth
                ? await getFirebaseUserOrUndefined(auth, uid).catch(() => undefined)
                : undefined;
            const firebaseEmail = normalize(tUser?.email);
            const expected =
                firebaseEmail && !isSyntheticEmail(firebaseEmail) ? firebaseEmail : undefined;
            let emailPrimary =
                emailVerified &&
                record?.state === 'active' &&
                record.uid === identity.firebaseUid &&
                record.email === normalize(identity.personalEmail);
            // Without Firebase Admin (tests) the record is trusted; otherwise check for drift.
            if (emailPrimary && tUser && firebaseEmail !== record?.email) {
                console.warn('classlink.primary_email.drift', { tenantId: identity.tenantId });
                emailPrimary = false;
            }
            const signInEmailSource = emailPrimary
                ? ('personal' as const)
                : !record && expected && expected !== normalize(identity.email)
                  ? ('account' as const)
                  : undefined;
            const hasUserRecoveryMethod = confirmed.some(method => method.type !== 'escrow');
            const escrowUsable = hasUsableEscrow(userKey);
            const optedOut = Boolean(userKey.escrowOptedOutAt) || !isEscrowEnabled();
            const pin = getEscrowPinStatus(userKey);
            const pinRecoverable = escrowUsable && pin.enabled;
            const sealed = userKey.escrowContactDigest;
            const contactStale =
                isEscrowRemoteMode() &&
                escrowUsable &&
                expected !== undefined &&
                (sealed ? sealed !== contactDigest(expected) : emailPrimary);
            const placeholderEscrow = Boolean(
                record && escrowUsable && replacedPlaceholder(record)
            );
            const nextStep =
                contactStale && pin.enabled
                    ? ('confirmPin' as const)
                    : !(emailPrimary || signInEmailSource === 'account')
                      ? ('email' as const)
                      : hasUserRecoveryMethod || pinRecoverable
                        ? ('done' as const)
                        : !optedOut && (escrowUsable || emailPrimary)
                          ? ('pin' as const)
                          : ('method' as const);
            return {
                personalEmail: decision,
                emailVerified,
                ...(identity.personalEmail
                    ? { maskedEmail: maskEmail(identity.personalEmail) }
                    : {}),
                emailPrimary,
                ...(signInEmailSource ? { primaryUid: uid, signInEmailSource } : {}),
                hasSchoolEmail: await hasLiveSchoolEmailAlias(identity),
                contactStale,
                canRemove: Boolean(identity.personalEmail) && !placeholderEscrow,
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
     * Prove the code, then make the address the account's sign-in email (`planPrimaryEmail`):
     * T's Firebase email and the `contactMethod`, with the previous values recorded for
     * demote. Changing the Firebase email revokes T's sessions, so `customToken` (for T) lets
     * this device sign straight back in; other devices on T are signed out. When T already
     * signs in with its own real email (`primary: false`), the address is only linked as an
     * alias, as before. Never sets a recovery email, and clears one equal to the address.
     *
     * Runs under the per-account lock with fencing. Every write is idempotent and the identity
     * update (`primaryEmail.state = 'active'`) comes last as the completion marker, so a retry
     * after a failure converges; a crash leaves a `pending` record for the reconcile.
     */
    verifyPersonalEmail: accountRoute
        .input(z.object({ email: personalEmail, code: z.string().regex(/^\d{6}$/) }))
        .output(
            z.object({
                success: z.literal(true),
                verified: z.literal(true),
                primary: z.boolean(),
                primaryUid: z.string().optional(),
                customToken: z.string().optional(),
            })
        )
        .mutation(({ input: { email, code }, ctx }) =>
            withAccountLock(ctx.user.accountDid, async lock => {
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
                const auth = getAdminAuth();
                if (!auth)
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Your email could not be saved right now. Please try again.',
                    });
                // Decide before any write, so a refused address leaves nothing half-finished.
                const plan = await planPrimaryEmail({ auth, identity, userKey, email });
                const previous = identity.personalEmail?.trim().toLowerCase();

                // Reserve without modifying existing attributes, including when another
                // account races the initial lookup. Subjects are immutable after insertion.
                await lock.assertHeld();
                await ensureAuthSubjectIndexes();
                let inserted = false;
                try {
                    inserted =
                        (
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
                            )
                        ).upsertedCount > 0;
                } catch (error) {
                    if (!isDuplicateKey(error)) throw error;
                }
                const linked = await findAuthSubjectByIdentityKey(`email:${email}`);
                if (!linked || linked.subject !== identity.subject) conflict();
                await getOrCreateAuthSubjectLinkedTo(`email:${email}`, identity.subject, {
                    email,
                    emailVerified: true,
                });
                const releaseReservation = async () => {
                    if (inserted)
                        await getAuthSubjectsCollection().deleteOne({
                            identityKey: `email:${email}`,
                            subject: identity.subject,
                        });
                };

                let customToken: string | undefined;
                let record: ClassLinkPrimaryEmail | undefined;
                if (plan.kind === 'primary') {
                    let promoted: Awaited<ReturnType<typeof promotePersonalEmail>>;
                    try {
                        promoted = await promotePersonalEmail({ auth, identity, plan, lock });
                    } catch (error) {
                        if (error instanceof TRPCError && error.code === 'CONFLICT') {
                            const pending = await findClassLinkIdentityByIdentityKey(
                                identity.identityKey
                            );
                            if (pending?.primaryEmail?.email === email)
                                await rollbackPrimaryEmailRecord(
                                    identity.identityKey,
                                    pending.primaryEmail,
                                    identity.primaryEmail?.uid === plan.uid
                                        ? identity.primaryEmail
                                        : undefined
                                );
                            await releaseReservation();
                        }
                        throw error;
                    }
                    record = promoted.record;
                    await lock.assertHeld();
                    const moved =
                        userKey._id &&
                        (await setContactMethodIfUnchanged(userKey._id, userKey.contactMethod, {
                            type: 'email',
                            value: email,
                        }));
                    if (!moved) {
                        // Put Firebase back, then drop the reservation and the marker.
                        const pending = await findClassLinkIdentityByIdentityKey(
                            identity.identityKey
                        );
                        if (pending)
                            await demotePersonalEmail({
                                auth,
                                identity: pending,
                                userKey,
                                reason: 'verify_rollback',
                                lock,
                            });
                        await releaseReservation();
                        conflict();
                    }
                    if (userKey._id && normalize(userKey.recoveryEmail) === email)
                        await clearRecoveryEmailIfUnchanged(
                            userKey._id,
                            userKey.recoveryEmail as string
                        );
                    if (promoted.firebaseChanged)
                        customToken = await auth.createCustomToken(plan.uid);
                }

                // Release the replaced address, so it stops signing in to this account and is
                // not left behind by account deletion (which only knows the current address).
                // After the contact moved, so the guard no longer sees it as the contact.
                if (previous && previous !== email) {
                    const current = await findUserKeyByDid(userKey.primaryDid);
                    if (
                        await canDeletePersonalEmailSubject(
                            previous,
                            identity.subject,
                            current ?? userKey
                        )
                    ) {
                        await lock.assertHeld();
                        await getAuthSubjectsCollection().deleteOne({
                            identityKey: `email:${previous}`,
                            subject: identity.subject,
                        });
                    }
                }
                await lock.assertHeld();
                await updateClassLinkIdentity(identity.identityKey, {
                    personalEmail: email,
                    personalEmailVerifiedAt: new Date(),
                    ...(record ? { primaryEmail: { ...record, state: 'active' as const } } : {}),
                });
                const audit = { tenantId: continuity.tenantId, policyHash: continuity.policyHash };
                logAccountContinuityEvent('verified', audit);
                if (record) logAccountContinuityEvent('primary_set', audit);
                return {
                    success: true as const,
                    verified: true as const,
                    primary: plan.kind === 'primary',
                    ...(plan.kind === 'primary' ? { primaryUid: plan.uid } : {}),
                    ...(customToken ? { customToken } : {}),
                };
            })
        ),
    /**
     * Remove the personal email: demote (T's Firebase email and the contact method go back to
     * their recorded values), then its `email:` sign-in link (under the same guard as the
     * deletion cascade), the recovery email when it is still this address, and last the
     * identity fields. Always allowed, whatever the continuity policy, except on a placeholder
     * account with usable escrow (`PRECONDITION_FAILED`, reason `placeholder_escrow`: the
     * sealed contact would have nowhere to go; change the address instead). Holds the same
     * per-account lock as `verifyPersonalEmail`. Returns `customToken` for T when its Firebase
     * email changed (T's sessions were revoked).
     */
    removePersonalEmail: accountRoute
        .output(
            z.object({
                success: z.literal(true),
                removed: z.literal(true),
                customToken: z.string().optional(),
            })
        )
        .mutation(({ ctx }) =>
            withAccountLock(ctx.user.accountDid, async lock => {
                const { identity, userKey } = await resolveClassLinkContext(ctx.user.accountDid);
                const address = identity.personalEmail?.trim().toLowerCase();
                const record = identity.primaryEmail;
                const done = { success: true as const, removed: true as const };
                if (!address && !record) return done;
                let customToken: string | undefined;
                let account = userKey;
                if (record) {
                    if (hasUsableEscrow(userKey) && replacedPlaceholder(record))
                        throw new TRPCError({
                            code: 'PRECONDITION_FAILED',
                            message:
                                'This is how you sign in. You can switch to a different email.',
                            cause: { reason: 'placeholder_escrow' },
                        });
                    ({ customToken } = await demotePersonalEmail({
                        auth: getAdminAuth(),
                        identity,
                        userKey,
                        reason: 'removed',
                        lock,
                    }));
                    account = (await findUserKeyByDid(userKey.primaryDid)) ?? userKey;
                }
                if (
                    address &&
                    (await canDeletePersonalEmailSubject(address, identity.subject, account))
                ) {
                    await lock.assertHeld();
                    await getAuthSubjectsCollection().deleteOne({
                        identityKey: `email:${address}`,
                        subject: identity.subject,
                    });
                }
                if (account._id && normalize(account.recoveryEmail) === address && address)
                    await clearRecoveryEmailIfUnchanged(
                        account._id,
                        account.recoveryEmail as string
                    );
                // Only clear the address this call removed (defence in depth behind the lock).
                await lock.assertHeld();
                await getClassLinkIdentitiesCollection().updateOne(
                    {
                        identityKey: identity.identityKey,
                        personalEmail: identity.personalEmail ?? { $exists: false },
                        personalEmailVerifiedAt: identity.personalEmailVerifiedAt ?? {
                            $exists: false,
                        },
                    },
                    {
                        $unset: {
                            personalEmail: '',
                            personalEmailVerifiedAt: '',
                            primaryEmail: '',
                            demotePending: '',
                        },
                        $set: { updatedAt: new Date() },
                    }
                );
                logAccountContinuityEvent('removed', { tenantId: identity.tenantId });
                return { ...done, ...(customToken ? { customToken } : {}) };
            })
        ),
};
