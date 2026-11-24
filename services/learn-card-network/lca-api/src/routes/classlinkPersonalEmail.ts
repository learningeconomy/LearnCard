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
import { contactDigest } from '@helpers/escrowContactDigest';
import { isEscrowConfirmBlocked } from '@helpers/escrowConfirmLimits';
import { getAdminAuth, verifyFirebaseSignIn } from '@helpers/firebaseAdminAuth.helpers';
import {
    demotePersonalEmail,
    filterNoticeRecipients,
    findSignInEmailDrift,
    getEmailChangeLockKey,
    getFirebaseUserOrUndefined,
    getSchoolNoticeRecipients,
    hasLiveSchoolEmailAlias,
    hasRecentSignIn,
    isSameRecord,
    lockBusy,
    planPrimaryEmail,
    promotePersonalEmail,
    recordReportedSignIn,
    releaseAbandonedEmailReservations,
    releaseEmailReservation,
    repairSignInEmailDrift,
    rollbackPrimaryEmailRecord,
    settleFirebaseEmailWrite,
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
    status_unknown:
        'We could not confirm your school role, so a personal email cannot be added yet.',
    below_minimum_age: 'You are not old enough to add a personal email.',
    age_unknown: 'Add your date of birth to your profile to add a personal email.',
    approval_required: 'A parent or guardian needs to approve this first.',
};

/** Address checks (start or verify) allowed per account per 10 minutes. */
const PERSONAL_EMAIL_CHECK_LIMIT = 20;
/** Sign-in reports per account per 10 minutes (`recordRecentSignIn`). */
const RECENT_SIGN_IN_REPORT_LIMIT = 10;
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

/** The `active` record: without `replacedEmail` and `reservedBy` (only meaningful while `pending`). */
const activeRecord = ({
    replacedEmail: _replaced,
    reservedBy: _reservedBy,
    ...rest
}: ClassLinkPrimaryEmail): ClassLinkPrimaryEmail => ({ ...rest, state: 'active' });

/** A `demotePending`, or a `pending` promotion older than 10 minutes (an interrupted verify). */
const needsReconcile = (
    identity: Pick<MongoClassLinkIdentityType, 'demotePending' | 'primaryEmail'>,
    now = Date.now()
): boolean => {
    const record = identity.primaryEmail;
    return Boolean(
        identity.demotePending ||
        (record?.state === 'pending' &&
            now - new Date(record.at).getTime() > PENDING_PROMOTION_MAX_AGE_MS)
    );
};

/**
 * Refuse a sign-in email change (start, verify or remove) without a recent sign-in
 * (`hasRecentSignIn`: ClassLink, or an email code to the active promoted address, within 24
 * hours). `FORBIDDEN`, reason `recent_sign_in_required`; the app sends the user to sign in again.
 */
const assertRecentSignIn = async (
    identity: Parameters<typeof hasRecentSignIn>[0] & Pick<MongoClassLinkIdentityType, 'tenantId'>
): Promise<void> => {
    if (await hasRecentSignIn(identity)) return;
    console.info('classlink.personal_email.recent_sign_in_required', {
        tenantId: identity.tenantId,
    });
    throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'For your security, sign in again to change your email.',
        cause: { reason: 'recent_sign_in_required' },
    });
};

/** Delivery budget for the sign-in email notice. */
const SIGN_IN_EMAIL_NOTICE_TIMEOUT_MS = 3_000;

/**
 * Tell the account that its sign-in email changed (`sign-in-email-changed`), best effort:
 * to its previous real addresses (never a synthetic one, never the new one) and the school
 * addresses from `getSchoolNoticeRecipients`. Every recipient passes `filterNoticeRecipients`
 * (the school-notice rules for any known school address, so a recycled school inbox that comes
 * back as a previous sign-in email hears nothing). Nothing is sent when the new address would
 * be the only recipient. Never throws, never logs addresses, bounded in time.
 */
