/**
 * Provider-agnostic auth verification helpers
 */

import { TRPCError } from '@trpc/server';
import admin from 'firebase-admin';

export interface VerifiedUser {
    id: string;
    email?: string;
    phone?: string;
    providerType: string;
}

export type AuthProviderType = 'firebase' | 'supertokens' | 'keycloak' | 'oidc';

export async function verifyFirebaseToken(token: string): Promise<VerifiedUser> {
    // E2E test or offline bypass - parse JWT without Firebase Admin verification
    if (process.env.IS_E2E_TEST === 'true' || process.env.IS_OFFLINE === 'true') {
        try {
            const parts = token.split('.');
            const payloadPart = parts[1];
            if (parts.length >= 2 && payloadPart) {
                // Try base64url first, then regular base64
                let payload;
                try {
                    payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString());
                } catch {
                    payload = JSON.parse(Buffer.from(payloadPart, 'base64').toString());
                }
                return {
                    id: payload.sub || payload.uid || payload.user_id || 'offline-user',
                    email: payload.email,
                    phone: payload.phone_number,
                    providerType: 'firebase',
                };
            }
        } catch (e) {
            console.warn('Failed to parse JWT in offline mode:', e);
            // Fall through to normal verification
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
        console.error('Firebase token verification failed:', error);
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

export async function verifyKeycloakToken(_token: string): Promise<VerifiedUser> {
    // Keycloak verification would go here
    // This would use the existing verifyKeycloakToken from firebase.helpers.ts
    // but return a VerifiedUser instead of creating a Firebase user
    throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Keycloak verification not yet implemented for SSS',
    });
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

export function getContactMethodFromUser(user: VerifiedUser): { type: 'email' | 'phone'; value: string } | null {
    if (user.email) {
        return { type: 'email', value: user.email.toLowerCase() };
    }
    if (user.phone) {
        return { type: 'phone', value: user.phone };
    }
    return null;
}
