import { createHash, randomInt } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { didAndChallengeRoute } from '@routes';
import cache from '@cache';
import { getDel } from '@cache/getDel';
import { checkRateLimit } from '@helpers/rateLimit.helpers';
import { resolveClassLinkContext } from '@helpers/classlinkContext.helpers';
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
const validateEmail = async (did: string, email: string) => {
    const context = await resolveClassLinkContext(did);
    if (!context.tenant)
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'School settings are unavailable. Please try again later.',
        });
    if (
        context.tenant.allowedEmailDomains.some(
            domain => domain.toLowerCase() === email.split('@')[1]
        )
    ) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Use a personal email, not your school email',
        });
    }
    const existing = await findAuthSubjectByIdentityKey(`email:${email}`);
    if (existing && existing.subject !== context.identity.subject) conflict();
    return context;
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
            const { firebaseUid } = await validateEmail(ctx.user.did, email);
            if (!(await checkRateLimit(`classlink-personal-email-send:${ctx.user.did}`, 3, 600))) {
                throw new TRPCError({
                    code: 'TOO_MANY_REQUESTS',
                    message: 'Too many codes requested. Please try again later.',
                });
            }
            const code = randomInt(100000, 1000000).toString();
            const key = `classlink-personal-email:${firebaseUid}`;
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
            const { firebaseUid, identity } = await validateEmail(ctx.user.did, email);
            const key = `classlink-personal-email:${firebaseUid}`;
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
                const attemptKey = `classlink-personal-email-attempts:${firebaseUid}:${createHash('sha256').update(stored).digest('hex')}`;
                if (!(await checkRateLimit(attemptKey, 4, 300))) {
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