const notifySignInEmailChanged = async ({
    previous,
    school,
    newEmail,
    account,
    tenant,
}: {
    previous: (string | null | undefined)[];
    school: string[];
    newEmail?: string | null;
    account: Pick<MongoUserKeyType, 'primaryDid' | 'linkedDids'>;
    tenant: Context['tenant'];
}): Promise<void> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        const next = normalize(newEmail);
        const recipients = await filterNoticeRecipients(
            [...previous.map(normalize).filter(address => address !== next), ...school],
            account
        );
        if (!recipients.some(address => address !== next)) return;
        const shown = next && !isSyntheticEmail(next) ? next : undefined;
        const branding = tenant?.emailBranding;
        const changedAt = new Date().toISOString();
        const send = Promise.allSettled(
            recipients.map(async to =>
                getDeliveryService().send({
                    to,
                    templateAlias: 'sign-in-email-changed',
                    templateModel: {
                        changedAt,
                        ...(shown ? { maskedEmail: maskEmail(shown) } : {}),
                    },
                    branding,
                    from: getFrom({ mailbox: 'recovery', branding }),
                })
            )
        ).then(results => {
            const failed = results.filter(result => result.status === 'rejected').length;
            if (failed) console.warn('classlink.sign_in_email_notice.failed', { failed });
        });
        await Promise.race([
            send,
            new Promise<void>(resolve => {
                timer = setTimeout(resolve, SIGN_IN_EMAIL_NOTICE_TIMEOUT_MS);
            }),
        ]);
    } catch {
        console.warn('classlink.sign_in_email_notice.failed');
    } finally {
        if (timer) clearTimeout(timer);
    }
};

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
 * continuity policy does not allow a personal email for this account, and with reason
 * `recent_sign_in_required` without a sign-in in the last 24 hours (`assertRecentSignIn`).
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
    // Before any code is sent, so the student learns this before typing one.
    await assertRecentSignIn(context.identity);
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
 * Whether the account already signs in with `email` on another of its Firebase logins (verify's
 * `own-email` outcome for an address held by another uid of the same account).
 */
