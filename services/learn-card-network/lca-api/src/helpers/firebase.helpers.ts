import { z } from 'zod';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import forge from 'node-forge';

import admin from 'firebase-admin';

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

export const createFirebaseToken = async (keycloakToken: string): Promise<string> => {
    const keycloakUser = await verifyKeycloakToken(keycloakToken);

    let uid = keycloakUser.sub;
    const email = keycloakUser.email || null;
    const displayName = keycloakUser.name || null;
    const emailVerified = keycloakUser.email_verified || false;
    const roles = keycloakUser.roles || [];

    let firebaseUser: any;

    try {
        if (email) {
            const existingUsers = await admin.auth().getUsers([{ email }]);

            if (existingUsers.users.length > 0) {
                firebaseUser = existingUsers?.users?.[0];

                if (firebaseUser?.uid !== uid) {
                    await admin.auth().updateUser(firebaseUser.uid, {
                        emailVerified,
                        displayName,
                    });

                    uid = firebaseUser?.uid;
                }
            }
        }

        if (!firebaseUser) {
            firebaseUser = await admin.auth().createUser({
                uid,
                email,
                displayName,
                emailVerified,
            });
        }
    } catch (error) {
        console.error('Error checking or creating Firebase user:', error);
        throw new Error('Firebase user creation or lookup failed');
    }

    return admin.auth().createCustomToken(uid, { email, name: displayName, roles });
};
