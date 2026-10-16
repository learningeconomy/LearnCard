import { environment } from '@environment';
import { z } from 'zod';
import { createHash, randomUUID } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import cache from '@cache';

import { getSkillEmbeddingCandidates } from '@accesslayer/skill/read';
import type { SkillEmbeddingCandidate } from '@accesslayer/skill/read';
import { updateLegacySkillEmbedding, updateSkillEmbedding } from '@accesslayer/skill/update';
import type { SkillEmbeddingUpdate } from '@accesslayer/skill/update';

import {
    LEGACY_GOOGLE_SKILL_EMBEDDING_DIMENSION,
    LEGACY_GOOGLE_SKILL_EMBEDDING_MODEL,
    LEGACY_GOOGLE_SKILL_EMBEDDING_SEARCH_INDEX,
    NOVA2_MAX_TEXT_CHARS,
    SKILL_EMBEDDING_SCHEME_VERSION,
    resolveSkillEmbeddingGeneration,
    toSkillEmbeddingSearchIndex,
} from '../config/skillEmbedding';
import type { SkillEmbeddingGeneration, SkillEmbeddingSearchIndex } from '../config/skillEmbedding';
import {
    SkillEmbeddingError,
    createDefaultBedrockInvoke,
    embedTextWithBedrock,
    isSkillEmbeddingError,
} from './bedrock-embedding.helpers';
import type {
    BedrockEmbeddingConfig,
    BedrockInvoke,
    EmbeddingPurpose,
} from './bedrock-embedding.helpers';

export { SkillEmbeddingError, isSkillEmbeddingError };

export type SkillEmbeddingTarget = {
    id: string;
    frameworkId?: string;
    statement: string;
    description?: string | null;
    code?: string | null;
};

export type UpdateSkillEmbeddingFn = (update: SkillEmbeddingUpdate) => Promise<boolean>;

/** Writes the legacy Google `s.embedding` vector (main's pre-LC-2206 signature). */
export type UpdateLegacySkillEmbeddingFn = (
    skillId: string,
    embedding: number[],
    frameworkId?: string
) => Promise<boolean>;

// ---------------------------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------------------------

let cachedGeneration: SkillEmbeddingGeneration | undefined;

/** The (model, dimension, scheme) generation this process reads and writes. */
export const getSkillEmbeddingGeneration = (): SkillEmbeddingGeneration => {
    cachedGeneration ??= resolveSkillEmbeddingGeneration({
        modelId: environment.SKILL_EMBEDDING_BEDROCK_MODEL_ID,
        dimension: environment.SKILL_EMBEDDING_DIMENSION,
        region: environment.SKILL_EMBEDDING_BEDROCK_REGION,
    });

    return cachedGeneration;
};

/** Nova writes (new/updated skills, seed, backfill). Independent of the read flag. */
export const isSkillEmbeddingEnabled = (): boolean => environment.SKILL_EMBEDDING_BEDROCK_ENABLED;

/**
 * LC-2206 read switch. Off (default): semantic search queries the legacy Google 768-d index
 * with Google query embeddings, exactly as before LC-2206. On: it queries the Nova index with
 * Nova TEXT_RETRIEVAL query embeddings. Flipping it back off is the rollback.
 */
export const isSkillEmbeddingNovaReadEnabled = (): boolean =>
    environment.SKILL_EMBEDDING_BEDROCK_READ_ENABLED;

/** The vector index semantic search queries in this process. */
export const getSkillEmbeddingSearchIndex = (): SkillEmbeddingSearchIndex =>
    isSkillEmbeddingNovaReadEnabled()
        ? toSkillEmbeddingSearchIndex(getSkillEmbeddingGeneration())
        : LEGACY_GOOGLE_SKILL_EMBEDDING_SEARCH_INDEX;

/** Legacy Google writes and legacy reads run only while the Google key is configured (as on main). */
export const isLegacySkillEmbeddingEnabled = (): boolean =>
    Boolean(environment.SKILL_EMBEDDING_GOOGLE_API_KEY);

const getLegacyGoogleModel = (): string =>
    environment.SKILL_EMBEDDING_GOOGLE_MODEL ?? LEGACY_GOOGLE_SKILL_EMBEDDING_MODEL;

const getBedrockConfig = (): BedrockEmbeddingConfig => {
    const generation = getSkillEmbeddingGeneration();

    return {
        modelId: generation.modelId,
        region: generation.region,
        dimension: generation.dimension,
        timeoutMs: environment.SKILL_EMBEDDING_BEDROCK_TIMEOUT_MS,
    };
};

