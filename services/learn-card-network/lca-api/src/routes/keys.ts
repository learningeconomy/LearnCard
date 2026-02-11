/**
 * SSS Key Manager routes
 * Provider-agnostic routes for managing SSS shares
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { t, openRoute, didRoute } from '@routes';
import { getDeliveryService } from '../services/delivery';
import { verifyAuthToken, getContactMethodFromUser, AuthProviderType } from '@helpers/auth.helpers';
import {
    findUserKeyByContactMethod,
    upsertUserKey,
    addAuthProviderToUserKey,
    addRecoveryMethodToUserKey,
    markUserKeyMigrated,
    deleteUserKey,
    ServerEncryptedShareValidator,
    EncryptedShareValidator,
    type ContactMethod,
} from '@models';

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
        .input(AuthInputValidator)
        .output(
            z.object({
                authShare: ServerEncryptedShareValidator.nullable(),
                primaryDid: z.string().nullable(),
                securityLevel: z.enum(['basic', 'enhanced', 'advanced']),
                recoveryMethods: z.array(
                    z.object({
                        type: z.enum(['password', 'passkey', 'backup']),
                        createdAt: z.string(),
                        credentialId: z.string().optional(),
                    })
                ),
                keyProvider: z.enum(['web3auth', 'sss']),
                shareVersion: z.number(),
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

            const recoveryMethods = (userKey.recoveryMethods ?? [])
                .filter(rm => rm && rm.type && rm.createdAt)
                .map(rm => ({
                    type: rm.type,
                    createdAt: rm.createdAt instanceof Date ? rm.createdAt.toISOString() : String(rm.createdAt),
                    ...(rm.credentialId ? { credentialId: rm.credentialId } : {}),
                }));

            return {
                authShare: userKey.authShare ?? null,
                primaryDid: userKey.primaryDid ?? null,
                securityLevel: userKey.securityLevel ?? 'basic',
                recoveryMethods,
                keyProvider: userKey.keyProvider ?? 'sss',
                shareVersion: userKey.shareVersion ?? 1,
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
        .output(z.object({ success: z.boolean() }))
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

            await upsertUserKey(contactMethod, {
                authShare: input.authShare,
                primaryDid: authenticatedDid,
                securityLevel: input.securityLevel ?? 'basic',
                keyProvider: 'sss',
                authProviders: [{ type: input.providerType, id: user.id }],
            });

            return { success: true };
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
                type: z.enum(['password', 'passkey', 'backup']),
                encryptedShare: EncryptedShareValidator,
                credentialId: z.string().optional(),
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
                type: z.enum(['password', 'passkey', 'backup']),
                credentialId: z.string().optional(),
            })
        )
        .output(EncryptedShareValidator.nullable())
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

            return recoveryMethod?.encryptedShare ?? null;
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
                email: z.string().email(),
            })
        )
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input }) => {
            // Verify the caller is authenticated
            await verifyAndGetContactMethod(input);

            // IMPORTANT: The emailShare is NEVER written to the database.
            // It is only held in memory for the duration of this request.
            try {
                await getDeliveryService().send({
                    to: input.email,
                    subject: 'Your LearnCard Recovery Key',
                    textBody: [
                        'Your LearnCard Recovery Key',
                        '',
                        'Keep this email safe. You can use the recovery key below to regain',
                        'access to your LearnCard account if you lose your device or forget',
                        'your recovery password.',
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
