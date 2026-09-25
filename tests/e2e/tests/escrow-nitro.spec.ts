/**
 * Escrow (Nitro enclave) recovery — end-to-end.
 *
 * Skipped entirely unless ESCROW_E2E=1. This spec drives the REAL client code path
 * (`@learncard/sss-key-manager`'s `createSSSStrategy`) against a REAL running `lca-api`
 * instance over HTTP — it is not a browser/Playwright test, and it does not talk to Mongo
 * or the enclave directly except for the explicitly-gated tamper cases below.
 *
 * Two supported targets, selected entirely by which env vars you set — this file does not
 * start or stop any process itself:
 *
 * 1. LOCAL EMULATOR MODE (default `ESCROW_E2E_LCA_API_URL`, i.e. `http://localhost:5200`):
 *    You must have started, by hand, BOTH of:
 *      a) the Rust enclave emulator (see `services/escrow-enclave-app/README.md`
 *         "Local development"):
 *           export ESCROW_ENCLAVE_EMULATE_TOKEN=contract-test-token
 *           cargo run --features fake-nsm,fake-kms,fake-time,fake-ledger -- \
 *             --emulate 127.0.0.1:5000 --emulate-http 127.0.0.1:8443
 *         For the hold-duration-elapses assertions, additionally set
 *         `ESCROW_ENCLAVE_EMULATE_FIXTURE=$ESCROW_E2E_FIXTURE_PATH` (see below) before
 *         starting the emulator, so this spec can move the clock forward by editing that
 *         file's `nowMs` field.
 *      b) `lca-api` (e.g. `tests/e2e/compose.yaml`'s `lca-api` service, or a bare
 *         `bun run dev`) with `ESCROW_ENCLAVE_MODE=remote`,
 *         `ESCROW_ENCLAVE_REMOTE_URL=http://127.0.0.1:8443`,
 *         `ESCROW_ENCLAVE_REMOTE_TOKEN=contract-test-token` (must match a).
 *    This repo's `tests/e2e/compose.yaml` is intentionally NOT modified by this task to wire
 *    the emulator in automatically — standing it up is a manual step, documented in
 *    `services/escrow-enclave-app/STAGING.md` and above.
 *
 * 2. STAGING MODE: set `ESCROW_E2E_LCA_API_URL` to a real staging lca-api base URL, plus
 *    `ESCROW_E2E_PINNED_PCRS` (JSON `{"pcr0":"...","pcr1":"...","pcr2":"..."}`, 96 lowercase
 *    hex chars each — from `security/escrow-measurements.json` / the tenant config) and
 *    `ESCROW_E2E_ROOT_SHA256` (64 lowercase hex chars; defaults to the real AWS Nitro Root G1
 *    digest pinned in decisions.md D6 if unset). See `services/escrow-enclave-app/STAGING.md`
 *    for the full runbook. Fixture-based time control does not exist against a real enclave —
 *    the hold-duration-elapses assertions are skipped in this mode (see "Honest limits" below).
 *
 * Auth: this harness never talks to real Firebase. `lca-api`'s
 * `src/helpers/auth.helpers.ts` parses the JWT payload WITHOUT verifying the signature
 * whenever `IS_E2E_TEST || IS_OFFLINE` is set server-side (true for the docker-compose
 * `lca-api` service used by this suite) — so `makeMockToken()` below builds an unsigned,
 * dot-separated base64url JSON token locally. This bypass is intentionally server-env-gated;
 * it will NOT work against a real production/staging deployment unless that deployment has
 * deliberately opted into the same flag for a non-production tier — see STAGING.md.
 *
 * Honest limits of this harness (do not "fix" by adding a new time-shortening mechanism —
 * that is explicitly forbidden; the enclave's 7-day `HOLD_DURATION_MS` is a Rust compile-time
 * constant with no override):
 *   - Real Nitro release-after-7-days can only be proven by an actual 7-day wait against
 *     staging (documented as a manual soak step in STAGING.md) or by using the emulator's
 *     pre-existing fixture-file `nowMs` time control in local mode (used here, not invented
 *     here).
 *   - The single-use email "cancel link" route (`POST /keys/escrow/cancel-link`) needs a raw
 *     token that only ever exists inside a real delivered email; `lca-api` has no
 *     test-delivery-capture endpoint for it (unlike brain-service's
 *     `/api/test/last-delivery` used by `docs-quickstart.spec.ts`). This spec therefore
 *     exercises hold cancellation via the authenticated `cancelRecovery` path (DID-owner
 *     cancel) as the primary, fully-real assertion, and documents — rather than fakes — the
 *     cancel-link gap.
 */

import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, readFileSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

