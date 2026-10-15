import { createHash } from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SkillEmbeddingCandidate } from '@accesslayer/skill/read';
import type { SkillEmbeddingUpdate } from '@accesslayer/skill/update';

const store = vi.hoisted(() => new Map<string, string>());

vi.mock('@cache', () => ({
    default: {
        get: vi.fn(async (key: string) => store.get(key)),
        set: vi.fn(async (key: string, value: string) => {
            store.set(key, value);
            return 'OK';
        }),
        node: {},
    },
}));

const accessLayer = vi.hoisted(() => ({
    getSkillEmbeddingCandidates: vi.fn(),
    updateSkillEmbedding: vi.fn(),
}));

vi.mock('@accesslayer/skill/read', () => ({
    getSkillEmbeddingCandidates: accessLayer.getSkillEmbeddingCandidates,
}));
vi.mock('@accesslayer/skill/update', () => ({
    updateSkillEmbedding: accessLayer.updateSkillEmbedding,
}));

const DIMENSION = 1024;
const MODEL_ID = 'amazon.nova-2-multimodal-embeddings-v1:0';

const unitVector = (seed: number): number[] => {
    const vector = Array.from({ length: DIMENSION }, (_, index) => Math.sin(seed + index));
    const norm = Math.hypot(...vector);
    return vector.map(value => value / norm);
};

const novaBody = (vector: number[]) =>
    new TextEncoder().encode(
        JSON.stringify({ embeddings: [{ embeddingType: 'TEXT', embedding: vector }] })
    );

type Helpers = typeof import('./skill-embedding.helpers');

const loadHelpers = async (env: Record<string, string> = {}): Promise<Helpers> => {
    vi.resetModules();
    process.env.SKILL_EMBEDDING_BEDROCK_ENABLED = 'true';
    for (const [key, value] of Object.entries(env)) process.env[key] = value;
    return import('./skill-embedding.helpers');
};

const ENV_KEYS = [
    'SKILL_EMBEDDING_BEDROCK_ENABLED',
    'SKILL_EMBEDDING_BEDROCK_READ_ENABLED',
    'SKILL_EMBEDDING_GOOGLE_API_KEY',
    'SKILL_EMBEDDING_GOOGLE_MODEL',
    'SKILL_EMBEDDING_BEDROCK_MODEL_ID',
    'SKILL_EMBEDDING_DIMENSION',
    'SKILL_EMBEDDING_CONCURRENCY',
    'SKILL_EMBEDDING_BACKFILL_ON_STARTUP',
];

const purposeOf = (body: string) => JSON.parse(body).singleEmbeddingParams.embeddingPurpose;

