/**
 * QR Login Client
 *
 * High-level orchestrator for cross-device login via QR code or short code.
 * Coordinates between the relay API and the ECDH crypto layer.
 *
 * Two roles:
 *   - **Requester** (Device B, new device): creates session, renders QR, polls
 *   - **Approver** (Device A, logged-in device): reads QR/code, encrypts share, approves
 */

import type { AuthProvider } from './types';

import {
    generateEphemeralKeypair,
    encryptShareForTransfer,
    decryptShareFromTransfer,
} from './qr-crypto';

import type { EphemeralKeypair, EncryptedSharePayload } from './qr-crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QrLoginSession {
    sessionId: string;
    shortCode: string;
    expiresInSeconds: number;
}

export interface QrLoginSessionInfo {
    sessionId: string;
    publicKey: string;
    status: 'pending' | 'approved';
    encryptedPayload?: string;
    approverDid?: string;
}

export interface QrLoginClientConfig {
    serverUrl: string;
}

export interface QrPayload {
    /** Session ID for the relay */
    sessionId: string;

    /** Base64-encoded ephemeral X25519 public key */
    publicKey: string;

    /** Server URL for the relay */
    serverUrl: string;
}

/** Result of polling — either still waiting or the device share is ready */
export type PollResult =
    | { status: 'pending' }
    | { status: 'approved'; deviceShare: string; approverDid: string; accountHint?: string };

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const buildHeaders = (token?: string): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
};

// ---------------------------------------------------------------------------
// Requester (Device B — the new device)
// ---------------------------------------------------------------------------

/**
 * Create a QR login session and generate the ephemeral keypair.
 *
 * Returns everything Device B needs to display a QR and start polling.
 * The ephemeral private key is kept in memory — never serialized.
 */
export const createQrLoginSession = async (
    config: QrLoginClientConfig
): Promise<{
    session: QrLoginSession;
    ephemeralKeypair: EphemeralKeypair;
    qrPayload: QrPayload;
}> => {
    const ephemeralKeypair = await generateEphemeralKeypair();

    const response = await fetch(`${config.serverUrl}/qr-login/session`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ publicKey: ephemeralKeypair.publicKey }),
    });

    if (!response.ok) {
        throw new Error(`Failed to create QR login session: ${response.statusText}`);
    }

    const session: QrLoginSession = await response.json();

    const qrPayload: QrPayload = {
        sessionId: session.sessionId,
        publicKey: ephemeralKeypair.publicKey,
        serverUrl: config.serverUrl,
    };

    return { session, ephemeralKeypair, qrPayload };
};

/**
 * Poll a QR login session for approval.
 *
 * When Device A approves, this returns the decrypted device share.
 *
 * @param config - Server config
 * @param sessionId - The session to poll
 * @param ephemeralPrivateKey - Device B's ephemeral private key (for decryption)
 */
