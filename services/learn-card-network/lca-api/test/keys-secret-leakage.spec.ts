/**
 * P0-4: Secret leakage — telemetry.
 *
 * Verifies that /keys/* routes never let share/token/recovery-key material
 * reach Sentry: (1) the exported redaction helper strips every secret-shaped
 * field from a realistic payload, and (2) exercising real /keys/* route
 * handlers with sentinel values registers a Sentry scope event processor
 * that redacts those sentinels from anything Sentry would capture.
 */
import * as Sentry from '@sentry/serverless';

import { redactSecretFields } from '@routes';
import { getClient, getUser } from './helpers/getClient';

import { client } from '@mongo';

const SENTINEL_SHARE = 'SENTINEL_SHARE_XYZ';
const SENTINEL_TOKEN = 'SENTINEL_TOKEN_XYZ';

const makeMockToken = (email: string, uid: string): string => {
    const payload = Buffer.from(JSON.stringify({ sub: uid, email })).toString('base64url');
    return `header.${payload}.signature`;
};

beforeAll(async () => {
    process.env.IS_E2E_TEST = 'true';
    process.env.SEED ||= 'a'.repeat(64);

    try {
        await client.connect();
    } catch (error) {
        console.error(error);
    }
});

afterAll(async () => {
    try {
        await client.close();
    } catch (error) {
        console.error(error);
    }
});

describe('redactSecretFields', () => {
    it('redacts every secret-shaped field from a realistic /keys/* payload', () => {
        const payload = {
            authToken: SENTINEL_TOKEN,
            authShare: { encryptedData: SENTINEL_SHARE, encryptedDek: 'x', iv: 'iv' },
            emailShare: SENTINEL_SHARE,
            encryptedShare: { encryptedData: SENTINEL_SHARE, iv: 'iv' },
            recoveryKey: SENTINEL_SHARE,
            seed: SENTINEL_SHARE,
            blob: SENTINEL_SHARE,
            credentialId: 'not-a-secret-cred-id',
            providerType: 'firebase',
            type: 'passkey',
        };

        const redacted = redactSecretFields(payload) as Record<string, unknown>;

        expect(redacted.authToken).toBe('[Redacted]');
        expect(redacted.authShare).toBe('[Redacted]');
        expect(redacted.emailShare).toBe('[Redacted]');
        expect(redacted.encryptedShare).toBe('[Redacted]');
        expect(redacted.recoveryKey).toBe('[Redacted]');
        expect(redacted.seed).toBe('[Redacted]');
        expect(redacted.blob).toBe('[Redacted]');
        // Non-secret fields survive untouched
        expect(redacted.credentialId).toBe('not-a-secret-cred-id');
        expect(redacted.providerType).toBe('firebase');
        expect(redacted.type).toBe('passkey');

        const serialized = JSON.stringify(redacted);
        expect(serialized).not.toContain(SENTINEL_SHARE);
        expect(serialized).not.toContain(SENTINEL_TOKEN);
    });

    it('redacts nested secret-shaped fields recursively', () => {
        const payload = {
            recoveryMethods: [
                { type: 'backup', encryptedShare: { encryptedData: SENTINEL_SHARE, iv: 'iv' } },
            ],
        };

        const redacted = redactSecretFields(payload) as {
            recoveryMethods: { encryptedShare: unknown }[];
        };

        expect(redacted.recoveryMethods[0]!.encryptedShare).toBe('[Redacted]');
    });

    it('leaves keys that do not match the secret pattern alone', () => {
        const payload = { credentialId: SENTINEL_TOKEN, providerType: 'firebase' };

        const redacted = redactSecretFields(payload) as Record<string, unknown>;

        expect(redacted.credentialId).toBe(SENTINEL_TOKEN);
        expect(redacted.providerType).toBe('firebase');
    });
});

// Minimal structural stand-in for a Sentry Scope — just enough surface for
// openRoute's middleware (setTransactionName + addEventProcessor) to run
// against, so the test can capture exactly which processor functions get
// registered without depending on the real SDK's global hub/scope wiring.
interface FakeScope {
    setTransactionName: (name: string) => void;
    addEventProcessor: (fn: (event: Record<string, unknown>) => unknown) => void;
}

