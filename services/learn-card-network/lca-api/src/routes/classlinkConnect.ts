import { createHash } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { environment } from '@environment';
import { didAndChallengeRoute } from '@routes';
import app from '../firebase';
import { getClassLinkConfig, getClassLinkTenant } from '@helpers/classlink.config';
import { ClassLinkProviderUnavailable, ClassLinkTokenInvalid } from '@helpers/classlink.errors';
import {
    classLinkExchangeInput,
    isClassLinkStudent,
    verifyClassLinkExchange,
} from '@helpers/classlinkExchange.helpers';
import { resolveStateStudentId } from '@helpers/classlink.stateId';
import { classLinkFirebaseUid, sealStateStudentId } from '@helpers/classlinkPii.helpers';
import { releaseClassLinkFirebaseEmail } from '@helpers/classlinkFirebaseUser.helpers';
import {
    findClassLinkIdentitiesForAccount,
    getAccountDids,
} from '@helpers/classlinkContext.helpers';
import { clearNotStudentCache } from '@accesslayer/preferences/privacyLock';
import { isSyntheticEmail } from '@helpers/syntheticEmail.helpers';
import { isRateLimited, recordFailure } from '@helpers/rate-limit.helpers';
import {
    findAuthSubjectByIdentityKey,
    getOrCreateAuthSubject,
    getOrCreateAuthSubjectLinkedTo,
} from '../models/AuthSubject';
import {
    findClassLinkIdentityByIdentityKey,
    upsertClassLinkIdentity,
} from '../models/ClassLinkIdentity';
import { enforceMinorPreferences } from '../models/Preferences';
import { findUserKeyByDid, type MongoUserKeyType } from '../models/UserKey';

const FAILURE = 'Your school account could not be connected. Please try again.';

const refusal = (code: 'CONFLICT' | 'PRECONDITION_FAILED', message: string): TRPCError =>
    new TRPCError({ code, message });

const getFirebaseUid = (userKey: MongoUserKeyType | null): string | undefined =>
    userKey?.authProviders.find(provider => provider.type === 'firebase')?.id;

/** Failed connects allowed per DID per 10-minute window; only invalid tokens/codes count. */
const CONNECT_FAILURE_LIMIT = 20;

/** The account's existing sign-in subject, so a later account system sees one person. */
const findAccountSubject = async (userKey: MongoUserKeyType): Promise<string | undefined> => {
    const { contactMethod } = userKey;
    if (contactMethod?.type !== 'email') return undefined;
    const record = await findAuthSubjectByIdentityKey(
        `email:${contactMethod.value.trim().toLowerCase()}`
    );
    return record?.subject;
};

const connectionOutput = z.object({
    available: z.boolean(),
    canConnect: z.boolean(),
    connected: z.boolean(),
    isStudent: z.boolean(),
    schoolName: z.string().optional(),
    lastConnectedAt: z.string().optional(),
});