let invokeOverride: BedrockInvoke | undefined;

/** Unit tests inject a fake InvokeModel transport; production always uses the SDK client. */
export const setSkillEmbeddingInvokeForTests = (invoke: BedrockInvoke | undefined): void => {
    invokeOverride = invoke;
};

// ---------------------------------------------------------------------------------------------
// Legacy Google gemini-embedding-001 (768-d): kept only for the LC-2206 transition
// ---------------------------------------------------------------------------------------------

export type LegacyGoogleEmbed = (texts: string[]) => Promise<number[][]>;

let legacyEmbedOverride: LegacyGoogleEmbed | undefined;

/** Unit tests inject a fake Google transport; production always uses @google/genai. */
export const setLegacySkillEmbeddingForTests = (
    embedTexts: LegacyGoogleEmbed | undefined
): void => {
    legacyEmbedOverride = embedTexts;
};

const legacyEmbeddingsResponseValidator = z.array(z.object({ values: z.array(z.number()) }));

let googleClient: GoogleGenAI | undefined;

/** Same request main sends: gemini-embedding-001, no task type, 768 output dimensions. */
const embedWithLegacyGoogle: LegacyGoogleEmbed = async texts => {
    if (!isLegacySkillEmbeddingEnabled()) throw new SkillEmbeddingError('disabled');
    if (texts.length === 0) return [];
    if (legacyEmbedOverride) return legacyEmbedOverride(texts);

    googleClient ??= new GoogleGenAI({ apiKey: environment.SKILL_EMBEDDING_GOOGLE_API_KEY });

    const response = await googleClient.models.embedContent({
        model: getLegacyGoogleModel(),
        contents: texts,
        config: { outputDimensionality: LEGACY_GOOGLE_SKILL_EMBEDDING_DIMENSION },
    });

    const parsed = await legacyEmbeddingsResponseValidator.parseAsync(response.embeddings);
    return parsed.map(embedding => embedding.values);
};

const embed = async (text: string, purpose: EmbeddingPurpose): Promise<number[]> => {
    if (!isSkillEmbeddingEnabled()) throw new SkillEmbeddingError('disabled');

    const config = getBedrockConfig();
    return embedTextWithBedrock(
        text,
        purpose,
        config,
        invokeOverride ?? createDefaultBedrockInvoke(config)
    );
};

// ---------------------------------------------------------------------------------------------
// Text and keys
// ---------------------------------------------------------------------------------------------

/** Text embedded for a stored skill: statement and description, clipped to Nova's limit. */
export const buildSkillEmbeddingText = (skill: SkillEmbeddingTarget): string => {
    const parts = [skill.statement, skill.description]
        .map(part => (typeof part === 'string' ? part.trim() : ''))
        .filter(Boolean);

    return parts.join('\n').slice(0, NOVA2_MAX_TEXT_CHARS).trim();
};

/** Main's legacy text (no Nova clipping), so legacy vectors match what main writes. */
export const buildLegacySkillEmbeddingText = (skill: SkillEmbeddingTarget): string =>
    [skill.statement, skill.description]
        .map(part => (typeof part === 'string' ? part.trim() : ''))
        .filter(Boolean)
        .join('\n');

/** Stored with each vector; equal keys mean "already embedded with this generation and text". */
export const computeSkillEmbeddingKey = (
    generation: SkillEmbeddingGeneration,
    text: string
): string => createHash('sha256').update(`${generation.identity}\n${text}`).digest('hex');

export const skillNeedsEmbedding = (
    candidate: SkillEmbeddingCandidate,
    generation: SkillEmbeddingGeneration
): boolean => {
    const text = buildSkillEmbeddingText(candidate);
    if (!text) return false;

    return (
        !candidate.hasEmbedding ||
        candidate.embeddingKey !== computeSkillEmbeddingKey(generation, text)
    );
};

// ---------------------------------------------------------------------------------------------
// Query embeddings with a model/dimension-scoped Redis cache, routed by the read flag
// ---------------------------------------------------------------------------------------------

const getEmbeddingCacheTtlSeconds = (): number => {
    const raw = Number(environment.SKILL_EMBEDDING_CACHE_TTL_SECONDS ?? 60 * 60 * 24);
    return Math.min(Math.max(raw, 60), 60 * 60 * 24 * 7);
};

