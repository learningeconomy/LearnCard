import {
    environment,
    parseLcaApiEnvironment,
    parseEscrowPrivateKeys,
    type LcaApiEnvironment,
} from '@environment';
import type { EscrowBlobStaleReason } from '@learncard/types';
import { SoftwareEnclave } from './softwareEnclave';
import { createRemoteEnclave } from './remoteEnclave';
import { EscrowUnavailableError, type EscrowEnclave } from './types';

export * from './types';
export * from './softwareEnclave';
export * from './remoteEnclave';
export * from './notifications';

let enclave: EscrowEnclave | undefined;
let config: LcaApiEnvironment = environment;

// 'software' config validity is enforced at environment-parse time (see
// config/environment.ts), so reaching that branch always means it's ready.
// 'remote' config (URL/token) is deliberately NOT required at parse time, so
// its readiness is checked here instead; missing it fails this closed rather
// than crashing the whole service at boot.
export const isEscrowEnabled = (): boolean => {
    if (config.ESCROW_ENCLAVE_MODE === 'software') return true;
    if (config.ESCROW_ENCLAVE_MODE === 'remote') {
        return Boolean(config.ESCROW_ENCLAVE_REMOTE_URL && config.ESCROW_ENCLAVE_REMOTE_TOKEN);
    }
    return false;
};
export const isEscrowRemoteMode = (): boolean => config.ESCROW_ENCLAVE_MODE === 'remote';
// The client-facing attestation mode implied by the server's active backend
// ('remote' mode always attests as 'nitro' — see remoteEnclave.ts).
export const activeEscrowClientMode = (): 'software' | 'nitro' =>
    isEscrowRemoteMode() ? 'nitro' : 'software';
export const getEscrowHoldDurationMs = (): number => config.ESCROW_HOLD_DURATION_MS;
export const getEscrowHoldRestartMinAgeMs = (): number => config.ESCROW_HOLD_RESTART_MIN_AGE_MS;
export const getEscrowEnclave = (): EscrowEnclave => {
    if (!isEscrowEnabled()) throw new EscrowUnavailableError();
    if (enclave) return enclave;
    if (config.ESCROW_ENCLAVE_MODE === 'software') {
        enclave = new SoftwareEnclave({
            privateKeys: parseEscrowPrivateKeys(
                config.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON ?? ''
            ),
            activeKeyId: config.ESCROW_ENCLAVE_ACTIVE_KEY_ID ?? '',
            holdDurationMs: getEscrowHoldDurationMs(),
        });
        return enclave;
    }
    if (config.ESCROW_ENCLAVE_MODE === 'remote') {
        const { ESCROW_ENCLAVE_REMOTE_URL: baseUrl, ESCROW_ENCLAVE_REMOTE_TOKEN: token } = config;
        if (!baseUrl || !token) throw new EscrowUnavailableError();
        enclave = createRemoteEnclave({
            baseUrl,
            token,
            timeoutMs: config.ESCROW_ENCLAVE_REMOTE_TIMEOUT_MS,
        });
        return enclave;
    }
    throw new EscrowUnavailableError();
};

export type { EscrowBlobStaleReason };

interface EscrowAttestationIdentity {
    keyId: string;
    mode: 'software' | 'nitro';
}
interface EscrowAttestationCacheEntry extends EscrowAttestationIdentity {
    fetchedAt: number;
}

// Keeps every login's status check off the enclave's critical path (a remote
// nitro backend can be slow or briefly unreachable; a normal sign-in must
// never wait on it). TTL and budget are process-local constants, not env
// config, since neither is an operator-facing tuning knob.
const ESCROW_ATTESTATION_CACHE_TTL_MS = 5 * 60 * 1000;
const ESCROW_ATTESTATION_STATUS_BUDGET_MS = 250;

let attestationCache: EscrowAttestationCacheEntry | undefined;
let attestationRefreshInFlight: Promise<EscrowAttestationIdentity> | undefined;

