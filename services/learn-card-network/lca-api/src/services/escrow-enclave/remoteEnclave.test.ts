import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { EscrowEnvelope } from '@learncard/sss-key-manager';
import { createRemoteEnclave, type RemoteEnclaveTransportResponse } from './remoteEnclave';
import {
    EscrowBlobError,
    EscrowPinMismatchError,
    EscrowPolicyError,
    EscrowUnavailableError,
    type EscrowHoldForEnclave,
} from './types';

const baseUrl = 'https://enclave-host.internal';
const token = 't'.repeat(32);
const timeoutMs = 10_000;

const envelope: EscrowEnvelope = {
    version: 1,
    algorithm: 'P-256-HKDF-SHA256-AES-256-GCM',
    keyId: 'key-1',
    ephemeralPublicKey: 'AA==',
    salt: 'AA==',
    iv: 'AA==',
    ciphertext: 'AA==',
};

const hold: EscrowHoldForEnclave = {
    _id: 'hold-1',
    status: 'pending',
    releaseAfter: new Date(1_700_000_000_000),
    releasePolicy: 'hold',
    primaryDid: 'did:example:alice',
    shareVersion: 1,
    clientEphemeralPublicKey: 'BB==',
};

const attestationBody = {
    mode: 'nitro' as const,
    keyId: 'key-1',
    publicKey: 'CC==',
    measurements: { pcr0: '00', pcr1: '11', pcr2: '22' },
    document: 'ZG9j',
    issuedAt: '2026-09-25T00:00:00.000Z',
};

const respond = (status: number, data: unknown): RemoteEnclaveTransportResponse => ({
    status,
    data,
});

