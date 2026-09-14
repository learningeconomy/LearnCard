import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as BrainClientModule from '@learncard/network-brain-client';

import { createLearnCardWalletTool } from '../src/tools/learnCardWallet';
import type { AgentNetworkWallet } from '../src/helpers/learnCard.helpers';

const publicReader = vi.hoisted(() => ({
    getOtherProfile: vi.fn(),
    searchProfiles: vi.fn(),
}));
vi.mock('@learncard/network-brain-client', () => ({
    getAnonymousClient: () => ({
        profile: {
            getOtherProfile: { query: publicReader.getOtherProfile },
            searchProfiles: { query: publicReader.searchProfiles },
        },
    }),
}));

beforeEach(() => {
    publicReader.getOtherProfile
        .mockReset()
        .mockImplementation(async ({ profileId }) => ({ profileId }));
    publicReader.searchProfiles
        .mockReset()
        .mockImplementation(async ({ input }) => [{ profileId: input }]);
});
const context = { runId: 'test-run', ownerDid: 'did:example:learner' };
const boostUri = 'lc:network:localhost%3A4000/trpc:boost:example';
const fixtureTool = (wallet: unknown) =>
    createLearnCardWalletTool({
        getWallet: async () => wallet as AgentNetworkWallet,
    });

describe('createLearnCardWalletTool', () => {
    it('requires trusted owner context before loading the wallet, even when args claim an owner', async () => {
        const getWallet = vi.fn();
        const tool = createLearnCardWalletTool({ getWallet });
        for (const operation of ['call', 'inspect']) {
            await expect(
                tool.execute(
                    { operation, path: 'id.did', ownerDid: 'did:example:spoofed' },
                    { runId: 'anonymous' }
                )
            ).rejects.toThrow('authenticated owner DID');
        }
        expect(getWallet).not.toHaveBeenCalled();
    });

    it.each([
        'invoke.getKey',
        'invoke.getSubjectKeypair',
        'id.keypair',
        'invoke.createSigningAuthority',
        'invoke.registerSigningAuthority',
        'invoke.deleteProfile',
        'invoke.getConnections',
        'invoke.getBoostRecipients',
        'invoke.countBoostRecipients',
        'invoke.getAllConsentFlowData',
        'invoke.getConsentFlowDataForDid',
        'read.get',
        'store.LearnCloud.uploadEncrypted',
        'invoke.resolveFromLCN',
        'invoke.decryptDagJwe',
        'invoke.futurePrivateMethod',
        'invoke.getProfile.call',
        'invoke.getProfile.apply',
        'invoke.getProfile.bind',
        'invoke.getProfile.constructor',
        '__proto__',
        'invoke..getProfile',
    ])('denies %s for both inspection and invocation without accessing the wallet', async path => {
        const forbidden = vi.fn(() => {
            throw new Error('Forbidden fixture invoked');
        });
        const getWallet = vi.fn(
            async () =>
                ({
                    id: { keypair: forbidden },
                    invoke: {
                        getKey: forbidden,
                        getSubjectKeypair: forbidden,
                        getAllConsentFlowData: forbidden,
                        getConsentFlowDataForDid: forbidden,
                        getProfile: forbidden,
                        resolveFromLCN: forbidden,
                    },
                    read: { get: forbidden },
                }) as unknown as AgentNetworkWallet
        );
        const tool = createLearnCardWalletTool({ getWallet });
        for (const operation of ['inspect', 'call']) {
            await expect(
                tool.execute({ operation, path, args: ['did:example:other'] }, context)
            ).rejects.toThrow('not permitted');
        }
        expect(getWallet).not.toHaveBeenCalled();
        expect(forbidden).not.toHaveBeenCalled();
    });

    it('inspects only permitted capabilities without reading hidden getters or function source', async () => {
        const hidden = vi.fn(() => {
            throw new Error('Hidden fixture property read');
        });
        const wallet = {
            id: { did: () => 'did:example:agent' },
            invoke: {
                getProfile: async (profileId = 'hidden-implementation-default') => ({ profileId }),
                searchProfiles: async () => [],
                getBoost: async () => ({}),
            },
        };
        Object.defineProperty(wallet, 'seed', { get: hidden, enumerable: true });
        Object.defineProperty(wallet.invoke, 'getKey', { get: hidden, enumerable: true });
        Object.defineProperty(wallet.invoke, 'privateLearnerRecords', {
            get: hidden,
            enumerable: true,
        });
        const tool = fixtureTool(wallet);
        const root = await tool.execute({ operation: 'inspect', path: '' }, context);
        expect(root).toMatchObject({
            objects: [
                { name: 'id', path: 'id' },
                { name: 'invoke', path: 'invoke' },
            ],
            values: [],
        });
        const inspection = await tool.execute(
            { operation: 'inspect', path: 'invoke', query: 'profile' },
            context
        );
        expect(inspection).toMatchObject({
            functions: [
                expect.objectContaining({ path: 'invoke.getProfile' }),
                expect.objectContaining({ path: 'invoke.searchProfiles' }),
            ],
            objects: [],
            values: [],
        });
        const exact = await tool.execute(
            {
                operation: 'inspect',
                path: 'invoke.getProfile',
                includeSource: true,
            },
            context
        );
        const serialized = JSON.stringify([root, inspection, exact]);
        expect(serialized).not.toContain('getKey');
        expect(serialized).not.toContain('privateLearnerRecords');
        expect(serialized).not.toContain('hidden-implementation-default');
        expect(serialized).not.toContain('sourcePreview');
        expect(hidden).not.toHaveBeenCalled();
    });

    it('reads profiles with anonymous authority without loading or invoking the service wallet', async () => {
        const serviceRead = vi.fn(async () => ({
            profileId: 'recipient',
            email: 'connection-only@example.test',
            connectionStatus: 'CONNECTED',
        }));
        const getWallet = vi.fn(
            async () =>
                ({
                    invoke: { getProfile: serviceRead, searchProfiles: serviceRead },
                }) as unknown as AgentNetworkWallet
        );
        const tool = createLearnCardWalletTool({ getWallet });
        const profile = await tool.execute(
            { path: 'invoke.getProfile', args: ['recipient'] },
            context
        );
        const search = await tool.execute(
            { path: 'invoke.searchProfiles', args: ['recipient'] },
            context
        );
        expect(profile).toMatchObject({ result: { profileId: 'recipient' } });
        expect(search).toMatchObject({ result: [{ profileId: 'recipient' }] });
        expect(JSON.stringify([profile, search])).not.toContain('connection-only@example.test');
        expect(getWallet).not.toHaveBeenCalled();
        expect(serviceRead).not.toHaveBeenCalled();

        publicReader.getOtherProfile.mockClear();
        publicReader.searchProfiles.mockClear();
        for (const args of [
            ['recipient', { includeConnectionStatus: true }],
            ['recipient', { includeSelf: true }],
            ['recipient', { authorization: 'fixture-service-authority' }],
        ]) {
            await expect(
                tool.execute({ path: 'invoke.searchProfiles', args }, context)
            ).rejects.toThrow('permitted public search options');
        }
        await expect(
            tool.execute({ path: 'invoke.getProfile', args: [] }, context)
        ).rejects.toThrow('explicit profile ID');
        await expect(
            tool.execute(
                {
                    path: 'invoke.getProfile',
                    args: ['recipient', { includeConnectionStatus: true }],
                },
                context
            )
        ).rejects.toThrow('no options');
        expect(publicReader.getOtherProfile).not.toHaveBeenCalled();
        expect(publicReader.searchProfiles).not.toHaveBeenCalled();
        expect(getWallet).not.toHaveBeenCalled();
    });

    it('sends public brain requests without credentials or authentication challenges', async () => {
        const { getAnonymousClient } = await vi.importActual<typeof BrainClientModule>(
            '@learncard/network-brain-client'
        );
        const publicProfile = { profileId: 'recipient', displayName: 'Public Recipient' };
        const fetchFixture = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
            expect(String(url)).not.toContain('getChallenges');
            const headers = new Headers(init?.headers);
            expect(headers.has('authorization')).toBe(false);
            expect(headers.has('x-guardian-approval')).toBe(false);
            expect(headers.has('cookie')).toBe(false);
            if (String(url).includes('profile.getOtherProfile')) {
                return new Response(JSON.stringify([{ result: { data: publicProfile } }]));
            }
            if (String(url).includes('profile.searchProfiles')) {
                return new Response(JSON.stringify([{ result: { data: [publicProfile] } }]));
            }
            throw new Error(`Unexpected anonymous request: ${String(url)}`);
        });
        try {
            const client = getAnonymousClient('https://public-brain.example.test/brain/trpc');
            await expect(
                client.profile.getOtherProfile.query({ profileId: 'recipient' })
            ).resolves.toEqual(publicProfile);
            await expect(
                client.profile.searchProfiles.query({ input: 'recipient' })
            ).resolves.toEqual([publicProfile]);
            expect(fetchFixture).toHaveBeenCalledTimes(2);
        } finally {
            fetchFixture.mockRestore();
        }
    });

    it('preserves public lookup and credential issuance/delivery operations', async () => {
        const issued: unknown[] = [];
        const delivered: unknown[] = [];
        const credential = { credentialSubject: { id: 'did:example:recipient' } };
        const wallet = {
            id: { did: () => 'did:example:agent' },
            invoke: {
                getProfile: async (profileId: string) => ({ profileId }),
                searchProfiles: async (query: string) => [{ profileId: query }],
                createBoost: async () => boostUri,
                createChildBoost: async () => `${boostUri}-child`,
                getBoost: async () => ({ boost: credential }),
                issueCredential: async (input: unknown) => {
                    issued.push(input);
                    return { ...credential, proof: 'fixture' };
                },
                sendBoost: async (recipient: unknown, uri: unknown) => {
                    delivered.push({ recipient, uri });
                    return 'sent-boost';
                },
                send: async (input: unknown) => {
                    delivered.push(input);
                    return { credentialUri: 'sent-unified' };
                },
                sendCredentialViaInbox: async (input: unknown) => {
                    delivered.push(input);
                    return { issuanceId: 'sent-inbox' };
                },
            },
        };
        const tool = fixtureTool(wallet);
        const call = (path: string, args: unknown[] = []) => tool.execute({ path, args }, context);
        await expect(call('id.did')).resolves.toMatchObject({ result: 'did:example:agent' });
        await expect(call('invoke.getProfile', ['recipient'])).resolves.toMatchObject({
            result: { profileId: 'recipient' },
        });
        await expect(call('invoke.searchProfiles', ['recipient'])).resolves.toMatchObject({
            result: [{ profileId: 'recipient' }],
        });
        await expect(call('invoke.createBoost', [credential])).resolves.toMatchObject({
            result: boostUri,
        });
        await expect(
            call('invoke.createChildBoost', [boostUri, credential])
        ).resolves.toMatchObject({ result: `${boostUri}-child` });
        await expect(call('invoke.getBoost', [boostUri])).resolves.toMatchObject({
            result: { boost: credential },
        });
        await expect(call('invoke.issueCredential', [credential])).resolves.toMatchObject({
            result: { proof: 'fixture' },
        });
        await expect(call('invoke.sendBoost', ['recipient', boostUri])).resolves.toMatchObject({
            result: 'sent-boost',
        });
        const sendInput = { type: 'boost', recipient: 'recipient', templateUri: boostUri };
        await expect(call('invoke.send', [sendInput])).resolves.toMatchObject({
            result: { credentialUri: 'sent-unified' },
        });
        const inboxInput = {
            recipient: { type: 'email', value: 'learner@example.test' },
            credential,
        };
        await expect(call('invoke.sendCredentialViaInbox', [inboxInput])).resolves.toMatchObject({
            result: { issuanceId: 'sent-inbox' },
        });
        expect(issued).toEqual([credential]);
        expect(delivered).toEqual([
            { recipient: 'recipient', uri: boostUri },
            sendInput,
            inboxInput,
        ]);
    });

    it.each([
        'lc:network:pr-99.preview.learncard.ai/brain/trpc:boost:abc123',
        'lc:network:localhost%3A4000/brain/trpc:boost:abc123',
        'lc:network:localhost:4000/brain/trpc:boost:abc123',
    ])(
        'roundtrips a created Boost through read, delivery, and child creation: %s',
        async createdUri => {
            const templates = new Map<string, unknown>();
            const delivered: string[] = [];
            const credential = {
                credentialSubject: { achievement: { name: 'Fixture Achievement' } },
            };
            const tool = fixtureTool({
                invoke: {
                    createBoost: async (input: unknown) => {
                        templates.set(createdUri, input);
                        return createdUri;
                    },
                    getBoost: async (uri: string) => {
                        if (!templates.has(uri)) throw new Error('Unknown fixture Boost');
                        return templates.get(uri);
                    },
                    sendBoost: async (_recipient: string, uri: string) => {
                        if (!templates.has(uri)) throw new Error('Unknown fixture Boost');
                        delivered.push(uri);
                        return 'delivered';
                    },
                    createChildBoost: async (parentUri: string, input: unknown) => {
                        if (!templates.has(parentUri)) throw new Error('Unknown fixture parent');
                        const childUri = `${parentUri}-child`;
                        templates.set(childUri, input);
                        return childUri;
                    },
                },
            });
            const call = (path: string, args: unknown[]) => tool.execute({ path, args }, context);
            const created = (await call('invoke.createBoost', [credential])) as { result: string };
            await expect(call('invoke.getBoost', [created.result])).resolves.toMatchObject({
                result: credential,
            });
            await expect(
                call('invoke.sendBoost', ['recipient', created.result])
            ).resolves.toMatchObject({ result: 'delivered' });
            const child = (await call('invoke.createChildBoost', [created.result, credential])) as {
                result: string;
            };
            await expect(call('invoke.getBoost', [child.result])).resolves.toMatchObject({
                result: credential,
            });
            expect(delivered).toEqual([created.result]);
        }
    );

    it.each([
        'lc:network:localhost%3A4000/trpc:credential:private-fixture',
        'lc:network:pr-99.preview.learncard.ai/brain/trpc:credential:private-fixture',
        'lc:cloud:pr-99.preview.learncard.ai/cloud/trpc:boost:private-fixture',
        'lc:network:pr-99.preview.learncard.ai/brain/trpc:contract:private-fixture',
        'lc:network:pr-99.preview.learncard.ai/brain/trpc:boost:abc:credential:private-fixture',
        'lc:network:pr-99.preview.learncard.ai/brain/trpc:boost:',
    ])('blocks private storage and non-Boost URI access through issuance: %s', async privateUri => {
        const invoke = {
            sendBoost: vi.fn(),
            send: vi.fn(),
            sendCredentialViaInbox: vi.fn(),
            getBoost: vi.fn(),
            createChildBoost: vi.fn(),
        };
        const tool = fixtureTool({ invoke });
        const calls: Array<[string, unknown[]]> = [
            ['invoke.sendBoost', ['recipient', privateUri]],
            ['invoke.send', [{ type: 'boost', recipient: 'recipient', templateUri: privateUri }]],
            [
                'invoke.sendCredentialViaInbox',
                [
                    {
                        recipient: { type: 'email', value: 'learner@example.test' },
                        templateUri: privateUri,
                    },
                ],
            ],
            ['invoke.getBoost', [privateUri]],
            ['invoke.createChildBoost', [privateUri, {}]],
        ];
        for (const [path, args] of calls) {
            await expect(tool.execute({ path, args }, context)).rejects.toThrow(
                'Boost template URIs'
            );
        }
        for (const method of Object.values(invoke)) expect(method).not.toHaveBeenCalled();
    });

    it('reports real SDK failures without exporting sensitive error fields', async () => {
        const tool = fixtureTool({
            invoke: {
                sendBoost: async () => {
                    throw Object.assign(new Error('Target profile cannot receive this Boost'), {
                        code: 'FORBIDDEN',
                        seed: 'fixture-secret',
                        cause: Object.assign(new Error('Permission denied'), { statusCode: 403 }),
                    });
                },
            },
        });
        const error = await tool
            .execute({ path: 'invoke.sendBoost', args: ['recipient', boostUri] }, context)
            .then(
                () => {
                    throw new Error('Expected wallet rejection');
                },
                (failure: Error) => failure
            );
        const payload = JSON.parse(error.message);
        expect(payload).toMatchObject({
            method: 'invoke.sendBoost',
            underlyingError: { code: 'FORBIDDEN', seed: '[redacted]', cause: { statusCode: 403 } },
        });
        expect(error.message).not.toContain('fixture-secret');
    });

    it('keeps an absent public lookup result explicit', async () => {
        publicReader.getOtherProfile.mockResolvedValueOnce(undefined);
        const tool = fixtureTool({});
        await expect(
            tool.execute({ path: 'invoke.getProfile', args: ['missing'] }, context)
        ).resolves.toMatchObject({
            result: null,
            resultType: 'undefined',
            hasResult: false,
        });
    });

    it('does not invoke wallet methods after an autonomous run loses its lease', async () => {
        const abortController = new AbortController();
        const send = vi.fn();
        const tool = createLearnCardWalletTool({
            getWallet: async () => {
                abortController.abort(new Error('Autonomous lease lost.'));
                return { invoke: { send } } as unknown as AgentNetworkWallet;
            },
        });
        await expect(
            tool.execute(
                { path: 'invoke.send', args: [{ type: 'boost', recipient: 'recipient' }] },
                {
                    ...context,
                    signal: abortController.signal,
                }
            )
        ).rejects.toThrow('Autonomous lease lost.');
        expect(send).not.toHaveBeenCalled();
    });

    it('requires a configured wallet seed when no wallet factory is provided', async () => {
        await expect(
            createLearnCardWalletTool({}).execute({ operation: 'inspect', path: '' }, context)
        ).rejects.toThrow('AI_AGENT_WALLET_SEED');
    });
});
