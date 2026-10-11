/**
 * Staged rollout gating for AUTOMATIC escrow recovery enrollment.
 *
 * `features.escrowRolloutPercent` / `features.escrowRolloutAllowlist` (see
 * `tenantConfigSchema.ts`) narrow WHO gets automatically enrolled in escrow
 * recovery by `AuthCoordinator.refreshEscrow` — they do NOT gate whether
 * escrow exists for the tenant at all (`auth.sss.escrowEnclaveMode` does
 * that) and never affect users who are already enrolled or who explicitly
 * opt in via `enableEscrowRecovery()`.
 *
 * Bucketing is deterministic per (tenant, user) via SHA-256, so the same
 * user always lands in the same bucket for a given tenant/percentage, and
 * bucketing is independent across tenants. The allowlist is a separate,
 * tenant-agnostic override keyed by SHA-256(stableUserId) alone (no tenant
 * prefix), so one hash can be computed for an internal tester and reused
 * across every tenant config they need access to — see the rollout runbook
 * at `services/escrow-enclave-app/ROLLOUT.md` for the exact command.
 *
 * The stable identifier is expected to be the user's primary DID (available
 * on `AuthCoordinator`'s `ready` state after key derivation) — never a raw
 * email or other PII. Neither the identifier nor its hash is ever logged by
 * this module.
 */

import { getAuthConfig } from './authConfig';

const textEncoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer): string =>
    Array.from(new Uint8Array(buffer))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');

const sha256Hex = async (input: string): Promise<string> =>
    toHex(await crypto.subtle.digest('SHA-256', textEncoder.encode(input)));

export interface EscrowRolloutInput {
    /** Tenant id — makes bucketing independent across tenants. */
    tenantId: string | undefined;
    /** Stable per-user identifier (the primary DID). Never logged. */
    userKey: string;
    /** Override the tenant's configured percent. Defaults to `features.escrowRolloutPercent`. */
    percent?: number;
    /** Override the tenant's configured allowlist. Defaults to `features.escrowRolloutAllowlist`. */
    allowlist?: readonly string[];
}

/**
 * Deterministically decide whether `userKey` falls inside the tenant's escrow
 * auto-enrollment rollout: a SHA-256 hash of the stable id in the allowlist
 * always matches, otherwise the tenant-scoped bucket must be under `percent`.
 */
export const isEscrowRolloutEnabledFor = async ({
    tenantId,
    userKey,
    percent,
    allowlist,
}: EscrowRolloutInput): Promise<boolean> => {
    const authConfig = getAuthConfig();
    const resolvedPercent = percent ?? authConfig.escrowRolloutPercent ?? 0;
    const resolvedAllowlist = (allowlist ?? authConfig.escrowRolloutAllowlist ?? []).map(hash =>
        hash.toLowerCase()
    );

    const allowlistHash = await sha256Hex(userKey);
    if (resolvedAllowlist.includes(allowlistHash)) return true;

    if (resolvedPercent <= 0) return false;
    if (resolvedPercent >= 100) return true;

    const bucketHash = await sha256Hex(`${tenantId ?? ''}:${userKey}`);
    const bucket = Number.parseInt(bucketHash.slice(0, 8), 16) % 100;

    return bucket < resolvedPercent;
};
