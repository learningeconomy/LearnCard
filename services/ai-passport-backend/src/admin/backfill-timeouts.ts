// Managed credential backfills only. Ordinary callers retain their existing deadlines.
export const LEGACY_UNIT_TIMEOUT_MS = 120_000;
export const MANAGED_UNIT_TIMEOUT_MS = 360_000;
export const MANAGED_GENERATION_TIMEOUT_MS = 240_000;
export const MANAGED_FINALIZATION_RESERVE_MS = 60_000;
export const MANAGED_LEASE_MARGIN_MS = 30_000;

export function managedGenerationOptions(
    signal: AbortSignal,
    unitDeadline: number,
    now = Date.now()
) {
    const remaining = unitDeadline - now - MANAGED_FINALIZATION_RESERVE_MS;
    if (remaining <= 0)
        throw new DOMException('Managed generation stage deadline elapsed', 'TimeoutError');
    return {
        signal: AbortSignal.any([signal, AbortSignal.timeout(remaining)]),
        timeoutMs: MANAGED_GENERATION_TIMEOUT_MS,
    };
}
