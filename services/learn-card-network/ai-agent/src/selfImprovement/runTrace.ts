import type { Db, Filter } from 'mongodb';

import type { AgentMessage, AgentRunResult, AgentToolRun } from '../agent/types';
import {
    createFieldAad,
    isEncryptedEnvelope,
    type EncryptedJsonEnvelopeV1,
    type EncryptionService,
} from '../security/encryption';

export const RUN_TRACE_COLLECTION = 'agentRunTraces';

export interface StoredAgentMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface StoredToolRun {
    id: string;
    name: string;
    arguments: unknown;
    resultSummary?: unknown;
    error?: string;
}

export interface SkillUsage {
    listed: string[];
    read: string[];
}

export interface AgentRunTrace {
    runId: string;
    ownerDid?: string;
    model: string;
    status: 'success';
    createdAt: Date;
    inputMessages: StoredAgentMessage[];
    finalAssistantMessage: string;
    toolRuns: StoredToolRun[];
    skillUsage: SkillUsage;
    traceChars: number;
    truncated: boolean;
}

type StoredAgentRunTrace = Omit<
    AgentRunTrace,
    'inputMessages' | 'finalAssistantMessage' | 'toolRuns' | 'skillUsage'
> & {
    inputMessages: StoredAgentMessage[] | EncryptedJsonEnvelopeV1;
    finalAssistantMessage: string | EncryptedJsonEnvelopeV1;
    toolRuns: StoredToolRun[] | EncryptedJsonEnvelopeV1;
    skillUsage: SkillUsage | EncryptedJsonEnvelopeV1;
};

export interface BuildRunTraceInput {
    ownerDid?: string;
    model: string;
    inputMessages: StoredAgentMessage[];
    result: AgentRunResult;
    maxTraceChars: number;
}

export interface RunTraceRepository {
    insert: (trace: AgentRunTrace) => Promise<void>;
    findByRunId: (runId: string) => Promise<AgentRunTrace | undefined>;
}

export interface RunTraceService {
    recordRunTrace: (input: BuildRunTraceInput) => Promise<AgentRunTrace>;
    getRunTrace: (runId: string) => Promise<AgentRunTrace | undefined>;
}

const MAX_MESSAGE_CHARS = 4_000;
const FALLBACK_MESSAGE_CHARS = 1_000;
const MAX_ERROR_CHARS = 1_000;

const truncateString = (value: string, maxChars: number): string =>
    value.length <= maxChars ? value : `${value.slice(0, maxChars)}...[truncated]`;

const getJsonChars = (value: unknown): number => {
    try {
        return JSON.stringify(value).length;
    } catch {
        return 0;
    }
};

const summarizeValue = (value: unknown, depth = 0): unknown => {
    if (value === null) return { type: 'null' };
    if (value === undefined) return { type: 'undefined' };

    if (typeof value === 'string') return { type: 'string', length: value.length };
    if (typeof value === 'number' || typeof value === 'boolean') {
        return { type: typeof value, value };
    }

    if (Array.isArray(value)) {
        return {
            type: 'array',
            length: value.length,
            sample: depth < 2 ? value.slice(0, 3).map(item => summarizeValue(item, depth + 1)) : [],
        };
    }

    if (typeof value === 'object') {
        const record = value as Record<string, unknown>;
        const keys = Object.keys(record).sort((a, b) => a.localeCompare(b));
        const fields =
            depth < 2
                ? Object.fromEntries(
                      keys.slice(0, 10).map(key => [key, summarizeValue(record[key], depth + 1)])
                  )
                : undefined;

        return {
            type: 'object',
            keys,
            ...(fields ? { fields } : {}),
        };
    }

    return { type: typeof value };
};

const summarizeConsentedUserData = (result: unknown): unknown => {
    if (!result || typeof result !== 'object') return summarizeValue(result);

    const data = result as {
        did?: unknown;
        contract?: { uri?: unknown; source?: unknown; created?: unknown };
        records?: Array<{
            date?: unknown;
            contractUri?: unknown;
            personal?: Record<string, unknown>;
            credentials?: Array<{
                category?: unknown;
                uri?: unknown;
                content?: unknown;
                readError?: unknown;
            }>;
        }>;
        summary?: unknown;
        paging?: unknown;
    };

    return {
        did: typeof data.did === 'string' ? data.did : undefined,
        contract: data.contract
            ? {
                  uri: typeof data.contract.uri === 'string' ? data.contract.uri : undefined,
                  source:
                      typeof data.contract.source === 'string' ? data.contract.source : undefined,
                  created:
                      typeof data.contract.created === 'boolean'
                          ? data.contract.created
                          : undefined,
              }
            : undefined,
        summary: data.summary,
        paging: data.paging,
        records: (data.records ?? []).map(record => ({
            date: typeof record.date === 'string' ? record.date : undefined,
            contractUri: typeof record.contractUri === 'string' ? record.contractUri : undefined,
            personalKeys: Object.keys(record.personal ?? {}).sort((a, b) => a.localeCompare(b)),
            credentialCount: record.credentials?.length ?? 0,
            credentials: (record.credentials ?? []).map(credential => ({
                category: typeof credential.category === 'string' ? credential.category : undefined,
                uri: typeof credential.uri === 'string' ? credential.uri : undefined,
                hasContent: credential.content !== undefined,
                readError:
                    typeof credential.readError === 'string' ? credential.readError : undefined,
            })),
        })),
    };
};

