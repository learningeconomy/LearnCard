import { ExtendedPoint, getPublicKeyAsync, signAsync } from '@noble/ed25519';
import { base64ToBuffer, bufferToBase64, bytesToHex, hexToBytes } from './crypto';
import { parseEscrowEnvelope } from './escrow-crypto';
import type { EscrowEnvelope } from './escrow-crypto';
import type {
    EscrowEnrollmentIntent,
    SignedEscrowEnrollmentIntent,
} from './escrow-enrollment-intent.types';

// P9.1: bumped alongside `version` so the two new recovery fields can never be
// verified against the pre-PR3 byte layout. Must match Rust's INTENT_DOMAIN exactly.
export const ESCROW_ENROLLMENT_INTENT_DOMAIN = 'learncard-escrow-enrollment-intent-v2\0';
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const FIELDS = [
    'version',
    'tenant',
    'did',
    'authorityGeneration',
    'expectedEnrollmentVersion',
    'action',
    'sourceBlobIdentity',
    'targetBlobIdentity',
    'pinAction',
    'shareVersion',
    'enrollmentEpoch',
    'requestId',
    'allowRewrap',
    'recoveryEmail',
    'recoveryLanguage',
];
const ACTIONS = ['enroll', 'replace', 'disable', 'carry'];
const PIN_ACTIONS = ['set', 'change', 'clear', 'keep'];
// P9.1 (attack C): the app's compiled template languages. Keep in lockstep with
// apps/learn-card-app/src/i18n's SUPPORTED_LANGUAGES and the Rust RECOVERY_LANGUAGES.
const RECOVERY_LANGUAGES = ['en', 'es', 'fr', 'ar'];

const requireIntent = (condition: boolean): void => {
    if (!condition) throw new Error('Invalid escrow enrollment intent');
};
// JS `$` also matches before a final newline: require a complete match.
const matches = (value: unknown, pattern: RegExp): boolean =>
    typeof value === 'string' && pattern.exec(value)?.[0] === value;
const utf8 = (value: string): Uint8Array<ArrayBuffer> => new TextEncoder().encode(value);
const integer = (value: number, width: 4 | 8): Uint8Array<ArrayBuffer> => {
    requireIntent(
        Number.isSafeInteger(value) && value >= 0 && (width === 8 || value <= 0xffffffff)
    );
    const bytes = new Uint8Array(width);
    const view = new DataView(bytes.buffer);
    if (width === 4) view.setUint32(0, value, false);
    else view.setBigUint64(0, BigInt(value), false);
    return bytes;
};
const join = (fields: Uint8Array[]): Uint8Array<ArrayBuffer> => {
    const result = new Uint8Array(fields.reduce((length, field) => length + field.length, 0));
    let offset = 0;
    for (const field of fields) {
        result.set(field, offset);
        offset += field.length;
    }
    return result;
};
const hashBytes = (value: string | null): Uint8Array<ArrayBuffer> => {
    if (value === null) return new Uint8Array();
    requireIntent(matches(value, /^[0-9a-f]{64}$/));
    return new Uint8Array(hexToBytes(value));
};

/** Fixed-size Ed25519 multicodec decoder, not a network DID resolver. */
const didPublicKey = (did: string): Uint8Array<ArrayBuffer> => {
    requireIntent(typeof did === 'string' && did.startsWith('did:key:z') && did.length === 56);
    let value = 0n;
    for (const char of did.slice(9)) {
        const digit = BASE58.indexOf(char);
        requireIntent(digit >= 0);
        value = value * 58n + BigInt(digit);
    }
    const bytes = new Uint8Array(34);
    for (let i = 33; i >= 0; i--) {
        bytes[i] = Number(value & 255n);
        value >>= 8n;
    }
    // Fixed 47-digit length plus nonzero ed01 prefix excludes leading-zero aliases.
    requireIntent(value === 0n && bytes[0] === 0xed && bytes[1] === 0x01);
    const key = bytes.slice(2);
    try {
        requireIntent(!ExtendedPoint.fromHex(key, false).isSmallOrder());
    } catch {
        throw new Error('Invalid escrow enrollment intent');
    }
    return key;
};

