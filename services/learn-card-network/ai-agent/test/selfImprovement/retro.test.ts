import type { Db } from 'mongodb';
import { describe, expect, it, vi } from 'vitest';

import type { AgentProvider, AgentProviderResponse } from '../../src/agent/types';
import type { AgentRunTrace } from '../../src/selfImprovement/runTrace';
import {
    createInMemoryRetroResultRepository,
    runRetroImprovement,
} from '../../src/selfImprovement/retro';
import type { RetroRunInput } from '../../src/selfImprovement/retro';
import {
    createInMemoryUserDocRepository,
    createMongoUserDocRepository,
    createUserDocService,
} from '../../src/selfImprovement/userDocs';
import { createStorageTestEncryption } from '../helpers/storageEncryption';

const getTrace = (runId = 'run-1'): AgentRunTrace => ({
    runId,
    ownerDid: 'did:key:user',
    model: 'test-model',
    status: 'success',
    createdAt: new Date('2026-05-20T00:00:00Z'),
    inputMessages: [{ role: 'user', content: 'Please remember that I prefer short answers.' }],
    finalAssistantMessage: 'Got it.',
    toolRuns: [],
    skillUsage: { listed: [], read: [] },
    traceChars: 100,
    truncated: false,
});

const getProvider = (content: string): AgentProvider => ({
    complete: async () => ({
        message: {
            role: 'assistant',
            content,
        },
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
    }),
});

