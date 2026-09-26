import { describe, expect, it } from 'vitest';

import { SHARE_AAD_PREFIX, decodeBase64Url, encodeBase64Url } from '@learncard/types';

import {
    buildShareLinkAad,
    decryptSharePayload,
    encryptSharePayload,
    generateShareContentKey,
    generateShareLinkId,
    isShareLinkError,
    randomBytes,
} from './index';

const SHARE_ID = encodeBase64Url(new Uint8Array(16).fill(7));
const CONTENT_KEY = encodeBase64Url(new Uint8Array(32).fill(9));
const VERSION = 3;

const utf8 = (value: string) => new TextEncoder().encode(value);

const deepFreeze = <T>(value: T): T => {
    if (value && typeof value === 'object') {
        Object.values(value as Record<string, unknown>).forEach(deepFreeze);
        Object.freeze(value);
    }
    return value;
};

/** Await a promise that must reject with a specific ShareLinkError code. */
const expectRejectCode = async (promise: Promise<unknown>, code: string): Promise<void> => {
    try {
        await promise;
    } catch (error) {
        if (!isShareLinkError(error)) throw error;
        expect(error.code).toBe(code);
        return;
    }
    throw new Error(`expected rejection with code ${code}`);
};

/** Raw WebCrypto AES-GCM encryption, used to prove interoperability. */
const rawEncrypt = async (
    key: string,
    iv: Uint8Array,
    plaintext: string,
    shareId: string,
    version: number
) => {
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        decodeBase64Url(key)!,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );
    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv,
                additionalData: utf8(`${SHARE_AAD_PREFIX}:${shareId}:${version}`),
                tagLength: 128,
            },
            cryptoKey,
            utf8(plaintext)
        )
    );
    return {
        v: 1 as const,
        alg: 'A256GCM' as const,
        iv: encodeBase64Url(iv),
        ct: encodeBase64Url(ciphertext),
    };
};

