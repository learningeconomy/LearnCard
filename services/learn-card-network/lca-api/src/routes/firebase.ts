import { z } from 'zod';
import axios from 'axios';
import crypto from 'crypto';

import app from '@firebase';
import admin from 'firebase-admin';
import { VC } from '@learncard/types';
import { t, openRoute, authorizedDidRoute } from '@routes';
import {
    UserRecordSchema,
    UserRecordType,
    verifyKeycloakToken,
    FirebaseCustomAuthResponseSchema,
} from '@helpers/firebase.helpers';
import cache from '@cache';
import {
    getFrom,
    sendEmailWithTemplate,
    LOGIN_VERIFICATION_CODE_TEMPLATE_ID,
} from '@helpers/postmark.helpers';
import { TRPCError } from '@trpc/server';
import jwtDecode from 'jwt-decode';
import { getDidWebLearnCard, getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { isAuthorizedDID } from '@helpers/dids.helpers';

export const ScoutsSSOUserLoginEndpoint: string =
    'https://sso.scout.org/auth/realms/wsb/protocol/openid-connect/token';

export const scoutsSSOClientId: string = 'scoutpass';
export const scoutsSSOClientSecret = process.env.SCOUTS_SSO_CLIENT_SECRET;

export const ScoutsSSOResponseSchema = z
    .object({
        access_token: z.string(),
        expires_in: z.number(),
        'not-before-policy': z.number(),
        refresh_expires_in: z.number(),
        refresh_token: z.string(),
        scope: z.string(),
        session_state: z.string(),
        token_type: z.string(),
        error: z.string().optional(),
        error_description: z.string().optional(),
    })
    .nullable();
export type ScoutSSOResponseType = z.infer<typeof ScoutsSSOResponseSchema>;

export type DidAuthVP = {
    iss: string;
    vp: {
        '@context': string[];
        type: string[];
        holder: string;
        verifiableCredential?: VC[];
    };
    nonce?: string;
};

export type ContactMethod = {
    type: 'email' | 'phone';
    value: string;
}

const CODE_TTL_SECONDS = 5 * 60; // 5 minutes
const MAX_ATTEMPTS = 6;
const ATTEMPT_TTL_SECONDS = 5 * 60; // 5 minutes

export const CONTACT_METHOD_SESSION_PREFIX = 'contact_method_session:';


async function createFirebaseToken(keycloakToken: string): Promise<string> {
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
                    console.log(
                        `⚠️ Existing account found for ${email}, linking Keycloak UID: ${uid}`
                    );

                    await admin.auth().updateUser(firebaseUser.uid, {
                        emailVerified,
                        displayName,
                    });

                    uid = firebaseUser?.uid;
                }
            }
        }

        if (!firebaseUser) {
            console.log(`🆕 Creating new Firebase user for ${email} (UID: ${uid})`);

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
}

