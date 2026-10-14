import { Agent } from 'node:https';
import axios from 'axios';
import { z } from 'zod';
import {
    AuthorityCommitValidator,
    AuthorityMutationValidator,
    AuthorityStateResponseValidator,
} from './authorityContract';
import {
    ESCROW_ALGORITHM,
    ESCROW_ENVELOPE_VERSION,
    type EscrowEnvelope,
} from '@learncard/sss-key-manager';
import {
    EscrowBlobError,
    EscrowPinMismatchError,
    EscrowPolicyError,
    EscrowUnavailableError,
    type CarryPinVerifierInput,
    type ConfirmHoldRequest,
    type EnclaveAttestation,
    type EscrowEnclave,
    type ReleaseRequest,
    type ReleaseResult,
    type ResendCodeRequest,
    type RewrapEscrowBlobInput,
    type SendReleaseWarningRequest,
    type VerifyEscrowBlobInput,
    type VerifyEscrowBlobResult,
} from './types';

// Mirrors services/escrow-enclave-app/src/wire.rs camelCase field names exactly,
// minus the vsock wire's `method` tag (the HTTP paths below take its place).
const measurementsValidator = z.object({
    imageSha384: z.string().optional(),
    pcr0: z.string().optional(),
    pcr1: z.string().optional(),
    pcr2: z.string().optional(),
});

const attestResponseValidator = z.object({
    mode: z.enum(['software', 'nitro']),
    keyId: z.string(),
    // Optional/defaulted (not required, unlike the host's own wire.rs field) so
    // a not-yet-upgraded host during a rolling deploy still parses; P9.1.
    previousKeyIds: z.array(z.string()).optional().default([]),
    publicKey: z.string(),
    measurements: measurementsValidator,
    document: z.string(),
    issuedAt: z.string(),
});

const envelopeValidator = z.object({
    version: z.literal(ESCROW_ENVELOPE_VERSION),
    algorithm: z.literal(ESCROW_ALGORITHM),
    keyId: z.string(),
    ephemeralPublicKey: z.string(),
    salt: z.string(),
    iv: z.string(),
    ciphertext: z.string(),
});

const verifyBlobResponseValidator = z.union([
    z.object({ ok: z.literal(true), hasPin: z.boolean() }),
    z.object({ ok: z.literal(false), hasPin: z.boolean(), reason: z.string() }),
]);

const carryPinVerifierResponseValidator = z.object({ envelope: envelopeValidator });

// Opaque SignedHoldRecord JSON: validate shape while preserving signed extensions.
const holdRecordValidator = z
    .object({
        hold: z
            .object({
                holdId: z.string().min(1),
                did: z.string().min(1),
                shareVersion: z.number().int().positive(),
                blobHash: z.string().regex(/^[0-9a-f]{64}$/),
                enrollmentEpoch: z.number().int().positive(),
                releasePolicy: z.enum(['hold', 'pin']),
                clientEphemeralPublicKey: z.string().min(1),
                createdLo: z.number().int().nonnegative(),
                createdHi: z.number().int().nonnegative(),
                policyVersion: z.union([z.literal(1), z.literal(2)]),
                signature: z.string().min(1).max(8192),
            })
            .passthrough(),
        holdDurationMs: z.number().int().nonnegative(),
        ledgerSeq: z.number().int().nonnegative(),
    })
    .passthrough();
const validatedHold = (hold: ReleaseRequest['hold']): ReleaseRequest['hold'] => {
    if (!holdRecordValidator.safeParse(hold).success) throw new EscrowUnavailableError();
    if (hold.hold.policyVersion === 2) {
        try {
            AuthorityCommitValidator.parse(
                JSON.parse(Buffer.from(hold.hold.signature, 'base64').toString('utf8'))
            );
        } catch {
            throw new EscrowUnavailableError();
        }
    }
    return hold;
};
const releaseResponseValidator = z.object({
    sealed: envelopeValidator,
    receipt: AuthorityCommitValidator.optional(),
});

const errorCodeValidator = z.enum([
    'policy',
    'pinMismatch',
    'blob',
    'unavailable',
    'ledger',
    'time',
]);
const errorResponseValidator = z.object({ code: errorCodeValidator, message: z.string() });

const errorForCode = (code: z.infer<typeof errorCodeValidator>): Error => {
    if (code === 'policy') return new EscrowPolicyError();
    if (code === 'pinMismatch') return new EscrowPinMismatchError();
    if (code === 'blob') return new EscrowBlobError();
    return new EscrowUnavailableError(); // 'unavailable' | 'ledger' | 'time'
};

