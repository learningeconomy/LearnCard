import {
    base64ToBuffer,
    bufferToBase64,
    bytesToHex,
    deriveKeyFromPassword,
    hexToBytes,
} from './crypto';

export const PIN_MIN_LENGTH = 6;
export const PIN_MAX_LENGTH = 12;
export const ESCROW_PIN_MAX_ATTEMPTS = 10;

const TRIVIAL_PINS = new Set([
    '123456',
    '654321',
    '000000',
    '111111',
    '121212',
    '112233',
    '123123',
    '696969',
    '123321',
]);

/** Normalize compatibility digits before removing formatting and non-digits. */
export const normalizePin = (raw: string): string =>
    raw.trim().normalize('NFKD').replace(/\D/g, '');

/** Validate the normalized PIN, rejecting full-length sequential and repeated digits. */
export const validatePin = (
    pin: string
): { ok: true } | { ok: false; reason: 'length' | 'trivial' } => {
    const normalized = normalizePin(pin);
    if (normalized.length < PIN_MIN_LENGTH || normalized.length > PIN_MAX_LENGTH) {
        return { ok: false, reason: 'length' };
    }

    if (
        /^(\d)\1+$/.test(normalized) ||
        '0123456789'.includes(normalized) ||
        '9876543210'.includes(normalized) ||
        TRIVIAL_PINS.has(normalized)
    ) {
        return { ok: false, reason: 'trivial' };
    }

    return { ok: true };
};

/** Generate a public, random 16-byte salt encoded as standard base64. */
export const generatePinSalt = (): string =>
    bufferToBase64(crypto.getRandomValues(new Uint8Array(16)).buffer);

/** Derive the enclave proof using the shared default Argon2id parameters. */
export const derivePinProof = async (pin: string, pinSaltBase64: string): Promise<string> => {
    const salt = base64ToBuffer(pinSaltBase64);
    if (salt.length !== 16) throw new Error('Invalid escrow PIN salt length');

    const key = await deriveKeyFromPassword(normalizePin(pin), salt);
    try {
        return bytesToHex(key);
    } finally {
        key.fill(0);
    }
};

/**
 * Compare valid hex bytes without an early exit on differing contents.
 * Format and length are public; JavaScript runtimes cannot guarantee constant-time execution.
 */
export const constantTimeEqualHex = (a: string, b: string): boolean => {
    if (a.length !== b.length || !/^(?:[0-9a-f]{2})+$/i.test(a) || !/^(?:[0-9a-f]{2})+$/i.test(b)) {
        return false;
    }

    const aBytes = hexToBytes(a);
    const bBytes = hexToBytes(b);
    let difference = 0;
    for (let i = 0; i < aBytes.length; i++) {
        difference |= aBytes[i]! ^ bBytes[i]!;
    }
    return difference === 0;
};
