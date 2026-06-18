import path from 'node:path';

import cors from 'cors';
import express from 'express';
import { z } from 'zod';

import { createOpenAIProvider } from './agent/openAIProvider';
import { runAgent } from './agent/runAgent';
import type { AgentProvider, AgentToolDefinition } from './agent/types';
import {
    LearnCardAssistantCardToolInputValidator,
    createLearnCardAssistantFeedRuntime,
    toLearnCardAssistantCardResponse,
    type LearnCardAssistantFeedRuntime,
} from './assistantFeed';
import {
    UpdateLearnCardAssistantProfileValidator,
    createLearnCardAssistantProfileRuntime,
    toLearnCardAssistantProfileResponse,
    type LearnCardAssistantProfileRuntime,
} from './assistantProfile';
import { createConsentFlowRuntime, isProdNetworkUrl, type ConsentFlowRuntime } from './consentFlow';
import type { ServiceConfig } from './config';
import { createMongoRuntime, type MongoRuntime } from './mongo';
import {
    createSelfImprovementRuntime,
    toStoredInputMessages,
    type SelfImprovementRuntime,
} from './selfImprovement';
import {
    USER_DOC_KINDS,
    USER_DOC_SENSITIVITIES,
    USER_DOC_SOURCE_TYPES,
    type AgentUserDoc,
    type UserMemoryManifest,
} from './selfImprovement/userDocs';
import { createConsentedUserDataTool } from './tools/consentedUserData';
import { createTools } from './tools';

const MessageValidator = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1),
});

const RunRequestValidator = z.object({
    messages: z.array(MessageValidator).min(1),
    did: z.string().optional(),
    consentFlowContractUri: z.string().optional(),
});

const HeartbeatRequestValidator = z.object({
    did: z.string().trim().min(1),
    consentFlowContractUri: z.string().trim().min(1).optional(),
    maxItems: z.number().optional(),
});

const getLimitedQueryValue = (value: unknown, defaultLimit: number, maxLimit: number): number => {
    const parsed =
        typeof value === 'string'
            ? Number.parseInt(value, 10)
            : typeof value === 'number'
            ? value
            : defaultLimit;

    if (!Number.isFinite(parsed)) return defaultLimit;

    return Math.min(Math.max(Math.trunc(parsed), 1), maxLimit);
};

const OptionalExpiresAtValidator = z.preprocess(
    value => (value === null ? undefined : value),
    z.string().trim().min(1).optional()
);

const DebugMemoryRequestValidator = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('create'),
        name: z.string().optional(),
        kind: z.enum(USER_DOC_KINDS),
        description: z.string().min(1),
        content: z.string().min(1),
        status: z.enum(['active', 'proposed']).optional(),
        sourceType: z.enum(USER_DOC_SOURCE_TYPES).optional(),
        confidence: z.number().min(0).max(1).optional(),
        sensitivity: z.enum(USER_DOC_SENSITIVITIES).optional(),
        expiresAt: OptionalExpiresAtValidator,
        requiresApproval: z.boolean().optional(),
    }),
    z.object({
        action: z.literal('update'),
        name: z.string().min(1),
        kind: z.enum(USER_DOC_KINDS).optional(),
        description: z.string().min(1).optional(),
        content: z.string().min(1),
        status: z.enum(['active', 'proposed', 'archived']).optional(),
        sourceType: z.enum(USER_DOC_SOURCE_TYPES).optional(),
        confidence: z.number().min(0).max(1).optional(),
        sensitivity: z.enum(USER_DOC_SENSITIVITIES).optional(),
        expiresAt: z.union([z.string(), z.null()]).optional(),
        requiresApproval: z.boolean().optional(),
    }),
    z.object({
        action: z.literal('approve'),
        name: z.string().min(1),
    }),
    z.object({
        action: z.literal('archive'),
        name: z.string().min(1),
        reason: z.string().optional(),
    }),
]);

const AssistantCardFeedbackRequestValidator = z.object({ type: z.literal('thumbs-down') }).strict();

