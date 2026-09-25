// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { decode, encode } from 'cborg';
import { base64ToBuffer, bufferToBase64 } from './crypto';
import { NitroAttestationError, verifyNitroAttestationDocument } from './escrow-nitro-attestation';
import { verifyEnclaveAttestation } from './escrow-attestation';
import manifest from './__fixtures__/nitro-attestation/manifest.json';
import type { EscrowAttestationPolicy } from './types';

const directory = new URL('./__fixtures__/nitro-attestation/', import.meta.url);
const fixture = (name: string): string =>
    readFileSync(new URL(`${name}.cbor.b64`, directory), 'utf8').trim();
const nonce = Uint8Array.from(manifest.nonceHex.match(/../g)!, byte => parseInt(byte, 16));
const measurement = { pcr0: manifest.pcrs[0], pcr1: manifest.pcrs[1], pcr2: manifest.pcrs[2] };
const policy: Extract<EscrowAttestationPolicy, { mode: 'nitro' }> = {
    mode: 'nitro',
    pinnedMeasurements: [measurement],
    rootCertificateSha256: manifest.rootSha256,
};
const options = { expectedNonce: nonce, policy, now: manifest.nowMs };
const reasonMap: Record<string, string> = {
    'debug PCRs': 'debug',
    'missing intermediate': 'chain',
    'root pin': 'root',
};

describe('FakeNsm Nitro attestation', () => {
    afterEach(() => vi.restoreAllMocks());
    it('covers every committed document fixture', () => {
        expect(
            readdirSync(directory)
                .filter(file => file.endsWith('.cbor.b64'))
                .sort()
        ).toEqual(
            Object.keys(manifest.cases)
                .map(name => `${name}.cbor.b64`)
                .sort()
        );
    });
    for (const [name, testCase] of Object.entries(manifest.cases)) {
        it(name, async () => {
            const expectedNonce =
                'nonceHex' in testCase
                    ? Uint8Array.from(testCase.nonceHex.match(/../g)!, byte => parseInt(byte, 16))
                    : nonce;
            const result = verifyNitroAttestationDocument(fixture(name), {
                ...options,
                expectedNonce,
            });
            if (testCase.accept) {
                await expect(result).resolves.toMatchObject({
                    escrowPublicKeySpkiB64: manifest.userDataBase64,
                    timestamp: manifest.timestamp,
                    pcrs: manifest.pcrs,
                });
            } else if ('reason' in testCase) {
                await expect(result).rejects.toMatchObject({
                    name: 'NitroAttestationError',
                    reason: reasonMap[testCase.reason] ?? testCase.reason,
                });
            }
        });
    }
    it('accepts an optional outer tag 18', async () => {
        const tagged = new Uint8Array([0xd2, ...base64ToBuffer(fixture('valid'))]);
        await expect(
            verifyNitroAttestationDocument(bufferToBase64(tagged.buffer), options)
        ).resolves.toBeDefined();
    });
    it('rejects cross-combinations of pinned tuples', async () => {
        await expect(
            verifyNitroAttestationDocument(fixture('valid'), {
                ...options,
                policy: {
                    ...policy,
                    pinnedMeasurements: [
                        { ...measurement, pcr1: 'ff'.repeat(48) },
                        { ...measurement, pcr0: 'ff'.repeat(48) },
                    ],
                },
            })
        ).rejects.toMatchObject({ reason: 'pcr' });
    });
    it('rejects legacy image-only pins', async () => {
        await expect(
            verifyNitroAttestationDocument(fixture('valid'), {
                ...options,
                policy: {
                    ...policy,
                    pinnedMeasurements: [{ imageSha384: measurement.pcr0 }],
                },
            })
        ).rejects.toMatchObject({ reason: 'pcr' });
    });
    it('rejects unknown algorithms before signature verification', async () => {
        const cose: unknown[] = decode(base64ToBuffer(fixture('valid')), { useMaps: true });
        cose[0] = encode(new Map([[1, -7]]));
        await expect(
            verifyNitroAttestationDocument(
                bufferToBase64(new Uint8Array(encode(cose)).buffer),
                options
            )
        ).rejects.toMatchObject({ reason: 'alg' });
    });
    it('rejects the fake root under the default AWS pin', async () => {
        await expect(
            verifyNitroAttestationDocument(fixture('valid'), {
                ...options,
                policy: {
                    mode: 'nitro',
                    pinnedMeasurements: [measurement],
                },
            })
        ).rejects.toMatchObject({ reason: 'root' });
    });
    it('enforces clock skew and configurable freshness', async () => {
        await expect(
            verifyNitroAttestationDocument(fixture('valid'), {
                ...options,
                now: manifest.timestamp - 60001,
            })
        ).rejects.toMatchObject({ reason: 'freshness' });
        await expect(
            verifyNitroAttestationDocument(fixture('valid'), {
                ...options,
                policy: { ...policy, maxAgeMs: 999 },
            })
        ).rejects.toMatchObject({ reason: 'freshness' });
    });
    it('returns typed CBOR errors', async () => {
        await expect(verifyNitroAttestationDocument('bad!', options)).rejects.toBeInstanceOf(
            NitroAttestationError
        );
        await expect(verifyNitroAttestationDocument('bad!', options)).rejects.toMatchObject({
            reason: 'cbor',
        });
    });
    it('binds the wrapper public key to user_data, ignoring unsigned measurements', async () => {
        vi.spyOn(Date, 'now').mockReturnValue(manifest.nowMs);
        const attestation = {
            mode: 'nitro',
            keyId: 'test-key',
            publicKey: manifest.userDataBase64,
            document: fixture('valid'),
            measurements: { pcr0: 'untrusted' },
            issuedAt: new Date(manifest.nowMs).toISOString(),
        };
        await expect(verifyEnclaveAttestation(attestation, policy, nonce)).resolves.toEqual({
            mode: 'nitro',
            keyId: 'test-key',
            publicKey: manifest.userDataBase64,
        });
        await expect(
            verifyEnclaveAttestation({ ...attestation, publicKey: 'e30=' }, policy, nonce)
        ).rejects.toMatchObject({ reason: 'user-data' });
        await expect(verifyEnclaveAttestation(attestation, policy)).rejects.toMatchObject({
            reason: 'nonce',
        });
    });
});
