import { createHash } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { didAndChallengeRoute } from '@routes';
import { getClassLinkConfig, getClassLinkTenant } from '@helpers/classlink.config';
import { ClassLinkTokenInvalid } from '@helpers/classlink.errors';
import {
    classLinkExchangeInput,
    isClassLinkStudent,
    verifyClassLinkExchange,
} from '@helpers/classlinkExchange.helpers';
import { resolveStateStudentId } from '@helpers/classlink.stateId';
import { sealStateStudentId } from '@helpers/classlinkPii.helpers';
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
} from '../models/ClassLinkIdentity';
import { enforceMinorPreferences } from '../models/Preferences';
import { findUserKeyByDid, type MongoUserKeyType } from '../models/UserKey';

const FAILURE = 'Your school account could not be connected. Please try again.';

const refusal = (code: 'CONFLICT' | 'PRECONDITION_FAILED', message: string): TRPCError =>
    new TRPCError({ code, message });

const getFirebaseUid = (userKey: MongoUserKeyType | null): string | undefined =>
    userKey?.authProviders.find(provider => provider.type === 'firebase')?.id;

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
            const firebaseUid = getFirebaseUid(await findUserKeyByDid(ctx.user.did));
            const identity = firebaseUid
                ? await findClassLinkIdentityByFirebaseUid(firebaseUid)
                : null;
            const schoolName =
                identity && config
                    ? getClassLinkTenant(config, identity.tenantId).displayName || undefined
                    : undefined;
            return {
                available: Boolean(config),
                canConnect: Boolean(config && firebaseUid),
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
            if (await isRateLimited(rateKey, 20)) {
                throw new TRPCError({
                    code: 'TOO_MANY_REQUESTS',
                    message: 'Too many attempts. Please try again later.',
                });
            }
            try {
                const userKey = await findUserKeyByDid(ctx.user.did);
                const firebaseUid = getFirebaseUid(userKey);
                if (!userKey || !firebaseUid) {
                    throw refusal(
                        'PRECONDITION_FAILED',
                        "School Connect isn't available for your account yet."
                    );
                }
                const uid = firebaseUid;
                const { config, claims, tenantId, tenant, identityKey } =
                    await verifyClassLinkExchange(input);

                const existing = await findClassLinkIdentityByIdentityKey(identityKey);
                if (existing && existing.firebaseUid !== uid) {
                    console.warn('classlink.connect.conflict', {
                        tenantId,
                        reason: 'other_account',
                    });
                    throw refusal(
                        'CONFLICT',
                        'This school account is already connected to a different LearnCard account.'
                    );
                }
                const current = await findClassLinkIdentityByFirebaseUid(uid);
                if (current && current.identityKey !== identityKey) {
                    console.warn('classlink.connect.conflict', {
                        tenantId,
                        reason: 'other_school',
                    });
                    throw refusal(
                        'CONFLICT',
                        'Your account is already connected to a different school account.'
                    );
                }

                const email = (claims.email?.trim() || claims.or_email?.trim())?.toLowerCase();
                const attrs = {
                    ...(email ? { email } : {}),
                    emailVerified: claims.email_verified !== false && Boolean(email),
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
                    email: email ?? existing?.email ?? '',
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
                    isMinorHint: isStudent,
                });
                if (isStudent) await enforceMinorPreferences(ctx.user.did);
                return {
                    isStudent,
                    ...(tenant.displayName ? { schoolName: tenant.displayName } : {}),
                };
            } catch (error) {
                await recordFailure(rateKey);
                if (error instanceof ClassLinkTokenInvalid) throw error;
                if (
                    error instanceof TRPCError &&
                    ['CONFLICT', 'BAD_REQUEST', 'PRECONDITION_FAILED'].includes(error.code)
                )
                    throw error;
                // Provider and database errors may contain secrets or PII. Do not retain their cause.
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: FAILURE });
            }
        }),
};
