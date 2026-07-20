import { describe, expect, it, vi } from 'vitest';

import type {
    AgentProvider,
    AgentSkillDefinition,
    AgentToolDefinition,
} from '../../src/agent/types';
import {
    createInMemoryLearnCardAssistantFeedRepository,
    createLearnCardAssistantFeedRuntime,
    createLearnCardAssistantFeedService,
    type LearnCardAssistantFeedService,
} from '../../src/assistantFeed';
import {
    createInMemoryLearnCardAssistantProfileRepository,
    createLearnCardAssistantProfileRuntime,
    createLearnCardAssistantProfileService,
} from '../../src/assistantProfile';
import { runScheduledAgentRequest } from '../../src/autonomy/runner';
import {
    createAgentAutonomyScheduleService,
    createInMemoryAgentAutonomyScheduleRepository,
    createLearnCardAssistantSchedulesRuntime,
    type AgentAutonomySchedule,
} from '../../src/autonomy/schedules';
import type { ConsentFlowRuntime } from '../../src/consentFlow';
import type { ServiceConfig } from '../../src/config';
import type { MongoRuntime } from '../../src/mongo';
import type { AgentServiceRuntime } from '../../src/runtime';
import type { SelfImprovementRuntime } from '../../src/selfImprovement';

const OWNER_DID = 'did:key:scheduled-user';
const SCHEDULED_FOR = new Date('2026-07-16T14:30:00.000Z');