const digestQueryText = (text: string): string =>
    createHash('sha256').update(text.trim()).digest('hex');

/**
 * Nova query cache key. The model ID, dimension and scheme are part of the key, so it can
 * never collide with the legacy Google key below (or a future Nova generation's).
 */
export const getQueryEmbeddingCacheKey = (text: string): string => {
    const generation = getSkillEmbeddingGeneration();

    return `skill-embedding:query:${generation.modelId}:${generation.dimension}:${SKILL_EMBEDDING_SCHEME_VERSION}:${digestQueryText(text)}`;
};

/**
 * Legacy Google query cache key, byte-for-byte main's format, so entries main already cached
 * (same model, same 768-d vectors) stay valid. Cached vectors are also length-checked on read.
 */
export const getLegacyQueryEmbeddingCacheKey = (text: string): string =>
    `skill-embedding:query:${getLegacyGoogleModel()}:${digestQueryText(text)}`;

type QueryEmbeddingRoute = {
    index: SkillEmbeddingSearchIndex;
    cacheKey: (text: string) => string;
    embed: (text: string) => Promise<number[]>;
};

const embedLegacyQuery = async (text: string): Promise<number[]> => {
    const [embedding] = await embedWithLegacyGoogle([text]);
    if (!embedding) throw new SkillEmbeddingError('invalid_response');
    return embedding;
};

const getQueryEmbeddingRoute = (): QueryEmbeddingRoute => {
    const index = getSkillEmbeddingSearchIndex();

    return index.source === 'nova'
        ? { index, cacheKey: getQueryEmbeddingCacheKey, embed: text => embed(text, 'query') }
        : { index, cacheKey: getLegacyQueryEmbeddingCacheKey, embed: embedLegacyQuery };
};

/** Cache key semantic search uses for `text` under the current read flag. */
export const getSearchQueryEmbeddingCacheKey = (text: string): string =>
    getQueryEmbeddingRoute().cacheKey(text);

const cachedEmbeddingValidator = z.object({ values: z.array(z.number()) });

export const getCachedQueryEmbedding = async (text: string): Promise<number[] | null> => {
    const normalizedText = text.trim();
    if (!normalizedText) return null;

    try {
        const route = getQueryEmbeddingRoute();
        const cached = await cache.get(route.cacheKey(normalizedText));
        if (!cached) return null;

        const parsed = cachedEmbeddingValidator.parse(JSON.parse(cached));
        // Belt and braces: never return a vector of the wrong size to the vector index.
        if (parsed.values.length !== route.index.dimension) return null;

        return parsed.values;
    } catch (error) {
        console.warn('Failed to read cached skill embedding', describeEmbeddingError(error));
        return null;
    }
};

/**
 * Query embedding for semantic search: Nova TEXT_RETRIEVAL when the read flag is on, otherwise
 * Google gemini-embedding-001 (768-d) as on main. Pair it with getSkillEmbeddingSearchIndex().
 */
export const generateQueryEmbedding = async (text: string): Promise<number[]> => {
    const normalizedText = text.trim();
    if (!normalizedText) return [];

    const cached = await getCachedQueryEmbedding(normalizedText);
    if (cached) return cached;

    const route = getQueryEmbeddingRoute();
    const embedding = await route.embed(normalizedText);

    try {
        await cache.set(
            route.cacheKey(normalizedText),
            JSON.stringify({ values: embedding }),
            getEmbeddingCacheTtlSeconds()
        );
    } catch (error) {
        console.warn('Failed to cache skill embedding', describeEmbeddingError(error));
    }

    return embedding;
};

// ---------------------------------------------------------------------------------------------
// Index embeddings (GENERIC_INDEX) for stored skills
// ---------------------------------------------------------------------------------------------

const getEmbeddingBatchSize = (): number => {
    const raw = Number(
        environment.SKILL_EMBEDDING_BATCH_SIZE ??
            environment.SKILL_EMBEDDING_BACKFILL_BATCH_SIZE ??
            25
    );
    return Math.min(Math.max(raw, 1), 100);
};

/** Run `worker` over `items` with at most `limit` in flight, preserving order. */
const mapWithConcurrency = async <T, R>(
    items: T[],
    limit: number,
    worker: (item: T) => Promise<R>
): Promise<R[]> => {
    const results = new Array<R>(items.length);
    let next = 0;

    const run = async () => {
        while (next < items.length) {
            const index = next;
            next += 1;
            results[index] = await worker(items[index] as T);
        }
    };

    await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, run));
    return results;
};

