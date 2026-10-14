// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPublicKeyAsync, verifyAsync } from '@noble/ed25519';
import { createSSSStrategy, type SSSStorageFunctions } from './sss-strategy';
import { verifyEnclaveAttestation } from './escrow-attestation';
import {
    encryptEscrowBlob,
    decryptEscrowBlob,
    generateEscrowKeyPair,
    parseEscrowEnvelope,
} from './escrow-crypto';
import type { EscrowEnvelope } from './escrow-crypto';
import { encodeEscrowEnrollmentIntent, getEscrowBlobIdentity } from './escrow-enrollment-intent';
import { splitPrivateKey } from './sss';
import type {
    EscrowAuthorityRecord,
    EscrowAuthorityState,
    VerifiedEnclaveIdentity,
} from './escrow-authority.types';
import type { SignedEscrowEnrollmentIntent } from './escrow-enrollment-intent.types';
import owner from './__fixtures__/escrow-enrollment-intent-v1.json';

vi.mock('./escrow-attestation', () => ({ verifyEnclaveAttestation: vi.fn() }));
const order = BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551');
const digest = async (input: Uint8Array): Promise<number[]> =>
    Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(input))));
const frame = (value: Buffer): Buffer => {
    const size = Buffer.alloc(4);
    size.writeUInt32BE(value.length);
    return Buffer.concat([size, value]);
};
const response = (value: unknown): Response => new Response(JSON.stringify(value), { status: 200 });