const config: ServiceConfig = {
    nodeEnv: 'test',
    model: 'test-model',
    port: 0,
    maxToolRounds: 5,
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

const mongoRuntime: MongoRuntime = {
    getClient: async () => {
        throw new Error('Mongo should not be used.');
    },
    getDb: async () => {
        throw new Error('Mongo should not be used.');
    },
    getStatus: async () => ({ configured: false, connected: false, dbName: 'test' }),
    close: async () => undefined,
};

const schedule: AgentAutonomySchedule = {
    id: 'morning-briefing',
    ownerDid: OWNER_DID,
    name: 'Morning briefing',
    prompt: 'Create a concise briefing with weather, sports, and AI news.',
    enabled: true,
    timeOfDay: '07:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    timezone: 'America/Los_Angeles',
    cron: '30 7 * * 0,1,2,3,4,5,6',
    nextRunAt: SCHEDULED_FOR,
    createdAt: new Date('2026-07-15T12:00:00.000Z'),
    updatedAt: new Date('2026-07-15T12:00:00.000Z'),
};

const createTool = (
    name: string,
    execute: AgentToolDefinition['execute'] = async () => ({ ok: true })
): AgentToolDefinition => ({
    name,
    description: `${name} test tool`,
    parameters: { type: 'object', properties: {}, additionalProperties: true },
    execute,
});

const createSelfImprovement = ({
    memoryTools,
    skills = [],
    runAfterResponse = vi.fn(async () => undefined),
}: {
    memoryTools: AgentToolDefinition[];
    skills?: AgentSkillDefinition[];
    runAfterResponse?: SelfImprovementRuntime['runAfterResponse'];
}): SelfImprovementRuntime => ({
    loadRequestSkills: async ownerDid => (ownerDid === OWNER_DID ? skills : []),
    loadRequestTools: async ownerDid => (ownerDid === OWNER_DID ? memoryTools : []),
    getMemoryManifestPrompt: async ownerDid =>
        ownerDid === OWNER_DID ? 'Memory manifest for the scheduled user.' : undefined,
    runAfterResponse,
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
});

const consentFlowRuntime: ConsentFlowRuntime = {
    getContractInfo: async () => ({
        uri: 'lc:network:test:contract:scheduled',
        consentUrl: 'https://learncard.app/consent-flow?uri=scheduled',
        source: 'configured',
        created: false,
    }),
    loadConsentedUserData: async ({ did }) => ({
        did,
        contract: {
            uri: 'lc:network:test:contract:scheduled',
            consentUrl: 'https://learncard.app/consent-flow?uri=scheduled',
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

const createRuntime = ({
    provider,
    selfImprovementRuntime,
    baseTools,
}: {
    provider: AgentProvider;
    selfImprovementRuntime: SelfImprovementRuntime;
    baseTools: AgentToolDefinition[];
}): {
    runtime: AgentServiceRuntime;
    feedService: LearnCardAssistantFeedService;
} => {
    const feedService = createLearnCardAssistantFeedService(
        createInMemoryLearnCardAssistantFeedRepository()
    );
    const assistantFeedRuntime = createLearnCardAssistantFeedRuntime({
        mongoRuntime,
        service: feedService,
    });
    const assistantProfileRuntime = createLearnCardAssistantProfileRuntime({
        mongoRuntime,
        service: createLearnCardAssistantProfileService(
            createInMemoryLearnCardAssistantProfileRepository()
        ),
    });
    const assistantSchedulesRuntime = createLearnCardAssistantSchedulesRuntime({
        mongoRuntime,
        service: createAgentAutonomyScheduleService(
            createInMemoryAgentAutonomyScheduleRepository([schedule])
        ),
    });

    return {
        runtime: {
            config,
            provider,
            providerConfigured: true,
            tools: baseTools,
            mongoRuntime,
            consentFlowRuntime,
            selfImprovementRuntime,
            assistantFeedRuntime,
            assistantProfileRuntime,
            assistantSchedulesRuntime,
            getEncryption: () => {
                throw new Error('Encryption should not be used.');
            },
        },
        feedService,
    };
};

describe('scheduled full-agent runner', () => {
    it('uses the complete agent tool set, memory, retro, and an autonomous agent card', async () => {
        const memory = new Map<string, string>();
        const webSearch = vi.fn(async () => ({ results: [{ title: 'Current AI news' }] }));
        const runAfterResponse = vi.fn(async () => undefined);
        const memoryTools = [
            createTool('getUserMemoryManifest', async () => ({ names: [...memory.keys()] })),
            createTool('rememberUserMemory', async args => {
                memory.set(String(args.name), String(args.content));

                return { saved: true };
            }),
            createTool('proposeUserMemory'),
            createTool('forgetUserMemory'),
        ];
        const skill: AgentSkillDefinition = {
            name: 'learning-history',
            description: 'Approved learning history.',
            load: async () => 'Learning history content.',
        };
        const selfImprovementRuntime = createSelfImprovement({
            memoryTools,
            skills: [skill],
            runAfterResponse,
        });
        let providerRound = 0;
        const provider: AgentProvider = {
            complete: async ({ messages, tools }) => {
                providerRound += 1;
                const toolNames = tools.map(tool => tool.name);

                expect(toolNames).toEqual(
                    expect.arrayContaining([
                        'learnCardWallet',
                        'webSearch',
                        'getUserMemoryManifest',
                        'rememberUserMemory',
                        'proposeUserMemory',
                        'forgetUserMemory',
                        'getConsentedUserData',
                        'recordLearnCardAssistantCard',
                        'searchSkills',
                        'readSkill',
                    ])
                );

                if (providerRound === 1) {
                    expect(messages[1]?.content).toBe(
                        [
                            'Scheduled task: Morning briefing',
                            'Scheduled for: 2026-07-16T14:30:00.000Z (America/Los_Angeles)',
                            '',
                            'Create a concise briefing with weather, sports, and AI news.',
                            '',
                            "Complete this task autonomously using your full LearnCard Agent capabilities. Use or update this user's memory when useful, and avoid repeating information the user has already received. Summarize the result clearly for the user.",
                        ].join('\n')
                    );

                    return {
                        message: {
                            role: 'assistant',
                            content: '',
                            toolCalls: [
                                {
                                    id: 'search',
                                    name: 'webSearch',
                                    arguments: { query: 'AI news' },
                                },
                                {
                                    id: 'manifest',
                                    name: 'getUserMemoryManifest',
                                    arguments: {},
                                },
                                {
                                    id: 'remember',
                                    name: 'rememberUserMemory',
                                    arguments: {
                                        name: 'covered-topics',
                                        content: 'Current AI news',
                                    },
                                },
                                {
                                    id: 'card',
                                    name: 'recordLearnCardAssistantCard',
                                    arguments: {
                                        dedupeKey: 'briefing:2026-07-16',
                                        type: 'message',
                                        title: 'Morning briefing',
                                        description: 'Your morning briefing is ready.',
                                    },
                                },
                            ],
                        },
                    };
                }

                return {
                    message: {
                        role: 'assistant',
                        content: 'Seattle weather, Mariners, and AI news summarized.',
                    },
                };
            },
        };
        const { runtime, feedService } = createRuntime({
            provider,
            selfImprovementRuntime,
            baseTools: [createTool('learnCardWallet'), createTool('webSearch', webSearch)],
        });
        const result = await runScheduledAgentRequest({
            schedule,
            scheduledFor: SCHEDULED_FOR,
            runtime,
        });
        const cards = await feedService.listLatest(OWNER_DID);

        expect(result.status).toBe(200);
        expect(webSearch).toHaveBeenCalledWith({ query: 'AI news' }, expect.any(Object));
        expect(memory.get('covered-topics')).toBe('Current AI news');
        expect(runAfterResponse).toHaveBeenCalledWith(
            expect.objectContaining({
                ownerDid: OWNER_DID,
                model: 'test-model',
                result: expect.objectContaining({ runId: expect.any(String) }),
            })
        );
        expect(cards).toHaveLength(1);
        expect(cards[0]).toMatchObject({
            origin: 'autonomous',
            dedupeKey: 'briefing:2026-07-16',
            sourceRunId: expect.any(String),
        });
    });

    it('records one deterministic fallback card after a text-only completion and retro', async () => {
        let retroCompleted = false;
        const selfImprovementRuntime = createSelfImprovement({
            memoryTools: [],
            runAfterResponse: async () => {
                retroCompleted = true;
            },
        });
        const provider: AgentProvider = {
            complete: async () => ({
                message: {
                    role: 'assistant',
                    content: `  ${'A useful scheduled result. '.repeat(100)}  `,
                },
            }),
        };
        const { runtime, feedService } = createRuntime({
            provider,
            selfImprovementRuntime,
            baseTools: [createTool('learnCardWallet'), createTool('webSearch')],
        });
        const result = await runScheduledAgentRequest({
            schedule,
            scheduledFor: SCHEDULED_FOR,
            runtime,
        });
        const cards = await feedService.listLatest(OWNER_DID);

        expect(retroCompleted).toBe(true);
        expect(cards).toHaveLength(1);
        expect(cards[0]).toMatchObject({
            origin: 'autonomous',
            dedupeKey: 'autonomy:morning-briefing:2026-07-16T14:30:00.000Z',
            type: 'message',
            title: 'Morning briefing',
            priority: 'normal',
            sourceRunId:
                result.status === 200 && 'runId' in result.payload
                    ? result.payload.runId
                    : undefined,
        });
        expect(cards[0]!.description).toHaveLength(220);
        expect(cards[0]!.detail?.length).toBeLessThanOrEqual(2_000);
    });

    it('fails the schedule when the agent or retro path fails', async () => {
        const failedProvider: AgentProvider = {
            complete: async () => {
                throw new Error('provider failed');
            },
        };
        const providerFailure = createRuntime({
            provider: failedProvider,
            selfImprovementRuntime: createSelfImprovement({ memoryTools: [] }),
            baseTools: [],
        });

        await expect(
            runScheduledAgentRequest({
                schedule,
                scheduledFor: SCHEDULED_FOR,
                runtime: providerFailure.runtime,
            })
        ).rejects.toThrow('provider failed');

        const retroFailure = createRuntime({
            provider: {
                complete: async () => ({
                    message: { role: 'assistant', content: 'Agent completed.' },
                }),
            },
            selfImprovementRuntime: createSelfImprovement({
                memoryTools: [],
                runAfterResponse: async () => {
                    throw new Error('retro failed');
                },
            }),
            baseTools: [],
        });

        await expect(
            runScheduledAgentRequest({
                schedule,
                scheduledFor: SCHEDULED_FOR,
                runtime: retroFailure.runtime,
            })
        ).rejects.toThrow('retro failed');
    });
});