describe('createRemoteEnclave', () => {
    let consoleSpies: ReturnType<typeof vi.spyOn>[];

    beforeEach(() => {
        consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(method =>
            vi.spyOn(console, method).mockImplementation(() => {})
        );
    });

    afterEach(() => {
        // Envelopes and PIN proofs must never reach any log sink, on success or failure.
        for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
        vi.restoreAllMocks();
    });

    it('fetches attestation, forwarding the nonce as a byte array with the bearer token', async () => {
        const post = vi.fn().mockResolvedValue(respond(200, attestationBody));
        const enclave = createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } });
        const nonce = Uint8Array.from([1, 2, 3]);

        await expect(enclave.getAttestation(nonce)).resolves.toEqual(attestationBody);

        expect(post).toHaveBeenCalledWith(
            `${baseUrl}/v1/attest`,
            { nonce: [1, 2, 3] },
            { headers: { Authorization: `Bearer ${token}` }, timeout: timeoutMs }
        );
    });

    it('sends an empty nonce array when none is given', async () => {
        const post = vi.fn().mockResolvedValue(respond(200, attestationBody));
        const enclave = createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } });

        await enclave.getAttestation();

        expect(post).toHaveBeenCalledWith(`${baseUrl}/v1/attest`, { nonce: [] }, expect.anything());
    });

    it('passes the attested mode through verbatim instead of upgrading it to nitro', async () => {
        const post = vi
            .fn()
            .mockResolvedValue(respond(200, { ...attestationBody, mode: 'software' }));
        const enclave = createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } });

        await expect(enclave.getAttestation()).resolves.toMatchObject({ mode: 'software' });
    });

    it('verifies an escrow blob', async () => {
        const post = vi.fn().mockResolvedValue(respond(200, { ok: true, hasPin: false }));
        const enclave = createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } });

        await expect(
            enclave.verifyEscrowBlob({
                envelope,
                expectedDid: 'did:example:alice',
                expectedShareVersion: 1,
            })
        ).resolves.toEqual({ ok: true, hasPin: false });
        expect(post).toHaveBeenCalledWith(
            `${baseUrl}/v1/verify-blob`,
            { envelope, expectedDid: 'did:example:alice', expectedShareVersion: 1 },
            expect.anything()
        );
    });

    it('surfaces a failed verification result without throwing', async () => {
        const post = vi.fn().mockResolvedValue(
            respond(200, {
                ok: false,
                hasPin: true,
                reason: 'Escrow recovery is not permitted.',
            })
        );
        const enclave = createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } });

        await expect(
            enclave.verifyEscrowBlob({
                envelope,
                expectedDid: 'did:example:alice',
                expectedShareVersion: 1,
            })
        ).resolves.toEqual({
            ok: false,
            hasPin: true,
            reason: 'Escrow recovery is not permitted.',
        });
    });

    it('releases escrow, omitting host-supplied time', async () => {
        const post = vi.fn().mockResolvedValue(respond(200, { sealed: envelope }));
        const enclave = createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } });

        await expect(
            enclave.releaseEscrow({
                envelope,
                hold,
                clientEphemeralPublicKey: hold.clientEphemeralPublicKey,
                expectedDid: hold.primaryDid,
                now: new Date(),
            })
        ).resolves.toEqual({ sealed: envelope });

        const [, body] = post.mock.calls[0]!;
        expect(body).toEqual({
            envelope,
            hold,
            clientEphemeralPublicKey: hold.clientEphemeralPublicKey,
            expectedDid: hold.primaryDid,
        });
    });

    it('includes pinProof only when provided', async () => {
        const post = vi.fn().mockResolvedValue(respond(200, { sealed: envelope }));
        const enclave = createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } });

        await enclave.releaseEscrow({
            envelope,
            hold,
            clientEphemeralPublicKey: hold.clientEphemeralPublicKey,
            expectedDid: hold.primaryDid,
            pinProof: 'ab'.repeat(32),
        });

        const [, body] = post.mock.calls[0]!;
        expect(body).toMatchObject({ pinProof: 'ab'.repeat(32) });
    });

    it.each([
        ['policy', EscrowPolicyError],
        ['pinMismatch', EscrowPinMismatchError],
        ['blob', EscrowBlobError],
        ['unavailable', EscrowUnavailableError],
        ['ledger', EscrowUnavailableError],
        ['time', EscrowUnavailableError],
    ] as const)(
        'maps wire error code %s to the matching EscrowEnclave error',
        async (code, ErrorClass) => {
            const post = vi.fn().mockResolvedValue(respond(400, { code, message: 'Refused.' }));
            const enclave = createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } });

            await expect(
                enclave.releaseEscrow({
                    envelope,
                    hold,
                    clientEphemeralPublicKey: hold.clientEphemeralPublicKey,
                    expectedDid: hold.primaryDid,
                })
            ).rejects.toBeInstanceOf(ErrorClass);
        }
    );

    it('fails closed on a network error', async () => {
        const post = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED'));
        const enclave = createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } });

        await expect(enclave.getAttestation()).rejects.toBeInstanceOf(EscrowUnavailableError);
    });

    it('fails closed on a timeout', async () => {
        const post = vi
            .fn()
            .mockRejectedValue(
                Object.assign(new Error('timeout of 10000ms exceeded'), { code: 'ECONNABORTED' })
            );
        const enclave = createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } });

        await expect(enclave.getAttestation()).rejects.toBeInstanceOf(EscrowUnavailableError);
    });

    it('fails closed on a 500 with no recognizable error code', async () => {
        const post = vi.fn().mockResolvedValue(respond(500, { message: 'internal server error' }));
        const enclave = createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } });

        await expect(enclave.getAttestation()).rejects.toBeInstanceOf(EscrowUnavailableError);
    });

    it('fails closed on a malformed/schema-invalid success response', async () => {
        const post = vi.fn().mockResolvedValue(respond(200, 'not-an-object'));
        const enclave = createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } });

        await expect(enclave.getAttestation()).rejects.toBeInstanceOf(EscrowUnavailableError);
    });

    it('defaults to a real HTTP transport when none is injected', () => {
        expect(() => createRemoteEnclave({ baseUrl, token, timeoutMs })).not.toThrow();
    });
});
