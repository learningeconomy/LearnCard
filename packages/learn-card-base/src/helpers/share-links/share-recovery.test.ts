import { describe, expect, it } from 'vitest';

import { decodeBase64Url, encodeBase64Url } from '@learncard/types';

import {
    ShareLinkError,
    buildShareRecovery,
    decryptShareRecovery,
    encryptShareRecovery,
    isShareLinkError,
    parseShareRecovery,
    serializeShareRecovery,
    serializeShareRecoveryBytes,
    shareRecoveryUtf8ByteLength,
    validateShareRecoveryBinding,
    validateShareRecoveryJwe,
    type ShareRecoveryJweAdapter,
} from './index';

const SHARE_ID = encodeBase64Url(new Uint8Array(16).fill(31));
const CONTENT_KEY = encodeBase64Url(new Uint8Array(32).fill(32));
const NOW = '2026-01-01T00:00:00.000Z';

const recoveryInput = () => ({
    shareId: SHARE_ID,
    ownerProfileId: 'profile-1',
    createdAt: NOW,
    latest: { contentVersion: 3, key: CONTENT_KEY },
    selection: [
        { ref: 'urn:lc:credential:sel-0', order: 0 },
        { ref: 'urn:lc:credential:sel-1', order: 1 },
    ],
    endorsements: [{ targetRef: 'urn:lc:credential:end-0' }],
});

/** JSON-in-base64url stand-in for the wallet DAG-JWE adapter (tests only). */
const fakeAdapter = (): ShareRecoveryJweAdapter => ({
    encrypt: async plaintext => ({
        protected: encodeBase64Url(new TextEncoder().encode('{"alg":"ECDH-ES+A256KW"}')),
        iv: encodeBase64Url(new Uint8Array(12)),
        ciphertext: encodeBase64Url(new TextEncoder().encode(JSON.stringify(plaintext))),
        tag: encodeBase64Url(new Uint8Array(16)),
    }),
    decrypt: async jwe => JSON.parse(new TextDecoder().decode(decodeBase64Url(jwe.ciphertext)!)),
});

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

const deepFreeze = <T>(value: T): T => {
    if (value && typeof value === 'object') {
        Object.values(value as Record<string, unknown>).forEach(deepFreeze);
        Object.freeze(value);
    }
    return value;
};

describe('owner recovery serialization', () => {
    it('builds, serializes and parses recovery without dropping source refs or key', () => {
        const recovery = buildShareRecovery(recoveryInput());
        const serialized = serializeShareRecovery(recovery);
        const parsed = parseShareRecovery(serialized);

        expect(parsed).toEqual(recovery);
        expect(serialized).toContain('urn:lc:credential:sel-0');
        expect(serialized).toContain(CONTENT_KEY);
    });

    it('measures serialized size in UTF-8 bytes, not UTF-16 code units', () => {
        const recovery = buildShareRecovery({
            ...recoveryInput(),
            selection: [{ ref: `urn:lc:credential:${'é'.repeat(10)}`, order: 0 }],
            endorsements: [],
        });
        const serialized = serializeShareRecovery(recovery);

        expect(shareRecoveryUtf8ByteLength(serialized)).toBe(
            new TextEncoder().encode(serialized).length
        );
        expect(shareRecoveryUtf8ByteLength(serialized)).toBe(serialized.length + 10);
        expect(serializeShareRecoveryBytes(recovery)).toHaveLength(serialized.length + 10);
    });

    it('rejects malformed recovery JSON and invalid shapes', () => {
        expect(() => parseShareRecovery('{not json')).toThrow(ShareLinkError);

        const badKey = buildShareRecovery({
            ...recoveryInput(),
            latest: { contentVersion: 1, key: encodeBase64Url(new Uint8Array(31)) },
        });
        expect(() => serializeShareRecovery(badKey)).toThrow(ShareLinkError);

        expect(() => serializeShareRecovery({ ...recoveryInput(), protocol: 'other/v1' })).toThrow(
            ShareLinkError
        );
    });

    it('validates owner/share/version binding', () => {
        const recovery = parseShareRecovery(
            serializeShareRecovery(buildShareRecovery(recoveryInput()))
        );

        expect(
            validateShareRecoveryBinding(recovery, {
                shareId: SHARE_ID,
                ownerProfileId: 'profile-1',
                contentVersion: 3,
            })
        ).toEqual({ ok: true });

        expect(
            validateShareRecoveryBinding(recovery, {
                shareId: encodeBase64Url(new Uint8Array(16)),
                ownerProfileId: 'profile-1',
                contentVersion: 3,
            })
        ).toMatchObject({ ok: false, code: 'RECOVERY_SHARE_ID_MISMATCH' });

        expect(
            validateShareRecoveryBinding(recovery, {
                shareId: SHARE_ID,
                ownerProfileId: 'other',
                contentVersion: 3,
            })
        ).toMatchObject({ ok: false, code: 'RECOVERY_OWNER_MISMATCH' });

        expect(
            validateShareRecoveryBinding(recovery, {
                shareId: SHARE_ID,
                ownerProfileId: 'profile-1',
                contentVersion: 4,
            })
        ).toMatchObject({ ok: false, code: 'RECOVERY_VERSION_MISMATCH' });
    });

    it('requires an injected wallet DAG-JWE adapter instead of a custom cipher', async () => {
        await expectRejectCode(
            encryptShareRecovery(buildShareRecovery(recoveryInput()), 'did:web:owner', undefined),
            'RECOVERY_ADAPTER_UNAVAILABLE'
        );
        await expectRejectCode(
            decryptShareRecovery(
                { iv: '', protected: '', ciphertext: '', tag: '' },
                'did:web:owner',
                null
            ),
            'RECOVERY_ADAPTER_UNAVAILABLE'
        );
    });

    it('round-trips through the injected adapter and enforces the serialized JWE cap', async () => {
        const adapter = fakeAdapter();
        const recovery = buildShareRecovery(recoveryInput());

        const jwe = await encryptShareRecovery(recovery, 'did:web:owner', adapter);
        await expect(decryptShareRecovery(jwe, 'did:web:owner', adapter)).resolves.toEqual(
            recovery
        );

        const oversizedAdapter: ShareRecoveryJweAdapter = {
            ...adapter,
            encrypt: async () => ({
                protected: 'e30',
                iv: encodeBase64Url(new Uint8Array(12)),
                ciphertext: encodeBase64Url(new Uint8Array(50 * 1024)),
                tag: encodeBase64Url(new Uint8Array(16)),
            }),
        };
        await expectRejectCode(
            encryptShareRecovery(recovery, 'did:web:owner', oversizedAdapter),
            'RECOVERY_TOO_LARGE'
        );

        expect(() => validateShareRecoveryJwe({ nope: true })).toThrow(ShareLinkError);
    });

    it('never mutates the recovery input', async () => {
        const input = deepFreeze(recoveryInput());
        const recovery = buildShareRecovery(input);

        expect(input.selection[0]).toEqual({ ref: 'urn:lc:credential:sel-0', order: 0 });

        const adapter = fakeAdapter();
        const jwe = await encryptShareRecovery(recovery, 'did:web:owner', adapter);
        await decryptShareRecovery(jwe, 'did:web:owner', adapter);

        expect(input.endorsements).toEqual([{ targetRef: 'urn:lc:credential:end-0' }]);
    });
});
