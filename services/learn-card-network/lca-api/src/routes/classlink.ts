/**
 * Today, ClassLink sign-in bypasses Keycloak entirely: lca-api verifies the
 * ClassLink `id_token` directly and hands the app a Firebase custom token. Once
 * Keycloak becomes the primary broker in front of lca-api, ClassLink sign-in
 * would instead terminate in a short-lived lca-api login ticket rather than
 * a Firebase custom token. The flow: the student completes ClassLink's OIDC
 * code exchange against lca-api as today (code → `id_token` verification →
 * state-ID resolution), but instead of minting a Firebase token lca-api issues
 * a one-time ticket scoped to that user's stable
 * `identityKey = classlink:<tenant_id>:v1:<digest>`. The browser/app is then
 * redirected into Keycloak's existing `lca-api` identity-provider broker
 * (the same broker already used for native email/social sign-in — no new
 * ClassLink-specific Keycloak identity provider or Terraform module is needed)
 * and redeems that ticket as the broker's federation credential. Keycloak
 * resolves it to a local Keycloak user via the federated-identity record whose
 * `userId` equals the person's `AuthSubject.subject` — and because
 * `provision:keycloak` already pre-seeds that federated link for
 * ClassLink-only users by resolving their `subject` through `ClassLinkIdentity`
 * when no `email:` AuthSubject exists, the broker exchange lands on the same
 * account the wallet already uses, with no double-subject and no new identity
 * provider to provision or maintain.
 */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { environment } from '@environment';
import { didAndChallengeRoute, openRoute, t } from '@routes';
import app from '../firebase';
import { getClassLinkDiscovery } from '@helpers/classlink.helpers';
import {
    classLinkExchangeInput,
    classLinkNonce,
    classLinkRedirectUri,
    isClassLinkStudent,
    requireClassLinkConfig,
    verifyClassLinkExchange,
} from '@helpers/classlinkExchange.helpers';
import { ClassLinkProviderUnavailable, ClassLinkTokenInvalid } from '@helpers/classlink.errors';
import { resolveStateStudentId } from '@helpers/classlink.stateId';
import { classLinkFirebaseUid, sealStateStudentId } from '@helpers/classlinkPii.helpers';
import { maybeClearExpiredStateStudentIds } from '@helpers/classlinkCleanup.helpers';
import {
    findClassLinkIdentityForAccount,
    getAccountDids,
    recordClassLinkIdentityDid,
} from '@helpers/classlinkContext.helpers';
import { clearNotStudentCache } from '@accesslayer/preferences/privacyLock';
import { deleteClassLinkDataForAccount } from '@helpers/classlinkDeletion.helpers';
import { isSyntheticEmail } from '@helpers/syntheticEmail.helpers';
import {
    ensureClassLinkFirebaseUser,
    firebaseErrorCode,
    releaseClassLinkFirebaseEmail,
} from '@helpers/classlinkFirebaseUser.helpers';
import { isRateLimited, recordFailure } from '@helpers/rate-limit.helpers';
import {
    findAuthSubjectByIdentityKey,
    getOrCreateAuthSubject,
    getOrCreateAuthSubjectLinkedTo,
} from '../models/AuthSubject';
import {
    findClassLinkIdentityByFirebaseUid,
    findClassLinkIdentityByIdentityKey,
    upsertClassLinkIdentity,
    type MongoClassLinkIdentityType,
} from '../models/ClassLinkIdentity';
import { findUserKeyByAuthProvider, findUserKeyByDid } from '../models/UserKey';
import { enforceMinorPreferences } from '../models/Preferences';
import { personalEmailProcedures } from './classlinkPersonalEmail';
import { connectProcedures } from './classlinkConnect';

/**
 * Failed exchanges allowed per client IP per 10-minute window. Only failures that suggest
 * abuse (invalid or forged tokens, bad codes, nonce/PKCE mismatch) count, and the ceiling
 * is high because a whole school can share one NAT address.
 */
export const CLASSLINK_EXCHANGE_FAILURE_LIMIT = 200;

/** Shown when the school account's email already belongs to a LearnCard account. */
export const CLASSLINK_EMAIL_ACCOUNT_CONFLICT_MESSAGE =
    'You already have a LearnCard account with this email. Sign in the way you usually do, then connect your school account from School Connect.';

/** Shown when the account is already connected to a different school account. */
export const CLASSLINK_OTHER_SCHOOL_CONFLICT_MESSAGE =
    'This LearnCard account is already connected to a different school account.';

/**
 * Shown when the identity's Firebase uid was unlinked from its account (a recovery rebind or
 * "Secure my account") and the account still signs in with Firebase. School Connect from that
 * login moves the identity to it, with proof of ownership.
 */
export const CLASSLINK_ACCOUNT_MOVED_MESSAGE =
    'Your school account is connected to a LearnCard account that now signs in another way. Sign in the way you usually do, then reconnect your school account from School Connect.';

