/**
 * SSS Key Manager routes
 * Provider-agnostic routes for managing SSS shares
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { t, openRoute } from '@routes';
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
} from '@models/UserKey';

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
                        createdAt: z.date(),
                        credentialId: z.string().optional(),
                    })
                ),
                keyProvider: z.enum(['web3auth', 'sss']),
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

            return {
                authShare: userKey.authShare ?? null,
                primaryDid: userKey.primaryDid ?? null,
                securityLevel: userKey.securityLevel,
                recoveryMethods: userKey.recoveryMethods.map(rm => ({
                    type: rm.type,
                    createdAt: rm.createdAt,
                    credentialId: rm.credentialId,
                })),
                keyProvider: userKey.keyProvider,
            };
        }),

    storeAuthShare: openRoute
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
        .mutation(async ({ input }) => {
            const { user, contactMethod } = await verifyAndGetContactMethod(input);

            await upsertUserKey(contactMethod, {
                authShare: input.authShare,
                primaryDid: input.primaryDid,
                securityLevel: input.securityLevel ?? 'basic',
                keyProvider: 'sss',
                authProviders: [{ type: input.providerType, id: user.id }],
            });

            return { success: true };
        }),

    addRecoveryMethod: openRoute
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
        .mutation(async ({ input }) => {
            const { contactMethod } = await verifyAndGetContactMethod(input);

            const userKey = await findUserKeyByContactMethod(contactMethod);
            if (!userKey) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'User key not found. Set up SSS first.',
                });
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

            const recoveryMethod = userKey.recoveryMethods.find(rm => {
                if (rm.type !== input.type) return false;
                if (input.type === 'passkey' && input.credentialId) {
                    return rm.credentialId === input.credentialId;
                }
                return true;
            });

            return recoveryMethod?.encryptedShare ?? null;
        }),

    markMigrated: openRoute
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
        .mutation(async ({ input }) => {
            const { contactMethod } = await verifyAndGetContactMethod(input);

            await markUserKeyMigrated(contactMethod);

            return { success: true };
        }),

    deleteUserKey: openRoute
        .meta({
            openapi: {
                method: 'DELETE',
                path: '/keys',
                tags: ['Keys'],
                summary: 'Delete user key and all associated data',
            },
        })
        .input(AuthInputValidator)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input }) => {
            const { contactMethod } = await verifyAndGetContactMethod(input);

            await deleteUserKey(contactMethod);

            return { success: true };
        }),
});