export const pollQrLoginSession = async (
    config: QrLoginClientConfig,
    sessionId: string,
    ephemeralPrivateKey: CryptoKey
): Promise<PollResult> => {
    const response = await fetch(`${config.serverUrl}/qr-login/session/${sessionId}`, {
        method: 'GET',
        headers: buildHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to poll QR login session: ${response.statusText}`);
    }

    const info: QrLoginSessionInfo = await response.json();

    if (info.status === 'pending') {
        return { status: 'pending' };
    }

    if (!info.encryptedPayload || !info.approverDid) {
        throw new Error('Session approved but missing payload');
    }

    // Parse the encrypted payload and decrypt
    const payload: EncryptedSharePayload = JSON.parse(info.encryptedPayload);

    const plaintext = await decryptShareFromTransfer(payload, ephemeralPrivateKey);

    const parsed = JSON.parse(plaintext) as { d: string; h?: string };

    return {
        status: 'approved',
        deviceShare: parsed.d,
        approverDid: info.approverDid,
        accountHint: parsed.h,
    };
};

/**
 * Convenience: poll in a loop until approved or timeout.
 *
 * @param config - Server config
 * @param sessionId - The session to poll
 * @param ephemeralPrivateKey - Device B's ephemeral private key
 * @param intervalMs - Polling interval (default 2000ms)
 * @param timeoutMs - Total timeout (default 120000ms)
 * @param onPoll - Optional callback on each poll (for UI updates)
 */
export const pollUntilApproved = async (
    config: QrLoginClientConfig,
    sessionId: string,
    ephemeralPrivateKey: CryptoKey,
    options?: {
        intervalMs?: number;
        timeoutMs?: number;
        onPoll?: (attempt: number) => void;
        signal?: AbortSignal;
    }
): Promise<{ deviceShare: string; approverDid: string; accountHint?: string }> => {
    const intervalMs = options?.intervalMs ?? 2000;
    const timeoutMs = options?.timeoutMs ?? 120_000;

    const deadline = Date.now() + timeoutMs;
    let attempt = 0;

    while (Date.now() < deadline) {
        if (options?.signal?.aborted) {
            throw new Error('QR login polling aborted');
        }

        attempt++;
        options?.onPoll?.(attempt);

        const result = await pollQrLoginSession(config, sessionId, ephemeralPrivateKey);

        if (result.status === 'approved') {
            return {
                deviceShare: result.deviceShare,
                approverDid: result.approverDid,
                accountHint: result.accountHint,
            };
        }

        // Wait before next poll
        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(resolve, intervalMs);

            if (options?.signal) {
                options.signal.addEventListener('abort', () => {
                    clearTimeout(timer);
                    reject(new Error('QR login polling aborted'));
                }, { once: true });
            }
        });
    }

    throw new Error('QR login session timed out');
};

// ---------------------------------------------------------------------------
// Approver (Device A — the logged-in device)
// ---------------------------------------------------------------------------

/**
 * Fetch a QR login session's public key (for Device A to encrypt against).
 *
 * @param config - Server config
 * @param lookup - Session ID or 6-digit short code
 */
export const getQrLoginSessionInfo = async (
    config: QrLoginClientConfig,
    lookup: string
): Promise<QrLoginSessionInfo> => {
    const response = await fetch(`${config.serverUrl}/qr-login/session/${lookup}`, {
        method: 'GET',
        headers: buildHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Session not found or expired`);
    }

    return response.json();
};

/**
 * Approve a QR login session by encrypting and pushing the device share.
 *
 * Called by Device A (the logged-in device).
 *
 * @param config - Server config
 * @param sessionId - The session to approve
 * @param deviceShare - Plaintext device share from Device A's local storage
 * @param approverDid - DID of the approving device
 * @param recipientPublicKey - Base64 X25519 public key from the session
 * @param accountHint - Optional email or phone of the approver's account (sent to Device B as a login hint)
 */
export const approveQrLoginSession = async (
    config: QrLoginClientConfig,
    sessionId: string,
    deviceShare: string,
    approverDid: string,
    recipientPublicKey: string,
    accountHint?: string
): Promise<void> => {
    // Wrap the device share + account hint in a JSON envelope
    const plaintext = JSON.stringify({ d: deviceShare, h: accountHint });

    // Encrypt with ECDH
    const encryptedPayload = await encryptShareForTransfer(plaintext, recipientPublicKey);

    const response = await fetch(`${config.serverUrl}/qr-login/session/${sessionId}/approve`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
            sessionId,
            encryptedPayload: JSON.stringify(encryptedPayload),
            approverDid,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to approve QR login session: ${response.statusText}`);
    }
};

// ---------------------------------------------------------------------------
// Push notification helper
// ---------------------------------------------------------------------------

export interface NotifyDevicesResult {
    sent: boolean;
    deviceCount: number;
}

/**
 * Send a push notification to the authenticated user's other devices,
 * prompting them to open the approver flow for the given QR session.
 *
 * Called by Device B (in needs_recovery) after creating a session.
 * Requires the user's Firebase (or other auth provider) token.
 *
 * This is fire-and-forget — failure does not block the QR login flow.
 */
export const notifyDevicesForQrSession = async (
    config: QrLoginClientConfig,
    sessionId: string,
    shortCode: string,
    authToken: string,
    providerType: string = 'firebase'
): Promise<NotifyDevicesResult> => {
    try {
        const response = await fetch(`${config.serverUrl}/qr-login/notify`, {
            method: 'POST',
            headers: buildHeaders(),
            body: JSON.stringify({
                authToken,
                providerType,
                sessionId,
                shortCode,
            }),
        });

        if (!response.ok) {
            return { sent: false, deviceCount: 0 };
        }

        return (await response.json()) as NotifyDevicesResult;
    } catch {
        return { sent: false, deviceCount: 0 };
    }
};