/**
 * Shown when the identity's Firebase uid was unlinked and the account has no Firebase login
 * (e.g. Keycloak only). School Connect cannot restore ClassLink sign-in for it, so it is not
 * suggested.
 */
export const CLASSLINK_ACCOUNT_MOVED_NO_FIREBASE_MESSAGE =
    'Your school account is connected to a LearnCard account that now signs in another way. Sign in the way you usually do.';

type ConflictReason = 'email_account' | 'other_school';

const conflict = (tenantId: string, reason: ConflictReason): never => {
    console.warn('classlink.link.conflict', { tenantId, reason });
    throw new TRPCError({
        code: 'CONFLICT',
        message:
            reason === 'other_school'
                ? CLASSLINK_OTHER_SCHOOL_CONFLICT_MESSAGE
                : CLASSLINK_EMAIL_ACCOUNT_CONFLICT_MESSAGE,
    });
};

/** Error name and code only, so unexpected failures can be alerted on without PII. */
const safeErrorDetail = (error: unknown): Record<string, unknown> => {
    const detail: Record<string, unknown> = {};
    if (error instanceof Error) detail.name = error.name;
    const code = firebaseErrorCode(error);
    if (typeof code === 'string' || typeof code === 'number') detail.code = code;
    return detail;
};

/** The school email from verified claims, or undefined when absent, malformed or reserved. */
const getSchoolEmail = (claims: { email?: string; or_email?: string }): string | undefined => {
    const email = (claims.email?.trim() || claims.or_email?.trim())?.toLowerCase();
    if (!email || !z.string().email().safeParse(email).success || isSyntheticEmail(email))
        return undefined;
    return email;
};

/**
 * Refuse to give an existing account a second ClassLink identity. Same rule as School
 * Connect's `other_school`: one ClassLink identity per account, checked both by Firebase uid
 * and by everything else that identifies the account (Keycloak subject, recorded DID).
 */
const assertNoOtherClassLinkIdentity = async (
    firebaseUid: string,
    identityKey: string,
    tenantId: string
): Promise<void> => {
    const byUid = await findClassLinkIdentityByFirebaseUid(firebaseUid);
    if (byUid && byUid.identityKey !== identityKey) conflict(tenantId, 'other_school');
    const userKey = await findUserKeyByAuthProvider('firebase', firebaseUid);
    const byAccount = userKey ? await findClassLinkIdentityForAccount(userKey) : null;
    if (byAccount && byAccount.identityKey !== identityKey) conflict(tenantId, 'other_school');
};

/**
 * Fail closed when a known identity's Firebase uid was deliberately unlinked from its account.
 * A recovery rebind or "Secure my account" (`keys.revokeOtherDevices`) removes the
 * deterministic uid from the UserKey. If the account recorded in `primaryDid` still exists,
 * signing in to the orphaned uid would mint an empty wallet (or reach a fresh wallet someone
 * already made for that uid, which must not be treated as the identity's account), and
 * signing in to the account's current uid would silently undo the owner's revoke. Neither happens: no token is minted and
 * the identity is left as is. The owner re-links from School Connect while signed in.
 */
const assertIdentityAccountNotMoved = async (
    identity: Pick<MongoClassLinkIdentityType, 'firebaseUid' | 'primaryDid'>,
    tenantId: string
): Promise<void> => {
    if (!identity.primaryDid) return;
    const uidAccount = await findUserKeyByAuthProvider('firebase', identity.firebaseUid);
    if (uidAccount && getAccountDids(uidAccount).includes(identity.primaryDid)) return;
    // The uid has no account, or a different one (a fresh wallet made for the uid after the
    // owner's rebind/revoke): either way the uid no longer leads to the recorded account.
    const account = await findUserKeyByDid(identity.primaryDid);
    if (!account) return;
    const hasFirebase = account.authProviders?.some(provider => provider.type === 'firebase');
    console.warn('classlink.identity.account_moved', { tenantId });
    throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: hasFirebase
            ? CLASSLINK_ACCOUNT_MOVED_MESSAGE
            : CLASSLINK_ACCOUNT_MOVED_NO_FIREBASE_MESSAGE,
    });
};

/**
 * For a trusted, verified school email, make sure `email:<address>` resolves to this
 * person's subject, so a later email-code (Keycloak) sign-in lands on the same account.
 * An existing record is never changed; a different subject is only logged.
 */
const linkTrustedEmailSubject = async (
    email: string,
    subject: string,
    tenantId: string
): Promise<void> => {
    const identityKey = `email:${email}`;
    const existing = await findAuthSubjectByIdentityKey(identityKey);
    const record =
        existing ??
        (await getOrCreateAuthSubjectLinkedTo(identityKey, subject, {
            email,
            emailVerified: true,
        }));
    if (record.subject !== subject) console.warn('classlink.email_subject.mismatch', { tenantId });
};

