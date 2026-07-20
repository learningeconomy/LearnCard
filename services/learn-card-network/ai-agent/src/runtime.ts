import { createOpenAIProvider } from './agent/openAIProvider';
import type { AgentProvider, AgentToolDefinition } from './agent/types';
import {
    createLearnCardAssistantFeedRuntime,
    type LearnCardAssistantFeedRuntime,
} from './assistantFeed';
import {
    createLearnCardAssistantProfileRuntime,
    type LearnCardAssistantProfileRuntime,
} from './assistantProfile';
import {
    createLearnCardAssistantSchedulesRuntime,
    type LearnCardAssistantSchedulesRuntime,
} from './autonomy/schedules';
import {
    createProviderSyncedAssistantSchedulesRuntime,
    createTriggerAgentAutonomyScheduleProvider,
    type AgentAutonomyScheduleProvider,
} from './autonomy/triggerScheduleProvider';
import { createConsentFlowRuntime, type ConsentFlowRuntime } from './consentFlow';
import type { ServiceConfig } from './config';
import { getAgentLearnCard } from './helpers/learnCard.helpers';
import { createMongoRuntime, type MongoRuntime } from './mongo';
import { createSelfImprovementRuntime, type SelfImprovementRuntime } from './selfImprovement';
import {
    createLearnCardDagJweEncryptionService,
    type EncryptionService,
} from './security/encryption';
import { createTools } from './tools';

export interface CreateAgentServiceRuntimeOptions {
    config: ServiceConfig;
    provider?: AgentProvider;
    tools?: AgentToolDefinition[];
    consentFlowRuntime?: ConsentFlowRuntime;
    mongoRuntime?: MongoRuntime;
    selfImprovementRuntime?: SelfImprovementRuntime;
    assistantFeedRuntime?: LearnCardAssistantFeedRuntime;
    assistantProfileRuntime?: LearnCardAssistantProfileRuntime;
    assistantSchedulesRuntime?: LearnCardAssistantSchedulesRuntime;
    assistantScheduleProvider?: AgentAutonomyScheduleProvider;
    encryptionService?: EncryptionService;
}

export interface AgentServiceRuntime {
    config: ServiceConfig;
    provider: AgentProvider;
    providerConfigured: boolean;
    tools: AgentToolDefinition[];
    mongoRuntime: MongoRuntime;
    consentFlowRuntime: ConsentFlowRuntime;
    selfImprovementRuntime: SelfImprovementRuntime;
    assistantFeedRuntime: LearnCardAssistantFeedRuntime;
    assistantProfileRuntime: LearnCardAssistantProfileRuntime;
    assistantSchedulesRuntime: LearnCardAssistantSchedulesRuntime;
    getEncryption: () => EncryptionService;
}

const createProvider = (config: ServiceConfig): AgentProvider => {
    if (!config.openAIApiKey) {
        return {
            complete: async () => {
                throw new Error('OPENAI_API_KEY must be set to run the AI agent.');
            },
        };
    }

    return createOpenAIProvider(config.openAIApiKey);
};

export const createAgentServiceRuntime = (
    options: CreateAgentServiceRuntimeOptions
): AgentServiceRuntime => {
    const { config } = options;
    const provider = options.provider ?? createProvider(config);
    const mongoRuntime = options.mongoRuntime ?? createMongoRuntime(config);
    const consentFlowRuntime = options.consentFlowRuntime ?? createConsentFlowRuntime(config);
    let encryptionService = options.encryptionService;

    const getEncryption = (): EncryptionService => {
        encryptionService ??= createLearnCardDagJweEncryptionService({
            keyId: config.encryptionKeyId,
            getWallet: () =>
                getAgentLearnCard({
                    seed: config.walletSeed,
                    cloudUrl: config.cloudUrl,
                    networkUrl: config.networkUrl,
                }),
        });

        return encryptionService;
    };
    const selfImprovementRuntime =
        options.selfImprovementRuntime ??
        createSelfImprovementRuntime({
            config,
            mongoRuntime,
            getEncryption,
        });
    const assistantFeedRuntime =
        options.assistantFeedRuntime ??
        createLearnCardAssistantFeedRuntime({
            mongoRuntime,
            getEncryption,
        });
    const assistantProfileRuntime =
        options.assistantProfileRuntime ??
        createLearnCardAssistantProfileRuntime({
            mongoRuntime,
            getEncryption,
        });
    const baseAssistantSchedulesRuntime =
        options.assistantSchedulesRuntime ??
        createLearnCardAssistantSchedulesRuntime({
            mongoRuntime,
            getEncryption,
        });
    const assistantScheduleProvider =
        options.assistantScheduleProvider ??
        (config.triggerEnabled
            ? createTriggerAgentAutonomyScheduleProvider({
                  environment: config.triggerEnvironment ?? config.nodeEnv,
              })
            : undefined);
    const assistantSchedulesRuntime = assistantScheduleProvider
        ? createProviderSyncedAssistantSchedulesRuntime(
              baseAssistantSchedulesRuntime,
              assistantScheduleProvider
          )
        : baseAssistantSchedulesRuntime;
    const tools =
        options.tools ??
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

    return {
        config,
        provider,
        providerConfigured: Boolean(options.provider || config.openAIApiKey),
        tools,
        mongoRuntime,
        consentFlowRuntime,
        selfImprovementRuntime,
        assistantFeedRuntime,
        assistantProfileRuntime,
        assistantSchedulesRuntime,
        getEncryption,
    };
};