export const connectProcedures = {
    /** Whether School Connect can be used by this account, and its current connection. */
    getConnection: didAndChallengeRoute
        .input(z.object({}).strict().optional())
        .output(connectionOutput)
        .query(async ({ ctx }) => {
            const config = getClassLinkConfig();
            const userKey = await findUserKeyByDid(ctx.user.did);
            const firebaseUid = getFirebaseUid(userKey);
            const identity = userKey
                ? ((await findClassLinkIdentitiesForAccount(userKey))[0] ?? null)
                : null;
            const schoolName =
                identity && config
                    ? getClassLinkTenant(config, identity.tenantId).displayName || undefined
                    : undefined;
            return {
                available: Boolean(config),
                canConnect: Boolean(config && (firebaseUid || identity)),
                connected: Boolean(identity),
                isStudent: identity?.isMinorHint === true,
                ...(schoolName ? { schoolName } : {}),
                ...(identity ? { lastConnectedAt: identity.lastAuthTime.toISOString() } : {}),
            };
        }),

    /**
     * Connect a ClassLink school account to the signed-in account, or refresh an existing
     * connection. Never changes who is signed in. Students get the minor privacy settings.
     */
    connect: didAndChallengeRoute
        .input(classLinkExchangeInput)
        .output(z.object({ isStudent: z.boolean(), schoolName: z.string().optional() }))
        .mutation(async ({ input, ctx }) => {
            const rateKey = `classlink:rate:connect:${createHash('sha256')
                .update(ctx.user.did)
                .digest('hex')}`;
            if (await isRateLimited(rateKey, CONNECT_FAILURE_LIMIT)) {
                throw new TRPCError({
                    code: 'TOO_MANY_REQUESTS',
                    message: 'Too many attempts. Please try again later.',
                });
            }
            try {
                const userKey = await findUserKeyByDid(ctx.user.did);
                const firebaseUid = getFirebaseUid(userKey);
                // Identities already linked to this account by uid, Keycloak subject or DID.
                const accountIdentities = userKey
                    ? await findClassLinkIdentitiesForAccount(userKey)
                    : [];
                if (!userKey || (!firebaseUid && !accountIdentities.length)) {
                    throw refusal(
                        'PRECONDITION_FAILED',
                        "School Connect isn't available for your account yet."
                    );
                }
                const { config, claims, tenantId, tenant, identityKey } =
                    await verifyClassLinkExchange(input);

                const existing = await findClassLinkIdentityByIdentityKey(identityKey);
                const ownsExisting =
                    existing !== null &&
                    ((firebaseUid !== undefined && existing.firebaseUid === firebaseUid) ||
                        accountIdentities.some(item => item.identityKey === identityKey));
                if (existing && !ownsExisting) {
                    console.warn('classlink.connect.conflict', {
                        tenantId,
                        reason: 'other_account',
                    });
                    throw refusal(
                        'CONFLICT',
                        'This school account is already connected to a different LearnCard account.'
                    );
                }
                const current = accountIdentities.find(item => item.identityKey !== identityKey);
                if (current) {
                    console.warn('classlink.connect.conflict', {
                        tenantId,
                        reason: 'other_school',
                    });
                    throw refusal(
                        'CONFLICT',
                        'Your account is already connected to a different school account.'
                    );
                }

                // Refreshing after a recovery rebind moves the identity to the account's
                // current Firebase uid; an account without one keeps the stored uid.
                const uid = firebaseUid ?? existing?.firebaseUid;
                if (!uid) {
                    throw refusal(
                        'PRECONDITION_FAILED',
                        "School Connect isn't available for your account yet."
                    );
                }
                const claimed = (claims.email?.trim() || claims.or_email?.trim())?.toLowerCase();
                const email = claimed && !isSyntheticEmail(claimed) ? claimed : undefined;
                // Same trust rule as sign-in: a district-asserted email is only treated as
                // verified for an allowlisted domain without email_verified: false.
                const emailTrusted =
                    email !== undefined &&
                    tenant.allowedEmailDomains.some(
                        domain => domain.toLowerCase() === email.split('@')[1]
                    ) &&
                    claims.email_verified !== false;
                const attrs = {
                    ...(emailTrusted ? { email } : {}),
                    emailVerified: emailTrusted,
                };
                let subject = existing?.subject;
                if (!subject) {
                    const accountSubject = await findAccountSubject(userKey);
                    const linked = accountSubject
                        ? await getOrCreateAuthSubjectLinkedTo(identityKey, accountSubject, attrs)
                        : await getOrCreateAuthSubject(identityKey, attrs);
                    if (accountSubject && linked.subject !== accountSubject) {
                        console.warn('classlink.connect.conflict', {
                            tenantId,
                            reason: 'subject',
                        });
                        throw refusal(
                            'CONFLICT',
                            'This school account is already connected to a different LearnCard account.'
                        );
                    }
                    subject = linked.subject;
                }

                const isStudent = existing?.isMinorHint === true || isClassLinkStudent(claims);
                const lastAuthTime = new Date(claims.iat * 1000);
                await upsertClassLinkIdentity({
                    identityKey,
                    tenantId,
                    sub: claims.sub,
                    role: claims.classLink_role ?? '',
                    ...(email ? { email } : {}),
                    sealedStateStudentId: sealStateStudentId(
                        await resolveStateStudentId(claims, tenant),
                        identityKey,
                        lastAuthTime,
                        config.maxAuthAgeSeconds
                    ),
                    state: tenant.state,
                    firebaseUid: uid,
                    subject,
                    ...(userKey.primaryDid ? { primaryDid: userKey.primaryDid } : {}),
                    lastAuthTime,
                    isMinorHint: isStudent,
                });
                // Moving off the identity's deterministic Firebase user: that user may still hold
                // the trusted school email, which would otherwise keep resolving to it.
                if (
                    existing &&
                    existing.firebaseUid !== uid &&
                    existing.firebaseUid === classLinkFirebaseUid(identityKey)
                ) {
                    const auth = environment.IS_E2E_TEST ? undefined : app?.auth();
                    if (auth) await releaseClassLinkFirebaseEmail(auth, identityKey);
                }
                if (isStudent) await enforceMinorPreferences(ctx.user.did);
                // Other DIDs of this account may hold a cached "not a student" answer.
                await Promise.all(getAccountDids(userKey).map(clearNotStudentCache));
                return {
                    isStudent,
                    ...(tenant.displayName ? { schoolName: tenant.displayName } : {}),
                };
            } catch (error) {
                // Only invalid tokens or codes count toward the limit; outages and refusals don't.
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
                console.error('classlink.connect.failed', {
                    ...(error instanceof Error ? { name: error.name } : {}),
                });
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: FAILURE });
            }
        }),
};
