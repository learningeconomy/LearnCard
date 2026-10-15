import { environment } from '@environment';
import { z } from 'zod';
import { createHash, randomUUID } from 'crypto';
import cache from '@cache';

import { getSkillEmbeddingCandidates } from '@accesslayer/skill/read';
import type { SkillEmbeddingCandidate } from '@accesslayer/skill/read';
import { updateSkillEmbedding } from '@accesslayer/skill/update';
import type { SkillEmbeddingUpdate } from '@accesslayer/skill/update';

import {
    NOVA2_MAX_TEXT_CHARS,
    SKILL_EMBEDDING_SCHEME_VERSION,
    resolveSkillEmbeddingGeneration,
} from '../config/skillEmbedding';
import type { SkillEmbeddingGeneration } from '../config/skillEmbedding';
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

export const isSkillEmbeddingEnabled = (): boolean => environment.SKILL_EMBEDDING_BEDROCK_ENABLED;

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
// Query embeddings (TEXT_RETRIEVAL) with a model/dimension-scoped Redis cache
// ---------------------------------------------------------------------------------------------

const getEmbeddingCacheTtlSeconds = (): number => {
    const raw = Number(environment.SKILL_EMBEDDING_CACHE_TTL_SECONDS ?? 60 * 60 * 24);
    return Math.min(Math.max(raw, 60), 60 * 60 * 24 * 7);
};

/**
 * The model ID, dimension and scheme are part of the key, so vectors cached for the old
 * Google model (`skill-embedding:query:gemini-embedding-001:<digest>`) are never read back.
 */
export const getQueryEmbeddingCacheKey = (text: string): string => {
    const generation = getSkillEmbeddingGeneration();
    const digest = createHash('sha256').update(text.trim()).digest('hex');

    return `skill-embedding:query:${generation.modelId}:${generation.dimension}:${SKILL_EMBEDDING_SCHEME_VERSION}:${digest}`;
};

const cachedEmbeddingValidator = z.object({ values: z.array(z.number()) });

export const getCachedQueryEmbedding = async (text: string): Promise<number[] | null> => {
    const normalizedText = text.trim();
    if (!normalizedText) return null;

    try {
        const cached = await cache.get(getQueryEmbeddingCacheKey(normalizedText));
        if (!cached) return null;

        const parsed = cachedEmbeddingValidator.parse(JSON.parse(cached));
        // Belt and braces: never return a vector of the wrong size to the vector index.
        if (parsed.values.length !== getSkillEmbeddingGeneration().dimension) return null;

        return parsed.values;
    } catch (error) {
        console.warn('Failed to read cached skill embedding', describeEmbeddingError(error));
        return null;
    }
};

export const generateQueryEmbedding = async (text: string): Promise<number[]> => {
    const normalizedText = text.trim();
    if (!normalizedText) return [];

    const cached = await getCachedQueryEmbedding(normalizedText);
    if (cached) return cached;

    const embedding = await embed(normalizedText, 'query');

    try {
        await cache.set(
            getQueryEmbeddingCacheKey(normalizedText),
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

/**
 * Embed and store skills with the current generation. No-op while embeddings are disabled, so
 * skill CRUD keeps working locally without AWS credentials (the backfill fills gaps later).
 */
export const upsertSkillEmbeddings = async (
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

export const upsertSkillEmbedding = async (
    skill: SkillEmbeddingTarget,
    updateSkillEmbeddingFn: UpdateSkillEmbeddingFn = defaultUpdateSkillEmbedding
): Promise<void> => upsertSkillEmbeddings([skill], updateSkillEmbeddingFn);

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