const AssistantMemoryArchiveRequestValidator = z
    .object({ reason: z.string().trim().min(1).optional() })
    .strict();

export interface CreateServerOptions {
    config: ServiceConfig;
    provider?: AgentProvider;
    tools?: AgentToolDefinition[];
    consentFlowRuntime?: ConsentFlowRuntime;
    mongoRuntime?: MongoRuntime;
    selfImprovementRuntime?: SelfImprovementRuntime;
    assistantFeedRuntime?: LearnCardAssistantFeedRuntime;
    assistantProfileRuntime?: LearnCardAssistantProfileRuntime;
    publicDir?: string;
}

export interface RunChatOptions {
    body: unknown;
    config: ServiceConfig;
    provider: AgentProvider;
    tools: AgentToolDefinition[];
    consentFlowRuntime?: ConsentFlowRuntime;
    selfImprovementRuntime?: SelfImprovementRuntime;
    assistantFeedRuntime?: LearnCardAssistantFeedRuntime;
    assistantProfileRuntime?: LearnCardAssistantProfileRuntime;
}

export interface RunChatResult {
    status: number;
    payload:
        | {
              message: string;
              runId: string;
              messages: Array<{ role: 'user' | 'assistant'; content: string }>;
              toolRuns: unknown[];
          }
        | { error: string };
    afterResponse?: () => Promise<void>;
}

const OPENAI_API_KEY_REQUIRED_ERROR = 'OPENAI_API_KEY must be set to run the AI agent.';

const createProvider = (config: ServiceConfig): AgentProvider => {
    if (!config.openAIApiKey) {
        return {
            complete: async () => {
                throw new Error(OPENAI_API_KEY_REQUIRED_ERROR);
            },
        };
    }

    return createOpenAIProvider(config.openAIApiKey);
};

const getPublicDir = (): string => path.join(process.cwd(), 'public');

const getRunContextPrompt = (
    did: string,
    contractUri?: string,
    memoryManifestPrompt?: string,
    assistantProfilePrompt?: string
): string =>
    [
        `The current user DID is ${did}.`,
        contractUri
            ? `Use ConsentFlow contract ${contractUri} for consented user data.`
            : 'Use the configured ConsentFlow contract for consented user data.',
        'A background request for this user data has already started.',
        'Call getConsentedUserData only when the user request would benefit from consented profile, credential, or personal data.',
        memoryManifestPrompt,
        assistantProfilePrompt,
    ]
        .filter(Boolean)
        .join('\n');

const serializeDate = (date?: Date): string | undefined => date?.toISOString();

const serializeAssistantMemoryManifest = (manifest?: UserMemoryManifest): unknown =>
    manifest
        ? {
              ...manifest,
              generatedAt: manifest.generatedAt.toISOString(),
              docs: manifest.docs.map(doc => ({
                  ...doc,
                  ...(doc.expiresAt ? { expiresAt: doc.expiresAt.toISOString() } : {}),
                  updatedAt: doc.updatedAt.toISOString(),
              })),
          }
        : undefined;

const serializeAssistantMemoryDoc = (doc: AgentUserDoc): unknown => ({
    name: doc.name,
    kind: doc.kind,
    description: doc.description,
    content: doc.content,
    status: doc.status,
    sourceType: doc.sourceType,
    confidence: doc.confidence,
    sensitivity: doc.sensitivity,
    requiresApproval: doc.requiresApproval,
    version: doc.version,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    ...(serializeDate(doc.proposedAt) ? { proposedAt: serializeDate(doc.proposedAt) } : {}),
    ...(serializeDate(doc.approvedAt) ? { approvedAt: serializeDate(doc.approvedAt) } : {}),
    ...(serializeDate(doc.archivedAt) ? { archivedAt: serializeDate(doc.archivedAt) } : {}),
});

