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

export interface CreateServerOptions {
    config: ServiceConfig;
    provider?: AgentProvider;
    tools?: AgentToolDefinition[];
    consentFlowRuntime?: ConsentFlowRuntime;
    mongoRuntime?: MongoRuntime;
    publicDir?: string;
}

export interface RunChatOptions {
    body: unknown;
    config: ServiceConfig;
    provider: AgentProvider;
    tools: AgentToolDefinition[];
    consentFlowRuntime?: ConsentFlowRuntime;
}

export interface RunChatResult {
    status: number;
    payload:
        | {
              message: string;
              messages: Array<{ role: 'user' | 'assistant'; content: string }>;
              toolRuns: unknown[];
          }
        | { error: string };
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

const getRunContextPrompt = (did: string, contractUri?: string): string =>
    [
        `The current user DID is ${did}.`,
        contractUri
            ? `Use ConsentFlow contract ${contractUri} for consented user data.`
            : 'Use the configured ConsentFlow contract for consented user data.',
        'A background request for this user data has already started.',
        'Call getConsentedUserData only when the user request would benefit from consented profile, credential, or personal data.',
    ].join('\n');

export const runChatRequest = async ({
    body,
    config,
    provider,
    tools,
    consentFlowRuntime,
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
        let contextPrompt: string | undefined;

        if (did) {
            const dataPromise = runtime.loadConsentedUserData({
                did,
                contractUri: consentFlowContractUri || undefined,
            });
            dataPromise.catch(() => undefined);

            agentTools.push(createConsentedUserDataTool({ did, dataPromise }));
            contextPrompt = getRunContextPrompt(did, consentFlowContractUri || undefined);
        }

        const result = await runAgent({
            model: config.model,
            messages: parsed.data.messages,
            provider,
            tools: agentTools,
            maxToolRounds: config.maxToolRounds,
            contextPrompt,
        });

        return {
            status: 200,
            payload: {
                message: result.message,
                messages: [...parsed.data.messages, { role: 'assistant', content: result.message }],
                toolRuns: result.toolRuns,
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
    publicDir = getPublicDir(),
}: CreateServerOptions): express.Express => {
    const app = express();
    const agentProvider = provider ?? createProvider(config);
    const providerConfigured = Boolean(provider || config.openAIApiKey);
    const consentRuntime = consentFlowRuntime ?? createConsentFlowRuntime(config);
    const mongo = mongoRuntime ?? createMongoRuntime(config);
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
        });

        res.status(result.status).json(result.payload);
    });

    app.get('*', (_req, res) => {
        res.sendFile(path.join(publicDir, 'index.html'));
    });

    return app;
};
