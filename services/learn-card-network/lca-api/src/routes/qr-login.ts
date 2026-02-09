/**
 * QR Login Relay Routes
 *
 * Ephemeral relay for cross-device login via QR code or short numeric code.
 * The server never sees the device share in plaintext — it only relays
 * encrypted bytes between devices.
 *
 * Flow:
 *   1. Device B (new) creates a session with its ephemeral public key
 *   2. Device A (logged in) scans QR / enters short code, encrypts its
 *      device share with the ephemeral public key, and POSTs the payload
 *   3. Device B polls until the encrypted payload appears, then decrypts
 *      locally with its ephemeral private key
 *
 * All session data lives in Redis with short TTLs and is auto-evicted.
 */

import { z } from 'zod';
import crypto from 'crypto';

import { t, openRoute } from '@routes';
import cache from '@cache';
import { verifyAuthToken, getContactMethodFromUser, AuthProviderType } from '@helpers/auth.helpers';
import { findUserKeyByContactMethod } from '@models';
import { sendPushNotification } from '@helpers/pushNotifications.helpers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** How long a session lives before auto-eviction (seconds) */
const SESSION_TTL_SECONDS = 120;

/** How long an approved payload lives before auto-eviction (seconds) */
const PAYLOAD_TTL_SECONDS = 60;

/** Redis key prefixes */
const SESSION_PREFIX = 'qr-login:session:';
const CODE_PREFIX = 'qr-login:code:';
const RATE_PREFIX = 'qr-login:rate:';

/** Rate limiting */
const CREATE_RATE_LIMIT = 10;       // max session creations per window
const CREATE_RATE_WINDOW = 600;     // 10-minute window (seconds)
const LOOKUP_RATE_LIMIT = 20;       // max lookups per window
const LOOKUP_RATE_WINDOW = 60;      // 1-minute window (seconds)
const APPROVE_RATE_LIMIT = 5;       // max approve attempts per session
const NOTIFY_RATE_LIMIT = 3;        // max notify calls per window
const NOTIFY_RATE_WINDOW = 300;     // 5-minute window (seconds)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check and increment a rate-limit counter in Redis.
 * Returns true if the request is allowed, false if rate-limited.
 */
const checkRateLimit = async (
    key: string,
    maxAttempts: number,
    windowSeconds: number
): Promise<boolean> => {
    const current = Number(await cache.get(`${RATE_PREFIX}${key}`)) || 0;

    if (current >= maxAttempts) return false;

    await cache.set(`${RATE_PREFIX}${key}`, current + 1, windowSeconds, current > 0);

    return true;
};

const generateSessionId = (): string => crypto.randomUUID();

const generateShortCode = (): string => {
    // 8-digit numeric code, zero-padded (10^8 = 100M possibilities)
    return crypto.randomInt(0, 100_000_000).toString().padStart(8, '0');
};

interface SessionData {
    sessionId: string;
    shortCode: string;
    publicKey: string;
    status: 'pending' | 'approved';
    encryptedPayload?: string;
    approverDid?: string;
}

const getSession = async (sessionId: string): Promise<SessionData | null> => {
    const raw = await cache.get(`${SESSION_PREFIX}${sessionId}`);

    if (!raw) return null;

    return JSON.parse(raw) as SessionData;
};

