import { readFile } from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';
import {
    createSSSStrategy,
    verifyEnclaveAttestation,
    verifyEscrowAuthorityState,
    type VerifiedEnclaveIdentity,
    type EscrowAuthorityState,
    type SSSStorageFunctions,
} from '@learncard/sss-key-manager';
import type { Config } from './config';
import type { AccountSecret } from './secrets';
import { memoryStorage } from './storage';

export interface Sdk {
    attest(): Promise<VerifiedEnclaveIdentity>;
    authority(
        account: AccountSecret,
        token: string,
        identity: VerifiedEnclaveIdentity
    ): Promise<EscrowAuthorityState>;
    did(privateKey: string): Promise<string>;
    strategy(storage: SSSStorageFunctions): ReturnType<typeof createSSSStrategy>;
    sign(privateKey: string, challenge?: string): Promise<string>;
}

// Lazy and shared across SDK instances in a warm Lambda; no unhandled startup rejection.
let wasmBuffer: Promise<Buffer> | undefined;
const loadWasm = () => (wasmBuffer ??= readFile(new URL('./didkit.wasm', import.meta.url)));

/** Error carrying an allowlisted metric reason; never carries server or secret text. */
export class CanaryStepError extends Error {
    readonly reason: string;
    readonly causeName?: string;
    constructor(reason: string, cause?: unknown) {
        super(reason);
        this.name = 'CanaryStepError';
        this.reason = reason;
        if (cause instanceof Error) this.causeName = cause.constructor.name;
    }
}

export const createSdk = (config: Config, transport: typeof fetch = fetch): Sdk => {
    const policy = { mode: 'nitro' as const, pinnedMeasurements: config.measurements };
    const headers = { 'Content-Type': 'application/json', 'X-Tenant-Id': config.tenantId };
    const request = async (path: string, init: RequestInit): Promise<unknown> => {
        let response: Response;
        try {
            response = await transport(`${config.serverUrl}${path}`, {
                ...init,
                signal: AbortSignal.timeout(30_000),
                redirect: 'error',
            });
        } catch {
            throw new CanaryStepError('transport');
        }
        if (response.status === 429) throw new CanaryStepError('rate_limit');
        if (response.status >= 500) throw new CanaryStepError('unavailable');
        if (!response.ok) throw new CanaryStepError('http_refusal');
        try {
            return await response.json();
        } catch {
            throw new CanaryStepError('malformed');
        }
    };
    // WASM is packaged locally; no CDN or architecture-specific native addon.
    const wallet = async (seed: string) => initLearnCard({ seed, didkit: await loadWasm() });
    const sign: Sdk['sign'] = async (key, challenge) => {
        const vp = await (await wallet(key)).invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });
        if (typeof vp !== 'string') throw new Error('DID proof signing failed');
        return vp;
    };
    return {
        sign,
        did: async key => (await wallet(key)).id.did(),
        strategy: storage =>
            createSSSStrategy({
                serverUrl: config.serverUrl,
                tenantId: config.tenantId,
                storage,
                enableEmailBackupShare: false,
                escrow: { enabled: true, attestation: policy },
                onEscrowError: () => undefined,
            }),
        async attest() {
            const nonce = crypto.getRandomValues(new Uint8Array(32));
            const response = await request(
                `/keys/escrow/attestation?nonce=${Buffer.from(nonce).toString('hex')}`,
                { method: 'GET', headers }
            );
            if (!response || typeof response !== 'object' || !('attestation' in response))
                throw new CanaryStepError('invalid_response');
            let identity: Awaited<ReturnType<typeof verifyEnclaveAttestation>>;
            try {
                identity = await verifyEnclaveAttestation(response.attestation, policy, nonce);
            } catch (error) {
                // SDK refusals already carry an allowlisted reason (nonce, pcr, ...).
                if (error && typeof error === 'object' && 'reason' in error) throw error;
                throw new CanaryStepError('verify', error);
            }
            if (identity.keyId !== config.keyId || !identity.authority)
                throw new CanaryStepError('policy');
            return identity;
        },
        async authority(account, token, identity) {
            const strategy = createSSSStrategy({
                serverUrl: config.serverUrl,
                tenantId: config.tenantId,
                storage: memoryStorage().storage,
            });
            const vp = await strategy.getFreshDidAuthVp!(account.privateKey, account.did, sign);
            const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex');
            const response = await request('/keys/escrow/authority-state', {
                method: 'POST',
                headers: { ...headers, Authorization: `Bearer ${vp}` },
                body: JSON.stringify({ authToken: token, providerType: 'firebase', nonce }),
            });
            const state = await verifyEscrowAuthorityState(
                response,
                nonce,
                config.tenantId,
                account.did,
                identity
            );
            if (
                state.authorityGeneration !== config.authorityGeneration ||
                state.status !== 'active'
            )
                throw new Error('Unexpected authority state');
            return state;
        },
    };
};
