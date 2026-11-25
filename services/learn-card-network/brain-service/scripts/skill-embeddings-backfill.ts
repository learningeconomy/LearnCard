#!/usr/bin/env bun
/**
 * LC-2206 operator backfill: (re-)embed every Skill with the configured Nova 2 generation.
 *
 *   bun run skill-embeddings:backfill                      # dry run: counts only, no Bedrock calls
 *   bun run skill-embeddings:backfill --apply --target <neo4j-host> [--max N] [--page-size N] [--cursor <skillId>]
 *
 * - Dry run is the default and never calls Bedrock or writes to Neo4j.
 * - --apply requires SKILL_EMBEDDING_BEDROCK_ENABLED=true and --target equal to the host in
 *   NEO4J_URI, so a copied shell cannot silently write to the wrong database.
 * - Takes the same Redis lease as the startup backfill (one writer per generation).
 * - Idempotent and resumable: skills whose stored key matches sha256(identity + text) are
 *   skipped; on early stop it prints the cursor to resume from.
 *
 * Writes only the Nova property; the legacy Google `s.embedding` and the read flag
 * (SKILL_EMBEDDING_BEDROCK_READ_ENABLED) are untouched, so it is safe while search reads legacy.
 *
 * Uses the normal AWS credential chain (SigV4). Paid: each embedded skill is one InvokeModel.
 */
import { environment } from '@environment';
import {
    acquireSkillEmbeddingBackfillLock,
    buildSkillEmbeddingText,
    getSkillEmbeddingGeneration,
    isSkillEmbeddingEnabled,
    runSkillEmbeddingBackfill,
    skillNeedsEmbedding,
} from '@helpers/skill-embedding.helpers';
import { getSkillEmbeddingCandidates } from '@accesslayer/skill/read';
import { neogma } from '@instance';

// Public list price snapshot checked by AI Passport on 2026-10-13 (us-east-1, on-demand text).
const NOVA2_USD_PER_MILLION_INPUT_TOKENS = 0.135;
// Planning assumption only; Nova responses carry no token usage.
const ASSUMED_CHARS_PER_TOKEN = 4;

type Options = {
    apply: boolean;
    target?: string;
    max?: number;
    pageSize: number;
    cursor: string | null;
};

const parseArgs = (argv: string[]): Options => {
    const options: Options = { apply: false, pageSize: 100, cursor: null };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        const next = () => {
            const value = argv[i + 1];
            if (!value) throw new Error(`${arg} needs a value`);
            i += 1;
            return value;
        };

        if (arg === '--apply') options.apply = true;
        else if (arg === '--target') options.target = next();
        else if (arg === '--max') options.max = Number(next());
        else if (arg === '--page-size') options.pageSize = Number(next());
        else if (arg === '--cursor') options.cursor = next();
        else throw new Error(`Unknown argument ${arg}`);
    }

    return options;
};

const neo4jHost = (): string => {
    try {
        return new URL(environment.NEO4J_URI).hostname;
    } catch {
        return environment.NEO4J_URI;
    }
};

const estimate = async (pageSize: number) => {
    const generation = getSkillEmbeddingGeneration();
    let cursor: string | null = null;
    let total = 0;
    let needed = 0;
    let chars = 0;

    while (true) {
        const page = await getSkillEmbeddingCandidates(generation, pageSize, cursor);
        for (const candidate of page.records) {
            total += 1;
            if (skillNeedsEmbedding(candidate, generation)) {
                needed += 1;
                chars += buildSkillEmbeddingText(candidate).length;
            }
        }
        if (!page.cursor) break;
        cursor = page.cursor;
    }

    const tokens = Math.ceil(chars / ASSUMED_CHARS_PER_TOKEN);
    return {
        generation: generation.identity,
        vectorProperty: generation.vectorProperty,
        indexName: generation.indexName,
        totalSkills: total,
        needEmbedding: needed,
        textChars: chars,
        estimatedTokens: tokens,
        estimatedUsd: Number(
            ((tokens / 1_000_000) * NOVA2_USD_PER_MILLION_INPUT_TOKENS).toFixed(4)
        ),
        invokeModelCalls: needed,
    };
};

const main = async () => {
    const options = parseArgs(process.argv.slice(2));

    console.info(`Neo4j host: ${neo4jHost()}`);
    console.info('Dry-run estimate:', await estimate(options.pageSize));

    if (!options.apply) {
        console.info('Dry run only. Re-run with --apply --target <neo4j-host> to embed.');
        return;
    }

    if (!isSkillEmbeddingEnabled()) throw new Error('SKILL_EMBEDDING_BEDROCK_ENABLED must be true');
    if (options.target !== neo4jHost()) {
        throw new Error('--target must equal the NEO4J_URI host; refusing to write');
    }

    const lock = await acquireSkillEmbeddingBackfillLock();
    if (!lock) throw new Error('Another skill embedding backfill holds the lock');

    try {
        const stats = await runSkillEmbeddingBackfill(
            {
                pageSize: options.pageSize,
                maxEmbeddings: options.max,
                cursor: options.cursor,
            },
            { keepAlive: lock.keepAlive }
        );

        console.info('Backfill result:', stats);
        if (stats.stoppedReason) {
            console.info(
                `Stopped early (${stats.stoppedReason}). Resume with --cursor ${stats.cursor ?? ''}`
            );
            process.exitCode = 2;
        }
    } finally {
        await lock.release();
    }
};

main()
    .catch(error => {
        console.error(error instanceof Error ? error.message : 'Backfill failed');
        process.exitCode = 1;
    })
    .finally(async () => {
        await neogma.driver.close();
        process.exit();
    });
