import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_SKILL_FRAMEWORKS } from './skill-frameworks.fixtures';

// Review r4339891853: a failing Nova pass must not suppress the legacy Google pass (and the
// reverse), and each failure must still be reported. Bedrock and Google are mocked here.
const embeddings = vi.hoisted(() => ({
    upsertNova: vi.fn(),
    upsertLegacy: vi.fn(),
}));

class FakeSkillEmbeddingError extends Error {
    constructor(readonly code: string) {
        super(code);
    }
}

vi.mock('@helpers/skill-embedding.helpers', () => ({
    upsertNovaSkillEmbeddings: embeddings.upsertNova,
    upsertLegacySkillEmbeddings: embeddings.upsertLegacy,
    isSkillEmbeddingEnabled: () => true,
    isLegacySkillEmbeddingEnabled: () => true,
    isSkillEmbeddingError: (error: unknown) => error instanceof FakeSkillEmbeddingError,
    getSkillEmbeddingGeneration: () => ({ vectorProperty: 'embedding_nova2_v1_0_d1024' }),
}));

/** Query runner double: every framework has one skill missing both vectors. */
const run = vi.fn(async (query: string, params?: Record<string, unknown>) => {
    if (query.includes('IS NULL') && query.includes('[:CONTAINS]->(s:Skill)')) {
        const frameworkId = String(params?.frameworkId);
        return {
            records: [
                {
                    get: (key: string) =>
                        key === 's'
                            ? { properties: { id: `${frameworkId}-skill`, statement: 'Python' } }
                            : null,
                },
            ],
        };
    }
    return { records: [] };
});

describe('seedSkillFrameworkFixtures embedding passes', () => {
    beforeEach(() => {
        run.mockClear();
        embeddings.upsertNova.mockReset();
        embeddings.upsertLegacy.mockReset().mockResolvedValue(undefined);
    });

    it('still writes legacy embeddings for every framework when Nova is denied, and reports it', async () => {
        embeddings.upsertNova.mockRejectedValue(new FakeSkillEmbeddingError('access_denied'));
        const log = { log: vi.fn(), warn: vi.fn() };
        const { seedSkillFrameworkFixtures } = await import('./seedSkillFrameworks');

        await seedSkillFrameworkFixtures(run, { log });

        expect(embeddings.upsertLegacy).toHaveBeenCalledTimes(DEFAULT_SKILL_FRAMEWORKS.length);
        // Nova stops after its first failure instead of retrying every framework.
        expect(embeddings.upsertNova).toHaveBeenCalledTimes(1);
        const warnings = log.warn.mock.calls.map(call => String(call[0])).join('\n');
        expect(warnings).toContain('Nova');
        expect(warnings).toContain('Bedrock denied the embedding request');
        expect(warnings).not.toMatch(/legacy google embedding backfill was skipped/i);
    });

    it('still writes Nova embeddings when the legacy Google pass fails, and reports it', async () => {
        embeddings.upsertNova.mockResolvedValue(undefined);
        embeddings.upsertLegacy.mockRejectedValue(new Error('google down'));
        const log = { log: vi.fn(), warn: vi.fn() };
        const { seedSkillFrameworkFixtures } = await import('./seedSkillFrameworks');

        await seedSkillFrameworkFixtures(run, { log });

        expect(embeddings.upsertNova).toHaveBeenCalledTimes(DEFAULT_SKILL_FRAMEWORKS.length);
        expect(embeddings.upsertLegacy).toHaveBeenCalledTimes(1);
        const warnings = log.warn.mock.calls.map(call => String(call[0])).join('\n');
        expect(warnings).toMatch(/legacy google embedding backfill was skipped/i);
        expect(warnings).not.toMatch(/nova embedding backfill was skipped/i);
    });
});
