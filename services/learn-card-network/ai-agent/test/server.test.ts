import { describe, expect, it } from 'vitest';
import type { Express } from 'express';

import type { AgentProvider, AgentToolDefinition } from '../src/agent/types';
import type { ConsentFlowRuntime } from '../src/consentFlow';
import type { ServiceConfig } from '../src/config';
import type { MongoRuntime } from '../src/mongo';
import { createServer as createAgentServer, runChatRequest } from '../src/server';
import { createSelfImprovementRuntime, type SelfImprovementRuntime } from '../src/selfImprovement';
import { createWebSearchTool, type WebSearchProvider } from '../src/tools/webSearch';
import {
    createInMemoryRunTraceRepository,
    createRunTraceService,
} from '../src/selfImprovement/runTrace';
import { createInMemoryRetroResultRepository } from '../src/selfImprovement/retro';
import {
    createInMemoryUserDocRepository,
    createUserDocService,
} from '../src/selfImprovement/userDocs';
import {
    createInMemoryLearnCardAssistantFeedRepository,
    createLearnCardAssistantFeedRuntime,
    createLearnCardAssistantFeedService,
    type LearnCardAssistantFeedRuntime,
} from '../src/assistantFeed';
import {
    createInMemoryLearnCardAssistantProfileRepository,
    createLearnCardAssistantProfileRuntime,
    createLearnCardAssistantProfileService,
} from '../src/assistantProfile';
interface TestRouteHandler {
    handle: (req: unknown, res: unknown, next?: (error?: unknown) => void) => Promise<void> | void;
}

interface TestRoute {
    path: string;
    methods: Record<string, boolean>;
    stack: TestRouteHandler[];
}

interface ExpressRouterLayer {
    route?: TestRoute;
}

interface ExpressWithRouter extends Express {
    _router: {
        stack: ExpressRouterLayer[];
    };
}

interface RouteCallResult {
    status: number;
    payload?: unknown;
}

interface TestRouteResponse {
    locals: Record<string, unknown>;
    status: (code: number) => TestRouteResponse;
    json: (payload: unknown) => TestRouteResponse;
}

