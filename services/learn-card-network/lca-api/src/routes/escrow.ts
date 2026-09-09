import { timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { environment } from '@environment';
import { t, openRoute, didAndChallengeRoute } from '@routes';
import { createRecoverySession } from '@cache/recoverySessions';
import { decryptAuthShare } from '@helpers/shareEncryption.helpers';
import {
    EscrowEnvelopeValidator,
    EscrowBlobValidator,
    ServerEncryptedShareValidator,
    findUserKeyByAuthProvider,
    findAuthShareByVersion,
    isRecoveryMethodConfirmed,
    setEscrowBlobByAuthProvider,
    clearEscrowByAuthProvider,
    setEscrowOptInByAuthProvider,
    createEscrowHold,
    createEscrowHoldsIndexes,
    findPendingEscrowHoldByAuthProvider,
    findEscrowHoldById,
    cancelEscrowHold,
    completeEscrowHold,
    expireStaleEscrowHolds,
    hashEscrowResumeToken,
    generateEscrowResumeToken,
    type EscrowHold,
    type MongoUserKeyType,
    type AuthProviderMapping,
} from '@models';
import {
    AuthInputValidator,
    AuthProviderTypeValidator,
    RecoverySessionTokenValidator,
    verifyAndGetContactMethod,
    requireUserKey,
    assertDidOwner,
    requireRecoverySession,
} from './keys';
import {
    getEscrowEnclave,
    getEscrowHoldDurationMs,
    notifyEscrowHoldEvent,
    EscrowPolicyError,
    EscrowBlobError,
    EscrowUnavailableError,
} from '../services/escrow-enclave';

const unavailableMessage = 'Automatic recovery is not available for this account.';
const invalidMessage = 'This recovery request is no longer valid.';
let holdIndexes: Promise<void> | undefined;

// Lambda and in-process callers do not run docker-entry's index initialization.
const ensureHoldIndexes = async (): Promise<void> => {
    holdIndexes ??= createEscrowHoldsIndexes().catch(() => {
        holdIndexes = undefined;
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Recovery could not be started.',
        });
    });
    await holdIndexes;
};
const successValidator = z.object({ success: z.literal(true) });
const resumeInput = z
    .object({
        holdId: z.string().uuid(),
        resumeToken: z.string().min(1).max(512),
    })
    .strict();
const holdStatusValidator = z.object({
    holdId: z.string(),
    status: z.enum(['pending', 'cancelled', 'completed', 'expired']),
    requestedAt: z.string(),
    releaseAfter: z.string(),
    cancelledAt: z.string().optional(),
    completedAt: z.string().optional(),
});

const serializeHold = (hold: EscrowHold): z.infer<typeof holdStatusValidator> => ({
    holdId: hold._id,
    status: hold.status,
    requestedAt: hold.requestedAt.toISOString(),
    releaseAfter: hold.releaseAfter.toISOString(),
    ...(hold.cancelledAt ? { cancelledAt: hold.cancelledAt.toISOString() } : {}),
    ...(hold.completedAt ? { completedAt: hold.completedAt.toISOString() } : {}),
});

const resumeTokenMatches = (hold: EscrowHold, token: string): boolean => {
    const actual = Buffer.from(hashEscrowResumeToken(token), 'hex');
    const expected = Buffer.from(hold.resumeTokenHash, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
};

const hasConfirmedEscrow = (userKey: MongoUserKeyType, version: number): boolean =>
    userKey.recoveryMethods.some(
        method =>
            method.type === 'escrow' &&
            method.shareVersion === version &&
            isRecoveryMethodConfirmed(userKey, method)
    );

/** Never propagate enclave internals (or cryptographic payloads) into tRPC errors. */
const enclaveOperation = async <T>(operation: () => Promise<T>, enrolling = false): Promise<T> => {
    try {
        return await operation();
    } catch (error) {
        if (error instanceof EscrowUnavailableError) {
            throw new TRPCError({
                code: 'PRECONDITION_FAILED',
                message: 'Escrow recovery is not available.',
            });
        }
        if (error instanceof EscrowPolicyError) {
            throw new TRPCError({ code: 'FORBIDDEN', message: invalidMessage });
        }
        if (enrolling && error instanceof EscrowBlobError) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Invalid automatic recovery material.',
            });
        }
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Recovery material could not be released.',
        });
    }
};

