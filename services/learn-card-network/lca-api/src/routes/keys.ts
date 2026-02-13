/**
 * SSS Key Manager routes
 * Provider-agnostic routes for managing SSS shares
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { t, openRoute, didRoute } from '@routes';
import { getDeliveryService } from '../services/delivery';
import { verifyAuthToken, getContactMethodFromUser, AuthProviderType } from '@helpers/auth.helpers';
import { encryptAuthShare, decryptAuthShare } from '@helpers/shareEncryption.helpers';
import { maskEmail } from '@helpers/maskEmail';
import cache from '@cache';
import {
    findUserKeyByContactMethod,
    findAuthShareByVersion,
    upsertUserKey,
    addAuthProviderToUserKey,
    addRecoveryMethodToUserKey,
    setRecoveryEmail,
    markUserKeyMigrated,
    deleteUserKey,
    ServerEncryptedShareValidator,
    EncryptedShareValidator,
    type ContactMethod,
} from '@models';

const RECOVERY_EMAIL_CODE_PREFIX = 'recovery_email_code:';
const RECOVERY_EMAIL_CODE_TTL_SECS = 15 * 60; // 15 minutes

const generate6DigitCode = (): string => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    if (!array[0]) throw new Error('Failed to generate random number');
    return (100000 + (array[0] % 900000)).toString();
};

const AuthProviderTypeValidator = z.enum(['firebase', 'supertokens', 'keycloak', 'oidc']);

const AuthInputValidator = z.object({
    authToken: z.string(),
    providerType: AuthProviderTypeValidator,
});

async function verifyAndGetContactMethod(input: { authToken: string; providerType: AuthProviderType }): Promise<{
    user: { id: string; email?: string; phone?: string; providerType: string };
    contactMethod: ContactMethod;
}> {
    const user = await verifyAuthToken(input.authToken, input.providerType);

    const contactMethod = getContactMethodFromUser(user);
    if (!contactMethod) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User must have an email or phone number',
        });
    }

    return { user, contactMethod };
}

export const keysRouter = t.router({
    getAuthShare: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/auth-share',
                tags: ['Keys'],
                summary: 'Get auth share for authenticated user',
            },
        })
        .input(AuthInputValidator.extend({
            shareVersion: z.number().optional(),
        }))
        .output(
            z.object({
                authShare: ServerEncryptedShareValidator.nullable(),
                primaryDid: z.string().nullable(),
                securityLevel: z.enum(['basic', 'enhanced', 'advanced']),
                recoveryMethods: z.array(
                    z.object({
                        type: z.enum(['passkey', 'backup', 'phrase', 'email']),
                        createdAt: z.string(),
                        credentialId: z.string().optional(),
                        shareVersion: z.number().optional(),
                    })
                ),
                keyProvider: z.enum(['web3auth', 'sss']),
                shareVersion: z.number(),
                maskedRecoveryEmail: z.string().nullable(),
            }).nullable()
        )
        .mutation(async ({ input }) => {
            const { user, contactMethod } = await verifyAndGetContactMethod(input);

            const userKey = await findUserKeyByContactMethod(contactMethod);

            if (!userKey) {
                return null;
            }

            await addAuthProviderToUserKey(contactMethod, {
                type: input.providerType,
                id: user.id,
            });

            // If a specific shareVersion is requested, look it up from history
            const requestedVersion = input.shareVersion;
            const rawAuthShare = requestedVersion != null
                ? findAuthShareByVersion(userKey, requestedVersion)
                : userKey.authShare ?? null;

            // Decrypt the auth share before returning to client
            let authShare = rawAuthShare;

            if (rawAuthShare) {
                const seed = process.env.SEED;

                if (!seed) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Server misconfiguration: SEED is required for auth share encryption',
                    });
                }

                authShare = decryptAuthShare(rawAuthShare, seed);
            }

            const recoveryMethods = (userKey.recoveryMethods ?? [])
                .filter(rm => rm && rm.type && rm.createdAt)
                .map(rm => ({
                    type: rm.type,
                    createdAt: rm.createdAt instanceof Date ? rm.createdAt.toISOString() : String(rm.createdAt),
                    ...(rm.credentialId ? { credentialId: rm.credentialId } : {}),
                    ...(rm.shareVersion != null ? { shareVersion: rm.shareVersion } : {}),
                }));

            return {
                authShare,
                primaryDid: userKey.primaryDid ?? null,
                securityLevel: userKey.securityLevel ?? 'basic',
                recoveryMethods,
                keyProvider: userKey.keyProvider ?? 'sss',
                shareVersion: userKey.shareVersion ?? 1,
                maskedRecoveryEmail: userKey.recoveryEmail ? maskEmail(userKey.recoveryEmail) : null,
            };
        }),

    storeAuthShare: didRoute
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
            })
        )
        .output(z.object({ success: z.boolean(), shareVersion: z.number() }))
        .mutation(async ({ ctx, input }) => {
            // DID-Auth: use the VP-authenticated DID as the authoritative primaryDid.
            // The VP is already cryptographically verified by didRoute, so ctx.user.did
            // is the proven owner of the signing key. We prefer it over input.primaryDid
            // to avoid DID-method format mismatches (e.g. did:key vs did:web).
            const authenticatedDid = ctx.user.did;

            if (input.primaryDid && input.primaryDid !== authenticatedDid) {
                console.warn(
                    `[storeAuthShare] DID format mismatch — VP DID: ${authenticatedDid}, body primaryDid: ${input.primaryDid}. Using VP DID.`
                );
            }

            const { user, contactMethod } = await verifyAndGetContactMethod(input);

            // Encrypt the auth share at rest using the server SEED
            const seed = process.env.SEED;

            if (!seed) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Server misconfiguration: SEED is required for auth share encryption',
                });
            }

            const authShareToStore = encryptAuthShare(input.authShare, seed);

            const updatedDoc = await upsertUserKey(contactMethod, {
                authShare: authShareToStore,
                primaryDid: authenticatedDid,
                securityLevel: input.securityLevel ?? 'basic',
                keyProvider: 'sss',
                authProviders: [{ type: input.providerType, id: user.id }],
            });

            return { success: true, shareVersion: updatedDoc.shareVersion ?? 1 };
        }),

    addRecoveryMethod: didRoute
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
            const { contactMethod } = await verifyAndGetContactMethod(input);

            const userKey = await findUserKeyByContactMethod(contactMethod);
            if (!userKey) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'User key not found. Set up SSS first.',
                });
            }

            // DID-Auth: warn on DID format mismatch but proceed — the VP is
            // already cryptographically verified, and format differences (did:key
            // vs did:web for the same underlying key) are expected.
            if (userKey.primaryDid && ctx.user.did !== userKey.primaryDid) {
                console.warn(
                    `[addRecoveryMethod] DID format mismatch — VP DID: ${ctx.user.did}, stored primaryDid: ${userKey.primaryDid}. Proceeding (VP is verified).`
                );
            }

            await addRecoveryMethodToUserKey(contactMethod, {
                type: input.type,
                createdAt: new Date(),
                credentialId: input.credentialId,
                encryptedShare: input.encryptedShare,
                shareVersion: input.shareVersion,
            });

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
            AuthInputValidator.extend({
                type: z.enum(['passkey', 'backup', 'phrase', 'email']),
                credentialId: z.string().optional(),
            })
        )
        .output(
            z.object({
                encryptedShare: EncryptedShareValidator.optional(),
                shareVersion: z.number().optional(),
            }).nullable()
        )
        .query(async ({ input }) => {
            const { contactMethod } = await verifyAndGetContactMethod(input);

            const userKey = await findUserKeyByContactMethod(contactMethod);
            if (!userKey) {
                return null;
            }

            const recoveryMethod = (userKey.recoveryMethods ?? []).find(rm => {
                if (rm.type !== input.type) return false;
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

    markMigrated: didRoute
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
            const { contactMethod } = await verifyAndGetContactMethod(input);

            const userKey = await findUserKeyByContactMethod(contactMethod);

            if (userKey?.primaryDid && ctx.user.did !== userKey.primaryDid) {
                console.warn(
                    `[markMigrated] DID format mismatch — VP DID: ${ctx.user.did}, stored primaryDid: ${userKey.primaryDid}. Proceeding (VP is verified).`
                );
            }

            await markUserKeyMigrated(contactMethod);

            return { success: true };
        }),

    // ── Recovery email verification ─────────────────────────────

    addRecoveryEmail: didRoute
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
        .mutation(async ({ input }) => {
            const { contactMethod } = await verifyAndGetContactMethod(input);

            const userKey = await findUserKeyByContactMethod(contactMethod);
            if (!userKey) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'User key not found. Set up SSS first.',
                });
            }

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
            const cacheKey = `${RECOVERY_EMAIL_CODE_PREFIX}${contactMethod.type}:${contactMethod.value}`;

            // Store: code + target email so verify can confirm both
            await cache.set(cacheKey, JSON.stringify({ code, email: input.email }), RECOVERY_EMAIL_CODE_TTL_SECS);

            try {
                await getDeliveryService().send({
                    to: input.email,
                    subject: 'Verify Your Recovery Email',
                    textBody: [
                        'Verify Your Recovery Email',
                        '',
                        `Your verification code is: ${code}`,
                        '',
                        'Enter this code in the app to verify your recovery email address.',
                        'This code expires in 15 minutes.',
                        '',
                        'If you did not request this, you can safely ignore this email.',
                    ].join('\n'),
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

    verifyRecoveryEmail: didRoute
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
        .mutation(async ({ input }) => {
            const { contactMethod } = await verifyAndGetContactMethod(input);

            const userKey = await findUserKeyByContactMethod(contactMethod);
            if (!userKey) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'User key not found.',
                });
            }

            const cacheKey = `${RECOVERY_EMAIL_CODE_PREFIX}${contactMethod.type}:${contactMethod.value}`;
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
            await setRecoveryEmail(contactMethod, email);

            return { success: true, maskedEmail: maskEmail(email) };
        }),

    getRecoveryEmail: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/recovery-email',
                tags: ['Keys'],
                summary: 'Get the verified recovery email (masked) for the authenticated user',
            },
        })
        .input(AuthInputValidator)
        .output(z.object({ recoveryEmail: z.string().nullable() }))
        .mutation(async ({ input }) => {
            const { contactMethod } = await verifyAndGetContactMethod(input);

            const userKey = await findUserKeyByContactMethod(contactMethod);
            if (!userKey) {
                return { recoveryEmail: null };
            }

            return {
                recoveryEmail: userKey.recoveryEmail ? maskEmail(userKey.recoveryEmail) : null,
            };
        }),

    sendEmailBackup: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/keys/email-backup',
                tags: ['Keys'],
                summary: 'Send email backup share to the authenticated user (fire-and-forget relay, share is NEVER persisted)',
            },
        })
        .input(
            AuthInputValidator.extend({
                emailShare: z.string().min(1),
                // Provide either an explicit email OR set useRecoveryEmail to
                // use the verified recovery email stored on the UserKey.
                email: z.string().email().optional(),
                useRecoveryEmail: z.boolean().optional(),
            })
        )
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input }) => {
            // Verify the caller is authenticated
            const { contactMethod } = await verifyAndGetContactMethod(input);

            let targetEmail = input.email;

            // When useRecoveryEmail is set, look up the stored recovery email
            if (input.useRecoveryEmail && !targetEmail) {
                const userKey = await findUserKeyByContactMethod(contactMethod);

                targetEmail = userKey?.recoveryEmail;

                if (!targetEmail) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'No verified recovery email on file.',
                    });
                }
            }

            if (!targetEmail) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'An email address or useRecoveryEmail flag is required.',
                });
            }

            // IMPORTANT: The emailShare is NEVER written to the database.
            // It is only held in memory for the duration of this request.
            try {
                await getDeliveryService().send({
                    to: targetEmail,
                    subject: 'Your LearnCard Recovery Key',
                    textBody: [
                        'Your LearnCard Recovery Key',
                        '',
                        'Keep this email safe. You can use the recovery key below to regain',
                        'access to your LearnCard account if you lose your device.',
                        '',
                        '--- RECOVERY KEY (do NOT share this with anyone) ---',
                        input.emailShare,
                        '--- END RECOVERY KEY ---',
                        '',
                        'To recover your account, choose "Recover via Email" in the app and',
                        'paste the recovery key above when prompted.',
                        '',
                        'If you did not request this, you can safely ignore this email.',
                    ].join('\n'),
                });
            } catch (emailError) {
                // Non-fatal: log but still return success so the client doesn't retry
                console.error('[email-backup] Failed to send backup share email:', emailError);
            }

            return { success: true };
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
            const { contactMethod } = await verifyAndGetContactMethod(input);

            const userKey = await findUserKeyByContactMethod(contactMethod);

            if (userKey?.primaryDid && ctx.user.did !== userKey.primaryDid) {
                console.warn(
                    `[deleteUserKey] DID format mismatch — VP DID: ${ctx.user.did}, stored primaryDid: ${userKey.primaryDid}. Proceeding (VP is verified).`
                );
            }

            await deleteUserKey(contactMethod);

            return { success: true };
        }),
});
