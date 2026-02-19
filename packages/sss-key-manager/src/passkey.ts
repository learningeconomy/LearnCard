/**
 * WebAuthn Passkey utilities for SSS recovery
 * Uses the PRF (Pseudo-Random Function) extension to derive encryption keys
 */

import { bufferToBase64, base64ToBuffer, bytesToHex, hexToBytes } from './crypto';

export interface PasskeyCredential {
    credentialId: string;
    publicKey: string;
    transports?: AuthenticatorTransport[];
}

export interface PasskeyEncryptedShare {
    encryptedData: string;
    iv: string;
    credentialId: string;
}

const RP_NAME = 'LearnCard';
const RP_ID = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

const PRF_SALT = new TextEncoder().encode('learncard-sss-recovery-v1');

function isWebAuthnSupported(): boolean {
    return typeof window !== 'undefined' &&
        typeof window.PublicKeyCredential !== 'undefined' &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
}

async function isPRFSupported(): Promise<boolean> {
    if (!isWebAuthnSupported()) return false;

    try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
    } catch {
        return false;
    }
}

export async function createPasskeyCredential(
    userId: string,
    userName: string
): Promise<PasskeyCredential> {
    if (!isWebAuthnSupported()) {
        throw new Error('WebAuthn is not supported in this browser');
    }

    const userIdBytes = new TextEncoder().encode(userId);

    const createOptions: PublicKeyCredentialCreationOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: {
            name: RP_NAME,
            id: RP_ID,
        },
        user: {
            id: userIdBytes,
            name: userName,
            displayName: userName,
        },
        pubKeyCredParams: [
            { alg: -7, type: 'public-key' },   // ES256
            { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'required',
        },
        timeout: 60000,
        attestation: 'none',
        extensions: {
            prf: {
                eval: {
                    first: PRF_SALT,
                },
            },
        } as AuthenticationExtensionsClientInputs,
    };

    const credential = await navigator.credentials.create({
        publicKey: createOptions,
    }) as PublicKeyCredential;

    if (!credential) {
        throw new Error('Failed to create passkey credential');
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    const extensionResults = credential.getClientExtensionResults() as {
        prf?: { enabled?: boolean; results?: { first?: ArrayBuffer } };
    };

    if (!extensionResults.prf?.enabled && !extensionResults.prf?.results?.first) {
        throw new Error(
            'PRF extension not available. Your browser or device does not support ' +
            'the encryption required for passkey recovery. Please use a different recovery method.'
        );
    }

    return {
        credentialId: bufferToBase64(credential.rawId),
        publicKey: bufferToBase64(response.getPublicKey() as ArrayBuffer),
        transports: response.getTransports?.() as AuthenticatorTransport[],
    };
}

export async function deriveKeyFromPasskey(
    credentialId: string
): Promise<CryptoKey> {
    if (!isWebAuthnSupported()) {
        throw new Error('WebAuthn is not supported in this browser');
    }

    const getOptions: PublicKeyCredentialRequestOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: RP_ID,
        allowCredentials: [{
            id: base64ToBuffer(credentialId),
            type: 'public-key',
        }],
        userVerification: 'required',
        timeout: 60000,
        extensions: {
            prf: {
                eval: {
                    first: PRF_SALT,
                },
            },
        } as AuthenticationExtensionsClientInputs,
    };

    const assertion = await navigator.credentials.get({
        publicKey: getOptions,
    }) as PublicKeyCredential;

    if (!assertion) {
        throw new Error('Failed to get passkey assertion');
    }

    const extensionResults = assertion.getClientExtensionResults() as {
        prf?: { results?: { first?: ArrayBuffer } };
    };

    if (!extensionResults.prf?.results?.first) {
        throw new Error('PRF extension not available or failed. This passkey cannot be used for encryption.');
    }

    const prfOutput = new Uint8Array(extensionResults.prf.results.first);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        prfOutput,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );

    return cryptoKey;
}

export async function encryptShareWithPasskey(
    share: string,
    credentialId: string
): Promise<PasskeyEncryptedShare> {
    const key = await deriveKeyFromPasskey(credentialId);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(share)
    );

    return {
        encryptedData: bufferToBase64(ciphertext),
        iv: bufferToBase64(iv.buffer),
        credentialId,
    };
}

export async function decryptShareWithPasskey(
    encryptedShare: PasskeyEncryptedShare
): Promise<string> {
    const key = await deriveKeyFromPasskey(encryptedShare.credentialId);

    const iv = base64ToBuffer(encryptedShare.iv);
    const ciphertext = base64ToBuffer(encryptedShare.encryptedData);

    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv.buffer },
        key,
        ciphertext.buffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(plaintext);
}

export async function listStoredPasskeys(): Promise<PasskeyCredential[]> {
    if (!isWebAuthnSupported()) {
        return [];
    }

    if (typeof PublicKeyCredential.isConditionalMediationAvailable !== 'function') {
        return [];
    }

    const available = await PublicKeyCredential.isConditionalMediationAvailable();
    if (!available) {
        return [];
    }

    return [];
}

export { isWebAuthnSupported, isPRFSupported };