const summarizeSkillRead = (result: unknown): unknown => {
    if (!result || typeof result !== 'object') return summarizeValue(result);

    const skill = result as {
        name?: unknown;
        description?: unknown;
        source?: unknown;
        kind?: unknown;
        dynamic?: unknown;
        content?: unknown;
    };

    return {
        name: typeof skill.name === 'string' ? skill.name : undefined,
        description: typeof skill.description === 'string' ? skill.description : undefined,
        source: typeof skill.source === 'string' ? skill.source : undefined,
        kind: typeof skill.kind === 'string' ? skill.kind : undefined,
        dynamic: skill.dynamic === true,
        contentChars: typeof skill.content === 'string' ? skill.content.length : undefined,
    };
};

const sanitizeArguments = (toolRun: AgentToolRun): unknown => {
    if (toolRun.name === 'learnCardWallet') {
        return {
            operation: toolRun.arguments.operation,
            path: toolRun.arguments.path,
            query: toolRun.arguments.query,
            limit: toolRun.arguments.limit,
            args: summarizeValue(toolRun.arguments.args),
        };
    }

    return toolRun.arguments;
};

const summarizeToolResult = (toolRun: AgentToolRun): unknown => {
    if (toolRun.result === undefined) return undefined;

    if (toolRun.name === 'getConsentedUserData') {
        return summarizeConsentedUserData(toolRun.result);
    }

    if (toolRun.name === 'readSkill') return summarizeSkillRead(toolRun.result);

    return summarizeValue(toolRun.result);
};

export const extractSkillUsage = (toolRuns: AgentToolRun[]): SkillUsage => {
    const listed = new Set<string>();
    const read = new Set<string>();

    for (const toolRun of toolRuns) {
        if (toolRun.name === 'listSkills' || toolRun.name === 'searchSkills') {
            const skills =
                toolRun.result && typeof toolRun.result === 'object'
                    ? (toolRun.result as { skills?: Array<{ name?: unknown }> }).skills ??
                      (toolRun.result as { matches?: Array<{ name?: unknown }> }).matches
                    : undefined;

            for (const skill of skills ?? []) {
                if (typeof skill.name === 'string') listed.add(skill.name);
            }
        }

        if (toolRun.name === 'readSkill') {
            const fromResult =
                toolRun.result && typeof toolRun.result === 'object'
                    ? (toolRun.result as { name?: unknown }).name
                    : undefined;
            const fromArguments = toolRun.arguments.name;
            const name = typeof fromResult === 'string' ? fromResult : fromArguments;

            if (typeof name === 'string') read.add(name);
        }
    }

    return {
        listed: [...listed].sort((a, b) => a.localeCompare(b)),
        read: [...read].sort((a, b) => a.localeCompare(b)),
    };
};

export const buildRunTrace = ({
    ownerDid,
    model,
    inputMessages,
    result,
    maxTraceChars,
}: BuildRunTraceInput): AgentRunTrace => {
    const storedInputMessages = inputMessages.map(message => ({
        role: message.role,
        content: truncateString(message.content, MAX_MESSAGE_CHARS),
    }));
    const toolRuns = result.toolRuns.map(toolRun => ({
        id: toolRun.id,
        name: toolRun.name,
        arguments: sanitizeArguments(toolRun),
        ...(toolRun.result !== undefined ? { resultSummary: summarizeToolResult(toolRun) } : {}),
        ...(toolRun.error ? { error: truncateString(toolRun.error, MAX_ERROR_CHARS) } : {}),
    }));
    let trace: AgentRunTrace = {
        runId: result.runId,
        ownerDid,
        model,
        status: 'success',
        createdAt: new Date(),
        inputMessages: storedInputMessages,
        finalAssistantMessage: truncateString(result.message, MAX_MESSAGE_CHARS),
        toolRuns,
        skillUsage: extractSkillUsage(result.toolRuns),
        traceChars: 0,
        truncated: false,
    };
    let traceChars = getJsonChars(trace);

    if (traceChars > maxTraceChars) {
        trace = {
            ...trace,
            inputMessages: inputMessages.map(message => ({
                role: message.role,
                content: truncateString(message.content, FALLBACK_MESSAGE_CHARS),
            })),
            finalAssistantMessage: truncateString(result.message, FALLBACK_MESSAGE_CHARS),
            truncated: true,
        };
        traceChars = getJsonChars(trace);
    }

    return {
        ...trace,
        traceChars,
    };
};

const normalizeStoredMessages = (messages: AgentMessage[]): StoredAgentMessage[] =>
    messages
        .filter(
            (message): message is AgentMessage & { role: 'user' | 'assistant' } =>
                message.role === 'user' || message.role === 'assistant'
        )
        .map(({ role, content }) => ({ role, content }));