import { describe, expect, test } from 'vitest';
import { initLearnCard } from '@learncard/init';
import {
    createSSSStrategy,
    validatePin,
    type EscrowAttestationPolicy,
} from '@learncard/sss-key-manager';

const readFileAsync = promisify(readFile);

// --- Env-driven configuration -----------------------------------------------------------

const ESCROW_E2E = process.env.ESCROW_E2E === '1';
const LCA_API_URL = process.env.ESCROW_E2E_LCA_API_URL ?? 'http://localhost:5200';
const MONGO_URI = process.env.ESCROW_E2E_MONGO_URI;
const MONGO_DB_NAME = process.env.ESCROW_E2E_MONGO_DB_NAME ?? 'lca-api-e2e';
const FIXTURE_PATH = process.env.ESCROW_E2E_FIXTURE_PATH ?? '/tmp/escrow-e2e-fixture.json';
const HOLD_DURATION_MS = 604_800_000; // 7 days — matches the enclave's compile-time constant.
// Never override this to "speed up" a test.

// Local-mode fake NSM PCRs (services/escrow-enclave-app/src/server/emulate.rs `LiveFakeNsm`
// hardcodes PCR0=[0x01;48], PCR1=[0x02;48], PCR2=[0x03;48] — 96 hex chars each).
const LOCAL_FAKE_PCRS = { pcr0: '01'.repeat(48), pcr1: '02'.repeat(48), pcr2: '03'.repeat(48) };
// Real AWS Nitro Root G1 SHA-256, pinned per decisions.md D6. Overridable via env for staging
// if a different root is ever required.
const DEFAULT_ROOT_SHA256 = '641a0321a3e244efe456463195d606317ed7cdcc3c1756e09893f3c68f79bb5b';

const PINNED_PCRS = process.env.ESCROW_E2E_PINNED_PCRS
    ? (JSON.parse(process.env.ESCROW_E2E_PINNED_PCRS) as {
          pcr0: string;
          pcr1: string;
          pcr2: string;
      })
    : LOCAL_FAKE_PCRS;

// NOTE (documented, not silently worked around): the local emulator's `FakeNsm` builds a
// fresh, self-signed test CA chain at process startup (services/escrow-enclave-app/src/nsm/fake.rs).
// Its root certificate's SHA-256 is not a published, stable constant in this repo. Rather than
// guess a digest, local-mode runs OMIT `rootCertificateSha256` from the attestation policy
// below when `ESCROW_E2E_ROOT_SHA256` is unset — if `verifyNitroAttestationDocument` requires a
// root pin unconditionally (i.e. treats "unset" as "reject"), the enrollment step will fail
// fast with a clear attestation error rather than silently passing, and that failure itself is
// the answer to whether local-mode nitro enrollment needs a differently-sourced root pin. This
// is flagged explicitly in this task's issues.md report as an item for a follow-up agent with
// access to a running emulator to resolve definitively.
// Only default to the real AWS root when the caller has explicitly configured staging PCRs
// (ESCROW_E2E_PINNED_PCRS set) — local-mode runs against the emulator's own test CA and must
// not pin the real root.
const ROOT_SHA256 =
    process.env.ESCROW_E2E_ROOT_SHA256 ??
    (process.env.ESCROW_E2E_PINNED_PCRS ? DEFAULT_ROOT_SHA256 : undefined);

const attestationPolicy: EscrowAttestationPolicy = {
    mode: 'nitro',
    pinnedMeasurements: [{ ...PINNED_PCRS }],
    ...(ROOT_SHA256 ? { rootCertificateSha256: ROOT_SHA256 } : {}),
};

// --- Auth helpers (no real Firebase — see file header) ----------------------------------

const base64url = (obj: unknown): string => Buffer.from(JSON.stringify(obj)).toString('base64url');

/** Mirrors `verifyFirebaseToken`'s IS_E2E_TEST/IS_OFFLINE bypass in lca-api's auth.helpers.ts:
 *  the payload is trusted as-is, no signature is checked. Never do this against a real deployment. */
const makeMockToken = (email: string, sub: string): string =>
    `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({ sub, email })}.`;

const providerType = 'firebase' as const;

// --- DID + DID-Auth-VP signing (mirrors apps/learn-card-app's AuthCoordinatorProvider
// `getSigningLearnCard`/`signDidAuthVp` — no network needed for this wallet). ---------------

let didkitPromise: Promise<Buffer> | undefined;
const getDidkit = () => {
    didkitPromise ??= readFileAsync(
        require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
    );
    return didkitPromise;
};

const getSigningLearnCard = async (privateKey: string) =>
    initLearnCard({ seed: privateKey, didkit: await getDidkit() });

