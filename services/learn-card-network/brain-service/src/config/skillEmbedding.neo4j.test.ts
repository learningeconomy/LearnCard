/**
 * LC-2206 opt-in check of the skill-embedding compare-and-set against a REAL, LOCAL Neo4j 5.
 * Skipped unless SKILL_EMBEDDING_TEST_NEO4J_URI points at localhost; it clears every node in
 * that database, so it refuses any other host. Never point it at staging or production.
 *
 *   SKILL_EMBEDDING_TEST_NEO4J_URI=bolt://127.0.0.1:7687 \
 *     bunx vitest run --config vitest.config.ts src/config/skillEmbedding.neo4j.test.ts
 *
 * Unauthenticated local instances work as-is; set SKILL_EMBEDDING_TEST_NEO4J_PASSWORD otherwise.
 */
import neo4j, { type Driver } from 'neo4j-driver';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildSkillEmbeddingUpdateQuery, resolveSkillEmbeddingGeneration } from './skillEmbedding';

const uri = process.env.SKILL_EMBEDDING_TEST_NEO4J_URI;
const isLocal = Boolean(uri && /^(bolt|neo4j):\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(uri));

const generation = resolveSkillEmbeddingGeneration({
    modelId: 'amazon.nova-2-multimodal-embeddings-v1:0',
    dimension: 1024,
    region: 'us-east-1',
});
const VECTOR = generation.vectorProperty;
const KEY = generation.keyProperty;

const vectorOf = (seed: number) => Array.from({ length: 4 }, (_, i) => seed + i / 10);

/** Same parameters updateSkillEmbedding sends. */
const writeParams = (key: string, statement: string, description: string | null) => ({
    frameworkId: 'fw',
    skillId: 's1',
    embedding: vectorOf(key === 'old-key' ? 1 : 2),
    embeddingKey: key,
    sourceStatement: statement,
    sourceDescription: description ?? '',
});

describe.skipIf(!isLocal)('skill embedding compare-and-set (local Neo4j)', () => {
    let driver: Driver;

    const run = async (query: string, params: Record<string, unknown> = {}) => {
        const session = driver.session();
        try {
            return await session.run(query, params);
        } finally {
            await session.close();
        }
    };

    const readSkill = async () => {
        const result = await run(
            `MATCH (s:Skill {id: 's1'}) RETURN s.statement AS statement, s.${KEY} AS key, s.${VECTOR} AS vector`
        );
        return result.records[0]!.toObject() as {
            statement: string;
            key: string | null;
            vector: number[] | null;
        };
    };

    const countOf = (result: Awaited<ReturnType<typeof run>>) =>
        Number(result.records[0]?.get('count') ?? 0);

    beforeAll(async () => {
        const password = process.env.SKILL_EMBEDDING_TEST_NEO4J_PASSWORD;
        driver = password
            ? neo4j.driver(uri!, neo4j.auth.basic('neo4j', password))
            : neo4j.driver(uri!);
        await driver.verifyConnectivity();
    });

    afterAll(async () => {
        await driver?.close();
    });

    beforeEach(async () => {
        await run('MATCH (n) DETACH DELETE n');
        await run(
            `CREATE (f:SkillFramework {id: 'fw'})-[:CONTAINS]->(:Skill {id: 's1', frameworkId: 'fw', statement: 'Old text'})`
        );
    });

    it('writes when the source is unchanged (null description compares as empty)', async () => {
        for (const scoped of [true, false]) {
            const result = await run(
                buildSkillEmbeddingUpdateQuery(generation, scoped),
                writeParams('new-key', 'Old text', null)
            );
            expect(countOf(result)).toBe(1);
        }

        expect(await readSkill()).toMatchObject({ key: 'new-key', vector: vectorOf(2) });
    });

    it('a delayed backfill write for old text cannot replace the newer live write', async () => {
        // Live path: the edit commits, then its own vector is stored.
        await run(`MATCH (s:Skill {id: 's1'}) SET s.statement = 'New text'`);
        await run(
            buildSkillEmbeddingUpdateQuery(generation, true),
            writeParams('new-key', 'New text', null)
        );

        // Backfill read "Old text" before the edit and finishes afterwards.
        const stale = await run(
            buildSkillEmbeddingUpdateQuery(generation, true),
            writeParams('old-key', 'Old text', null)
        );

        expect(countOf(stale)).toBe(0);
        expect(await readSkill()).toMatchObject({
            statement: 'New text',
            key: 'new-key',
            vector: vectorOf(2),
        });
    });

    it('waits for an in-flight skill update and then re-checks the source', async () => {
        // A skill update holds the node's write lock with new text, not yet committed.
        const editSession = driver.session();
        const edit = editSession.beginTransaction();
        await edit.run(`MATCH (s:Skill {id: 's1'}) SET s.statement = 'New text'`);

        // The backfill write for the old text starts while that update is open...
        const stale = run(
            buildSkillEmbeddingUpdateQuery(generation, true),
            writeParams('old-key', 'Old text', null)
        );
        await new Promise(resolve => setTimeout(resolve, 300));

        // ...and the update commits.
        await edit.commit();
        await editSession.close();

        expect(countOf(await stale)).toBe(0);
        expect(await readSkill()).toMatchObject({ statement: 'New text', key: null, vector: null });
    });
});
