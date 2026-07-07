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

const createJwt = (nonce: string, holder = 'did:key:user'): string => {
    const payload = Buffer.from(JSON.stringify({ nonce, vp: { holder } })).toString('base64url');

    return `header.${payload}.signature`;
};

const createRequest = (token: string): Request =>
    ({
        get: (header: string) => (header === 'authorization' ? `Bearer ${token}` : undefined),
    } as Request);

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
});
