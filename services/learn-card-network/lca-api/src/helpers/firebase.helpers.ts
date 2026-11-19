import { z } from 'zod';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import forge from 'node-forge';

import admin from 'firebase-admin';

import type { AdminAuth } from '@helpers/firebaseAdminAuth.helpers';
import { resolveOrCreateFirebaseUserByEmail } from '@helpers/classlinkPrimaryEmail.helpers';

const KEYCLOAK_ISSUER = 'https://sso.scout.org/auth/realms/wsb';
const JWKS_URI = 'https://sso.scout.org/auth/realms/wsb/protocol/openid-connect/certs';

export const FirebaseCustomAuthResponseSchema = z.object({
    firebaseToken: z.string(),
});
export type FirebaseCustomAuthResponse = z.infer<typeof FirebaseCustomAuthResponseSchema>;

export const UserRecordSchema = z.object({
    uid: z.string(),
    email: z.string().nullable(),
    emailVerified: z.boolean(),
    displayName: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    photoURL: z.string().nullable(),
    disabled: z.boolean(),
    providerData: z.array(
        z.object({
            uid: z.string(),
            displayName: z.string().nullable(),
            email: z.string().nullable(),
            phoneNumber: z.string().nullable(),
            photoURL: z.string().nullable(),
            providerId: z.string(),
        })
    ),
    metadata: z.object({
        creationTime: z.string(),
        lastSignInTime: z.string().nullable(),
    }),
    customClaims: z.record(z.string(), z.any()).optional(),
});
export type UserRecordType = z.infer<typeof UserRecordSchema>;

export const getKeycloakPublicKey = async (kid: string): Promise<string> => {
    try {
        const { data } = await axios.get(JWKS_URI);
        const key = data.keys.find((keyItem: any) => keyItem.kid === kid);
        if (!key) throw new Error('Keycloak public key not found');

        const certBase64 = key.x5c[0];
        const certDer = forge.util.decode64(certBase64);
        const certAsn1 = forge.asn1.fromDer(certDer);
        const cert = forge.pki.certificateFromAsn1(certAsn1);

        // !! Converts the certificate (which is in a base64 encoded format) !!
        // !! into a PEM-formatted public key using node-forge. !!
        // !! this needs to happen, otherwise firebase custom token creation will fail !!
        // !! for invalid formatting
        return forge.pki.publicKeyToPem(cert.publicKey);
    } catch (error) {
        console.error('Error fetching Keycloak public key:', error);
        throw new Error('Failed to fetch Keycloak public key');
    }
};

export const verifyKeycloakToken = async (keycloakToken: string): Promise<any> => {
    try {
        const decoded = jwt.decode(keycloakToken, { complete: true });
        if (!decoded || !decoded.header || !decoded.payload) {
            throw new Error('Invalid Keycloak Token');
        }

        const kid: string | undefined = decoded.header.kid;
        if (!kid) {
            throw new Error('Token header does not contain a key identifier (kid)');
        }

        const publicKey = await getKeycloakPublicKey(kid);

        return jwt.verify(keycloakToken, publicKey, {
            algorithms: ['RS256'],
            issuer: KEYCLOAK_ISSUER,
        });
    } catch (error) {
        console.error('Error verifying Keycloak token:', error);
        throw new Error('Token verification failed');
    }
};

/** Keycloak token claims the bridge reads. */
export type KeycloakBridgeUser = {
    sub: string;
    email?: string | null;
    email_verified?: boolean;
    name?: string | null;
    roles?: string[];
};

/**
 * Map a verified Keycloak user to a Firebase user and mint its custom token.
 *
 * Only an email Keycloak marks `email_verified: true` maps by email, through
 * `resolveOrCreateFirebaseUserByEmail` (so the ClassLink school-email alias and the orphan
 * guard apply; a moved or orphaned account fails). Any other user signs in as the Keycloak
 * subject's own uid and is never matched to an existing user by email. `emailVerified: false`
 * is never written onto a matched user.
 */
export const createFirebaseTokenForKeycloakUser = async (
    keycloakUser: KeycloakBridgeUser,
    auth: AdminAuth = admin.auth()
): Promise<string> => {
    const sub = keycloakUser.sub;
    const email = keycloakUser.email?.trim().toLowerCase() || null;
    const displayName = keycloakUser.name || null;
    const roles = keycloakUser.roles || [];
    let uid = sub;

    try {
        if (email && keycloakUser.email_verified === true) {
            const resolved = await resolveOrCreateFirebaseUserByEmail(auth, email, {
                allowCreate: true,
                create: { uid: sub, email, displayName, emailVerified: true },
            });
            if (!('uid' in resolved)) throw new Error(`Bridge mapping refused: ${resolved.status}`);
            uid = resolved.uid;
            // An existing email user (not the alias) is linked as before.
            if (resolved.status === 'found' && uid !== sub)
                await auth.updateUser(uid, { emailVerified: true, displayName });
        } else {
            const existing = await auth.getUser(sub).catch((error: unknown) => {
                if ((error as { code?: unknown })?.code === 'auth/user-not-found') return undefined;
                throw error;
            });
            if (!existing)
                await auth.createUser({
                    uid: sub,
                    ...(email ? { email } : {}),
                    displayName,
                    emailVerified: false,
                });
        }
    } catch (error) {
        console.error('Error checking or creating Firebase user:', error);
        throw new Error('Firebase user creation or lookup failed');
    }

    return auth.createCustomToken(uid, { email, name: displayName, roles });
};

export const createFirebaseToken = async (keycloakToken: string): Promise<string> =>
    createFirebaseTokenForKeycloakUser(await verifyKeycloakToken(keycloakToken));
