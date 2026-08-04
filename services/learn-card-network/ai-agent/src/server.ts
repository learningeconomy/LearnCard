import cors from 'cors';
import express, { type RequestHandler } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { z } from 'zod';

import { runAgent } from './agent/runAgent';
import type { AgentProvider, AgentToolDefinition, AgentToolRun } from './agent/types';
import {
    LearnCardAssistantCardToolInputValidator,
    toLearnCardAssistantCardResponse,
    type LearnCardAssistantFeedRuntime,
} from './assistantFeed';
import {
    UpdateLearnCardAssistantProfileValidator,
    toLearnCardAssistantProfileResponse,
    type LearnCardAssistantProfileRuntime,
} from './assistantProfile';
import {
    AgentAutonomyScheduleNotFoundError,
    CreateAgentAutonomyScheduleBodyValidator,
    UpdateAgentAutonomyScheduleBodyValidator,
    toAgentAutonomyScheduleResponse,
} from './autonomy/schedules';
import { createConsentFlowRuntime, isProdNetworkUrl, type ConsentFlowRuntime } from './consentFlow';
import type { ServiceConfig } from './config';
import { getEmptyAgentLearnCard } from './helpers/learnCard.helpers';
import { toStoredInputMessages, type SelfImprovementRuntime } from './selfImprovement';
import {
    USER_DOC_KINDS,
    USER_DOC_SENSITIVITIES,
    USER_DOC_SOURCE_TYPES,
    type AgentUserDoc,
    type UserMemoryManifest,
} from './selfImprovement/userDocs';
import { createConsentedUserDataTool } from './tools/consentedUserData';
import {
    AgentDidAuthError,
    createMongoDidAuthChallengeStore,
    createSecureChallenge,
    verifyDidAuthRequest,
    type AgentDidAuthChallengeStore,
    type AgentDidAuthContext,
    type AgentDidAuthVerifierLearnCard,
} from './security/didAuth';
import { createAgentServiceRuntime, type CreateAgentServiceRuntimeOptions } from './runtime';

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
    did: z.string().trim().min(1).optional(),
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

export interface CreateServerOptions extends CreateAgentServiceRuntimeOptions {
    didAuthChallengeStore?: AgentDidAuthChallengeStore;
    getVerifierLearnCard?: () => Promise<AgentDidAuthVerifierLearnCard>;
}

export interface RunChatOptions {
    body: unknown;
    ownerDid: string;
    config: ServiceConfig;
    provider: AgentProvider;
    tools: AgentToolDefinition[];
    consentFlowRuntime?: ConsentFlowRuntime;
    selfImprovementRuntime?: SelfImprovementRuntime;
    assistantFeedRuntime?: LearnCardAssistantFeedRuntime;
    assistantProfileRuntime?: LearnCardAssistantProfileRuntime;
    runOrigin?: 'interactive' | 'autonomous';
    signal?: AbortSignal;
}

export interface RunChatResult {
    status: number;
    payload:
        | {
              message: string;
              runId: string;
              messages: Array<{ role: 'user' | 'assistant'; content: string }>;
              toolRuns: AgentToolRun[];
          }
        | { error: string };
    afterResponse?: (signal?: AbortSignal) => Promise<void>;
}