const setup = async (legacyEnrolled = false) => {
    const keys = await generateEscrowKeyPair();
    const ledger = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
        'sign',
        'verify',
    ]);
    const identity: VerifiedEnclaveIdentity = {
        publicKey: keys.publicKey,
        keyId: 'enclave',
        previousKeyIds: [],
        mode: 'nitro',
        authority: {
            ledgerPublicKey: Buffer.from(
                await crypto.subtle.exportKey('raw', ledger.publicKey)
            ).toString('base64'),
            measurement: '01'.repeat(32),
        },
    };
    vi.mocked(verifyEnclaveAttestation).mockResolvedValue(identity);
    const sign = async (
        kind: 'snapshot' | 'commit',
        value: unknown
    ): Promise<EscrowAuthorityRecord> => {
        const payload = Buffer.from(JSON.stringify(value));
        const message = Buffer.concat([
            Buffer.from('learncard-authority-signed-record-v1\0'),
            Buffer.from([kind === 'snapshot' ? 2 : 1]),
            frame(Buffer.from(identity.keyId)),
            Buffer.alloc(32, 1),
            frame(payload),
        ]);
        const sig = Buffer.from(
            await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, ledger.privateKey, message)
        );
        const s = BigInt(`0x${sig.subarray(32).toString('hex')}`);
        if (s > order / 2n)
            Buffer.from((order - s).toString(16).padStart(64, '0'), 'hex').copy(sig, 32);
        return {
            version: 1,
            kind,
            keyId: identity.keyId,
            measurement: Array.from({ length: 32 }, () => 1),
            payload: payload.toString('base64'),
            signature: sig.toString('base64'),
        };
    };
    let state: EscrowAuthorityState = {
        tenant: 'learncard',
        authorityGeneration: 'fresh-g2',
        did: owner.intent.did,
        enrollmentVersion: 0,
        enrollmentEpoch: 0,
        status: 'empty',
        envelope: null,
        shareVersion: null,
        hasPin: false,
        pinGeneration: 0,
        attemptsUsed: 0,
    };
    let version = 1;
    let authShare = (await splitPrivateKey(owner.seedHex)).authShare;
    let enrolled = legacyEnrolled;
    let device: string | null = null;
    let localVersion: number | null = null;
    const storage: SSSStorageFunctions = {
        getDeviceShare: async () => device,
        hasDeviceShare: async () => device !== null,
        storeDeviceShare: async share => {
            device = share;
        },
        clearAllShares: async () => {
            device = null;
            localVersion = null;
        },
        deleteDeviceShare: async () => {
            device = null;
            localVersion = null;
        },
        getShareVersion: async () => localVersion,
        storeShareVersion: async v => {
            localVersion = v;
        },
    };
    const calls: string[] = [];
    const nonces: string[] = [];
    const intents: SignedEscrowEnrollmentIntent[] = [];
    const faults: {
        snapshotNonce?: boolean;
        returnedEnvelope?: boolean;
        beforeSnapshot?: () => Promise<void>;
    } = {};
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, init?: RequestInit) => {
            const path = new URL(url).pathname;
            calls.push(`${init?.method}:${path}`);
            const body: Record<string, unknown> = JSON.parse(String(init?.body ?? '{}'));
            if (path === '/keys/challenge') return response({ challenge: crypto.randomUUID() });
            if (path === '/keys/auth-share') {
                if (init?.method === 'PUT') {
                    authShare = (body.authShare as { encryptedData: string }).encryptedData;
                    version++;
                    enrolled = false;
                    return response({ shareVersion: version, expectedShareVersionChecked: true });
                }
                return response({
                    primaryDid: owner.intent.did,
                    shareVersion: version,
                    authShare: { encryptedData: authShare, encryptedDek: '', iv: '' },
                    recoveryMethods: enrolled
                        ? [
                              {
                                  type: 'escrow',
                                  shareVersion: version,
                                  confirmedAt: new Date().toISOString(),
                              },
                          ]
                        : [],
                });
            }
            if (path === '/keys/escrow/attestation') return response({ attestation: {} });
            if (path === '/keys/escrow/authority-state') {
                const nonce = String(body.nonce);
                nonces.push(nonce);
                await faults.beforeSnapshot?.();
                return response({
                    state,
                    proof: await sign('snapshot', [
                        faults.snapshotNonce ? '00'.repeat(32) : nonce,
                        state,
                    ]),
                });
            }
            if (path === '/keys/escrow' || path === '/keys/escrow/disable') {
                expect(init?.method).toBe('POST');
                const signed = body.signedIntent as SignedEscrowEnrollmentIntent;
                expect(
                    await verifyAsync(
                        Buffer.from(signed.signature, 'base64'),
                        encodeEscrowEnrollmentIntent(signed.intent),
                        await getPublicKeyAsync(owner.seedHex),
                        { zip215: false }
                    )
                ).toBe(true);
                expect(signed.intent.expectedEnrollmentVersion).toBe(state.enrollmentVersion);
                intents.push(signed);
                let output: EscrowEnvelope | null = null;
                if (path === '/keys/escrow') {
                    const plaintext = await decryptEscrowBlob(
                        parseEscrowEnvelope(body.envelope),
                        keys.privateKey
                    );
                    if (signed.intent.action === 'carry')
                        plaintext.pinVerifier = (
                            await decryptEscrowBlob(state.envelope!, keys.privateKey)
                        ).pinVerifier;
                    output = await encryptEscrowBlob(plaintext, keys.publicKey, identity.keyId);
                }
                const pinChange = signed.intent.pinAction !== 'keep';
                state = {
                    ...state,
                    enrollmentVersion: state.enrollmentVersion + 1,
                    enrollmentEpoch: signed.intent.enrollmentEpoch,
                    status: output ? 'active' : 'disabled',
                    envelope: output,
                    shareVersion: output ? version : null,
                    hasPin: pinChange ? signed.intent.pinAction !== 'clear' : state.hasPin,
                    pinGeneration: state.pinGeneration + Number(pinChange),
                    attemptsUsed: pinChange ? 0 : state.attemptsUsed,
                };
                enrolled = !!output;
                const receipt = await sign('commit', {
                    commit: {
                        schemaVersion: 1,
                        binding: {
                            tenant: state.tenant,
                            generation: state.authorityGeneration,
                            didHash: await digest(Buffer.from(state.did)),
                        },
                        executionId: Array.from({ length: 16 }, () => 1),
                        revisions: {
                            operation: state.enrollmentVersion,
                            enrollment: state.enrollmentVersion,
                        },
                        transactionDigest: Array.from({ length: 32 }, () => 2),
                    },
                    eventHash: Array.from({ length: 32 }, () => 3),
                    requestDigest: await digest(encodeEscrowEnrollmentIntent(signed.intent)),
                    resultBlobIdentity: output
                        ? Array.from(Buffer.from(await getEscrowBlobIdentity(output), 'hex'))
                        : null,
                    enrollmentEpoch: state.enrollmentEpoch,
                });
                return response({
                    success: true,
                    shareVersion: version,
                    envelope: faults.returnedEnvelope ? body.envelope : output,
                    receipt,
                });
            }
            if (path === '/keys/escrow/recover')
                return response({
                    holdId: 'hold',
                    resumeToken: 'resume',
                    status: 'pending',
                    requestedAt: new Date().toISOString(),
                    releaseAfter: new Date(Date.now() + 604800000).toISOString(),
                });
            if (path === '/keys/escrow/opt-in') return response({ success: true });
            throw new Error('Unexpected test request');
        })
    );
    const strategy = createSSSStrategy({
        serverUrl: 'https://example.test',
        storage,
        tenantId: 'learncard',
        escrow: {
            enabled: true,
            attestation: {
                mode: 'nitro',
                pinnedMeasurements: [
                    { pcr0: '01'.repeat(48), pcr1: '02'.repeat(48), pcr2: '03'.repeat(48) },
                ],
            },
        },
    });
    const params = {
        token: 'token',
        providerType: 'firebase' as const,
        privateKey: owner.seedHex,
        signDidAuthVp: async () => 'vp',
    };
    return {
        strategy,
        params,
        calls,
        nonces,
        intents,
        faults,
        state: () => state,
        advance: () => {
            version++;
            enrolled = false;
        },
        spend: () => {
            state.attemptsUsed = 4;
        },
    };
};

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});
describe('Nitro owner enrollment flow', () => {
    it('reenrolls disposable staging state despite Mongo claiming enrollment, using fresh nonces and the persisted output', async () => {
        const f = await setup(true);
        await expect(f.strategy.ensureEscrowEnrollment!(f.params)).resolves.toMatchObject({
            enrolled: true,
            changed: true,
        });
        expect(f.intents[0]?.intent).toMatchObject({
            action: 'enroll',
            pinAction: 'keep',
            authorityGeneration: 'fresh-g2',
            expectedEnrollmentVersion: 0,
            enrollmentEpoch: 1,
        });
        expect(f.strategy.getVerifiedEscrowEnvelope!()).toEqual(f.state().envelope);
        const writes = f.calls.filter(c => c === 'PUT:/keys/auth-share').length;
        await expect(f.strategy.ensureEscrowEnrollment!(f.params)).resolves.toEqual({
            enrolled: true,
            changed: false,
        });
        expect(f.calls.filter(c => c === 'PUT:/keys/auth-share')).toHaveLength(writes);
        expect(new Set(f.nonces).size).toBe(f.nonces.length);
        expect(f.nonces.length).toBeGreaterThan(1);
    });
    it('signs PIN set/change/clear, carry and disable without replenishing kept budgets', async () => {
        const f = await setup();
        await f.strategy.setEscrowPin!({ ...f.params, pin: '593827' });
        expect(f.intents.at(-1)?.intent.pinAction).toBe('set');
        f.spend();
        f.advance();
        await f.strategy.ensureEscrowEnrollment!(f.params);
        expect(f.intents.at(-1)?.intent).toMatchObject({ action: 'carry', pinAction: 'keep' });
        expect(f.state().attemptsUsed).toBe(4);
        await f.strategy.setEscrowPin!({ ...f.params, pin: '824957' });
        expect(f.intents.at(-1)?.intent.pinAction).toBe('change');
        await f.strategy.clearEscrowPin!(f.params);
        expect(f.intents.at(-1)?.intent.pinAction).toBe('clear');
        await f.strategy.disableEscrowRecovery!(f.params);
        expect(f.intents.at(-1)?.intent).toMatchObject({
            action: 'disable',
            pinAction: 'keep',
            allowRewrap: false,
        });
        expect(f.calls).toContain('POST:/keys/escrow/disable');
        expect(f.calls.some(c => c.startsWith('DELETE:'))).toBe(false);
        expect(f.strategy.getVerifiedEscrowEnvelope!()).toBeNull();
    });
    it('rejects a stale signed Snapshot before rotating shares or issuing intent', async () => {
        const f = await setup();
        f.faults.snapshotNonce = true;
        await expect(f.strategy.ensureEscrowEnrollment!(f.params)).rejects.toThrow();
        expect(f.calls).not.toContain('PUT:/keys/auth-share');
        expect(f.intents).toHaveLength(0);
    });
    it('refuses Nitro without an attested ledger key rather than downgrading to unsigned enrollment', async () => {
        const f = await setup();
        const verified = vi.mocked(verifyEnclaveAttestation);
        const key = await verified({}, { mode: 'nitro', pinnedMeasurements: [] });
        verified.mockResolvedValue({ ...key, authority: undefined });
        await expect(f.strategy.ensureEscrowEnrollment!(f.params)).rejects.toThrow();
        expect(f.calls).not.toContain('PUT:/keys/auth-share');
        expect(f.intents).toHaveLength(0);
    });
    it('does not automatically resurrect disabled authority even if Mongo loses opt-out, and explicit enable signs the PIN clear', async () => {
        const f = await setup();
        await f.strategy.setEscrowPin!({ ...f.params, pin: '593827' });
        await f.strategy.disableEscrowRecovery!(f.params);
        expect(await f.strategy.ensureEscrowEnrollment!(f.params)).toEqual({
            enrolled: false,
            reason: 'opted-out',
        });
        expect(f.intents).toHaveLength(2);
        await f.strategy.disableEscrowRecovery!(f.params);
        expect(f.intents).toHaveLength(2);
        await f.strategy.enableEscrowRecovery!(f.params);
        expect(f.intents.at(-1)?.intent).toMatchObject({ action: 'enroll', pinAction: 'clear' });
    });
    it('does not retain an unverified output and reconciles from a later verified Snapshot without another write', async () => {
        const f = await setup();
        f.faults.returnedEnvelope = true;
        await expect(f.strategy.ensureEscrowEnrollment!(f.params)).rejects.toThrow();
        expect(f.strategy.getVerifiedEscrowEnvelope!()).toBeNull();
        f.faults.returnedEnvelope = false;
        await expect(f.strategy.ensureEscrowEnrollment!(f.params)).resolves.toEqual({
            enrolled: true,
            changed: false,
        });
        expect(f.strategy.getVerifiedEscrowEnvelope!()).toEqual(f.state().envelope);
        expect(f.intents).toHaveLength(1);
    });
    it('does not request the lost key or signed authority state to start recovery', async () => {
        const f = await setup();
        await f.strategy.startEscrowRecovery!({
            token: f.params.token,
            providerType: f.params.providerType,
        });
        expect(f.nonces).toHaveLength(0);
        expect(f.intents).toHaveLength(0);
        expect(f.calls).toContain('POST:/keys/escrow/recover');
    });
    it('aborts before mutation when the device is forgotten during state verification', async () => {
        const f = await setup();
        let entered!: () => void;
        let resume!: () => void;
        const started = new Promise<void>(resolve => {
            entered = resolve;
        });
        const paused = new Promise<void>(resolve => {
            resume = resolve;
        });
        f.faults.beforeSnapshot = async () => {
            entered();
            await paused;
        };
        const pending = f.strategy.ensureEscrowEnrollment!(f.params);
        await started;
        await f.strategy.clearLocalKeys();
        resume();
        await expect(pending).rejects.toThrow('cancelled');
        expect(f.calls).not.toContain('PUT:/keys/auth-share');
        expect(f.intents).toHaveLength(0);
    });
});
