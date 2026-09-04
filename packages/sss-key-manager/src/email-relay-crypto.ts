/**
 * Browser-compatible encryption for recovery-key delivery.
 *
 * This is an HPKE-style construction using Web Crypto primitives:
 * ephemeral P-256 ECDH, HKDF-SHA-256, and AES-256-GCM. The relay public key
 * is pinned in tenant/runtime configuration; only the isolated relay has the
 * matching PKCS#8 private key.
 */

import { base64ToBuffer, bufferToBase64 } from './crypto';

export const EMAIL_RELAY_ENVELOPE_VERSION = 1 as const;
export const EMAIL_RELAY_ALGORITHM = 'P-256-HKDF-SHA256-AES-256-GCM' as const;

const encodeUtf8 = (value: string): Uint8Array<ArrayBuffer> => {
    const bytes = new TextEncoder().encode(value);
    const copy = new Uint8Array(new ArrayBuffer(bytes.byteLength));
    copy.set(bytes);
    return copy;
};

const EMAIL_RELAY_INFO = encodeUtf8('learncard-email-relay-v1');
const SIX_DIGIT_CODE_RANGE = 900_000;
const UINT32_RANGE = 0x1_0000_0000;
const MAX_UNBIASED_UINT32 = Math.floor(UINT32_RANGE / SIX_DIGIT_CODE_RANGE) * SIX_DIGIT_CODE_RANGE;

export interface EmailRelayBranding {
    brandName?: string;
    logoUrl?: string;
    logoAlt?: string;
    primaryColor?: string;
    primaryTextColor?: string;
    supportEmail?: string;
    websiteUrl?: string;
    appUrl?: string;
    fromDomain?: string;
    copyrightHolder?: string;
}

export interface EmailRelayPlaintext {
    version: typeof EMAIL_RELAY_ENVELOPE_VERSION;
    targetEmail: string;
    recoveryKey: string;
    confirmationCode: string;
    branding?: EmailRelayBranding;
}

export interface EmailRelayEnvelope {
    version: typeof EMAIL_RELAY_ENVELOPE_VERSION;
    algorithm: typeof EMAIL_RELAY_ALGORITHM;
    keyId: string;
    ephemeralPublicKey: string;
    salt: string;
    iv: string;
    ciphertext: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const requireString = (
    record: Record<string, unknown>,
    key: string,
    options: { min?: number; max: number; pattern?: RegExp }
): string => {
    const value = record[key];

    if (
        typeof value !== 'string' ||
        value.length < (options.min ?? 1) ||
        value.length > options.max ||
        (options.pattern && !options.pattern.test(value))
    ) {
        throw new Error(`Invalid email relay ${key}`);
    }

    return value;
};

const parseBranding = (value: unknown): EmailRelayBranding | undefined => {
    if (value === undefined) return undefined;
    if (!isRecord(value)) throw new Error('Invalid email relay branding');

    const branding: EmailRelayBranding = {};
    const keys = [
        'brandName',
        'logoUrl',
        'logoAlt',
        'primaryColor',
        'primaryTextColor',
        'supportEmail',
        'websiteUrl',
        'appUrl',
        'fromDomain',
        'copyrightHolder',
    ] as const;

    for (const key of keys) {
        const field = value[key];

        if (field === undefined) continue;
        if (typeof field !== 'string' || field.length > 2_048) {
            throw new Error(`Invalid email relay branding.${key}`);
        }

        branding[key] = field;
    }

    return branding;
};

/** Validate an untrusted encrypted envelope before attempting decryption. */
export const parseEmailRelayEnvelope = (value: unknown): EmailRelayEnvelope => {
    if (!isRecord(value)) throw new Error('Invalid email relay envelope');
    if (value.version !== EMAIL_RELAY_ENVELOPE_VERSION) {
        throw new Error('Unsupported email relay envelope version');
    }
    if (value.algorithm !== EMAIL_RELAY_ALGORITHM) {
        throw new Error('Unsupported email relay algorithm');
    }

    return {
        version: EMAIL_RELAY_ENVELOPE_VERSION,
        algorithm: EMAIL_RELAY_ALGORITHM,
        keyId: requireString(value, 'keyId', {
            max: 128,
            pattern: /^[A-Za-z0-9._-]+$/,
        }),
        ephemeralPublicKey: requireString(value, 'ephemeralPublicKey', { max: 256 }),
        salt: requireString(value, 'salt', { max: 128 }),
        iv: requireString(value, 'iv', { max: 64 }),
        ciphertext: requireString(value, 'ciphertext', { max: 16_384 }),
    };
};

/** Validate decrypted relay plaintext and copy only recognized fields. */
export const parseEmailRelayPlaintext = (value: unknown): EmailRelayPlaintext => {
    if (!isRecord(value) || value.version !== EMAIL_RELAY_ENVELOPE_VERSION) {
        throw new Error('Invalid email relay plaintext');
    }

    return {
        version: EMAIL_RELAY_ENVELOPE_VERSION,
        targetEmail: requireString(value, 'targetEmail', {
            max: 320,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        })
            .trim()
            .toLowerCase(),
        recoveryKey: requireString(value, 'recoveryKey', {
            min: 5,
            max: 4_096,
            pattern: /^[0-9a-f]+$/i,
        }),
        confirmationCode: requireString(value, 'confirmationCode', {
            max: 6,
            pattern: /^\d{6}$/,
        }),
        branding: parseBranding(value.branding),
    };
};

const getAad = (
    envelope: Pick<EmailRelayEnvelope, 'version' | 'algorithm' | 'keyId'>
): Uint8Array<ArrayBuffer> =>
    encodeUtf8(`${envelope.version}|${envelope.algorithm}|${envelope.keyId}`);

const deriveAesKey = async (
    sharedSecret: ArrayBuffer,
    salt: Uint8Array<ArrayBuffer>,
    usage: KeyUsage
): Promise<CryptoKey> => {
    const keyMaterial = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, [
        'deriveKey',
    ]);

