import { getLogger } from 'learn-card-base';
const log = getLogger('trusted-origins');
/**
 * Utility for managing trusted origins for identity sharing
 * Stores origins that the user has consented to share their identity with
 * Data is encrypted at rest using AES-GCM to prevent clear-text storage of sensitive information
 */

const STORAGE_KEY = 'learncard_trusted_identity_origins_v2';
const KEY_STORAGE_KEY = 'learncard_trusted_origins_key';

interface TrustedOriginData {
    origin: string;
    consentedAt: number; // timestamp
    appName?: string;
}

interface EncryptedData {
    iv: string; // base64
    ciphertext: string; // base64
}

// Encryption helpers using Web Crypto API
const getOrCreateEncryptionKey = async (): Promise<CryptoKey> => {
    const existingKeyData = localStorage.getItem(KEY_STORAGE_KEY);

    if (existingKeyData) {
        try {
            const keyData = JSON.parse(existingKeyData);
            return await crypto.subtle.importKey(
                'jwk',
                keyData,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
        } catch {
            // Key corrupted, generate new one
        }
    }

    // Generate new key
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
        'encrypt',
        'decrypt',
    ]);

    // Export and store the key
    const exportedKey = await crypto.subtle.exportKey('jwk', key);
    localStorage.setItem(KEY_STORAGE_KEY, JSON.stringify(exportedKey));

    return key;
};

const encryptData = async (data: TrustedOriginData[]): Promise<string> => {
    const key = await getOrCreateEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));

    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

    const encrypted: EncryptedData = {
        iv: btoa(String.fromCharCode(...iv)),
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    };

    return JSON.stringify(encrypted);
};

const decryptData = async (encryptedString: string): Promise<TrustedOriginData[]> => {
    const key = await getOrCreateEncryptionKey();
    const encrypted: EncryptedData = JSON.parse(encryptedString);

    const iv = Uint8Array.from(atob(encrypted.iv), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(encrypted.ciphertext), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

    return JSON.parse(new TextDecoder().decode(decrypted));
};

/**
 * Get all trusted origins from localStorage (encrypted)
 */
export async function getTrustedOrigins(): Promise<TrustedOriginData[]> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        return await decryptData(stored);
    } catch (error) {
        log.error('Failed to parse trusted origins', error);
        return [];
    }
}

/**
 * Check if an origin is trusted for identity sharing
 */
export async function isOriginTrusted(origin: string): Promise<boolean> {
    const trusted = await getTrustedOrigins();
    return trusted.some(item => item.origin === origin);
}

/**
 * Add an origin to the trusted list
 */
export async function addTrustedOrigin(origin: string, appName?: string): Promise<void> {
    try {
        const trusted = await getTrustedOrigins();

        // Check if already exists
        const existingIndex = trusted.findIndex(item => item.origin === origin);

        const newEntry: TrustedOriginData = {
            origin,
            consentedAt: Date.now(),
            appName,
        };

        if (existingIndex >= 0) {
            // Update existing entry
            trusted[existingIndex] = newEntry;
        } else {
            // Add new entry
            trusted.push(newEntry);
        }

        const encrypted = await encryptData(trusted);
        localStorage.setItem(STORAGE_KEY, encrypted);
        log.info('Added trusted origin', origin);
    } catch (error) {
        log.error('Failed to add trusted origin', error);
    }
}

/**
 * Remove an origin from the trusted list
 */
export async function removeTrustedOrigin(origin: string): Promise<void> {
    try {
        const trusted = await getTrustedOrigins();
        const filtered = trusted.filter(item => item.origin !== origin);
        const encrypted = await encryptData(filtered);
        localStorage.setItem(STORAGE_KEY, encrypted);
        log.info('Removed trusted origin', origin);
    } catch (error) {
        log.error('Failed to remove trusted origin', error);
    }
}

/**
 * Clear all trusted origins
 */
export function clearTrustedOrigins(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(KEY_STORAGE_KEY);
        log.info('Cleared all trusted origins');
    } catch (error) {
        log.error('Failed to clear trusted origins', error);
    }
}