/** Nova 2 synchronous InvokeModel embeds one text per call; batching is client-side only. */
export const generateIndexEmbeddings = async (texts: string[]): Promise<number[][]> =>
    mapWithConcurrency(texts, environment.SKILL_EMBEDDING_CONCURRENCY, text =>
        embed(text, 'index')
    );

const defaultUpdateSkillEmbedding: UpdateSkillEmbeddingFn = update => updateSkillEmbedding(update);

const defaultUpdateLegacySkillEmbedding: UpdateLegacySkillEmbeddingFn = (
    skillId,
    embedding,
    frameworkId
) => updateLegacySkillEmbedding(skillId, embedding, frameworkId);

/**
 * Embed and store skills with the current Nova generation. Runs whenever Nova embeddings are
 * enabled, regardless of the read flag, so skills created during the backfill window already
 * have Nova vectors. No-op while disabled, so skill CRUD keeps working locally without AWS.
 */
export const upsertNovaSkillEmbeddings = async (
    skills: SkillEmbeddingTarget[],
    updateSkillEmbeddingFn: UpdateSkillEmbeddingFn = defaultUpdateSkillEmbedding
): Promise<void> => {
    if (!isSkillEmbeddingEnabled()) return;

    const generation = getSkillEmbeddingGeneration();
    const candidates = skills
        .map(skill => ({ skill, text: buildSkillEmbeddingText(skill) }))
        .filter(item => Boolean(item.text));

    if (candidates.length === 0) return;

    const batchSize = getEmbeddingBatchSize();

    for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);
        const embeddings = await generateIndexEmbeddings(batch.map(item => item.text));

        for (let j = 0; j < batch.length; j += 1) {
            const item = batch[j];
            const embedding = embeddings[j];
            if (!item || !embedding) continue;

            await updateSkillEmbeddingFn({
                skillId: item.skill.id,
                frameworkId: item.skill.frameworkId,
                embedding,
                embeddingKey: computeSkillEmbeddingKey(generation, item.text),
                generation,
            });
        }
    }
};

/**
 * Keep the legacy Google `s.embedding` current exactly as main does (batched embedContent,
 * 768-d), while semantic search can still read it. No-op without a Google key, as on main.
 */
export const upsertLegacySkillEmbeddings = async (
    skills: SkillEmbeddingTarget[],
    updateLegacySkillEmbeddingFn: UpdateLegacySkillEmbeddingFn = defaultUpdateLegacySkillEmbedding
): Promise<void> => {
    if (!isLegacySkillEmbeddingEnabled()) return;

    const candidates = skills
        .map(skill => ({ skill, text: buildLegacySkillEmbeddingText(skill) }))
        .filter(item => Boolean(item.text));

    if (candidates.length === 0) return;

    const batchSize = getEmbeddingBatchSize();

    for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);
        const embeddings = await embedWithLegacyGoogle(batch.map(item => item.text));

        for (let j = 0; j < batch.length; j += 1) {
            const item = batch[j];
            const embedding = embeddings[j];
            if (!item || !embedding) continue;

            await updateLegacySkillEmbeddingFn(item.skill.id, embedding, item.skill.frameworkId);
        }
    }
};

/**
 * Skill create/update/sync write path: Nova and legacy Google writes run independently of
 * each other and of the read flag. A failure in one never skips the other; the first error
 * is rethrown afterwards so callers still log it.
 */
export const upsertSkillEmbeddings = async (
    skills: SkillEmbeddingTarget[],
    updateSkillEmbeddingFn: UpdateSkillEmbeddingFn = defaultUpdateSkillEmbedding,
    updateLegacySkillEmbeddingFn: UpdateLegacySkillEmbeddingFn = defaultUpdateLegacySkillEmbedding
): Promise<void> => {
    const results = await Promise.allSettled([
        upsertNovaSkillEmbeddings(skills, updateSkillEmbeddingFn),
        upsertLegacySkillEmbeddings(skills, updateLegacySkillEmbeddingFn),
    ]);

    const failure = results.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected'
    );
    if (failure) throw failure.reason;
};

export const upsertSkillEmbedding = async (
    skill: SkillEmbeddingTarget,
    updateSkillEmbeddingFn: UpdateSkillEmbeddingFn = defaultUpdateSkillEmbedding,
    updateLegacySkillEmbeddingFn: UpdateLegacySkillEmbeddingFn = defaultUpdateLegacySkillEmbedding
): Promise<void> =>
    upsertSkillEmbeddings([skill], updateSkillEmbeddingFn, updateLegacySkillEmbeddingFn);

