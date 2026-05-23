import { describe, expect, it } from 'vitest';

import type { AgentProvider, AgentToolDefinition } from '../src/agent/types';
import type { ConsentFlowRuntime } from '../src/consentFlow';
import type { ServiceConfig } from '../src/config';
import type { MongoRuntime } from '../src/mongo';
import { createServer as createAgentServer, runChatRequest } from '../src/server';
import { createSelfImprovementRuntime, type SelfImprovementRuntime } from '../src/selfImprovement';
import {
    createInMemoryRunTraceRepository,
    createRunTraceService,
} from '../src/selfImprovement/runTrace';
import { createInMemoryRetroResultRepository } from '../src/selfImprovement/retro';
import {
    createInMemoryUserDocRepository,
    createUserDocService,
} from '../src/selfImprovement/userDocs';

const testConfig: ServiceConfig = {
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
});

describe('createServer', () => {
    const callRoute = async (
        app: ReturnType<typeof createAgentServer>,
        method: 'get' | 'post',
        routePath: string,
        body?: unknown,
        params: Record<string, string> = {}
    ): Promise<{ status: number; payload: unknown }> => {
        const { stack } = (
            app as unknown as {
                _router: {
                    stack: Array<{
                        route?: {
                            path: string;
                            methods: Record<string, boolean>;
                            stack: Array<{
                                handle: (req: unknown, res: unknown) => Promise<void> | void;
                            }>;
                        };
                    }>;
                };
            }
        )._router;
        const route = stack.find(
            (layer: {
                route?: {
                    path: string;
                    methods: Record<string, boolean>;
                    stack: Array<{ handle: (req: unknown, res: unknown) => Promise<void> | void }>;
                };
            }) => layer.route?.path === routePath && layer.route.methods[method]
        )?.route;
        const handler = route?.stack[0]?.handle;

        if (!handler) throw new Error(`Route ${method.toUpperCase()} ${routePath} not found.`);

        let status = 200;

        return new Promise((resolve, reject) => {
            const res = {
                status: (code: number) => {
                    status = code;
                    return res;
                },
                json: (payload: unknown) => {
                    resolve({ status, payload });
                    return res;
                },
            };

            Promise.resolve(handler({ body, params }, res)).catch(reject);
        });
    };

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
                configured: true,
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
