import type { Request } from 'express';
import { describe, expect, it, vi } from 'vitest';

import type { ServiceConfig } from '../src/config';
import {
    AgentDidAuthError,
    createInMemoryDidAuthChallengeStore,
    hashChallenge,
    verifyDidAuthRequest,
    type AgentDidAuthVerifierLearnCard,
} from '../src/security/didAuth';

const config: ServiceConfig = {
    nodeEnv: 'test',
    model: 'test-model',
    port: 0,
    maxToolRounds: 3,
    consentFlowAppUrl: 'https://learncard.app',
    consentFlowDataPageSize: 100,
    consentFlowDataMaxPages: 10,
    consentFlowCredentialReadLimit: 50,
    mongoDbName: 'test-ai-agent',
    selfImprovementEnabled: true,
    retroModel: 'retro-model',
    retroMaxTraceChars: 24_000,
    authChallengeTtlMs: 300_000,
    encryptionKeyId: 'test-key',
    debugEnabled: true,
};

const createJwt = (nonce: string, holder = 'did:key:user', iss?: unknown): string => {
    const payload = Buffer.from(JSON.stringify({ nonce, iss, vp: { holder } })).toString(
        'base64url'
    );

    return `header.${payload}.signature`;
};

const createRequest = (token: string): Request =>
    ({
        get: (header: string) => (header === 'authorization' ? `Bearer ${token}` : undefined),
    }) as Request;

describe('DID Auth security', () => {
    it('verifies JWT VP challenge metadata and consumes the challenge', async () => {
        const challengeStore = createInMemoryDidAuthChallengeStore();
        const challenge = 'challenge-1';
        const domain = 'https://agent.learncard.test';
        const verifyPresentation = vi.fn().mockResolvedValue({
            warnings: [],
            errors: [],
            checks: ['JWS'],
        });
        const verifier: AgentDidAuthVerifierLearnCard = { invoke: { verifyPresentation } };

        await challengeStore.insert(challenge, domain, 300_000);

        const context = await verifyDidAuthRequest(createRequest(createJwt(challenge)), {
            config,
            challengeStore,
            getVerifierLearnCard: async () => verifier,
        });

        expect(context).toEqual({ did: 'did:key:user', challenge, domain });
        expect(verifyPresentation).toHaveBeenCalledWith(createJwt(challenge), {
            proofFormat: 'jwt',
            challenge,
            domain,
            proofPurpose: 'authentication',
        });
        expect(await challengeStore.getByHash(hashChallenge(challenge))).toBeUndefined();
    });

    it('rejects replayed or failed challenge presentations', async () => {
        const challengeStore = createInMemoryDidAuthChallengeStore();
        const challenge = 'challenge-1';
        const verifier: AgentDidAuthVerifierLearnCard = {
            invoke: {
                verifyPresentation: vi
                    .fn()
                    .mockResolvedValue({ warnings: [], errors: [], checks: [] }),
            },
        };

        await challengeStore.insert(challenge, 'https://agent.learncard.test', 300_000);

        await expect(
            verifyDidAuthRequest(createRequest(createJwt(challenge)), {
                config,
                challengeStore,
                getVerifierLearnCard: async () => verifier,
            })
        ).rejects.toBeInstanceOf(AgentDidAuthError);

        verifier.invoke.verifyPresentation = vi.fn().mockResolvedValue({
            warnings: [],
            errors: [],
            checks: ['JWS'],
        });

        await verifyDidAuthRequest(createRequest(createJwt(challenge)), {
            config,
            challengeStore,
            getVerifierLearnCard: async () => verifier,
        });

        await expect(
            verifyDidAuthRequest(createRequest(createJwt(challenge)), {
                config,
                challengeStore,
                getVerifierLearnCard: async () => verifier,
            })
        ).rejects.toBeInstanceOf(AgentDidAuthError);
    });

    it('rejects issuer/holder disagreement before verification without consuming the challenge', async () => {
        const challengeStore = createInMemoryDidAuthChallengeStore();
        const challenge = 'identity-binding';
        const verifyPresentation = vi.fn().mockResolvedValue({
            warnings: [],
            errors: [],
            checks: ['JWS'],
        });
        const dependencies = {
            config,
            challengeStore,
            getVerifierLearnCard: async () => ({ invoke: { verifyPresentation } }),
        };
        await challengeStore.insert(challenge, 'https://agent.learncard.test', 300_000);

        await expect(
            verifyDidAuthRequest(
                createRequest(createJwt(challenge, 'did:key:learner', 'did:key:other')),
                dependencies
            )
        ).rejects.toBeInstanceOf(AgentDidAuthError);
        expect(verifyPresentation).not.toHaveBeenCalled();

        // The same challenge can still authenticate the coherent, verified identity.
        const request = createRequest(createJwt(challenge, 'did:key:learner', 'did:key:learner'));
        await expect(verifyDidAuthRequest(request, dependencies)).resolves.toMatchObject({
            did: 'did:key:learner',
        });
        await expect(verifyDidAuthRequest(request, dependencies)).rejects.toBeInstanceOf(
            AgentDidAuthError
        );
    });

    it('does not treat a malformed issuer as an absent holder-only issuer', async () => {
        const challengeStore = createInMemoryDidAuthChallengeStore();
        const verifyPresentation = vi.fn().mockResolvedValue({
            warnings: [],
            errors: [],
            checks: ['JWS'],
        });
        await challengeStore.insert('invalid-issuer', 'https://agent.learncard.test', 300_000);
        await expect(
            verifyDidAuthRequest(
                createRequest(createJwt('invalid-issuer', 'did:key:user', { id: 'did:key:user' })),
                {
                    config,
                    challengeStore,
                    getVerifierLearnCard: async () => ({ invoke: { verifyPresentation } }),
                }
            )
        ).rejects.toBeInstanceOf(AgentDidAuthError);
        expect(verifyPresentation).not.toHaveBeenCalled();
    });

    it('atomically accepts only one concurrent use of a verified challenge', async () => {
        const challengeStore = createInMemoryDidAuthChallengeStore();
        let finishVerification: () => void = () => undefined;
        const bothVerifying = new Promise<void>(resolve => {
            finishVerification = resolve;
        });
        let verifying = 0;
        const verifyPresentation = vi.fn(async () => {
            verifying += 1;
            if (verifying === 2) finishVerification();
            await bothVerifying;
            return { warnings: [], errors: [], checks: ['JWS'] };
        });
        await challengeStore.insert('concurrent', 'https://agent.learncard.test', 300_000);
        const dependencies = {
            config,
            challengeStore,
            getVerifierLearnCard: async () => ({ invoke: { verifyPresentation } }),
        };
        const request = createRequest(createJwt('concurrent'));
        const results = await Promise.allSettled([
            verifyDidAuthRequest(request, dependencies),
            verifyDidAuthRequest(request, dependencies),
        ]);
        expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
        const rejected = results.find(result => result.status === 'rejected');
        expect(rejected?.status === 'rejected' && rejected.reason).toBeInstanceOf(
            AgentDidAuthError
        );
    });
});
