// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPublicKeyAsync, verifyAsync } from '@noble/ed25519';
import {
    createSSSStrategy,
    formatVersionedEmailShare,
    type SSSStorageFunctions,
    type SSSStrategyConfig,
} from './sss-strategy';
import {
    escrowAuthorityMeasurements,
    violatesCarryContactRule,
    type EscrowHoldRecordLike,
} from './escrow-authority';
import type { EscrowRecoveryStart } from './types';
import { EscrowAuthorityTenantMismatchError } from './escrow-authority.types';
import { verifyEnclaveAttestation } from './escrow-attestation';
import {
    encryptEscrowBlob,
    decryptEscrowBlob,
    generateEscrowKeyPair,
    parseEscrowEnvelope,
    sealEscrowRelease,
} from './escrow-crypto';
import type { EscrowEnvelope } from './escrow-crypto';
import { encodeEscrowEnrollmentIntent, getEscrowBlobIdentity } from './escrow-enrollment-intent';
import { splitPrivateKey } from './sss';
import { derivePinProof } from './escrow-pin';
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
// [D] Mirrors `hold_hash` in escrow-enclave-app's policy.rs: SHA-256 of
// compact JSON of this fixed-order array, which the client independently
// recomputes to bind a SignedHoldRecord to its own request.
const holdTupleDigest = async (
    holdRecord: {
        hold: {
            holdId: string;
            did: string;
            shareVersion: number;
            blobHash: string;
            enrollmentEpoch: number;
            releasePolicy: string;
            clientEphemeralPublicKey: string;
            createdLo: number;
            createdHi: number;
            policyVersion: number;
        };
        holdDurationMs: number;
        ledgerSeq: number;
    },
    tenant = 'learncard'
): Promise<number[]> => {
    const h = holdRecord.hold;
    const didHashHex = Buffer.from(await digest(Buffer.from(h.did))).toString('hex');
    return digest(
        Buffer.from(
            JSON.stringify([
                'learncard-hold-v1',
                tenant,
                h.holdId,
                didHashHex,
                h.shareVersion,
                h.blobHash,
                h.enrollmentEpoch,
                h.releasePolicy,
                h.clientEphemeralPublicKey,
                h.createdLo,
                h.createdHi,
                holdRecord.holdDurationMs,
                h.policyVersion,
                holdRecord.ledgerSeq,
            ])
        )
    );
};
const frame = (value: Buffer): Buffer => {
    const size = Buffer.alloc(4);
    size.writeUInt32BE(value.length);
    return Buffer.concat([size, value]);
};
const response = (value: unknown, status = 200): Response =>
    new Response(JSON.stringify(value), { status });

/**
 * `enclaveTenant` is the fake enclave's measured authority label (what it signs);
 * `appTenant` is the client's X-Tenant-Id; `authorityTenant` is the client's configured
 * `escrow.authorityTenant` (omitted = default to the app tenant).
 */
