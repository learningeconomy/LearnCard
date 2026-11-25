import { afterEach, describe, expect, test, mock } from 'bun:test';
import { createHash, randomUUID } from 'node:crypto';
import Redis from 'ioredis';
mock.module('../ai/privacy-keys', () => ({
    getPrivacyKeyMaterial: () => ({ erasureRequest: Buffer.alloc(32, 9) }),
    getPrivacySubjectRef: (did: string) => createHash('sha256').update(did).digest('hex'),
}));
// Load after installing the isolated privacy-key fixture.
const { AuthError, createAuthService } = await import('./service');
const { default: cache } = await import('../utils/cache');
const { requestDataErasure } = await import('../services/dataErasure');
await cache.redis?.quit();
const stores: Redis[] = [];
afterEach(async () => {
    for (const store of stores.splice(0)) {
        const prefix = store.options.keyPrefix!;
        const keys = await store.keys(`${prefix}*`);
        if (keys.length) await store.del(...keys.map(key => key.slice(prefix.length)));
        await store.quit();
    }
});

type VerificationOptions = {
    challenge: string;
    domain: string;
    proofFormat: 'jwt';
    proofPurpose: 'authentication';
};

type VerificationResult = {
    checks: string[];
    errors: string[];
    warnings: string[];
};

const createTestStore = () => {
    const store = new Redis({
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: Number(process.env.REDIS_PORT ?? 6384),
        keyPrefix: `auth-service-test:${randomUUID()}:`,
    });
    stores.push(store);
    cache.redis = store;
    return store;
};

const encodeJwtPart = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

const makePresentation = (holder: string, issuer = holder): string =>
    `${encodeJwtPart({ alg: 'EdDSA' })}.${encodeJwtPart({
        iss: issuer,
        vp: { holder },
    })}.signature`;

const validVerification: VerificationResult = {
    checks: ['proof'],
    errors: [],
    warnings: [],
};

const challengeInput = {
    audience: 'https://api.example.test',
    returnTo: 'https://wallet.example.test',
};

const setup = ({
    now = 1_000,
    verifyPresentation = async () => validVerification,
}: {
    now?: number;
    verifyPresentation?: (
        presentation: string,
        options: VerificationOptions
    ) => Promise<VerificationResult>;
} = {}) => {
    const store = createTestStore();
    let randomValue = 0;
    const service = createAuthService({
        store,
        verifyPresentation,
        now: () => now,
        randomBytes: size => {
            randomValue += 1;

            return Buffer.alloc(size, randomValue);
        },
    });

    return { service, store };
};

