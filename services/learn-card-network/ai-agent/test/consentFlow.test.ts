import { describe, expect, it } from 'vitest';

import { createConsentFlowRuntime } from '../src/consentFlow';
import type { ServiceConfig } from '../src/config';
import type { AgentNetworkWallet } from '../src/helpers/learnCard.helpers';

const testConfig: ServiceConfig = {
    model: 'test-model',
    port: 0,
    networkUrl: 'http://localhost:4000/trpc',
    maxToolRounds: 3,
    consentFlowAppUrl: 'https://learncard.app',
    consentFlowDataPageSize: 100,
    consentFlowDataMaxPages: 10,
    consentFlowCredentialReadLimit: 50,
    mongoDbName: 'test-ai-agent',
    selfImprovementEnabled: true,
    retroModel: 'retro-model',
    retroMaxTraceChars: 24_000,
};

describe('createConsentFlowRuntime', () => {
    it('creates a development service profile before auto-creating a development contract', async () => {
        const calls: string[] = [];
        let profile: unknown;
        let createdProfileInput: Record<string, unknown> | undefined;

        const wallet = {
            id: {
                did: async () => 'did:key:zAgentDevelopmentSeed',
            },
            invoke: {
                getProfile: async () => {
                    calls.push('getProfile');

                    return profile;
                },
                createServiceProfile: async (input: Record<string, unknown>) => {
                    calls.push('createServiceProfile');
                    createdProfileInput = input;
                    profile = { ...input, did: 'did:web:localhost%3A4000:users:ai-agent' };

                    return 'did:web:localhost%3A4000:users:ai-agent';
                },
                createContract: async (input: { name: string }) => {
                    calls.push('createContract');
                    expect(profile).toBeTruthy();
                    expect(input.name).toBe('LearnCard AI Agent Development Contract');

                    return 'lc:network:localhost%3A4000/trpc:contract:agent';
                },
            },
        } as unknown as AgentNetworkWallet;

        const runtime = createConsentFlowRuntime(testConfig, undefined, {
            getWallet: async () => wallet,
        });
        const contract = await runtime.getContractInfo();

        expect(contract).toEqual({
            uri: 'lc:network:localhost%3A4000/trpc:contract:agent',
            consentUrl:
                'https://learncard.app/consent-flow?uri=lc%3Anetwork%3Alocalhost%253A4000%2Ftrpc%3Acontract%3Aagent',
            source: 'created-development',
            created: true,
        });
        expect(calls).toEqual(['getProfile', 'createServiceProfile', 'createContract']);
        expect(createdProfileInput).toMatchObject({
            profileId: expect.stringMatching(/^ai-agent-[a-f0-9]{24}$/),
            displayName: 'LearnCard AI Agent',
            type: 'service',
            profileVisibility: 'private',
            allowConnectionRequests: 'invite_only',
        });
    });

    it('uses a configured contract without requiring a wallet profile', async () => {
        let getWalletCalled = false;
        const runtime = createConsentFlowRuntime(
            {
                ...testConfig,
                consentFlowContractUri: 'lc:network:localhost%3A4000/trpc:contract:configured',
            },
            undefined,
            {
                getWallet: async () => {
                    getWalletCalled = true;
                    throw new Error('Wallet should not be loaded for configured contracts.');
                },
            }
        );

        await expect(runtime.getContractInfo()).resolves.toMatchObject({
            uri: 'lc:network:localhost%3A4000/trpc:contract:configured',
            source: 'configured',
            created: false,
        });
        expect(getWalletCalled).toBe(false);
    });

    it('still requires an explicit contract URI for production network config', async () => {
        let getWalletCalled = false;
        const runtime = createConsentFlowRuntime(
            {
                ...testConfig,
                networkUrl: 'https://network.learncard.com/trpc',
            },
            undefined,
            {
                getWallet: async () => {
                    getWalletCalled = true;
                    throw new Error('Wallet should not be loaded for production config errors.');
                },
            }
        );

        await expect(runtime.getContractInfo()).rejects.toThrow(
            'AI_AGENT_CONSENT_FLOW_CONTRACT_URI must be set'
        );
        expect(getWalletCalled).toBe(false);
    });
});
