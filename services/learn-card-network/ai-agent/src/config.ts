export interface ServiceConfig {
    model: string;
    openAIApiKey?: string;
    port: number;
    walletSeed?: string;
    cloudUrl?: string;
    networkUrl?: string;
    maxToolRounds: number;
    consentFlowContractUri?: string;
    consentFlowAppUrl: string;
    consentFlowDataPageSize: number;
    consentFlowDataMaxPages: number;
    consentFlowCredentialReadLimit: number;
    mongoUri?: string;
    mongoDbName: string;
    selfImprovementEnabled: boolean;
    retroModel?: string;
    retroMaxTraceChars: number;
}

const DEFAULT_MONGO_DB_NAME = 'learn-card-ai-agent';
const DEFAULT_LOCAL_MONGO_URI = 'mongodb://localhost:27017';

const readNumber = (value: string | undefined, fallback: number): number => {
    if (!value) return fallback;

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
};

const readBoolean = (value: string | undefined, fallback: boolean): boolean => {
    const normalized = value?.trim().toLowerCase();

    if (!normalized) return fallback;
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;

    return fallback;
};

const readString = (value: string | undefined): string | undefined => {
    const trimmed = value?.trim();

    return trimmed || undefined;
};

export const getConfig = (): ServiceConfig => {
    const model = readString(process.env.AI_AGENT_MODEL) ?? 'gpt-5.5';
    const selfImprovementEnabled = readBoolean(
        process.env.AI_AGENT_SELF_IMPROVEMENT_ENABLED,
        process.env.NODE_ENV !== 'production'
    );

    return {
        model,
        openAIApiKey: readString(process.env.OPENAI_API_KEY),
        port: readNumber(process.env.AI_AGENT_PORT ?? process.env.PORT, 3000),
        walletSeed:
            readString(process.env.AI_AGENT_WALLET_SEED) ??
            readString(process.env.LEARNCARD_AGENT_SEED) ??
            readString(process.env.SEED),
        cloudUrl:
            readString(process.env.AI_AGENT_CLOUD_URL) ?? readString(process.env.LEARN_CLOUD_URL),
        networkUrl:
            readString(process.env.AI_AGENT_NETWORK_URL) ??
            readString(process.env.LEARNCARD_NETWORK_URL),
        maxToolRounds: readNumber(process.env.AI_AGENT_MAX_TOOL_ROUNDS, 100),
        consentFlowContractUri: readString(process.env.AI_AGENT_CONSENT_FLOW_CONTRACT_URI),
        consentFlowAppUrl:
            readString(process.env.AI_AGENT_CONSENT_FLOW_APP_URL) ?? 'https://learncard.app',
        consentFlowDataPageSize: readNumber(process.env.AI_AGENT_CONSENT_FLOW_DATA_PAGE_SIZE, 100),
        consentFlowDataMaxPages: readNumber(process.env.AI_AGENT_CONSENT_FLOW_DATA_MAX_PAGES, 10),
        consentFlowCredentialReadLimit: readNumber(
            process.env.AI_AGENT_CONSENT_FLOW_CREDENTIAL_READ_LIMIT,
            50
        ),
        mongoUri:
            readString(process.env.AI_AGENT_MONGO_URI) ??
            readString(process.env.MONGO_URI) ??
            DEFAULT_LOCAL_MONGO_URI,
        mongoDbName:
            readString(process.env.AI_AGENT_MONGO_DB_NAME) ??
            readString(process.env.MONGO_DB_NAME) ??
            DEFAULT_MONGO_DB_NAME,
        selfImprovementEnabled,
        retroModel: readString(process.env.AI_AGENT_RETRO_MODEL) ?? model,
        retroMaxTraceChars: readNumber(process.env.AI_AGENT_RETRO_MAX_TRACE_CHARS, 24_000),
    };
};
