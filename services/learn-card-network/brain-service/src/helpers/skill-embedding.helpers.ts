import { z } from 'zod';
import { createHash } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import cache from '@cache';

import { getSkillsMissingEmbedding } from '@accesslayer/skill/read';
import { updateSkillEmbedding } from '@accesslayer/skill/update';

export type SkillEmbeddingTarget = {
    id: string;
    frameworkId?: string;
    statement: string;
    description?: string | null;
    code?: string | null;
};

export type UpdateSkillEmbeddingFn = (
    skillId: string,
    embedding: number[],
    frameworkId?: string
) => Promise<boolean>;

const googleApiKey = process.env.SKILL_EMBEDDING_GOOGLE_API_KEY;
const googleModel = process.env.SKILL_EMBEDDING_GOOGLE_MODEL ?? 'gemini-embedding-001';
const googleClient = googleApiKey ? new GoogleGenAI({ apiKey: googleApiKey }) : null;

const embeddingResponseValidator = z.object({
    values: z.array(z.number()),
});

const embeddingsResponseValidator = z.array(embeddingResponseValidator);

const getEmbeddingCacheTtlSeconds = (): number => {
    const raw = Number(process.env.SKILL_EMBEDDING_CACHE_TTL_SECONDS ?? 60 * 60 * 24);
    return Math.min(Math.max(raw, 60), 60 * 60 * 24 * 7);
};

const getEmbeddingCacheKey = (text: string): string => {
    const normalizedText = text.trim();
    const digest = createHash('sha256').update(normalizedText).digest('hex');

    return `skill-embedding:query:${googleModel}:${digest}`;
};

export const getCachedEmbeddingForText = async (text: string): Promise<number[] | null> => {
    const normalizedText = text.trim();
    if (!normalizedText) {
        return null;
    }

    try {
        const cachedEmbedding = await cache.get(getEmbeddingCacheKey(normalizedText));
        if (!cachedEmbedding) {
            return null;
        }

        const parsed = embeddingResponseValidator.parse(JSON.parse(cachedEmbedding));
        return parsed.values;
    } catch (error) {
        console.warn('Failed to read cached skill embedding', error);
        return null;
    }
};

const getEmbeddingBatchSize = (): number => {
    const raw = Number(
        process.env.SKILL_EMBEDDING_BATCH_SIZE ??
            process.env.SKILL_EMBEDDING_BACKFILL_BATCH_SIZE ??
            25
    );
    return Math.min(Math.max(raw, 1), 100);
};

export const generateEmbeddingsForTexts = async (texts: string[]): Promise<number[][]> => {
    if (!googleClient) throw new Error('SKILL_EMBEDDING_GOOGLE_API_KEY is not configured');
    if (texts.length === 0) return [];

    const normalizedTexts = texts.map(text => text.trim()).filter(Boolean);
    if (normalizedTexts.length === 0) return [];

    const response = await googleClient.models.embedContent({
        model: googleModel,
        contents: normalizedTexts,
        config: { outputDimensionality: 768 },
    });

    const parsed = await embeddingsResponseValidator.parseAsync(response.embeddings);
    return parsed.map(embedding => embedding.values);
};

export const buildSkillEmbeddingText = (skill: SkillEmbeddingTarget): string => {
    const parts = [skill.statement, skill.description]
        .map(part => (typeof part === 'string' ? part.trim() : ''))
        .filter(Boolean);

    return parts.join('\n');
};

export const generateEmbeddingForText = async (text: string): Promise<number[]> => {
    const normalizedText = text.trim();
    if (!normalizedText) {
        return [];
    }

    const cachedEmbedding = await getCachedEmbeddingForText(normalizedText);
    if (cachedEmbedding) {
        return cachedEmbedding;
    }

    const embeddings = await generateEmbeddingsForTexts([normalizedText]);
    const embedding = embeddings[0];
    if (!embedding) throw new Error('No embedding returned from Google API');

    try {
        const cacheKey = getEmbeddingCacheKey(normalizedText);
        await cache.set(
            cacheKey,
            JSON.stringify({ values: embedding }),
            getEmbeddingCacheTtlSeconds()
        );
    } catch (error) {
        console.warn('Failed to cache skill embedding', error);
    }

    return embedding;
};

export const upsertSkillEmbedding = async (
    skill: SkillEmbeddingTarget,
    updateSkillEmbeddingFn: UpdateSkillEmbeddingFn = updateSkillEmbedding
): Promise<void> => {
    const text = buildSkillEmbeddingText(skill);
    if (!text) return;

    const embedding = await generateEmbeddingForText(text);
    await updateSkillEmbeddingFn(skill.id, embedding, skill.frameworkId);
};

export const upsertSkillEmbeddings = async (
    skills: SkillEmbeddingTarget[],
    updateSkillEmbeddingFn: UpdateSkillEmbeddingFn = updateSkillEmbedding
): Promise<void> => {
    const candidates = skills
        .map(skill => ({ skill, text: buildSkillEmbeddingText(skill) }))
        .filter(item => Boolean(item.text));

    if (candidates.length === 0) return;

    const batchSize = getEmbeddingBatchSize();

    for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);
        const embeddings = await generateEmbeddingsForTexts(batch.map(item => item.text));

        for (let j = 0; j < batch.length; j += 1) {
            const item = batch[j];
            const embedding = embeddings[j];
            if (!item || !embedding) continue;

            await updateSkillEmbeddingFn(item.skill.id, embedding, item.skill.frameworkId);
        }
    }
};

let backfillStarted = false;

const SKILL_EMBEDDING_BACKFILL_LOCK_KEY = 'skill-embeddings:backfill:lock';

const getBackfillLockTtlSeconds = (): number => {
    const raw = Number(process.env.SKILL_EMBEDDING_BACKFILL_LOCK_TTL_SECONDS ?? 900);
    return Math.min(Math.max(raw, 60), 60 * 60 * 24);
};

const acquireBackfillLock = async (): Promise<boolean> => {
    try {
        const redis = cache.redis ?? cache.node;
        const lockTtlSeconds = getBackfillLockTtlSeconds();
        const result = await redis.set(
            SKILL_EMBEDDING_BACKFILL_LOCK_KEY,
            new Date().toISOString(),
            'EX',
            lockTtlSeconds,
            'NX'
        );

        return result === 'OK';
    } catch (error) {
        console.error('Unable to acquire skill embedding backfill lock', error);
        return false;
    }
};

export const startSkillEmbeddingBackfill = async (): Promise<void> => {
    if (backfillStarted) return;
    if (process.env.SKILL_EMBEDDING_BACKFILL_ON_STARTUP !== 'true') return;
    if (!googleApiKey) return;

    const lockAcquired = await acquireBackfillLock();
    if (!lockAcquired) return;

    console.info('Starting skill embedding backfill');

    const pageSize = Number(process.env.SKILL_EMBEDDING_BACKFILL_PAGE_SIZE ?? 100);

    try {
        let cursor: string | null = null;
        while (true) {
            const page = await getSkillsMissingEmbedding(pageSize, cursor);
            if (page.records.length === 0) break;

            await upsertSkillEmbeddings(
                page.records.map(skill => ({
                    id: skill.id,
                    frameworkId: skill.frameworkId,
                    statement: skill.statement,
                    description: skill.description ?? undefined,
                    code: skill.code ?? undefined,
                }))
            );

            if (!page.cursor) break;
            cursor = page.cursor;
        }

        backfillStarted = true;
        console.info('Completed skill embedding backfill');
    } catch (error) {
        console.error('Skill embedding backfill failed', error);
    }
};