const testConfig: ServiceConfig = {
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

describe('runChatRequest', () => {
    it('runs a request-response chat turn', async () => {
        const provider: AgentProvider = {
            complete: async () => ({
                message: {
                    role: 'assistant',
                    content: 'Hello from the test agent.',
                },
            }),
        };
        const tools: AgentToolDefinition[] = [];
        const result = await runChatRequest({
            body: { messages: [{ role: 'user', content: 'Hi' }] },
            ownerDid: 'did:key:user',
            config: testConfig,
            provider,
            tools,
        });

        expect(result.status).toBe(200);
        expect(result.payload).toMatchObject({
            message: 'Hello from the test agent.',
            runId: expect.any(String),
            messages: [
                { role: 'user', content: 'Hi' },
                { role: 'assistant', content: 'Hello from the test agent.' },
            ],
            toolRuns: [],
        });
        expect(result.afterResponse).toBeTypeOf('function');
    });

    it('rejects invalid chat payloads', async () => {
        const provider: AgentProvider = {
            complete: async () => ({
                message: {
                    role: 'assistant',
                    content: 'This should not run.',
                },
            }),
        };
        const result = await runChatRequest({
            body: { messages: [{ role: 'tool', content: 'Nope' }] },
            ownerDid: 'did:key:user',
            config: testConfig,
            provider,
            tools: [],
        });

        expect(result).toEqual({
            status: 400,
            payload: {
                error: 'Invalid request. Send a messages array with user or assistant messages.',
            },
        });
    });

    it('starts consented user data loading and exposes it as a request-scoped tool', async () => {
        let calls = 0;
        let loadStarted = false;
        const consentFlowRuntime: ConsentFlowRuntime = {
            getContractInfo: async () => ({
                uri: 'lc:network:localhost%3A4000/trpc:contract:test',
                consentUrl:
                    'https://learncard.app/consent-flow?uri=lc%3Anetwork%3Alocalhost%253A4000%2Ftrpc%3Acontract%3Atest',
                source: 'configured',
                created: false,
            }),
            loadConsentedUserData: async ({ did }) => {
                loadStarted = true;

                return {
                    did,
                    contract: {
                        uri: 'lc:network:localhost%3A4000/trpc:contract:test',
                        consentUrl:
                            'https://learncard.app/consent-flow?uri=lc%3Anetwork%3Alocalhost%253A4000%2Ftrpc%3Acontract%3Atest',
                        source: 'configured',
                        created: false,
                    },
                    records: [],
                    summary: {
                        recordCount: 0,
                        personalKeys: [],
                        credentialCount: 0,
                        hydratedCredentialCount: 0,
                    },
                    paging: {
                        pageSize: 100,
                        pagesRead: 1,
                        maxPages: 10,
                        hasMore: false,
                        incomplete: false,
                    },
                };
            },
        };
        const provider: AgentProvider = {
            complete: async ({ messages, tools }) => {
                calls += 1;

                if (calls === 1) {
                    expect(loadStarted).toBe(true);
                    expect(messages[0]?.content).toContain('The current user DID is did:key:user.');
                    expect(tools.map(tool => tool.name)).toContain('getConsentedUserData');

                    return {
                        message: {
                            role: 'assistant',
                            content: '',
                            toolCalls: [
                                {
                                    id: 'call-1',
                                    name: 'getConsentedUserData',
                                    arguments: {},
                                },
                            ],
                        },
                    };
                }

                return {
                    message: {
                        role: 'assistant',
                        content: 'I checked the consented data.',
                    },
                };
            },
        };

        const result = await runChatRequest({
            body: {
                did: 'did:key:user',
                messages: [{ role: 'user', content: 'What do you know about me?' }],
            },
            ownerDid: 'did:key:user',
            config: testConfig,
            provider,
            tools: [],
            consentFlowRuntime,
        });

        expect(result.status).toBe(200);
        expect(result.payload).toMatchObject({
            message: 'I checked the consented data.',
            toolRuns: [
                {
                    id: 'call-1',
                    name: 'getConsentedUserData',
                    arguments: {},
                    result: {
                        did: 'did:key:user',
                        records: [],
                    },
                },
            ],
        });
    });

    it('adds DID-scoped memory tools and manifest context to chat runs', async () => {
        const provider: AgentProvider = {
            complete: async ({ messages, tools }) => {
                expect(messages[0]?.content).toContain('User memory manifest');
                expect(messages[0]?.content).toContain(
                    'Active user memory/docs are discoverable through searchSkills'
                );
                expect(messages[0]?.content).not.toContain('answer-style');
                expect(tools.map(tool => tool.name)).toContain('rememberUserMemory');

                return {
                    message: {
                        role: 'assistant',
                        content: 'I can manage memory for this DID.',
                    },
                };
            },
        };
        const consentFlowRuntime: ConsentFlowRuntime = {
            getContractInfo: async () => ({
                uri: 'contract-uri',
                consentUrl: 'https://learncard.app/consent-flow?uri=contract-uri',
                source: 'configured',
                created: false,
            }),
            loadConsentedUserData: async ({ did }) => ({
                did,
                contract: {
                    uri: 'contract-uri',
                    consentUrl: 'https://learncard.app/consent-flow?uri=contract-uri',
                    source: 'configured',
                    created: false,
                },
                records: [],
                summary: {
                    recordCount: 0,
                    personalKeys: [],
                    credentialCount: 0,
                    hydratedCredentialCount: 0,
                },
                paging: {
                    pageSize: 100,
                    pagesRead: 1,
                    maxPages: 10,
                    hasMore: false,
                    incomplete: false,
                },
            }),
        };
        const memoryTool: AgentToolDefinition = {
            name: 'rememberUserMemory',
            description: 'Remember user memory.',
            parameters: { type: 'object', properties: {} },
            execute: async () => ({ ok: true }),
        };
        const result = await runChatRequest({
            body: {
                did: 'did:key:user',
                messages: [{ role: 'user', content: 'What do you remember?' }],
            },
            ownerDid: 'did:key:user',
            config: testConfig,
            provider,
            tools: [],
            consentFlowRuntime,
            selfImprovementRuntime: {
                loadRequestSkills: async () => [],
                loadRequestTools: async () => [memoryTool],
                getMemoryManifestPrompt: async () =>
                    [
                        'User memory manifest:',
                        '{"counts":{"active":1,"visibleToAgent":1}}',
                        'Active user memory/docs are discoverable through searchSkills and loadable through readSkill. They are not listed here to keep prompt context compact.',
                    ].join('\n'),
                runAfterResponse: async () => undefined,
                getDocsForDebug: async () => [],
                getMemoryManifestForDebug: async () => undefined,
                getAssistantMemoryManifest: async () => undefined,
                getAssistantMemoryDocs: async () => [],
                approveAssistantMemory: async () => {
                    throw new Error('Not implemented.');
                },
                archiveAssistantMemory: async () => {
                    throw new Error('Not implemented.');
                },
                createDebugDoc: async () => {
                    throw new Error('Not implemented.');
                },
                updateDebugDoc: async () => {
                    throw new Error('Not implemented.');
                },
                approveDebugDoc: async () => {
                    throw new Error('Not implemented.');
                },
                archiveDebugDoc: async () => {
                    throw new Error('Not implemented.');
                },
                getRunForDebug: async () => undefined,
            },
        });

        expect(result.status).toBe(200);
        expect(result.payload).toMatchObject({
            message: 'I can manage memory for this DID.',
        });
    });

    it('can call an injected webSearch tool during an agent run', async () => {
        let calls = 0;
        const webSearchProvider: WebSearchProvider = {
            name: 'mock',
            search: async request => ({
                query: request.query,
                provider: 'mock',
                retrievedAt: '2026-06-05T00:00:00.000Z',
                results: [
                    {
                        title: 'Current source',
                        url: 'https://example.com/current',
                        snippet: 'Current search result.',
                        rank: 1,
                        retrievedAt: '2026-06-05T00:00:00.000Z',
                    },
                ],
            }),
        };
        const provider: AgentProvider = {
            complete: async ({ tools }) => {
                calls += 1;

                if (calls === 1) {
                    expect(tools.map(tool => tool.name)).toContain('webSearch');

                    return {
                        message: {
                            role: 'assistant',
                            content: '',
                            toolCalls: [
                                {
                                    id: 'search-call',
                                    name: 'webSearch',
                                    arguments: { query: 'latest LearnCard updates' },
                                },
                            ],
                        },
                    };
                }

                return {
                    message: {
                        role: 'assistant',
                        content: 'I found a current source.',
                    },
                };
            },
        };
        const result = await runChatRequest({
            body: { messages: [{ role: 'user', content: 'Find current info.' }] },
            ownerDid: 'did:key:user',
            config: testConfig,
            provider,
            tools: [createWebSearchTool({ provider: webSearchProvider })],
        });

        expect(result.status).toBe(200);
        expect(result.payload).toMatchObject({
            message: 'I found a current source.',
            toolRuns: [
                {
                    id: 'search-call',
                    name: 'webSearch',
                    arguments: { query: 'latest LearnCard updates' },
                    result: {
                        query: 'latest LearnCard updates',
                        provider: 'mock',
                        results: [
                            {
                                title: 'Current source',
                                url: 'https://example.com/current',
                            },
                        ],
                    },
                },
            ],
        });
    });
});

describe('createServer', () => {
    const findRoute = (
        app: Express,
        method: 'get' | 'post' | 'patch',
        routePath: string
    ): TestRoute | undefined => {
        // Express exposes registered route handlers through _router in tests; no HTTP port is opened.
        const appWithRouter = app as ExpressWithRouter;

        return appWithRouter._router.stack.find(
            layer => layer.route?.path === routePath && layer.route.methods[method]
        )?.route;
    };

    const createRouteResponse = (
        resolve: (result: RouteCallResult) => void,
        params: Record<string, string> = {}
    ): TestRouteResponse => {
        let status = 200;

        const res: TestRouteResponse = {
            locals: {
                agentDidAuth: {
                    did: params.did ?? 'did:key:user',
                    challenge: 'test-challenge',
                    domain: 'http://test.local',
                },
                debugTokenAuthenticated: true,
            },
            status: code => {
                status = code;

                return res;
            },
            json: payload => {
                resolve({ status, payload });

                return res;
            },
        };

        return res;
    };

    const callRoute = async (
        app: Express,
        method: 'get' | 'post' | 'patch',
        routePath: string,
        body?: unknown,
        params: Record<string, string> = {}
    ): Promise<RouteCallResult> => {
        const handler = findRoute(app, method, routePath)?.stack.at(-1)?.handle;

        if (!handler) throw new Error(`Route ${method.toUpperCase()} ${routePath} not found.`);

        const { promise, resolve, reject } = Promise.withResolvers<RouteCallResult>();
        const res = createRouteResponse(resolve, params);

        Promise.resolve(handler({ body, params, query: {} }, res)).catch(reject);

        return promise;
    };

    const healthyMongoRuntime: MongoRuntime = {
        getClient: async () => {
            throw new Error('Mongo client should not be requested.');
        },
        getDb: async () => {
            throw new Error('Mongo db should not be requested.');
        },
        getStatus: async () => ({
            configured: true,
            connected: true,
            dbName: 'test-ai-agent',
        }),
        close: async () => undefined,
    };

    it('does not register browser debug UI routes', () => {
        const app = createAgentServer({
            config: testConfig,
            mongoRuntime: healthyMongoRuntime,
        });

        expect(findRoute(app, 'get', '/')).toBeUndefined();
        expect(findRoute(app, 'get', '/index.html')).toBeUndefined();
    });

    it('includes webSearch in health and tools when Brave is configured', async () => {
        const app = createAgentServer({
            config: {
                ...testConfig,
                webSearchProvider: 'brave',
                braveSearchApiKey: 'test-key',
            },
            mongoRuntime: healthyMongoRuntime,
        });

        await expect(callRoute(app, 'get', '/api/health')).resolves.toMatchObject({
            status: 200,
            payload: {
                webSearch: {
                    provider: 'brave',
                    enabled: true,
                },
                tools: expect.arrayContaining(['webSearch']),
            },
        });
    });

    it('omits webSearch from health and tools when no provider is configured', async () => {
        const app = createAgentServer({
            config: {
                ...testConfig,
                webSearchProvider: 'none',
            },
            mongoRuntime: healthyMongoRuntime,
        });

        await expect(callRoute(app, 'get', '/api/health')).resolves.toMatchObject({
            status: 200,
            payload: {
                webSearch: {
                    provider: 'none',
                    enabled: false,
                },
            },
        });

        const result = await callRoute(app, 'get', '/api/health');
        const payload = result.payload as { tools?: string[] };

        expect(payload.tools).not.toContain('webSearch');
    });

    it('does not create a ConsentFlow contract when the default OpenAI provider is unconfigured', async () => {
        const consentFlowRuntime: ConsentFlowRuntime = {
            getContractInfo: async () => {
                throw new Error('ConsentFlow contract should not be resolved.');
            },
            loadConsentedUserData: async () => {
                throw new Error('Consented user data should not be loaded.');
            },
        };
        const app = createAgentServer({
            config: testConfig,
            tools: [],
            consentFlowRuntime,
        });

        await expect(callRoute(app, 'get', '/api/consent-flow/contract')).resolves.toEqual({
            status: 503,
            payload: {
                ok: false,
                error: 'OPENAI_API_KEY must be set before creating a ConsentFlow contract.',
            },
        });
    });

    it('does not start consented data loading for chat when the default OpenAI provider is unconfigured', async () => {
        const consentFlowRuntime: ConsentFlowRuntime = {
            getContractInfo: async () => {
                throw new Error('ConsentFlow contract should not be resolved.');
            },
            loadConsentedUserData: async () => {
                throw new Error('Consented user data should not be loaded.');
            },
        };
        const app = createAgentServer({
            config: testConfig,
            tools: [],
            consentFlowRuntime,
        });

        await expect(
            callRoute(app, 'post', '/api/agent/run', {
                did: 'did:key:user',
                messages: [{ role: 'user', content: 'Hi' }],
            })
        ).resolves.toEqual({
            status: 503,
            payload: {
                error: 'OPENAI_API_KEY must be set to run the AI agent.',
            },
        });
    });

    it('sends the chat response before post-response self-improvement finishes', async () => {
        let afterResponseStarted = false;
        const provider: AgentProvider = {
            complete: async () => ({
                message: {
                    role: 'assistant',
                    content: 'Response first.',
                },
            }),
        };
        const selfImprovementRuntime: SelfImprovementRuntime = {
            loadRequestSkills: async () => [],
            loadRequestTools: async () => [],
            getMemoryManifestPrompt: async () => undefined,
            runAfterResponse: async () => {
                afterResponseStarted = true;
                await new Promise<void>(() => undefined);
            },
            getDocsForDebug: async () => [],
            getMemoryManifestForDebug: async () => undefined,
            getAssistantMemoryManifest: async () => undefined,
            getAssistantMemoryDocs: async () => [],
            approveAssistantMemory: async () => {
                throw new Error('Not implemented.');
            },
            archiveAssistantMemory: async () => {
                throw new Error('Not implemented.');
            },
            createDebugDoc: async () => {
                throw new Error('Not implemented.');
            },
            updateDebugDoc: async () => {
                throw new Error('Not implemented.');
            },
            approveDebugDoc: async () => {
                throw new Error('Not implemented.');
            },
            archiveDebugDoc: async () => {
                throw new Error('Not implemented.');
            },
            getRunForDebug: async () => undefined,
        };
        const app = createAgentServer({
            config: testConfig,
            provider,
            tools: [],
            selfImprovementRuntime,
        });

        await expect(
            Promise.race([
                callRoute(app, 'post', '/api/agent/run', {
                    did: 'did:key:user',
                    messages: [{ role: 'user', content: 'Hi' }],
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out')), 100)),
            ])
        ).resolves.toMatchObject({
            status: 200,
            payload: {
                message: 'Response first.',
            },
        });
        await Promise.resolve();
        expect(afterResponseStarted).toBe(true);
    });

    it('supports debug memory create, approve, and archive actions', async () => {
        const userDocs = createUserDocService(createInMemoryUserDocRepository());
        const selfImprovementRuntime: SelfImprovementRuntime = {
            loadRequestSkills: async ownerDid => userDocs.createSkillDefinitions(ownerDid ?? ''),
            loadRequestTools: async () => [],
            getMemoryManifestPrompt: async () => undefined,
            runAfterResponse: async () => undefined,
            getDocsForDebug: userDocs.getDocsForDebug,
            getMemoryManifestForDebug: userDocs.getMemoryManifest,
            getAssistantMemoryManifest: userDocs.getMemoryManifest,
            getAssistantMemoryDocs: userDocs.getDocsForDebug,
            approveAssistantMemory: (ownerDid, name) =>
                userDocs.approveDoc(ownerDid, name, { reason: 'Approved in My Assistant.' }),
            archiveAssistantMemory: (ownerDid, name, reason = 'Removed from My Assistant.') =>
                userDocs.archiveDoc({ ownerDid, name, reason, provenance: { reason } }),
            createDebugDoc: async input =>
                userDocs.createDoc({
                    ...input,
                    createdBy: 'debug',
                    sourceType: input.sourceType ?? 'debug',
                }),
            updateDebugDoc: userDocs.updateDoc,
            approveDebugDoc: userDocs.approveDoc,
            archiveDebugDoc: userDocs.archiveDoc,
            getRunForDebug: async () => undefined,
        };
        const app = createAgentServer({
            config: testConfig,
            provider: {
                complete: async () => ({
                    message: { role: 'assistant', content: 'ok' },
                }),
            },
            tools: [],
            selfImprovementRuntime,
        });

        await expect(
            callRoute(
                app,
                'post',
                '/api/debug/users/:did/memory',
                {
                    action: 'create',
                    kind: 'memory',
                    description: 'Possible preference.',
                    content: '# Preference\n\nTaylor may prefer concise answers.',
                    status: 'proposed',
                    requiresApproval: true,
                },
                { did: 'did:key:user' }
            )
        ).resolves.toMatchObject({
            status: 200,
            payload: {
                ok: true,
                doc: {
                    status: 'proposed',
                },
            },
        });

        await expect(userDocs.createSkillDefinitions('did:key:user')).resolves.toEqual([]);

        await expect(
            callRoute(
                app,
                'post',
                '/api/debug/users/:did/memory',
                {
                    action: 'approve',
                    name: 'possible-preference',
                },
                { did: 'did:key:user' }
            )
        ).resolves.toMatchObject({
            status: 200,
            payload: {
                ok: true,
                doc: {
                    status: 'active',
                },
            },
        });
        await expect(userDocs.createSkillDefinitions('did:key:user')).resolves.toHaveLength(1);

        await expect(
            callRoute(
                app,
                'post',
                '/api/debug/users/:did/memory',
                {
                    action: 'archive',
                    name: 'possible-preference',
                    reason: 'Debug cleanup.',
                },
                { did: 'did:key:user' }
            )
        ).resolves.toMatchObject({
            status: 200,
            payload: {
                ok: true,
                doc: {
                    status: 'archived',
                },
            },
        });
        await expect(userDocs.createSkillDefinitions('did:key:user')).resolves.toEqual([]);
    });

    it('returns an empty assistant feed when no items exist', async () => {
        const assistantFeedService = createLearnCardAssistantFeedService(
            createInMemoryLearnCardAssistantFeedRepository()
        );
        const app = createAgentServer({
            config: testConfig,
            tools: [],
            assistantFeedRuntime: createLearnCardAssistantFeedRuntime({
                mongoRuntime: healthyMongoRuntime,
                service: assistantFeedService,
            }),
        });

        await expect(
            callRoute(app, 'get', '/api/users/:did/assistant-feed', undefined, {
                did: 'did:key:user',
            })
        ).resolves.toEqual({
            status: 200,
            payload: {
                ok: true,
                items: [],
            },
        });
    });

    it('returns 503 when assistant feed storage is unavailable', async () => {
        const unavailableFeed: LearnCardAssistantFeedRuntime = {
            getStatus: async () => ({ configured: true, connected: false }),
            loadRequestTools: async () => [],
            listLatest: async () => {
                throw new Error('LearnCard Assistant feed storage is not available.');
            },
            recordItem: async () => {
                throw new Error('LearnCard Assistant feed storage is not available.');
            },
            markItemRead: async () => {
                throw new Error('LearnCard Assistant feed storage is not available.');
            },
            recordFeedback: async () => {
                throw new Error('LearnCard Assistant feed storage is not available.');
            },
        };
        const app = createAgentServer({
            config: testConfig,
            tools: [],
            assistantFeedRuntime: unavailableFeed,
        });

        await expect(
            callRoute(app, 'post', '/api/users/:did/assistant-feed/:id/read', undefined, {
                did: 'did:key:user',
                id: 'card-1',
            })
        ).resolves.toEqual({
            status: 503,
            payload: {
                ok: false,
                error: 'LearnCard Assistant feed storage is not available.',
            },
        });
    });

    it('writes a debug assistant card and returns it on subsequent GET', async () => {
        const assistantFeedService = createLearnCardAssistantFeedService(
            createInMemoryLearnCardAssistantFeedRepository()
        );
        const app = createAgentServer({
            config: testConfig,
            tools: [],
            assistantFeedRuntime: createLearnCardAssistantFeedRuntime({
                mongoRuntime: healthyMongoRuntime,
                service: assistantFeedService,
            }),
        });

        await expect(
            callRoute(
                app,
                'post',
                '/api/debug/users/:did/assistant-feed',
                {
                    type: 'message',
                    title: 'Practice interview storytelling',
                    description: 'Your next role match needs clearer project examples.',
                    priority: 'high',
                    cta: {
                        label: 'Review profile',
                        href: '/ai/assistant',
                    },
                },
                { did: 'did:key:user' }
            )
        ).resolves.toMatchObject({
            status: 200,
            payload: {
                ok: true,
                item: {
                    type: 'message',
                    title: 'Practice interview storytelling',
                    priority: 'high',
                },
            },
        });

        await expect(
            callRoute(app, 'get', '/api/users/:did/assistant-feed', undefined, {
                did: 'did:key:user',
            })
        ).resolves.toMatchObject({
            status: 200,
            payload: {
                ok: true,
                items: [
                    {
                        type: 'message',
                        title: 'Practice interview storytelling',
                        priority: 'high',
                    },
                ],
            },
        });
    });

    it('marks assistant cards read and records feedback', async () => {
        const assistantFeedService = createLearnCardAssistantFeedService(
            createInMemoryLearnCardAssistantFeedRepository()
        );
        const card = await assistantFeedService.recordItem({
            ownerDid: 'did:key:user',
            type: 'message',
            title: 'Feedback target',
            description: 'This card should be mutable.',
        });
        const app = createAgentServer({
            config: testConfig,
            tools: [],
            assistantFeedRuntime: createLearnCardAssistantFeedRuntime({
                mongoRuntime: healthyMongoRuntime,
                service: assistantFeedService,
            }),
        });

        await expect(
            callRoute(app, 'post', '/api/users/:did/assistant-feed/:id/read', undefined, {
                did: 'did:key:user',
                id: card.id,
            })
        ).resolves.toMatchObject({
            status: 200,
            payload: {
                ok: true,
                item: {
                    id: card.id,
                    readAt: expect.any(String),
                },
            },
        });

        await expect(
            callRoute(
                app,
                'post',
                '/api/users/:did/assistant-feed/:id/feedback',
                { type: 'thumbs-down' },
                {
                    did: 'did:key:user',
                    id: card.id,
                }
            )
        ).resolves.toMatchObject({
            status: 200,
            payload: {
                ok: true,
                item: {
                    id: card.id,
                    feedback: {
                        type: 'thumbs-down',
                        createdAt: expect.any(String),
                    },
                },
            },
        });
    });

    it('returns default assistant profile and persists profile updates', async () => {
        const assistantProfileService = createLearnCardAssistantProfileService(
            createInMemoryLearnCardAssistantProfileRepository()
        );
        const app = createAgentServer({
            config: testConfig,
            tools: [],
            assistantProfileRuntime: createLearnCardAssistantProfileRuntime({
                mongoRuntime: healthyMongoRuntime,
                service: assistantProfileService,
            }),
        });

        await expect(
            callRoute(app, 'get', '/api/users/:did/assistant-profile', undefined, {
                did: 'did:key:user',
            })
        ).resolves.toMatchObject({
            status: 200,
            payload: {
                ok: true,
                profile: {
                    ownerDid: 'did:key:user',
                    name: 'My Assistant',
                    avatarVariant: 'robot',
                },
            },
        });

        await expect(
            callRoute(
                app,
                'patch',
                '/api/users/:did/assistant-profile',
                {
                    name: 'Coach',
                    personality: 'Concise and useful.',
                },
                { did: 'did:key:user' }
            )
        ).resolves.toMatchObject({
            status: 200,
            payload: {
                ok: true,
                profile: {
                    name: 'Coach',
                    personality: 'Concise and useful.',
                },
            },
        });

        await expect(assistantProfileService.getProfile('did:key:user')).resolves.toMatchObject({
            name: 'Coach',
            personality: 'Concise and useful.',
        });
    });

    it('exposes public assistant memories and approve/archive actions', async () => {
        const userDocs = createUserDocService(createInMemoryUserDocRepository());
        const selfImprovementRuntime: SelfImprovementRuntime = {
            loadRequestSkills: async ownerDid => userDocs.createSkillDefinitions(ownerDid ?? ''),
            loadRequestTools: async () => [],
            getMemoryManifestPrompt: async () => undefined,
            runAfterResponse: async () => undefined,
            getDocsForDebug: userDocs.getDocsForDebug,
            getMemoryManifestForDebug: userDocs.getMemoryManifest,
            getAssistantMemoryManifest: userDocs.getMemoryManifest,
            getAssistantMemoryDocs: userDocs.getDocsForDebug,
            approveAssistantMemory: (ownerDid, name) =>
                userDocs.approveDoc(ownerDid, name, { reason: 'Approved in My Assistant.' }),
            archiveAssistantMemory: (ownerDid, name, reason = 'Removed from My Assistant.') =>
                userDocs.archiveDoc({ ownerDid, name, reason, provenance: { reason } }),
            createDebugDoc: async input =>
                userDocs.createDoc({
                    ...input,
                    createdBy: 'debug',
                    sourceType: input.sourceType ?? 'debug',
                }),
            updateDebugDoc: userDocs.updateDoc,
            approveDebugDoc: userDocs.approveDoc,
            archiveDebugDoc: userDocs.archiveDoc,
            getRunForDebug: async () => undefined,
        };
        const app = createAgentServer({
            config: testConfig,
            provider: {
                complete: async () => ({
                    message: { role: 'assistant', content: 'ok' },
                }),
            },
            tools: [],
            selfImprovementRuntime,
        });

        await userDocs.createDoc({
            ownerDid: 'did:key:user',
            name: 'possible-preference',
            kind: 'memory',
            description: 'Possible preference.',
            content: '# Preference\\n\\nTaylor may prefer concise answers.',
            status: 'proposed',
            sourceType: 'agent-inferred',
            createdBy: 'debug',
            requiresApproval: true,
        });

        await expect(
            callRoute(app, 'get', '/api/users/:did/assistant-memories', undefined, {
                did: 'did:key:user',
            })
        ).resolves.toMatchObject({
            status: 200,
            payload: {
                ok: true,
                manifest: {
                    counts: {
                        proposed: 1,
                    },
                },
                docs: [
                    {
                        name: 'possible-preference',
                        status: 'proposed',
                        content: '# Preference\\n\\nTaylor may prefer concise answers.',
                    },
                ],
            },
        });

        await expect(
            callRoute(app, 'post', '/api/users/:did/assistant-memories/:name/approve', undefined, {
                did: 'did:key:user',
                name: 'possible-preference',
            })
        ).resolves.toMatchObject({
            status: 200,
            payload: {
                ok: true,
                doc: {
                    status: 'active',
                },
                manifest: {
                    counts: {
                        active: 1,
                    },
                },
            },
        });

        await expect(
            callRoute(
                app,
                'post',
                '/api/users/:did/assistant-memories/:name/archive',
                { reason: 'Removed in test.' },
                {
                    did: 'did:key:user',
                    name: 'possible-preference',
                }
            )
        ).resolves.toMatchObject({
            status: 200,
            payload: {
                ok: true,
                doc: {
                    status: 'archived',
                },
                manifest: {
                    counts: {
                        archived: 1,
                    },
                },
            },
        });
    });

    it('runs a heartbeat and returns cards created by the agent tool', async () => {
        let calls = 0;
        const assistantFeedService = createLearnCardAssistantFeedService(
            createInMemoryLearnCardAssistantFeedRepository()
        );
        const consentFlowRuntime: ConsentFlowRuntime = {
            getContractInfo: async () => ({
                uri: 'contract-uri',
                consentUrl: 'https://learncard.app/consent-flow?uri=contract-uri',
                source: 'configured',
                created: false,
            }),
            loadConsentedUserData: async ({ did }) => ({
                did,
                contract: {
                    uri: 'contract-uri',
                    consentUrl: 'https://learncard.app/consent-flow?uri=contract-uri',
                    source: 'configured',
                    created: false,
                },
                records: [],
                summary: {
                    recordCount: 0,
                    personalKeys: [],
                    credentialCount: 0,
                    hydratedCredentialCount: 0,
                },
                paging: {
                    pageSize: 100,
                    pagesRead: 1,
                    maxPages: 10,
                    hasMore: false,
                    incomplete: false,
                },
            }),
        };
        const provider: AgentProvider = {
            complete: async ({ tools }) => {
                calls += 1;

                if (calls === 1) {
                    expect(tools.map(tool => tool.name)).toContain('recordLearnCardAssistantCard');

                    return {
                        message: {
                            role: 'assistant',
                            content: '',
                            toolCalls: [
                                {
                                    id: 'feed-call',
                                    name: 'recordLearnCardAssistantCard',
                                    arguments: {
                                        dedupeKey: 'assistant:storytelling',
                                        type: 'message',
                                        title: 'Practice interview storytelling',
                                        description:
                                            'Your next role match needs clearer project examples.',
                                        priority: 'high',
                                    },
                                },
                            ],
                        },
                    };
                }

                return {
                    message: {
                        role: 'assistant',
                        content: 'Heartbeat complete.',
                    },
                };
            },
        };
        const app = createAgentServer({
            config: testConfig,
            provider,
            tools: [],
            consentFlowRuntime,
            assistantFeedRuntime: createLearnCardAssistantFeedRuntime({
                mongoRuntime: healthyMongoRuntime,
                service: assistantFeedService,
            }),
        });

        await expect(
            callRoute(app, 'post', '/api/agent/heartbeat', {
                did: 'did:key:user',
                maxItems: 3,
            })
        ).resolves.toMatchObject({
            status: 200,
            payload: {
                ok: true,
                run: {
                    message: 'Heartbeat complete.',
                    toolRuns: [
                        {
                            id: 'feed-call',
                            name: 'recordLearnCardAssistantCard',
                        },
                    ],
                },
                items: [
                    {
                        ownerDid: 'did:key:user',
                        type: 'message',
                        title: 'Practice interview storytelling',
                        priority: 'high',
                    },
                ],
            },
        });
    });

    it('returns 503 for heartbeat when the default provider is unconfigured', async () => {
        const app = createAgentServer({
            config: testConfig,
            tools: [],
        });

        await expect(
            callRoute(app, 'post', '/api/agent/heartbeat', {
                did: 'did:key:user',
            })
        ).resolves.toEqual({
            status: 503,
            payload: {
                error: 'OPENAI_API_KEY must be set to run the AI agent.',
            },
        });
    });

    it('skips self-improvement when Mongo is unavailable', async () => {
        let retroCalls = 0;
        const mongoRuntime: MongoRuntime = {
            getClient: async () => {
                throw new Error('No Mongo.');
            },
            getDb: async () => {
                throw new Error('No Mongo.');
            },
            getStatus: async () => ({
                configured: false,
                connected: false,
                dbName: 'test-ai-agent',
                error: 'No Mongo.',
            }),
            close: async () => undefined,
        };
        const runtime = createSelfImprovementRuntime({
            config: {
                ...testConfig,
                openAIApiKey: 'test-key',
            },
            mongoRuntime,
            retroProvider: {
                complete: async () => {
                    retroCalls += 1;

                    return { message: { role: 'assistant', content: '{"action":"noop"}' } };
                },
            },
        });

        await expect(runtime.loadRequestSkills('did:key:user')).resolves.toEqual([]);
        await runtime.runAfterResponse({
            ownerDid: 'did:key:user',
            model: 'test-model',
            inputMessages: [{ role: 'user', content: 'Hi' }],
            result: {
                runId: 'run-1',
                message: 'Hello.',
                messages: [],
                toolRuns: [],
            },
        });

        expect(retroCalls).toBe(0);
    });

    it('records traces but skips retro when no OpenAI API key or retro provider is available', async () => {
        const userDocs = createUserDocService(createInMemoryUserDocRepository());
        const runTraces = createRunTraceService(createInMemoryRunTraceRepository());
        const retroResults = createInMemoryRetroResultRepository();
        const mongoRuntime: MongoRuntime = {
            getClient: async () => {
                throw new Error('Injected services should be used.');
            },
            getDb: async () => {
                throw new Error('Injected services should be used.');
            },
            getStatus: async () => ({
                configured: true,
                connected: true,
                dbName: 'test-ai-agent',
            }),
            close: async () => undefined,
        };
        const runtime = createSelfImprovementRuntime({
            config: {
                ...testConfig,
                openAIApiKey: undefined,
            },
            mongoRuntime,
            services: {
                userDocs,
                runTraces,
                retroResults,
            },
        });

        await runtime.runAfterResponse({
            ownerDid: 'did:key:user',
            model: 'test-model',
            inputMessages: [{ role: 'user', content: 'Hi' }],
            result: {
                runId: 'run-no-key',
                message: 'Hello.',
                messages: [],
                toolRuns: [],
            },
        });

        await expect(runtime.getRunForDebug('run-no-key')).resolves.toMatchObject({
            trace: expect.objectContaining({ runId: 'run-no-key' }),
            retroResults: [],
        });
    });
});
