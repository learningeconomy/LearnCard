import { describe, expect, it } from 'vitest';

import type { AgentProvider, AgentToolDefinition } from '../src/agent/types';
import type { ConsentFlowRuntime } from '../src/consentFlow';
import type { ServiceConfig } from '../src/config';
import { createServer as createAgentServer, runChatRequest } from '../src/server';

const testConfig: ServiceConfig = {
    model: 'test-model',
    port: 0,
    maxToolRounds: 3,
    consentFlowAppUrl: 'https://learncard.app',
    consentFlowDataPageSize: 100,
    consentFlowDataMaxPages: 10,
    consentFlowCredentialReadLimit: 50,
    mongoDbName: 'test-ai-agent',
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
        expect(result.payload).toEqual({
            message: 'Hello from the test agent.',
            messages: [
                { role: 'user', content: 'Hi' },
                { role: 'assistant', content: 'Hello from the test agent.' },
            ],
            toolRuns: [],
        });
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
});

describe('createServer', () => {
    const callRoute = async (
        app: ReturnType<typeof createAgentServer>,
        method: 'get' | 'post',
        routePath: string,
        body?: unknown
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

            Promise.resolve(handler({ body }, res)).catch(reject);
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
});