const OPENAI_API_KEY_REQUIRED_ERROR = 'OPENAI_API_KEY must be set to run the AI agent.';

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
    ownerDid,
    config,
    provider,
    tools,
    consentFlowRuntime,
    selfImprovementRuntime,
    assistantFeedRuntime,
    assistantProfileRuntime,
    runOrigin = 'interactive',
    signal,
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
        const did = ownerDid;
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
                return (await assistantFeedRuntime?.loadRequestTools(did, runOrigin)) ?? [];
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
            ...(signal ? { signal } : {}),
        });

        return {
            status: 200,
            payload: {
                message: result.message,
                runId: result.runId,
                messages: [...parsed.data.messages, { role: 'assistant', content: result.message }],
                toolRuns: result.toolRuns,
            },
            afterResponse: async afterResponseSignal => {
                await selfImprovementRuntime?.runAfterResponse({
                    ownerDid: did,
                    model: config.model,
                    inputMessages: toStoredInputMessages(parsed.data.messages),
                    result,
                    ...(afterResponseSignal ? { signal: afterResponseSignal } : {}),
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
    didAuthChallengeStore,
    getVerifierLearnCard,
    ...runtimeOptions
}: CreateServerOptions): express.Express => {
    const app = express();
    const runtime = createAgentServiceRuntime(runtimeOptions);
    const {
        config,
        provider: agentProvider,
        providerConfigured,
        tools: agentTools,
        mongoRuntime: mongo,
        consentFlowRuntime: consentRuntime,
        selfImprovementRuntime: selfImprovement,
        assistantFeedRuntime: assistantFeed,
        assistantProfileRuntime: assistantProfile,
        assistantSchedulesRuntime: assistantSchedules,
    } = runtime;

    app.set('trust proxy', config.trustProxyHops ?? 0);
    let challengeStorePromise: Promise<AgentDidAuthChallengeStore> | undefined;

    const getChallengeStore = async (): Promise<AgentDidAuthChallengeStore> => {
        if (didAuthChallengeStore) return didAuthChallengeStore;

        challengeStorePromise ??= mongo
            .getDb()
            .then(db => createMongoDidAuthChallengeStore(db))
            .catch(error => {
                challengeStorePromise = undefined;

                throw error;
            });

        return challengeStorePromise;
    };

    const getAuthContext = (res: express.Response): AgentDidAuthContext | undefined =>
        res.locals.agentDidAuth;

    const requireDidAuth: RequestHandler = async (req, res, next) => {
        try {
            res.locals.agentDidAuth = await verifyDidAuthRequest(req, {
                config,
                challengeStore: await getChallengeStore(),
                getVerifierLearnCard: getVerifierLearnCard ?? getEmptyAgentLearnCard,
            });

            next();
        } catch (error) {
            if (error instanceof AgentDidAuthError) {
                res.status(401).json({ ok: false, error: 'DID Auth is required.' });
                return;
            }

            res.status(503).json({ ok: false, error: 'DID Auth is unavailable.' });
        }
    };

    const authenticatedRateLimitKey = (req: express.Request, res: express.Response): string =>
        getAuthContext(res)?.did ?? ipKeyGenerator(req.ip ?? 'unknown');

    const rateLimitMessage = {
        ok: false,
        error: 'Too many requests. Please try again shortly.',
    };

    const baselineRateLimit = rateLimit({
        windowMs: 60_000,
        limit: 1_000,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: rateLimitMessage,
    });

    const publicRateLimit = rateLimit({
        windowMs: 60_000,
        limit: 60,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: rateLimitMessage,
    });

    const authenticatedRateLimit = rateLimit({
        windowMs: 60_000,
        limit: 120,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        keyGenerator: authenticatedRateLimitKey,
        message: rateLimitMessage,
    });

    const agentRateLimit = rateLimit({
        windowMs: 60_000,
        limit: 30,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        keyGenerator: authenticatedRateLimitKey,
        message: rateLimitMessage,
    });

    const requireMatchingDidParam: RequestHandler = (req, res, next) => {
        const auth = getAuthContext(res);

        if (!auth || req.params.did !== auth.did) {
            res.status(403).json({
                ok: false,
                error: 'Authenticated DID does not match requested DID.',
            });
            return;
        }

        next();
    };

    const requireDebugAccess: RequestHandler = (req, res, next) => {
        if (!config.debugEnabled) {
            res.status(404).json({ ok: false, error: 'Not found.' });
            return;
        }

        if (config.debugToken) {
            if (req.get('X-AI-Agent-Debug-Token') !== config.debugToken) {
                res.status(403).json({ ok: false, error: 'Debug access is not authorized.' });
                return;
            }

            res.locals.debugTokenAuthenticated = true;
            next();
            return;
        }

        if (config.nodeEnv === 'production') {
            res.status(403).json({ ok: false, error: 'Debug access is not authorized.' });
            return;
        }

        res.locals.debugTokenAuthenticated = false;
        next();
    };

    const getBodyDid = (body: unknown): string | undefined => {
        if (!body || typeof body !== 'object' || !('did' in body)) return undefined;
        if (typeof body.did !== 'string') return undefined;

        return body.did.trim();
    };

    const getStorageAwareStatus = (message: string): number =>
        message.includes('storage is not available') || message.includes('Encrypted') ? 503 : 400;

    const asyncHandler =
        (handler: RequestHandler): RequestHandler =>
        (req, res, next) => {
            Promise.resolve(handler(req, res, next)).catch(error => {
                const message =
                    error instanceof Error ? error.message : 'AI Agent storage is not available.';

                res.status(503).json({ ok: false, error: message });
            });
        };

    app.use(cors());
    app.use('/api', baselineRateLimit);
    app.use(express.json({ limit: '1mb' }));

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

    app.post('/api/auth/challenge', publicRateLimit, async (req, res) => {
        const domain =
            config.authDomain ??
            (config.nodeEnv !== 'production' ? `${req.protocol}://${req.get('host')}` : undefined);

        if (!domain) {
            res.status(503).json({ ok: false, error: 'DID Auth is unavailable.' });
            return;
        }

        try {
            const challenge = createSecureChallenge();
            const stored = await (
                await getChallengeStore()
            ).insert(challenge, domain, config.authChallengeTtlMs);

            res.json({
                ok: true,
                challenge,
                domain,
                expiresAt: stored.expiresAt.toISOString(),
            });
        } catch {
            res.status(503).json({ ok: false, error: 'DID Auth is unavailable.' });
        }
    });

    app.get('/api/consent-flow/contract', publicRateLimit, async (_req, res) => {
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

    app.post('/api/agent/run', requireDidAuth, agentRateLimit, async (req, res) => {
        if (!providerConfigured) {
            res.status(503).json({ error: OPENAI_API_KEY_REQUIRED_ERROR });
            return;
        }

        const auth = getAuthContext(res);
        const bodyDid = getBodyDid(req.body);

        if (!auth) {
            res.status(401).json({ ok: false, error: 'DID Auth is required.' });
            return;
        }

        if (bodyDid && bodyDid !== auth.did) {
            res.status(403).json({ error: 'Authenticated DID does not match request DID.' });
            return;
        }

        const result = await runChatRequest({
            body: req.body,
            ownerDid: auth.did,
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

    app.post('/api/agent/heartbeat', requireDidAuth, agentRateLimit, async (req, res) => {
        if (!providerConfigured) {
            res.status(503).json({ error: OPENAI_API_KEY_REQUIRED_ERROR });
            return;
        }

        const parsed = HeartbeatRequestValidator.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({ ok: false, error: 'Invalid heartbeat request.' });
            return;
        }

        const auth = getAuthContext(res);

        if (!auth) {
            res.status(401).json({ ok: false, error: 'DID Auth is required.' });
            return;
        }

        if (parsed.data.did && parsed.data.did !== auth.did) {
            res.status(403).json({ error: 'Authenticated DID does not match request DID.' });
            return;
        }

        const maxItems = getLimitedQueryValue(parsed.data.maxItems, 3, 5);
        const result = await runChatRequest({
            body: {
                consentFlowContractUri: parsed.data.consentFlowContractUri,
                messages: [
                    {
                        role: 'user',
                        content: `Run a proactive LearnCard Assistant heartbeat for this learner. Review approved profile data and current memory. Create at most ${maxItems} Assistant inbox cards by calling recordLearnCardAssistantCard. Only create concrete, useful cards. Use type message for a general note or check-in, job-suggestion for job matches, pathway-update for progress or pathway changes, and action-item when the learner needs to review or decide something. Use priority high only when the learner should see it immediately.`,
                    },
                ],
            },
            ownerDid: auth.did,
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
            items: (await assistantFeed.listLatest(auth.did, maxItems)).map(
                toLearnCardAssistantCardResponse
            ),
        });
    });

    app.get(
        '/api/users/:did/assistant-feed',
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        asyncHandler(async (_req, res) => {
            const ownerDid = getAuthContext(res)?.did ?? '';
            const limit = getLimitedQueryValue(_req.query?.limit, 10, 50);

            res.json({
                ok: true,
                items: (await assistantFeed.listLatest(ownerDid, limit)).map(
                    toLearnCardAssistantCardResponse
                ),
            });
        })
    );

    app.post(
        '/api/debug/users/:did/assistant-feed',
        requireDebugAccess,
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        async (req, res) => {
            const parsed = LearnCardAssistantCardToolInputValidator.safeParse(req.body);

            if (!parsed.success) {
                res.status(400).json({ ok: false, error: 'Invalid assistant card.' });
                return;
            }

            try {
                const ownerDid = getAuthContext(res)?.did ?? '';
                const item = await assistantFeed.recordItem({
                    ...parsed.data,
                    ownerDid,
                });

                res.json({ ok: true, item: toLearnCardAssistantCardResponse(item) });
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Could not record assistant card.';

                res.status(getStorageAwareStatus(message)).json({ ok: false, error: message });
            }
        }
    );

    app.post(
        '/api/users/:did/assistant-feed/:id/read',
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        async (req, res) => {
            try {
                const item = await assistantFeed.markItemRead(
                    getAuthContext(res)?.did ?? '',
                    req.params.id ?? ''
                );

                res.json({ ok: true, item: toLearnCardAssistantCardResponse(item) });
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Could not mark assistant card read.';

                res.status(getStorageAwareStatus(message)).json({ ok: false, error: message });
            }
        }
    );

    app.post(
        '/api/users/:did/assistant-feed/:id/feedback',
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        async (req, res) => {
            const parsed = AssistantCardFeedbackRequestValidator.safeParse(req.body);

            if (!parsed.success) {
                res.status(400).json({ ok: false, error: 'Invalid assistant card feedback.' });
                return;
            }

            try {
                const item = await assistantFeed.recordFeedback(
                    getAuthContext(res)?.did ?? '',
                    req.params.id ?? '',
                    parsed.data
                );

                res.json({ ok: true, item: toLearnCardAssistantCardResponse(item) });
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Could not record assistant feedback.';

                res.status(getStorageAwareStatus(message)).json({ ok: false, error: message });
            }
        }
    );

    app.get(
        '/api/users/:did/assistant-profile',
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        asyncHandler(async (_req, res) => {
            res.json({
                ok: true,
                profile: toLearnCardAssistantProfileResponse(
                    await assistantProfile.getProfile(getAuthContext(res)?.did ?? '')
                ),
            });
        })
    );

    app.patch(
        '/api/users/:did/assistant-profile',
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        async (req, res) => {
            const body = typeof req.body === 'object' && req.body ? req.body : {};
            const parsed = UpdateLearnCardAssistantProfileValidator.safeParse({
                ...body,
                ownerDid: getAuthContext(res)?.did ?? '',
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

                res.status(getStorageAwareStatus(message)).json({ ok: false, error: message });
            }
        }
    );

    app.get(
        '/api/users/:did/assistant-schedules',
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        asyncHandler(async (_req, res) => {
            const schedules = await assistantSchedules.list(getAuthContext(res)?.did ?? '');

            res.json({
                ok: true,
                schedules: schedules.map(toAgentAutonomyScheduleResponse),
            });
        })
    );

    app.post(
        '/api/users/:did/assistant-schedules',
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        async (req, res) => {
            const parsed = CreateAgentAutonomyScheduleBodyValidator.safeParse(req.body);

            if (!parsed.success) {
                res.status(400).json({ ok: false, error: 'Invalid assistant schedule.' });
                return;
            }

            try {
                const schedule = await assistantSchedules.create({
                    ...parsed.data,
                    ownerDid: getAuthContext(res)?.did ?? '',
                });

                res.status(201).json({
                    ok: true,
                    schedule: toAgentAutonomyScheduleResponse(schedule),
                });
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Could not create assistant schedule.';

                res.status(getStorageAwareStatus(message)).json({ ok: false, error: message });
            }
        }
    );

    app.patch(
        '/api/users/:did/assistant-schedules/:id',
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        async (req, res) => {
            const parsed = UpdateAgentAutonomyScheduleBodyValidator.safeParse(req.body);

            if (!parsed.success) {
                res.status(400).json({ ok: false, error: 'Invalid assistant schedule.' });
                return;
            }

            try {
                const schedule = await assistantSchedules.update({
                    ...parsed.data,
                    ownerDid: getAuthContext(res)?.did ?? '',
                    id: req.params.id ?? '',
                });

                res.json({
                    ok: true,
                    schedule: toAgentAutonomyScheduleResponse(schedule),
                });
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Could not update assistant schedule.';
                const status =
                    error instanceof AgentAutonomyScheduleNotFoundError
                        ? 404
                        : getStorageAwareStatus(message);

                res.status(status).json({ ok: false, error: message });
            }
        }
    );

    app.delete(
        '/api/users/:did/assistant-schedules/:id',
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        async (req, res) => {
            try {
                const removed = await assistantSchedules.remove(
                    getAuthContext(res)?.did ?? '',
                    req.params.id ?? ''
                );

                if (!removed) {
                    res.status(404).json({ ok: false, error: 'Assistant schedule not found.' });
                    return;
                }

                res.json({ ok: true });
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Could not delete assistant schedule.';

                res.status(getStorageAwareStatus(message)).json({ ok: false, error: message });
            }
        }
    );

    app.get(
        '/api/users/:did/assistant-memories',
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        asyncHandler(async (_req, res) => {
            const ownerDid = getAuthContext(res)?.did ?? '';

            res.json({
                ok: true,
                manifest: serializeAssistantMemoryManifest(
                    await selfImprovement.getAssistantMemoryManifest(ownerDid)
                ),
                docs: (await selfImprovement.getAssistantMemoryDocs(ownerDid)).map(
                    serializeAssistantMemoryDoc
                ),
            });
        })
    );

    app.post(
        '/api/users/:did/assistant-memories/:name/approve',
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        async (req, res) => {
            try {
                const ownerDid = getAuthContext(res)?.did ?? '';
                const doc = await selfImprovement.approveAssistantMemory(
                    ownerDid,
                    req.params.name ?? ''
                );

                res.json({
                    ok: true,
                    doc: serializeAssistantMemoryDoc(doc),
                    manifest: serializeAssistantMemoryManifest(
                        await selfImprovement.getAssistantMemoryManifest(ownerDid)
                    ),
                });
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Could not approve assistant memory.';

                res.status(getStorageAwareStatus(message)).json({ ok: false, error: message });
            }
        }
    );

    app.post(
        '/api/users/:did/assistant-memories/:name/archive',
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        async (req, res) => {
            const parsed = AssistantMemoryArchiveRequestValidator.safeParse(req.body ?? {});

            if (!parsed.success) {
                res.status(400).json({ ok: false, error: 'Invalid assistant memory archive.' });
                return;
            }

            try {
                const ownerDid = getAuthContext(res)?.did ?? '';
                const doc = await selfImprovement.archiveAssistantMemory(
                    ownerDid,
                    req.params.name ?? '',
                    parsed.data.reason
                );

                res.json({
                    ok: true,
                    doc: serializeAssistantMemoryDoc(doc),
                    manifest: serializeAssistantMemoryManifest(
                        await selfImprovement.getAssistantMemoryManifest(ownerDid)
                    ),
                });
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Could not archive assistant memory.';

                res.status(getStorageAwareStatus(message)).json({ ok: false, error: message });
            }
        }
    );
    app.get(
        '/api/debug/users/:did/docs',
        requireDebugAccess,
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        asyncHandler(async (_req, res) => {
            res.json({
                ok: true,
                docs: await selfImprovement.getDocsForDebug(getAuthContext(res)?.did ?? ''),
            });
        })
    );

    app.get(
        '/api/debug/users/:did/memory',
        requireDebugAccess,
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        asyncHandler(async (_req, res) => {
            const ownerDid = getAuthContext(res)?.did ?? '';
            const manifest = await selfImprovement.getMemoryManifestForDebug(ownerDid);

            res.json({
                ok: true,
                manifest,
                docs: await selfImprovement.getDocsForDebug(ownerDid),
            });
        })
    );

    app.post(
        '/api/debug/users/:did/memory',
        requireDebugAccess,
        requireDidAuth,
        requireMatchingDidParam,
        authenticatedRateLimit,
        async (req, res) => {
            const parsed = DebugMemoryRequestValidator.safeParse(req.body);

            if (!parsed.success) {
                res.status(400).json({ ok: false, error: 'Invalid memory debug request.' });
                return;
            }

            try {
                const ownerDid = getAuthContext(res)?.did ?? '';
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

                res.status(getStorageAwareStatus(message)).json({ ok: false, error: message });
            }
        }
    );

    app.get(
        '/api/debug/runs/:runId',
        requireDebugAccess,
        requireDidAuth,
        authenticatedRateLimit,
        asyncHandler(async (req, res) => {
            const auth = getAuthContext(res);
            const run = await selfImprovement.getRunForDebug(req.params.runId ?? '');

            if (!run) {
                res.status(404).json({ ok: false, error: 'Run trace not found.' });
                return;
            }

            const runOwnerDid = run.trace?.ownerDid;

            if (runOwnerDid && auth?.did !== runOwnerDid) {
                res.status(403).json({
                    ok: false,
                    error: 'Authenticated DID does not match run owner.',
                });
                return;
            }

            if (!runOwnerDid && res.locals.debugTokenAuthenticated !== true) {
                res.status(403).json({
                    ok: false,
                    error: 'Debug token is required for legacy run traces.',
                });
                return;
            }

            res.json({
                ok: true,
                ...run,
            });
        })
    );

    return app;
};
