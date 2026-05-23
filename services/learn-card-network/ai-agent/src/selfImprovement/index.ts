import { createOpenAIProvider } from '../agent/openAIProvider';
import type {
    AgentSkillDefinition,
    AgentRunResult,
    AgentProvider,
    AgentToolDefinition,
} from '../agent/types';
import type { ServiceConfig } from '../config';
import type { MongoRuntime } from '../mongo';
import { createUserMemoryTools } from './memoryTools';
import {
    createMongoRunTraceService,
    toStoredInputMessages,
    type AgentRunTrace,
    type RunTraceService,
    type StoredAgentMessage,
} from './runTrace';
import {
    createMongoRetroResultRepository,
    runRetroImprovement,
    type RetroResult,
    type RetroResultRepository,
} from './retro';
import {
    createMongoUserDocService,
    type AgentUserDoc,
    type ArchiveUserDocInput,
    type UpdateUserDocInput,
    type UserMemoryManifest,
    type UserDocService,
    type WriteUserDocInput,
} from './userDocs';

export interface SelfImprovementRuntime {
    loadRequestSkills: (ownerDid?: string) => Promise<AgentSkillDefinition[]>;
    loadRequestTools: (ownerDid?: string) => Promise<AgentToolDefinition[]>;
    getMemoryManifestPrompt: (ownerDid?: string) => Promise<string | undefined>;
    runAfterResponse: (input: {
        ownerDid?: string;
        model: string;
        inputMessages: StoredAgentMessage[];
        result: AgentRunResult;
    }) => Promise<void>;
    getDocsForDebug: (ownerDid: string) => Promise<AgentUserDoc[]>;
    getMemoryManifestForDebug: (ownerDid: string) => Promise<UserMemoryManifest | undefined>;
    createDebugDoc: (input: WriteUserDocInput) => Promise<AgentUserDoc>;
    updateDebugDoc: (input: UpdateUserDocInput) => Promise<AgentUserDoc>;
    approveDebugDoc: (ownerDid: string, name: string) => Promise<AgentUserDoc>;
    archiveDebugDoc: (input: ArchiveUserDocInput) => Promise<AgentUserDoc>;
    getRunForDebug: (runId: string) => Promise<
        | {
              trace?: AgentRunTrace;
              retroResults: RetroResult[];
          }
        | undefined
    >;
}

export interface SelfImprovementRuntimeOptions {
    config: ServiceConfig;
    mongoRuntime: MongoRuntime;
    retroProvider?: AgentProvider;
    services?: SelfImprovementServices;
}

export interface SelfImprovementServices {
    userDocs: UserDocService;
    runTraces: RunTraceService;
    retroResults: RetroResultRepository;
}

const noopRuntime: SelfImprovementRuntime = {
    loadRequestSkills: async () => [],
    loadRequestTools: async () => [],
    getMemoryManifestPrompt: async () => undefined,
    runAfterResponse: async () => undefined,
    getDocsForDebug: async () => [],
    getMemoryManifestForDebug: async () => undefined,
    createDebugDoc: async () => {
        throw new Error('Self-improvement is not available.');
    },
    updateDebugDoc: async () => {
        throw new Error('Self-improvement is not available.');
    },
    approveDebugDoc: async () => {
        throw new Error('Self-improvement is not available.');
    },
    archiveDebugDoc: async () => {
        throw new Error('Self-improvement is not available.');
    },
    getRunForDebug: async () => undefined,
};

const getManifestPrompt = (manifest: UserMemoryManifest): string =>
    [
        'User memory manifest:',
        JSON.stringify(
            {
                ownerDid: manifest.ownerDid,
                policy: manifest.policy,
                counts: manifest.counts,
                byKind: manifest.byKind,
            },
            null,
            2
        ),
        'Active user memory/docs are discoverable through searchSkills and loadable through readSkill. They are not listed here to keep prompt context compact.',
        'Call getUserMemoryManifest when you need the complete memory manifest, proposed memories, archived memories, or exact names for memory-management actions.',
        'Memory source policy: credential-derived docs summarize credential evidence, consentflow-derived docs summarize ConsentFlow data, user-stated docs come from explicit user statements, and agent-inferred docs are hypotheses. If sources conflict, prefer current tool data and user-stated corrections over older inferred memory.',
        'Use rememberUserMemory only when the user explicitly asks you to remember or approves a memory. Use proposeUserMemory for useful but inferred, ambiguous, or sensitive memory. Use forgetUserMemory when the user asks you to forget something.',
        'A separate background retro agent may review this chat after your response is sent and write or propose memories. You cannot see those retro results during the current response, so do not claim that a retro memory was saved unless you used a memory tool yourself.',
    ].join('\n');