describe('challenge-based DID Auth', () => {
    test('creates opaque, expiring challenges with independent browser bindings', async () => {
        const { service } = setup();
        const first = await service.createChallenge(challengeInput);
        const second = await service.createChallenge(challengeInput);

        expect(first.challenge).toHaveLength(43);
        expect(first.binding).toHaveLength(43);
        expect(first.challenge).not.toBe(first.binding);
        expect(second.challenge).not.toBe(first.challenge);
        expect(first.expiresAt).toBeGreaterThan(1_000);
    });

    test('verifies challenge, audience, proof purpose, holder, and issuer', async () => {
        let verificationOptions: VerificationOptions | undefined;
        const { service } = setup({
            verifyPresentation: async (_presentation, options) => {
                verificationOptions = options;

                return validVerification;
            },
        });
        const challenge = await service.createChallenge(challengeInput);
        const result = await service.authenticate({
            challenge: challenge.challenge,
            expectedBinding: challenge.binding,
            expectedReturnTo: challengeInput.returnTo,
            presentation: makePresentation('did:key:holder'),
        });

        expect(result.did).toBe('did:key:holder');
        expect(result.sessionId).toHaveLength(43);
        expect(verificationOptions).toEqual({
            challenge: challenge.challenge,
            domain: challengeInput.audience,
            proofFormat: 'jwt',
            proofPurpose: 'authentication',
        });
    });

    test('rejects a verified presentation when erasure wins before session publication', async () => {
        const { service, store } = setup({
            verifyPresentation: async () => {
                await requestDataErasure('did:key:holder');
                return validVerification;
            },
        });
        const challenge = await service.createChallenge(challengeInput);
        await expect(
            service.authenticate({
                challenge: challenge.challenge,
                expectedBinding: challenge.binding,
                presentation: makePresentation('did:key:holder'),
            })
        ).rejects.toMatchObject({ code: 'data_erasure_requested' });
        expect(await store.keys(`${store.options.keyPrefix}*:did-auth:session:*`)).toEqual([]);
    });

    test('retains authenticated identity for erasure retries while denying new handoffs', async () => {
        const { service } = setup();
        const challenge = await service.createChallenge(challengeInput);
        const session = await service.authenticate({
            challenge: challenge.challenge,
            expectedBinding: challenge.binding,
            presentation: makePresentation('did:key:holder'),
        });
        await requestDataErasure(session.did);
        expect(await service.getSession(session.sessionId)).toMatchObject({
            did: session.did,
        });
        await expect(
            service.createSessionHandoff({
                did: session.did,
                sessionId: session.sessionId,
                origin: 'https://wallet.example.test',
            })
        ).rejects.toMatchObject({ code: 'data_erasure_requested' });
    });

    test('rejects replayed, expired, and unknown challenges', async () => {
        let now = 1_000;
        const store = createTestStore();
        const service = createAuthService({
            store,
            verifyPresentation: async () => validVerification,
            now: () => now,
            randomBytes: size => Buffer.alloc(size, 1),
        });
        const replayed = await service.createChallenge(challengeInput);
        const authentication = {
            challenge: replayed.challenge,
            expectedBinding: replayed.binding,
            presentation: makePresentation('did:key:holder'),
        };

        await service.authenticate(authentication);
        await expect(service.authenticate(authentication)).rejects.toBeInstanceOf(AuthError);

        const expired = await service.createChallenge(challengeInput);

        now = expired.expiresAt;

        await expect(
            service.authenticate({
                challenge: expired.challenge,
                expectedBinding: expired.binding,
                presentation: makePresentation('did:key:holder'),
            })
        ).rejects.toMatchObject({ code: 'challenge_expired' });
        await expect(
            service.authenticate({
                challenge: 'unknown',
                expectedBinding: expired.binding,
                presentation: makePresentation('did:key:holder'),
            })
        ).rejects.toMatchObject({ code: 'challenge_invalid' });
    });

    test('rejects login CSRF binding and return-target mismatches', async () => {
        const { service } = setup();
        const challenge = await service.createChallenge(challengeInput);

        await expect(
            service.authenticate({
                challenge: challenge.challenge,
                expectedBinding: 'attacker-binding',
                presentation: makePresentation('did:key:holder'),
            })
        ).rejects.toMatchObject({ code: 'challenge_invalid' });
        await expect(
            service.authenticate({
                challenge: challenge.challenge,
                expectedBinding: challenge.binding,
                expectedReturnTo: 'https://attacker.example.test',
                presentation: makePresentation('did:key:holder'),
            })
        ).rejects.toMatchObject({ code: 'challenge_invalid' });
        await expect(
            service.authenticate({
                challenge: challenge.challenge,
                expectedBinding: challenge.binding,
                expectedReturnTo: challengeInput.returnTo,
                presentation: makePresentation('did:key:holder'),
            })
        ).resolves.toMatchObject({ did: 'did:key:holder' });
    });

    test('rejects tampered proofs and mismatched DID claims', async () => {
        const { service } = setup({
            verifyPresentation: async presentation =>
                presentation.includes('tampered')
                    ? { checks: [], errors: ['invalid signature'], warnings: [] }
                    : validVerification,
        });
        const tampered = await service.createChallenge(challengeInput);

        await expect(
            service.authenticate({
                challenge: tampered.challenge,
                expectedBinding: tampered.binding,
                presentation: `${makePresentation('did:key:holder')}tampered`,
            })
        ).rejects.toMatchObject({ code: 'presentation_invalid' });
        await expect(
            service.authenticate({
                challenge: tampered.challenge,
                expectedBinding: tampered.binding,
                presentation: makePresentation('did:key:holder'),
            })
        ).rejects.toMatchObject({ code: 'challenge_invalid' });

        const mismatch = await service.createChallenge(challengeInput);

        await expect(
            service.authenticate({
                challenge: mismatch.challenge,
                expectedBinding: mismatch.binding,
                presentation: makePresentation('did:key:holder', 'did:key:attacker'),
            })
        ).rejects.toMatchObject({ code: 'presentation_invalid' });

        const fresh = await service.createChallenge(challengeInput);

        await expect(
            service.authenticate({
                challenge: fresh.challenge,
                expectedBinding: fresh.binding,
                presentation: makePresentation('did:key:holder'),
            })
        ).resolves.toMatchObject({ did: 'did:key:holder' });
    });

    test('accepts verified presentations with non-fatal DIDKit warnings', async () => {
        const { service } = setup({
            verifyPresentation: async () => ({
                checks: ['proof'],
                errors: [],
                warnings: ['credential status was not checked'],
            }),
        });
        const challenge = await service.createChallenge(challengeInput);

        await expect(
            service.authenticate({
                challenge: challenge.challenge,
                expectedBinding: challenge.binding,
                presentation: makePresentation('did:key:holder'),
            })
        ).resolves.toMatchObject({ did: 'did:key:holder' });
    });

    test('atomically claims a challenge before expensive verification', async () => {
        const verificationStarted = Promise.withResolvers<void>();
        const verificationRelease = Promise.withResolvers<void>();
        let verificationCalls = 0;
        const { service, store } = setup({
            verifyPresentation: async () => {
                verificationCalls += 1;
                verificationStarted.resolve();
                await verificationRelease.promise;

                return validVerification;
            },
        });
        const challenge = await service.createChallenge(challengeInput);
        const input = {
            challenge: challenge.challenge,
            expectedBinding: challenge.binding,
            presentation: makePresentation('did:key:holder'),
        };
        const first = service.authenticate(input);

        await verificationStarted.promise;

        await expect(service.authenticate(input)).rejects.toMatchObject({
            code: 'challenge_invalid',
        });
        expect(verificationCalls).toBe(1);

        verificationRelease.resolve();
        await expect(first).resolves.toMatchObject({ did: 'did:key:holder' });

        expect(await store.keys(`${store.options.keyPrefix}*:did-auth:session:*`)).toHaveLength(1);
    });

    test('mints origin-bound, single-use session handoffs', async () => {
        const { service } = setup();
        const challenge = await service.createChallenge(challengeInput);
        const session = await service.authenticate({
            challenge: challenge.challenge,
            expectedBinding: challenge.binding,
            presentation: makePresentation('did:key:holder'),
        });
        const handoff = await service.createSessionHandoff({
            did: session.did,
            origin: 'https://wallet.example.test',
            sessionId: session.sessionId,
        });

        await expect(
            service.consumeSessionHandoff(handoff.handoff, 'https://wallet.example.test')
        ).resolves.toEqual({
            did: 'did:key:holder',
            sessionId: session.sessionId,
        });
        await expect(
            service.consumeSessionHandoff(handoff.handoff, 'https://wallet.example.test')
        ).rejects.toMatchObject({ code: 'session_handoff_replayed' });

        const wrongOrigin = await service.createSessionHandoff({
            did: session.did,
            origin: 'https://wallet.example.test',
            sessionId: session.sessionId,
        });

        await expect(
            service.consumeSessionHandoff(wrongOrigin.handoff, 'https://attacker.example.test')
        ).rejects.toMatchObject({ code: 'session_handoff_invalid' });
    });

    test('mints origin-bound, expiring, single-use WebSocket tickets', async () => {
        let now = 1_000;
        const store = createTestStore();
        let randomValue = 0;
        const service = createAuthService({
            store,
            verifyPresentation: async () => validVerification,
            now: () => now,
            randomBytes: size => {
                randomValue += 1;

                return Buffer.alloc(size, randomValue);
            },
        });
        const challenge = await service.createChallenge(challengeInput);
        const session = await service.authenticate({
            challenge: challenge.challenge,
            expectedBinding: challenge.binding,
            presentation: makePresentation('did:key:holder'),
        });
        const ticket = await service.createWebSocketTicket({
            did: session.did,
            origin: 'https://wallet.example.test',
            sessionId: session.sessionId,
        });

        await expect(
            service.consumeWebSocketTicket(ticket.ticket, 'https://wallet.example.test')
        ).resolves.toEqual({
            did: 'did:key:holder',
            sessionId: session.sessionId,
        });
        await expect(
            service.consumeWebSocketTicket(ticket.ticket, 'https://wallet.example.test')
        ).rejects.toMatchObject({ code: 'websocket_ticket_replayed' });

        const wrongOrigin = await service.createWebSocketTicket({
            did: session.did,
            origin: 'https://wallet.example.test',
            sessionId: session.sessionId,
        });

        await expect(
            service.consumeWebSocketTicket(wrongOrigin.ticket, 'https://attacker.example.test')
        ).rejects.toMatchObject({ code: 'websocket_ticket_invalid' });

        const expired = await service.createWebSocketTicket({
            did: session.did,
            origin: 'https://wallet.example.test',
            sessionId: session.sessionId,
        });

        now = expired.expiresAt;

        await expect(
            service.consumeWebSocketTicket(expired.ticket, 'https://wallet.example.test')
        ).rejects.toMatchObject({ code: 'websocket_ticket_expired' });
        await expect(
            service.consumeWebSocketTicket('malformed', 'https://wallet.example.test')
        ).rejects.toMatchObject({ code: 'websocket_ticket_invalid' });
    });
});

