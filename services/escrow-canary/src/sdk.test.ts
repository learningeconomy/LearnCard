import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSdk } from './sdk';
import { verifyEnclaveAttestation, verifyEscrowAuthorityState } from '@learncard/sss-key-manager';
import type { Config } from './config';
import type { AccountSecret } from './secrets';
import { readFile } from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';

vi.mock('node:fs/promises', () => ({ readFile: vi.fn(async () => Buffer.from('wasm')) }));
vi.mock('@learncard/init', () => ({ initLearnCard: vi.fn() }));
vi.mock('@learncard/sss-key-manager', async importOriginal => ({
    ...(await importOriginal<typeof import('@learncard/sss-key-manager')>()),
    verifyEnclaveAttestation: vi.fn(),
    verifyEscrowAuthorityState: vi.fn(),
    createSSSStrategy: () => ({ getFreshDidAuthVp: async () => 'fresh-challenged-proof' }),
}));
const config: Config = {
    environment: 'staging',
    serverUrl: 'https://api.example.invalid/api',
    tenantId: 'test',
    firebaseApiKey: 'test',
    keyId: 'expected',
    authorityGeneration: 'generation',
    measurements: [{ pcr0: 'a'.repeat(96), pcr1: 'b'.repeat(96), pcr2: 'c'.repeat(96) }],
    accounts: [
        { id: 'a', secretArn: 'a' },
        { id: 'b', secretArn: 'b' },
        { id: 'c', secretArn: 'c' },
    ],
};
const identity = {
    mode: 'nitro' as const,
    keyId: 'expected',
    publicKey: 'key',
    previousKeyIds: [],
    authority: { ledgerPublicKey: 'ledger', measurement: 'measurement' },
};
afterEach(() => vi.clearAllMocks());

describe('SDK HTTP adapter', () => {
    it('lazily shares one WASM read across concurrent calls and SDK instances without caching identities', async () => {
        const did = vi.fn(() => 'did:key:test');
        const getDidAuthVp = vi.fn(async () => 'signed-proof');
        vi.mocked(initLearnCard).mockResolvedValue({
            id: { did },
            invoke: { getDidAuthVp },
        } as unknown as Awaited<ReturnType<typeof initLearnCard>>);
        const sdk = createSdk(config);
        expect(readFile).not.toHaveBeenCalled();
        expect(
            await Promise.all([
                sdk.did('seed-a'),
                sdk.sign('seed-b', 'challenge'),
                createSdk(config).did('seed-c'),
            ])
        ).toEqual(['did:key:test', 'signed-proof', 'did:key:test']);
        expect(readFile).toHaveBeenCalledOnce();
        expect(vi.mocked(initLearnCard).mock.calls).toEqual([
            [{ seed: 'seed-a', didkit: Buffer.from('wasm') }],
            [{ seed: 'seed-b', didkit: Buffer.from('wasm') }],
            [{ seed: 'seed-c', didkit: Buffer.from('wasm') }],
        ]);
        expect(getDidAuthVp).toHaveBeenCalledWith({ proofFormat: 'jwt', challenge: 'challenge' });
    });
    it('passes a fresh nonce, whole PCR tuples and the AWS-default policy to the real SDK boundary', async () => {
        vi.mocked(verifyEnclaveAttestation).mockResolvedValue(identity);
        const transport = vi.fn<typeof fetch>(async () =>
            Response.json({ attestation: { document: 'opaque' } })
        );
        const sdk = createSdk(config, transport);
        await sdk.attest();
        await sdk.attest();
        const [document, policy, nonce] = vi.mocked(verifyEnclaveAttestation).mock.calls[0];
        expect(document).toEqual({ document: 'opaque' });
        expect(policy).toEqual({ mode: 'nitro', pinnedMeasurements: config.measurements });
        expect(nonce).toHaveLength(32);
        expect(
            String(transport.mock.calls[0][0]).endsWith(
                `nonce=${Buffer.from(nonce!).toString('hex')}`
            )
        ).toBe(true);
        expect(transport.mock.calls[0][0]).not.toBe(transport.mock.calls[1][0]);
        expect(transport.mock.calls[0][1]?.headers).toMatchObject({ 'X-Tenant-Id': 'test' });
    });
    it.each(['nonce', 'pcr'])('propagates SDK %s refusal', async reason => {
        vi.mocked(verifyEnclaveAttestation).mockRejectedValue({ reason });
        await expect(
            createSdk(config, async () => Response.json({ attestation: {} })).attest()
        ).rejects.toEqual({ reason });
    });
    it('rejects a verified but unconfigured key ID', async () => {
        vi.mocked(verifyEnclaveAttestation).mockResolvedValue({ ...identity, keyId: 'other' });
        await expect(
            createSdk(config, async () => Response.json({ attestation: {} })).attest()
        ).rejects.toThrow('Unexpected enclave identity');
    });
    it('uses the real authority route and pins generation after SDK signature/nonce/DID verification', async () => {
        const transport = vi.fn<typeof fetch>(async () =>
            Response.json({ state: {}, proof: 'opaque' })
        );
        vi.mocked(verifyEscrowAuthorityState).mockResolvedValue({
            tenant: 'test',
            did: 'did:key:test',
            authorityGeneration: 'wrong',
            enrollmentVersion: 1,
            enrollmentEpoch: 1,
            status: 'active',
            envelope: null,
            shareVersion: 1,
            hasPin: true,
            pinGeneration: 1,
            attemptsUsed: 0,
        });
        const account: AccountSecret = {
            accountId: 'test',
            privateKey: 'a'.repeat(64),
            did: 'did:key:test',
            pin: '738195',
            refreshToken: 'refresh',
            recoveryEmail: 'test@example.invalid',
            recoveryLanguage: 'en',
            deviceState: { shares: {}, versions: {} },
        };
        await expect(
            createSdk(config, transport).authority(account, 'id-token', identity)
        ).rejects.toThrow('Unexpected authority state');
        expect(transport.mock.calls[0][0]).toBe(`${config.serverUrl}/keys/escrow/authority-state`);
        expect(transport.mock.calls[0][1]?.headers).toMatchObject({
            Authorization: 'Bearer fresh-challenged-proof',
        });
        expect(verifyEscrowAuthorityState).toHaveBeenCalledWith(
            { state: {}, proof: 'opaque' },
            expect.stringMatching(/^[a-f0-9]{64}$/),
            'test',
            'did:key:test',
            identity
        );
    });
});