export const createSelfImprovementRuntime = ({
    config,
    mongoRuntime,
    retroProvider,
    services,
}: SelfImprovementRuntimeOptions): SelfImprovementRuntime => {
    if (!config.selfImprovementEnabled) return noopRuntime;

    let servicesPromise: Promise<SelfImprovementServices | undefined> | undefined;

    const getServices = async (): Promise<SelfImprovementServices | undefined> => {
        if (services) return services;

        if (!servicesPromise) {
            servicesPromise = (async () => {
                const status = await mongoRuntime.getStatus();
                if (!status.connected) return undefined;

                const db = await mongoRuntime.getDb();

                return {
                    userDocs: createMongoUserDocService(db),
                    runTraces: createMongoRunTraceService(db),
                    retroResults: createMongoRetroResultRepository(db),
                };
            })().catch(() => {
                servicesPromise = undefined;

                return undefined;
            });
        }

        return servicesPromise;
    };

    const getRetroProvider = (): AgentProvider | undefined => {
        if (retroProvider) return retroProvider;
        if (!config.openAIApiKey) return undefined;

        return createOpenAIProvider(config.openAIApiKey);
    };

    return {
        loadRequestSkills: async ownerDid => {
            if (!ownerDid) return [];

            const services = await getServices();
            if (!services) return [];

            return services.userDocs.createSkillDefinitions(ownerDid);
        },
        loadRequestTools: async ownerDid => {
            if (!ownerDid) return [];

            const services = await getServices();
            if (!services) return [];

            return createUserMemoryTools({
                ownerDid,
                userDocs: services.userDocs,
            });
        },
        getMemoryManifestPrompt: async ownerDid => {
            if (!ownerDid) return undefined;

            const services = await getServices();
            if (!services) return undefined;

            return getManifestPrompt(await services.userDocs.getMemoryManifest(ownerDid));
        },
        runAfterResponse: async ({ ownerDid, model, inputMessages, result }) => {
            if (!ownerDid) return;

            const services = await getServices();
            if (!services) return;

            const trace = await services.runTraces.recordRunTrace({
                ownerDid,
                model,
                inputMessages,
                result,
                maxTraceChars: config.retroMaxTraceChars,
            });
            const provider = getRetroProvider();

            if (!provider || !config.retroModel) return;

            const activeDocs = (await services.userDocs.getDocsForDebug(ownerDid)).filter(
                doc => doc.status !== 'archived'
            );

            await runRetroImprovement({
                ownerDid,
                model: config.retroModel,
                provider,
                trace,
                activeDocs,
                userDocs: services.userDocs,
                results: services.retroResults,
            });
        },
        getDocsForDebug: async ownerDid => {
            const services = await getServices();

            return services?.userDocs.getDocsForDebug(ownerDid) ?? [];
        },
        getMemoryManifestForDebug: async ownerDid => {
            const services = await getServices();

            return services?.userDocs.getMemoryManifest(ownerDid);
        },
        createDebugDoc: async input => {
            const services = await getServices();
            if (!services) throw new Error('Self-improvement storage is not available.');

            return services.userDocs.createDoc({
                ...input,
                createdBy: 'debug',
                sourceType: input.sourceType ?? 'debug',
            });
        },
        updateDebugDoc: async input => {
            const services = await getServices();
            if (!services) throw new Error('Self-improvement storage is not available.');

            return services.userDocs.updateDoc(input);
        },
        approveDebugDoc: async (ownerDid, name) => {
            const services = await getServices();
            if (!services) throw new Error('Self-improvement storage is not available.');

            return services.userDocs.approveDoc(ownerDid, name, {
                reason: 'Approved in debug UI.',
            });
        },
        archiveDebugDoc: async input => {
            const services = await getServices();
            if (!services) throw new Error('Self-improvement storage is not available.');

            return services.userDocs.archiveDoc(input);
        },
        getRunForDebug: async runId => {
            const services = await getServices();
            if (!services) return undefined;

            const trace = await services.runTraces.getRunTrace(runId);
            const retroResults = await services.retroResults.findByRunId(runId);

            if (!trace && retroResults.length === 0) return undefined;

            return {
                trace,
                retroResults,
            };
        },
    };
};

export { toStoredInputMessages };