const didFromPrivateKey = async (privateKey: string): Promise<string> => {
    const lc = await getSigningLearnCard(privateKey);
    return lc.id.did();
};

const signDidAuthVp = async (privateKey: string, challenge?: string): Promise<string> => {
    const lc = await getSigningLearnCard(privateKey);
    const vpJwt = await lc.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });
    if (!vpJwt || typeof vpJwt !== 'string') throw new Error('Failed to sign DID-Auth VP JWT');
    return vpJwt;
};

// --- Strategy factory ---------------------------------------------------------------------

const buildStrategy = () =>
    createSSSStrategy({
        serverUrl: LCA_API_URL,
        escrow: { enabled: true, attestation: attestationPolicy },
    });

/** Generates a fresh private key and persists its device/auth shares — the real client setup
 *  path (`splitKey`+`storeAuthShare`, exposed atomically as `atomicUpdateShares`), matching how
 *  `docs-quickstart.spec.ts` mints a fresh `SECURE_SEED` per run. */
const setupNewUser = async (
    strategy: ReturnType<typeof buildStrategy>,
    token: string
): Promise<{ privateKey: string; primaryDid: string }> => {
    const privateKey = randomBytes(32).toString('hex');
    const primaryDid = await didFromPrivateKey(privateKey);
    await strategy.atomicUpdateShares!({
        token,
        providerType,
        privateKey,
        did: primaryDid,
        signDidAuthVp,
    });
    return { privateKey, primaryDid };
};

/** `startEscrowRecovery`'s `resumeToken` is `string | null` (null only for legacy hold-only
 *  strategies without resume support); this strategy always returns one. */
const requireResumeToken = (resumeToken: string | null): string => {
    if (!resumeToken) throw new Error('Expected a resume token from startEscrowRecovery');
    return resumeToken;
};

// --- Fixture-based time control (local emulator mode only; pre-existing mechanism — see
// services/escrow-enclave-app/README.md "Local development" fixture section. This spec never
// invents a new time-shortening mechanism; it only edits the fixture file the operator's
// emulator process was told to watch via ESCROW_ENCLAVE_EMULATE_FIXTURE.) -------------------

type EscrowFixture = { nowMs?: number; enrollments?: Record<string, unknown> };

const hasFixtureFile = (): boolean => {
    try {
        readFileSync(FIXTURE_PATH, 'utf8');
        return true;
    } catch {
        return false;
    }
};

const advanceFixtureTimeBy = (deltaMs: number): void => {
    const raw = readFileSync(FIXTURE_PATH, 'utf8');
    const fixture = JSON.parse(raw) as EscrowFixture;
    const base = fixture.nowMs ?? Date.now();
    fixture.nowMs = base + deltaMs;
    writeFileSync(FIXTURE_PATH, JSON.stringify(fixture));
};

// --- Mongo (tamper cases only — gated separately on ESCROW_E2E_MONGO_URI) ------------------

// Minimal shapes for the fields this spec actually reads/writes — `_id` is a plain UUID string
// in both collections (not a Mongo ObjectId), matching `EscrowHoldValidator._id: z.string().uuid()`.
type UserKeyDoc = {
    _id: string;
    authProviders?: { id: string }[];
    escrowPin?: { failedAttempts: number };
    escrowBlob?: unknown;
};
type EscrowHoldDoc = {
    _id: string;
    holdRecord?: { hold?: Record<string, unknown> };
};

const getMongoCollections = async () => {
    // Deep-imported lazily so a missing `mongodb` resolution never breaks the (far more common)
    // non-tamper test run. `tests/e2e/package.json` already depends on `mongodb` for
    // `setup/db-utils.ts`, so this resolves the same way that file's import does.
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(MONGO_URI!);
    await client.connect();
    const db = client.db(MONGO_DB_NAME);
    // Collection names per lca-api's model helpers (`getUserKeysCollection`/
    // `getEscrowHoldsCollection`) — confirmed lowercase, unpluralized-model-name Mongo
    // collections used throughout `services/learn-card-network/lca-api/src/models/`.
    return {
        client,
        userKeys: db.collection<UserKeyDoc>('userkeys'),
        escrowHolds: db.collection<EscrowHoldDoc>('escrowholds'),
    };
};

// --- Suite -----------------------------------------------------------------------------

