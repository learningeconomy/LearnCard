import { z } from 'zod';
import {
    encodeEscrowEnrollmentIntent,
    ESCROW_ALGORITHM,
    ESCROW_ENVELOPE_VERSION,
} from '@learncard/sss-key-manager';

export const safeInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const label = z
    .string()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9_-]+$/);
export const AuthorityEnvelopeValidator = z
    .object({
        version: z.literal(ESCROW_ENVELOPE_VERSION),
        algorithm: z.literal(ESCROW_ALGORITHM),
        keyId: z.string().min(1).max(128),
        ephemeralPublicKey: z.string().max(256),
        salt: z.string().max(128),
        iv: z.string().max(64),
        ciphertext: z.string().max(16_384),
    })
    .strict();
export const AuthorityRecordValidator = z
    .object({
        version: z.literal(1),
        kind: z.enum(['proposal', 'commit', 'snapshot']),
        keyId: z.string().min(1).max(128),
        measurement: z.array(z.number().int().min(0).max(255)).length(32),
        payload: z.string().min(1).max(49_152),
        signature: z.string().length(88),
    })
    .strict();
export const AuthorityCommitValidator = AuthorityRecordValidator.extend({
    kind: z.literal('commit'),
    payload: z.string().min(1).max(8192),
});
// Idempotent-retry attestation for confirm-hold / send-release-warning (see
// `authority_hold_snapshot` in policy/authority.rs): a fresh call returns a
// `commit`; a retry of an already-applied operation returns this instead,
// signed over the hold's current fields rather than a new ledger transition.
export const AuthorityHoldSnapshotValidator = AuthorityRecordValidator.extend({
    kind: z.literal('snapshot'),
});
// confirm-hold and send-release-warning responses carry whichever shape the
// enclave actually returned; callers must not assume `commit`.
export const AuthorityHoldReceiptValidator = z.union([
    AuthorityCommitValidator,
    AuthorityHoldSnapshotValidator,
]);
export const SignedEnrollmentIntentValidator = z
    .object({
        intent: z
            .object({
                version: z.literal(2),
                tenant: label,
                did: z.string().length(56),
                authorityGeneration: label,
                expectedEnrollmentVersion: safeInteger,
                action: z.enum(['enroll', 'replace', 'disable', 'carry']),
                sourceBlobIdentity: z
                    .string()
                    .regex(/^[0-9a-f]{64}$/)
                    .nullable(),
                targetBlobIdentity: z
                    .string()
                    .regex(/^[0-9a-f]{64}$/)
                    .nullable(),
                pinAction: z.enum(['set', 'change', 'clear', 'keep']),
                shareVersion: z.number().int().positive().max(0xffffffff),
                enrollmentEpoch: safeInteger.positive(),
                requestId: z.string().min(1).max(112),
                allowRewrap: z.boolean(),
                // P9.1 (attack C): shape only — `encodeEscrowEnrollmentIntent` below
                // enforces normalization, the paired requirement, and the language
                // allow-list; lca-api never re-derives or overrides these values.
                recoveryEmail: z.string().min(3).max(254).nullable(),
                recoveryLanguage: z.string().length(2).nullable(),
            })
            .strict()
            .refine(intent => {
                try {
                    encodeEscrowEnrollmentIntent(intent);
                    return true;
                } catch {
                    return false;
                }
            }, 'Invalid enrollment intent'),
        signature: z.string().length(88),
    })
    .strict();
export const AuthorityStateValidator = z
    .object({
        tenant: label,
        authorityGeneration: label,
        did: z.string().min(1).max(8192),
        enrollmentVersion: safeInteger,
        enrollmentEpoch: safeInteger,
        status: z.enum(['empty', 'active', 'disabled']),
        envelope: AuthorityEnvelopeValidator.nullable(),
        shareVersion: z.number().int().positive().max(0xffffffff).nullable(),
        hasPin: z.boolean(),
        pinGeneration: safeInteger,
        attemptsUsed: z.number().int().min(0).max(10),
    })
    .strict();
export const AuthorityStateResponseValidator = z
    .object({
        state: AuthorityStateValidator,
        proof: AuthorityRecordValidator.extend({ kind: z.literal('snapshot') }),
    })
    .strict();
export const AuthorityMutationValidator = z
    .object({
        envelope: AuthorityEnvelopeValidator.nullable(),
        receipt: AuthorityCommitValidator,
        authorityGeneration: label,
        enrollmentVersion: safeInteger.positive(),
        enrollmentEpoch: safeInteger.positive(),
    })
    .strict();
export type AuthorityRecord = z.infer<typeof AuthorityRecordValidator>;
export type AuthorityMutationResult = z.infer<typeof AuthorityMutationValidator>;
export type AuthorityStateResponse = z.infer<typeof AuthorityStateResponseValidator>;