/** Produce the exact Rust-verified V1 message, never JSON or a prehashed signature. */
export const encodeEscrowEnrollmentIntent = (
    intent: EscrowEnrollmentIntent
): Uint8Array<ArrayBuffer> => {
    requireIntent(typeof intent === 'object' && intent !== null && !Array.isArray(intent));
    requireIntent(
        Object.keys(intent).length === FIELDS.length &&
            FIELDS.every(field => Object.prototype.hasOwnProperty.call(intent, field))
    );
    requireIntent(intent.version === 2 && typeof intent.allowRewrap === 'boolean');
    requireIntent(matches(intent.tenant, /^[A-Za-z0-9_-]{1,128}$/));
    requireIntent(matches(intent.authorityGeneration, /^[A-Za-z0-9_-]{1,128}$/));
    requireIntent(matches(intent.requestId, /^[A-Za-z0-9._-]{1,112}$/));
    didPublicKey(intent.did);
    const action = ACTIONS.indexOf(intent.action);
    const pin = PIN_ACTIONS.indexOf(intent.pinAction);
    requireIntent(action >= 0 && pin >= 0 && intent.shareVersion > 0 && intent.enrollmentEpoch > 0);
    const source = hashBytes(intent.sourceBlobIdentity);
    const target = hashBytes(intent.targetBlobIdentity);
    if (intent.action === 'enroll') requireIntent(source.length === 0 && target.length === 32);
    else if (intent.action === 'disable')
        requireIntent(
            source.length === 32 &&
                target.length === 0 &&
                intent.pinAction === 'keep' &&
                !intent.allowRewrap
        );
    else
        requireIntent(
            source.length === 32 &&
                target.length === 32 &&
                intent.sourceBlobIdentity !== intent.targetBlobIdentity
        );
    if (intent.action === 'carry') requireIntent(intent.pinAction === 'keep');
    // P9.1 (attack C): email/language are deliberately conservative (not full
    // RFC 5322/IDN) and paired; Enroll/Replace require them, Disable/Carry forbid them.
    if (intent.recoveryEmail === null) {
        requireIntent(
            intent.recoveryLanguage === null &&
                (intent.action === 'disable' || intent.action === 'carry')
        );
    } else {
        requireIntent(intent.action === 'enroll' || intent.action === 'replace');
        requireIntent(
            matches(intent.recoveryEmail, /^[\x21-\x7e]{3,254}$/) &&
                intent.recoveryEmail === intent.recoveryEmail.trim().toLowerCase()
        );
        const at = intent.recoveryEmail.split('@');
        requireIntent(
            at.length === 2 &&
                at[0].length > 0 &&
                at[1].length > 0 &&
                at[1].includes('.') &&
                !at[1].startsWith('.') &&
                !at[1].endsWith('.')
        );
        requireIntent(
            intent.recoveryLanguage !== null && RECOVERY_LANGUAGES.includes(intent.recoveryLanguage)
        );
    }
    const fields = [
        integer(intent.version, 4),
        utf8(intent.tenant),
        utf8(intent.did),
        utf8(intent.authorityGeneration),
        integer(intent.expectedEnrollmentVersion, 8),
        Uint8Array.of(action),
        source,
        target,
        Uint8Array.of(pin),
        integer(intent.shareVersion, 4),
        integer(intent.enrollmentEpoch, 8),
        utf8(intent.requestId),
        Uint8Array.of(Number(intent.allowRewrap)),
        intent.recoveryEmail === null ? new Uint8Array() : utf8(intent.recoveryEmail),
        intent.recoveryLanguage === null ? new Uint8Array() : utf8(intent.recoveryLanguage),
    ];
    return join([
        utf8(ESCROW_ENROLLMENT_INTENT_DOMAIN),
        ...fields.flatMap(field => [integer(field.length, 4), field]),
    ]);
};

/** Sign with the account's 32-byte Ed25519 seed. Never needed for recovery itself.
 * The caller must obtain generation/current version from an attested authority
 * response and construct the exact operation it intends; signing is not consent UI.
 */
export const signEscrowEnrollmentIntent = async (
    intent: EscrowEnrollmentIntent,
    privateKey: string
): Promise<SignedEscrowEnrollmentIntent> => {
    // Snapshot before the first await so caller mutation cannot alter returned intent.
    encodeEscrowEnrollmentIntent(intent);
    const snapshot = { ...intent };
    const message = encodeEscrowEnrollmentIntent(snapshot);
    requireIntent(matches(privateKey, /^[0-9a-f]{64}$/i));
    const seed = hexToBytes(privateKey);
    try {
        const publicKey = await getPublicKeyAsync(seed);
        const expected = didPublicKey(snapshot.did);
        requireIntent(publicKey.every((byte, index) => byte === expected[index]));
        const signature = await signAsync(message, seed);
        return { intent: snapshot, signature: bufferToBase64(new Uint8Array(signature).buffer) };
    } finally {
        seed.fill(0);
    }
};

/** Canonical blob identity matches Rust, including Q/-Q ECDH equivalence. */
export const getEscrowBlobIdentity = async (input: EscrowEnvelope): Promise<string> => {
    const envelope = parseEscrowEnvelope(input);
    const decode = (value: string): Uint8Array<ArrayBuffer> => {
        const bytes = new Uint8Array(base64ToBuffer(value));
        requireIntent(bufferToBase64(bytes.buffer) === value);
        return bytes;
    };
    const point = decode(envelope.ephemeralPublicKey);
    const salt = decode(envelope.salt);
    const iv = decode(envelope.iv);
    const ciphertext = decode(envelope.ciphertext);
    requireIntent(
        point.length === 65 &&
            point[0] === 4 &&
            salt.length === 32 &&
            iv.length === 12 &&
            ciphertext.length >= 16
    );
    await crypto.subtle.importKey('raw', point, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const fields = [
        Uint8Array.of(1),
        utf8(envelope.algorithm),
        utf8(envelope.keyId),
        point.slice(1, 33),
        salt,
        iv,
        ciphertext,
    ];
    const message = join([
        utf8('learncard-escrow-blob-id-v1\0'),
        ...fields.flatMap(field => [integer(field.length, 8), field]),
    ]);
    return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', message)));
};