const isSignInEmailOfAccount = async (
    auth: NonNullable<ReturnType<typeof getAdminAuth>>,
    userKey: MongoUserKeyType,
    email: string
): Promise<boolean> => {
    const holder = await auth.getUserByEmail(normalize(email) as string).catch(() => undefined);
    return Boolean(
        holder &&
        (userKey.authProviders ?? []).some(
            provider => provider.type === 'firebase' && provider.id === holder.uid
        )
    );
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
     *   `primaryUid` is T, for the client's same-session check (always returned). A promotion
     *   whose Firebase email drifted reports false (the user re-verifies).
     * - `signInEmailSource`: `personal` (promoted) or `account` (T already signs in with its
     *   own real, non-school email, or the verified address is the Firebase email of another
     *   login of the account; verify only links an alias).
     * - `hasSchoolEmail`: the school email still signs in to this account (trusted domain,
     *   `email:` subject, ClassLink sign-in within the district's idle limit, and no other
     *   ClassLink identity has the address; same rules as login resolution).
     * - `contactStale` (remote escrow only): the sealed escrow contact is not the sign-in email.
     *   A UX hint from `escrowContactDigest`, never a security control.
     * - `canRemove`: false for a placeholder account with usable escrow (change only).
     *
     * - `pinChangeRequired` (with `confirmPin` only): a confirm would be refused (the PIN's
     *   confirm budget or the uncommitted-version cap is spent). Go straight to "choose a new
     *   PIN" without rotating for a confirm.
     *
     * `nextStep`: `confirmPin` (re-seal by entering the current PIN), `email`, `done`, `pin`
     * (create one; also for a promoted placeholder account), `method` (passkey or phrase).
     *
     * `maskedSignInEmail`: T's real (non-synthetic) Firebase email, masked, whenever it has one.
     *
     * `reconcilePending`: a `demotePending`, a `pending` promotion older than 10 minutes, or
     * drift (`findSignInEmailDrift`: T holds a real address the committed state does not expect)
     * waits for `reconcilePersonalEmail`. This query never writes (a demote changes T's Firebase email
     * and signs T's sessions out, so it is a mutation the client calls on purpose).
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
                maskedSignInEmail: z.string().optional(),
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
                pinChangeRequired: z.boolean(),
                reconcilePending: z.boolean(),
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
            // T holds an address the committed state does not expect: the reconcile repairs it.
            const drift = needsReconcile(identity)
                ? undefined
                : await findSignInEmailDrift(auth, identity, userKey);
            const signInEmailSource = emailPrimary
                ? ('personal' as const)
                : !record &&
                    ((expected && expected !== normalize(identity.email)) ||
                        (emailVerified &&
                            auth &&
                            (await isSignInEmailOfAccount(
                                auth,
                                userKey,
                                identity.personalEmail as string
                            ))))
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
            // Before the client rotates for a confirm (which spends a share version): would
            // `escrow.enroll` refuse it with `pin_change_required`?
            const pinChangeRequired =
                nextStep === 'confirmPin' && (await isEscrowConfirmBlocked(userKey.primaryDid));
            return {
                personalEmail: decision,
                emailVerified,
                ...(identity.personalEmail
                    ? { maskedEmail: maskEmail(identity.personalEmail) }
                    : {}),
                // T's real (non-synthetic) Firebase email, the address it signs in with now.
                ...(expected ? { maskedSignInEmail: maskEmail(expected) } : {}),
                emailPrimary,
                // Always: the client's same-session gate for `confirmPin` needs it, including
                // when the digest is stale without a promotion (e.g. after removal).
                primaryUid: uid,
                ...(signInEmailSource ? { signInEmailSource } : {}),
                hasSchoolEmail: await hasLiveSchoolEmailAlias(identity),
                contactStale,
                canRemove: Boolean(identity.personalEmail) && !placeholderEscrow,
                hasServerConfirmedMethod: confirmed.length > 0,
                hasUserRecoveryMethod,
                pinState: pin.state,
                pinRecoverable,
                nextStep,
                pinChangeRequired,
                reconcilePending: needsReconcile(identity) || Boolean(drift),
            };
        }),
    /**
     * Finish what `getAccountContinuity` reports as `reconcilePending`: under the lock, demote a
     * promotion recorded as `demotePending` (a rebind, revoke or the login orphan guard could not
     * demote it) or left `pending` for over 10 minutes (an interrupted verify; its `email:`
     * reservation is released with it); or, with neither, repair drift
     * (`repairSignInEmailDrift`: T's Firebase email goes back to what the committed state
     * expects, and abandoned reservations are released). `changed` is false when there was
     * nothing to do.
     * `customToken` is for T when its Firebase email changed (T's sessions were revoked), as in
     * `removePersonalEmail`. A busy lock is `PRECONDITION_FAILED` (reason `busy`).
     */
    reconcilePersonalEmail: accountRoute
        .output(z.object({ changed: z.boolean(), customToken: z.string().optional() }))
        .mutation(async ({ ctx }) => {
            const { identity, userKey } = await resolveClassLinkContext(ctx.user.accountDid);
            const auth = getAdminAuth();
            if (!needsReconcile(identity) && !(await findSignInEmailDrift(auth, identity, userKey)))
                return { changed: false };
            return withAccountLock(ctx.user.accountDid, async lock => {
                const fresh = await findClassLinkIdentityByIdentityKey(identity.identityKey);
                if (!fresh) return { changed: false };
                if (!needsReconcile(fresh)) {
                    // Drift: T holds an address the committed state does not expect.
                    if (!auth) return { changed: false };
                    const account = (await findUserKeyByDid(userKey.primaryDid)) ?? userKey;
                    try {
                        const repaired = await repairSignInEmailDrift({
                            auth,
                            identityKey: fresh.identityKey,
                            userKey: account,
                            lock,
                        });
                        if (!repaired.changed || !repaired.uid) return { changed: false };
                        // An email change revokes T's sessions: sign this device back in.
                        return {
                            changed: true,
                            customToken: await auth.createCustomToken(repaired.uid),
                        };
                    } catch (error) {
                        console.warn('classlink.primary_email.reconcile_failed');
                        throw error;
                    }
                }
                try {
                    const { customToken } = await demotePersonalEmail({
                        auth,
                        identity: fresh,
                        userKey,
                        reason: fresh.demotePending?.reason ?? 'interrupted',
                        lock,
                    });
                    return { changed: true, ...(customToken ? { customToken } : {}) };
                } catch (error) {
                    console.warn('classlink.primary_email.reconcile_failed');
                    throw error;
                }
            });
        }),
    /**
     * Report a client-side sign-in to T (email link, Google, Apple, phone: they never reach
     * lca-api) with its Firebase ID token, so it counts as a recent sign-in for `start`,
     * `verify` and `remove` (`recordReportedSignIn`): the token must verify (not revoked), be
     * T's, carry an `auth_time` within the window, and not come from a custom token (verify and
     * remove hand those out; email-code and ClassLink sign-ins are recorded server-side).
     * `recorded` says whether a recent sign-in now counts; the app retries the refused call
     * only then. Rate-limited per account.
     */
    recordRecentSignIn: accountRoute
        .input(z.object({ idToken: z.string().min(1).max(8192) }))
        .output(z.object({ recorded: z.boolean() }))
        .mutation(async ({ input: { idToken }, ctx }) => {
            await consumeBudget(
                `classlink:rate:recent-sign-in:${sha256Hex(ctx.user.accountDid)}`,
                RECENT_SIGN_IN_REPORT_LIMIT,
                600,
                'Too many attempts. Please try again later.'
            );
            const { identity } = await resolveClassLinkContext(ctx.user.accountDid);
            const signIn = await verifyFirebaseSignIn(idToken);
            return { recorded: Boolean(signIn && (await recordReportedSignIn(identity, signIn))) };
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
     * Requires a recent sign-in (`assertRecentSignIn`, reason `recent_sign_in_required`).
     * Runs under the per-account lock with fencing. Every write is idempotent and the identity
     * update (`primaryEmail.state = 'active'`) comes last as the completion marker, a
     * compare-and-set on the pending record this call wrote (a miss is a lost race:
     * `PRECONDITION_FAILED`, reason `busy`), so a retry after a failure converges; a crash
     * leaves a `pending` record for the reconcile. The `email:` reservation is released on any
     * failure unless T's Firebase email already is the address. A set or changed sign-in email
     * sends `sign-in-email-changed` to the previous real addresses and the school (best effort).
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
                // account races the initial lookup. Subjects are immutable after insertion. The
                // reservation carries this call's token until it commits, so only this call (or
                // the demote of its pending record) can release it.
                const reservation = randomUUID();
                const subjectKey = `email:${email}`;
                await lock.assertHeld();
                await ensureAuthSubjectIndexes();
                let reserved = false;
                try {
                    reserved =
                        (
                            await getAuthSubjectsCollection().updateOne(
                                { identityKey: subjectKey },
                                {
                                    $setOnInsert: {
                                        identityKey: subjectKey,
                                        subject: identity.subject,
                                        email,
                                        emailVerified: true,
                                        createdAt: new Date(),
                                        lastLoginAt: new Date(),
                                        reservedBy: reservation,
                                    },
                                },
                                { upsert: true }
                            )
                        ).upsertedCount > 0;
                } catch (error) {
                    if (!isDuplicateKey(error)) throw error;
                }
                // An earlier attempt's reservation that never committed (still tokened, ours):
                // take it over, so this call releases it if it fails too.
                if (!reserved)
                    reserved =
                        (
                            await getAuthSubjectsCollection().updateOne(
                                {
                                    identityKey: subjectKey,
                                    subject: identity.subject,
                                    reservedBy: { $exists: true },
                                },
                                { $set: { reservedBy: reservation } }
                            )
                        ).modifiedCount > 0;

                /**
                 * Any failure before the completion write releases the reservation, so the
                 * address is not left blocked for other accounts, except while T's Firebase
                 * email is the address (a failure after the Firebase change: the pending record
                 * and the reservation stay for the retry or the reconcile) or the address was
                 * committed meanwhile. Never throws.
                 */
                const releaseUncommitted = async (): Promise<void> => {
                    if (!reserved) return;
                    try {
                        if (plan.kind === 'primary') {
                            const tUser = await getFirebaseUserOrUndefined(auth, plan.uid);
                            if (normalize(tUser?.email) === email) return;
                        }
                        const now = await findClassLinkIdentityByIdentityKey(identity.identityKey);
                        if (normalize(now?.personalEmail) === email && now?.personalEmailVerifiedAt)
                            return;
                        await releaseEmailReservation(email, identity.subject, reservation);
                    } catch {
                        console.warn('classlink.personal_email.release_failed');
                    }
                };

                let committed = false;
                let customToken: string | undefined;
                let record: ClassLinkPrimaryEmail | undefined;
                try {
                    const linked = await findAuthSubjectByIdentityKey(subjectKey);
                    if (!linked || linked.subject !== identity.subject) conflict();
                    await getOrCreateAuthSubjectLinkedTo(subjectKey, identity.subject, {
                        email,
                        emailVerified: true,
                    });

                    if (plan.kind === 'primary') {
                        let promoted: Awaited<ReturnType<typeof promotePersonalEmail>>;
                        try {
                            promoted = await promotePersonalEmail({
                                auth,
                                identity,
                                plan,
                                lock,
                                ...(reserved ? { reservedBy: reservation } : {}),
                            });
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
                            const { previous } = promoted;
                            if (
                                previous?.state === 'active' &&
                                previous.uid === plan.uid &&
                                previous.email !== email
                            ) {
                                // Changing an active address: put T back on the previous
                                // address and restore its record, rather than demoting.
                                await lock.assertHeld();
                                if (normalize((await auth.getUser(plan.uid)).email) === email) {
                                    await auth.updateUser(plan.uid, {
                                        email: previous.email,
                                        emailVerified: true,
                                    });
                                    const mine = record;
                                    await settleFirebaseEmailWrite({
                                        auth,
                                        lock,
                                        identityKey: identity.identityKey,
                                        uid: plan.uid,
                                        wrote: previous.email,
                                        stillOurs: stored => isSameRecord(stored, mine),
                                        fallback: mine,
                                    });
                                }
                                await rollbackPrimaryEmailRecord(
                                    identity.identityKey,
                                    record,
                                    previous
                                );
                            } else {
                                // Put Firebase back and drop the marker (and the reservation).
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
                            }
                            conflict();
                        }
                        if (userKey._id && normalize(userKey.recoveryEmail) === email)
                            await clearRecoveryEmailIfUnchanged(
                                userKey._id,
                                userKey.recoveryEmail as string
                            );
                        // An earlier attempt for this address may have changed T's email
                        // (revoking its sessions) and then failed: its retry still needs the
                        // token.
                        const retried =
                            identity.primaryEmail?.state === 'pending' &&
                            identity.primaryEmail.uid === plan.uid &&
                            normalize(identity.primaryEmail.email) === email;
                        if (promoted.firebaseChanged || retried)
                            customToken = await auth.createCustomToken(plan.uid);
                    }

                    // Release the replaced address, so it stops signing in to this account and
                    // is not left behind by account deletion (which only knows the current
                    // address). After the contact moved, so the guard no longer sees it as the
                    // contact.
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
                    // The completion marker, as a compare-and-set: the pending record this call
                    // wrote (or, for an alias, the personal email read at the start). A miss
                    // means the lock expired and another change ran: report the lost race and
                    // leave its writes alone.
                    await lock.assertHeld();
                    const completed = await updateClassLinkIdentity(
                        identity.identityKey,
                        {
                            personalEmail: email,
                            personalEmailVerifiedAt: new Date(),
                            ...(record ? { primaryEmail: activeRecord(record) } : {}),
                        },
                        record
                            ? {
                                  'primaryEmail.state': 'pending',
                                  'primaryEmail.at': record.at,
                                  'primaryEmail.email': record.email,
                                  'primaryEmail.uid': record.uid,
                              }
                            : {
                                  personalEmail: identity.personalEmail ?? { $exists: false },
                                  personalEmailVerifiedAt: identity.personalEmailVerifiedAt ?? {
                                      $exists: false,
                                  },
                              }
                    );
                    if (!completed) lockBusy();
                    committed = true;
                } finally {
                    if (!committed) await releaseUncommitted();
                }

                // Committed: the reservation is now a plain sign-in subject.
                if (reserved)
                    await getAuthSubjectsCollection()
                        .updateOne(
                            { identityKey: subjectKey, reservedBy: reservation },
                            { $unset: { reservedBy: '' } }
                        )
                        .catch(() => console.warn('classlink.personal_email.unreserve_failed'));
                // Earlier attempts' reservations nothing tracks any more: an address a failed
                // verify left on T that this change replaced, or one a retry took over before
                // failing. T and the contact are off them now (T keeps its own email on an
                // alias-only verify), so release them rather than leave them blocking the
                // address for every other account. Best effort.
                try {
                    const holder = await getFirebaseUserOrUndefined(auth, identity.firebaseUid);
                    await lock.assertHeld();
                    await releaseAbandonedEmailReservations(identity.subject, [
                        email,
                        holder?.email,
                    ]);
                } catch {
                    console.warn('classlink.personal_email.release_failed');
                }
                const audit = { tenantId: continuity.tenantId, policyHash: continuity.policyHash };
                logAccountContinuityEvent('verified', audit);
                if (record) logAccountContinuityEvent('primary_set', audit);
                // The sign-in email was set or changed: tell the previous addresses and the
                // school, never only the new address.
                const was = identity.primaryEmail;
                if (
                    record &&
                    plan.kind === 'primary' &&
                    !(was?.state === 'active' && was.uid === plan.uid && was.email === email)
                )
                    await notifySignInEmailChanged({
                        previous: [
                            plan.prevFirebaseEmail,
                            identity.personalEmail,
                            ...(was?.state === 'pending' && was.uid === plan.uid
                                ? [was.prevFirebaseEmail, was.replacedEmail]
                                : []),
                        ],
                        school: await getSchoolNoticeRecipients(userKey),
                        newEmail: email,
                        account: userKey,
                        tenant: ctx.tenant,
                    });
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
     * per-account lock as `verifyPersonalEmail` and requires the same recent sign-in
     * (`recent_sign_in_required`). Returns `customToken` for T when its Firebase email changed
     * (T's sessions were revoked). Removing an active sign-in email sends `sign-in-email-changed`
     * to the removed address and the school (best effort).
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
                if (record && hasUsableEscrow(userKey) && replacedPlaceholder(record))
                    throw new TRPCError({
                        code: 'PRECONDITION_FAILED',
                        message: 'This is how you sign in. You can switch to a different email.',
                        cause: { reason: 'placeholder_escrow' },
                    });
                await assertRecentSignIn(identity);
                let customToken: string | undefined;
                let account = userKey;
                // Read before the demote: the school only hears while the promotion is active.
                const school =
                    record?.state === 'active' ? await getSchoolNoticeRecipients(userKey) : [];
                if (record) {
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
                // Only clear the address this call removed, and only while no other change wrote
                // a new record (the demote above cleared this one): a compare-and-set behind the
                // lock, so a write that outlived it reports the lost race instead.
                await lock.assertHeld();
                const cleared = await getClassLinkIdentitiesCollection().updateOne(
                    {
                        identityKey: identity.identityKey,
                        personalEmail: identity.personalEmail ?? { $exists: false },
                        personalEmailVerifiedAt: identity.personalEmailVerifiedAt ?? {
                            $exists: false,
                        },
                        primaryEmail: { $exists: false },
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
                if (!cleared.matchedCount) lockBusy();
                logAccountContinuityEvent('removed', { tenantId: identity.tenantId });
                // The sign-in email went back: tell the removed address and the school.
                if (record?.state === 'active') {
                    const auth = getAdminAuth();
                    const restored = auth
                        ? await getFirebaseUserOrUndefined(auth, record.uid).catch(() => undefined)
                        : undefined;
                    await notifySignInEmailChanged({
                        previous: [record.email, address],
                        school,
                        newEmail: restored?.email,
                        account,
                        tenant: ctx.tenant,
                    });
                }
                return { ...done, ...(customToken ? { customToken } : {}) };
            })
        ),
};