const isAttestationCacheFresh = (): boolean =>
    !!attestationCache && Date.now() - attestationCache.fetchedAt < ESCROW_ATTESTATION_CACHE_TTL_MS;

// Single-flight: any number of concurrent cold-cache callers (status checks
// and release-enforcement checks alike) share one underlying getAttestation()
// call and its outcome, so a cache-expiry moment never causes a call fan-out
// to the enclave. Clears the in-flight marker on settle either way so the
// next cold call starts a fresh fetch; only a successful fetch warms the cache.
const refreshAttestationCache = (): Promise<EscrowAttestationIdentity> => {
    attestationRefreshInFlight ??= (async () => {
        try {
            const attestation = await getEscrowEnclave().getAttestation();
            const identity: EscrowAttestationIdentity = {
                keyId: attestation.keyId,
                mode: attestation.mode,
            };
            attestationCache = { ...identity, fetchedAt: Date.now() };
            return identity;
        } finally {
            attestationRefreshInFlight = undefined;
        }
    })();
    return attestationRefreshInFlight;
};

/**
 * Fail-closed identity lookup for release enforcement (startRecovery /
 * completeRecovery): resolves instantly from a warm cache, otherwise awaits a
 * real getAttestation() call (subject to the enclave's own normal timeout,
 * e.g. `ESCROW_ENCLAVE_REMOTE_TIMEOUT_MS`) and lets a failure propagate — a
 * caller here must never treat an unreachable enclave as "fresh".
 */
export const getEnclaveAttestationIdentity = (): Promise<EscrowAttestationIdentity> =>
    isAttestationCacheFresh() ? Promise.resolve(attestationCache!) : refreshAttestationCache();

// Best-effort status check (used for the client's read-only enrollment state
// on every sign-in — see routes/keys.ts's getAuthShare — not for release
// enforcement; see getEnclaveAttestationIdentity above for the fail-closed
// version). Never awaits the enclave directly: a cold/failed cache still
// returns "not stale" within ESCROW_ATTESTATION_STATUS_BUDGET_MS, while a
// background refresh (already in flight, or started here) continues so a
// later call can see a warm cache.
export const getEscrowBlobStaleReason = async (blob: {
    enclaveMode: 'software' | 'nitro';
    enclaveKeyId: string;
}): Promise<EscrowBlobStaleReason | undefined> => {
    if (!isEscrowEnabled()) return undefined;
    if (blob.enclaveMode !== activeEscrowClientMode()) return 'mode-mismatch';
    if (isAttestationCacheFresh()) {
        return blob.enclaveKeyId !== attestationCache!.keyId ? 'key-rotated' : undefined;
    }
    const identity = await Promise.race([
        refreshAttestationCache().catch(() => undefined),
        new Promise<undefined>(resolve => {
            setTimeout(() => resolve(undefined), ESCROW_ATTESTATION_STATUS_BUDGET_MS);
        }),
    ]);
    return identity && blob.enclaveKeyId !== identity.keyId ? 'key-rotated' : undefined;
};

/** Reset both singleton and environment snapshot after test environment changes. */
export const __setEscrowEnclaveForTests = (replacement: EscrowEnclave | undefined): void => {
    if (environment.NODE_ENV !== 'test') throw new EscrowUnavailableError();
    config = parseLcaApiEnvironment(process.env);
    enclave = replacement;
    attestationCache = undefined;
    attestationRefreshInFlight = undefined;
};

/** Invalidate the attestation cache without replacing the enclave singleton
 * (e.g. to force the next freshness check to re-fetch against the same
 * enclave, or to isolate tests from each other's cached state). */
export const __resetEscrowAttestationCacheForTests = (): void => {
    if (environment.NODE_ENV !== 'test') throw new EscrowUnavailableError();
    attestationCache = undefined;
    attestationRefreshInFlight = undefined;
};
