import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { EscrowEnvelope } from '@learncard/sss-key-manager';
import { createRemoteEnclave, type RemoteEnclaveTransportResponse } from './remoteEnclave';
import {
    EscrowBlobError,
    EscrowPinMismatchError,
    EscrowPolicyError,
    EscrowUnavailableError,
    type EscrowHoldRecord,
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

const hold: EscrowHoldRecord = {
    hold: {
        holdId: 'hold-1',
        did: 'did:example:alice',
        shareVersion: 1,
        blobHash: 'ab'.repeat(32),
        enrollmentEpoch: 1,
        releasePolicy: 'hold',
        clientEphemeralPublicKey: 'BB==',
        createdLo: 1700000000000,
        createdHi: 1700000000000,
        policyVersion: 1,
        signature: 'signed-test-record',
    },
    holdDurationMs: 604800000,
    ledgerSeq: 1,
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
                clientEphemeralPublicKey: hold.hold.clientEphemeralPublicKey,
                expectedDid: hold.hold.did,
                now: new Date(),
            })
        ).resolves.toEqual({ sealed: envelope });

        const [, body] = post.mock.calls[0]!;
        expect(body).toEqual({
            envelope,
            hold,
            clientEphemeralPublicKey: hold.hold.clientEphemeralPublicKey,
            expectedDid: hold.hold.did,
        });
    });

    it('includes pinProof only when provided', async () => {
        const post = vi.fn().mockResolvedValue(respond(200, { sealed: envelope }));
        const enclave = createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } });

        await enclave.releaseEscrow({
            envelope,
            hold,
            clientEphemeralPublicKey: hold.hold.clientEphemeralPublicKey,
            expectedDid: hold.hold.did,
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
                    clientEphemeralPublicKey: hold.hold.clientEphemeralPublicKey,
                    expectedDid: hold.hold.did,
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
    const createInput = {
        envelope,
        holdId: hold.hold.holdId,
        expectedDid: hold.hold.did,
        expectedShareVersion: 1,
        enrollmentEpoch: 1,
        releasePolicy: 'hold' as const,
        clientEphemeralPublicKey: hold.hold.clientEphemeralPublicKey,
    };
    const cancelInput = {
        envelope,
        hold,
        expectedDid: hold.hold.did,
        clientEphemeralPublicKey: hold.hold.clientEphemeralPublicKey,
    };
    it('creates an opaque full record and forwards it unchanged to cancel and release', async () => {
        const opaque = { ...hold, extension: 'outer', hold: { ...hold.hold, extension: 'inner' } };
        const post = vi
            .fn()
            .mockResolvedValueOnce(respond(200, opaque))
            .mockResolvedValueOnce(respond(200, { ok: true }))
            .mockResolvedValueOnce(respond(200, { sealed: envelope }));
        const enclave = createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } });
        const created = await enclave.createHold(createInput);
        expect(created).toEqual({ holdRecord: opaque });
        const config = { headers: { Authorization: `Bearer ${token}` }, timeout: timeoutMs };
        expect(post).toHaveBeenNthCalledWith(1, `${baseUrl}/v1/create-hold`, createInput, config);
        await expect(
            enclave.cancelHold({ ...cancelInput, hold: created.holdRecord })
        ).resolves.toBeUndefined();
        expect(post).toHaveBeenNthCalledWith(
            2,
            `${baseUrl}/v1/cancel-hold`,
            { ...cancelInput, hold: opaque },
            config
        );
        await enclave.releaseEscrow({ ...cancelInput, hold: created.holdRecord });
        expect(post).toHaveBeenNthCalledWith(
            3,
            `${baseUrl}/v1/release`,
            { ...cancelInput, hold: opaque },
            config
        );
    });
    for (const operation of ['createHold', 'cancelHold'] as const) {
        const invoke = (enclave: ReturnType<typeof createRemoteEnclave>) =>
            operation === 'createHold'
                ? enclave.createHold(createInput)
                : enclave.cancelHold(cancelInput);
        it.each([
            ['policy', EscrowPolicyError],
            ['pinMismatch', EscrowPinMismatchError],
            ['blob', EscrowBlobError],
            ['unavailable', EscrowUnavailableError],
            ['ledger', EscrowUnavailableError],
            ['time', EscrowUnavailableError],
        ] as const)(
            `${operation} maps %s without leaking the remote message`,
            async (code, ErrorClass) => {
                const post = vi
                    .fn()
                    .mockResolvedValue(respond(400, { code, message: 'private remote detail' }));
                const enclave = createRemoteEnclave({
                    baseUrl,
                    token,
                    timeoutMs,
                    transport: { post },
                });
                await expect(invoke(enclave)).rejects.toBeInstanceOf(ErrorClass);
            }
        );
        it.each([
            null,
            'malformed',
            {},
            { ok: false },
            { ...hold, hold: { ...hold.hold, enrollmentEpoch: 0 } },
            { ...hold, ledgerSeq: 'bad' },
        ])(`${operation} fails closed on invalid response %#`, async data => {
            const post = vi.fn().mockResolvedValue(respond(200, data));
            await expect(
                invoke(createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } }))
            ).rejects.toBeInstanceOf(EscrowUnavailableError);
        });
        it.each(['ECONNREFUSED', 'ECONNABORTED'])(`${operation} fails closed on %s`, async code => {
            const post = vi
                .fn()
                .mockRejectedValue(Object.assign(new Error('transport failed'), { code }));
            await expect(
                invoke(createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } }))
            ).rejects.toBeInstanceOf(EscrowUnavailableError);
        });
        it(`${operation} rejects unrecognized HTTP errors`, async () => {
            const post = vi
                .fn()
                .mockResolvedValue(respond(500, { code: 'unknown', message: 'private' }));
            await expect(
                invoke(createRemoteEnclave({ baseUrl, token, timeoutMs, transport: { post } }))
            ).rejects.toBeInstanceOf(EscrowUnavailableError);
        });
    }
});
