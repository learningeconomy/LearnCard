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

    it('adds known SDK metadata for native-bound LearnCard methods', async () => {
        const sendBoost = (async function sendBoost(_profileId: string, _boostUri: string) {
            return 'lc:credential:sent';
        }).bind(undefined);
        const tool = createLearnCardWalletTool({
            getWallet: async () =>
                ({
                    invoke: {
                        sendBoost,
                    },
                } as any),
        });

        await expect(
            tool.execute(
                { operation: 'inspect', path: 'invoke.sendBoost' },
                { runId: 'test-run' }
            )
        ).resolves.toMatchObject({
            path: 'invoke.sendBoost',
            kind: 'function',
            function: {
                name: 'sendBoost',
                path: 'invoke.sendBoost',
                parameters: ['profileId', 'boostUri', 'options?'],
                parametersInferred: true,
                signature: 'sendBoost(profileId, boostUri, options?)',
                description: expect.stringContaining('recipient-specific credential'),
                argumentDetails: [
                    expect.objectContaining({
                        name: 'profileId',
                        type: 'string',
                    }),
                    expect.objectContaining({
                        name: 'boostUri',
                        type: 'string',
                    }),
                    expect.objectContaining({
                        name: 'options',
                    }),
                ],
                notes: expect.arrayContaining([
                    expect.stringContaining('rewrites credentialSubject.id'),
                ]),
                metadataSource: expect.stringContaining('learn-card-network'),
            },
        });
    });

    it('adds structured diagnostics and usage hints to known SDK call failures', async () => {
        const sendBoost = (function sendBoost(_profileId: string, _boostUri: string) {
            throw Object.assign(new Error('Wallet method call failed.'), {
                code: 'FORBIDDEN',
                seed: 'top-secret-seed',
                cause: Object.assign(new Error('Target profile cannot receive this Boost'), {
                    statusCode: 403,
                    data: {
                        reason: 'missing-issue-permission',
                    },
                }),
            });
        }).bind(undefined);
        const tool = createLearnCardWalletTool({
            getWallet: async () =>
                ({
                    invoke: {
                        sendBoost,
                    },
                } as any),
        });

        await expect(
            tool.execute(
                {
                    operation: 'call',
                    path: 'invoke.sendBoost',
                    args: [
                        'taylor',
                        'lc:network:localhost%3A4000/trpc:boost:example',
                        { encrypt: true, skipNotification: true },
                    ],
                },
                { runId: 'test-run' }
            )
        ).rejects.toThrow('"knownUsage": "sendBoost(profileId, boostUri, options?)"');

        try {
            await tool.execute(
                {
                    operation: 'call',
                    path: 'invoke.sendBoost',
                    args: [
                        'taylor',
                        'lc:network:localhost%3A4000/trpc:boost:example',
                        { encrypt: true, skipNotification: true },
                    ],
                },
                { runId: 'test-run' }
            );
        } catch (error) {
            const payload = JSON.parse((error as Error).message);

            expect(payload).toMatchObject({
                error: 'Wallet method call failed',
                method: 'invoke.sendBoost',
                argsSummary: [
                    'taylor',
                    'lc:network:localhost%3A4000/trpc:boost:example',
                    {
                        type: 'object',
                        fields: {
                            encrypt: true,
                            skipNotification: true,
                        },
                    },
                ],
                underlyingError: {
                    name: 'Error',
                    message: 'Wallet method call failed.',
                    code: 'FORBIDDEN',
                    seed: '[redacted]',
                    cause: {
                        name: 'Error',
                        message: 'Target profile cannot receive this Boost',
                        statusCode: 403,
                        data: {
                            reason: 'missing-issue-permission',
                        },
                    },
                },
                knownUsage: 'sendBoost(profileId, boostUri, options?)',
            });
            expect(JSON.stringify(payload)).not.toContain('top-secret-seed');
        }
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
