/**
 * Cryptographic utilities for SSS Key Manager
 */

import { argon2id } from 'hash-wasm';

const ARGON2_TIME_COST = 3;
const ARGON2_MEMORY_COST = 65536;
const ARGON2_PARALLELISM = 4;
const ARGON2_HASH_LENGTH = 32;

export interface KdfParams {
    algorithm: 'argon2id';
    timeCost: number;
    memoryCost: number;
    parallelism: number;
}

export const DEFAULT_KDF_PARAMS: KdfParams = {
    algorithm: 'argon2id',
    timeCost: ARGON2_TIME_COST,
    memoryCost: ARGON2_MEMORY_COST,
    parallelism: ARGON2_PARALLELISM,
};

export function bufferToBase64(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function base64ToBuffer(b64: string): Uint8Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

export function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function deriveKeyFromPassword(
    password: string,
    salt: Uint8Array,
    params: KdfParams = DEFAULT_KDF_PARAMS
): Promise<Uint8Array> {
    const hash = await argon2id({
        password,
        salt: salt as unknown as Uint8Array,
        iterations: params.timeCost,
        memorySize: params.memoryCost,
        parallelism: params.parallelism,
        hashLength: ARGON2_HASH_LENGTH,
        outputType: 'binary',
    });
    return new Uint8Array(hash as ArrayBuffer);
}

export async function encryptWithPassword(
    plaintext: string,
    password: string
): Promise<{ ciphertext: string; iv: string; salt: string; kdfParams: KdfParams }> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const keyMaterial = await deriveKeyFromPassword(password, salt);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyMaterial.buffer as ArrayBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    const encoder = new TextEncoder();
    const ciphertextBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encoder.encode(plaintext)
    );

    return {
        ciphertext: bufferToBase64(ciphertextBuffer),
        iv: bufferToBase64(iv.buffer),
        salt: bufferToBase64(salt.buffer),
        kdfParams: DEFAULT_KDF_PARAMS,
    };
}

export async function decryptWithPassword(
    ciphertext: string,
    iv: string,
    salt: string,
    password: string,
    params: KdfParams = DEFAULT_KDF_PARAMS
): Promise<string> {
    const saltBytes = base64ToBuffer(salt);
    const ivBytes = base64ToBuffer(iv);
    const ciphertextBytes = base64ToBuffer(ciphertext);

    const keyMaterial = await deriveKeyFromPassword(password, saltBytes, params);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyMaterial.buffer as ArrayBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    const plaintextBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBytes },
        cryptoKey,
        ciphertextBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(plaintextBuffer);
}

export async function encryptShare(
    share: string,
    key: CryptoKey,
    aad?: string
): Promise<{ encryptedData: string; iv: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();

    const encryptParams: AesGcmParams = { name: 'AES-GCM', iv };
    if (aad) {
        encryptParams.additionalData = encoder.encode(aad);
    }

    const ciphertextBuffer = await crypto.subtle.encrypt(
        encryptParams,
        key,
        encoder.encode(share) as ArrayBuffer
    );

    return {
        encryptedData: bufferToBase64(ciphertextBuffer),
        iv: bufferToBase64(iv.buffer),
    };
}

export async function decryptShare(
    encryptedData: string,
    iv: string,
    key: CryptoKey,
    aad?: string
): Promise<string> {
    const ivBytes = base64ToBuffer(iv);
    const ciphertextBytes = base64ToBuffer(encryptedData);
    const encoder = new TextEncoder();

    const decryptParams: AesGcmParams = { name: 'AES-GCM', iv: ivBytes.buffer as ArrayBuffer };
    if (aad) {
        decryptParams.additionalData = encoder.encode(aad);
    }

    const plaintextBuffer = await crypto.subtle.decrypt(
        decryptParams,
        key,
        ciphertextBytes.buffer as ArrayBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(plaintextBuffer);
}

export async function generateAesKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

export function generateRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
}

export async function generateEd25519PrivateKey(): Promise<string> {
    const privateKeyBytes = generateRandomBytes(32);
    return bytesToHex(privateKeyBytes);
}
