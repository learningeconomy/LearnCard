/**
 * Result of checking a credential against its declared status list.
 *
 *   - `active` — the bit at the credential's index is 0; the status
 *     purpose does NOT apply (e.g., revocation purpose + bit 0 →
 *     not revoked).
 *   - `revoked` / `suspended` — the bit is 1 AND the purpose matches.
 *     Two distinct values so callers can render different UI for
 *     "this credential was revoked" vs "this is temporarily
 *     suspended" (suspension can be lifted; revocation is
 *     terminal).
 *   - `no_status` — the credential carries no `credentialStatus`
 *     entry. Distinct from `active` so callers can decide whether
 *     to require a status list (some governance models do).
 *   - `unsupported_status_type` — the entry's `type` isn't one we
 *     recognise (e.g., `RevocationList2020` legacy, IETF Token
 *     Status List, custom). Caller decides whether to honour or
 *     reject.
 */
export type StatusCheckOutcome = 'active' | 'revoked' | 'suspended' | 'no_status' | 'unsupported_status_type';
export interface StatusCheckResult {
    outcome: StatusCheckOutcome;
    /**
     * The `statusPurpose` that produced the outcome — e.g.,
     * `'revocation'` for a `revoked` outcome. Useful for
     * surfacing "credential revoked because reason X" in UIs
     * when the credential carries multiple status entries with
     * different purposes (the spec allows arrays).
     */
    purpose?: string;
    /**
     * URL of the status list credential that was checked. Echoed
     * for logging / audit trails.
     */
    listUrl?: string;
    /**
     * Bit index that was read. Matches the credential's
     * `credentialStatus.statusListIndex`.
     */
    listIndex?: number;
    /**
     * Free-form diagnostic detail when the outcome is
     * `unsupported_status_type` or when the list type itself is
     * unfamiliar. Always populated when the outcome isn't a clean
     * active/revoked/suspended.
     */
    detail?: string;
}
/**
 * A loose VC shape — only the fields this module actually reads.
 * Full validation lives in `@learncard/types`'s `VCValidator`; we
 * stay loose here so callers can pass partially-typed credentials
 * (e.g., parsed-but-not-validated wire payloads) without an extra
 * narrowing step.
 */
export interface CredentialWithStatus {
    credentialStatus?: CredentialStatusEntry | CredentialStatusEntry[];
    [extra: string]: unknown;
}
export interface CredentialStatusEntry {
    type: string;
    id?: string;
    statusPurpose?: string;
    statusListIndex?: string | number;
    statusListCredential?: string;
    statusSize?: number;
    [extra: string]: unknown;
}
export interface CheckCredentialStatusOptions {
    /**
     * Override fetch — defaults to `globalThis.fetch`. Required when
     * status lists need to be fetched over the network. Tests inject
     * a stub that returns a hand-crafted Status List Credential.
     */
    fetchImpl?: typeof fetch;
    /**
     * Caller-supplied lookup that bypasses the network entirely.
     * When provided, the module skips the `fetchImpl` path and
     * delegates list resolution. Useful for wallets that cache
     * status lists locally, host apps that proxy fetches through
     * a trust layer, or tests that want to drive a known list
     * shape without HTTP mocking.
     */
    fetchStatusList?: (url: string) => Promise<StatusListCredential>;
    /**
     * When true (default), the function treats any
     * `credentialStatus` entry whose `type` we don't recognise as
     * `unsupported_status_type` and short-circuits. When false,
     * we instead try every known type until one matches; useful
     * for credentials that carry both a legacy and modern entry.
     */
    strictType?: boolean;
}
/**
 * Minimal shape we expect from a Status List Credential. We DO NOT
 * cryptographically verify the credential here — that's a separate
 * concern (and a separate plugin), and the relevant trust check
 * (does the list issuer match the credential issuer's policy?) is
 * a wallet decision, not a status-decoder decision.
 */
export interface StatusListCredential {
    credentialSubject?: StatusListCredentialSubject | StatusListCredentialSubject[];
    [extra: string]: unknown;
}
export interface StatusListCredentialSubject {
    type?: string;
    statusPurpose?: string;
    encodedList?: string;
    [extra: string]: unknown;
}
export type StatusCheckErrorCode = 'invalid_status_entry' | 'invalid_status_list' | 'list_fetch_failed' | 'index_out_of_range' | 'no_fetch';
export declare class StatusCheckError extends Error {
    readonly code: StatusCheckErrorCode;
    readonly listUrl?: string;
    constructor(code: StatusCheckErrorCode, message: string, extra?: {
        cause?: unknown;
        listUrl?: string;
    });
}
/**
 * Check a credential's status against its declared Status List
 * Credential. Returns an outcome describing whether the credential
 * is active, revoked, suspended, etc.; throws `StatusCheckError`
 * for transport / encoding failures the caller should surface
 * rather than treat as "active by default".
 */
export declare const checkCredentialStatus: (credential: CredentialWithStatus, options?: CheckCredentialStatusOptions) => Promise<StatusCheckResult>;
//# sourceMappingURL=status.d.ts.map