export interface RemoteEnclaveTransportResponse {
    status: number;
    data: unknown;
}

export interface RemoteEnclaveTransport {
    post(
        url: string,
        body: unknown,
        config: { headers: Record<string, string>; timeout: number }
    ): Promise<RemoteEnclaveTransportResponse>;
}

/** With `caPem`, the connection trusts only that CA (system roots are not consulted). */
export const createHttpTransport = (caPem?: string): RemoteEnclaveTransport => {
    const httpsAgent = caPem ? new Agent({ ca: caPem, keepAlive: true }) : undefined;
    return {
        post: async (url, body, config) => {
            const response = await axios.post(url, body, {
                ...config,
                httpsAgent,
                validateStatus: () => true,
            });
            return { status: response.status, data: response.data };
        },
    };
};

export interface RemoteEnclaveConfig {
    /** Origin of the enclave-host parent service (P3.3), e.g. `https://escrow.internal`. */
    baseUrl: string;
    token: string;
    timeoutMs: number;
    /** Private CA pinned for this host (see enclaveTrustAnchors.ts); system roots otherwise. */
    caPem?: string;
    /** Injectable for tests; defaults to a real HTTP (axios) transport. */
    transport?: RemoteEnclaveTransport;
}

/**
 * `EscrowEnclave` backend for `ESCROW_ENCLAVE_MODE=remote`: an HTTP client to the
 * enclave-host parent service fronting a real Nitro Enclave. See issues.md
 * "P4.1 report" for the full contract (paths, bodies, error format).
 *
 * Fail-closed: any transport failure (network error, timeout, non-2xx without a
 * recognized error code, or a response failing its zod schema) becomes
 * `EscrowUnavailableError`. Request/response bodies (sealed envelopes, PIN
 * proofs) are never logged anywhere in this module.
 */