describe('Sentry event processor for /keys/* routes', () => {
    it('registers a redacting event processor for every /keys/* call, using sentinel inputs', async () => {
        const email = `p04-sentry-${Date.now()}@example.com`;
        const token = makeMockToken(email, `p04-uid-${Date.now()}`);
        const { learnCard } = await getUser(`b${'1'.repeat(63)}`);
        const authedCaller = getClient({ did: learnCard.id.did(), isChallengeValid: true });

        const registeredProcessors: Array<(event: Record<string, unknown>) => unknown> = [];

        const configureScopeSpy = vi
            .spyOn(Sentry, 'configureScope')
            .mockImplementation((callback: (scope: FakeScope) => void) => {
                callback({
                    setTransactionName: () => undefined,
                    addEventProcessor: fn => registeredProcessors.push(fn),
                });
            });

        try {
            // Exercise every /keys/* route that accepts share/token-shaped
            // input, with sentinel values, exactly as a real client would.
            await authedCaller.keys.storeAuthShare({
                authToken: token,
                providerType: 'firebase',
                authShare: { encryptedData: SENTINEL_SHARE, encryptedDek: 'x', iv: 'iv' },
                primaryDid: learnCard.id.did(),
            });

            await authedCaller.keys.addRecoveryMethod({
                authToken: token,
                providerType: 'firebase',
                type: 'backup',
                encryptedShare: { encryptedData: SENTINEL_SHARE, iv: 'iv' },
            });

            await getClient().keys.getAuthShare({ authToken: token, providerType: 'firebase' });
            await getClient().keys.getRecoveryShare({
                authToken: token,
                providerType: 'firebase',
                type: 'backup',
            });
            await expect(
                authedCaller.keys.sendEmailBackup({
                    authToken: token,
                    providerType: 'firebase',
                    relayPayload: {
                        version: 1,
                        algorithm: 'P-256-HKDF-SHA256-AES-256-GCM',
                        keyId: 'sentry-test-key',
                        ephemeralPublicKey: 'TESTEPHEMERAL',
                        salt: 'TESTSALT',
                        iv: 'TESTIV',
                        ciphertext: SENTINEL_SHARE,
                    },
                    confirmationCode: '123456',
                    email: 'recovery-target@example.com',
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        } finally {
            configureScopeSpy.mockRestore();
        }

        // attachRpcInput is globally disabled (see routes/index.ts), so
        // Sentry never received the raw input above in the first place.
        // This proves the defense-in-depth layer independently: every one
        // of the five /keys/* calls above registered a redacting processor.
        expect(registeredProcessors.length).toBe(5);

        const syntheticEvent = {
            contexts: {
                trpc: {
                    procedure_type: 'mutation',
                    input: {
                        authToken: SENTINEL_TOKEN,
                        authShare: { encryptedData: SENTINEL_SHARE, encryptedDek: 'x', iv: 'iv' },
                        emailShare: SENTINEL_SHARE,
                    },
                },
            },
            extra: { recoveryKey: SENTINEL_SHARE, credentialId: 'safe-value' },
        };

        // Apply every registered processor, as the real Sentry client would.
        let result: Record<string, unknown> = syntheticEvent;
        for (const processor of registeredProcessors) {
            result = (processor(result) as Record<string, unknown>) ?? result;
        }

        const serialized = JSON.stringify(result);
        expect(serialized).not.toContain(SENTINEL_TOKEN);
        expect(serialized).not.toContain(SENTINEL_SHARE);
        // Confirms redaction is targeted, not a blanket event wipe
        expect(serialized).toContain('safe-value');
    });

    it('does not register the redacting processor for non-/keys/* routes', async () => {
        const registeredProcessors: Array<(event: Record<string, unknown>) => unknown> = [];

        const configureScopeSpy = vi
            .spyOn(Sentry, 'configureScope')
            .mockImplementation((callback: (scope: FakeScope) => void) => {
                callback({
                    setTransactionName: () => undefined,
                    addEventProcessor: fn => registeredProcessors.push(fn),
                });
            });

        try {
            await getClient().utilities.healthCheck();
        } finally {
            configureScopeSpy.mockRestore();
        }

        expect(registeredProcessors).toHaveLength(0);
    });
});