describe('skill embedding helpers (Nova 2, mocked Bedrock)', () => {
    let invoke: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        store.clear();
        accessLayer.getSkillEmbeddingCandidates.mockReset();
        accessLayer.updateSkillEmbedding.mockReset().mockResolvedValue(true);
        invoke = vi.fn(async () => novaBody(unitVector(1)));
    });

    afterEach(() => {
        for (const key of ENV_KEYS) delete process.env[key];
    });

    // Nova query path (read flag on).
    describe('query embeddings and cache', () => {
        const NOVA_READ = { SKILL_EMBEDDING_BEDROCK_READ_ENABLED: 'true' };

        it('puts the model ID and dimension in the Redis key, never the legacy Google key', async () => {
            const helpers = await loadHelpers(NOVA_READ);
            const key = helpers.getQueryEmbeddingCacheKey('data analysis');
            const digest = createHash('sha256').update('data analysis').digest('hex');

            expect(key).toBe(
                `skill-embedding:query:${MODEL_ID}:${DIMENSION}:index-retrieval-v1:${digest}`
            );
            expect(key).not.toBe(`skill-embedding:query:gemini-embedding-001:${digest}`);
        });

        it('never reuses a vector cached under the old Google key', async () => {
            const helpers = await loadHelpers(NOVA_READ);
            helpers.setSkillEmbeddingInvokeForTests(invoke as never);
            const digest = createHash('sha256').update('data analysis').digest('hex');
            store.set(
                `skill-embedding:query:gemini-embedding-001:${digest}`,
                JSON.stringify({ values: Array(768).fill(0.1) })
            );

            const vector = await helpers.generateQueryEmbedding('data analysis');

            expect(vector).toHaveLength(DIMENSION);
            expect(invoke).toHaveBeenCalledTimes(1);
            expect(purposeOf(invoke.mock.calls[0]![0].body)).toBe('TEXT_RETRIEVAL');
        });

        it('serves repeat queries from the cache and ignores wrong-size cached vectors', async () => {
            const helpers = await loadHelpers(NOVA_READ);
            helpers.setSkillEmbeddingInvokeForTests(invoke as never);

            await helpers.generateQueryEmbedding('teamwork');
            await helpers.generateQueryEmbedding('teamwork');
            expect(invoke).toHaveBeenCalledTimes(1);

            store.set(
                helpers.getQueryEmbeddingCacheKey('teamwork'),
                JSON.stringify({ values: [1, 2, 3] })
            );
            expect(await helpers.getCachedQueryEmbedding('teamwork')).toBeNull();
        });

        it('fails closed with a sanitised error when embeddings are disabled', async () => {
            // The read flag cannot be on with Nova disabled (startup rejects it), so exercise the
            // shared Nova embed call directly.
            const helpers = await loadHelpers({ SKILL_EMBEDDING_BEDROCK_ENABLED: 'false' });
            helpers.setSkillEmbeddingInvokeForTests(invoke as never);

            await expect(helpers.generateIndexEmbeddings(['teamwork'])).rejects.toMatchObject({
                code: 'disabled',
            });
            expect(invoke).not.toHaveBeenCalled();
        });
    });

    describe('index embeddings', () => {
        it('embeds skills with GENERIC_INDEX and stores the vector with its generation key', async () => {
            const helpers = await loadHelpers();
            helpers.setSkillEmbeddingInvokeForTests(invoke as never);
            const updates: SkillEmbeddingUpdate[] = [];

            await helpers.upsertSkillEmbeddings(
                [
                    {
                        id: 's1',
                        frameworkId: 'fw',
                        statement: 'Python',
                        description: 'Writes Python',
                    },
                    { id: 's2', frameworkId: 'fw', statement: '   ' },
                ],
                async update => {
                    updates.push(update);
                    return true;
                }
            );

            expect(invoke).toHaveBeenCalledTimes(1);
            expect(purposeOf(invoke.mock.calls[0]![0].body)).toBe('GENERIC_INDEX');
            expect(updates).toHaveLength(1);
            const [update] = updates;
            const generation = helpers.getSkillEmbeddingGeneration();
            expect(update).toMatchObject({ skillId: 's1', frameworkId: 'fw', generation });
            expect(update!.embedding).toHaveLength(DIMENSION);
            expect(update!.embeddingKey).toBe(
                helpers.computeSkillEmbeddingKey(generation, 'Python\nWrites Python')
            );
            expect(generation).toMatchObject({
                vectorProperty: 'embedding_nova2_v1_0_d1024',
                keyProperty: 'embedding_nova2_v1_0_d1024_key',
                indexName: 'skill_embedding_nova2_v1_0_d1024_idx',
            });
        });

        it('is a no-op while embeddings are disabled so skill CRUD keeps working', async () => {
            const helpers = await loadHelpers({ SKILL_EMBEDDING_BEDROCK_ENABLED: 'false' });
            const update = vi.fn();

            await helpers.upsertSkillEmbeddings([{ id: 's1', statement: 'Python' }], update);

            expect(update).not.toHaveBeenCalled();
        });

        it('keys change when the dimension changes, forcing a re-embed', async () => {
            const a = await loadHelpers();
            const keyA = a.computeSkillEmbeddingKey(a.getSkillEmbeddingGeneration(), 'Python');
            const b = await loadHelpers({ SKILL_EMBEDDING_DIMENSION: '384' });
            const generationB = b.getSkillEmbeddingGeneration();

            expect(b.computeSkillEmbeddingKey(generationB, 'Python')).not.toBe(keyA);
            expect(generationB.vectorProperty).toBe('embedding_nova2_v1_0_d384');
        });
    });

    describe('read routing (SKILL_EMBEDDING_BEDROCK_READ_ENABLED)', () => {
        const LEGACY_DIMENSION = 768;
        const legacyVector = () => Array(LEGACY_DIMENSION).fill(0.05);
        const GOOGLE = { SKILL_EMBEDDING_GOOGLE_API_KEY: 'legacy-google-key' };

        const withFakes = (helpers: Helpers) => {
            const legacyEmbed = vi.fn(async (texts: string[]) => texts.map(() => legacyVector()));
            helpers.setSkillEmbeddingInvokeForTests(invoke as never);
            helpers.setLegacySkillEmbeddingForTests(legacyEmbed);
            return legacyEmbed;
        };

        it("defaults off: legacy index, Google query embeddings, main's cache key", async () => {
            const helpers = await loadHelpers(GOOGLE);
            const legacyEmbed = withFakes(helpers);
            const digest = createHash('sha256').update('data analysis').digest('hex');

            expect(helpers.isSkillEmbeddingNovaReadEnabled()).toBe(false);
            expect(helpers.getSkillEmbeddingSearchIndex()).toEqual({
                source: 'legacy',
                indexName: 'skill_embedding_vector_idx',
                dimension: LEGACY_DIMENSION,
            });

            const vector = await helpers.generateQueryEmbedding('  data analysis ');
            await helpers.generateQueryEmbedding('data analysis');

            expect(vector).toHaveLength(LEGACY_DIMENSION);
            expect(legacyEmbed).toHaveBeenCalledTimes(1);
            expect(legacyEmbed).toHaveBeenCalledWith(['data analysis']);
            expect(invoke).not.toHaveBeenCalled();
            expect(helpers.getSearchQueryEmbeddingCacheKey('data analysis')).toBe(
                `skill-embedding:query:gemini-embedding-001:${digest}`
            );
            expect([...store.keys()]).toEqual([
                `skill-embedding:query:gemini-embedding-001:${digest}`,
            ]);
        });

        it('on: Nova index with TEXT_RETRIEVAL query embeddings and the Nova cache key', async () => {
            const helpers = await loadHelpers({
                ...GOOGLE,
                SKILL_EMBEDDING_BEDROCK_READ_ENABLED: 'true',
            });
            const legacyEmbed = withFakes(helpers);

            expect(helpers.getSkillEmbeddingSearchIndex()).toEqual({
                source: 'nova',
                indexName: 'skill_embedding_nova2_v1_0_d1024_idx',
                dimension: DIMENSION,
            });

            const vector = await helpers.generateQueryEmbedding('data analysis');

            expect(vector).toHaveLength(DIMENSION);
            expect(legacyEmbed).not.toHaveBeenCalled();
            expect(purposeOf(invoke.mock.calls[0]![0].body)).toBe('TEXT_RETRIEVAL');
            expect(helpers.getSearchQueryEmbeddingCacheKey('data analysis')).toBe(
                helpers.getQueryEmbeddingCacheKey('data analysis')
            );
        });

        it("flag-off and flag-on cache keys never collide, and neither reads the other's vector", async () => {
            const off = await loadHelpers(GOOGLE);
            const legacyKey = off.getSearchQueryEmbeddingCacheKey('teamwork');
            const on = await loadHelpers({
                ...GOOGLE,
                SKILL_EMBEDDING_BEDROCK_READ_ENABLED: 'true',
            });
            const novaKey = on.getSearchQueryEmbeddingCacheKey('teamwork');

            expect(legacyKey).not.toBe(novaKey);
            expect(novaKey).toContain(`:${DIMENSION}:`);

            // Even if a wrong-size vector sat under either key, it is never returned.
            store.set(legacyKey, JSON.stringify({ values: unitVector(3) }));
            store.set(novaKey, JSON.stringify({ values: legacyVector() }));
            expect(await off.getCachedQueryEmbedding('teamwork')).toBeNull();
            expect(await on.getCachedQueryEmbedding('teamwork')).toBeNull();
        });

        it('flipping the flag back off (rollback) returns to the legacy path', async () => {
            const on = await loadHelpers({
                ...GOOGLE,
                SKILL_EMBEDDING_BEDROCK_READ_ENABLED: 'true',
            });
            expect(on.getSkillEmbeddingSearchIndex().source).toBe('nova');

            const off = await loadHelpers({
                ...GOOGLE,
                SKILL_EMBEDDING_BEDROCK_READ_ENABLED: 'false',
            });
            const legacyEmbed = withFakes(off);
            expect(off.getSkillEmbeddingSearchIndex().source).toBe('legacy');
            expect(await off.generateQueryEmbedding('teamwork')).toHaveLength(LEGACY_DIMENSION);
            expect(legacyEmbed).toHaveBeenCalledTimes(1);
            expect(invoke).not.toHaveBeenCalled();
        });

        it('flag off without a Google key fails closed and never calls Bedrock', async () => {
            const helpers = await loadHelpers();
            helpers.setSkillEmbeddingInvokeForTests(invoke as never);

            await expect(helpers.generateQueryEmbedding('teamwork')).rejects.toMatchObject({
                code: 'disabled',
            });
            expect(invoke).not.toHaveBeenCalled();
        });
    });

    describe('write path (independent of the read flag)', () => {
        const GOOGLE = { SKILL_EMBEDDING_GOOGLE_API_KEY: 'legacy-google-key' };
        const skills = [
            { id: 's1', frameworkId: 'fw', statement: 'Python', description: 'Writes Python' },
            { id: 's2', statement: 'SQL' },
        ];

        it.each(['false', 'true'])(
            'read flag %s: writes Nova (GENERIC_INDEX) and legacy Google vectors for every skill',
            async readFlag => {
                const helpers = await loadHelpers({
                    ...GOOGLE,
                    SKILL_EMBEDDING_BEDROCK_READ_ENABLED: readFlag,
                });
                const legacyEmbed = vi.fn(async (texts: string[]) =>
                    texts.map(() => Array(768).fill(0.05))
                );
                helpers.setSkillEmbeddingInvokeForTests(invoke as never);
                helpers.setLegacySkillEmbeddingForTests(legacyEmbed);
                const novaUpdate = vi.fn(async (_update: SkillEmbeddingUpdate) => true);
                const legacyUpdate = vi.fn(
                    async (_skillId: string, _embedding: number[], _frameworkId?: string) => true
                );

                await helpers.upsertSkillEmbeddings(skills, novaUpdate, legacyUpdate);

                expect(invoke).toHaveBeenCalledTimes(2);
                for (const call of invoke.mock.calls) {
                    expect(purposeOf(call[0].body)).toBe('GENERIC_INDEX');
                }
                expect(novaUpdate.mock.calls.map(([update]) => update.skillId)).toEqual([
                    's1',
                    's2',
                ]);
                expect(novaUpdate.mock.calls[0]![0]).toMatchObject({
                    frameworkId: 'fw',
                    generation: { vectorProperty: 'embedding_nova2_v1_0_d1024' },
                });

                // Main's legacy request: one batched Google call with main's text.
                expect(legacyEmbed).toHaveBeenCalledWith(['Python\nWrites Python', 'SQL']);
                expect(legacyUpdate.mock.calls.map(call => [call[0], call[2]])).toEqual([
                    ['s1', 'fw'],
                    ['s2', undefined],
                ]);
                expect(legacyUpdate.mock.calls[0]![1]).toHaveLength(768);
            }
        );

        it('without a Google key, only Nova is written (legacy is a quiet no-op)', async () => {
            const helpers = await loadHelpers();
            helpers.setSkillEmbeddingInvokeForTests(invoke as never);
            const novaUpdate = vi.fn(async () => true);
            const legacyUpdate = vi.fn(async () => true);

            await helpers.upsertSkillEmbeddings(skills, novaUpdate, legacyUpdate);

            expect(novaUpdate).toHaveBeenCalledTimes(2);
            expect(legacyUpdate).not.toHaveBeenCalled();
        });

        it('a Nova failure never skips the legacy write (and vice versa); the error still surfaces', async () => {
            const helpers = await loadHelpers(GOOGLE);
            helpers.setSkillEmbeddingInvokeForTests(
                vi.fn(async () => {
                    throw Object.assign(new Error('denied'), { name: 'AccessDeniedException' });
                }) as never
            );
            helpers.setLegacySkillEmbeddingForTests(async texts =>
                texts.map(() => Array(768).fill(0.05))
            );
            const legacyUpdate = vi.fn(async () => true);

            await expect(
                helpers.upsertSkillEmbeddings(
                    skills,
                    vi.fn(async () => true),
                    legacyUpdate
                )
            ).rejects.toBeDefined();
            expect(legacyUpdate).toHaveBeenCalledTimes(2);

            const second = await loadHelpers(GOOGLE);
            second.setSkillEmbeddingInvokeForTests(invoke as never);
            second.setLegacySkillEmbeddingForTests(async () => {
                throw new Error('google down');
            });
            const novaUpdate = vi.fn(async () => true);

            await expect(
                second.upsertSkillEmbeddings(
                    skills,
                    novaUpdate,
                    vi.fn(async () => true)
                )
            ).rejects.toThrow('google down');
            expect(novaUpdate).toHaveBeenCalledTimes(2);
        });

        it('with Nova disabled, legacy writes still happen exactly as on main', async () => {
            const helpers = await loadHelpers({
                ...GOOGLE,
                SKILL_EMBEDDING_BEDROCK_ENABLED: 'false',
            });
            helpers.setSkillEmbeddingInvokeForTests(invoke as never);
            helpers.setLegacySkillEmbeddingForTests(async texts =>
                texts.map(() => Array(768).fill(0.05))
            );
            const novaUpdate = vi.fn(async () => true);
            const legacyUpdate = vi.fn(async () => true);

            await helpers.upsertSkillEmbeddings(skills, novaUpdate, legacyUpdate);

            expect(invoke).not.toHaveBeenCalled();
            expect(novaUpdate).not.toHaveBeenCalled();
            expect(legacyUpdate).toHaveBeenCalledTimes(2);
        });
    });

    describe('backfill', () => {
        const candidate = (
            helpers: Helpers,
            id: string,
            state: 'missing' | 'current' | 'stale',
            statement = `Skill ${id}`
        ): SkillEmbeddingCandidate => ({
            id,
            frameworkId: 'fw',
            statement,
            description: null,
            code: null,
            hasEmbedding: state !== 'missing',
            embeddingKey:
                state === 'current'
                    ? helpers.computeSkillEmbeddingKey(
                          helpers.getSkillEmbeddingGeneration(),
                          statement
                      )
                    : state === 'stale'
                      ? 'old-key'
                      : null,
        });

        const pages = (...records: SkillEmbeddingCandidate[][]) => {
            const fn = vi.fn();
            records.forEach((page, index) => {
                const last = page[page.length - 1];
                fn.mockResolvedValueOnce({
                    records: page,
                    hasMore: index < records.length - 1,
                    cursor: index < records.length - 1 && last ? last.id : null,
                });
            });
            fn.mockResolvedValue({ records: [], hasMore: false, cursor: null });
            return fn;
        };

        it('skips skills already embedded with the current generation and re-embeds missing or stale ones', async () => {
            const helpers = await loadHelpers();
            const embedIndex = vi.fn(async () => unitVector(2));
            const update = vi.fn(async () => true);

            const stats = await helpers.runSkillEmbeddingBackfill(
                { pageSize: 2 },
                {
                    getCandidates: pages(
                        [candidate(helpers, 'a', 'current'), candidate(helpers, 'b', 'missing')],
                        [candidate(helpers, 'c', 'stale')]
                    ),
                    embedIndex,
                    update,
                    keepAlive: async () => true,
                    sleep: async () => undefined,
                }
            );

            expect(stats).toMatchObject({
                scanned: 3,
                alreadyCurrent: 1,
                embedded: 2,
                failed: 0,
                cursor: 'c',
            });
            expect(stats.stoppedReason).toBeUndefined();
            expect(
                update.mock.calls
                    .map(call => (call as unknown[])[0] as SkillEmbeddingUpdate)
                    .map(u => u.skillId)
            ).toEqual(['b', 'c']);
        });

        it('is idempotent: a second run over the same data embeds nothing', async () => {
            const helpers = await loadHelpers();
            const embedIndex = vi.fn(async () => unitVector(3));

            const stats = await helpers.runSkillEmbeddingBackfill(
                {},
                {
                    getCandidates: pages([
                        candidate(helpers, 'a', 'current'),
                        candidate(helpers, 'b', 'current'),
                    ]),
                    embedIndex,
                    update: vi.fn(),
                    keepAlive: async () => true,
                    sleep: async () => undefined,
                }
            );

            expect(stats).toMatchObject({ embedded: 0, alreadyCurrent: 2 });
            expect(embedIndex).not.toHaveBeenCalled();
        });

        it('dry run counts work without calling Bedrock or writing', async () => {
            const helpers = await loadHelpers();
            const embedIndex = vi.fn();
            const update = vi.fn();

            const stats = await helpers.runSkillEmbeddingBackfill(
                { dryRun: true },
                {
                    getCandidates: pages([
                        candidate(helpers, 'a', 'missing'),
                        candidate(helpers, 'b', 'stale'),
                    ]),
                    embedIndex,
                    update,
                    keepAlive: async () => true,
                    sleep: async () => undefined,
                }
            );

            expect(stats.embedded).toBe(2);
            expect(embedIndex).not.toHaveBeenCalled();
            expect(update).not.toHaveBeenCalled();
        });

        it('retries throttling with backoff, then stops with a resumable cursor', async () => {
            const helpers = await loadHelpers();
            const throttled = new helpers.SkillEmbeddingError('throttled', 429);
            const embedIndex = vi
                .fn()
                .mockResolvedValueOnce(unitVector(4))
                .mockRejectedValue(throttled);
            const sleep = vi.fn(async () => undefined);

            const stats = await helpers.runSkillEmbeddingBackfill(
                { maxRetries: 2 },
                {
                    getCandidates: pages([
                        candidate(helpers, 'a', 'missing'),
                        candidate(helpers, 'b', 'missing'),
                    ]),
                    embedIndex,
                    update: vi.fn(async () => true),
                    keepAlive: async () => true,
                    sleep,
                    // Silence expected error output.
                }
            );

            expect(stats).toMatchObject({ embedded: 1, stoppedReason: 'throttled', cursor: 'a' });
            expect(sleep).toHaveBeenCalledTimes(2);
            expect(embedIndex).toHaveBeenCalledTimes(4);
        });

        it('skips a skill Bedrock rejects as invalid and continues', async () => {
            const helpers = await loadHelpers();
            const embedIndex = vi
                .fn()
                .mockRejectedValueOnce(new helpers.SkillEmbeddingError('invalid_input', 400))
                .mockResolvedValue(unitVector(5));
            const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

            const stats = await helpers.runSkillEmbeddingBackfill(
                { log },
                {
                    getCandidates: pages([
                        candidate(helpers, 'a', 'missing'),
                        candidate(helpers, 'b', 'missing'),
                    ]),
                    embedIndex,
                    update: vi.fn(async () => true),
                    keepAlive: async () => true,
                    sleep: async () => undefined,
                }
            );

            expect(stats).toMatchObject({ embedded: 1, failed: 1, cursor: 'b' });
            expect(log.warn).toHaveBeenCalledWith('Skill embedding skipped for a: invalid_input');
        });

        it('stops when the distributed lock is lost', async () => {
            const helpers = await loadHelpers();
            const getCandidates = pages([candidate(helpers, 'a', 'missing')]);

            const stats = await helpers.runSkillEmbeddingBackfill(
                {},
                {
                    getCandidates,
                    embedIndex: vi.fn(),
                    update: vi.fn(),
                    keepAlive: async () => false,
                    sleep: async () => undefined,
                }
            );

            expect(stats.stoppedReason).toBe('lock_lost');
            expect(getCandidates).not.toHaveBeenCalled();
        });

        it('resumes from a cursor and honours maxEmbeddings', async () => {
            const helpers = await loadHelpers();
            const getCandidates = pages([
                candidate(helpers, 'c', 'missing'),
                candidate(helpers, 'd', 'missing'),
            ]);

            const stats = await helpers.runSkillEmbeddingBackfill(
                { cursor: 'b', maxEmbeddings: 1 },
                {
                    getCandidates,
                    embedIndex: vi.fn(async () => unitVector(6)),
                    update: vi.fn(async () => true),
                    keepAlive: async () => true,
                    sleep: async () => undefined,
                }
            );

            expect(getCandidates.mock.calls[0]![2]).toBe('b');
            expect(stats).toMatchObject({
                embedded: 1,
                stoppedReason: 'max_embeddings',
                cursor: 'c',
            });
        });
    });

    describe('backfill lock', () => {
        const fakeRedis = () => {
            const data = new Map<string, string>();
            return {
                data,
                set: vi.fn(
                    async (key: string, value: string, _ex: string, _ttl: number, nx: string) => {
                        if (nx === 'NX' && data.has(key)) return null;
                        data.set(key, value);
                        return 'OK';
                    }
                ),
                eval: vi.fn(async (script: string, _n: number, key: string, token: string) => {
                    if (data.get(key) !== token) return 0;
                    if (script.includes('DEL')) data.delete(key);
                    return 1;
                }),
            };
        };

        it('allows one holder per generation and only the holder can renew or release', async () => {
            const helpers = await loadHelpers();
            const redis = fakeRedis();

            const first = await helpers.acquireSkillEmbeddingBackfillLock(redis);
            const second = await helpers.acquireSkillEmbeddingBackfillLock(redis);

            expect(first).not.toBeNull();
            expect(second).toBeNull();
            expect([...redis.data.keys()]).toEqual([
                'skill-embeddings:backfill:lock:embedding_nova2_v1_0_d1024',
            ]);
            expect(await first!.keepAlive()).toBe(true);

            // Simulate expiry and takeover by another process.
            redis.data.set('skill-embeddings:backfill:lock:embedding_nova2_v1_0_d1024', 'other');
            expect(await first!.keepAlive()).toBe(false);
            await first!.release();
            expect(
                redis.data.get('skill-embeddings:backfill:lock:embedding_nova2_v1_0_d1024')
            ).toBe('other');
        });
    });
});