export const classlinkRouter = t.router({
    ...personalEmailProcedures,
    ...connectProcedures,
    getAuthorizeUrl: openRoute
        .input(
            z
                .object({
                    redirectUri: classLinkRedirectUri,
                    codeChallenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
                    state: z.string().min(1).max(512),
                    nonce: classLinkNonce,
                })
                .strict()
        )
        .output(z.object({ url: z.string() }))
        .mutation(async ({ input }) => {
            const config = requireClassLinkConfig(input.redirectUri);
            const discovery = await getClassLinkDiscovery();
            const url = new URL(discovery.authorization_endpoint);
            url.search = new URLSearchParams({
                response_type: 'code',
                client_id: config.clientId,
                scope: 'openid profile email',
                redirect_uri: input.redirectUri,
                code_challenge: input.codeChallenge,
                code_challenge_method: 'S256',
                state: input.state,
                nonce: input.nonce,
            }).toString();
            return { url: url.toString() };
        }),
    exchangeCode: openRoute
        .input(classLinkExchangeInput)
        .output(z.object({ token: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const rateKey = `classlink:rate:exchange:${ctx.clientIp ?? 'unknown'}`;
            if (await isRateLimited(rateKey, CLASSLINK_EXCHANGE_FAILURE_LIMIT)) {
                throw new TRPCError({
                    code: 'TOO_MANY_REQUESTS',
                    message: 'Too many sign-in attempts. Please try again later.',
                });
            }
            try {
                const { config, claims, tenantId, tenant, identityKey } =
                    await verifyClassLinkExchange(input);
                // A missing email no longer blocks sign-in: the account gets a synthetic one.
                const email = getSchoolEmail(claims);
                const emailTrusted =
                    email !== undefined &&
                    tenant.allowedEmailDomains.some(
                        domain => domain.toLowerCase() === email.split('@')[1]
                    ) &&
                    claims.email_verified !== false;
                const existing = await findClassLinkIdentityByIdentityKey(identityKey);
                const auth = environment.IS_E2E_TEST ? undefined : app?.auth();
                if (!environment.IS_E2E_TEST && !auth)
                    throw new Error('Authentication unavailable');
                // Lookup before the verification guard so an unsafe existing-email join is CONFLICT.
                const emailUser =
                    auth && email
                        ? await auth.getUserByEmail(email).catch((error: unknown) => {
                              if (firebaseErrorCode(error) === 'auth/user-not-found')
                                  return undefined;
                              throw error;
                          })
                        : undefined;
                // The identity's own deterministic Firebase user is never "someone else": it
                // can still hold the school email after School Connect moved the identity to the
                // account's post-rebind uid, or after the identity row was deleted.
                const ownUid = classLinkFirebaseUid(identityKey);
                const otherEmailUser = emailUser?.uid === ownUid ? undefined : emailUser;
                if (existing) await assertIdentityAccountNotMoved(existing, tenantId);
                const existingUid = existing?.firebaseUid;
                // A known identity always signs in to its own account. If another Firebase user
                // (e.g. an email-code or Google account) holds its trusted school email, only
                // the email upgrade and email-subject link are skipped.
                const emailHeldElsewhere = Boolean(
                    existingUid &&
                    emailTrusted &&
                    otherEmailUser &&
                    otherEmailUser.uid !== existingUid
                );
                if (emailHeldElsewhere) console.warn('classlink.email.collision', { tenantId });
                if (!existing && otherEmailUser) {
                    // Join an existing email account only for a trusted domain and verified email.
                    if (!emailTrusted || !otherEmailUser.emailVerified)
                        conflict(tenantId, 'email_account');
                    await assertNoOtherClassLinkIdentity(otherEmailUser.uid, identityKey, tenantId);
                }
                const displayName = typeof claims.name === 'string' ? claims.name : undefined;
                const attrs = {
                    ...(emailTrusted ? { email } : {}),
                    emailVerified: emailTrusted,
                    displayName,
                };
                const joined = !existing && otherEmailUser ? otherEmailUser.uid : undefined;
                const uid = existingUid ?? joined ?? ownUid;
                // The identity moved off its deterministic user, which still holds the school
                // email: release it so the email resolves to no stale account.
                if (auth && existing && uid !== ownUid && emailUser?.uid === ownUid)
                    await releaseClassLinkFirebaseEmail(auth, identityKey);
                if (auth && uid !== joined)
                    await ensureClassLinkFirebaseUser(auth, uid, {
                        identityKey,
                        displayName,
                        trustedEmail: emailTrusted && !emailHeldElsewhere ? email : undefined,
                        // The deterministic user can outlive its identity row (deleteMyData).
                        isNew: !existing && emailUser?.uid !== ownUid,
                    });
                let subject = existing?.subject;
                if (!subject) {
                    const emailSubject = emailTrusted
                        ? await findAuthSubjectByIdentityKey(`email:${email}`)
                        : null;
                    subject = (
                        emailSubject
                            ? await getOrCreateAuthSubjectLinkedTo(
                                  identityKey,
                                  emailSubject.subject,
                                  attrs
                              )
                            : await getOrCreateAuthSubject(identityKey, attrs)
                    ).subject;
                }
                if (emailTrusted && email && !emailHeldElsewhere)
                    await linkTrustedEmailSubject(email, subject, tenantId);
                // Time of this verified sign-in. ClassLink's auth_time is the start of the
                // ClassLink session and does not move on later sign-ins, so it cannot prove
                // freshness; iat is checked to be within five minutes of now.
                const lastAuthTime = new Date(claims.iat * 1000);
                const isStudent = existing?.isMinorHint === true || isClassLinkStudent(claims);
                await upsertClassLinkIdentity({
                    identityKey,
                    tenantId,
                    sub: claims.sub,
                    role: claims.classLink_role ?? '',
                    // The real school email (trusted or not), never the synthetic address.
                    ...(email ? { email } : {}),
                    // Kept only for the transcript sign-in window, encrypted.
                    sealedStateStudentId: sealStateStudentId(
                        await resolveStateStudentId(claims, tenant),
                        identityKey,
                        lastAuthTime,
                        config.maxAuthAgeSeconds
                    ),
                    state: tenant.state,
                    firebaseUid: uid,
                    subject,
                    lastAuthTime,
                    // Preferences require a DID; apply this hint when the account first binds one.
                    isMinorHint: isStudent,
                });
                const hintChanged = !existing || existing.isMinorHint !== isStudent;
                const accountKey =
                    hintChanged || !existing?.primaryDid
                        ? await findUserKeyByAuthProvider('firebase', uid)
                        : null;
                // Record the account's DID now (fill-only), rather than on first use of a
                // ClassLink feature: once recorded, a fresh wallet made for this uid after a
                // later recovery rebind or revoke is not treated as the identity's owner.
                if (accountKey && !existing?.primaryDid)
                    await recordClassLinkIdentityDid({ identityKey }, accountKey);
                if (hintChanged) {
                    // The account gained a ClassLink identity (new, joined or re-created after
                    // deleteMyData) or its student hint changed: drop any cached "not a student"
                    // answer so its privacy lock applies on the next read.
                    if (accountKey) {
                        const accountDids = getAccountDids(accountKey);
                        // A stored lock, not an empty cache, is the guarantee: a preferences
                        // read racing this sign-in could re-cache a stale "not a student".
                        if (isStudent)
                            await Promise.all(accountDids.map(d => enforceMinorPreferences(d)));
                        await Promise.all(accountDids.map(clearNotStudentCache));
                    }
                }
                await maybeClearExpiredStateStudentIds();
                return {
                    token: auth
                        ? await auth.createCustomToken(uid, {
                              classlink: true,
                              // Lets onboarding show student privacy settings before the account exists.
                              ...(isStudent ? { classlinkStudent: true } : {}),
                          })
                        : `classlink-e2e-${uid}`,
                };
            } catch (error) {
                // Only failures that suggest abuse count toward the per-IP limit.
                if (error instanceof ClassLinkTokenInvalid) {
                    await recordFailure(rateKey);
                    throw error;
                }
                if (error instanceof ClassLinkProviderUnavailable) throw error;
                if (
                    error instanceof TRPCError &&
                    ['CONFLICT', 'BAD_REQUEST', 'PRECONDITION_FAILED'].includes(error.code)
                )
                    throw error;
                // Provider and database errors may contain secrets or PII: log only the
                // error name/code and never retain the cause.
                console.error('classlink.exchange.failed', safeErrorDetail(error));
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'School sign-in could not be completed. Please try again.',
                });
            }
        }),
    /**
     * Delete the caller's ClassLink data (identities, their AuthSubjects, personal-email
     * subject when safe, transcript requests). Idempotent, and still works after the
     * account's Firebase user or UserKey is gone: it then matches by the caller's DID.
     */
    deleteMyData: didAndChallengeRoute
        .input(z.object({}).strict().optional())
        .output(z.object({ deleted: z.number().int().nonnegative() }))
        .mutation(async ({ ctx }) => {
            const userKey = await findUserKeyByDid(ctx.user.did);
            const result = await deleteClassLinkDataForAccount(
                userKey ?? { authProviders: [], primaryDid: ctx.user.did, linkedDids: [] },
                // The lock is lifted only after the account's key is gone (account deletion).
                { clearPrivacyLock: !userKey }
            );
            return { deleted: result.identities + result.transcriptRequests };
        }),
});