// Strict objects with exclusive proof fields also remain compatible with OpenAPI's
// object-only parameter generation (unlike a top-level Zod union).
const startInput = z
    .object({
        clientEphemeralPublicKey: z.string().min(1).max(512),
        authToken: z.string().optional(),
        providerType: AuthProviderTypeValidator.optional(),
        recoverySessionToken: RecoverySessionTokenValidator.optional(),
    })
    .strict()
    .refine(
        input =>
            input.recoverySessionToken !== undefined
                ? input.authToken === undefined && input.providerType === undefined
                : input.authToken !== undefined && input.providerType !== undefined,
        { message: 'Provide exactly one identity proof.' }
    );

// P0-4: this is a GET route, so neither the resume token nor the provider
// token may travel in the query string (proxy/ALB access logs). Raw-fetch
// callers send whichever secret applies as the X-Auth-Token header
// (ctx.providerToken); the optional input fields exist only for native tRPC
// callers whose batch link always POSTs.
const statusInput = z
    .object({
        holdId: z.string().uuid().optional(),
        resumeToken: z.string().min(1).max(512).optional(),
        authToken: z.string().optional(),
        providerType: AuthProviderTypeValidator.optional(),
    })
    .strict()
    .refine(
        input =>
            input.holdId !== undefined
                ? input.authToken === undefined && input.providerType === undefined
                : input.resumeToken === undefined && input.providerType !== undefined,
        { message: 'Provide exactly one identity proof.' }
    );

