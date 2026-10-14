// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { verifyAsync } from '@noble/ed25519';
import {
    encodeEscrowEnrollmentIntent,
    signEscrowEnrollmentIntent,
    getEscrowBlobIdentity,
} from './escrow-enrollment-intent';
import type {
    EscrowEnrollmentIntent,
    SignedEscrowEnrollmentIntent,
} from './escrow-enrollment-intent.types';
import type { EscrowEnvelope } from './escrow-crypto';

interface Vector extends SignedEscrowEnrollmentIntent {
    seedHex: string;
    publicKeyHex: string;
    canonicalHex: string;
    sourceFixtureIndex: number;
    targetFixtureIndex: number;
}
const vector: Vector = JSON.parse(
    readFileSync(
        new URL('./__fixtures__/escrow-enrollment-intent-v1.json', import.meta.url),
        'utf8'
    )
);
const envelopes: { blobs: { envelope: EscrowEnvelope }[] } = JSON.parse(
    readFileSync(new URL('./__fixtures__/escrow-vectors.json', import.meta.url), 'utf8')
);

describe('owner-signed escrow enrollment intent', () => {
    it('matches the shared Rust message, raw Ed25519 signature and envelope identities', async () => {
        const message = encodeEscrowEnrollmentIntent(vector.intent);
        expect(Buffer.from(message).toString('hex')).toBe(vector.canonicalHex);
        expect(await signEscrowEnrollmentIntent(vector.intent, vector.seedHex)).toEqual({
            intent: vector.intent,
            signature: vector.signature,
        });
        expect(
            await verifyAsync(
                Buffer.from(vector.signature, 'base64'),
                message,
                vector.publicKeyHex,
                { zip215: false }
            )
        ).toBe(true);
        expect(
            await getEscrowBlobIdentity(envelopes.blobs[vector.sourceFixtureIndex].envelope)
        ).toBe(vector.intent.sourceBlobIdentity);
        expect(
            await getEscrowBlobIdentity(envelopes.blobs[vector.targetFixtureIndex].envelope)
        ).toBe(vector.intent.targetBlobIdentity);
    });

    it('refuses a nonowner seed and never needs an external DID resolver', async () => {
        await expect(signEscrowEnrollmentIntent(vector.intent, '99'.repeat(32))).rejects.toThrow();
        for (const did of [
            'did:web:attacker.test',
            `${vector.intent.did}#key`,
            'did:key:uZm9v',
            vector.intent.did.replace('z6Mk', 'z0Mk'),
        ]) {
            expect(() => encodeEscrowEnrollmentIntent({ ...vector.intent, did })).toThrow();
        }
        await expect(
            signEscrowEnrollmentIntent(vector.intent, vector.seedHex + '00')
        ).rejects.toThrow();
        await expect(
            signEscrowEnrollmentIntent(vector.intent, vector.seedHex + '\n')
        ).rejects.toThrow();
    });

    it('snapshots intent before awaiting so caller mutation cannot change signed return data', async () => {
        const intent = { ...vector.intent };
        const pending = signEscrowEnrollmentIntent(intent, vector.seedHex);
        intent.tenant = 'attacker';
        intent.allowRewrap = false;
        const signed = await pending;
        expect(signed.intent).toEqual(vector.intent);
        expect(signed.signature).toBe(vector.signature);
    });

    it.each([
        { tenant: 'other' },
        { authorityGeneration: 'g3' },
        { expectedEnrollmentVersion: 8 },
        { action: 'replace' },
        { sourceBlobIdentity: '11'.repeat(32) },
        { targetBlobIdentity: '22'.repeat(32) },
        { shareVersion: 43 },
        { enrollmentEpoch: 5 },
        { requestId: 'other' },
        { allowRewrap: false },
    ] satisfies Partial<EscrowEnrollmentIntent>[])(
        'binds signed field mutation %j',
        async mutation => {
            const message = encodeEscrowEnrollmentIntent({ ...vector.intent, ...mutation });
            expect(
                await verifyAsync(
                    Buffer.from(vector.signature, 'base64'),
                    message,
                    vector.publicKeyHex,
                    { zip215: false }
                )
            ).toBe(false);
        }
    );

    it.each([
        { version: 2 },
        { tenant: '' },
        { tenant: 'a'.repeat(129) },
        { tenant: 'tenant\0evil' },
        { tenant: 'tenant\n' },
        { requestId: 'request\u2028' },
        { targetBlobIdentity: 'ab'.repeat(32) + '\n' },
        { expectedEnrollmentVersion: -1 },
        { expectedEnrollmentVersion: Number.MAX_SAFE_INTEGER + 1 },
        { expectedEnrollmentVersion: 1.5 },
        { shareVersion: 0 },
        { shareVersion: 2 ** 32 },
        { enrollmentEpoch: 0 },
        { enrollmentEpoch: Infinity },
        { sourceBlobIdentity: undefined },
        { targetBlobIdentity: 'AB'.repeat(32) },
        { requestId: 'x#y' },
        { allowRewrap: undefined },
        { action: 'rewrap' },
        { pinAction: 'clear' },
        { extra: 'unsigned-field' },
    ])('rejects invalid wire input %j', mutation => {
        // Exercise runtime guards, rather than pretending unknown input is typed.
        const input: unknown = { ...vector.intent, ...mutation };
        expect(() => encodeEscrowEnrollmentIntent(input as EscrowEnrollmentIntent)).toThrow();
    });

    it('accepts safe-integer boundaries and explicit nulls, not omitted fields', () => {
        const intent: EscrowEnrollmentIntent = {
            ...vector.intent,
            action: 'enroll',
            sourceBlobIdentity: null,
            expectedEnrollmentVersion: Number.MAX_SAFE_INTEGER,
            enrollmentEpoch: Number.MAX_SAFE_INTEGER,
            shareVersion: 0xffffffff,
        };
        expect(() => encodeEscrowEnrollmentIntent(intent)).not.toThrow();
        const { sourceBlobIdentity: omitted, ...missing } = intent;
        expect(omitted).toBeNull();
        expect(() => encodeEscrowEnrollmentIntent(missing as EscrowEnrollmentIntent)).toThrow();
    });

    it('pins action/PIN enum tags and separates disable from enrollment', () => {
        const disable: EscrowEnrollmentIntent = {
            ...vector.intent,
            action: 'disable',
            targetBlobIdentity: null,
            allowRewrap: false,
        };
        expect(() => encodeEscrowEnrollmentIntent(disable)).not.toThrow();
        expect(() => encodeEscrowEnrollmentIntent({ ...disable, allowRewrap: true })).toThrow();
        for (const pinAction of ['set', 'change', 'clear', 'keep'] as const) {
            expect(() =>
                encodeEscrowEnrollmentIntent({ ...vector.intent, action: 'replace', pinAction })
            ).not.toThrow();
        }
        expect(() =>
            encodeEscrowEnrollmentIntent({
                ...vector.intent,
                targetBlobIdentity: vector.intent.sourceBlobIdentity,
            })
        ).toThrow();
    });

    it('preserves blob identity under Q/-Q, but not ciphertext substitution', async () => {
        const original = envelopes.blobs[0].envelope;
        const point = Buffer.from(original.ephemeralPublicKey, 'base64');
        const prime = BigInt('0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff');
        const y = BigInt(`0x${point.subarray(33).toString('hex')}`);
        Buffer.from((prime - y).toString(16).padStart(64, '0'), 'hex').copy(point, 33);
        expect(
            await getEscrowBlobIdentity({
                ...original,
                ephemeralPublicKey: point.toString('base64'),
            })
        ).toBe(vector.intent.sourceBlobIdentity);
        const ciphertext = Buffer.from(original.ciphertext, 'base64');
        ciphertext[0] ^= 1;
        expect(
            await getEscrowBlobIdentity({ ...original, ciphertext: ciphertext.toString('base64') })
        ).not.toBe(vector.intent.sourceBlobIdentity);
        await expect(
            getEscrowBlobIdentity({
                ...original,
                ephemeralPublicKey: Buffer.alloc(65, 4).toString('base64'),
            })
        ).rejects.toThrow();
    });
});