    return crypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt, info: EMAIL_RELAY_INFO },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        [usage]
    );
};

/** Generate a uniformly distributed six-digit confirmation code in the browser. */
export const generateEmailRelayConfirmationCode = (): string => {
    const random = new Uint32Array(1);
    let value: number;

    do {
        crypto.getRandomValues(random);
        value = random[0] ?? UINT32_RANGE;
    } while (value >= MAX_UNBIASED_UINT32);

    return String(100_000 + (value % SIX_DIGIT_CODE_RANGE));
};

/** Encrypt a complete recovery-email payload to a pinned relay SPKI public key. */
export const encryptEmailRelayPayload = async (
    input: Omit<EmailRelayPlaintext, 'version'>,
    publicKeyBase64: string,
    keyId: string
): Promise<EmailRelayEnvelope> => {
    const plaintext = parseEmailRelayPlaintext({
        ...input,
        version: EMAIL_RELAY_ENVELOPE_VERSION,
    });
    const normalizedKeyId = keyId.trim();

    if (!publicKeyBase64.trim()) throw new Error('Email relay public key is not configured');
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(normalizedKeyId)) {
        throw new Error('Email relay key ID is not configured');
    }

    const recipientPublicKey = await crypto.subtle.importKey(
        'spki',
        base64ToBuffer(publicKeyBase64.trim()).buffer as ArrayBuffer,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
    );
    const ephemeralKeyPair = await crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveBits']
    );
    const sharedSecret = await crypto.subtle.deriveBits(
        { name: 'ECDH', public: recipientPublicKey },
        ephemeralKeyPair.privateKey,
        256
    );
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const aesKey = await deriveAesKey(sharedSecret, salt, 'encrypt');
    const envelopeMetadata = {
        version: EMAIL_RELAY_ENVELOPE_VERSION,
        algorithm: EMAIL_RELAY_ALGORITHM,
        keyId: normalizedKeyId,
    };
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: getAad(envelopeMetadata) },
        aesKey,
        encodeUtf8(JSON.stringify(plaintext))
    );
    const ephemeralPublicKey = await crypto.subtle.exportKey('raw', ephemeralKeyPair.publicKey);

    return {
        ...envelopeMetadata,
        ephemeralPublicKey: bufferToBase64(ephemeralPublicKey),
        salt: bufferToBase64(salt.buffer),
        iv: bufferToBase64(iv.buffer),
        ciphertext: bufferToBase64(ciphertext),
    };
};

/** Decrypt an envelope using the relay's PKCS#8 P-256 private key. */
export const decryptEmailRelayPayload = async (
    value: unknown,
    privateKeyBase64: string
): Promise<EmailRelayPlaintext> => {
    const envelope = parseEmailRelayEnvelope(value);
    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        base64ToBuffer(privateKeyBase64.trim()).buffer as ArrayBuffer,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        ['deriveBits']
    );
    const ephemeralPublicKey = await crypto.subtle.importKey(
        'raw',
        base64ToBuffer(envelope.ephemeralPublicKey).buffer as ArrayBuffer,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
    );
    const sharedSecret = await crypto.subtle.deriveBits(
        { name: 'ECDH', public: ephemeralPublicKey },
        privateKey,
        256
    );
    const salt = base64ToBuffer(envelope.salt);
    const iv = base64ToBuffer(envelope.iv);
    const aesKey = await deriveAesKey(sharedSecret, salt, 'decrypt');
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, additionalData: getAad(envelope) },
        aesKey,
        base64ToBuffer(envelope.ciphertext)
    );
    const parsed: unknown = JSON.parse(new TextDecoder().decode(decrypted));

    return parseEmailRelayPlaintext(parsed);
};
