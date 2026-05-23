import path from 'node:path';

import cors from 'cors';
import express from 'express';
import { z } from 'zod';

import { createOpenAIProvider } from './agent/openAIProvider';
import { runAgent } from './agent/runAgent';
import type { AgentProvider, AgentToolDefinition } from './agent/types';
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

export interface CreateServerOptions {
    config: ServiceConfig;
    provider?: AgentProvider;
    tools?: AgentToolDefinition[];
    consentFlowRuntime?: ConsentFlowRuntime;
    mongoRuntime?: MongoRuntime;
    selfImprovementRuntime?: SelfImprovementRuntime;
    publicDir?: string;
}

export interface RunChatOptions {
    body: unknown;
    config: ServiceConfig;
    provider: AgentProvider;
    tools: AgentToolDefinition[];
    consentFlowRuntime?: ConsentFlowRuntime;
    selfImprovementRuntime?: SelfImprovementRuntime;
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
    memoryManifestPrompt?: string
): string =>
    [
        `The current user DID is ${did}.`,
        contractUri
            ? `Use ConsentFlow contract ${contractUri} for consented user data.`
            : 'Use the configured ConsentFlow contract for consented user data.',
        'A background request for this user data has already started.',
        'Call getConsentedUserData only when the user request would benefit from consented profile, credential, or personal data.',
        memoryManifestPrompt,
    ]
        .filter(Boolean)
        .join('\n');

export const runChatRequest = async ({
    body,
    config,
    provider,
    tools,
    consentFlowRuntime,
    selfImprovementRuntime,
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
        let contextPrompt: string | undefined;

        agentTools.push(...memoryTools);

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
                memoryManifestPrompt
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
    const agentTools =
        tools ??
        createTools({
            walletSeed: config.walletSeed,
            cloudUrl: config.cloudUrl,
            networkUrl: config.networkUrl,
        });

    app.use(cors());
    app.use(express.json({ limit: '1mb' }));
    app.use(express.static(publicDir));

    app.get('/api/health', async (_req, res) => {
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
        });

        res.status(result.status).json(result.payload);
        void result.afterResponse?.().catch(() => undefined);
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
