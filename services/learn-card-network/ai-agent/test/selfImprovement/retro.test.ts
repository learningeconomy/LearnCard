import { describe, expect, it } from 'vitest';

import type { AgentProvider } from '../../src/agent/types';
import type { AgentRunTrace } from '../../src/selfImprovement/runTrace';
import {
    createInMemoryRetroResultRepository,
    runRetroImprovement,
} from '../../src/selfImprovement/retro';
import {
    createInMemoryUserDocRepository,
    createUserDocService,
} from '../../src/selfImprovement/userDocs';

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
    }),
});

describe('runRetroImprovement', () => {
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