export const firebaseRouter = t.router({
    getFirebaseUserByEmail: authorizedDidRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/get-users-by-email',
                tags: ['firebase'],
                summary: 'Get Users by Email',
                description: 'Fetches user details using their email from Firebase.',
            },
        })
        .input(z.object({ email: z.string().email() }))
        .output(z.object({ userRecord: UserRecordSchema.nullable() }))
        .query(async ({ input }) => {
            try {
                const { email } = input;
                const userRecord = await app?.auth().getUserByEmail(email);

                if (!userRecord) {
                    return { userRecord: null };
                }

                const formattedUserRecord: UserRecordType = {
                    uid: userRecord.uid,
                    email: userRecord.email ?? null,
                    emailVerified: userRecord.emailVerified,
                    displayName: userRecord.displayName ?? null,
                    phoneNumber: userRecord.phoneNumber ?? null,
                    photoURL: userRecord.photoURL ?? null,
                    disabled: userRecord.disabled,
                    providerData: userRecord.providerData.map(provider => ({
                        uid: provider.uid,
                        displayName: provider.displayName ?? null,
                        email: provider.email ?? null,
                        phoneNumber: provider.phoneNumber ?? null,
                        photoURL: provider.photoURL ?? null,
                        providerId: provider.providerId,
                    })),
                    metadata: {
                        creationTime: userRecord.metadata.creationTime,
                        lastSignInTime: userRecord.metadata.lastSignInTime ?? null,
                    },
                    customClaims: userRecord.customClaims ?? {},
                };

                return { userRecord: formattedUserRecord };
            } catch (error) {
                console.error('Error fetching firebase user data', error);
                return { userRecord: null };
            }
        }),
    authenticateWithKeycloak: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/authenticate-keycloak',
                tags: ['firebase'],
                summary: 'Authenticate with Keycloak',
                description:
                    'Exchanges a Keycloak token for a Firebase custom authentication token.',
            },
        })
        .input(z.object({ keycloakToken: z.string() }))
        .output(FirebaseCustomAuthResponseSchema)
        .mutation(async ({ input }) => {
            try {
                const { keycloakToken } = input;
                const firebaseToken = await createFirebaseToken(keycloakToken);
                return { firebaseToken };
            } catch (error) {
                console.error('Error during Keycloak authentication:', error);
                throw new Error('Authentication failed');
            }
        }),
    authenticateWithScoutsSSO: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/authenticate/scouts',
                tags: ['Scouts SSO'],
                summary: 'Scouts SSO',
                description: 'Authenticates with Scouts SSO',
            },
        })
        .input(z.object({ username: z.string(), password: z.string() }))
        .output(ScoutsSSOResponseSchema)
        .mutation(async ({ input }) => {
            if (!scoutsSSOClientId || !scoutsSSOClientSecret) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'This server is not configured to authenticate with Scouts SSO.',
                });
            }
            try {
                const response = await axios.post<ScoutSSOResponseType>(
                    ScoutsSSOUserLoginEndpoint,
                    new URLSearchParams({
                        grant_type: 'password',
                        client_id: scoutsSSOClientId,
                        client_secret: scoutsSSOClientSecret as string,
                        username: input.username,
                        password: input.password,
                    }).toString(),
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    }
                );

                return response.data ?? null;
            } catch (error) {
                console.log('Unable to authenticate with Scouts SSO', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Unable to authenticate with Scouts SSO',
                });
            }
        }),
    sendLoginVerificationCode: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/send-login-verification-code',
                tags: ['firebase'],
                summary: 'Send Login Verification Code',
                description: 'Sends a verification code to the user for login.',
            },
        })
        .input(z.object({ email: z.string().email() }))
        .output(z.object({ success: z.boolean(), error: z.string().optional() }))
        .mutation(async ({ input }) => {
            const { email } = input;

            try {
                // rate limit attempts (max 3 codes per 10 mins)
                const attemptKey = `login-attempts:${email}`;
                const attemptCount = Number(await cache.get(attemptKey)) || 0;

                if (attemptCount >= MAX_ATTEMPTS) {
                    return {
                        success: false,
                        error: 'Too many login attempts. Try again in a few minutes.',
                    };
                }

                await cache.set(attemptKey, attemptCount + 1, ATTEMPT_TTL_SECONDS);

                // clear existing codes for this email (enforce 1 active code at a time)
                const existingCodeKeys = await cache.keys(`login-code:${email}:*`);
                if (existingCodeKeys?.length) {
                    await cache.delete(existingCodeKeys);
                }

                // generate secure random 6-digit code
                const code = crypto.randomInt(100000, 999999).toString();
                const redisKey = `login-code:${email}:${code}`;

                // store code in Redis with 5-min TTL
                await cache.set(redisKey, '1', CODE_TTL_SECONDS);

                if (code) {
                    try {
                        await sendEmailWithTemplate(
                            email,
                            Number(LOGIN_VERIFICATION_CODE_TEMPLATE_ID),
                            {
                                verificationCode: code,
                                verificationEmail: email,
                                recipient: { name: email },
                            },
                            getFrom({ mailbox: 'login' })
                        );
                    } catch (error) {
                        console.error('Failed to send verification email:', error);
                        return { success: false, error: 'Error sending login verification code' };
                    }
                }

                return { success: true };
            } catch (err: any) {
                console.error('Error sending login verification code:', err);
                return { success: false, error: err.message };
            }
        }),
    verifyLoginCode: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/verify-login-code',
                tags: ['firebase'],
                summary: 'Verify Login Code and Return Auth Token',
                description:
                    'Verifies a 6-digit login code and returns a Firebase custom auth token.',
            },
        })
        .input(z.object({ email: z.string().email(), code: z.string().length(6) }))
        .output(
            z.object({
                success: z.boolean(),
                error: z.string().optional(),
                token: z.string().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const { email, code } = input;

            const redisKey = `login-code:${email}:${code}`;

            try {
                // check if code exists
                const cached = await cache.get(redisKey);
                if (!cached) {
                    return { success: false, error: 'Invalid or expired code.' };
                }

                // delete the code to prevent reuse
                await cache.delete([redisKey]);

                // get or create the Firebase user
                let user;
                try {
                    user = await app?.auth().getUserByEmail(email);
                } catch {
                    user = await app?.auth().createUser({ email });
                }

                if (!user) {
                    return { success: false, error: 'Unable to find or create user.' };
                }

                // create Firebase custom auth token
                const token = await app?.auth().createCustomToken(user.uid);

                return { success: true, token };
            } catch (err: any) {
                console.error('Error verifying login code:', err);
                return { success: false, error: err.message };
            }
        }),
    verifyNetworkHandoffToken: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/verify-network-handoff-token',
                tags: ['firebase'],
                summary: 'Verify Network Handoff Token and Return Auth Token',
                description:
                    'Verifies a network handoff token and returns a Firebase custom auth token.',
            },
        })
        .input(z.object({ token: z.string() }))
        .output(
            z.object({
                success: z.boolean(),
                error: z.string().optional(),
                token: z.string().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const { token: jwt } = input;

            try {
                
                const learnCard = await getEmptyLearnCard();
                const result = await learnCard.invoke.verifyPresentation(jwt, { proofFormat: 'jwt' });
                let contactMethod: ContactMethod | null = null;

                if (
                    result.warnings.length === 0 &&
                    result.errors.length === 0 &&
                    result.checks.includes('JWS')
                ) {
                    const decodedJwt = jwtDecode<DidAuthVP>(jwt);
    
                    const did = decodedJwt.vp.holder;
                    const challenge = decodedJwt.nonce;
    
                    if (!challenge)
                        return { success: false, error: 'Invalid LCN token.' };
        
                    // If the user is using a provisional auth token for a contact method:
                    if (challenge?.includes(CONTACT_METHOD_SESSION_PREFIX)) {
                        if (isAuthorizedDID(did)) {
                            const type = challenge.split(':')[2];
                            const value = challenge.split(':')[3];
                            
                            if (!type || !value)
                                return { success: false, error: 'Invalid LCN token: contact method type and value are required.' };
                            
                            if (type !== 'email' && type !== 'phone')
                                return { success: false, error: 'Invalid LCN token: contact method type must be email or phone.' };
                            
                            contactMethod = {
                                type,
                                value
                            }
                        }
                    }   
                } else {
                    return { success: false, error: 'Invalid LCN token.' };
                }


                if (!contactMethod) return { success: false, error: 'Invalid LCN token: contact method is required.' };

                // Get or Create the Firebase user based on email or phone
                let user;
                try {
                    if (contactMethod.type === 'email') {
                        user = await app?.auth().getUserByEmail(contactMethod.value);
                    } else if (contactMethod.type === 'phone') {
                        user = await app?.auth().getUserByPhoneNumber(contactMethod.value);
                    } else {
                        return { success: false, error: 'Invalid LCN token contact type.' };
                    }

                } catch {
                    if (contactMethod.type === 'email') {
                        user = await app?.auth().createUser({ email: contactMethod.value });
                    } else if (contactMethod.type === 'phone') {
                        user = await app?.auth().createUser({ phoneNumber: contactMethod.value });
                    } else {
                        return { success: false, error: 'Invalid LCN token contact type.' };
                    }
                }

                if (!user) {
                    return { success: false, error: 'Unable to find or create user.' };
                }

                // Create Firebase custom auth token
                const token = await app?.auth().createCustomToken(user.uid);

                return { success: true, token };
            } catch (err: any) {
                console.error('Error verifying login code:', err);
                return { success: false, error: err.message };
            }
        }),
    getProofOfLoginVp: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/get-proof-of-login-vp',
                tags: ['firebase'],
                summary: 'Get Proof of Login VP',
                description: 'Returns a Proof of Login VP.',
            },
        })
        .input(z.object({ token: z.string() }))
        .output(
            z.object({
                success: z.boolean(),
                error: z.string().optional(),
                vp: z.string().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const { token } = input;

            try {
                const decodedToken = await app?.auth().verifyIdToken(token);

                const learnCard = await getDidWebLearnCard();

                let proofOfLoginChallenge = 'proof-of-login:';
                if (decodedToken?.email) {
                    proofOfLoginChallenge += 'email:' + decodedToken?.email;
                } else if (decodedToken?.phoneNumber){
                    proofOfLoginChallenge += 'phone:' + decodedToken?.phoneNumber;
                }

                const result = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge: proofOfLoginChallenge });

                if (typeof result !== 'string') throw new Error('Error getting DID-Auth-JWT!');

                return { success: true, vp: result };
            } catch (err: any) {
                console.error('Error verifying login code:', err);
                return { success: false, error: err.message };
            }
        }),
});

export type firebaseRouter = typeof firebaseRouter;
