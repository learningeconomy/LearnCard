// @vitest-environment node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { base64ToBuffer } from './crypto';

import {
    decryptEscrowBlob,
    ESCROW_BLOB_INFO,
    ESCROW_RELEASE_INFO,
    encryptEscrowBlob,
    generateEscrowKeyPair,
    openEscrowRelease,
    sealEscrowRelease,
} from './escrow-crypto';
import type { EscrowBlobPlaintext, EscrowEnvelope, EscrowReleasePlaintext } from './escrow-crypto';

type KeyPair = Awaited<ReturnType<typeof generateEscrowKeyPair>>;
interface Vectors {
    // Public test-only keys, never used for real recovery data.
    enclave: KeyPair;
    client: KeyPair;
    blobs: { plaintext: EscrowBlobPlaintext; envelope: EscrowEnvelope }[];
    releases: { plaintext: EscrowReleasePlaintext; envelope: EscrowEnvelope }[];
}

it('decrypts shared TS/Rust escrow vectors (ESCROW_WRITE_VECTORS=1 regenerates)', async () => {
    const directory = fileURLToPath(new URL('./__fixtures__/', import.meta.url));
    const path = fileURLToPath(new URL('./__fixtures__/escrow-vectors.json', import.meta.url));

    if (process.env.ESCROW_WRITE_VECTORS === '1') {
        const enclave = await generateEscrowKeyPair();
        const client = await generateEscrowKeyPair();
        const inputs = [
            { recoveryShare: 'ABCDE', did: 'did:example:legacy', shareVersion: 1 },
            {
                recoveryShare: `0001${'AB'.repeat(48)}`,
                did: 'did:example:pin',
                shareVersion: 42,
                pinVerifier: 'CD'.repeat(32),
            },
            {
                recoveryShare: 'ef'.repeat(2048),
                did: `did:${'x'.repeat(2042)}😀`,
                shareVersion: 9_007_199_254_740_992,
            },
        ];
        const blobs = await Promise.all(
            inputs.map(async (input, index) => {
                const envelope = await encryptEscrowBlob(
                    input,
                    enclave.publicKey,
                    `test-key.${index}`
                );
                return {
                    plaintext: await decryptEscrowBlob(envelope, enclave.privateKey),
                    envelope,
                };
            })
        );
        const releases = await Promise.all(
            inputs.slice(0, 2).map(async (input, index) => {
                const envelope = await sealEscrowRelease(
                    { ...input, holdId: `hold-${index}.test_1` },
                    client.publicKey
                );
                return {
                    plaintext: await openEscrowRelease(envelope, client.privateKey),
                    envelope,
                };
            })
        );
        const vectors: Vectors = { enclave, client, blobs, releases };
        await mkdir(directory, { recursive: true });
        await writeFile(path, `${JSON.stringify(vectors, null, 4)}\n`);
    }

    const vectors: Vectors = JSON.parse(await readFile(path, 'utf8'));
    expect(vectors.blobs).toHaveLength(3);
    expect(vectors.releases).toHaveLength(2);
    for (const { plaintext, envelope } of vectors.blobs) {
        await expect(decryptEscrowBlob(envelope, vectors.enclave.privateKey)).resolves.toEqual(
            plaintext
        );
    }
    for (const { plaintext, envelope } of vectors.releases) {
        await expect(openEscrowRelease(envelope, vectors.client.privateKey)).resolves.toEqual(
            plaintext
        );
    }
});

// Independent WebCrypto decryption exposes raw JSON before the production validator
// normalizes it, so a numeric 1.0 cannot silently satisfy the integral-token assertion.
const decryptRawJson = async (
    envelope: EscrowEnvelope,
    privateKey: string,
    info: string
): Promise<string> => {
    const recipient = await crypto.subtle.importKey(
        'pkcs8',
        base64ToBuffer(privateKey),
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        ['deriveBits']
    );
    const ephemeral = await crypto.subtle.importKey(
        'raw',
        base64ToBuffer(envelope.ephemeralPublicKey),
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
    );
    const shared = await crypto.subtle.deriveBits(
        { name: 'ECDH', public: ephemeral },
        recipient,
        256
    );
    const material = await crypto.subtle.importKey('raw', shared, 'HKDF', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: base64ToBuffer(envelope.salt),
            info: new TextEncoder().encode(info),
        },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    );
    const plaintext = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: base64ToBuffer(envelope.iv),
            additionalData: new TextEncoder().encode(
                `${envelope.version}|${envelope.algorithm}|${envelope.keyId}`
            ),
        },
        key,
        base64ToBuffer(envelope.ciphertext)
    );
    return new TextDecoder().decode(plaintext);
};

it('opens Rust blobs and releases in WebCrypto and emits integral JSON share versions', async () => {
    const ts: Vectors = JSON.parse(
        await readFile(
            fileURLToPath(new URL('./__fixtures__/escrow-vectors.json', import.meta.url)),
            'utf8'
        )
    );
    const rust: Omit<Vectors, 'client'> = JSON.parse(
        await readFile(
            fileURLToPath(new URL('./__fixtures__/escrow-vectors-rust.json', import.meta.url)),
            'utf8'
        )
    );
    expect(rust.blobs).toHaveLength(2);
    expect(rust.releases).toHaveLength(2);

    // Import Rust SPKI as well as PKCS#8, and verify the two exports describe one key.
    const publicKey = await crypto.subtle.importKey(
        'spki',
        base64ToBuffer(rust.enclave.publicKey),
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        []
    );
    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        base64ToBuffer(rust.enclave.privateKey),
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveBits']
    );
    const publicJwk = await crypto.subtle.exportKey('jwk', publicKey);
    expect(await crypto.subtle.exportKey('jwk', privateKey)).toMatchObject({
        crv: 'P-256',
        x: publicJwk.x,
        y: publicJwk.y,
    });

    for (const { plaintext, envelope } of rust.blobs) {
        await expect(decryptEscrowBlob(envelope, rust.enclave.privateKey)).resolves.toEqual(
            plaintext
        );
        const raw = await decryptRawJson(envelope, rust.enclave.privateKey, ESCROW_BLOB_INFO);
        expect(raw).toMatch(new RegExp(`"shareVersion":${plaintext.shareVersion}[,}]`));
        expect(JSON.parse(raw)).toEqual(plaintext);
    }
    for (const { plaintext, envelope } of rust.releases) {
        await expect(openEscrowRelease(envelope, ts.client.privateKey)).resolves.toEqual(plaintext);
        const raw = await decryptRawJson(envelope, ts.client.privateKey, ESCROW_RELEASE_INFO);
        expect(raw).toMatch(new RegExp(`"shareVersion":${plaintext.shareVersion}[,}]`));
        expect(JSON.parse(raw)).toEqual(plaintext);
    }
});