describe('Escrow Nitro recovery (E2E, gated by ESCROW_E2E=1)', () => {
    test('enroll, hold, early release refused', async ({ skip }) => {
        if (!ESCROW_E2E) {
            skip();
            return;
        }

        const strategy = buildStrategy();
        const email = `escrow-e2e-${randomUUID()}@example.com`;
        const sub = randomUUID();
        const token = makeMockToken(email, sub);

        const { privateKey } = await setupNewUser(strategy, token);

        const enrollment = await strategy.ensureEscrowEnrollment!({
            token,
            providerType,
            privateKey,
            signDidAuthVp,
        });
        expect(enrollment.enrolled).toBe(true);

        const start = await strategy.startEscrowRecovery!({ token, providerType });
        expect(start.holdId).toBeTruthy();
        expect(start.resumeToken).toBeTruthy();

        // Early release (hold just started, nowhere near 7 days old) must be refused.
        await expect(
            strategy.executeRecovery({
                token,
                providerType,
                input: {
                    method: 'escrow',
                    holdId: start.holdId,
                    resumeToken: requireResumeToken(start.resumeToken),
                    clientEphemeralPrivateKey: start.clientEphemeralPrivateKey,
                },
                didFromPrivateKey,
                signDidAuthVp,
            })
        ).rejects.toBeTruthy();

        // Cancel via the authenticated DID-owner path (the real, testable half of "cancel
        // link cancels a hold" — see file header for why the email-link route itself is not
        // exercised here).
        const cancelled = await strategy.cancelEscrowRecovery!({
            token,
            providerType,
            privateKey,
            signDidAuthVp,
        });
        expect(cancelled.cancelled).toBe(true);
    });

    test('hold releases once 7 days have genuinely elapsed (local fixture time-travel only)', async ({
        skip,
    }) => {
        if (!ESCROW_E2E) {
            skip();
            return;
        }
        if (!hasFixtureFile()) {
            skip();
            return; // documented: requires ESCROW_ENCLAVE_EMULATE_FIXTURE wired to FIXTURE_PATH
        }

        const strategy = buildStrategy();
        const email = `escrow-e2e-${randomUUID()}@example.com`;
        const token = makeMockToken(email, randomUUID());

        const { privateKey } = await setupNewUser(strategy, token);
        await strategy.ensureEscrowEnrollment!({ token, providerType, privateKey, signDidAuthVp });
        const start = await strategy.startEscrowRecovery!({ token, providerType });

        advanceFixtureTimeBy(HOLD_DURATION_MS + 60_000);

        const material = await strategy.executeRecovery({
            token,
            providerType,
            input: {
                method: 'escrow',
                holdId: start.holdId,
                resumeToken: requireResumeToken(start.resumeToken),
                clientEphemeralPrivateKey: start.clientEphemeralPrivateKey,
            },
            didFromPrivateKey,
            signDidAuthVp,
        });
        expect(material).toBeTruthy();
    });

    test('PIN hold: wrong PIN refused, correct PIN releases immediately', async ({ skip }) => {
        if (!ESCROW_E2E) {
            skip();
            return;
        }

        const strategy = buildStrategy();
        const email = `escrow-e2e-${randomUUID()}@example.com`;
        const token = makeMockToken(email, randomUUID());
        const pin = '482913';
        expect(validatePin(pin).ok).toBe(true);

        const { privateKey } = await setupNewUser(strategy, token);
        const enrollment = await strategy.ensureEscrowEnrollment!({
            token,
            providerType,
            privateKey,
            signDidAuthVp,
            options: { pin },
        });
        expect(enrollment.enrolled).toBe(true);

        await expect(
            strategy.executeRecovery({
                token,
                providerType,
                input: { method: 'escrow-pin', pin: '000000' },
                didFromPrivateKey,
                signDidAuthVp,
            })
        ).rejects.toBeTruthy();

        const material = await strategy.executeRecovery({
            token,
            providerType,
            input: { method: 'escrow-pin', pin },
            didFromPrivateKey,
            signDidAuthVp,
        });
        expect(material).toBeTruthy();
    });

    describe('Mongo tamper cases (require ESCROW_E2E_MONGO_URI)', () => {
        test('resetting failedAttempts after PIN lockout does not un-lock the enclave', async ({
            skip,
        }) => {
            if (!ESCROW_E2E || !MONGO_URI) {
                skip();
                return;
            }

            const strategy = buildStrategy();
            const email = `escrow-e2e-${randomUUID()}@example.com`;
            const sub = randomUUID();
            const token = makeMockToken(email, sub);
            const pin = '482913';

            const { privateKey } = await setupNewUser(strategy, token);
            await strategy.ensureEscrowEnrollment!({
                token,
                providerType,
                privateKey,
                signDidAuthVp,
                options: { pin },
            });

            // Drive 10 wrong attempts (ESCROW_PIN_MAX_ATTEMPTS) to lock the enclave's own
            // ledger-side PIN budget — the host Mongo counter is defense-in-depth only in
            // `remote` mode (P4.2), the enclave's reserve→verify→commit ledger is the real
            // boundary (D3/D13).
            for (let i = 0; i < 10; i += 1) {
                await expect(
                    strategy.executeRecovery({
                        token,
                        providerType,
                        input: { method: 'escrow-pin', pin: '000000' },
                        didFromPrivateKey,
                        signDidAuthVp,
                    })
                ).rejects.toBeTruthy();
            }

            const { client, userKeys } = await getMongoCollections();
            try {
                await userKeys.updateOne(
                    { 'authProviders.id': sub },
                    { $set: { 'escrowPin.failedAttempts': 0 } }
                );
            } finally {
                await client.close();
            }

            // Even with the host counter reset to 0, the enclave's own budget is exhausted —
            // the correct PIN must still be refused.
            await expect(
                strategy.executeRecovery({
                    token,
                    providerType,
                    input: { method: 'escrow-pin', pin },
                    didFromPrivateKey,
                    signDidAuthVp,
                })
            ).rejects.toBeTruthy();
        });

        test('tampered clientEphemeralPublicKey on a stored hold record is refused', async ({
            skip,
        }) => {
            if (!ESCROW_E2E || !MONGO_URI) {
                skip();
                return;
            }

            const strategy = buildStrategy();
            const email = `escrow-e2e-${randomUUID()}@example.com`;
            const sub = randomUUID();
            const token = makeMockToken(email, sub);

            const { privateKey } = await setupNewUser(strategy, token);
            await strategy.ensureEscrowEnrollment!({
                token,
                providerType,
                privateKey,
                signDidAuthVp,
            });
            const start = await strategy.startEscrowRecovery!({ token, providerType });

            const { client, escrowHolds } = await getMongoCollections();
            try {
                await escrowHolds.updateOne(
                    { _id: start.holdId },
                    {
                        $set: {
                            'holdRecord.hold.clientEphemeralPublicKey':
                                'tampered-key-not-matching-signature',
                        },
                    }
                );
            } finally {
                await client.close();
            }

            // The stored hold record's signature no longer matches its (now-mutated) fields,
            // so the enclave must refuse release regardless of elapsed time.
            await expect(
                strategy.executeRecovery({
                    token,
                    providerType,
                    input: {
                        method: 'escrow',
                        holdId: start.holdId,
                        resumeToken: requireResumeToken(start.resumeToken),
                        clientEphemeralPrivateKey: start.clientEphemeralPrivateKey,
                    },
                    didFromPrivateKey,
                    signDidAuthVp,
                })
            ).rejects.toBeTruthy();
        });

        test('swapping escrowBlob for a stale (pre-re-enrollment) blob is refused', async ({
            skip,
        }) => {
            if (!ESCROW_E2E || !MONGO_URI) {
                skip();
                return;
            }

            const strategy = buildStrategy();
            const email = `escrow-e2e-${randomUUID()}@example.com`;
            const sub = randomUUID();
            const token = makeMockToken(email, sub);

            const { privateKey } = await setupNewUser(strategy, token);
            await strategy.ensureEscrowEnrollment!({
                token,
                providerType,
                privateKey,
                signDidAuthVp,
            });

            const { client, userKeys } = await getMongoCollections();
            let staleBlob: unknown;
            try {
                const before = await userKeys.findOne({ 'authProviders.id': sub });
                staleBlob = (before as { escrowBlob?: unknown } | null)?.escrowBlob;
            } finally {
                await client.close();
            }
            expect(staleBlob).toBeTruthy();

            // Force a re-enrollment, bumping enrollmentEpoch and rotating the blob/blobHash.
            await strategy.ensureEscrowEnrollment!({
                token,
                providerType,
                privateKey,
                signDidAuthVp,
                options: { pin: '135791' },
            });

            const start = await strategy.startEscrowRecovery!({ token, providerType });

            const { client: client2, userKeys: userKeys2 } = await getMongoCollections();
            try {
                await userKeys2.updateOne(
                    { 'authProviders.id': sub },
                    { $set: { escrowBlob: staleBlob } }
                );
            } finally {
                await client2.close();
            }

            await expect(
                strategy.executeRecovery({
                    token,
                    providerType,
                    input: {
                        method: 'escrow',
                        holdId: start.holdId,
                        resumeToken: requireResumeToken(start.resumeToken),
                        clientEphemeralPrivateKey: start.clientEphemeralPrivateKey,
                    },
                    didFromPrivateKey,
                    signDidAuthVp,
                })
            ).rejects.toBeTruthy();
        });
    });
});