for (const origin of ['https://lca-backend.fly.dev', 'https://ai-passport.fly.dev']) {
    test(`${origin} service-profile login returns to its backend and handoff stays origin-bound`, async () => {
        const { service } = setup();
        const challenge = await service.createChallenge({
            audience: origin,
            returnTo: origin + '/admin',
        });
        const result = await service.authenticate({
            challenge: challenge.challenge,
            expectedBinding: challenge.binding,
            presentation: makePresentation('did:web:service-profile'),
        });
        expect(result.returnTo).toBe(origin + '/admin');
        const handoff = await service.createSessionHandoff({
            did: result.did,
            origin,
            sessionId: result.sessionId,
        });
        await expect(service.consumeSessionHandoff(handoff.handoff, origin)).resolves.toEqual({
            did: result.did,
            sessionId: result.sessionId,
        });
        await expect(service.consumeSessionHandoff(handoff.handoff, origin)).rejects.toMatchObject({
            code: 'session_handoff_replayed',
        });
        const wrong = await service.createSessionHandoff({
            did: result.did,
            origin,
            sessionId: result.sessionId,
        });
        await expect(
            service.consumeSessionHandoff(wrong.handoff, 'https://attacker.test')
        ).rejects.toMatchObject({ code: 'session_handoff_invalid' });
    });
}