const setup = async (
    legacyEnrolled = false,
    tenants: {
        appTenant?: string;
        authorityTenant?: string;
        enclaveTenant?: string;
        /** D21: the client's `escrow.emailBrand`. */
        emailBrand?: string;
    } = {}
) => {
    const {
        appTenant = 'learncard',
        authorityTenant,
        enclaveTenant = 'learncard',
        emailBrand,
    } = tenants;
    const pins = [
        { pcr0: '01'.repeat(48), pcr1: '02'.repeat(48), pcr2: '03'.repeat(48) },
        { pcr0: '04'.repeat(48), pcr1: '02'.repeat(48), pcr2: '03'.repeat(48) },
    ];
    const measurements = await escrowAuthorityMeasurements({
        mode: 'nitro',
        pinnedMeasurements: pins,
    });
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
            measurement: measurements[0]!,
        },
    };
    vi.mocked(verifyEnclaveAttestation).mockResolvedValue(identity);
    const sign = async (
        kind: 'snapshot' | 'commit',
        value: unknown,
        measurement = identity.authority!.measurement
    ): Promise<EscrowAuthorityRecord> => {
        const payload = Buffer.from(JSON.stringify(value));
        const message = Buffer.concat([
            Buffer.from('learncard-authority-signed-record-v1\0'),
            Buffer.from([kind === 'snapshot' ? 2 : 1]),
            frame(Buffer.from(identity.keyId)),
            Buffer.from(measurement, 'hex'),
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
            measurement: Array.from(Buffer.from(measurement, 'hex')),
            payload: payload.toString('base64'),
            signature: sig.toString('base64'),
        };
    };
    let state: EscrowAuthorityState = {
        tenant: enclaveTenant,
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
    // lca-api's charged PIN budget: like the server, every PIN release is charged.
    let releaseCharges = 0;
    const recoveryShares = await splitPrivateKey(owner.seedHex);
    let authShare = recoveryShares.authShare;
    let pendingHold: EscrowHoldRecordLike | undefined;
    let confirmed = false;
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
    /** Every X-Tenant-Id the client sent (must always be the app tenant). */
    const tenantHeaders = new Set<string | undefined>();
    const nonces: string[] = [];
    const intents: SignedEscrowEnrollmentIntent[] = [];
    const enrollments: Array<{
        pinSalt?: unknown;
        clearPin?: unknown;
        pinVerifier?: string;
        action?: string;
        /** D21: the target blob plaintext exactly as the client sealed it. */
        recoveryEmail?: string;
        recoveryBrand?: string;
    }> = [];
    const faults: {
        snapshotNonce?: boolean;
        returnedEnvelope?: boolean;
        beforeSnapshot?: () => Promise<void>;
        startHold?: Partial<EscrowHoldRecordLike['hold']>;
        statusHold?: Partial<EscrowHoldRecordLike['hold']>;
        confirmationHold?: Partial<EscrowHoldRecordLike['hold']>;
        freshMeasurement?: string;
        generation?: string;
        confirmationGeneration?: string;
        snapshotOnly?: boolean;
        legacySnapshot?: boolean;
        releaseDid?: string;
        failEnrollment?: boolean;
        missingPinMetadata?: boolean;
        /** Server predating `priorEscrowEnrollment` on /keys/auth-share. */
        oldServer?: boolean;
        /** A compromised lca-api forging post-rebind status for a healthy account. */
        forgedRebindStatus?: boolean;
        /** lca-api's verified wrong-entry count for the current PIN, when reported. */
        wrongPinAttempts?: number;
        /**
         * lca-api's escrow copy identity on /keys/auth-share: 'authority' reports the
         * authority's current copy; a string is a stale copy (a lost PIN-operation write).
         */
        serverBlobIdentity?: 'authority' | string;
        /** lca-api reports a PIN operation holding its lease (`escrowUpdating`). */
        serverUpdating?: boolean;
        /** lca-api refuses the next PIN change (e.g. a concurrent compare): 409. */
        refusePinChange?: boolean;
    } = {};
    const signHold = async (record: EscrowHoldRecordLike): Promise<EscrowHoldRecordLike> => {
        const h = record.hold;
        const receipt = await sign('commit', {
            commit: {
                schemaVersion: 1,
                binding: {
                    tenant: enclaveTenant,
                    generation: faults.generation ?? state.authorityGeneration,
                    didHash: await digest(Buffer.from(h.did)),
                },
                executionId: Array.from({ length: 16 }, () => 1),
                revisions: { operation: 1, enrollment: 1 },
                transactionDigest: Array.from({ length: 32 }, () => 2),
            },
            eventHash: Array.from({ length: 32 }, () => 3),
            requestDigest: await holdTupleDigest(record, enclaveTenant),
            resultBlobIdentity: Array.from(Buffer.from(h.blobHash, 'hex')),
            enrollmentEpoch: h.enrollmentEpoch,
        });
        return {
            ...record,
            hold: { ...h, signature: Buffer.from(JSON.stringify(receipt)).toString('base64') },
        };
    };
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, init?: RequestInit) => {
            const path = new URL(url).pathname;
            calls.push(`${init?.method}:${path}`);
            tenantHeaders.add(
                (init?.headers as Record<string, string> | undefined)?.['X-Tenant-Id']
            );
            const body: Record<string, unknown> = JSON.parse(String(init?.body ?? '{}'));
            if (path === '/keys/challenge') return response({ challenge: crypto.randomUUID() });
            if (path === '/keys/auth-share') {
                if (init?.method === 'PUT') {
                    authShare = (body.authShare as { encryptedData: string }).encryptedData;
                    version++;
                    enrolled = false;
                    return response({ shareVersion: version, expectedShareVersionChecked: true });
                }
                if (faults.forgedRebindStatus)
                    return response({
                        primaryDid: owner.intent.did,
                        shareVersion: version + 1,
                        authShare: { encryptedData: authShare, encryptedDek: '', iv: '' },
                        recoveryMethods: [],
                        priorEscrowEnrollment: true,
                        escrowPin: { state: 'none', enabled: false, attemptsRemaining: 0 },
                    });
                return response({
                    primaryDid: owner.intent.did,
                    shareVersion: version,
                    authShare: { encryptedData: authShare, encryptedDek: '', iv: '' },
                    // Mirror lca-api: only confirmed methods are listed; the rebind's
                    // `pending` escrow method surfaces only as priorEscrowEnrollment.
                    recoveryMethods: enrolled
                        ? [
                              {
                                  type: 'escrow',
                                  shareVersion: version,
                                  confirmedAt: new Date().toISOString(),
                              },
                          ]
                        : [],
                    ...(faults.oldServer
                        ? {}
                        : { priorEscrowEnrollment: !enrolled && !!faults.missingPinMetadata }),
                    ...(faults.serverBlobIdentity === undefined
                        ? {}
                        : {
                              escrowBlobIdentity:
                                  faults.serverBlobIdentity === 'authority'
                                      ? state.envelope &&
                                        (await getEscrowBlobIdentity(state.envelope))
                                      : faults.serverBlobIdentity,
                          }),
                    ...(faults.serverUpdating ? { escrowUpdating: true } : {}),
                    ...(faults.missingPinMetadata
                        ? { escrowPin: { state: 'none', enabled: false, attemptsRemaining: 0 } }
                        : faults.wrongPinAttempts !== undefined
                          ? {
                                escrowPin: {
                                    state: 'enabled',
                                    enabled: true,
                                    attemptsRemaining: Math.max(
                                        0,
                                        10 - state.attemptsUsed - releaseCharges
                                    ),
                                    wrongAttempts: faults.wrongPinAttempts,
                                },
                            }
                          : {}),
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
                if (faults.failEnrollment) throw new Error('Temporary enrollment outage');
                if (faults.refusePinChange && signed.intent.pinAction === 'change') {
                    faults.refusePinChange = false;
                    return response(
                        { message: 'Automatic recovery changed; please refresh.' },
                        409
                    );
                }
                // Mirror escrow.enroll: rebind removes Mongo metadata, so carry cannot work.
                if (
                    faults.missingPinMetadata &&
                    state.hasPin &&
                    signed.intent.pinAction === 'keep'
                ) {
                    return response(
                        { message: 'Set or clear your recovery PIN before continuing.' },
                        412
                    );
                }
                expect(!!body.clearPin).toBe(signed.intent.pinAction === 'clear');
                let output: EscrowEnvelope | null = null;
                if (path === '/keys/escrow') {
                    const plaintext = await decryptEscrowBlob(
                        parseEscrowEnvelope(body.envelope),
                        keys.privateKey
                    );
                    enrollments.push({
                        pinSalt: body.pinSalt,
                        clearPin: body.clearPin,
                        pinVerifier: plaintext.pinVerifier,
                        action: signed.intent.action,
                        recoveryEmail: plaintext.recoveryEmail,
                        recoveryBrand: plaintext.recoveryBrand,
                    });
                    // Mirrors the enclave's Carry rule: refuse a target claiming
                    // contact/brand, then inherit them (and the PIN) from the source.
                    if (violatesCarryContactRule(signed.intent.action, plaintext))
                        return response({ message: 'Carry target claims contact' }, 400);
                    if (signed.intent.action === 'carry') {
                        const source = await decryptEscrowBlob(state.envelope!, keys.privateKey);
                        plaintext.pinVerifier = source.pinVerifier;
                        if (source.recoveryEmail) {
                            plaintext.recoveryEmail = source.recoveryEmail;
                            plaintext.recoveryLanguage = source.recoveryLanguage;
                        }
                        if (source.recoveryBrand) plaintext.recoveryBrand = source.recoveryBrand;
                    }
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
                if (pinChange) releaseCharges = 0;
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
            if (path === '/keys/escrow/recover') {
                // [D] A real nitro-mode hold is always an enclave-signed
                // SignedHoldRecord bound to the caller's own recipient key —
                // construct one with the same ledger key `sign()` uses above
                // so startEscrowRecovery's client-side verification passes.
                const holdRecord: EscrowHoldRecordLike = {
                    hold: {
                        holdId: 'hold',
                        did: owner.intent.did,
                        shareVersion: version,
                        blobHash: 'ab'.repeat(32),
                        enrollmentEpoch: 1,
                        releasePolicy: (body.releasePolicy as 'hold' | 'pin' | undefined) ?? 'hold',
                        clientEphemeralPublicKey: String(body.clientEphemeralPublicKey),
                        createdLo: Date.now(),
                        createdHi: Date.now(),
                        policyVersion: 2,
                        signature: '',
                        ...faults.startHold,
                    },
                    holdDurationMs: 604800000,
                    ledgerSeq: 0,
                };
                const h = holdRecord.hold;
                const receipt = await sign('commit', {
                    commit: {
                        schemaVersion: 1,
                        binding: {
                            tenant: enclaveTenant,
                            generation: state.authorityGeneration,
                            didHash: await digest(Buffer.from(h.did)),
                        },
                        executionId: Array.from({ length: 16 }, () => 1),
                        revisions: { operation: 1, enrollment: 1 },
                        transactionDigest: Array.from({ length: 32 }, () => 2),
                    },
                    eventHash: Array.from({ length: 32 }, () => 3),
                    requestDigest: await holdTupleDigest(holdRecord, enclaveTenant),
                    resultBlobIdentity: Array.from(Buffer.from(h.blobHash, 'hex')),
                    enrollmentEpoch: h.enrollmentEpoch,
                });
                holdRecord.hold.signature = Buffer.from(JSON.stringify(receipt)).toString('base64');
                pendingHold = holdRecord;
                return response({
                    holdId: 'hold',
                    resumeToken: 'resume',
                    status: 'pending',
                    requestedAt: new Date().toISOString(),
                    releaseAfter: new Date(Date.now() + 604800000).toISOString(),
                    holdRecord,
                    ...(body.releasePolicy === 'pin'
                        ? { pinSalt: 'AAAAAAAAAAAAAAAAAAAAAA==' }
                        : {}),
                });
            }
            if (path === '/keys/escrow/status') {
                if (!pendingHold) throw new Error('No test hold');
                const holdRecord =
                    faults.statusHold || faults.generation
                        ? await signHold({
                              ...pendingHold,
                              hold: { ...pendingHold.hold, ...faults.statusHold },
                          })
                        : pendingHold;
                return response({
                    hold: {
                        holdId: 'hold',
                        status: 'pending',
                        releasePolicy: 'hold',
                        requestedAt: new Date().toISOString(),
                        releaseAfter: new Date().toISOString(),
                        requiresConfirmation: true,
                        confirmed,
                        holdRecord,
                    },
                });
            }
            if (path === '/keys/escrow/confirm') {
                if (!pendingHold) throw new Error('No test hold');
                const record = {
                    ...pendingHold,
                    hold: { ...pendingHold.hold, ...faults.confirmationHold },
                };
                const h = record.hold;
                if (confirmed || faults.snapshotOnly)
                    return response({
                        success: true,
                        receipt: await sign(
                            'snapshot',
                            [
                                faults.legacySnapshot
                                    ? 'learncard-authority-hold-snapshot-v1'
                                    : 'learncard-authority-hold-snapshot-v2',
                                h.holdId,
                                await holdTupleDigest(record, enclaveTenant),
                                'pending',
                                Date.now(),
                                null,
                                ...(faults.legacySnapshot
                                    ? []
                                    : [faults.confirmationGeneration ?? state.authorityGeneration]),
                            ],
                            faults.freshMeasurement
                        ),
                    });
                confirmed = true;
                return response({
                    success: true,
                    receipt: await sign(
                        'commit',
                        {
                            commit: {
                                schemaVersion: 1,
                                binding: {
                                    tenant: enclaveTenant,
                                    generation:
                                        faults.confirmationGeneration ?? state.authorityGeneration,
                                    didHash: await digest(Buffer.from(h.did)),
                                },
                                executionId: Array.from({ length: 16 }, () => 1),
                                revisions: { operation: 2, enrollment: 1 },
                                transactionDigest: Array.from({ length: 32 }, () => 2),
                            },
                            eventHash: Array.from({ length: 32 }, () => 3),
                            requestDigest: Array.from({ length: 32 }, () => 4),
                            resultBlobIdentity: Array.from(Buffer.from(h.blobHash, 'hex')),
                            enrollmentEpoch: h.enrollmentEpoch,
                        },
                        faults.freshMeasurement
                    ),
                });
            }
            if (path === '/keys/escrow/complete') {
                if (!pendingHold) throw new Error('No test hold');
                if (body.pinProof !== undefined) releaseCharges++;
                return response({
                    sealedShare: await sealEscrowRelease(
                        {
                            did: faults.releaseDid ?? owner.intent.did,
                            holdId: pendingHold.hold.holdId,
                            shareVersion: version,
                            recoveryShare: state.envelope
                                ? (await decryptEscrowBlob(state.envelope, keys.privateKey))
                                      .recoveryShare
                                : recoveryShares.recoveryShare,
                        },
                        pendingHold.hold.clientEphemeralPublicKey
                    ),
                    primaryDid: faults.releaseDid ?? owner.intent.did,
                    shareVersion: version,
                    authShare: { encryptedData: authShare, encryptedDek: '', iv: '' },
                    rebindSessionToken: 'rebind',
                });
            }
            if (path === '/keys/escrow/opt-in') return response({ success: true });
            if (path === '/keys/recovery-session/recover') {
                return response({
                    authShare: { encryptedData: authShare },
                    primaryDid: owner.intent.did,
                    rebindSessionToken: 'rebind-session',
                });
            }
            if (path === '/keys/recovery-session/rebind') {
                enrolled = false;
                faults.missingPinMetadata = true;
                authShare = (body.authShare as { encryptedData: string }).encryptedData;
                return response({
                    shareVersion: ++version,
                    recoveryMethodsRequireConfirmation: [],
                });
            }
            throw new Error('Unexpected test request');
        })
    );
    const config: SSSStrategyConfig = {
        serverUrl: 'https://example.test',
        storage,
        tenantId: appTenant,
        escrow: {
            enabled: true,
            attestation: {
                mode: 'nitro',
                pinnedMeasurements: pins,
            },
            ...(authorityTenant ? { authorityTenant } : {}),
            ...(emailBrand !== undefined ? { emailBrand } : {}),
        },
    };
    const strategy = createSSSStrategy(config);
    const params = {
        token: 'token',
        providerType: 'firebase' as const,
        privateKey: owner.seedHex,
        signDidAuthVp: async () => 'vp',
        // P9.1 (attack C): nitro/authority-mode enroll/replace now requires both.
        options: { recoveryEmail: 'owner@example.com', recoveryLanguage: 'en' },
    };
    return {
        strategy,
        params,
        calls,
        tenantHeaders,
        nonces,
        intents,
        enrollments,
        faults,
        config,
        identity,
        measurements,
        reload: () => createSSSStrategy(config),
        emailShare: () => formatVersionedEmailShare(recoveryShares.emailShare, version),
        state: () => state,
        /** D21: the plaintext of the authority's current blob. */
        sealed: async () =>
            state.envelope ? decryptEscrowBlob(state.envelope, keys.privateKey) : null,
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

describe('Nitro recovery initiating-client bindings and measurement rollover', () => {
    it('retries recovered enrollment with clear-PIN intent after failure before enclave mutation', async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        expect(f.state()).toMatchObject({ status: 'active', hasPin: true });
        const hold = await f.strategy.startEscrowRecovery!({
            recoverySessionToken: 'otp-session',
            expectedDid: owner.intent.did,
        });
        await f.strategy.executeRecovery({
            token: '',
            providerType: 'firebase',
            input: { method: 'escrow', ...hold, resumeToken: hold.resumeToken! },
            didFromPrivateKey: async () => owner.intent.did,
        });
        f.faults.failEnrollment = true;
        await f.strategy.completeIdentityRecovery!(f.params);
        expect(f.intents.at(-1)?.intent).toMatchObject({ action: 'replace', pinAction: 'clear' });
        expect(f.state()).toMatchObject({ status: 'active', hasPin: true });
        const writes = f.calls.filter(call => call === 'PUT:/keys/auth-share').length;
        f.faults.failEnrollment = false;
        await expect(
            f.strategy.ensureEscrowEnrollment!({
                ...f.params,
                options: { ...f.params.options, clearPin: true },
            })
        ).resolves.toMatchObject({ enrolled: true });
        expect(f.intents.at(-1)?.intent).toMatchObject({ action: 'replace', pinAction: 'clear' });
        expect(f.state()).toMatchObject({ status: 'active', hasPin: false });
        expect(f.calls.filter(call => call === 'PUT:/keys/auth-share')).toHaveLength(writes);
    });
    it('keeps the account and re-sets the proven PIN with an owner-signed change after a PIN sign-in', async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        f.spend();
        // Charged attempts (e.g. earlier successful releases), but no verified wrong entry.
        f.faults.wrongPinAttempts = 0;
        const generation = f.state().pinGeneration;
        const shareVersion = f.intents.at(-1)!.intent.shareVersion;
        const writes = f.calls.filter(call => call === 'PUT:/keys/auth-share').length;
        const recovered = await f.strategy.executeRecovery({
            token: 'token',
            providerType: 'firebase',
            input: { method: 'escrow-pin', pin: '135790', expectedDid: owner.intent.did },
            didFromPrivateKey: async () => owner.intent.did,
            signDidAuthVp: f.params.signDidAuthVp,
            options: f.params.options,
        });
        expect(recovered).toMatchObject({
            escrowEnrolled: true,
            escrowRecovery: true,
            pinSignIn: { mode: 'kept', pinRefreshed: true, newPinRequired: false },
        });
        // Keep mode: no rebind, no re-split; the re-set targets the released version.
        expect(f.calls).not.toContain('POST:/keys/recovery-session/rebind');
        expect(f.calls.filter(call => call === 'PUT:/keys/auth-share')).toHaveLength(writes);
        expect(f.intents.at(-1)?.intent).toMatchObject({
            shareVersion,
            action: 'replace',
            pinAction: 'change',
            recoveryEmail: 'owner@example.com',
            recoveryLanguage: 'en',
        });
        expect(f.state()).toMatchObject({
            status: 'active',
            hasPin: true,
            pinGeneration: generation + 1,
            attemptsUsed: 0,
        });
        const enrollment = f.enrollments.at(-1)!;
        expect(enrollment.clearPin).toBeUndefined();
        expect(typeof enrollment.pinSalt).toBe('string');
        expect(enrollment.pinVerifier).toBe(
            await derivePinProof('135790', String(enrollment.pinSalt))
        );
        // The repair intent is not needed: a current PIN enrollment needs no change.
        const intents = f.intents.length;
        await expect(f.strategy.ensureEscrowEnrollment!(f.params)).resolves.toMatchObject({
            enrolled: true,
            changed: false,
        });
        expect(f.intents).toHaveLength(intents);
    });
    it('signs no PIN change after a PIN sign-in when wrong entries are recorded', async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        f.spend();
        f.faults.wrongPinAttempts = 2;
        const before = { ...f.state() };
        const intents = f.intents.length;
        await expect(
            f.strategy.executeRecovery({
                token: 'token',
                providerType: 'firebase',
                input: { method: 'escrow-pin', pin: '135790', expectedDid: owner.intent.did },
                didFromPrivateKey: async () => owner.intent.did,
                signDidAuthVp: f.params.signDidAuthVp,
                options: f.params.options,
            })
        ).resolves.toMatchObject({
            escrowEnrolled: true,
            pinSignIn: { mode: 'kept', pinRefreshed: false, newPinRequired: true },
        });
        // No owner-signed change: same PIN generation, the used attempts stand.
        expect(f.intents).toHaveLength(intents);
        expect(f.state()).toMatchObject({
            pinGeneration: before.pinGeneration,
            attemptsUsed: before.attemptsUsed,
        });
    });
    it('reports a refused same-PIN refresh instead of a silent success, and keeps the PIN', async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        f.spend();
        f.faults.wrongPinAttempts = 0;
        f.faults.refusePinChange = true;
        const before = { ...f.state() };
        const recovered = await f.strategy.executeRecovery({
            token: 'token',
            providerType: 'firebase',
            input: { method: 'escrow-pin', pin: '135790', expectedDid: owner.intent.did },
            didFromPrivateKey: async () => owner.intent.did,
            signDidAuthVp: f.params.signDidAuthVp,
            options: f.params.options,
        });
        expect(recovered).toMatchObject({
            escrowEnrolled: true,
            pinSignIn: {
                mode: 'kept',
                pinRefreshed: false,
                newPinRequired: false,
                pinRefreshFailed: true,
            },
        });
        // Nothing committed: the PIN keeps its generation and reduced budget.
        expect(f.state()).toMatchObject({
            pinGeneration: before.pinGeneration,
            attemptsUsed: before.attemptsUsed,
        });
    });
    it('does not report a refresh failure when none was attempted', async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        f.spend();
        f.faults.wrongPinAttempts = 2;
        const recovered = await f.strategy.executeRecovery({
            token: 'token',
            providerType: 'firebase',
            input: { method: 'escrow-pin', pin: '135790', expectedDid: owner.intent.did },
            didFromPrivateKey: async () => owner.intent.did,
            signDidAuthVp: f.params.signDidAuthVp,
            options: f.params.options,
        });
        expect(recovered.pinSignIn).not.toHaveProperty('pinRefreshFailed');
    });
    it('treats an enrollment whose lca-api copy differs from the authority as unenrolled', async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!(f.params);
        expect(f.state()).toMatchObject({ status: 'active', hasPin: false });
        f.faults.serverBlobIdentity = 'authority';
        const intents = f.intents.length;
        // Matching copies: nothing to repair.
        await expect(f.strategy.ensureEscrowEnrollment!(f.params)).resolves.toMatchObject({
            enrolled: true,
            changed: false,
        });
        expect(f.intents).toHaveLength(intents);
        // lca-api kept an old copy the authority already replaced: re-enroll (no PIN).
        f.faults.serverBlobIdentity = 'ef'.repeat(32);
        await expect(f.strategy.ensureEscrowEnrollment!(f.params)).resolves.toMatchObject({
            enrolled: true,
            changed: true,
        });
        expect(f.intents.length).toBeGreaterThan(intents);
    });
    it('leaves a mismatch alone while lca-api reports a PIN operation in progress', async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        // Authority committed, lca-api's lease-held write not landed yet.
        f.faults.serverBlobIdentity = 'ef'.repeat(32);
        f.faults.serverUpdating = true;
        const intents = f.intents.length;
        await expect(f.strategy.ensureEscrowEnrollment!(f.params)).resolves.toEqual({
            enrolled: true,
            changed: false,
        });
        expect(f.intents).toHaveLength(intents);
        // Once the lease is gone, a copy still left behind is a real mismatch.
        f.faults.serverUpdating = false;
        await expect(f.strategy.ensureEscrowEnrollment!(f.params)).resolves.toEqual({
            enrolled: false,
            reason: 'pin-reset-required',
        });
    });
    it('asks for a new PIN, signing nothing, when a PIN-protected copy is stale in lca-api', async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        f.faults.serverBlobIdentity = 'ef'.repeat(32);
        const intents = f.intents.length;
        const writes = f.calls.filter(call => call === 'PUT:/keys/auth-share').length;
        await expect(f.strategy.ensureEscrowEnrollment!(f.params)).resolves.toEqual({
            enrolled: false,
            reason: 'pin-reset-required',
        });
        expect(f.intents).toHaveLength(intents);
        expect(f.calls.filter(call => call === 'PUT:/keys/auth-share')).toHaveLength(writes);
        // A user-chosen PIN repairs it.
        await f.strategy.setEscrowPin!({ ...f.params, pin: '246813' });
        expect(f.intents.at(-1)?.intent).toMatchObject({ pinAction: 'change' });
    });
    it('re-reads lca-api before repairing, so a copy settled by the state read is not re-enrolled', async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        f.faults.serverBlobIdentity = 'ef'.repeat(32);
        // lca-api adopts the authority's copy while serving the authority-state read.
        f.faults.beforeSnapshot = async () => {
            f.faults.serverBlobIdentity = 'authority';
        };
        const intents = f.intents.length;
        await expect(f.strategy.ensureEscrowEnrollment!(f.params)).resolves.toMatchObject({
            enrolled: true,
            changed: false,
        });
        expect(f.intents).toHaveLength(intents);
    });
    it('still clears the PIN after a hold recovery', async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        const hold = await f.strategy.startEscrowRecovery!({
            recoverySessionToken: 'otp-session',
            expectedDid: owner.intent.did,
        });
        await f.strategy.executeRecovery({
            token: '',
            providerType: 'firebase',
            input: { method: 'escrow', ...hold, resumeToken: hold.resumeToken! },
            didFromPrivateKey: async () => owner.intent.did,
        });
        await expect(f.strategy.completeIdentityRecovery!(f.params)).resolves.toMatchObject({
            escrowEnrolled: true,
        });
        expect(f.intents.at(-1)?.intent).toMatchObject({ action: 'replace', pinAction: 'clear' });
        expect(f.enrollments.at(-1)?.pinSalt).toBeUndefined();
        expect(f.state()).toMatchObject({ status: 'active', hasPin: false });
    });
    it('treats a successful recovered clear-PIN enrollment as satisfying the repair', async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        const hold = await f.strategy.startEscrowRecovery!({
            recoverySessionToken: 'otp-session',
            expectedDid: owner.intent.did,
        });
        await f.strategy.executeRecovery({
            token: '',
            providerType: 'firebase',
            input: { method: 'escrow', ...hold, resumeToken: hold.resumeToken! },
            didFromPrivateKey: async () => owner.intent.did,
        });
        await f.strategy.completeIdentityRecovery!(f.params);
        expect(f.state()).toMatchObject({ status: 'active', hasPin: false });
        const writes = f.calls.filter(call => call === 'PUT:/keys/auth-share').length;
        const intents = f.intents.length;
        await expect(
            f.strategy.ensureEscrowEnrollment!({
                ...f.params,
                options: { ...f.params.options, clearPin: true },
            })
        ).resolves.toMatchObject({ enrolled: true, changed: false });
        expect(f.calls.filter(call => call === 'PUT:/keys/auth-share')).toHaveLength(writes);
        expect(f.intents).toHaveLength(intents);
    });
    it('repairs a prior enrollment after non-escrow identity recovery outside rollout', async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        const intents = f.intents.length;
        await f.strategy.prepareIdentityRecovery!({
            recoverySessionToken: 'session',
            input: { method: 'email', emailShare: f.emailShare() },
            didFromPrivateKey: async () => owner.intent.did,
        });
        await expect(f.strategy.completeIdentityRecovery!(f.params)).resolves.toMatchObject({
            escrowEnrolled: false,
            escrowRecovery: false,
        });
        expect(f.intents).toHaveLength(intents);
        // Outside rollout the verified authority proves prior enrollment, so the
        // repair still runs and clears the retired PIN instead of carrying it.
        await expect(
            f.strategy.ensureEscrowEnrollment!({
                ...f.params,
                options: { ...f.params.options, clearPin: true, requirePriorEnrollment: true },
            })
        ).resolves.toMatchObject({ enrolled: true });
        expect(f.intents.at(-1)?.intent).toMatchObject({ action: 'replace', pinAction: 'clear' });
        expect(f.state()).toMatchObject({ status: 'active', hasPin: false });
    });
    const recoverWithFailedDirectEnrollment = async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        const hold = await f.strategy.startEscrowRecovery!({
            recoverySessionToken: 'otp-session',
            expectedDid: owner.intent.did,
        });
        await f.strategy.executeRecovery({
            token: '',
            providerType: 'firebase',
            input: { method: 'escrow', ...hold, resumeToken: hold.resumeToken! },
            didFromPrivateKey: async () => owner.intent.did,
        });
        f.faults.failEnrollment = true;
        await f.strategy.completeIdentityRecovery!(f.params);
        f.faults.failEnrollment = false;
        expect(f.state()).toMatchObject({ status: 'active', hasPin: true });
        return f;
    };
    const writes = (f: { calls: string[] }) =>
        f.calls.filter(call => call === 'PUT:/keys/auth-share').length;
    it.each([false, true])(
        'after a reload, asks for a new PIN instead of rotating or signing (outside rollout: %s)',
        async requirePriorEnrollment => {
            const f = await recoverWithFailedDirectEnrollment();
            const intents = f.intents.length;
            const before = writes(f);
            await expect(
                f.reload().ensureEscrowEnrollment!({
                    ...f.params,
                    options: {
                        ...f.params.options,
                        ...(requirePriorEnrollment ? { requirePriorEnrollment } : {}),
                    },
                })
            ).resolves.toEqual({ enrolled: false, reason: 'pin-reset-required' });
            expect(f.intents).toHaveLength(intents);
            expect(writes(f)).toBe(before);
            expect(f.state()).toMatchObject({ status: 'active', hasPin: true });
        }
    );
    it('lets the user set a new PIN after a rebind left the old one uncarryable', async () => {
        const f = await recoverWithFailedDirectEnrollment();
        const intents = f.intents.length;
        await f.reload().setEscrowPin!({ ...f.params, pin: '246813' });
        expect(f.intents.slice(intents).map(signed => signed.intent)).toEqual([
            // The authority still has the old PIN, so the user's new PIN is a `change`:
            // a replace with fresh PIN material that needs no carry source in lca-api.
            expect.objectContaining({ action: 'replace', pinAction: 'change' }),
        ]);
        expect(f.state()).toMatchObject({ status: 'active', hasPin: true });
    });
    it('signs nothing for a healthy PIN account when lca-api forges rebind status', async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        expect(f.state()).toMatchObject({ status: 'active', hasPin: true });
        const intents = f.intents.length;
        const before = writes(f);
        f.faults.forgedRebindStatus = true;
        await expect(f.reload().ensureEscrowEnrollment!(f.params)).resolves.toEqual({
            enrolled: false,
            reason: 'pin-reset-required',
        });
        expect(f.intents).toHaveLength(intents);
        expect(writes(f)).toBe(before);
        expect(f.state()).toMatchObject({ status: 'active', hasPin: true });
    });
    it('still clears on forged status when auto-clear is explicitly enabled (needs security sign-off)', async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        f.faults.forgedRebindStatus = true;
        await expect(
            createSSSStrategy({ ...f.config, autoClearUncarryablePin: true })
                .ensureEscrowEnrollment!(f.params)
        ).resolves.toMatchObject({ enrolled: true, pinCleared: 'automatic' });
        expect(f.intents.at(-1)?.intent).toMatchObject({ action: 'replace', pinAction: 'clear' });
        expect(f.state()).toMatchObject({ hasPin: false });
    });
    it.each([false, true])(
        'with auto-clear opted in, repairs a recovered PIN account by signing a clear (outside rollout: %s)',
        async requirePriorEnrollment => {
            const f = await recoverWithFailedDirectEnrollment();
            const intents = f.intents.length;
            // Fresh instance: no unenrolledRotation and no clear-PIN intent from the coordinator.
            await expect(
                createSSSStrategy({ ...f.config, autoClearUncarryablePin: true })
                    .ensureEscrowEnrollment!({
                    ...f.params,
                    options: {
                        ...f.params.options,
                        ...(requirePriorEnrollment ? { requirePriorEnrollment } : {}),
                    },
                })
            ).resolves.toMatchObject({ enrolled: true, changed: true });
            expect(f.intents.slice(intents).map(signed => signed.intent)).toEqual([
                expect.objectContaining({ action: 'replace', pinAction: 'clear' }),
            ]);
            expect(f.state()).toMatchObject({ status: 'active', hasPin: false });
        }
    );
    it('reports an automatic clear once, without the DID', async () => {
        const f = await recoverWithFailedDirectEnrollment();
        const onEscrowPinAutoCleared = vi.fn();
        await expect(
            createSSSStrategy({
                ...f.config,
                autoClearUncarryablePin: true,
                onEscrowPinAutoCleared,
            }).ensureEscrowEnrollment!(f.params)
        ).resolves.toEqual({
            enrolled: true,
            changed: true,
            shareVersion: expect.any(Number),
            pinCleared: 'automatic',
        });
        expect(onEscrowPinAutoCleared).toHaveBeenCalledTimes(1);
        expect(onEscrowPinAutoCleared).toHaveBeenCalledWith({
            type: 'escrow.pin.auto_cleared',
            shareVersion: expect.any(Number),
            authorityShareVersion: expect.any(Number),
        });
        expect(JSON.stringify(onEscrowPinAutoCleared.mock.calls)).not.toContain(owner.intent.did);
    });
    it('does not report a clear the caller asked for as automatic', async () => {
        const f = await recoverWithFailedDirectEnrollment();
        const onEscrowPinAutoCleared = vi.fn();
        const result = await createSSSStrategy({
            ...f.config,
            onEscrowPinAutoCleared,
        }).ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, clearPin: true },
        });
        expect(result).toMatchObject({ enrolled: true, changed: true });
        expect(result).not.toHaveProperty('pinCleared');
        expect(f.intents.at(-1)?.intent).toMatchObject({ pinAction: 'clear' });
        expect(onEscrowPinAutoCleared).not.toHaveBeenCalled();
    });
    it('does not clear automatically without rebind evidence from the authority', async () => {
        const f = await recoverWithFailedDirectEnrollment();
        const intents = f.intents.length;
        const onEscrowPinAutoCleared = vi.fn();
        // An authority already at the server's share version is no rebind.
        f.state().shareVersion = (
            await f.reload().fetchServerKeyStatus(f.params.token, f.params.providerType)
        ).shareVersion;
        await expect(
            createSSSStrategy({
                ...f.config,
                autoClearUncarryablePin: true,
                onEscrowPinAutoCleared,
            }).ensureEscrowEnrollment!(f.params)
        ).resolves.toEqual({ enrolled: false, reason: 'pin-reset-required' });
        expect(f.intents).toHaveLength(intents);
        expect(onEscrowPinAutoCleared).not.toHaveBeenCalled();
    });
    it('does not burn a share version after a reload when the authority read fails', async () => {
        const f = await recoverWithFailedDirectEnrollment();
        const writes = f.calls.filter(call => call === 'PUT:/keys/auth-share').length;
        const intents = f.intents.length;
        f.faults.snapshotNonce = true;
        await expect(f.reload().ensureEscrowEnrollment!(f.params)).rejects.toThrow();
        expect(f.calls.filter(call => call === 'PUT:/keys/auth-share')).toHaveLength(writes);
        expect(f.intents).toHaveLength(intents);
    });
    it('reports a leftover pending escrow method as prior enrollment after a reload', async () => {
        const f = await recoverWithFailedDirectEnrollment();
        await expect(f.reload().getEscrowEnrollmentState!(f.params)).resolves.toMatchObject({
            state: 'not-enrolled',
            priorEscrowMethod: true,
        });
    });
    it('falls back to the confirmed method list on servers without priorEscrowEnrollment', async () => {
        const f = await recoverWithFailedDirectEnrollment();
        f.faults.oldServer = true;
        const state = await f.reload().getEscrowEnrollmentState!(f.params);
        expect(state).toMatchObject({ state: 'not-enrolled' });
        expect(state).not.toHaveProperty('priorEscrowMethod');
    });
    it('does not enroll a never-enrolled account through prior-enrollment repair', async () => {
        const f = await setup();
        await f.strategy.prepareIdentityRecovery!({
            recoverySessionToken: 'session',
            input: { method: 'email', emailShare: f.emailShare() },
            didFromPrivateKey: async () => owner.intent.did,
        });
        await f.strategy.completeIdentityRecovery!(f.params);
        await expect(
            f.strategy.ensureEscrowEnrollment!({
                ...f.params,
                options: { ...f.params.options, clearPin: true, requirePriorEnrollment: true },
            })
        ).resolves.toEqual({ enrolled: false, reason: 'not-enrolled' });
        expect(f.intents).toHaveLength(0);
        expect(f.state()).toMatchObject({ status: 'empty' });
    });
    it('binds recovery contact into the enrollment intent after identity recovery', async () => {
        const f = await setup();
        const hold = await f.strategy.startEscrowRecovery!({
            recoverySessionToken: 'otp-session',
            expectedDid: owner.intent.did,
        });
        await f.strategy.executeRecovery({
            token: '',
            providerType: 'firebase',
            input: { method: 'escrow', ...hold, resumeToken: hold.resumeToken! },
            didFromPrivateKey: async () => owner.intent.did,
        });
        await f.strategy.completeIdentityRecovery!({
            ...f.params,
            options: { recoveryEmail: 'recovered@example.com', recoveryLanguage: 'es' },
        });
        expect(f.intents.at(-1)?.intent).toMatchObject({
            recoveryEmail: 'recovered@example.com',
            recoveryLanguage: 'es',
            action: 'enroll',
        });
        expect(f.state()).toMatchObject({ status: 'active', hasPin: false });
    });
    const start = (f: Awaited<ReturnType<typeof setup>>) =>
        f.strategy.startEscrowRecovery!({
            token: 'token',
            providerType: 'firebase',
            expectedDid: owner.intent.did,
        });
    const persisted = (value: Awaited<ReturnType<typeof start>>): EscrowRecoveryStart =>
        JSON.parse(JSON.stringify(value));
    const proof = (value: EscrowRecoveryStart) => ({
        holdId: value.holdId,
        resumeToken: value.resumeToken!,
        expectations: value.expectations,
    });
    const confirm = (f: Awaited<ReturnType<typeof setup>>, value: EscrowRecoveryStart) =>
        f.reload().confirmEscrowRecovery!({ ...proof(value), code: '123456' });
    const restore = (f: Awaited<ReturnType<typeof setup>>, value: EscrowRecoveryStart) =>
        f.reload().executeRecovery({
            token: '',
            providerType: 'firebase',
            input: {
                method: 'escrow',
                ...proof(value),
                clientEphemeralPrivateKey: value.clientEphemeralPrivateKey,
            },
            didFromPrivateKey: async () => owner.intent.did,
        });

    it('starts, confirms, persists/reloads, checks status and restores with retained bindings', async () => {
        const f = await setup();
        const saved = persisted(await start(f));
        await expect(confirm(f, saved)).resolves.toEqual({ success: true });
        expect(f.calls.filter(c => c === 'POST:/keys/escrow/confirm')).toHaveLength(2);
        await expect(f.reload().getEscrowRecoveryStatus!(proof(saved))).resolves.toMatchObject({
            holdId: saved.holdId,
        });
        await expect(restore(f, saved)).resolves.toEqual({
            privateKey: owner.seedHex,
            did: owner.intent.did,
        });
    });

    it.each([
        ['hold ID', { holdId: 'other' }],
        ['recipient key', { clientEphemeralPublicKey: 'other' }],
        ['DID', { did: 'did:key:other' }],
    ] as const)('rejects a validly signed start for another %s', async (_, substitution) => {
        const f = await setup();
        f.faults.startHold = substitution;
        await expect(start(f)).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
        expect(f.calls).not.toContain('POST:/keys/escrow/confirm');
        expect(f.calls).not.toContain('POST:/keys/escrow/complete');
    });

    it.each([
        ['hold ID', { holdId: 'other' }],
        ['recipient key', { clientEphemeralPublicKey: 'other' }],
        ['DID', { did: 'did:key:other' }],
        ['blob identity', { blobHash: 'cd'.repeat(32) }],
        ['hold revision', { createdHi: 42 }],
    ] as const)(
        'rejects substituted %s on confirm, status and restore after reload',
        async (_, substitution) => {
            const f = await setup();
            const saved = persisted(await start(f));
            f.faults.statusHold = substitution;
            // Simulates persisted server-display data being replaced without changing
            // the separate client expectations saved together with the private key.
            if (saved.holdRecord) Object.assign(saved.holdRecord.hold, substitution);
            await expect(confirm(f, saved)).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
            await expect(f.reload().getEscrowRecoveryStatus!(proof(saved))).rejects.toMatchObject({
                name: 'EscrowEvidenceError',
            });
            await expect(restore(f, saved)).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
            expect(f.calls).not.toContain('POST:/keys/escrow/confirm');
            expect(f.calls).not.toContain('POST:/keys/escrow/complete');
        }
    );

    it.each([
        ['hold ID', { holdId: 'other' }],
        ['recipient key', { clientEphemeralPublicKey: 'other' }],
    ] as const)('rejects confirmation readback bound to another %s', async (_, substitution) => {
        const f = await setup();
        const saved = persisted(await start(f));
        f.faults.confirmationHold = substitution;
        await expect(confirm(f, saved)).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
        expect(f.calls).not.toContain('POST:/keys/escrow/complete');
    });

    it('rejects missing initiating DID or missing persisted expectations without network calls', async () => {
        const f = await setup();
        await expect(
            f.strategy.startEscrowRecovery!({ token: 'token', providerType: 'firebase' })
        ).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
        expect(f.calls).toHaveLength(0);
        const saved = persisted(await start(f));
        saved.expectations = undefined;
        f.calls.length = 0;
        await expect(confirm(f, saved)).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
        await expect(restore(f, saved)).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
        expect(f.calls).toHaveLength(0);
    });

    it('rejects replacing the requested hold ID while retaining original expectations', async () => {
        const f = await setup();
        const saved = persisted(await start(f));
        saved.holdId = 'other';
        f.calls.length = 0;
        await expect(confirm(f, saved)).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
        expect(f.calls).toHaveLength(0);
    });

    it('starts under M1 and confirms/restores after M2 upgrade with both measurements allowed', async () => {
        const f = await setup();
        const saved = persisted(await start(f));
        f.identity.authority!.measurement = f.measurements[1]!;
        await expect(confirm(f, saved)).resolves.toEqual({ success: true });
        await expect(f.reload().getEscrowRecoveryStatus!(proof(saved))).resolves.toBeTruthy();
        await expect(restore(f, saved)).resolves.toMatchObject({ did: owner.intent.did });
    });

    it('rejects historical M1 when the configured allowlist contains only M2', async () => {
        const f = await setup();
        const saved = persisted(await start(f));
        f.identity.authority!.measurement = f.measurements[1]!;
        if (f.config.escrow?.attestation.mode === 'nitro')
            f.config.escrow.attestation.pinnedMeasurements.shift();
        await expect(confirm(f, saved)).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
        expect(f.calls).not.toContain('POST:/keys/escrow/confirm');
    });

    it('rejects fresh M1 confirmation while current attestation is M2 even with both allowed', async () => {
        const f = await setup();
        const saved = persisted(await start(f));
        f.identity.authority!.measurement = f.measurements[1]!;
        f.faults.freshMeasurement = f.measurements[0]!;
        await expect(confirm(f, saved)).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
        expect(f.calls.filter(c => c === 'POST:/keys/escrow/confirm')).toHaveLength(1);
        expect(f.calls).not.toContain('POST:/keys/escrow/complete');
    });

    it('rejects a different current ledger signing key', async () => {
        const f = await setup();
        const saved = persisted(await start(f));
        const other = await crypto.subtle.generateKey(
            { name: 'ECDSA', namedCurve: 'P-256' },
            true,
            ['sign', 'verify']
        );
        f.identity.authority!.ledgerPublicKey = Buffer.from(
            await crypto.subtle.exportKey('raw', other.publicKey)
        ).toString('base64');
        await expect(confirm(f, saved)).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
        expect(f.calls).not.toContain('POST:/keys/escrow/confirm');
    });

    it('accepts an attested previous key ID only while the ledger signing key is unchanged', async () => {
        const f = await setup();
        const saved = persisted(await start(f));
        f.identity.previousKeyIds = [f.identity.keyId];
        f.identity.keyId = 'renamed-key';
        f.identity.authority!.measurement = f.measurements[1]!;
        await expect(confirm(f, saved)).resolves.toEqual({ success: true });
    });

    it('rejects an original key ID absent from current and attested previous IDs', async () => {
        const f = await setup();
        const saved = persisted(await start(f));
        f.identity.keyId = 'other-key';
        await expect(confirm(f, saved)).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
        expect(f.calls).not.toContain('POST:/keys/escrow/confirm');
    });

    it('rejects a changed authority generation under the same key and permitted measurement', async () => {
        const f = await setup();
        const saved = persisted(await start(f));
        f.faults.generation = 'other-generation';
        await expect(confirm(f, saved)).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
        expect(f.calls).not.toContain('POST:/keys/escrow/confirm');
    });

    it('checks restored DID against retained expectations, not the release response', async () => {
        const f = await setup();
        const saved = persisted(await start(f));
        f.faults.releaseDid = 'did:key:other';
        await expect(restore(f, saved)).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
        expect(f.calls.some(c => c.includes('rebind'))).toBe(false);
    });

    it.each([false, true])(
        'rejects a different fresh confirmation generation (snapshot-only: %s)',
        async snapshotOnly => {
            const f = await setup();
            const saved = persisted(await start(f));
            f.faults.snapshotOnly = snapshotOnly;
            f.faults.confirmationGeneration = 'other-generation';
            await expect(confirm(f, saved)).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
            expect(f.calls.filter(c => c === 'POST:/keys/escrow/confirm')).toHaveLength(1);
            expect(f.calls).not.toContain('POST:/keys/escrow/complete');
        }
    );

    it('rejects legacy snapshots without a signed authority generation', async () => {
        const f = await setup();
        const saved = persisted(await start(f));
        f.faults.snapshotOnly = true;
        f.faults.legacySnapshot = true;
        await expect(confirm(f, saved)).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
    });

    it('accepts generation-bound snapshot-only confirmation retries after reload', async () => {
        const f = await setup();
        const saved = persisted(await start(f));
        await confirm(f, saved);
        await expect(confirm(f, saved)).resolves.toEqual({ success: true });
        expect(f.calls.filter(c => c === 'POST:/keys/escrow/confirm')).toHaveLength(3);
    });
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
            expectedDid: owner.intent.did,
            token: f.params.token,
            providerType: f.params.providerType,
        });
        expect(f.nonces).toHaveLength(0);
        expect(f.intents).toHaveLength(0);
        expect(f.calls).toContain('POST:/keys/escrow/recover');
    });
    // Regression for the P1 finding: the no-provider identity-recovery flow
    // (email verification, no signed-in device) authenticates to /recover with
    // a recoverySessionToken instead of token/providerType, but Nitro mode
    // still requires the independently-known expectedDid binding.
    it('rejects a no-provider recovery-session start missing the independently-known DID', async () => {
        const f = await setup();
        await expect(
            f.strategy.startEscrowRecovery!({ recoverySessionToken: 'session-token' })
        ).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
        expect(f.calls).toHaveLength(0);
    });
    it('starts a Nitro hold via a no-provider recovery-session token bound to the verified DID', async () => {
        const f = await setup();
        const result = await f.strategy.startEscrowRecovery!({
            recoverySessionToken: 'session-token',
            expectedDid: owner.intent.did,
        });
        expect(f.calls).toContain('POST:/keys/escrow/recover');
        expect(result.expectations).toMatchObject({ did: owner.intent.did, holdId: 'hold' });
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

describe('Escrow authority tenant decoupled from the app tenant (VetPass on the LearnCard enclave)', () => {
    // The enclave is single-tenant: it signs everything as its measured label, 'learncard'.
    const vetpass = { appTenant: 'vetpass', authorityTenant: 'learncard' } as const;
    const startHold = (f: Awaited<ReturnType<typeof setup>>) =>
        f.strategy.startEscrowRecovery!({
            token: 'token',
            providerType: 'firebase',
            expectedDid: owner.intent.did,
        });

    it('enrolls with a learncard-tenant intent while every request carries X-Tenant-Id vetpass', async () => {
        const f = await setup(false, vetpass);
        await expect(
            f.strategy.ensureEscrowEnrollment!({
                ...f.params,
                options: { ...f.params.options, pin: '135790' },
            })
        ).resolves.toMatchObject({ enrolled: true, changed: true });
        expect(f.intents.at(-1)?.intent).toMatchObject({ tenant: 'learncard', action: 'enroll' });
        expect(f.state()).toMatchObject({ tenant: 'learncard', status: 'active', hasPin: true });
        expect([...f.tenantHeaders]).toEqual(['vetpass']);
    });

    it('runs a PIN sign-in that keeps the account', async () => {
        const f = await setup(false, vetpass);
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        f.faults.wrongPinAttempts = 0;
        await expect(
            f.strategy.executeRecovery({
                token: 'token',
                providerType: 'firebase',
                input: { method: 'escrow-pin', pin: '135790', expectedDid: owner.intent.did },
                didFromPrivateKey: async () => owner.intent.did,
                signDidAuthVp: f.params.signDidAuthVp,
                options: f.params.options,
            })
        ).resolves.toMatchObject({
            escrowRecovery: true,
            pinSignIn: { mode: 'kept', newPinRequired: false },
        });
        expect(f.intents.every(signed => signed.intent.tenant === 'learncard')).toBe(true);
        expect([...f.tenantHeaders]).toEqual(['vetpass']);
    });

    it('starts, confirms, persists/reloads and restores a 7-day hold bound to the authority tenant', async () => {
        const f = await setup(false, vetpass);
        const saved: EscrowRecoveryStart = JSON.parse(JSON.stringify(await startHold(f)));
        expect(saved.expectations).toMatchObject({ tenant: 'learncard', holdId: 'hold' });
        const proof = {
            holdId: saved.holdId,
            resumeToken: saved.resumeToken!,
            expectations: saved.expectations,
        };
        await expect(
            f.reload().confirmEscrowRecovery!({ ...proof, code: '123456' })
        ).resolves.toEqual({ success: true });
        await expect(f.reload().getEscrowRecoveryStatus!(proof)).resolves.toMatchObject({
            holdId: 'hold',
        });
        await expect(
            f.reload().executeRecovery({
                token: '',
                providerType: 'firebase',
                input: {
                    method: 'escrow',
                    ...proof,
                    clientEphemeralPrivateKey: saved.clientEphemeralPrivateKey,
                },
                didFromPrivateKey: async () => owner.intent.did,
            })
        ).resolves.toEqual({ privateKey: owner.seedHex, did: owner.intent.did });
        expect([...f.tenantHeaders]).toEqual(['vetpass']);
    });

    it('keeps LearnCard unchanged: the authority tenant defaults to the app tenant', async () => {
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!(f.params);
        expect(f.intents.at(-1)?.intent.tenant).toBe('learncard');
        expect((await startHold(f)).expectations?.tenant).toBe('learncard');
        expect([...f.tenantHeaders]).toEqual(['learncard']);
    });

    it('fails closed with a clear error when the app tenant is used against a learncard enclave', async () => {
        // Misconfiguration: VetPass without `authorityTenant` defaults to 'vetpass'.
        const f = await setup(false, { appTenant: 'vetpass' });
        const enrolling = f.strategy.ensureEscrowEnrollment!(f.params);
        await expect(enrolling).rejects.toBeInstanceOf(EscrowAuthorityTenantMismatchError);
        await expect(enrolling).rejects.toMatchObject({
            name: 'EscrowAuthorityTenantMismatchError',
            expectedTenant: 'vetpass',
            signedTenant: 'learncard',
            message: expect.stringContaining('escrowAuthorityTenant'),
        });
        expect(f.intents).toHaveLength(0);
        expect(f.calls).not.toContain('PUT:/keys/auth-share');
        await expect(startHold(f)).rejects.toBeInstanceOf(EscrowAuthorityTenantMismatchError);
        expect(f.calls).not.toContain('POST:/keys/escrow/confirm');
    });

    it('fails closed when the configured authority tenant differs from the enclave label', async () => {
        const f = await setup(false, { ...vetpass, enclaveTenant: 'scouts' });
        await expect(f.strategy.ensureEscrowEnrollment!(f.params)).rejects.toMatchObject({
            name: 'EscrowAuthorityTenantMismatchError',
            expectedTenant: 'learncard',
            signedTenant: 'scouts',
        });
        expect(f.intents).toHaveLength(0);
    });

    it('refuses persisted expectations bound to another authority tenant without network calls', async () => {
        const f = await setup(false, vetpass);
        const saved: EscrowRecoveryStart = JSON.parse(JSON.stringify(await startHold(f)));
        f.calls.length = 0;
        const misconfigured = createSSSStrategy({
            ...f.config,
            escrow: { ...f.config.escrow!, authorityTenant: undefined },
        });
        await expect(
            misconfigured.confirmEscrowRecovery!({
                holdId: saved.holdId,
                resumeToken: saved.resumeToken!,
                expectations: saved.expectations,
                code: '123456',
            })
        ).rejects.toMatchObject({ name: 'EscrowEvidenceError' });
        expect(f.calls).toHaveLength(0);
    });

    it('rejects an invalid authority tenant label at construction', () => {
        expect(() =>
            createSSSStrategy({
                serverUrl: 'https://example.test',
                tenantId: 'vetpass',
                escrow: {
                    enabled: true,
                    attestation: { mode: 'software', pinnedPublicKeys: [] },
                    authorityTenant: 'learn card',
                },
            })
        ).toThrow('Invalid escrow authority tenant');
    });

    it('shares one enrollment per DID across LearnCard and VetPass instead of colliding', async () => {
        // One Firebase user = one UserKey = one DID = one authority record
        // ('learncard', generation, DID), whichever app enrolled it.
        const f = await setup();
        await f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });
        const enrolledVersion = f.state().enrollmentVersion;
        const intents = f.intents.length;
        const vetpassStrategy = createSSSStrategy({
            ...f.config,
            tenantId: 'vetpass',
            escrow: { ...f.config.escrow!, authorityTenant: 'learncard' },
        });
        // VetPass sees the LearnCard enrollment as current and signs nothing.
        await expect(vetpassStrategy.ensureEscrowEnrollment!(f.params)).resolves.toMatchObject({
            enrolled: true,
            changed: false,
        });
        expect(f.intents).toHaveLength(intents);
        expect(f.state().enrollmentVersion).toBe(enrolledVersion);
        // The PIN set from LearnCard signs in from VetPass, on the same record.
        f.faults.wrongPinAttempts = 0;
        await expect(
            vetpassStrategy.executeRecovery({
                token: 'token',
                providerType: 'firebase',
                input: { method: 'escrow-pin', pin: '135790', expectedDid: owner.intent.did },
                didFromPrivateKey: async () => owner.intent.did,
                signDidAuthVp: f.params.signDidAuthVp,
                options: f.params.options,
            })
        ).resolves.toMatchObject({ escrowRecovery: true, pinSignIn: { mode: 'kept' } });
        expect(f.intents.every(signed => signed.intent.tenant === 'learncard')).toBe(true);
        expect(f.tenantHeaders).toEqual(new Set(['learncard', 'vetpass']));
    });
});