export const runChatRequest = async ({
    body,
    config,
    provider,
    tools,
    consentFlowRuntime,
    selfImprovementRuntime,
    assistantFeedRuntime,
    assistantProfileRuntime,
}: RunChatOptions): Promise<RunChatResult> => {
    const parsed = RunRequestValidator.safeParse(body);

    if (!parsed.success) {
        return {
            status: 400,
            payload: {
                error: 'Invalid request. Send a messages array with user or assistant messages.',
            },
        };
    }

    try {
        const did = parsed.data.did?.trim();
        const consentFlowContractUri = parsed.data.consentFlowContractUri?.trim();
        const agentTools = [...tools];
        const runtime = consentFlowRuntime ?? createConsentFlowRuntime(config);
        const requestSkills = await (async () => {
            try {
                return (await selfImprovementRuntime?.loadRequestSkills(did)) ?? [];
            } catch {
                return [];
            }
        })();
        const memoryTools = await (async () => {
            try {
                return (await selfImprovementRuntime?.loadRequestTools(did)) ?? [];
            } catch {
                return [];
            }
        })();
        const memoryManifestPrompt = await (async () => {
            try {
                return await selfImprovementRuntime?.getMemoryManifestPrompt(did);
            } catch {
                return undefined;
            }
        })();
        const assistantFeedTools = await (async () => {
            try {
                return (await assistantFeedRuntime?.loadRequestTools(did)) ?? [];
            } catch {
                return [];
            }
        })();
        const assistantProfilePrompt = await (async () => {
            try {
                return await assistantProfileRuntime?.getPrompt(did);
            } catch {
                return undefined;
            }
        })();
        let contextPrompt: string | undefined;

        agentTools.push(...memoryTools, ...assistantFeedTools);
        if (did) {
            const dataPromise = runtime.loadConsentedUserData({
                did,
                contractUri: consentFlowContractUri || undefined,
            });
            dataPromise.catch(() => undefined);

            agentTools.push(createConsentedUserDataTool({ did, dataPromise }));
            contextPrompt = getRunContextPrompt(
                did,
                consentFlowContractUri || undefined,
                memoryManifestPrompt,
                assistantProfilePrompt
            );
        }

        const result = await runAgent({
            model: config.model,
            messages: parsed.data.messages,
            provider,
            tools: agentTools,
            skills: requestSkills,
            maxToolRounds: config.maxToolRounds,
            contextPrompt,
        });

        return {
            status: 200,
            payload: {
                message: result.message,
                runId: result.runId,
                messages: [...parsed.data.messages, { role: 'assistant', content: result.message }],
                toolRuns: result.toolRuns,
            },
            afterResponse: async () => {
                await selfImprovementRuntime?.runAfterResponse({
                    ownerDid: did,
                    model: config.model,
                    inputMessages: toStoredInputMessages(parsed.data.messages),
                    result,
                });
            },
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'The agent failed to run.';

        return {
            status: 500,
            payload: { error: message },
        };
    }
};

export const createServer = ({
    config,
    provider,
    tools,
    consentFlowRuntime,
    mongoRuntime,
    selfImprovementRuntime,
    assistantFeedRuntime,
    assistantProfileRuntime,
    publicDir = getPublicDir(),
}: CreateServerOptions): express.Express => {
    const app = express();
    const agentProvider = provider ?? createProvider(config);
    const providerConfigured = Boolean(provider || config.openAIApiKey);
    const consentRuntime = consentFlowRuntime ?? createConsentFlowRuntime(config);
    const mongo = mongoRuntime ?? createMongoRuntime(config);
    const selfImprovement =
        selfImprovementRuntime ??
        createSelfImprovementRuntime({
            config,
            mongoRuntime: mongo,
        });
    const assistantFeed =
        assistantFeedRuntime ??
        createLearnCardAssistantFeedRuntime({
            mongoRuntime: mongo,
        });
    const assistantProfile =
        assistantProfileRuntime ??
        createLearnCardAssistantProfileRuntime({
            mongoRuntime: mongo,
        });
    const agentTools =
        tools ??
        createTools({
            walletSeed: config.walletSeed,
            cloudUrl: config.cloudUrl,
            networkUrl: config.networkUrl,
            webSearchProvider: config.webSearchProvider,
            braveSearchApiKey: config.braveSearchApiKey,
            webSearchDefaultLimit: config.webSearchDefaultLimit,
            webSearchMaxLimit: config.webSearchMaxLimit,
            webSearchCountry: config.webSearchCountry,
            webSearchSearchLang: config.webSearchSearchLang,
            webSearchSafeSearch: config.webSearchSafeSearch,
        });

    app.use(cors());
    app.use(express.json({ limit: '1mb' }));
    app.use(express.static(publicDir));

    app.get('/api/health', async (_req, res) => {
        const assistantFeedStatus = await assistantFeed.getStatus();
        const assistantProfileStatus = await assistantProfile.getStatus();
        res.json({
            ok: true,
            model: config.model,
            providerConfigured,
            cloudUrl: config.cloudUrl ?? 'https://cloud.learncard.com/trpc',
            networkUrl: config.networkUrl ?? 'https://network.learncard.com/trpc',
            mongo: await mongo.getStatus(),
            consentFlow: {
                contractUri: config.consentFlowContractUri,
                autoCreateDevelopmentContract:
                    !config.consentFlowContractUri && !isProdNetworkUrl(config.networkUrl),
                appUrl: config.consentFlowAppUrl,
            },
            selfImprovement: {
                enabled: config.selfImprovementEnabled,
                retroModel: config.retroModel,
                retroMaxTraceChars: config.retroMaxTraceChars,
            },
            assistantFeed: {
                enabled: assistantFeedStatus.connected,
            },
            assistantProfile: {
                enabled: assistantProfileStatus.connected,
            },
            webSearch: {
                provider: config.webSearchProvider,
                enabled: agentTools.some(tool => tool.name === 'webSearch'),
            },
            tools: agentTools.map(tool => tool.name),
        });
    });

    app.get('/api/consent-flow/contract', async (_req, res) => {
        if (!providerConfigured) {
            res.status(503).json({
                ok: false,
                error: 'OPENAI_API_KEY must be set before creating a ConsentFlow contract.',
            });
            return;
        }

        try {
            res.json({
                ok: true,
                contract: await consentRuntime.getContractInfo(),
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Could not resolve ConsentFlow contract.';

            res.status(500).json({ ok: false, error: message });
        }
    });

    app.post('/api/agent/run', async (req, res) => {
        if (!providerConfigured) {
            res.status(503).json({ error: OPENAI_API_KEY_REQUIRED_ERROR });
            return;
        }

        const result = await runChatRequest({
            body: req.body,
            config,
            provider: agentProvider,
            tools: agentTools,
            consentFlowRuntime: consentRuntime,
            selfImprovementRuntime: selfImprovement,
            assistantFeedRuntime: assistantFeed,
            assistantProfileRuntime: assistantProfile,
        });

        res.status(result.status).json(result.payload);
        void result.afterResponse?.().catch(() => undefined);
    });

    app.post('/api/agent/heartbeat', async (req, res) => {
        if (!providerConfigured) {
            res.status(503).json({ error: OPENAI_API_KEY_REQUIRED_ERROR });
            return;
        }

        const parsed = HeartbeatRequestValidator.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({ ok: false, error: 'Invalid heartbeat request.' });
            return;
        }

        const maxItems = getLimitedQueryValue(parsed.data.maxItems, 3, 5);
        const result = await runChatRequest({
            body: {
                did: parsed.data.did,
                consentFlowContractUri: parsed.data.consentFlowContractUri,
                messages: [
                    {
                        role: 'user',
                        content: `Run a proactive LearnCard Assistant heartbeat for this learner. Review approved profile data and current memory. Create at most ${maxItems} Assistant inbox cards by calling recordLearnCardAssistantCard. Only create concrete, useful cards. Use type message for a general note or check-in, job-suggestion for job matches, pathway-update for progress or pathway changes, and action-item when the learner needs to review or decide something. Use priority high only when the learner should see it immediately.`,
                    },
                ],
            },
            config,
            provider: agentProvider,
            tools: agentTools,
            consentFlowRuntime: consentRuntime,
            selfImprovementRuntime: selfImprovement,
            assistantFeedRuntime: assistantFeed,
            assistantProfileRuntime: assistantProfile,
        });

        if (result.status !== 200) {
            res.status(result.status).json(result.payload);
            return;
        }

        await result.afterResponse?.();

        res.json({
            ok: true,
            run: result.payload,
            items: (await assistantFeed.listLatest(parsed.data.did, maxItems)).map(
                toLearnCardAssistantCardResponse
            ),
        });
    });

    app.get('/api/users/:did/assistant-feed', async (req, res) => {
        const limit = getLimitedQueryValue(req.query?.limit, 10, 50);

        res.json({
            ok: true,
            items: (await assistantFeed.listLatest(req.params.did, limit)).map(
                toLearnCardAssistantCardResponse
            ),
        });
    });

    app.post('/api/debug/users/:did/assistant-feed', async (req, res) => {
        const parsed = LearnCardAssistantCardToolInputValidator.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({ ok: false, error: 'Invalid assistant card.' });
            return;
        }

        try {
            const item = await assistantFeed.recordItem({
                ...parsed.data,
                ownerDid: req.params.did,
            });

            res.json({ ok: true, item: toLearnCardAssistantCardResponse(item) });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Could not record assistant card.';

            res.status(400).json({ ok: false, error: message });
        }
    });

    app.post('/api/users/:did/assistant-feed/:id/read', async (req, res) => {
        try {
            const item = await assistantFeed.markItemRead(req.params.did, req.params.id);

            res.json({ ok: true, item: toLearnCardAssistantCardResponse(item) });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Could not mark assistant card read.';

            res.status(400).json({ ok: false, error: message });
        }
    });

    app.post('/api/users/:did/assistant-feed/:id/feedback', async (req, res) => {
        const parsed = AssistantCardFeedbackRequestValidator.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({ ok: false, error: 'Invalid assistant card feedback.' });
            return;
        }

        try {
            const item = await assistantFeed.recordFeedback(
                req.params.did,
                req.params.id,
                parsed.data
            );

            res.json({ ok: true, item: toLearnCardAssistantCardResponse(item) });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Could not record assistant feedback.';

            res.status(400).json({ ok: false, error: message });
        }
    });

    app.get('/api/users/:did/assistant-profile', async (req, res) => {
        res.json({
            ok: true,
            profile: toLearnCardAssistantProfileResponse(
                await assistantProfile.getProfile(req.params.did)
            ),
        });
    });

    app.patch('/api/users/:did/assistant-profile', async (req, res) => {
        const body = typeof req.body === 'object' && req.body ? req.body : {};
        const parsed = UpdateLearnCardAssistantProfileValidator.safeParse({
            ...body,
            ownerDid: req.params.did,
        });

        if (!parsed.success) {
            res.status(400).json({ ok: false, error: 'Invalid assistant profile.' });
            return;
        }

        try {
            const profile = await assistantProfile.updateProfile(parsed.data);

            res.json({ ok: true, profile: toLearnCardAssistantProfileResponse(profile) });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Could not update assistant profile.';

            res.status(400).json({ ok: false, error: message });
        }
    });

    app.get('/api/users/:did/assistant-memories', async (req, res) => {
        res.json({
            ok: true,
            manifest: serializeAssistantMemoryManifest(
                await selfImprovement.getAssistantMemoryManifest(req.params.did)
            ),
            docs: (await selfImprovement.getAssistantMemoryDocs(req.params.did)).map(
                serializeAssistantMemoryDoc
            ),
        });
    });

    app.post('/api/users/:did/assistant-memories/:name/approve', async (req, res) => {
        try {
            const doc = await selfImprovement.approveAssistantMemory(
                req.params.did,
                req.params.name
            );

            res.json({
                ok: true,
                doc: serializeAssistantMemoryDoc(doc),
                manifest: serializeAssistantMemoryManifest(
                    await selfImprovement.getAssistantMemoryManifest(req.params.did)
                ),
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Could not approve assistant memory.';

            res.status(400).json({ ok: false, error: message });
        }
    });

    app.post('/api/users/:did/assistant-memories/:name/archive', async (req, res) => {
        const parsed = AssistantMemoryArchiveRequestValidator.safeParse(req.body ?? {});

        if (!parsed.success) {
            res.status(400).json({ ok: false, error: 'Invalid assistant memory archive.' });
            return;
        }

        try {
            const doc = await selfImprovement.archiveAssistantMemory(
                req.params.did,
                req.params.name,
                parsed.data.reason
            );

            res.json({
                ok: true,
                doc: serializeAssistantMemoryDoc(doc),
                manifest: serializeAssistantMemoryManifest(
                    await selfImprovement.getAssistantMemoryManifest(req.params.did)
                ),
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Could not archive assistant memory.';

            res.status(400).json({ ok: false, error: message });
        }
    });
    app.get('/api/debug/users/:did/docs', async (req, res) => {
        res.json({
            ok: true,
            docs: await selfImprovement.getDocsForDebug(req.params.did),
        });
    });

    app.get('/api/debug/users/:did/memory', async (req, res) => {
        const manifest = await selfImprovement.getMemoryManifestForDebug(req.params.did);

        res.json({
            ok: true,
            manifest,
            docs: await selfImprovement.getDocsForDebug(req.params.did),
        });
    });

    app.post('/api/debug/users/:did/memory', async (req, res) => {
        const parsed = DebugMemoryRequestValidator.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({ ok: false, error: 'Invalid memory debug request.' });
            return;
        }

        try {
            const ownerDid = req.params.did;
            const { action } = parsed.data;
            const doc =
                action === 'create'
                    ? await selfImprovement.createDebugDoc({
                          ownerDid,
                          name:
                              parsed.data.name ??
                              parsed.data.description
                                  .toLowerCase()
                                  .replace(/[^a-z0-9._-]+/g, '-')
                                  .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
                                  .slice(0, 48),
                          kind: parsed.data.kind,
                          description: parsed.data.description,
                          content: parsed.data.content,
                          status: parsed.data.status,
                          sourceType: parsed.data.sourceType,
                          confidence: parsed.data.confidence,
                          sensitivity: parsed.data.sensitivity,
                          expiresAt: parsed.data.expiresAt,
                          requiresApproval: parsed.data.requiresApproval,
                      })
                    : action === 'update'
                    ? await selfImprovement.updateDebugDoc({
                          ownerDid,
                          name: parsed.data.name,
                          kind: parsed.data.kind,
                          description: parsed.data.description,
                          content: parsed.data.content,
                          status: parsed.data.status,
                          sourceType: parsed.data.sourceType,
                          confidence: parsed.data.confidence,
                          sensitivity: parsed.data.sensitivity,
                          expiresAt: parsed.data.expiresAt,
                          requiresApproval: parsed.data.requiresApproval,
                      })
                    : action === 'approve'
                    ? await selfImprovement.approveDebugDoc(ownerDid, parsed.data.name)
                    : await selfImprovement.archiveDebugDoc({
                          ownerDid,
                          name: parsed.data.name,
                          reason: parsed.data.reason,
                          provenance: { reason: parsed.data.reason },
                      });

            res.json({
                ok: true,
                doc,
                manifest: await selfImprovement.getMemoryManifestForDebug(ownerDid),
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Could not update debug memory.';

            res.status(400).json({ ok: false, error: message });
        }
    });

    app.get('/api/debug/runs/:runId', async (req, res) => {
        const run = await selfImprovement.getRunForDebug(req.params.runId);

        if (!run) {
            res.status(404).json({ ok: false, error: 'Run trace not found.' });
            return;
        }

        res.json({
            ok: true,
            ...run,
        });
    });

    app.get('*', (_req, res) => {
        res.sendFile(path.join(publicDir, 'index.html'));
    });

    return app;
};
