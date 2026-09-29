/**
 * Shared escrow wire format: ephemeral P-256 ECDH → HKDF-SHA-256 → AES-256-GCM.
 * Recipient keys use SPKI/PKCS#8; envelope keys are raw uncompressed P-256 points.
 * All binary fields use standard base64. Ciphertext includes the 128-bit GCM tag.
 * Blob and release envelopes use distinct HKDF info strings for domain separation.
 */
import { base64ToBuffer, bufferToBase64 } from './crypto';

/** Supported escrow wire-format version. */
export const ESCROW_ENVELOPE_VERSION = 1 as const;
/** Cryptographic suite used by escrow envelopes. */
export const ESCROW_ALGORITHM = 'P-256-HKDF-SHA256-AES-256-GCM' as const;
/** HKDF info for client-to-enclave escrow blobs. */
export const ESCROW_BLOB_INFO = 'learncard-escrow-blob-v1';
/** HKDF info for enclave-to-client release envelopes. */
export const ESCROW_RELEASE_INFO = 'learncard-escrow-release-v1';
/** Recipient key identifier used when sealing a release. */
export const ESCROW_CLIENT_KEY_ID = 'client' as const;

/** Encrypted escrow payload with authenticated version, algorithm, and key ID. */
export interface EscrowEnvelope {
    version: typeof ESCROW_ENVELOPE_VERSION;
    algorithm: typeof ESCROW_ALGORITHM;
    keyId: string;
    ephemeralPublicKey: string;
    salt: string;
    iv: string;
    ciphertext: string;
}

/** Recovery share bound to an identity and a positive share version. */
export interface EscrowBlobPlaintext {
    version: typeof ESCROW_ENVELOPE_VERSION;
    recoveryShare: string;
    did: string;
    shareVersion: number;
}

/** Released recovery share additionally bound to its recovery hold. */
export interface EscrowReleasePlaintext extends EscrowBlobPlaintext {
    holdId: string;
}

const encodeUtf8 = (value: string): Uint8Array<ArrayBuffer> => {
    const bytes = new TextEncoder().encode(value);
    const copy = new Uint8Array(new ArrayBuffer(bytes.byteLength));
    copy.set(bytes);
    return copy;
};

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
        throw new Error(`Invalid escrow ${key}`);
    }

    return value;
};

/** Validate an untrusted envelope before decryption, copying only recognized fields. */
export const parseEscrowEnvelope = (value: unknown): EscrowEnvelope => {
    if (!isRecord(value)) throw new Error('Invalid escrow envelope');
    if (value.version !== ESCROW_ENVELOPE_VERSION) {
        throw new Error('Unsupported escrow envelope version');
    }
    if (value.algorithm !== ESCROW_ALGORITHM) {
        throw new Error('Unsupported escrow algorithm');
    }

    return {
        version: ESCROW_ENVELOPE_VERSION,
        algorithm: ESCROW_ALGORITHM,
        keyId: requireString(value, 'keyId', { max: 128, pattern: /^[A-Za-z0-9._-]+$/ }),
        ephemeralPublicKey: requireString(value, 'ephemeralPublicKey', { max: 256 }),
        salt: requireString(value, 'salt', { max: 128 }),
        iv: requireString(value, 'iv', { max: 64 }),
        ciphertext: requireString(value, 'ciphertext', { max: 16_384 }),
    };
};

/** Validate blob plaintext, normalize hex to lowercase, and omit unknown fields. */
export const parseEscrowBlobPlaintext = (value: unknown): EscrowBlobPlaintext => {
    if (!isRecord(value) || value.version !== ESCROW_ENVELOPE_VERSION) {
        throw new Error('Invalid escrow plaintext');
    }
    if (
        typeof value.shareVersion !== 'number' ||
        !Number.isInteger(value.shareVersion) ||
        value.shareVersion <= 0
    ) {
        throw new Error('Invalid escrow shareVersion');
    }

    return {
        version: ESCROW_ENVELOPE_VERSION,
        recoveryShare: requireString(value, 'recoveryShare', {
            min: 5,
            max: 4_096,
            pattern: /^[0-9a-f]+$/i,
        }).toLowerCase(),
        did: requireString(value, 'did', { max: 2_048, pattern: /^did:/ }),
        shareVersion: value.shareVersion,
    };
};

/** Validate release plaintext, including its hold ID, and omit unknown fields. */
export const parseEscrowReleasePlaintext = (value: unknown): EscrowReleasePlaintext => {
    const plaintext = parseEscrowBlobPlaintext(value);
    if (!isRecord(value)) throw new Error('Invalid escrow plaintext');

    return {
        ...plaintext,
        holdId: requireString(value, 'holdId', { max: 128, pattern: /^[A-Za-z0-9._-]+$/ }),
    };
};

const getAad = (
    envelope: Pick<EscrowEnvelope, 'version' | 'algorithm' | 'keyId'>
): Uint8Array<ArrayBuffer> =>
    encodeUtf8(`${envelope.version}|${envelope.algorithm}|${envelope.keyId}`);

