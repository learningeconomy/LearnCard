import { describe, expect, it } from 'vitest';

import { createLearnCardWalletTool } from '../src/tools/learnCardWallet';

describe('createLearnCardWalletTool', () => {
    it('inspects available wallet paths', async () => {
        const tool = createLearnCardWalletTool({
            getWallet: async () =>
                ({
                    id: {
                        did: async () => 'did:example:agent',
                    },
                    invoke: {
                        getProfile: async () => ({ profileId: 'agent' }),
                    },
                } as any),
        });

        await expect(
            tool.execute({ operation: 'inspect', path: '' }, { runId: 'test-run' })
        ).resolves.toMatchObject({
            path: '',
            kind: 'object',
            objects: expect.arrayContaining([
                { name: 'id', path: 'id' },
                { name: 'invoke', path: 'invoke' },
            ]),
            counts: {
                functions: 0,
                objects: 2,
                values: 0,
                total: 2,
                returned: 2,
            },
        });
    });

    it('inspects function signatures and filters large namespaces', async () => {
        const tool = createLearnCardWalletTool({
            getWallet: async () =>
                ({
                    invoke: {
                        getBoost: async (boostUri: string) => ({ boostUri }),
                        getProfile: async (profileId?: string) => ({ profileId }),
                        searchProfiles: async (query: string) => [{ profileId: query }],
                    },
                } as any),
        });

        await expect(
            tool.execute(
                { operation: 'inspect', path: 'invoke', query: 'profile' },
                { runId: 'test-run' }
            )
        ).resolves.toMatchObject({
            path: 'invoke',
            functions: [
                {
                    name: 'getProfile',
                    path: 'invoke.getProfile',
                    arity: 1,
                    parameters: ['profileId'],
                    signature: 'async getProfile(profileId)',
                },
                {
                    name: 'searchProfiles',
                    path: 'invoke.searchProfiles',
                    arity: 1,
                    parameters: ['query'],
                    signature: 'async searchProfiles(query)',
                },
            ],
            counts: {
                functions: 2,
                total: 2,
                returned: 2,
            },
        });

        await expect(
            tool.execute(
                { operation: 'inspect', path: 'invoke.searchProfiles' },
                { runId: 'test-run' }
            )
        ).resolves.toMatchObject({
            path: 'invoke.searchProfiles',
            kind: 'function',
            function: {
                name: 'searchProfiles',
                path: 'invoke.searchProfiles',
                arity: 1,
                parameters: ['query'],
                signature: 'async searchProfiles(query)',
            },
        });
    });

    it('calls a nested wallet method with positional arguments', async () => {
        const requestedProfileIds: string[] = [];
        const tool = createLearnCardWalletTool({
            getWallet: async () =>
                ({
                    invoke: {
                        getProfile: async (profileId: string) => {
                            requestedProfileIds.push(profileId);

                            return { profileId };
                        },
                    },
                } as any),
        });

        await expect(
            tool.execute(
                {
                    operation: 'call',
                    path: 'invoke.getProfile',
                    args: ['target-profile'],
                },
                { runId: 'test-run' }
            )
        ).resolves.toEqual({
            path: 'invoke.getProfile',
            result: { profileId: 'target-profile' },
            resultType: 'object',
            hasResult: true,
        });
        expect(requestedProfileIds).toEqual(['target-profile']);
    });

    it('makes undefined call results explicit', async () => {
        const tool = createLearnCardWalletTool({
            getWallet: async () =>
                ({
                    invoke: {
                        getProfile: async () => undefined,
                    },
                } as any),
        });

        await expect(
            tool.execute(
                {
                    operation: 'call',
                    path: 'invoke.getProfile',
                    args: [],
                },
                { runId: 'test-run' }
            )
        ).resolves.toEqual({
            path: 'invoke.getProfile',
            result: null,
            resultType: 'undefined',
            hasResult: false,
        });
    });

    it('rejects unsafe wallet paths', async () => {
        const tool = createLearnCardWalletTool({
            getWallet: async () => ({ invoke: {} } as any),
        });

        await expect(
            tool.execute({ operation: 'inspect', path: '__proto__' }, { runId: 'test-run' })
        ).rejects.toThrow('Unsafe wallet path segment');
    });

    it('requires a configured wallet seed when no wallet factory is provided', async () => {
        const tool = createLearnCardWalletTool({});

        await expect(
            tool.execute({ operation: 'inspect', path: '' }, { runId: 'test-run' })
        ).rejects.toThrow('AI_AGENT_WALLET_SEED');
    });
});
