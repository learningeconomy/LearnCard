/**
 * Provider-agnostic auth verification helpers
 */

import { environment } from '@environment';
import { TRPCError } from '@trpc/server';
import admin from 'firebase-admin';
import { z } from 'zod';
import { getKeycloakVerifyOptionsFromEnv, verifyKeycloakJwt } from './keycloak.helpers';

const offlineFirebaseClaimsSchema = z.object({
    sub: z.string().optional(),
    uid: z.string().optional(),
    user_id: z.string().optional(),
    email: z.string().nullish(),
    phone_number: z.string().nullish(),
});

export interface VerifiedUser {
    id: string;
    email?: string;
    phone?: string;
    providerType: string;
}

export type AuthProviderType = 'firebase' | 'supertokens' | 'keycloak' | 'oidc';

const parseOfflineFirebaseClaims = (
    token: string
): z.infer<typeof offlineFirebaseClaimsSchema> | undefined => {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return undefined;
    try {
        const decoded: unknown = JSON.parse(Buffer.from(payloadPart, 'base64url').toString());
        return offlineFirebaseClaimsSchema.parse(decoded);
    } catch {
        return undefined;
    }
};

export async function verifyFirebaseToken(token: string): Promise<VerifiedUser> {
    // E2E test or offline bypass - parse JWT without Firebase Admin verification
    if (environment.IS_E2E_TEST || environment.IS_OFFLINE) {
        const payload = parseOfflineFirebaseClaims(token);
        if (payload) {
            return {
                id: payload.sub || payload.uid || payload.user_id || 'offline-user',
                email: payload.email ?? undefined,
                phone: payload.phone_number ?? undefined,
                providerType: 'firebase',
            };
        }
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        return {
            id: decodedToken.uid,
            email: decodedToken.email,
            phone: decodedToken.phone_number,
            providerType: 'firebase',
        };
    } catch (error) {
        console.warn('Firebase token verification failed:', error);
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid Firebase token',
        });
    }
}

export async function verifySuperTokensToken(_token: string): Promise<VerifiedUser> {
    // SuperTokens verification would go here
    // For now, throw an error indicating it's not yet implemented
    // In production, this would call SuperTokens SDK to verify the session
    throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'SuperTokens verification not yet implemented',
    });
}

export async function verifyKeycloakToken(token: string): Promise<VerifiedUser> {
    const options = getKeycloakVerifyOptionsFromEnv();
    if (!options) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Keycloak verification is not configured',
        });
    }
    let claims;
    try {
        claims = await verifyKeycloakJwt(token, options);
    } catch {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Keycloak token' });
    }
    if (claims.email !== undefined && claims.email_verified !== true) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Email address is not verified' });
    }
    if (claims.phone_number !== undefined && claims.phone_number_verified !== true) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Phone number is not verified' });
    }
    if (!claims.email && !claims.phone_number) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Token has no verified contact method',
        });
    }
    return {
        id: claims.sub,
        email: claims.email,
        phone: claims.phone_number,
        providerType: 'keycloak',
    };
}

export async function verifyOidcToken(_token: string): Promise<VerifiedUser> {
    // Generic OIDC verification
    throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'OIDC verification not yet implemented',
    });
}

export async function verifyAuthToken(
    token: string,
    providerType: AuthProviderType
): Promise<VerifiedUser> {
    switch (providerType) {
        case 'firebase':
            return verifyFirebaseToken(token);
        case 'supertokens':
            return verifySuperTokensToken(token);
        case 'keycloak':
            return verifyKeycloakToken(token);
        case 'oidc':
            return verifyOidcToken(token);
        default:
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Unknown auth provider type: ${providerType}`,
            });
    }
}

export function getContactMethodFromUser(
    user: VerifiedUser
): { type: 'email' | 'phone'; value: string } | null {
    if (user.email) {
        return { type: 'email', value: user.email.toLowerCase() };
    }
    if (user.phone) {
        return { type: 'phone', value: user.phone };
    }
    return null;
}