// D21: the owner-sealed email brand comes from one strategy config value, so
// every enrollment path that seals the recovery contact also seals the brand,
// and no path that carries (or seals no contact) ever sends one.
describe('Owner-sealed escrow email brand (D21)', () => {
    const vetpass = {
        appTenant: 'vetpass',
        authorityTenant: 'learncard',
        emailBrand: '  Vet  Pass ',
    } as const;
    const pinEnroll = (f: Awaited<ReturnType<typeof setup>>) =>
        f.strategy.ensureEscrowEnrollment!({
            ...f.params,
            options: { ...f.params.options, pin: '135790' },
        });

    it('rejects an invalid email brand at construction', () => {
        for (const emailBrand of ['', 'vetpass.com', 'Vet\nPass', 'Call 5551234', 'a'.repeat(33)])
            expect(() =>
                createSSSStrategy({
                    serverUrl: 'https://example.test',
                    tenantId: 'vetpass',
                    escrow: {
                        enabled: true,
                        attestation: { mode: 'software', pinnedPublicKeys: [] },
                        emailBrand,
                    },
                })
            ).toThrow('Invalid escrow email brand');
    });

    it('seals the canonical brand with the contact on first enroll, PIN change and clear', async () => {
        const f = await setup(false, vetpass);
        await pinEnroll(f);
        expect(f.enrollments.at(-1)).toMatchObject({
            action: 'enroll',
            recoveryEmail: 'owner@example.com',
            recoveryBrand: 'Vet Pass',
        });
        await f.strategy.setEscrowPin!({ ...f.params, pin: '824957' });
        expect(f.enrollments.at(-1)).toMatchObject({
            action: 'replace',
            recoveryBrand: 'Vet Pass',
        });
        await f.strategy.clearEscrowPin!(f.params);
        expect(f.enrollments.at(-1)).toMatchObject({
            action: 'replace',
            recoveryBrand: 'Vet Pass',
        });
        // The brand is not part of the signed intent (bound via the target identity).
        expect(f.intents.at(-1)!.intent).not.toHaveProperty('recoveryBrand');
        expect((await f.sealed())?.recoveryBrand).toBe('Vet Pass');
    });

    it('never sends the brand on a carry; the authority inherits the sealed one', async () => {
        const f = await setup(false, vetpass);
        await f.strategy.setEscrowPin!({ ...f.params, pin: '593827' });
        f.advance();
        await f.strategy.ensureEscrowEnrollment!(f.params);
        expect(f.intents.at(-1)?.intent).toMatchObject({ action: 'carry', pinAction: 'keep' });
        expect(f.enrollments.at(-1)).toMatchObject({ action: 'carry' });
        expect(f.enrollments.at(-1)!.recoveryBrand).toBeUndefined();
        expect(f.enrollments.at(-1)!.recoveryEmail).toBeUndefined();
        expect((await f.sealed())?.recoveryBrand).toBe('Vet Pass');
    });

    it('seals the brand on the PIN sign-in keep/refresh re-set', async () => {
        const f = await setup(false, vetpass);
        await pinEnroll(f);
        f.spend();
        f.faults.wrongPinAttempts = 0;
        const before = f.enrollments.length;
        await expect(
            f.strategy.executeRecovery({
                token: 'token',
                providerType: 'firebase',
                input: { method: 'escrow-pin', pin: '135790', expectedDid: owner.intent.did },
                didFromPrivateKey: async () => owner.intent.did,
                signDidAuthVp: f.params.signDidAuthVp,
                options: f.params.options,
            })
        ).resolves.toMatchObject({ pinSignIn: { mode: 'kept', pinRefreshed: true } });
        expect(f.enrollments.length).toBeGreaterThan(before);
        expect(f.enrollments.at(-1)).toMatchObject({
            action: 'replace',
            recoveryBrand: 'Vet Pass',
        });
    });

    it('seals the brand on the post-recovery rebind enrollment', async () => {
        const f = await setup(false, vetpass);
        const hold = await f.strategy.startEscrowRecovery!({
            recoverySessionToken: 'otp-session',
            expectedDid: owner.intent.did,
        });
        await f.strategy.executeRecovery({
            token: '',
            providerType: 'firebase',
            input: { method: 'escrow', ...hold, resumeToken: hold.resumeToken! },
            didFromPrivateKey: async () => owner.intent.did,
        });
        await f.strategy.completeIdentityRecovery!(f.params);
        expect(f.enrollments.at(-1)).toMatchObject({
            action: 'enroll',
            recoveryBrand: 'Vet Pass',
        });
    });

    it('seals no brand when the config leaves it unset', async () => {
        const f = await setup(false, { appTenant: 'vetpass', authorityTenant: 'learncard' });
        await pinEnroll(f);
        await f.strategy.setEscrowPin!({ ...f.params, pin: '824957' });
        expect(f.enrollments.length).toBeGreaterThan(0);
        expect(f.enrollments.every(e => e.recoveryBrand === undefined)).toBe(true);
        expect(await f.sealed()).not.toHaveProperty('recoveryBrand');
    });
});
