/**
 * Device-side storage for SSS shares
 * Reuses patterns from webSecureStorage but specialized for SSS
 */

const DB_NAME = 'lcb-sss-keys';
const DB_VERSION = 1;
const KEYS_STORE = 'keys';
const SHARES_STORE = 'shares';
const DEFAULT_DEVICE_SHARE_ID = 'sss-device-share';

type EncryptedPayload = {
    version: 1;
    iv: string;
    cipher: string;
    keyVersion: number;
};

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(KEYS_STORE)) {
                db.createObjectStore(KEYS_STORE);
            }
            if (!db.objectStoreNames.contains(SHARES_STORE)) {
                db.createObjectStore(SHARES_STORE);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function tx<T = unknown>(
    db: IDBDatabase,
    store: string,
    mode: IDBTransactionMode,
    op: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
    return new Promise((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const request = op(s);
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error);
    });
}

async function getOrCreateMasterKey(): Promise<CryptoKey> {
    const db = await openDB();

    try {
        const existing = await tx<CryptoKey | undefined>(db, KEYS_STORE, 'readonly', s =>
            s.get('master-key')
        );

        if (existing) {
            return existing;
        }

        const key = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );

        await tx(db, KEYS_STORE, 'readwrite', s => s.put(key, 'master-key'));

        return key;
    } finally {
        db.close();
    }
}

function bufferToBase64(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

async function encryptShare(share: string, id: string): Promise<EncryptedPayload> {
    const key = await getOrCreateMasterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const ad = encoder.encode(id);

    const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: ad },
        key,
        encoder.encode(share)
    );

    return {
        version: 1,
        iv: bufferToBase64(iv.buffer),
        cipher: bufferToBase64(cipherBuffer),
        keyVersion: 1,
    };
}

async function decryptShare(payload: EncryptedPayload, id: string): Promise<string> {
    const key = await getOrCreateMasterKey();
    const iv = new Uint8Array(base64ToBuffer(payload.iv));
    const cipher = base64ToBuffer(payload.cipher);
    const encoder = new TextEncoder();
    const ad = encoder.encode(id);

    const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, additionalData: ad },
        key,
        cipher
    );

    return new TextDecoder().decode(plainBuffer);
}

export async function storeDeviceShare(share: string, id: string = DEFAULT_DEVICE_SHARE_ID): Promise<void> {
    const db = await openDB();

    try {
        const payload = await encryptShare(share, id);
        await tx(db, SHARES_STORE, 'readwrite', s => s.put(payload, id));
    } finally {
        db.close();
    }
}

export async function getDeviceShare(id: string = DEFAULT_DEVICE_SHARE_ID): Promise<string | null> {
    const db = await openDB();

    try {
        const payload = await tx<EncryptedPayload | undefined>(db, SHARES_STORE, 'readonly', s =>
            s.get(id)
        );

        if (!payload) {
            return null;
        }

        try {
            return await decryptShare(payload, id);
        } catch (e) {
            console.warn('SSS Storage: decryption failed', e);
            return null;
        }
    } finally {
        db.close();
    }
}

export async function hasDeviceShare(id: string = DEFAULT_DEVICE_SHARE_ID): Promise<boolean> {
    const share = await getDeviceShare(id);
    return share !== null;
}

export async function deleteDeviceShare(id: string = DEFAULT_DEVICE_SHARE_ID): Promise<void> {
    const db = await openDB();

    try {
        await tx(db, SHARES_STORE, 'readwrite', s => s.delete(id));
    } finally {
        db.close();
    }
}

export interface DeviceShareEntry {
    id: string;
    preview: string;
}

/**
 * List all device shares stored in IndexedDB.
 * Returns the storage key and a truncated preview for each share.
 * Useful for debugging multi-account storage.
 */
export async function listAllDeviceShares(): Promise<DeviceShareEntry[]> {
    let db: IDBDatabase;

    try {
        db = await openDB();
    } catch {
        return [];
    }

    try {
        const allKeys = await new Promise<IDBValidKey[]>((resolve, reject) => {
            const t = db.transaction(SHARES_STORE, 'readonly');
            const s = t.objectStore(SHARES_STORE);
            const req = s.getAllKeys();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        const entries: DeviceShareEntry[] = [];

        for (const rawKey of allKeys) {
            const id = String(rawKey);

            try {
                const share = await getDeviceShare(id);
                const preview = share
                    ? share.substring(0, 8) + '...' + share.substring(share.length - 8)
                    : '(decrypt failed)';

                entries.push({ id, preview });
            } catch {
                entries.push({ id, preview: '(error)' });
            }
        }

        return entries;
    } finally {
        db.close();
    }
}

/**
 * Clear shares from local storage.
 *
 * When `id` is provided, only that single share is removed (per-user clear).
 * When omitted, the entire IndexedDB database is deleted (legacy full-wipe).
 */
export async function clearAllShares(id?: string): Promise<void> {
    if (id) {
        await deleteDeviceShare(id);
        return;
    }

    await new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => resolve();
    });
}