export const createMongoRunTraceRepository = (
    db: Db,
    encryption: EncryptionService
): RunTraceRepository => {
    const collection = db.collection<StoredAgentRunTrace>(RUN_TRACE_COLLECTION);
    let indexesReady: Promise<void> | undefined;
    let migrationReady: Promise<void> | undefined;

    const aad = (trace: Pick<AgentRunTrace, 'runId' | 'ownerDid'>, fieldPath: string): string =>
        createFieldAad({
            collectionName: RUN_TRACE_COLLECTION,
            ownerDid: trace.ownerDid ?? '',
            stableRecordId: trace.runId,
            fieldPath,
        });

    const encryptTrace = async (trace: AgentRunTrace): Promise<StoredAgentRunTrace> => ({
        ...trace,
        inputMessages: await encryption.encryptJson(
            trace.inputMessages,
            aad(trace, 'inputMessages')
        ),
        finalAssistantMessage: await encryption.encryptJson(
            trace.finalAssistantMessage,
            aad(trace, 'finalAssistantMessage')
        ),
        toolRuns: await encryption.encryptJson(trace.toolRuns, aad(trace, 'toolRuns')),
        skillUsage: await encryption.encryptJson(trace.skillUsage, aad(trace, 'skillUsage')),
    });

    const decryptTrace = async (
        trace: StoredAgentRunTrace
    ): Promise<{ trace: AgentRunTrace; legacyPlaintext: boolean }> => {
        const inputMessages = await encryption.decryptLegacyOrEnvelope<StoredAgentMessage[]>(
            trace.inputMessages,
            aad(trace, 'inputMessages')
        );
        const finalAssistantMessage = await encryption.decryptLegacyOrEnvelope<string>(
            trace.finalAssistantMessage,
            aad(trace, 'finalAssistantMessage')
        );
        const toolRuns = await encryption.decryptLegacyOrEnvelope<StoredToolRun[]>(
            trace.toolRuns,
            aad(trace, 'toolRuns')
        );
        const skillUsage = await encryption.decryptLegacyOrEnvelope<SkillUsage>(
            trace.skillUsage,
            aad(trace, 'skillUsage')
        );

        return {
            trace: {
                ...trace,
                inputMessages: inputMessages.value,
                finalAssistantMessage: finalAssistantMessage.value,
                toolRuns: toolRuns.value,
                skillUsage: skillUsage.value,
            },
            legacyPlaintext:
                inputMessages.legacyPlaintext ||
                finalAssistantMessage.legacyPlaintext ||
                toolRuns.legacyPlaintext ||
                skillUsage.legacyPlaintext,
        };
    };

    const needsMigration = (trace: StoredAgentRunTrace): boolean =>
        !isEncryptedEnvelope(trace.inputMessages) ||
        !isEncryptedEnvelope(trace.finalAssistantMessage) ||
        !isEncryptedEnvelope(trace.toolRuns) ||
        !isEncryptedEnvelope(trace.skillUsage);

    const migrateExisting = async (): Promise<void> => {
        const traces = await collection.find({}).toArray();

        await Promise.all(
            traces.filter(needsMigration).map(async trace => {
                const decrypted = await decryptTrace(trace);
                await collection.replaceOne(
                    { runId: trace.runId } as Filter<StoredAgentRunTrace>,
                    await encryptTrace(decrypted.trace),
                    { upsert: false }
                );
            })
        );
    };

    const ensureIndexes = async (): Promise<void> => {
        indexesReady ??= Promise.all([
            collection.createIndex({ runId: 1 }, { unique: true }),
            collection.createIndex({ ownerDid: 1, createdAt: -1 }),
        ]).then(() => undefined);

        await indexesReady;

        migrationReady ??= migrateExisting();

        await migrationReady;
    };

    return {
        insert: async trace => {
            await ensureIndexes();
            await collection.insertOne(await encryptTrace(trace));
        },
        findByRunId: async runId => {
            await ensureIndexes();

            const stored =
                (await collection.findOne({ runId } as Filter<StoredAgentRunTrace>)) ?? undefined;

            return stored ? (await decryptTrace(stored)).trace : undefined;
        },
    };
};

export const createInMemoryRunTraceRepository = (): RunTraceRepository => {
    const traces = new Map<string, AgentRunTrace>();

    return {
        insert: async trace => {
            traces.set(trace.runId, trace);
        },
        findByRunId: async runId => traces.get(runId),
    };
};

export const createRunTraceService = (repository: RunTraceRepository): RunTraceService => ({
    recordRunTrace: async input => {
        const trace = buildRunTrace(input);
        await repository.insert(trace);

        return trace;
    },
    getRunTrace: repository.findByRunId,
});

export const createMongoRunTraceService = (
    db: Db,
    encryption: EncryptionService
): RunTraceService => createRunTraceService(createMongoRunTraceRepository(db, encryption));

export const toStoredInputMessages = normalizeStoredMessages;