describe('share-link crypto', () => {
    it('derives CSPRNG ids/keys with the exact canonical lengths', () => {
        const id = generateShareLinkId();
        const key = generateShareContentKey();

        expect(id).toHaveLength(22);
        expect(key).toHaveLength(43);
        expect(decodeBase64Url(id)?.length).toBe(16);
        expect(decodeBase64Url(key)?.length).toBe(32);
        expect(generateShareLinkId()).not.toBe(generateShareLinkId());
    });

    it('binds AAD to the canonical id and version', () => {
        expect(new TextDecoder().decode(buildShareLinkAad(SHARE_ID, VERSION))).toBe(
            `${SHARE_AAD_PREFIX}:${SHARE_ID}:${VERSION}`
        );
        expect(() => buildShareLinkAad('not-an-id', VERSION)).toThrow();
        expect(() => buildShareLinkAad(SHARE_ID, 0)).toThrow();
    });

    it('round-trips and uses a fresh 12-byte IV each time', async () => {
        const payload = { protocol: 'lc-share/v1', nested: { list: [1, 2, 3] } };

        const first = await encryptSharePayload({
            shareId: SHARE_ID,
            contentVersion: VERSION,
            key: CONTENT_KEY,
            payload,
        });
        const second = await encryptSharePayload({
            shareId: SHARE_ID,
            contentVersion: VERSION,
            key: CONTENT_KEY,
            payload,
        });

        expect(decodeBase64Url(first.iv)?.length).toBe(12);
        expect(first.iv).not.toBe(second.iv);
        expect(first.ct).not.toBe(second.ct);

        await expect(
            decryptSharePayload({
                shareId: SHARE_ID,
                contentVersion: VERSION,
                key: CONTENT_KEY,
                envelope: first,
            })
        ).resolves.toEqual(payload);
    });

    it('interoperates with direct WebCrypto in both directions', async () => {
        const payload = { protocol: 'lc-share/v1', message: 'interop' };

        // Raw WebCrypto -> our decrypt.
        const rawEnvelope = await rawEncrypt(
            CONTENT_KEY,
            randomBytes(12),
            JSON.stringify(payload),
            SHARE_ID,
            VERSION
        );
        await expect(
            decryptSharePayload({
                shareId: SHARE_ID,
                contentVersion: VERSION,
                key: CONTENT_KEY,
                envelope: rawEnvelope,
            })
        ).resolves.toEqual(payload);

        // Our encrypt -> raw WebCrypto decrypt.
        const envelope = await encryptSharePayload({
            shareId: SHARE_ID,
            contentVersion: VERSION,
            key: CONTENT_KEY,
            payload,
        });
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            decodeBase64Url(CONTENT_KEY)!,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );
        const plaintext = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: decodeBase64Url(envelope.iv)!,
                additionalData: utf8(`${SHARE_AAD_PREFIX}:${SHARE_ID}:${VERSION}`),
                tagLength: 128,
            },
            cryptoKey,
            decodeBase64Url(envelope.ct)!
        );
        expect(JSON.parse(new TextDecoder().decode(plaintext))).toEqual(payload);
    });

    it('fails closed on tamper, IV, tag, wrong key, substitution and unknown fields', async () => {
        const envelope = await encryptSharePayload({
            shareId: SHARE_ID,
            contentVersion: VERSION,
            key: CONTENT_KEY,
            payload: { a: 1 },
        });

        const withEnvelope = (next: unknown) =>
            decryptSharePayload({
                shareId: SHARE_ID,
                contentVersion: VERSION,
                key: CONTENT_KEY,
                envelope: next,
            });

        const tamperCt = decodeBase64Url(envelope.ct)!;
        tamperCt[tamperCt.length - 1] ^= 0x01;
        await expectRejectCode(
            withEnvelope({ ...envelope, ct: encodeBase64Url(tamperCt) }),
            'DECRYPT_FAILED'
        );

        const tamperIv = decodeBase64Url(envelope.iv)!;
        tamperIv[0] ^= 0x01;
        await expectRejectCode(
            withEnvelope({ ...envelope, iv: encodeBase64Url(tamperIv) }),
            'DECRYPT_FAILED'
        );

        const truncated = decodeBase64Url(envelope.ct)!.slice(0, 15);
        await expectRejectCode(
            withEnvelope({ ...envelope, ct: encodeBase64Url(truncated) }),
            'INVALID_ENVELOPE'
        );

        await expectRejectCode(
            decryptSharePayload({
                shareId: SHARE_ID,
                contentVersion: VERSION,
                key: generateShareContentKey(),
                envelope,
            }),
            'DECRYPT_FAILED'
        );

        await expectRejectCode(
            decryptSharePayload({
                shareId: generateShareLinkId(),
                contentVersion: VERSION,
                key: CONTENT_KEY,
                envelope,
            }),
            'DECRYPT_FAILED'
        );

        await expectRejectCode(
            decryptSharePayload({
                shareId: SHARE_ID,
                contentVersion: VERSION + 1,
                key: CONTENT_KEY,
                envelope,
            }),
            'DECRYPT_FAILED'
        );

        await expectRejectCode(withEnvelope({ ...envelope, v: 2 }), 'UNSUPPORTED_VERSION');
        await expectRejectCode(
            withEnvelope({ ...envelope, alg: 'A128CBC' }),
            'UNSUPPORTED_ALGORITHM'
        );
        await expectRejectCode(withEnvelope({ ...envelope, extra: 'nope' }), 'INVALID_ENVELOPE');
        await expectRejectCode(withEnvelope(null), 'INVALID_ENVELOPE');
    });

    it('rejects non-canonical keys and ids before touching WebCrypto', async () => {
        await expectRejectCode(
            encryptSharePayload({
                shareId: 'bad',
                contentVersion: 1,
                key: CONTENT_KEY,
                payload: {},
            }),
            'INVALID_SHARE_ID'
        );

        await expectRejectCode(
            encryptSharePayload({ shareId: SHARE_ID, contentVersion: 1, key: 'bad', payload: {} }),
            'INVALID_CONTENT_KEY'
        );
    });

    it('never mutates the input payload', async () => {
        const payload = deepFreeze({ protocol: 'lc-share/v1', list: [{ id: 1 }] });

        await encryptSharePayload({
            shareId: SHARE_ID,
            contentVersion: VERSION,
            key: CONTENT_KEY,
            payload,
        });

        expect(payload).toEqual({ protocol: 'lc-share/v1', list: [{ id: 1 }] });
    });
});

describe('plaintext bounds', () => {
    it('rejects undefined and oversized input before encryption', async () => {
        const input = { shareId: SHARE_ID, contentVersion: VERSION, key: CONTENT_KEY };
        await expectRejectCode(
            encryptSharePayload({ ...input, payload: undefined }),
            'INVALID_PLAINTEXT'
        );
        await expectRejectCode(
            encryptSharePayload({ ...input, payload: 'x'.repeat(512 * 1024) }),
            'CIPHERTEXT_TOO_LARGE'
        );
    });
});