export const createRemoteEnclave = (config: RemoteEnclaveConfig): EscrowEnclave => {
    const transport = config.transport ?? createHttpTransport(config.caPem);

    const call = async <T>(path: string, body: unknown, validator: z.ZodType<T>): Promise<T> => {
        let status: number;
        let data: unknown;
        try {
            const response = await transport.post(`${config.baseUrl}${path}`, body, {
                headers: { Authorization: `Bearer ${config.token}` },
                timeout: config.timeoutMs,
            });
            status = response.status;
            data = response.data;
        } catch {
            throw new EscrowUnavailableError();
        }
        if (status < 200 || status >= 300) {
            const parsedError = errorResponseValidator.safeParse(data);
            if (parsedError.success) throw errorForCode(parsedError.data.code);
            throw new EscrowUnavailableError();
        }
        const parsed = validator.safeParse(data);
        if (!parsed.success) throw new EscrowUnavailableError();
        return parsed.data;
    };

    return {
        getEnrollmentState: input =>
            call('/v1/enrollment-state', input, AuthorityStateResponseValidator),
        applyEnrollmentIntent: async input => {
            const { result } = await call(
                '/v1/apply-enrollment',
                input,
                z.object({ result: AuthorityMutationValidator }).strict()
            );
            if (
                result.authorityGeneration !== input.signedIntent.intent.authorityGeneration ||
                result.enrollmentVersion !==
                    input.signedIntent.intent.expectedEnrollmentVersion + 1 ||
                result.enrollmentEpoch !== input.signedIntent.intent.enrollmentEpoch ||
                (result.envelope === null) !== (input.signedIntent.intent.action === 'disable')
            )
                throw new EscrowUnavailableError();
            return result;
        },
        getAttestation: (nonce?: Uint8Array): Promise<EnclaveAttestation> =>
            call('/v1/attest', { nonce: Array.from(nonce ?? []) }, attestResponseValidator),
        verifyEscrowBlob: (input: VerifyEscrowBlobInput): Promise<VerifyEscrowBlobResult> =>
            call(
                '/v1/verify-blob',
                {
                    envelope: input.envelope,
                    expectedDid: input.expectedDid,
                    expectedShareVersion: input.expectedShareVersion,
                },
                verifyBlobResponseValidator
            ),
        carryPinVerifier: (input: CarryPinVerifierInput): Promise<{ envelope: EscrowEnvelope }> =>
            call(
                '/v1/carry-pin-verifier',
                {
                    sourceEnvelope: input.sourceEnvelope,
                    targetEnvelope: input.targetEnvelope,
                    expectedDid: input.expectedDid,
                    sourceShareVersion: input.sourceShareVersion,
                    targetShareVersion: input.targetShareVersion,
                    sourceEnrollmentEpoch: input.sourceEnrollmentEpoch,
                    targetEnrollmentEpoch: input.targetEnrollmentEpoch,
                },
                carryPinVerifierResponseValidator
            ),
        rewrapEscrowBlob: async (input: RewrapEscrowBlobInput) => {
            const { result } = await call(
                '/v1/authority-rewrap',
                {
                    envelope: input.envelope,
                    expectedDid: input.expectedDid,
                    expectedShareVersion: input.expectedShareVersion,
                    sourceEnrollmentEpoch: input.sourceEnrollmentEpoch,
                },
                z.object({ result: AuthorityMutationValidator }).strict()
            );
            if (!result.envelope || result.enrollmentEpoch !== input.sourceEnrollmentEpoch)
                throw new EscrowUnavailableError();
            return { envelope: result.envelope, authority: result };
        },
        createHold: async input => ({
            holdRecord: validatedHold(
                await call(
                    '/v1/create-hold',
                    {
                        envelope: input.envelope,
                        holdId: input.holdId,
                        expectedDid: input.expectedDid,
                        expectedShareVersion: input.expectedShareVersion,
                        enrollmentEpoch: input.enrollmentEpoch,
                        releasePolicy: input.releasePolicy,
                        clientEphemeralPublicKey: input.clientEphemeralPublicKey,
                    },
                    holdRecordValidator
                )
            ),
        }),
        cancelHold: async input => {
            const result = await call(
                '/v1/cancel-hold',
                {
                    envelope: input.envelope,
                    hold: validatedHold(input.hold),
                    clientEphemeralPublicKey: input.clientEphemeralPublicKey,
                    expectedDid: input.expectedDid,
                    ...(input.requestId ? { requestId: input.requestId } : {}),
                },
                z.object({ ok: z.literal(true), receipt: AuthorityCommitValidator.optional() })
            );
            if (input.hold.hold.policyVersion === 2 && !result.receipt)
                throw new EscrowUnavailableError();
            if (result.receipt) return { receipt: result.receipt };
            return undefined;
        },
        confirmHold: async (input: ConfirmHoldRequest) => {
            const result = await call(
                '/v1/confirm-hold',
                {
                    envelope: input.envelope,
                    hold: validatedHold(input.hold),
                    clientEphemeralPublicKey: input.clientEphemeralPublicKey,
                    expectedDid: input.expectedDid,
                    code: input.code,
                    ...(input.requestId ? { requestId: input.requestId } : {}),
                },
                z.object({ confirmed: z.literal(true), receipt: AuthorityCommitValidator })
            );
            return { receipt: result.receipt };
        },
        resendCode: async (input: ResendCodeRequest) => {
            const result = await call(
                '/v1/resend-code',
                {
                    envelope: input.envelope,
                    hold: validatedHold(input.hold),
                    clientEphemeralPublicKey: input.clientEphemeralPublicKey,
                    expectedDid: input.expectedDid,
                    ...(input.requestId ? { requestId: input.requestId } : {}),
                },
                z.object({ sent: z.literal(true), receipt: AuthorityCommitValidator })
            );
            return { receipt: result.receipt };
        },
        sendReleaseWarning: async (input: SendReleaseWarningRequest) => {
            const result = await call(
                '/v1/send-release-warning',
                {
                    holdId: input.holdId,
                    expectedDid: input.expectedDid,
                    ...(input.requestId ? { requestId: input.requestId } : {}),
                },
                z.object({ sent: z.literal(true), receipt: AuthorityCommitValidator })
            );
            return { receipt: result.receipt };
        },
        releaseEscrow: async (input: ReleaseRequest): Promise<ReleaseResult> => {
            validatedHold(input.hold);
            const result = await call(
                '/v1/release',
                {
                    envelope: input.envelope,
                    hold: input.hold,
                    clientEphemeralPublicKey: input.clientEphemeralPublicKey,
                    expectedDid: input.expectedDid,
                    ...(input.pinProof !== undefined ? { pinProof: input.pinProof } : {}),
                    ...(input.requestId ? { requestId: input.requestId } : {}),
                },
                releaseResponseValidator
            );
            if (input.hold.hold.policyVersion === 2 && !result.receipt)
                throw new EscrowUnavailableError();
            return result;
        },
    };
};