describe('runRetroImprovement', () => {
    const createInput = (overrides: Partial<RetroRunInput> = {}): RetroRunInput => ({
        ownerDid: 'did:key:user',
        model: 'retro-model',
        provider: getProvider('{"action":"noop"}'),
        trace: getTrace(),
        activeDocs: [],
        userDocs: createUserDocService(createInMemoryUserDocRepository()),
        results: createInMemoryRetroResultRepository(),
        ...overrides,
    });

    it('refuses a prompt that cannot fit in the remaining token budget before calling the provider', async () => {
        const complete = vi.fn(getProvider('{"action":"noop"}').complete);
        const input = createInput({ provider: { complete }, maxTotalTokens: 100 });
        expect(await runRetroImprovement(input)).toMatchObject({ status: 'error' });
        expect(complete).not.toHaveBeenCalled();
        expect(await input.results.findByRunId('run-1')).toMatchObject([{ status: 'error' }]);
    });

    it('caps output to the affordable remainder and prevents over-budget writes', async () => {
        let requestedOutput = 0;
        const input = createInput({
            maxEstimatedCostUsd: 0.0003,
            inputTokenCostUsdPerMillion: 0,
            outputTokenCostUsdPerMillion: 1,
            maxOutputTokens: 4_096,
            provider: {
                complete: async request => {
                    requestedOutput = request.maxOutputTokens ?? 0;
                    return {
                        message: {
                            role: 'assistant',
                            content: JSON.stringify({
                                action: 'create',
                                name: 'answer-style',
                                kind: 'memory',
                                description: 'Preference',
                                content: 'Short answers',
                            }),
                        },
                        usage: { inputTokens: 100, outputTokens: 301, totalTokens: 401 },
                    };
                },
            },
        });
        expect(await runRetroImprovement(input)).toMatchObject({ status: 'error' });
        expect(requestedOutput).toBe(300);
        expect(await input.userDocs.getDocsForDebug(input.ownerDid)).toEqual([]);
    });

    it.each([
        { maxOutputTokens: 40, usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 } },
        {
            maxTotalTokens: 10_000,
            usage: { inputTokens: 10_000, outputTokens: 1, totalTokens: 10_001 },
        },
        {
            maxEstimatedCostUsd: 0.01,
            inputTokenCostUsdPerMillion: 1,
            outputTokenCostUsdPerMillion: 0,
            usage: { inputTokens: 20_000, outputTokens: 1, totalTokens: 20_001 },
        },
        { usage: undefined },
    ])(
        'audits actual usage violations before applying a decision',
        async ({ usage = undefined, ...limits }) => {
            const response = await getProvider(
                JSON.stringify({
                    action: 'create',
                    name: 'answer-style',
                    kind: 'memory',
                    description: 'Preference',
                    content: 'Short answers',
                })
            ).complete({ model: 'retro-model', messages: [], tools: [] });
            const input = createInput({
                ...limits,
                provider: { complete: async () => ({ ...response, usage }) },
            });
            expect(await runRetroImprovement(input)).toMatchObject({ status: 'error' });
            expect(await input.userDocs.getDocsForDebug(input.ownerDid)).toEqual([]);
        }
    );

    it('fails closed without model-specific pricing when a cost bound is configured', async () => {
        const complete = vi.fn(getProvider('{"action":"noop"}').complete);
        const input = createInput({ provider: { complete }, maxEstimatedCostUsd: 1 });
        expect(await runRetroImprovement(input)).toMatchObject({ status: 'error' });
        expect(complete).not.toHaveBeenCalled();
    });

    it('aborts an uncooperative provider at the deadline and audits failure without writing memory', async () => {
        vi.useFakeTimers();
        try {
            let providerSignal: AbortSignal | undefined;
            const started = Promise.withResolvers<void>();
            const pending = Promise.withResolvers<AgentProviderResponse>();
            const input = createInput({
                deadlineAt: Date.now() + 50,
                provider: {
                    complete: async request => {
                        providerSignal = request.signal;
                        started.resolve();
                        return pending.promise;
                    },
                },
            });
            const run = runRetroImprovement(input);
            await started.promise;
            await vi.advanceTimersByTimeAsync(50);
            expect(await run).toMatchObject({ status: 'error' });
            expect(providerSignal?.aborted).toBe(true);
            expect(await input.results.findByRunId('run-1')).toMatchObject([{ status: 'error' }]);
            pending.resolve(
                await getProvider(
                    JSON.stringify({
                        action: 'create',
                        name: 'late-memory',
                        kind: 'memory',
                        description: 'Must not be saved',
                        content: 'Late response',
                    })
                ).complete({
                    model: 'retro-model',
                    messages: [],
                    tools: [],
                })
            );
            await vi.advanceTimersByTimeAsync(0);
            expect(await input.userDocs.getDocsForDebug(input.ownerDid)).toEqual([]);
        } finally {
            vi.useRealTimers();
        }
    });

    it.each([
        { action: 'create', preparation: 'lookup' },
        { action: 'update', preparation: 'lookup' },
        { action: 'create', preparation: 'encryption' },
        { action: 'update', preparation: 'encryption' },
    ] as const)(
        'prevents $action after $preparation resumes past the deadline',
        async ({ action, preparation }) => {
            vi.useFakeTimers();
            try {
                const started = Promise.withResolvers<void>();
                const pending = Promise.withResolvers<void>();
                let stall = false;
                const pause = async (): Promise<void> => {
                    if (!stall) return;
                    started.resolve();
                    await pending.promise;
                };
                const documents: Array<Record<string, unknown>> = [];
                const cursor = {
                    toArray: async () => structuredClone(documents),
                    sort: () => cursor,
                };
                const collection = {
                    createIndex: async () => 'index',
                    find: () => cursor,
                    findOne: async ({ name }: { name: string }) => {
                        if (preparation === 'lookup') await pause();
                        return documents.find(doc => doc.name === name);
                    },
                    insertOne: async (doc: Record<string, unknown>) => {
                        documents.push(doc);
                    },
                    replaceOne: async (
                        { name }: { name: string },
                        doc: Record<string, unknown>
                    ) => {
                        documents[documents.findIndex(existing => existing.name === name)] = doc;
                    },
                };
                const encryption = createStorageTestEncryption();
                const userDocs = createUserDocService(
                    createMongoUserDocRepository(
                        { collection: () => collection } as unknown as Db,
                        {
                            ...encryption,
                            encryptJson: async (value, aad) => {
                                if (preparation === 'encryption') await pause();
                                return encryption.encryptJson(value, aad);
                            },
                        }
                    )
                );
                if (action === 'update') {
                    await userDocs.createDoc({
                        ownerDid: 'did:key:user',
                        name: 'answer-style',
                        kind: 'memory',
                        description: 'Answer style',
                        content: 'Original preference',
                    });
                }
                const before = await userDocs.getDocsForDebug('did:key:user');
                const storedBefore = structuredClone(documents);
                stall = true;
                const input = createInput({
                    userDocs,
                    deadlineAt: Date.now() + 50,
                    provider: getProvider(
                        JSON.stringify({
                            action,
                            name: 'answer-style',
                            kind: 'memory',
                            description: 'Answer style',
                            content: 'Late preference',
                        })
                    ),
                });
                const run = runRetroImprovement(input);
                await started.promise;
                if (preparation === 'lookup') {
                    await vi.advanceTimersByTimeAsync(50);
                } else {
                    // The wall-clock fence must also work before a queued timer runs.
                    vi.setSystemTime(Date.now() + 50);
                }
                pending.resolve();
                expect(await run).toMatchObject({ status: 'error' });
                expect(documents).toEqual(storedBefore);
                expect(await userDocs.getDocsForDebug(input.ownerDid)).toEqual(before);
                expect(await input.results.findByRunId('run-1')).toMatchObject([
                    { status: 'error' },
                ]);
            } finally {
                vi.useRealTimers();
            }
        }
    );

    it('reports real provider usage even when the decision is malformed', async () => {
        const onModelComplete = vi.fn();
        const input = createInput({
            provider: getProvider('not json'),
            observer: { onModelComplete },
        });
        expect(await runRetroImprovement(input)).toMatchObject({ status: 'error' });
        expect(onModelComplete).toHaveBeenCalledTimes(1);
        expect(onModelComplete).toHaveBeenCalledWith(
            expect.objectContaining({
                model: 'retro-model',
                usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
            })
        );
    });

    it('records noop decisions', async () => {
        const userDocs = createUserDocService(createInMemoryUserDocRepository());
        const results = createInMemoryRetroResultRepository();

        const result = await runRetroImprovement({
            ownerDid: 'did:key:user',
            model: 'retro-model',
            provider: getProvider(JSON.stringify({ action: 'noop', reason: 'No durable info.' })),
            trace: getTrace(),
            activeDocs: [],
            userDocs,
            results,
        });

        expect(result).toMatchObject({
            action: 'noop',
            status: 'noop',
            reason: 'No durable info.',
        });
        await expect(results.findByRunId('run-1')).resolves.toHaveLength(1);
        await expect(userDocs.getDocsForDebug('did:key:user')).resolves.toEqual([]);
    });

    it('creates a new user doc from structured output', async () => {
        const userDocs = createUserDocService(createInMemoryUserDocRepository());
        const results = createInMemoryRetroResultRepository();

        const result = await runRetroImprovement({
            ownerDid: 'did:key:user',
            model: 'retro-model',
            provider: getProvider(
                JSON.stringify({
                    action: 'create',
                    name: 'answer-style',
                    kind: 'memory',
                    description: 'Answer style preference.',
                    content: '# Answer Style\n\nTaylor prefers short answers.',
                    reason: 'The user explicitly asked to remember it.',
                })
            ),
            trace: getTrace(),
            activeDocs: [],
            userDocs,
            results,
        });

        expect(result).toMatchObject({
            action: 'create',
            status: 'applied',
            docName: 'answer-style',
            docVersion: 1,
        });
        await expect(userDocs.getActiveDoc('did:key:user', 'answer-style')).resolves.toMatchObject({
            content: '# Answer Style\n\nTaylor prefers short answers.',
            version: 1,
        });
    });

    it('normalizes null expiresAt on create decisions', async () => {
        const userDocs = createUserDocService(createInMemoryUserDocRepository());
        const results = createInMemoryRetroResultRepository();

        const result = await runRetroImprovement({
            ownerDid: 'did:key:user',
            model: 'retro-model',
            provider: getProvider(
                JSON.stringify({
                    action: 'create',
                    name: 'answer-style',
                    kind: 'memory',
                    description: 'Answer style preference.',
                    content: '# Answer Style\n\nTaylor prefers short answers.',
                    expiresAt: null,
                    reason: 'The user explicitly asked to remember it.',
                })
            ),
            trace: getTrace(),
            activeDocs: [],
            userDocs,
            results,
        });

        expect(result).toMatchObject({
            action: 'create',
            status: 'applied',
            docName: 'answer-style',
        });
        const doc = await userDocs.getActiveDoc('did:key:user', 'answer-style');

        expect(doc).toMatchObject({ version: 1 });
        expect(doc?.expiresAt).toBeUndefined();
    });

    it('normalizes human-readable create names into storage-safe slugs', async () => {
        const userDocs = createUserDocService(createInMemoryUserDocRepository());
        const results = createInMemoryRetroResultRepository();

        const result = await runRetroImprovement({
            ownerDid: 'did:key:user',
            model: 'retro-model',
            provider: getProvider(
                JSON.stringify({
                    action: 'create',
                    name: 'User is pursuing bartender job preparation',
                    kind: 'memory',
                    description: 'Near-term career goal.',
                    content:
                        '# Bartender Job Preparation\n\nThe user is preparing to apply for bartender jobs.',
                    reason: 'The user explicitly asked how to get a job as a bartender and requested a resume for that goal.',
                })
            ),
            trace: getTrace('run-bartender'),
            activeDocs: [],
            userDocs,
            results,
        });

        expect(result).toMatchObject({
            action: 'create',
            status: 'applied',
            docName: 'user-is-pursuing-bartender-job-preparation',
        });
        await expect(
            userDocs.getActiveDoc('did:key:user', 'user-is-pursuing-bartender-job-preparation')
        ).resolves.toMatchObject({
            description: 'Near-term career goal.',
            version: 1,
        });
    });

    it('updates an existing user doc from structured output', async () => {
        const userDocs = createUserDocService(createInMemoryUserDocRepository());
        const results = createInMemoryRetroResultRepository();
        const existing = await userDocs.createDoc({
            ownerDid: 'did:key:user',
            name: 'answer-style',
            kind: 'memory',
            description: 'Answer style preference.',
            content: '# Answer Style\n\nTaylor prefers short answers.',
            sourceType: 'user-stated',
        });

        const result = await runRetroImprovement({
            ownerDid: 'did:key:user',
            model: 'retro-model',
            provider: getProvider(
                JSON.stringify({
                    action: 'update',
                    name: 'answer-style',
                    description: 'Answer style and examples preference.',
                    content:
                        '# Answer Style\n\nTaylor prefers short answers with TypeScript examples when relevant.',
                    reason: 'The user clarified their preference.',
                })
            ),
            trace: getTrace('run-2'),
            activeDocs: [existing],
            userDocs,
            results,
        });

        expect(result).toMatchObject({
            action: 'update',
            status: 'applied',
            docName: 'answer-style',
            docVersion: 2,
        });
        await expect(userDocs.getActiveDoc('did:key:user', 'answer-style')).resolves.toMatchObject({
            version: 2,
            description: 'Answer style and examples preference.',
            history: [expect.objectContaining({ version: 1 })],
        });
    });

    it('stores proposed memories without exposing them as active docs', async () => {
        const userDocs = createUserDocService(createInMemoryUserDocRepository());
        const results = createInMemoryRetroResultRepository();

        const result = await runRetroImprovement({
            ownerDid: 'did:key:user',
            model: 'retro-model',
            provider: getProvider(
                JSON.stringify({
                    action: 'propose',
                    name: 'possible-career-interest',
                    kind: 'memory',
                    description: 'Possible career interest.',
                    content: '# Possible Interest\n\nTaylor may be interested in AI agent work.',
                    sourceType: 'agent-inferred',
                    confidence: 0.55,
                    sensitivity: 'normal',
                    reason: 'This was inferred from the conversation.',
                })
            ),
            trace: getTrace('run-3'),
            activeDocs: [],
            userDocs,
            results,
        });

        expect(result).toMatchObject({
            action: 'propose',
            status: 'applied',
            docName: 'possible-career-interest',
            docVersion: 1,
        });
        await expect(
            userDocs.getActiveDoc('did:key:user', 'possible-career-interest')
        ).resolves.toBeUndefined();
        await expect(userDocs.getDocsForDebug('did:key:user')).resolves.toEqual([
            expect.objectContaining({
                name: 'possible-career-interest',
                status: 'proposed',
                requiresApproval: true,
            }),
        ]);
    });
});