const setSession = async (session: SessionData, ttl: number): Promise<void> => {
    await cache.set(`${SESSION_PREFIX}${session.sessionId}`, JSON.stringify(session), ttl);
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const qrLoginRouter = t.router({
    /**
     * Create a new QR login session.
     *
     * Called by Device B (the device that wants to log in).
     * Device B generates an ephemeral X25519 keypair locally and sends the
     * public key here. The server stores it and returns a session ID + short code.
     *
     * No authentication required — Device B isn't logged in yet.
     */
    createSession: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/qr-login/session',
                tags: ['QR Login'],
                summary: 'Create a QR login session (called by the new device)',
            },
        })
        .input(
            z.object({
                /** Base64-encoded ephemeral X25519 public key from Device B */
                publicKey: z.string().min(1),
            })
        )
        .output(
            z.object({
                sessionId: z.string(),
                shortCode: z.string(),
                expiresInSeconds: z.number(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            // Rate limit by IP — max 10 sessions per 10 minutes
            const clientIp = ctx.clientIp ?? 'unknown';

            if (!(await checkRateLimit(`create:${clientIp}`, CREATE_RATE_LIMIT, CREATE_RATE_WINDOW))) {
                throw new Error('Too many session requests. Please try again later.');
            }

            const sessionId = generateSessionId();
            const shortCode = generateShortCode();

            const session: SessionData = {
                sessionId,
                shortCode,
                publicKey: input.publicKey,
                status: 'pending',
            };

            // Store session by ID
            await setSession(session, SESSION_TTL_SECONDS);

            // Store short code → session ID mapping
            await cache.set(`${CODE_PREFIX}${shortCode}`, sessionId, SESSION_TTL_SECONDS);

            return {
                sessionId,
                shortCode,
                expiresInSeconds: SESSION_TTL_SECONDS,
            };
        }),

    /**
     * Get session info (for Device A to retrieve the public key).
     *
     * Device A scans the QR or enters the short code. This route lets it
     * fetch the session's ephemeral public key so it can encrypt the share.
     *
     * Accepts either sessionId or shortCode as a lookup key.
     */
    getSession: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/qr-login/session/{lookup}',
                tags: ['QR Login'],
                summary: 'Get QR login session info (public key + status)',
            },
        })
        .input(
            z.object({
                /** Session ID or 6-digit short code */
                lookup: z.string().min(1),
            })
        )
        .output(
            z.object({
                sessionId: z.string(),
                publicKey: z.string(),
                status: z.enum(['pending', 'approved']),
                encryptedPayload: z.string().optional(),
                approverDid: z.string().optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            let sessionId = input.lookup;

            // Rate limit short-code lookups to prevent brute-force enumeration
            if (/^\d{8}$/.test(input.lookup)) {
                const clientIp = ctx.clientIp ?? 'unknown';

                if (!(await checkRateLimit(`lookup:${clientIp}`, LOOKUP_RATE_LIMIT, LOOKUP_RATE_WINDOW))) {
                    throw new Error('Too many lookup attempts. Please try again later.');
                }
            }

            // If it looks like a short code (8 digits), resolve to session ID
            if (/^\d{8}$/.test(input.lookup)) {
                const resolved = await cache.get(`${CODE_PREFIX}${input.lookup}`);

                if (!resolved) {
                    throw new Error('Session not found or expired');
                }

                sessionId = resolved;
            }

            const session = await getSession(sessionId);

            if (!session) {
                throw new Error('Session not found or expired');
            }

            return {
                sessionId: session.sessionId,
                publicKey: session.publicKey,
                status: session.status,
                encryptedPayload: session.encryptedPayload,
                approverDid: session.approverDid,
            };
        }),

    /**
     * Approve a QR login session.
     *
     * Called by Device A (the logged-in device) after it encrypts its device
     * share with the session's ephemeral public key.
     *
     * The encrypted payload is opaque to the server — it cannot decrypt it.
     */
    approveSession: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/qr-login/session/{sessionId}/approve',
                tags: ['QR Login'],
                summary: 'Approve a QR login session (push encrypted device share)',
            },
        })
        .input(
            z.object({
                sessionId: z.string().min(1),

                /**
                 * Base64-encoded encrypted payload.
                 * Contains the device share encrypted with the session's
                 * ephemeral public key via X25519 + AES-GCM.
                 */
                encryptedPayload: z.string().min(1),

                /** DID of the approving device (so Device B knows which account) */
                approverDid: z.string().min(1),
            })
        )
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input, ctx: _ctx }) => {
            // Rate limit approve attempts per session to prevent brute-force
            if (!(await checkRateLimit(`approve:${input.sessionId}`, APPROVE_RATE_LIMIT, SESSION_TTL_SECONDS))) {
                throw new Error('Too many approve attempts for this session.');
            }

            const session = await getSession(input.sessionId);

            if (!session) {
                throw new Error('Session not found or expired');
            }

            if (session.status === 'approved') {
                throw new Error('Session already approved');
            }

            // Update session with the encrypted payload
            const updated: SessionData = {
                ...session,
                status: 'approved',
                encryptedPayload: input.encryptedPayload,
                approverDid: input.approverDid,
            };

            await setSession(updated, PAYLOAD_TTL_SECONDS);

            // Clean up the short code mapping (one-time use)
            await cache.delete([`${CODE_PREFIX}${session.shortCode}`]);

            return { success: true };
        }),

    /**
     * Send a push notification to the authenticated user's other devices.
     *
     * Called by Device B after creating a QR session, when the user is
     * authenticated via Firebase but in needs_recovery (no local key).
     * The notification prompts Device A to open the approver flow.
     *
     * Requires a Firebase auth token (not DID auth — Device B has no DID yet).
     */
    notifyDevices: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/qr-login/notify',
                tags: ['QR Login'],
                summary: 'Send a device link push notification to the user\'s other devices',
            },
        })
        .input(
            z.object({
                /** Firebase (or other auth provider) token */
                authToken: z.string().min(1),

                /** Auth provider type (e.g. 'firebase') */
                providerType: z.enum(['firebase', 'supertokens', 'keycloak', 'oidc']),

                /** The QR session ID to include in the notification data */
                sessionId: z.string().min(1),

                /** The short code to include in the notification data */
                shortCode: z.string().min(1),
            })
        )
        .output(z.object({ sent: z.boolean(), deviceCount: z.number() }))
        .mutation(async ({ input, ctx: _ctx }) => {
            // Rate limit notify calls per session
            if (!(await checkRateLimit(`notify:${input.sessionId}`, NOTIFY_RATE_LIMIT, NOTIFY_RATE_WINDOW))) {
                return { sent: false, deviceCount: 0 };
            }

            // Verify the auth token and get the user
            const user = await verifyAuthToken(input.authToken, input.providerType as AuthProviderType);

            const contactMethod = getContactMethodFromUser(user);

            if (!contactMethod) {
                throw new Error('User must have an email or phone number');
            }

            // Look up the user's DID from their key record
            const userKey = await findUserKeyByContactMethod(contactMethod);

            if (!userKey?.primaryDid) {
                return { sent: false, deviceCount: 0 };
            }

            const did = userKey.primaryDid;

            // Send push notification to all devices for this DID
            try {
                const result = await sendPushNotification({
                    type: 'DEVICE_LINK_REQUEST',
                    to: { did },
                    from: { did },
                    message: {
                        title: 'New Device Login Request',
                        body: 'Another device is requesting access to your account. Tap to approve.',
                    },
                    data: {
                        metadata: {
                            sessionId: input.sessionId,
                            shortCode: input.shortCode,
                        },
                    },
                });

                return {
                    sent: result.successCount > 0,
                    deviceCount: result.successCount,
                };
            } catch (e) {
                console.warn('Failed to send device link push notification:', e);
                return { sent: false, deviceCount: 0 };
            }
        }),
});
