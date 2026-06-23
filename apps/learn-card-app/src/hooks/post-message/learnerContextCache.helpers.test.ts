import { describe, expect, it, vi } from 'vitest';

import {
    LEARNER_CONTEXT_CACHE_TTL_MS,
    clearLearnerContextCacheForDid,
    getLearnerContextCacheKey,
    readLearnerContextCache,
    writeLearnerContextCache,
    type LearnerContextSourceData,
} from './learnerContextCache.helpers';

const source = (overrides: Partial<LearnerContextSourceData> = {}): LearnerContextSourceData => ({
    appId: 'app-a',
    did: 'did:example:learner-a',
    credentialUris: ['lc:credential:2', 'lc:credential:1'],
    personalData: { name: 'Taylor', role: 'Engineer' },
    ...overrides,
});

describe('learnerContextCache.helpers', () => {
    it('uses the same key for the same URI set in different order', () => {
        const first = getLearnerContextCacheKey(source(), { includePersonalData: true });
        const second = getLearnerContextCacheKey(
            source({ credentialUris: ['lc:credential:1', 'lc:credential:2'] }),
            { includePersonalData: true }
        );

        expect(second).toBe(first);
    });

    it('changes the key for DID, appId, instructions, detail level, and personal data', () => {
        const base = getLearnerContextCacheKey(source(), { includePersonalData: true });

        expect(
            getLearnerContextCacheKey(source({ did: 'did:example:other' }), {
                includePersonalData: true,
            })
        ).not.toBe(base);
        expect(
            getLearnerContextCacheKey(source({ appId: 'app-b' }), { includePersonalData: true })
        ).not.toBe(base);
        expect(
            getLearnerContextCacheKey(source(), {
                includePersonalData: true,
                instructions: 'Focus',
            })
        ).not.toBe(base);
        expect(
            getLearnerContextCacheKey(source(), {
                includePersonalData: true,
                detailLevel: 'expanded',
            })
        ).not.toBe(base);
        expect(
            getLearnerContextCacheKey(source({ personalData: { name: 'Riley' } }), {
                includePersonalData: true,
            })
        ).not.toBe(base);
    });

    it('ignores expired entries', () => {
        const key = 'expired-entry';

        writeLearnerContextCache({
            key,
            prompt: 'old prompt',
            did: 'did:example:expired',
            credentialUris: [],
            createdAt: 1_000,
        });

        expect(
            readLearnerContextCache(key, 1_000 + LEARNER_CONTEXT_CACHE_TTL_MS + 1)
        ).toBeUndefined();
    });

    it('does not throw when sessionStorage is unavailable', () => {
        const getter = vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
            throw new Error('storage unavailable');
        });

        expect(() =>
            writeLearnerContextCache({
                key: 'storage-failure',
                prompt: 'prompt',
                did: 'did:example:storage',
                credentialUris: [],
                createdAt: Date.now(),
            })
        ).not.toThrow();
        expect(() => readLearnerContextCache('storage-failure')).not.toThrow();
        expect(() => clearLearnerContextCacheForDid('did:example:storage')).not.toThrow();

        getter.mockRestore();
    });
});
