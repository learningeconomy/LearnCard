import { z } from 'zod';
import { CredentialSubjectValidator, ProfileValidator } from './vc';

/**
 * Per-entry result for the credentialStatus check.
 *
 * Surfaced from `ssi-ldp::StatusCheckEntry` (see ssi PR
 * `lc-status-array-and-structured-result`) through didkit's
 * `verifyCredential` JSON output. One entry per `credentialStatus`
 * entry on the verified credential — VC 2.0 allows multiple
 * (e.g. one revocation entry + one suspension entry).
 *
 * Combine `statusPurpose` + `isSet` to render structured UI without
 * string-matching the human-readable error in `errors`:
 *
 * - `statusPurpose: "revocation"`, `isSet: true`  → revoked
 * - `statusPurpose: "suspension"`, `isSet: true`  → suspended
 * - `isSet: false`                                → active for that purpose
 */
export const StatusCheckEntryValidator = z.object({
    /**
     * The `credentialStatus.type` as it appeared on the credential.
     * One of `BitstringStatusListEntry`, `StatusList2021Entry`,
     * `RevocationList2020Status`, or any future custom status type.
     */
    entryType: z.string(),
    /**
     * The claimed purpose of the entry. Standard values are
     * `"revocation"` and `"suspension"`; the spec allows arbitrary
     * strings.
     */
    statusPurpose: z.string(),
    /**
     * Whether the bit at the credential's index in the status list
     * bitstring was set.
     */
    isSet: z.boolean(),
    /** URL of the status list credential, when known. */
    statusListCredential: z.string().optional(),
    /** Original (string) index within the status list. */
    statusListIndex: z.string().optional(),
});
export type StatusCheckEntry = z.infer<typeof StatusCheckEntryValidator>;

export const VerificationCheckValidator = z.object({
    checks: z.string().array(),
    warnings: z.string().array(),
    errors: z.string().array(),
    /**
     * Per-entry results for the `credentialStatus` check, populated
     * by `@learncard/didkit-plugin` when the verified credential
     * carries one or more `credentialStatus` entries. Empty / absent
     * for credentials without a status entry.
     *
     * Marked `.optional()` because the underlying `ssi-ldp`
     * serializer omits the field when empty (`skip_serializing_if`),
     * so older WASM builds that pre-date the structured-status
     * change still validate against this schema.
     */
    status: StatusCheckEntryValidator.array().optional(),
});
export type VerificationCheck = z.infer<typeof VerificationCheckValidator>;

export const VerificationStatusValidator = z.enum(['Success', 'Failed', 'Error']);
export type VerificationStatus = z.infer<typeof VerificationStatusValidator>;
export const VerificationStatusEnum = VerificationStatusValidator.enum;

export const VerificationItemValidator = z.object({
    check: z.string(),
    status: VerificationStatusValidator,
    message: z.string().optional(),
    details: z.string().optional(),
});
export type VerificationItem = z.infer<typeof VerificationItemValidator>;

export const CredentialInfoValidator = z.object({
    title: z.string().optional(),
    createdAt: z.string().optional(),
    issuer: ProfileValidator.optional(),
    issuee: ProfileValidator.optional(),
    credentialSubject: CredentialSubjectValidator.optional(),
});
export type CredentialInfo = z.infer<typeof CredentialInfoValidator>;

export type CredentialRecord<Metadata extends Record<string, any> = Record<never, never>> = {
    id: string;
    uri: string;
    [key: string]: any;
} & Metadata;

export const CredentialRecordValidator = z
    .object({ id: z.string(), uri: z.string() })
    .catchall(z.any()) satisfies z.ZodType<CredentialRecord>;
