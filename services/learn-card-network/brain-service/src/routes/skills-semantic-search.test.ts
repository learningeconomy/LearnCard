import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveTenantFromRequest } from '@learncard/email-templates';
import type { ProfileType } from 'types/profile';

/**
 * LC-2206: semantic search read routing behind SKILL_EMBEDDING_BEDROCK_READ_ENABLED, through
 * the real router and embedding helpers. Bedrock and Google are faked; nothing leaves the box.
 */

const mocks = vi.hoisted(() => ({
    store: new Map<string, string>(),
    getProfileByDid: vi.fn(),
    searchSkillsByEmbedding: vi.fn(),
}));

vi.mock('@cache', () => ({
    default: {
        get: vi.fn(async (key: string) => mocks.store.get(key)),
        set: vi.fn(async (key: string, value: string) => {
            mocks.store.set(key, value);
            return 'OK';
        }),
        incr: vi.fn(async () => 1),
        node: {},
    },
}));
vi.mock('@accesslayer/profile/read', () => ({ getProfileByDid: mocks.getProfileByDid }));
vi.mock('@accesslayer/skill/read', async importOriginal => ({
    ...(await importOriginal<typeof import('@accesslayer/skill/read')>()),
    searchSkillsByEmbedding: mocks.searchSkillsByEmbedding,
}));

import { environment } from '@environment';
import {
    setLegacySkillEmbeddingForTests,
    setSkillEmbeddingInvokeForTests,
} from '@helpers/skill-embedding.helpers';

import { type Context } from './index';
import { skillsRouter } from './skills';

const profile: ProfileType = {
    profileId: 'searcher',
    did: 'did:key:searcher',
    displayName: 'Searcher',
    shortBio: '',
    bio: '',
};

const context: Context = {
    domain: 'network.example.com',
    tenant: resolveTenantFromRequest({}),
    user: { did: profile.did, isChallengeValid: true, scope: '*:*' },
};

const vector = (dimension: number) =>
    Array.from({ length: dimension }, () => 1 / Math.sqrt(dimension));

const novaBody = (values: number[]) =>
    new TextEncoder().encode(
        JSON.stringify({ embeddings: [{ embeddingType: 'TEXT', embedding: values }] })
    );

const ORIGINAL = {
    SKILL_EMBEDDING_BEDROCK_ENABLED: environment.SKILL_EMBEDDING_BEDROCK_ENABLED,
    SKILL_EMBEDDING_BEDROCK_READ_ENABLED: environment.SKILL_EMBEDDING_BEDROCK_READ_ENABLED,
    SKILL_EMBEDDING_GOOGLE_API_KEY: environment.SKILL_EMBEDDING_GOOGLE_API_KEY,
};

describe('skills.semanticSearchSkills read routing (LC-2206)', () => {
    const invoke = vi.fn();
    const legacyEmbed = vi.fn();

    const search = (text = 'help customers with complaints') =>
        skillsRouter.createCaller(context).semanticSearchSkills({ text, limit: 5 });

    beforeEach(() => {
        mocks.store.clear();
        mocks.getProfileByDid.mockResolvedValue(profile);
        mocks.searchSkillsByEmbedding.mockReset().mockResolvedValue([]);
        invoke.mockReset().mockImplementation(async () => novaBody(vector(1024)));
        legacyEmbed
            .mockReset()
            .mockImplementation(async (texts: string[]) => texts.map(() => vector(768)));
        setSkillEmbeddingInvokeForTests(invoke as never);
        setLegacySkillEmbeddingForTests(legacyEmbed);

        // Deployed shape: Nova writes on, Google key present for the legacy read path.
        environment.SKILL_EMBEDDING_BEDROCK_ENABLED = true;
        environment.SKILL_EMBEDDING_GOOGLE_API_KEY = 'legacy-google-key';
    });

    afterEach(() => {
        setSkillEmbeddingInvokeForTests(undefined);
        setLegacySkillEmbeddingForTests(undefined);
        Object.assign(environment, ORIGINAL);
    });

    it('flag off (default): queries the legacy 768-d index with a Google query embedding', async () => {
        environment.SKILL_EMBEDDING_BEDROCK_READ_ENABLED = false;

        await search();

        expect(legacyEmbed).toHaveBeenCalledWith(['help customers with complaints']);
        expect(invoke).not.toHaveBeenCalled();
        const [embedding, limit, frameworkId, index] = mocks.searchSkillsByEmbedding.mock.calls[0]!;
        expect(embedding).toHaveLength(768);
        expect(limit).toBe(5);
        expect(frameworkId).toBeUndefined();
        expect(index).toEqual({
            source: 'legacy',
            indexName: 'skill_embedding_vector_idx',
            dimension: 768,
        });
    });

    it('flag on: queries the Nova 1024-d index with a TEXT_RETRIEVAL query embedding', async () => {
        environment.SKILL_EMBEDDING_BEDROCK_READ_ENABLED = true;

        await search();

        expect(legacyEmbed).not.toHaveBeenCalled();
        expect(invoke).toHaveBeenCalledTimes(1);
        const request = JSON.parse(invoke.mock.calls[0]![0].body);
        expect(request.singleEmbeddingParams.embeddingPurpose).toBe('TEXT_RETRIEVAL');
        const [embedding, , , index] = mocks.searchSkillsByEmbedding.mock.calls[0]!;
        expect(embedding).toHaveLength(1024);
        expect(index).toEqual({
            source: 'nova',
            indexName: 'skill_embedding_nova2_v1_0_d1024_idx',
            dimension: 1024,
        });
    });

    it('flipping the flag back off is the rollback: the same query goes back to legacy', async () => {
        environment.SKILL_EMBEDDING_BEDROCK_READ_ENABLED = true;
        await search();
        environment.SKILL_EMBEDDING_BEDROCK_READ_ENABLED = false;
        await search();

        const indexes = mocks.searchSkillsByEmbedding.mock.calls.map(call => call[3].indexName);
        expect(indexes).toEqual([
            'skill_embedding_nova2_v1_0_d1024_idx',
            'skill_embedding_vector_idx',
        ]);
        // The cached Nova vector was not reused for the legacy index (or vice versa).
        expect(mocks.searchSkillsByEmbedding.mock.calls[1]![0]).toHaveLength(768);
        expect(legacyEmbed).toHaveBeenCalledTimes(1);
        expect(invoke).toHaveBeenCalledTimes(1);
    });

    it('flag off keeps main behaviour for long text (no Nova 8,192-character limit)', async () => {
        environment.SKILL_EMBEDDING_BEDROCK_READ_ENABLED = false;
        await expect(search('x'.repeat(9000))).resolves.toMatchObject({ records: [] });

        environment.SKILL_EMBEDDING_BEDROCK_READ_ENABLED = true;
        await expect(search('x'.repeat(9000))).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('flag off without a Google key fails closed instead of querying Nova', async () => {
        environment.SKILL_EMBEDDING_BEDROCK_READ_ENABLED = false;
        environment.SKILL_EMBEDDING_GOOGLE_API_KEY = undefined;

        await expect(search()).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
        expect(invoke).not.toHaveBeenCalled();
        expect(mocks.searchSkillsByEmbedding).not.toHaveBeenCalled();
    });
});