export const escrowRouter = t.router({
    getAttestation: openRoute
        .meta({ openapi: { method: 'GET', path: '/keys/escrow/attestation', tags: ['Keys'] } })
        .input(z.object({}).strict())
        .output(
            z.object({
                attestation: z.object({
                    mode: z.enum(['software', 'nitro']),
                    keyId: z.string(),
                    publicKey: z.string(),
                    measurements: EscrowBlobValidator.shape.measurements,
                    document: z.string(),
                    issuedAt: z.string(),
                }),
                holdDurationMs: z.number(),
            })
        )
        .query(async () => ({
            attestation: await enclaveOperation(() => getEscrowEnclave().getAttestation()),
            holdDurationMs: getEscrowHoldDurationMs(),
        })),

    enroll: didAndChallengeRoute
        .meta({ openapi: { method: 'POST', path: '/keys/escrow', tags: ['Keys'] } })
        .input(
            AuthInputValidator.extend({
                envelope: EscrowEnvelopeValidator,
                shareVersion: z.number().int().positive(),
                enclaveKeyId: EscrowBlobValidator.shape.enclaveKeyId,
            }).strict()
        )
        .output(successValidator.extend({ shareVersion: z.number() }))
        .mutation(async ({ input, ctx }) => {
            const { authProvider } = await verifyAndGetContactMethod(input);
            const userKey = await requireUserKey(authProvider);
            assertDidOwner(userKey, ctx.user.did);
            if (userKey.escrowOptedOutAt) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Automatic recovery is turned off for this account.',
                });
            }
            if (input.shareVersion !== userKey.shareVersion) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Key material changed; please retry.',
                });
            }
            const attestation = await enclaveOperation(() => getEscrowEnclave().getAttestation());
            if (
                input.enclaveKeyId !== attestation.keyId ||
                input.envelope.keyId !== attestation.keyId
            ) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid automatic recovery key.',
                });
            }
            const verification = await enclaveOperation(
                () =>
                    getEscrowEnclave().verifyEscrowBlob({
                        envelope: input.envelope,
                        expectedDid: ctx.user.did,
                        expectedShareVersion: input.shareVersion,
                    }),
                true
            );
            if (!verification.ok) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid automatic recovery material.',
                });
            }
            const stored = await setEscrowBlobByAuthProvider(
                authProvider,
                {
                    envelope: input.envelope,
                    enclaveKeyId: attestation.keyId,
                    enclaveMode: attestation.mode,
                    measurements: attestation.measurements,
                    shareVersion: input.shareVersion,
                    createdAt: new Date(),
                },
                input.shareVersion
            );
            if (!stored)
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Key material changed; please retry.',
                });
            return { success: true as const, shareVersion: input.shareVersion };
        }),

    remove: didAndChallengeRoute
        .meta({ openapi: { method: 'DELETE', path: '/keys/escrow', tags: ['Keys'] } })
        .input(AuthInputValidator.extend({ optOut: z.boolean() }).strict())
        .output(successValidator)
        .mutation(async ({ input, ctx }) => {
            const { authProvider } = await verifyAndGetContactMethod(input);
            const userKey = await requireUserKey(authProvider);
            assertDidOwner(userKey, ctx.user.did);
            if (
                input.optOut &&
                !userKey.recoveryMethods.some(
                    method =>
                        method.type !== 'escrow' &&
                        method.shareVersion === userKey.shareVersion &&
                        isRecoveryMethodConfirmed(userKey, method)
                )
            ) {
                throw new TRPCError({
                    code: 'PRECONDITION_FAILED',
                    message:
                        'Set up another recovery method before turning off automatic recovery.',
                });
            }
            await clearEscrowByAuthProvider(authProvider, { optOut: input.optOut });
            const pending = await findPendingEscrowHoldByAuthProvider(authProvider);
            const cancelled = pending && (await cancelEscrowHold(pending._id, 'did'));
            if (cancelled)
                void notifyEscrowHoldEvent({ kind: 'cancelled', hold: cancelled, userKey });
            return { success: true as const };
        }),

    optIn: didAndChallengeRoute
        .meta({ openapi: { method: 'POST', path: '/keys/escrow/opt-in', tags: ['Keys'] } })
        .input(AuthInputValidator.strict())
        .output(successValidator)
        .mutation(async ({ input, ctx }) => {
            const { authProvider } = await verifyAndGetContactMethod(input);
            const userKey = await requireUserKey(authProvider);
            assertDidOwner(userKey, ctx.user.did);
            await setEscrowOptInByAuthProvider(authProvider);
            return { success: true as const };
        }),

    startRecovery: openRoute
        .meta({ openapi: { method: 'POST', path: '/keys/escrow/recover', tags: ['Keys'] } })
        .input(startInput)
        .output(
            holdStatusValidator
                .pick({ holdId: true, requestedAt: true, releaseAfter: true })
                .extend({ status: z.literal('pending'), resumeToken: z.string().nullable() })
        )
        .mutation(async ({ input, ctx }) => {
            let authProvider: AuthProviderMapping;
            if (input.recoverySessionToken !== undefined) {
                try {
                    authProvider = await requireRecoverySession(
                        input.recoverySessionToken,
                        'recover'
                    );
                } catch (error) {
                    if (!(error instanceof TRPCError) || error.code !== 'UNAUTHORIZED') throw error;
                    throw new TRPCError({ code: 'NOT_FOUND', message: unavailableMessage });
                }
            } else {
                ({ authProvider } = await verifyAndGetContactMethod({
                    authToken: input.authToken!,
                    providerType: input.providerType!,
                }));
            }
            const userKey = await findUserKeyByAuthProvider(authProvider.type, authProvider.id);
            if (
                !userKey?.escrowBlob ||
                userKey.escrowOptedOutAt ||
                !hasConfirmedEscrow(userKey, userKey.escrowBlob.shareVersion)
            ) {
                throw new TRPCError({ code: 'NOT_FOUND', message: unavailableMessage });
            }
            const now = new Date();
            await expireStaleEscrowHolds(now);
            await ensureHoldIndexes();
            const pending = await findPendingEscrowHoldByAuthProvider(authProvider);
            if (pending)
                return { ...serializeHold(pending), status: 'pending' as const, resumeToken: null };
            const resumeToken = generateEscrowResumeToken();
            let hold: EscrowHold;
            try {
                hold = await createEscrowHold({
                    authProvider,
                    primaryDid: userKey.primaryDid,
                    shareVersion: userKey.escrowBlob.shareVersion,
                    identityProofType:
                        input.recoverySessionToken !== undefined
                            ? 'recovery-session'
                            : 'auth-token',
                    requestedAt: now,
                    releaseAfter: new Date(now.getTime() + getEscrowHoldDurationMs()),
                    clientEphemeralPublicKey: input.clientEphemeralPublicKey,
                    resumeTokenHash: hashEscrowResumeToken(resumeToken),
                    requestIp: ctx.clientIp,
                });
            } catch (error) {
                if (
                    typeof error === 'object' &&
                    error !== null &&
                    'code' in error &&
                    error.code === 11000
                ) {
                    const raced = await findPendingEscrowHoldByAuthProvider(authProvider);
                    if (raced)
                        return {
                            ...serializeHold(raced),
                            status: 'pending' as const,
                            resumeToken: null,
                        };
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Recovery state changed; please retry.',
                    });
                }
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Recovery could not be started.',
                });
            }
            void notifyEscrowHoldEvent({ kind: 'started', hold, userKey });
            return { ...serializeHold(hold), status: 'pending' as const, resumeToken };
        }),

    getStatus: openRoute
        .meta({ openapi: { method: 'GET', path: '/keys/escrow/status', tags: ['Keys'] } })
        .input(statusInput)
        .output(z.object({ hold: holdStatusValidator.nullable() }))
        .query(async ({ input, ctx }) => {
            await expireStaleEscrowHolds(new Date());
            let hold: EscrowHold | null;
            if (input.holdId !== undefined) {
                const resumeToken = input.resumeToken || ctx.providerToken || '';
                hold = resumeToken ? await findEscrowHoldById(input.holdId) : null;
                if (hold && !resumeTokenMatches(hold, resumeToken)) hold = null;
            } else {
                const { authProvider } = await verifyAndGetContactMethod({
                    authToken: input.authToken || ctx.providerToken || '',
                    providerType: input.providerType!,
                });
                hold = await findPendingEscrowHoldByAuthProvider(authProvider);
            }
            return { hold: hold ? serializeHold(hold) : null };
        }),

    cancelRecovery: didAndChallengeRoute
        .meta({ openapi: { method: 'POST', path: '/keys/escrow/cancel', tags: ['Keys'] } })
        .input(AuthInputValidator.strict())
        .output(successValidator.extend({ cancelled: z.boolean() }))
        .mutation(async ({ input, ctx }) => {
            const { authProvider } = await verifyAndGetContactMethod(input);
            const userKey = await requireUserKey(authProvider);
            assertDidOwner(userKey, ctx.user.did);
            const pending = await findPendingEscrowHoldByAuthProvider(authProvider);
            const hold = pending && (await cancelEscrowHold(pending._id, 'did'));
            if (hold) void notifyEscrowHoldEvent({ kind: 'cancelled', hold, userKey });
            return { success: true as const, cancelled: Boolean(hold) };
        }),

    completeRecovery: openRoute
        .meta({ openapi: { method: 'POST', path: '/keys/escrow/complete', tags: ['Keys'] } })
        .input(resumeInput)
        .output(
            z.object({
                sealedShare: EscrowEnvelopeValidator,
                authShare: ServerEncryptedShareValidator,
                primaryDid: z.string(),
                shareVersion: z.number(),
                rebindSessionToken: RecoverySessionTokenValidator,
            })
        )
        .mutation(async ({ input }) => {
            const hold = await findEscrowHoldById(input.holdId);
            if (!hold || !resumeTokenMatches(hold, input.resumeToken)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'This recovery request is invalid.',
                });
            }
            if (hold.status === 'cancelled') {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'This recovery request was cancelled.',
                });
            }
            if (hold.status !== 'pending')
                throw new TRPCError({ code: 'FORBIDDEN', message: invalidMessage });
            const now = new Date();
            if (now < hold.releaseAfter) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'This recovery request is still in its waiting period.',
                });
            }
            const userKey = await findUserKeyByAuthProvider(
                hold.authProvider.type,
                hold.authProvider.id
            );
            if (
                !userKey?.escrowBlob ||
                userKey.escrowOptedOutAt ||
                userKey.escrowBlob.shareVersion !== hold.shareVersion ||
                !hasConfirmedEscrow(userKey, hold.shareVersion)
            ) {
                throw new TRPCError({ code: 'FORBIDDEN', message: invalidMessage });
            }
            const encryptedAuthShare = findAuthShareByVersion(userKey, hold.shareVersion);
            if (!encryptedAuthShare || !environment.SEED) {
                throw new TRPCError({ code: 'FORBIDDEN', message: invalidMessage });
            }
            // Claim the pending hold BEFORE releasing secrets. The enclave receives the
            // pending snapshot whose CAS we won; release failures burn the hold (fail-closed).
            const completed = await completeEscrowHold(hold._id);
            if (!completed)
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Recovery state changed; please retry.',
                });
            const { sealed } = await enclaveOperation(() =>
                getEscrowEnclave().releaseEscrow({
                    envelope: userKey.escrowBlob!.envelope,
                    hold,
                    clientEphemeralPublicKey: hold.clientEphemeralPublicKey,
                    expectedDid: userKey.primaryDid,
                    now,
                })
            );
            const authShare = await enclaveOperation(async () =>
                decryptAuthShare(encryptedAuthShare, environment.SEED)
            );
            const rebindSessionToken = await createRecoverySession({
                scope: 'rebind',
                authProvider: hold.authProvider,
            });
            void notifyEscrowHoldEvent({ kind: 'completed', hold: completed, userKey });
            return {
                sealedShare: sealed,
                authShare,
                primaryDid: userKey.primaryDid,
                shareVersion: hold.shareVersion,
                rebindSessionToken,
            };
        }),
});
