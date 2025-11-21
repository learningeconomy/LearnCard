/*
 Web secure storage for sensitive secrets (e.g., Web3Auth private key)
 - AES-GCM 256 encryption with a non-extractable CryptoKey stored in IndexedDB
 - Stores ciphertext in IndexedDB 'secrets' store
 - Provides set/get/clear helpers specific to the Web3Auth private key

 Notes:
 - CryptoKey objects are structured-cloneable and can be stored in IndexedDB in modern browsers.
 - No JWK fallback is used. Browsers that cannot persist CryptoKey objects are not supported for secure storage.
 - Ciphertexts are bound to their logical ID via AES-GCM AAD (additional authenticated data) to detect swaps.
 - This protects at-rest only; any script running in-origin can still use the key (XSS, malicious extensions).
 - Clearing the database removes both the key and ciphertext.
*/

const DB_NAME = 'lcb-secure-web';
const DB_VERSION = 2;
const KEYS_STORE = 'keys';
const SECRETS_STORE = 'secrets';
const KEY_VERSION = 1;
const PK_SECRET_ID = 'web3authPK';

const keyIdForVersion = (v: number) => `key-v${v}`;

export type EncryptedPayloadV2 = {
    version: 2;
    iv: string; // base64
    cipher: string; // base64
    keyVersion: number;
};

type EncryptedPayload = EncryptedPayloadV2;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(KEYS_STORE)) db.createObjectStore(KEYS_STORE);
            if (!db.objectStoreNames.contains(SECRETS_STORE)) db.createObjectStore(SECRETS_STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function tx<T = unknown>(db: IDBDatabase, store: string, mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const request = op(s);
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error);
    });
}

async function getStoredCryptoKey(db: IDBDatabase, id: string): Promise<CryptoKey | null> {
    try {
        const key = await tx<CryptoKey | undefined>(db, KEYS_STORE, 'readonly', s => s.get(id));
        return key ?? null;
    } catch {
        return null;
    }
}

async function putStoredCryptoKey(db: IDBDatabase, key: CryptoKey, id: string): Promise<void> {
    await tx(db, KEYS_STORE, 'readwrite', s => s.put(key, id));
}

async function getOrCreateMasterKey(version = KEY_VERSION): Promise<CryptoKey> {
    const db = await openDB();

    // Attempt to load a stored CryptoKey for the requested version
    const keyId = keyIdForVersion(version);
    const existing = await getStoredCryptoKey(db, keyId);
    if (existing) {
        db.close();
        return existing;
    }

    // Generate new non-extractable key
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
        'encrypt',
        'decrypt',
    ]);

    // Persist CryptoKey directly. If this fails, the browser is unsupported for secure storage.
    try {
        await putStoredCryptoKey(db, key, keyId);
    } catch (e) {
        console.warn('WebSecureStorage: CryptoKey persistence failed', e);
        db.close();
        throw new Error(
            'Secure key persistence unsupported in this browser (CryptoKey not storable).'
        );
    }

    db.close();
    return key;
}

function bufferToBase64(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

async function encryptString(plain: string, id: string): Promise<EncryptedPayloadV2> {
    const key = await getOrCreateMasterKey(KEY_VERSION);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ad = new TextEncoder().encode(id);
    const cipherBuf = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: ad },
        key,
        enc.encode(plain)
    );
    return {
        version: 2,
        iv: bufferToBase64(iv.buffer),
        cipher: bufferToBase64(cipherBuf),
        keyVersion: KEY_VERSION,
    };
}

async function decryptString(payload: EncryptedPayload, id: string): Promise<string> {
    const iv = new Uint8Array(base64ToBuffer(payload.iv));
    const cipher = base64ToBuffer(payload.cipher);
    const key = await getOrCreateMasterKey(payload.keyVersion);
    const ad = new TextEncoder().encode(id);
    const plainBuf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, additionalData: ad },
        key,
        cipher
    );
    const dec = new TextDecoder();
    return dec.decode(plainBuf);
}

async function setSecret(id: string, value: string): Promise<void> {
    const db = await openDB();
    try {
        const payload = await encryptString(value, id);
        await tx(db, SECRETS_STORE, 'readwrite', s => s.put(payload, id));
    } finally {
        db.close();
    }
}

async function getSecret(id: string): Promise<string | null> {
    const db = await openDB();
    try {
        const payload = await tx<EncryptedPayload | undefined>(db, SECRETS_STORE, 'readonly', s =>
            s.get(id)
        );
        if (!payload) return null;
        try {
            return await decryptString(payload, id);
        } catch (e) {
            console.warn('WebSecureStorage: decryption failed (tampered or wrong key)', e);
            return null;
        }
    } finally {
        db.close();
    }
}

async function deleteSecret(id: string): Promise<void> {
    const db = await openDB();
    try {
        await tx(db, SECRETS_STORE, 'readwrite', s => s.delete(id));
    } finally {
        db.close();
    }
}

export async function setPrivateKey(pk: string): Promise<void> {
    if (!pk) throw new Error('No private key provided');
    await setSecret(PK_SECRET_ID, pk);
}

export async function getPrivateKey(): Promise<string | null> {
    return getSecret(PK_SECRET_ID);
}

export async function clearPrivateKey(): Promise<void> {
    await deleteSecret(PK_SECRET_ID);
}

export async function clearAll(): Promise<void> {
    // Delete entire database (removes both keys and secrets)
    await new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => resolve();
    });
}