/** Log-safe description: our sanitised code, never a provider message or input text. */
export const describeEmbeddingError = (error: unknown): string => {
    if (isSkillEmbeddingError(error)) return error.message;
    if (error instanceof Error) return error.name;
    return 'Unknown error';
};

// ---------------------------------------------------------------------------------------------
// Backfill: idempotent, resumable, lock-protected re-embedding of every skill
// ---------------------------------------------------------------------------------------------

export type SkillEmbeddingBackfillStats = {
    scanned: number;
    alreadyCurrent: number;
    embedded: number;
    failed: number;
    /** Set when the run stopped early (lock lost, throttled past retries, access denied, ...). */
    stoppedReason?: string;
    /** Resume point (last fully processed skill id) when the run stopped early. */
    cursor: string | null;
};

export type SkillEmbeddingBackfillDeps = {
    getCandidates: typeof getSkillEmbeddingCandidates;
    embedIndex: (text: string) => Promise<number[]>;
    update: UpdateSkillEmbeddingFn;
    /** Returns false when the distributed lock has been lost; the run then stops. */
    keepAlive: () => Promise<boolean>;
    sleep: (ms: number) => Promise<void>;
};

export type SkillEmbeddingBackfillOptions = {
    pageSize?: number;
    /** Count work only; never calls Bedrock or writes. */
    dryRun?: boolean;
    /** Stop after embedding this many skills (bounded runs). */
    maxEmbeddings?: number;
    /** Resume after this skill id. */
    cursor?: string | null;
    maxRetries?: number;
    log?: Pick<Console, 'info' | 'warn' | 'error'>;
};

const defaultBackfillDeps = (): SkillEmbeddingBackfillDeps => ({
    getCandidates: getSkillEmbeddingCandidates,
    embedIndex: text => embed(text, 'index'),
    update: defaultUpdateSkillEmbedding,
    keepAlive: async () => true,
    sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
});

export const runSkillEmbeddingBackfill = async (
    options: SkillEmbeddingBackfillOptions = {},
    overrides: Partial<SkillEmbeddingBackfillDeps> = {}
): Promise<SkillEmbeddingBackfillStats> => {
    const deps: SkillEmbeddingBackfillDeps = { ...defaultBackfillDeps(), ...overrides };
    const generation = getSkillEmbeddingGeneration();
    const pageSize = Math.min(Math.max(options.pageSize ?? 100, 1), 500);
    const maxRetries = Math.max(options.maxRetries ?? 5, 0);
    const log = options.log ?? console;
    const stats: SkillEmbeddingBackfillStats = {
        scanned: 0,
        alreadyCurrent: 0,
        embedded: 0,
        failed: 0,
        cursor: options.cursor ?? null,
    };

    let cursor: string | null = options.cursor ?? null;

    const stop = (reason: string) => {
        stats.stoppedReason = reason;
        return stats;
    };

    while (true) {
        if (!(await deps.keepAlive())) return stop('lock_lost');

        const page = await deps.getCandidates(generation, pageSize, cursor);
        if (page.records.length === 0) break;

        for (const candidate of page.records) {
            stats.scanned += 1;

            if (!skillNeedsEmbedding(candidate, generation)) {
                stats.alreadyCurrent += 1;
                stats.cursor = candidate.id;
                continue;
            }

            if (options.maxEmbeddings !== undefined && stats.embedded >= options.maxEmbeddings) {
                return stop('max_embeddings');
            }

            if (options.dryRun) {
                stats.embedded += 1;
                stats.cursor = candidate.id;
                continue;
            }

            const text = buildSkillEmbeddingText(candidate);
            let attempt = 0;

            while (true) {
                try {
                    const embedding = await deps.embedIndex(text);
                    await deps.update({
                        skillId: candidate.id,
                        frameworkId: candidate.frameworkId,
                        embedding,
                        embeddingKey: computeSkillEmbeddingKey(generation, text),
                        generation,
                    });
                    stats.embedded += 1;
                    break;
                } catch (error) {
                    const code = isSkillEmbeddingError(error) ? error.code : 'failed';

                    if (isSkillEmbeddingError(error) && error.retryable && attempt < maxRetries) {
                        attempt += 1;
                        // Exponential backoff with jitter, capped at 30s.
                        const delay =
                            Math.min(30_000, 500 * 2 ** attempt) * (0.5 + Math.random() / 2);
                        await deps.sleep(delay);
                        continue;
                    }

                    if (code === 'invalid_input' || code === 'invalid_response') {
                        // Skill-specific; skip it and keep going. The next run retries it.
                        stats.failed += 1;
                        log.warn(`Skill embedding skipped for ${candidate.id}: ${code}`);
                        break;
                    }

                    // Systemic (disabled, access denied, throttled past retries, ...): stop and
                    // leave the cursor at the last processed skill so a rerun resumes here.
                    log.error(`Skill embedding backfill stopped: ${describeEmbeddingError(error)}`);
                    return stop(code);
                }
            }

            stats.cursor = candidate.id;
        }

        if (!page.cursor) break;
        cursor = page.cursor;
    }

    return stats;
};