const deriveAesKey = async (
    sharedSecret: ArrayBuffer,
    salt: Uint8Array<ArrayBuffer>,
    usage: KeyUsage,
    info: string
): Promise<CryptoKey> => {
    const keyMaterial = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, [
        'deriveKey',
    ]);

    return crypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt, info: encodeUtf8(info) },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        [usage]
    );
};

/** Generate an extractable P-256 ECDH pair as base64 SPKI and PKCS#8 keys. */
export const generateEscrowKeyPair = async (): Promise<{
    publicKey: string;
    privateKey: string;
}> => {
    const keyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
        'deriveBits',
    ]);
    const [publicKey, privateKey] = await Promise.all([
        crypto.subtle.exportKey('spki', keyPair.publicKey),
        crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
    ]);

    return { publicKey: bufferToBase64(publicKey), privateKey: bufferToBase64(privateKey) };
};

const encryptToRecipient = async (
    plaintextJson: string,
    spki: string,
    keyId: string,
    info: string
): Promise<EscrowEnvelope> => {
    if (typeof spki !== 'string' || !spki.trim()) {
        throw new Error('Escrow public key is not configured');
    }
    const recipientKeyId = requireString({ keyId }, 'keyId', {
        max: 128,
        pattern: /^[A-Za-z0-9._-]+$/,
    });
    const recipientPublicKey = await crypto.subtle.importKey(
        'spki',
        base64ToBuffer(spki.trim()),
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
    const aesKey = await deriveAesKey(sharedSecret, salt, 'encrypt', info);
    const metadata = {
        version: ESCROW_ENVELOPE_VERSION,
        algorithm: ESCROW_ALGORITHM,
        keyId: recipientKeyId,
    };
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: getAad(metadata) },
        aesKey,
        encodeUtf8(plaintextJson)
    );
    const ephemeralPublicKey = await crypto.subtle.exportKey('raw', ephemeralKeyPair.publicKey);

    return {
        ...metadata,
        ephemeralPublicKey: bufferToBase64(ephemeralPublicKey),
        salt: bufferToBase64(salt.buffer),
        iv: bufferToBase64(iv.buffer),
        ciphertext: bufferToBase64(ciphertext),
    };
};

const decryptFromEnvelope = async (
    value: unknown,
    pkcs8: string,
    info: string
): Promise<unknown> => {
    const envelope = parseEscrowEnvelope(value);
    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        base64ToBuffer(pkcs8.trim()),
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        ['deriveBits']
    );
    const ephemeralPublicKey = await crypto.subtle.importKey(
        'raw',
        base64ToBuffer(envelope.ephemeralPublicKey),
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
    const aesKey = await deriveAesKey(sharedSecret, salt, 'decrypt', info);
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, additionalData: getAad(envelope) },
        aesKey,
        base64ToBuffer(envelope.ciphertext)
    );
    const parsed: unknown = JSON.parse(new TextDecoder().decode(decrypted));

    return parsed;
};

/** Validate and encrypt a recovery share to the enclave's SPKI public key. */
export const encryptEscrowBlob = async (
    input: Omit<EscrowBlobPlaintext, 'version'>,
    enclavePublicKeySpkiB64: string,
    keyId: string
): Promise<EscrowEnvelope> => {
    const plaintext = parseEscrowBlobPlaintext({ ...input, version: ESCROW_ENVELOPE_VERSION });

    return encryptToRecipient(
        JSON.stringify(plaintext),
        enclavePublicKeySpkiB64,
        keyId,
        ESCROW_BLOB_INFO
    );
};

/** Decrypt and validate a blob using the enclave's PKCS#8 private key. */
export const decryptEscrowBlob = async (
    envelope: unknown,
    enclavePrivateKeyPkcs8B64: string
): Promise<EscrowBlobPlaintext> =>
    parseEscrowBlobPlaintext(
        await decryptFromEnvelope(envelope, enclavePrivateKeyPkcs8B64, ESCROW_BLOB_INFO)
    );

/** Validate and seal a release to the recovering client's ephemeral SPKI public key. */
export const sealEscrowRelease = async (
    input: Omit<EscrowReleasePlaintext, 'version'>,
    clientEphemeralPublicKeySpkiB64: string
): Promise<EscrowEnvelope> => {
    const plaintext = parseEscrowReleasePlaintext({ ...input, version: ESCROW_ENVELOPE_VERSION });

    return encryptToRecipient(
        JSON.stringify(plaintext),
        clientEphemeralPublicKeySpkiB64,
        ESCROW_CLIENT_KEY_ID,
        ESCROW_RELEASE_INFO
    );
};

/** Open and validate a release using the recovering client's ephemeral PKCS#8 private key. */
export const openEscrowRelease = async (
    envelope: unknown,
    clientEphemeralPrivateKeyPkcs8B64: string
): Promise<EscrowReleasePlaintext> =>
    parseEscrowReleasePlaintext(
        await decryptFromEnvelope(envelope, clientEphemeralPrivateKeyPkcs8B64, ESCROW_RELEASE_INFO)
    );
