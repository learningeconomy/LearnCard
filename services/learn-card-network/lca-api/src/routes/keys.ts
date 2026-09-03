/**
 * SSS Key Manager routes
 * Provider-agnostic routes for managing SSS shares
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import admin from 'firebase-admin';
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import type { TenantBranding } from '@learncard/email-templates';

import { t, openRoute, didRoute, didAndChallengeRoute } from '@routes';
import { getDeliveryService, getFrom } from '../services/delivery';
import { verifyAuthToken, getContactMethodFromUser, AuthProviderType } from '@helpers/auth.helpers';
import { encryptAuthShare, decryptAuthShare } from '@helpers/shareEncryption.helpers';
import { maskEmail } from '@helpers/maskEmail';
import cache from '@cache';
import { setValidChallengeForDid } from '@cache/challenges';
import {
    MAX_RECOVERY_OTP_ATTEMPTS,
    claimRecoveryOtpSendWindow,
    clearRecoveryOtpAttempts,
    consumeRecoveryOtp,
    consumeRecoverySession,
    createRecoverySession,
    getRecoveryOtp,
    isRecoveryOtpLocked,
    recordFailedRecoveryOtpAttempt,
    storeRecoveryOtp,
} from '@cache/recoverySessions';
import {
    findUserKeyByAuthProvider,
    findUniqueUserKeyByVerifiedRecoveryEmail,
    findAuthShareByVersion,
    upsertUserKeyByAuthProvider,
    addRecoveryMethodToUserKeyByAuthProvider,
    confirmRecoveryMethodByAuthProvider,
    incrementRecoveryConfirmationAttemptsByAuthProvider,
    removeRecoveryMethodFromUserKeyByAuthProvider,
    setRecoveryEmailByAuthProvider,
    markUserKeyMigrationProvisionalByAuthProvider,
    activateUserKeyByAuthProvider,
    purgeExpiredProvisionalMigrationByAuthProvider,
    getSssActivationState,
    hasActivatableRecoveryMethod,
    isRecoveryMethodConfirmed,
    upgradeContactMethodByAuthProvider,
    deleteUserKeyByAuthProvider,
    completeIdentityRebind,
    ServerEncryptedShareValidator,
    EncryptedShareValidator,
    type ContactMethod,
    type AuthProviderMapping,
    type MongoUserKeyType,
} from '@models';

const RECOVERY_EMAIL_CODE_TEMPLATE_ALIAS =
    process.env.POSTMARK_RECOVERY_EMAIL_CODE_TEMPLATE_ALIAS ?? '';

const RECOVERY_EMAIL_CODE_PREFIX = 'recovery_email_code:';
const RECOVERY_EMAIL_CODE_TTL_SECS = 15 * 60; // 15 minutes
const RECOVERY_METHOD_CONFIRMATION_TTL_MS = 15 * 60 * 1000;
const MAX_RECOVERY_METHOD_CONFIRMATION_ATTEMPTS = 5;
const EMAIL_RELAY_ALGORITHM = 'P-256-HKDF-SHA256-AES-256-GCM' as const;
const ESCROW_RELAY_TIMEOUT_MS = 15_000;

const generate6DigitCode = (): string => randomInt(100000, 1000000).toString();

const hashRecoveryConfirmationCode = (code: string): string => {
    const seed = process.env.SEED;

    if (!seed) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Server misconfiguration: SEED is required for recovery confirmation',
        });
    }

    return createHmac('sha256', seed).update(code).digest('hex');
};

const confirmationCodeMatches = (code: string, expectedHash: string): boolean => {
    const actual = Buffer.from(hashRecoveryConfirmationCode(code), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');

    return actual.length === expected.length && timingSafeEqual(actual, expected);
};

const AuthProviderTypeValidator = z.enum(['firebase', 'supertokens', 'keycloak', 'oidc']);

const AuthInputValidator = z.object({
    authToken: z.string(),
    providerType: AuthProviderTypeValidator,
});

const RecoveryMethodTypeValidator = z.enum(['passkey', 'backup', 'phrase', 'email']);
const RecoverySessionTokenValidator = z.string().regex(/^[0-9a-f]{64}$/);

const RecoveryMethodResponseValidator = z.object({
    type: RecoveryMethodTypeValidator,
    createdAt: z.string(),
    credentialId: z.string().optional(),
    shareVersion: z.number().optional(),
});

const EmailRelayEnvelopeValidator = z
    .object({
        version: z.literal(1),
        algorithm: z.literal(EMAIL_RELAY_ALGORITHM),
        keyId: z.string().regex(/^[A-Za-z0-9._-]{1,128}$/),
        ephemeralPublicKey: z.string().min(1).max(256),
        salt: z.string().min(1).max(128),
        iv: z.string().min(1).max(64),
        ciphertext: z.string().min(1).max(16_384),
    })
    .strict();

type EmailRelayEnvelope = z.infer<typeof EmailRelayEnvelopeValidator>;

const sendRecoveryKeyToEscrowRelay = async (
    payload: EmailRelayEnvelope,
    expectedRecipient: string
): Promise<void> => {
    const relayUrl = process.env.ESCROW_RELAY_URL?.replace(/\/$/, '');
    const relayAuthToken = process.env.ESCROW_RELAY_AUTH_TOKEN;

    if (!relayUrl || !relayAuthToken) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Recovery email delivery is not configured.',
        });
    }

    let response: Response;

    try {
        response = await fetch(`${relayUrl}/email-backup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${relayAuthToken}`,
            },
            body: JSON.stringify({ payload, expectedRecipient }),
            signal: AbortSignal.timeout(ESCROW_RELAY_TIMEOUT_MS),
        });
    } catch {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to send the recovery key. Please try again.',
        });
    }

    const result: unknown = await response.json().catch(() => null);
    const accepted =
        typeof result === 'object' &&
        result !== null &&
        'accepted' in result &&
        result.accepted === true &&
        'messageId' in result &&
        typeof result.messageId === 'string' &&
        result.messageId.length > 0;

    if (!response.ok || !accepted) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to send the recovery key. Please try again.',
        });
    }
};

async function verifyAndGetContactMethod(input: {
    authToken: string;
    providerType: AuthProviderType;
}): Promise<{
    user: { id: string; email?: string; phone?: string; providerType: string };
    contactMethod: ContactMethod;
    authProvider: AuthProviderMapping;
}> {
    const user = await verifyAuthToken(input.authToken, input.providerType);

    const contactMethod = getContactMethodFromUser(user);
    if (!contactMethod) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User must have an email or phone number',
        });
    }

    return {
        user,
        contactMethod,
        authProvider: { type: input.providerType, id: user.id },
    };
}

const requireUserKey = async (
    authProvider: AuthProviderMapping,
    message = 'User key not found. Set up SSS first.'
): Promise<MongoUserKeyType> => {
    const userKey = await findUserKeyByAuthProvider(authProvider.type, authProvider.id);

    if (!userKey) throw new TRPCError({ code: 'NOT_FOUND', message });

    return userKey;
};

const assertDidOwner = (userKey: MongoUserKeyType, authenticatedDid: string): void => {
    if (!userKey.primaryDid || userKey.primaryDid !== authenticatedDid) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'The authenticated DID does not own this key record.',
        });
    }
};

const serializeConfirmedRecoveryMethods = (userKey: MongoUserKeyType) =>
    (userKey.recoveryMethods ?? [])
        .filter(method => isRecoveryMethodConfirmed(userKey, method))
        .map(method => ({
            type: method.type,
            createdAt:
                method.createdAt instanceof Date
                    ? method.createdAt.toISOString()
                    : String(method.createdAt),
            ...(method.credentialId ? { credentialId: method.credentialId } : {}),
            ...(method.shareVersion != null ? { shareVersion: method.shareVersion } : {}),
        }));

const requireRecoverySession = async (
    token: string,
    scope: 'recover' | 'rebind'
): Promise<AuthProviderMapping> => {
    const session = await consumeRecoverySession(token, scope);

    if (!session || !AuthProviderTypeValidator.safeParse(session.authProvider.type).success) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'This recovery session is invalid or expired. Start again.',
        });
    }

    return session.authProvider as AuthProviderMapping;
};

const notifyIdentityRebind = async (
    userKey: MongoUserKeyType,
    newContactMethod: ContactMethod,
    branding: Partial<TenantBranding> | undefined
): Promise<void> => {
    const recipients = new Set<string>();

    if (userKey.contactMethod.type === 'email') recipients.add(userKey.contactMethod.value);
    if (userKey.recoveryEmail) recipients.add(userKey.recoveryEmail);
    if (newContactMethod.type === 'email') recipients.add(newContactMethod.value);

    const results = await Promise.allSettled(
        [...recipients].map(to =>
            getDeliveryService().send({
                to,
                templateAlias: 'account-sign-in-changed',
                templateModel: {},
                branding,
                from: getFrom({ mailbox: 'recovery', branding }),
            })
        )
    );

    results.forEach(result => {
        if (result.status === 'rejected') {
            console.error(
                '[notifyIdentityRebind] Failed to send security notification:',
                result.reason
            );
        }
    });
};

export const keysRouter = t.router({
    startRecoverySession: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/recovery-session/start',
                tags: ['Keys'],
                summary: 'Send a recovery-session verification code',
            },
        })
        .input(z.object({ email: z.string().email() }))
        .output(z.object({ success: z.literal(true) }))
        .mutation(async ({ input, ctx }) => {
            const email = input.email.trim().toLowerCase();
            const canSend = await claimRecoveryOtpSendWindow(email);

            if (!canSend) {
                throw new TRPCError({
                    code: 'TOO_MANY_REQUESTS',
                    message: 'Please wait before requesting another code.',
                });
            }

            const userKey = await findUniqueUserKeyByVerifiedRecoveryEmail(email);
            const hasConfirmedMethod = userKey
                ? serializeConfirmedRecoveryMethods(userKey).length > 0
                : false;

            // Deliberately return the same response when no account matches.
            if (!userKey || !hasConfirmedMethod || !userKey.authProviders[0]) {
                return { success: true as const };
            }

            const code = generate6DigitCode();
            await storeRecoveryOtp(email, {
                codeHash: hashRecoveryConfirmationCode(code),
                authProvider: userKey.authProviders[0],
            });

            try {
                await getDeliveryService().send({
                    to: email,
                    templateAlias: RECOVERY_EMAIL_CODE_TEMPLATE_ALIAS || 'recovery-email-code',
                    templateModel: { verificationCode: code, verificationEmail: email },
                    branding: ctx.tenant?.emailBranding,
                    from: getFrom({ mailbox: 'recovery', branding: ctx.tenant?.emailBranding }),
                });
            } catch (error) {
                console.error('[startRecoverySession] Failed to send verification email:', error);
            }

            return { success: true as const };
        }),

    verifyRecoverySession: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/recovery-session/verify',
                tags: ['Keys'],
                summary: 'Verify recovery email and issue a one-use recovery token',
            },
        })
        .input(z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/) }))
        .output(
            z.object({
                recoverySessionToken: RecoverySessionTokenValidator,
                recoveryMethods: z.array(RecoveryMethodResponseValidator),
            })
        )
        .mutation(async ({ input }) => {
            const email = input.email.trim().toLowerCase();

            if (await isRecoveryOtpLocked(email)) {
                throw new TRPCError({
                    code: 'TOO_MANY_REQUESTS',
                    message: 'Too many incorrect attempts. Request a new code later.',
                });
            }

            const pending = await getRecoveryOtp(email);

            if (!pending || !confirmationCodeMatches(input.code, pending.codeHash)) {
                const attempts = await recordFailedRecoveryOtpAttempt(email);

                throw new TRPCError({
                    code:
                        attempts >= MAX_RECOVERY_OTP_ATTEMPTS ? 'TOO_MANY_REQUESTS' : 'BAD_REQUEST',
                    message:
                        attempts >= MAX_RECOVERY_OTP_ATTEMPTS
                            ? 'Too many incorrect attempts. Request a new code later.'
                            : 'Incorrect or expired code. Please try again.',
                });
            }

            const consumed = await consumeRecoveryOtp(email);

            if (!consumed || consumed.codeHash !== pending.codeHash) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'This code was already used.',
                });
            }

            await clearRecoveryOtpAttempts(email);
            const userKey = await requireUserKey(
                consumed.authProvider,
                'Recovery account not found.'
            );
            const recoveryMethods = serializeConfirmedRecoveryMethods(userKey);

            if (recoveryMethods.length === 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'No recovery method is available.',
                });
            }

            const recoverySessionToken = await createRecoverySession({
                scope: 'recover',
                authProvider: consumed.authProvider,
            });

            return { recoverySessionToken, recoveryMethods };
        }),

    useRecoverySession: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/recovery-session/recover',
                tags: ['Keys'],
                summary: 'Release version-matched recovery material under a recovery session',
            },
        })
        .input(
            z.object({
                recoverySessionToken: RecoverySessionTokenValidator,
                type: RecoveryMethodTypeValidator,
                credentialId: z.string().optional(),
            })
        )
        .output(
            z.object({
                authShare: ServerEncryptedShareValidator,
                encryptedShare: EncryptedShareValidator.optional(),
                primaryDid: z.string(),
                shareVersion: z.number(),
                rebindSessionToken: RecoverySessionTokenValidator,
            })
        )
        .mutation(async ({ input }) => {
            const authProvider = await requireRecoverySession(
                input.recoverySessionToken,
                'recover'
            );
            const userKey = await requireUserKey(authProvider, 'Recovery account not found.');
            const recoveryMethod = (userKey.recoveryMethods ?? []).find(method => {
                if (method.type !== input.type || !isRecoveryMethodConfirmed(userKey, method)) {
                    return false;
                }

                return input.type !== 'passkey' || method.credentialId === input.credentialId;
            });

            if (!recoveryMethod?.shareVersion) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Recovery method is unavailable.',
                });
            }

            const encryptedAuthShare = findAuthShareByVersion(userKey, recoveryMethod.shareVersion);
            const seed = process.env.SEED;

            if (!encryptedAuthShare || !seed) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Recovery method is outdated.',
                });
            }

            const authShare = decryptAuthShare(encryptedAuthShare, seed);
            const rebindSessionToken = await createRecoverySession({
                scope: 'rebind',
                authProvider,
            });

            return {
                authShare,
                encryptedShare: recoveryMethod.encryptedShare,
                primaryDid: userKey.primaryDid,
                shareVersion: recoveryMethod.shareVersion,
                rebindSessionToken,
            };
        }),

    completeRecoveryRebind: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/recovery-session/rebind',
                tags: ['Keys'],
                summary: 'Bind a replacement login and commit recovery rotation',
            },
        })
        .input(
            z.object({
                recoverySessionToken: RecoverySessionTokenValidator,
                newAuthToken: z.string().min(1).optional(),
                providerType: AuthProviderTypeValidator,
                primaryDid: z.string(),
                authShare: ServerEncryptedShareValidator,
            })
        )
        .output(
            z.object({
                success: z.literal(true),
                shareVersion: z.number(),
                recoveryMethodsRequireConfirmation: z.array(RecoveryMethodTypeValidator),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const oldAuthProvider = await requireRecoverySession(
                input.recoverySessionToken,
                'rebind'
            );
            const oldUserKey = await requireUserKey(oldAuthProvider, 'Recovery account not found.');

            assertDidOwner(oldUserKey, ctx.user.did);
            if (input.primaryDid !== ctx.user.did) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Recovered DID does not match.',
                });
            }

            const newUser = await verifyAuthToken(
                input.newAuthToken || ctx.providerToken || '',
                input.providerType
            );
            const newContactMethod = getContactMethodFromUser(newUser);

            if (!newContactMethod) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'New sign-in needs an email or phone.',
                });
            }

            const seed = process.env.SEED;
            if (!seed) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Server configuration error.',
                });
            }

            const result = await completeIdentityRebind({
                oldAuthProvider,
                newAuthProvider: { type: input.providerType, id: newUser.id },
                newContactMethod,
                primaryDid: input.primaryDid,
                authShare: encryptAuthShare(input.authShare, seed),
            });

            if (!result) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'The new sign-in is already linked or recovery state changed.',
                });
            }

            // Notification is intentionally fail-open after the security update commits.
            void notifyIdentityRebind(
                oldUserKey,
                newContactMethod,
                ctx.tenant?.emailBranding
            ).catch(error => console.error('[completeRecoveryRebind] Notification failed:', error));

            return {
                success: true as const,
                shareVersion: result.shareVersion,
                recoveryMethodsRequireConfirmation: result.methodsRequiringConfirmation,
            };
        }),

    issueDidChallenge: didRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/challenge',
                tags: ['Keys'],
                summary: 'Issue a short-lived DID challenge for a sensitive key write',
            },
        })
        .input(z.object({ did: z.string() }))
        .output(z.object({ challenge: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.did !== input.did) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'The authenticated DID does not match the requested challenge.',
                });
            }

            const challenge = randomBytes(32).toString('hex');

            await setValidChallengeForDid(ctx.user.did, challenge);

            return { challenge };
        }),

    getAuthShare: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/auth-share',
                tags: ['Keys'],
                summary: 'Get auth share for authenticated user',
            },
        })
        .input(
            AuthInputValidator.extend({
                shareVersion: z.number().optional(),
            })
        )
        .output(
            z
                .object({
                    authShare: ServerEncryptedShareValidator.nullable(),
                    primaryDid: z.string().nullable(),
                    securityLevel: z.enum(['basic', 'enhanced', 'advanced']),
                    recoveryMethods: z.array(
                        z.object({
                            type: z.enum(['passkey', 'backup', 'phrase', 'email']),
                            createdAt: z.string(),
                            credentialId: z.string().optional(),
                            shareVersion: z.number().optional(),
                            confirmedAt: z.string().optional(),
                        })
                    ),
                    keyProvider: z.enum(['web3auth', 'sss']),
                    shareVersion: z.number(),
                    maskedRecoveryEmail: z.string().nullable(),
                    sssActivationState: z.enum(['provisional', 'active']),
                })
                .nullable()
        )
        .mutation(async ({ input }) => {
            const { authProvider } = await verifyAndGetContactMethod(input);
            await purgeExpiredProvisionalMigrationByAuthProvider(authProvider);

            const userKey = await findUserKeyByAuthProvider(authProvider.type, authProvider.id);

            if (!userKey) {
                return null;
            }

            // If a specific shareVersion is requested, look it up from history
            const requestedVersion = input.shareVersion;
            const rawAuthShare =
                requestedVersion != null
                    ? findAuthShareByVersion(userKey, requestedVersion)
                    : userKey.authShare ?? null;

            // Decrypt the auth share before returning to client
            let authShare = rawAuthShare;

            if (rawAuthShare) {
                const seed = process.env.SEED;

                if (!seed) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message:
                            'Server misconfiguration: SEED is required for auth share encryption',
                    });
                }

                authShare = decryptAuthShare(rawAuthShare, seed);
            }

            const recoveryMethods = (userKey.recoveryMethods ?? [])
                .filter(
                    rm => rm && rm.type && rm.createdAt && isRecoveryMethodConfirmed(userKey, rm)
                )
                .map(rm => ({
                    type: rm.type,
                    createdAt:
                        rm.createdAt instanceof Date
                            ? rm.createdAt.toISOString()
                            : String(rm.createdAt),
                    ...(rm.credentialId ? { credentialId: rm.credentialId } : {}),
                    ...(rm.shareVersion != null ? { shareVersion: rm.shareVersion } : {}),
                    ...(rm.confirmedAt
                        ? {
                              confirmedAt:
                                  rm.confirmedAt instanceof Date
                                      ? rm.confirmedAt.toISOString()
                                      : String(rm.confirmedAt),
                          }
                        : {}),
                }));

            return {
                authShare,
                primaryDid: userKey.primaryDid ?? null,
                securityLevel: userKey.securityLevel ?? 'basic',
                recoveryMethods,
                keyProvider: userKey.keyProvider ?? 'sss',
                shareVersion: userKey.shareVersion ?? 1,
                maskedRecoveryEmail: userKey.recoveryEmail
                    ? maskEmail(userKey.recoveryEmail)
                    : null,
                sssActivationState: getSssActivationState(userKey),
            };
        }),

    storeAuthShare: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'PUT',
                path: '/keys/auth-share',
                tags: ['Keys'],
                summary: 'Store auth share for authenticated user',
            },
        })
        .input(
            AuthInputValidator.extend({
                authShare: ServerEncryptedShareValidator,
                primaryDid: z.string(),
                securityLevel: z.enum(['basic', 'enhanced', 'advanced']).optional(),
                keyProvider: z.enum(['web3auth', 'sss']).optional(),
                sssActivationState: z.literal('provisional').optional(),
            })
        )
        .output(z.object({ success: z.boolean(), shareVersion: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const authenticatedDid = ctx.user.did;

            if (input.primaryDid !== authenticatedDid) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'The authenticated DID does not match primaryDid.',
                });
            }

            const { contactMethod, authProvider } = await verifyAndGetContactMethod(input);
            const existing = await findUserKeyByAuthProvider(authProvider.type, authProvider.id);

            if (existing) assertDidOwner(existing, authenticatedDid);

            const isMigration = existing?.keyProvider === 'web3auth';
            const shouldRemainProvisional =
                !existing || isMigration || existing.sssActivationState === 'provisional';
            const provisionalCreatedAt = shouldRemainProvisional
                ? existing?.provisionalCreatedAt ?? new Date()
                : undefined;

            // Encrypt the auth share at rest using the server SEED
            const seed = process.env.SEED;

            if (!seed) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Server misconfiguration: SEED is required for auth share encryption',
                });
            }

            const authShareToStore = encryptAuthShare(input.authShare, seed);

            const updatedDoc = await upsertUserKeyByAuthProvider(contactMethod, authProvider, {
                authShare: authShareToStore,
                primaryDid: authenticatedDid,
                securityLevel: input.securityLevel ?? 'basic',
                keyProvider: isMigration ? 'web3auth' : existing?.keyProvider ?? 'sss',
                sssActivationState: shouldRemainProvisional ? 'provisional' : 'active',
                ...(provisionalCreatedAt ? { provisionalCreatedAt } : {}),
            });

            return { success: true, shareVersion: updatedDoc.shareVersion ?? 1 };
        }),

    addRecoveryMethod: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/recovery',
                tags: ['Keys'],
                summary: 'Add recovery method for authenticated user',
            },
        })
        .input(
            AuthInputValidator.extend({
                type: z.enum(['passkey', 'backup', 'phrase', 'email']),
                encryptedShare: EncryptedShareValidator.optional(),
                credentialId: z.string().optional(),
                shareVersion: z.number().optional(),
            })
        )
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const { authProvider } = await verifyAndGetContactMethod(input);
            const userKey = await requireUserKey(authProvider);

            assertDidOwner(userKey, ctx.user.did);

            await addRecoveryMethodToUserKeyByAuthProvider(authProvider, {
                type: input.type,
                createdAt: new Date(),
                confirmationStatus: 'pending',
                credentialId: input.credentialId,
                encryptedShare: input.encryptedShare,
                shareVersion: input.shareVersion ?? userKey.shareVersion ?? 1,
            });

            return { success: true };
        }),

    confirmRecoveryMethod: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/recovery/confirm',
                tags: ['Keys'],
                summary: 'Confirm receipt of a pending recovery method',
            },
        })
        .input(
            AuthInputValidator.extend({
                type: z.enum(['passkey', 'backup', 'phrase', 'email']),
                credentialId: z.string().optional(),
                code: z.string().length(6).optional(),
            })
        )
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const { authProvider } = await verifyAndGetContactMethod(input);
            const userKey = await requireUserKey(authProvider);

            assertDidOwner(userKey, ctx.user.did);

            const shareVersion = userKey.shareVersion ?? 1;
            const pendingMethod = (userKey.recoveryMethods ?? []).find(method => {
                if (
                    method.type !== input.type ||
                    method.shareVersion !== shareVersion ||
                    method.confirmationStatus !== 'pending'
                ) {
                    return false;
                }

                return input.type !== 'passkey' || method.credentialId === input.credentialId;
            });

            if (!pendingMethod) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'No pending recovery method was found. Please set it up again.',
                });
            }

            let confirmedEmail: string | undefined;

            if (input.type === 'email') {
                if (!input.code || !pendingMethod.confirmationCodeHash) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Enter the confirmation code from your recovery email.',
                    });
                }

                const attempts = pendingMethod.confirmationAttempts ?? 0;

                if (attempts >= MAX_RECOVERY_METHOD_CONFIRMATION_ATTEMPTS) {
                    throw new TRPCError({
                        code: 'TOO_MANY_REQUESTS',
                        message:
                            'Too many incorrect attempts. Send a new recovery key to try again.',
                    });
                }

                if (
                    !pendingMethod.confirmationCodeExpiresAt ||
                    pendingMethod.confirmationCodeExpiresAt.getTime() <= Date.now()
                ) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'This confirmation code has expired. Send a new recovery key.',
                    });
                }

                if (!confirmationCodeMatches(input.code, pendingMethod.confirmationCodeHash)) {
                    await incrementRecoveryConfirmationAttemptsByAuthProvider(
                        authProvider,
                        shareVersion
                    );

                    if (attempts + 1 >= MAX_RECOVERY_METHOD_CONFIRMATION_ATTEMPTS) {
                        throw new TRPCError({
                            code: 'TOO_MANY_REQUESTS',
                            message:
                                'Too many incorrect attempts. Send a new recovery key to try again.',
                        });
                    }

                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Incorrect confirmation code. Please try again.',
                    });
                }

                confirmedEmail = pendingMethod.confirmationEmail;
            }

            const confirmed = await confirmRecoveryMethodByAuthProvider(
                authProvider,
                input.type,
                shareVersion,
                input.credentialId
            );

            if (!confirmed) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Recovery setup changed before it was confirmed. Please try again.',
                });
            }

            if (confirmedEmail) {
                await setRecoveryEmailByAuthProvider(authProvider, confirmedEmail);
            }

            return { success: true };
        }),

    deleteRecoveryMethod: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'DELETE',
                path: '/keys/recovery',
                tags: ['Keys'],
                summary: 'Delete a recovery method for an authenticated user',
            },
        })
        .input(
            AuthInputValidator.extend({
                type: z.enum(['passkey', 'backup', 'phrase', 'email']),
                credentialId: z.string().optional(),
            })
        )
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const { authProvider } = await verifyAndGetContactMethod(input);
            const userKey = await requireUserKey(authProvider);

            assertDidOwner(userKey, ctx.user.did);
            await removeRecoveryMethodFromUserKeyByAuthProvider(
                authProvider,
                input.type,
                input.credentialId
            );

            return { success: true };
        }),

    getRecoveryShare: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/keys/recovery',
                tags: ['Keys'],
                summary: 'Get recovery share for authenticated user',
            },
        })
        .input(
            // P0-4: authToken is optional here — this GET route's query
            // string must not carry it (proxy/ALB access logs). Raw-fetch
            // callers (sss-key-manager) send it as an X-Auth-Token header,
            // read from ctx.providerToken below; native tRPC callers that
            // still pass it as input (e.g. lca-api-plugin, whose batch link
            // always POSTs — never a URL leak) keep working unchanged.
            z.object({
                authToken: z.string().optional(),
                providerType: AuthProviderTypeValidator,
                type: z.enum(['passkey', 'backup', 'phrase', 'email']),
                credentialId: z.string().optional(),
            })
        )
        .output(
            z
                .object({
                    encryptedShare: EncryptedShareValidator.optional(),
                    shareVersion: z.number().optional(),
                })
                .nullable()
        )
        .query(async ({ input, ctx }) => {
            const { authProvider } = await verifyAndGetContactMethod({
                authToken: input.authToken || ctx.providerToken || '',
                providerType: input.providerType,
            });

            const userKey = await findUserKeyByAuthProvider(authProvider.type, authProvider.id);
            if (!userKey) {
                return null;
            }

            const recoveryMethod = (userKey.recoveryMethods ?? []).find(rm => {
                if (rm.type !== input.type) return false;
                if (!isRecoveryMethodConfirmed(userKey, rm)) return false;
                if (input.type === 'passkey' && input.credentialId) {
                    return rm.credentialId === input.credentialId;
                }
                return true;
            });

            if (!recoveryMethod) return null;

            return {
                encryptedShare: recoveryMethod.encryptedShare ?? undefined,
                shareVersion: recoveryMethod.shareVersion ?? undefined,
            };
        }),

    markMigrated: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/migrate',
                tags: ['Keys'],
                summary: 'Mark user as migrated from Web3Auth to SSS',
            },
        })
        .input(AuthInputValidator)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const { authProvider } = await verifyAndGetContactMethod(input);
            const userKey = await requireUserKey(authProvider);

            assertDidOwner(userKey, ctx.user.did);

            if (userKey.keyProvider !== 'web3auth') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'This key record is not eligible for migration.',
                });
            }

            await markUserKeyMigrationProvisionalByAuthProvider(
                authProvider,
                userKey.provisionalCreatedAt ?? new Date()
            );

            return { success: true };
        }),

    activate: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/activate',
                tags: ['Keys'],
                summary: 'Activate provisioned SSS shares after recovery enrollment',
            },
        })
        .input(AuthInputValidator)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const { authProvider } = await verifyAndGetContactMethod(input);
            const userKey = await requireUserKey(authProvider);

            assertDidOwner(userKey, ctx.user.did);

            if (
                userKey.sssActivationState !== 'provisional' ||
                !hasActivatableRecoveryMethod(userKey)
            ) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'A recovery method for the current key version is required.',
                });
            }

            const activated = await activateUserKeyByAuthProvider(
                authProvider,
                userKey.shareVersion ?? 1,
                userKey.keyProvider === 'web3auth'
            );

            if (!activated) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'The key record changed before activation. Please try again.',
                });
            }

            return { success: true };
        }),

    // ── Recovery email verification ─────────────────────────────

    addRecoveryEmail: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/recovery-email/add',
                tags: ['Keys'],
                summary: 'Send a 6-digit verification code to a secondary recovery email',
            },
        })
        .input(
            AuthInputValidator.extend({
                email: z.string().email(),
            })
        )
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input, ctx }) => {
            const { authProvider } = await verifyAndGetContactMethod(input);
            const userKey = await requireUserKey(authProvider);

            assertDidOwner(userKey, ctx.user.did);

            // Prevent using the primary login email as the recovery email
            if (
                userKey.contactMethod.type === 'email' &&
                userKey.contactMethod.value.toLowerCase() === input.email.toLowerCase()
            ) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Recovery email must be different from your login email.',
                });
            }

            const code = generate6DigitCode();
            const cacheKey = `${RECOVERY_EMAIL_CODE_PREFIX}${authProvider.type}:${authProvider.id}`;

            // Store: code + target email so verify can confirm both
            await cache.set(
                cacheKey,
                JSON.stringify({ code, email: input.email }),
                RECOVERY_EMAIL_CODE_TTL_SECS
            );

            try {
                // Always render locally via @learncard/email-templates for
                // tenant-branded output. Falls back to the 'recovery-email-code'
                // sentinel when no Postmark alias is configured — the adapter
                // maps sentinels to the matching local template ID.
                await getDeliveryService().send({
                    to: input.email,
                    templateAlias: RECOVERY_EMAIL_CODE_TEMPLATE_ALIAS || 'recovery-email-code',
                    templateModel: {
                        verificationCode: code,
                        verificationEmail: input.email,
                    },
                    branding: ctx.tenant?.emailBranding,
                    from: getFrom({ mailbox: 'recovery', branding: ctx.tenant?.emailBranding }),
                });
            } catch (emailError) {
                console.error('[addRecoveryEmail] Failed to send verification email:', emailError);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to send verification email. Please try again.',
                });
            }

            return { success: true };
        }),

    verifyRecoveryEmail: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/recovery-email/verify',
                tags: ['Keys'],
                summary: 'Verify the 6-digit code sent to the recovery email',
            },
        })
        .input(
            AuthInputValidator.extend({
                code: z.string().length(6),
            })
        )
        .output(z.object({ success: z.boolean(), maskedEmail: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const { authProvider } = await verifyAndGetContactMethod(input);
            const userKey = await requireUserKey(authProvider, 'User key not found.');

            assertDidOwner(userKey, ctx.user.did);

            const cacheKey = `${RECOVERY_EMAIL_CODE_PREFIX}${authProvider.type}:${authProvider.id}`;
            const raw = await cache.get(cacheKey);

            if (!raw) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'No pending verification. Please request a new code.',
                });
            }

            const { code: storedCode, email } = JSON.parse(raw) as { code: string; email: string };

            if (input.code !== storedCode) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Incorrect code. Please try again.',
                });
            }

            // Code is valid — consume it and store the verified recovery email
            await cache.delete([cacheKey]);
            await setRecoveryEmailByAuthProvider(authProvider, email);

            return { success: true, maskedEmail: maskEmail(email) };
        }),

    getRecoveryEmail: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/keys/recovery-email',
                tags: ['Keys'],
                summary: 'Get the verified recovery email (masked) for the authenticated user',
            },
        })
        .input(AuthInputValidator)
        .output(z.object({ recoveryEmail: z.string().nullable() }))
        .query(async ({ input }) => {
            const { authProvider } = await verifyAndGetContactMethod(input);
            const userKey = await findUserKeyByAuthProvider(authProvider.type, authProvider.id);
            if (!userKey) {
                return { recoveryEmail: null };
            }

            return {
                recoveryEmail: userKey.recoveryEmail ? maskEmail(userKey.recoveryEmail) : null,
            };
        }),

    sendEmailBackup: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/email-backup',
                tags: ['Keys'],
                summary: 'Send a recovery key and confirmation code to a recovery email',
            },
        })
        .input(
            AuthInputValidator.extend({
                relayPayload: EmailRelayEnvelopeValidator,
                confirmationCode: z.string().regex(/^\d{6}$/),
                email: z.string().email(),
            }).strict()
        )
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input, ctx }) => {
            const { authProvider } = await verifyAndGetContactMethod(input);
            const userKey = await requireUserKey(authProvider);

            assertDidOwner(userKey, ctx.user.did);

            if (!userKey.recoveryEmail || !userKey.recoveryEmailVerifiedAt) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'No verified recovery email on file.',
                });
            }

            const targetEmail = input.email.trim().toLowerCase();

            if (
                userKey.recoveryEmail.toLowerCase() !== targetEmail ||
                (userKey.contactMethod.type === 'email' &&
                    userKey.contactMethod.value.toLowerCase() === targetEmail)
            ) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Use the verified recovery email for this account.',
                });
            }

            const now = new Date();

            // lca-api deliberately cannot decrypt this payload. The isolated
            // relay verifies that its encrypted recipient matches this
            // server-verified address before sending.
            await sendRecoveryKeyToEscrowRelay(input.relayPayload, targetEmail);

            await addRecoveryMethodToUserKeyByAuthProvider(authProvider, {
                type: 'email',
                createdAt: now,
                confirmationStatus: 'pending',
                shareVersion: userKey.shareVersion ?? 1,
                confirmationCodeHash: hashRecoveryConfirmationCode(input.confirmationCode),
                confirmationCodeExpiresAt: new Date(
                    now.getTime() + RECOVERY_METHOD_CONFIRMATION_TTL_MS
                ),
                confirmationAttempts: 0,
                confirmationEmail: targetEmail,
            });

            return { success: true };
        }),

    upgradeContactMethod: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/upgrade-contact-method',
                tags: ['Keys'],
                summary:
                    'Verify email OTP, link email to auth account, and upgrade UserKey contact method',
            },
        })
        .input(
            AuthInputValidator.extend({
                previousPhone: z.string().min(1),
                email: z.string().email(),
                code: z.string().length(6),
            })
        )
        .output(
            z.object({
                success: z.boolean(),
                message: z.string().optional(),
                customToken: z.string().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const user = await verifyAuthToken(input.authToken, input.providerType);
            const email = input.email.toLowerCase();

            // 1. Verify the OTP code (same Redis pattern as sendLoginVerificationCode)
            const redisKey = `login-code:${email}:${input.code}`;
            const cached = await cache.get(redisKey);

            if (!cached) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid or expired code. Please try again.',
                });
            }

            // Consume the code to prevent reuse
            await cache.delete([redisKey]);

            // 2. Verify the old UserKey exists
            const oldContactMethod: ContactMethod = { type: 'phone', value: input.previousPhone };
            const authProvider: AuthProviderMapping = {
                type: input.providerType,
                id: user.id,
            };
            const existingKey = await findUserKeyByAuthProvider(authProvider.type, authProvider.id);

            if (
                !existingKey ||
                existingKey.contactMethod.type !== oldContactMethod.type ||
                existingKey.contactMethod.value !== oldContactMethod.value
            ) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'No account found for the provided phone number.',
                });
            }

            // 4. Link the email to the auth account (passwordless, via Admin SDK)
            //    This invalidates the client's existing session, so we issue a
            //    fresh custom token for the client to re-authenticate with.
            let customToken: string | undefined;

            if (input.providerType === 'firebase') {
                if (process.env.IS_E2E_TEST === 'true') {
                    // E2E bypass — no Firebase Admin SDK available
                    customToken = `e2e-custom-token-${user.id}`;
                } else {
                    try {
                        await admin.auth().updateUser(user.id, { email });

                        customToken = await admin.auth().createCustomToken(user.id);
                    } catch (err) {
                        const code = (err as { code?: string })?.code ?? '';

                        if (code === 'auth/email-already-exists') {
                            throw new TRPCError({
                                code: 'CONFLICT',
                                message: 'This email is already associated with another account.',
                            });
                        }

                        console.error('Failed to update Firebase user email:', err);

                        throw new TRPCError({
                            code: 'INTERNAL_SERVER_ERROR',
                            message: 'Failed to link email to your account. Please try again.',
                        });
                    }
                }
            }

            // 5. Atomically upgrade the UserKey contact method
            const newContactMethod: ContactMethod = { type: 'email', value: email };
            const upgraded = await upgradeContactMethodByAuthProvider(
                authProvider,
                oldContactMethod,
                newContactMethod
            );

            if (!upgraded) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'This email is already associated with another account.',
                });
            }

            return { success: true, customToken };
        }),

    deleteUserKey: didRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/delete',
                tags: ['Keys'],
                summary: 'Delete user key and all associated data',
            },
        })
        .input(AuthInputValidator)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const { authProvider } = await verifyAndGetContactMethod(input);
            const userKey = await requireUserKey(authProvider);

            assertDidOwner(userKey, ctx.user.did);
            await deleteUserKeyByAuthProvider(authProvider);

            return { success: true };
        }),
});