const SKILL_EMBEDDING_BACKFILL_LOCK_PREFIX = 'skill-embeddings:backfill:lock';

const getBackfillLockKey = (): string =>
    `${SKILL_EMBEDDING_BACKFILL_LOCK_PREFIX}:${getSkillEmbeddingGeneration().vectorProperty}`;

const getBackfillLockTtlSeconds = (): number => {
    const raw = Number(environment.SKILL_EMBEDDING_BACKFILL_LOCK_TTL_SECONDS ?? 900);
    return Math.min(Math.max(raw, 60), 60 * 60 * 24);
};

type LockRedis = {
    set: (key: string, value: string, mode: 'EX', ttlSeconds: number, nx: 'NX') => Promise<unknown>;
    eval: (script: string, numKeys: number, ...args: string[]) => Promise<unknown>;
};

const getLockRedis = (): LockRedis => (cache.redis ?? cache.node) as unknown as LockRedis;

const RENEW_IF_OWNER =
    'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("EXPIRE", KEYS[1], ARGV[2]) end return 0';
const RELEASE_IF_OWNER =
    'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) end return 0';

/** Token lease: only the holder can renew or release it, and it expires if the holder dies. */
export const acquireSkillEmbeddingBackfillLock = async (
    redis: LockRedis = getLockRedis()
): Promise<{ keepAlive: () => Promise<boolean>; release: () => Promise<void> } | null> => {
    const key = getBackfillLockKey();
    const token = randomUUID();
    const ttl = getBackfillLockTtlSeconds();

    try {
        if ((await redis.set(key, token, 'EX', ttl, 'NX')) !== 'OK') return null;
    } catch (error) {
        console.error(
            'Unable to acquire skill embedding backfill lock',
            describeEmbeddingError(error)
        );
        return null;
    }

    return {
        keepAlive: async () => {
            try {
                return Number(await redis.eval(RENEW_IF_OWNER, 1, key, token, String(ttl))) === 1;
            } catch {
                return false;
            }
        },
        release: async () => {
            try {
                await redis.eval(RELEASE_IF_OWNER, 1, key, token);
            } catch {
                // Expires on its own.
            }
        },
    };
};

let backfillStarted = false;

/**
 * Startup backfill behind SKILL_EMBEDDING_BACKFILL_ON_STARTUP. One process at a time holds the
 * lock (renewed per page); every run skips skills already embedded with the current
 * generation, so restarts and concurrent deploys resume instead of re-paying for work.
 */
export const startSkillEmbeddingBackfill = async (): Promise<
    SkillEmbeddingBackfillStats | undefined
> => {
    if (backfillStarted) return undefined;
    if (!environment.SKILL_EMBEDDING_BACKFILL_ON_STARTUP) return undefined;
    if (!isSkillEmbeddingEnabled()) return undefined;

    const lock = await acquireSkillEmbeddingBackfillLock();
    if (!lock) return undefined;

    backfillStarted = true;
    const generation = getSkillEmbeddingGeneration();
    console.info(`Starting skill embedding backfill (${generation.identity})`);

    try {
        const stats = await runSkillEmbeddingBackfill(
            { pageSize: Number(environment.SKILL_EMBEDDING_BACKFILL_PAGE_SIZE ?? 100) },
            { keepAlive: lock.keepAlive }
        );

        console.info('Skill embedding backfill finished', stats);
        if (stats.stoppedReason) backfillStarted = false;
        return stats;
    } catch (error) {
        backfillStarted = false;
        console.error('Skill embedding backfill failed', describeEmbeddingError(error));
        return undefined;
    } finally {
        await lock.release();
    }
};
