import { beforeEach, describe, expect, it, mock } from 'bun:test';

const generateCredentialEmbeddingTexts = mock(async () => ({
    fullText: 'full',
    domainSummary: 'domain',
    keyClaims: 'claims',
    technicalMetadata: 'technical',
    comparisonContext: 'comparison',
}));
const generateEmbeddings = mock(async (texts: string[]) => texts.map(() => [0.1, 0.2]));
const streamingAiCall = mock(async () => 'Generated title');
type SearchPoint = {
    score: number;
    payload: { uri?: string; credentialType?: string };
};
const searchSimilar = mock(
    async (_collectionName: string, ..._rest: unknown[]): Promise<SearchPoint[]> => [
        {
            score: 0.8,
            payload: {
                uri: 'lc:credential:1',
                credentialType: 'Achievement',
            },
        },
    ]
);
const db = {
    getCredentialTitle: mock(async () => null),
    updateCredentialTitle: mock(async () => undefined),
    getVCs: mock(async (): Promise<never[]> => {
        throw new Error('search must not hydrate every credential');
    }),
    getCredentialAiContexts: mock(defaultAiContexts),
};
async function defaultAiContexts(_did: string, _uris: readonly string[]) {
    return [
        {
            uri: 'lc:credential:1',
            category: 'Achievement',
            aiContext: 'Budgeting achievement context',
        },
        {
            uri: 'lc:credential:weak',
            category: 'Achievement',
            aiContext: 'Unrelated context',
        },
        {
            uri: 'lc:credential:strong',
            category: 'Achievement',
            aiContext: 'Directly relevant context',
        },
    ];
}

mock.module('../ai/embedding-texts', () => ({
    generateCredentialEmbeddingTexts,
}));
mock.module('../ai/embeddings', () => ({ generateEmbeddings }));
mock.module('../ai', () => ({ streamingAiCall }));
mock.module('../constants/collections', () => ({
    CREDENTIAL_COLLECTION_PREFIXES: {
        FULL_TEXT: 'full',
        DOMAIN_SUMMARY: 'domain',
        KEY_CLAIMS: 'claims',
        TECHNICAL_METADATA: 'technical',
        COMPARISON_CONTEXT: 'comparison',
    },
}));
mock.module('../constants/env', () => ({
    AI_LOCAL_DEBUG_LOGGING: false,
    CORS_ORIGINS: [],
    DOMAIN: 'http://localhost:3000',
    NODE_ENV: 'test',
    AI_PRIVACY_KEY: Buffer.alloc(32, 7).toString('base64'),
    LEARNCARD_CONTRACT_URI: 'lc:network:contract:ai',
    CREDENTIAL_RELEVANCE_MIN_AVERAGE_SCORE: 0.2,
    CREDENTIAL_RELEVANCE_MIN_MATCHES: 3,
    CREDENTIAL_RELEVANCE_STRONG_SCORE: 0.82,
    TITLE_MODEL: 'test-title-model',
}));
mock.module('../db', () => ({ db }));
mock.module('../utils/timing', () => ({
    sendTimingEvent: mock(() => undefined),
}));
mock.module('../db/qdrant', () => ({ searchSimilar }));
const currentReceipt = {
    revision: 'current-revision',
    credentialUris: ['lc:credential:1', 'lc:credential:weak', 'lc:credential:strong'],
};
const assertCurrentAiConsent = mock(
    async (_purpose: string, _options?: { signal?: AbortSignal }) => currentReceipt
);
mock.module('../ai/privacy', () => ({
    getCurrentAiSubject: () => 'did:example:learner',
    bindAiConsentRevision: () => true,
    assertCurrentAiConsent,
}));
const currentProjection = {
    schemaVersion: '1',
    category: 'Achievement',
    credentialTypes: [],
    facts: [{ kind: 'skill', value: 'Current verified learning fact' }],
};
const resolveVerifiedCredentialProjection = mock(
    async (_did: string, _uri: string, _receipt: unknown): Promise<unknown> => currentProjection
);
const assertCredentialConsent = mock(
    async (_did: string, _uri: string, _receipt: unknown): Promise<void> => {}
);
mock.module('../credentials/service', () => ({
    assertCredentialConsent,
    resolveVerifiedCredentialProjection,
}));

// Bun must register dependency mocks before loading the search pipeline.
const { enrichCredentialTitles, searchCredentialContextsByTopic } =
    await import('./credentialSearch');

const { boundLearnCardCall } = await import('../learncard/requestScope');
const { AiConsentError } = await import('../learncard/consent');
const { CredentialVerificationUnavailableError } = await import('../credentials/verification');
const {
    clearKnownBadCredentials,
    isKnownBadCredential,
    markCredentialItemFailure,
    recordCredentialOutcome,
} = await import('../credentials/batch');
const twoStrongResults = async () => [
    {
        score: 0.9,
        payload: { uri: 'lc:credential:1', credentialType: 'Achievement' },
    },
    {
        score: 0.88,
        payload: { uri: 'lc:credential:strong', credentialType: 'Achievement' },
    },
];
// The default stored rows, with no stored text for these URIs.
const withoutStoredText = (...uris: string[]) =>
    db.getCredentialAiContexts.mockImplementation(async (did, requested) =>
        (await defaultAiContexts(did, requested)).map(row =>
            uris.includes(row.uri) ? { ...row, aiContext: '' } : row
        )
    );
const jsonLdFailure = () =>
    new CredentialVerificationUnavailableError('unrecognized_verifier_error', 'jsonld_context');

describe('credential search pipeline', () => {
    beforeEach(() => {
        assertCurrentAiConsent.mockClear();
        assertCurrentAiConsent.mockImplementation(async () => currentReceipt);
        generateCredentialEmbeddingTexts.mockClear();
        generateEmbeddings.mockClear();
        streamingAiCall.mockClear();
        searchSimilar.mockClear();
        searchSimilar.mockImplementation(async () => [
            {
                score: 0.8,
                payload: {
                    uri: 'lc:credential:1',
                    credentialType: 'Achievement',
                },
            },
        ]);
        db.getCredentialTitle.mockReset();
        db.getCredentialTitle.mockResolvedValue(null);
        db.updateCredentialTitle.mockClear();
        // mockClear keeps queued Once results; a test that ends before its aiContext
        // read would otherwise hand that result to the next test.
        db.getCredentialAiContexts.mockReset();
        db.getCredentialAiContexts.mockImplementation(defaultAiContexts);
        assertCredentialConsent.mockReset();
        assertCredentialConsent.mockImplementation(async () => {});
        resolveVerifiedCredentialProjection.mockReset();
        resolveVerifiedCredentialProjection.mockImplementation(async () => currentProjection);
        clearKnownBadCredentials();
    });

    it('uses one embedding across the five-search opening fanout', async () => {
        const onMetrics = mock(() => undefined);
        const results = await searchCredentialContextsByTopic(
            'first apartment budgeting',
            'did:example:learner',
            { expandQueries: false, limit: 5, onMetrics }
        );

        expect(generateCredentialEmbeddingTexts).not.toHaveBeenCalled();
        expect(generateEmbeddings).toHaveBeenCalledTimes(1);
        expect(generateEmbeddings).toHaveBeenCalledWith(
            ['first apartment budgeting'],
            expect.anything()
        );
        expect(searchSimilar).toHaveBeenCalledTimes(5);
        expect(results).toEqual([
            {
                uri: 'lc:credential:1',
                type: 'Achievement',
                context: JSON.stringify(currentProjection),
                score: 4,
                strongestScore: 0.8,
                averageScore: 0.8,
                matchCount: 5,
            },
        ]);
        expect(onMetrics).toHaveBeenCalledWith({
            embeddingTextsFromCache: false,
            candidateCount: 1,
            filteredCount: 0,
            resultCount: 1,
            lowestScore: 4,
            highestScore: 4,
            highestStrongestScore: 0.8,
            highestAverageScore: 0.8,
            maxMatchCount: 5,
        });
    });

    it('filters weak single-dimension matches', async () => {
        searchSimilar.mockImplementation(async (collectionName: string) =>
            collectionName === 'full'
                ? [
                      {
                          score: 0.5,
                          payload: {
                              uri: 'lc:credential:weak',
                              credentialType: 'Achievement',
                          },
                      },
                  ]
                : []
        );

        const onMetrics = mock(() => undefined);
        const results = await searchCredentialContextsByTopic(
            'first apartment budgeting',
            'did:example:learner',
            { expandQueries: false, onMetrics }
        );

        expect(results).toEqual([]);
        expect(onMetrics).toHaveBeenCalledWith(
            expect.objectContaining({
                candidateCount: 1,
                filteredCount: 1,
                resultCount: 0,
            })
        );
    });

    it('accepts a strong single-dimension match', async () => {
        searchSimilar.mockImplementation(async (collectionName: string) =>
            collectionName === 'full'
                ? [
                      {
                          score: 0.9,
                          payload: {
                              uri: 'lc:credential:strong',
                              credentialType: 'Achievement',
                          },
                      },
                  ]
                : []
        );

        const results = await searchCredentialContextsByTopic(
            'first apartment budgeting',
            'did:example:learner',
            { expandQueries: false }
        );

        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({
            uri: 'lc:credential:strong',
            strongestScore: 0.9,
            matchCount: 1,
        });
    });

    it('rejects before Qdrant when less than one second remains', async () => {
        await expect(
            searchCredentialContextsByTopic('deadline topic', 'did:example:learner', {
                expandQueries: false,
                deadlineAt: performance.now() + 999,
            })
        ).rejects.toMatchObject({ name: 'TimeoutError' });

        expect(searchSimilar).not.toHaveBeenCalled();
    });

    it('enriches titles only after core contexts are available', async () => {
        const contexts = [
            {
                uri: 'lc:credential:1',
                type: 'Achievement',
                context: 'Budgeting achievement context',
                score: 0.8,
                strongestScore: 0.8,
                averageScore: 0.8,
                matchCount: 1,
            },
        ];

        expect(await enrichCredentialTitles(contexts, 'did:example:learner')).toEqual([
            { ...contexts[0], title: 'Generated title' },
        ]);
        expect(streamingAiCall).toHaveBeenCalledTimes(1);
    });

    it('checks the context deadline before the consent read', async () => {
        await expect(
            searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                deadlineAt: performance.now() - 1,
            })
        ).rejects.toMatchObject({ name: 'TimeoutError' });
        expect(assertCurrentAiConsent).not.toHaveBeenCalled();
    });

    it('bounds a hung consent read by the context deadline signal', async () => {
        // Stands in for a LearnCard call that never answers (e.g. 401 retries).
        assertCurrentAiConsent.mockImplementation((_purpose, options) =>
            boundLearnCardCall(new Promise<never>(() => {}), options)
        );
        const signal = AbortSignal.timeout(20);
        const startedAt = performance.now();

        await expect(
            searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                signal,
                deadlineAt: performance.now() + 20,
            })
        ).rejects.toMatchObject({ name: 'TimeoutError' });

        expect(performance.now() - startedAt).toBeLessThan(500);
        expect(assertCurrentAiConsent).toHaveBeenCalledWith('model-inference', {
            signal,
        });
        expect(generateEmbeddings).not.toHaveBeenCalled();
    });

    // Projection reads and verifies through LearnCard. Before it was held to the
    // deadline, a hung projection kept the search open past it.
    const settleWithin = async (work: Promise<unknown>, ms: number) =>
        Promise.race([
            work.then(
                () => ({ state: 'resolved' as const, error: undefined }),
                (error: unknown) => ({ state: 'rejected' as const, error })
            ),
            Bun.sleep(ms).then(() => ({
                state: 'pending' as const,
                error: undefined,
            })),
        ]);

    it('rejects a hung projection at the search deadline', async () => {
        // With stored text the verify gives way to it; without, nothing is left.
        withoutStoredText('lc:credential:1');
        resolveVerifiedCredentialProjection.mockImplementation(() => new Promise<never>(() => {}));
        const startedAt = performance.now();
        const outcome = await settleWithin(
            searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                expandQueries: false,
                // Enough to pass the one-second Qdrant guard, then run out.
                deadlineAt: performance.now() + 1_100,
            }),
            2_500
        );

        expect(resolveVerifiedCredentialProjection).toHaveBeenCalledTimes(1);
        expect(outcome.state).toBe('rejected');
        expect(outcome.error).toMatchObject({ name: 'TimeoutError' });
        expect(performance.now() - startedAt).toBeLessThan(2_000);
    });

    it('rejects a hung projection when the search signal aborts', async () => {
        const controller = new AbortController();
        resolveVerifiedCredentialProjection.mockImplementation(() => {
            setTimeout(
                () => controller.abort(new DOMException('synthetic abort', 'AbortError')),
                10
            );
            return new Promise<never>(() => {});
        });
        const outcome = await settleWithin(
            searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                expandQueries: false,
                signal: controller.signal,
            }),
            1_000
        );

        expect(outcome.state).toBe('rejected');
        expect(outcome.error).toMatchObject({ name: 'AbortError' });
    });

    it('does not start projection once the deadline has passed', async () => {
        db.getCredentialAiContexts.mockImplementationOnce(async () => {
            await Bun.sleep(1_100);
            return [
                {
                    uri: 'lc:credential:1',
                    category: 'Achievement',
                    aiContext: 'Budgeting achievement context',
                },
            ];
        });

        await expect(
            searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                expandQueries: false,
                deadlineAt: performance.now() + 1_050,
            })
        ).rejects.toMatchObject({ name: 'TimeoutError' });
        expect(resolveVerifiedCredentialProjection).not.toHaveBeenCalled();
    });
    it('skips one unverifiable credential with no stored text and keeps the rest of the context', async () => {
        searchSimilar.mockImplementation(twoStrongResults);
        withoutStoredText('lc:credential:strong');
        resolveVerifiedCredentialProjection.mockImplementation(async (_did, uri) => {
            if (uri === 'lc:credential:strong') throw jsonLdFailure();
            return currentProjection;
        });
        const events: unknown[] = [];
        const originalWarn = console.warn;
        console.warn = mock((...data: unknown[]) => events.push(...data));
        let results: Awaited<ReturnType<typeof searchCredentialContextsByTopic>>;
        try {
            results = await searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                expandQueries: false,
            });
        } finally {
            console.warn = originalWarn;
        }

        expect(results.map(({ uri }) => uri)).toEqual(['lc:credential:1']);
        expect(events).toContainEqual({
            event: 'credential_skipped',
            credentialBatch: 'context',
            index: 1,
            count: 2,
            failureCode: 'credential_verification_unavailable',
            verificationSubreason: 'unrecognized_verifier_error',
            verifierErrorKind: 'jsonld_context',
        });
        expect(events).toContainEqual(
            expect.objectContaining({
                event: 'credential_batch_completed',
                credentialBatch: 'context',
                loadedCount: 1,
                skippedCount: 1,
            })
        );
        expect(JSON.stringify(events)).not.toContain('lc:credential');
        expect(JSON.stringify(events)).not.toContain('did:');
    });

    it('still fails the context when every credential is unverifiable and none has stored text', async () => {
        searchSimilar.mockImplementation(twoStrongResults);
        withoutStoredText('lc:credential:1', 'lc:credential:strong');
        resolveVerifiedCredentialProjection.mockImplementation(async () => {
            throw jsonLdFailure();
        });
        const originalWarn = console.warn;
        console.warn = mock(() => undefined);
        try {
            await expect(
                searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                    expandQueries: false,
                })
            ).rejects.toBeInstanceOf(CredentialVerificationUnavailableError);
        } finally {
            console.warn = originalWarn;
        }
    });

    it('a deadline mid-batch is a timeout even when one credential already failed', async () => {
        searchSimilar.mockImplementation(twoStrongResults);
        withoutStoredText('lc:credential:strong');
        resolveVerifiedCredentialProjection.mockImplementation(async (_did, uri) => {
            if (uri === 'lc:credential:1') throw jsonLdFailure();
            return new Promise<never>(() => {});
        });
        const outcome = await settleWithin(
            searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                expandQueries: false,
                deadlineAt: performance.now() + 1_100,
            }),
            2_500
        );

        expect(outcome.state).toBe('rejected');
        expect(outcome.error).toMatchObject({ name: 'TimeoutError' });
    });

    it('an abort mid-batch is not a skip, even if a verifier reports it', async () => {
        searchSimilar.mockImplementation(twoStrongResults);
        const controller = new AbortController();
        resolveVerifiedCredentialProjection.mockImplementation(async (_did, uri) => {
            if (uri === 'lc:credential:1') return currentProjection;
            await Bun.sleep(10);
            controller.abort(new DOMException('synthetic abort', 'AbortError'));
            /* The SDK wraps an aborted verify as an unavailable verification. */
            throw new CredentialVerificationUnavailableError('sdk_exception');
        });
        const outcome = await settleWithin(
            searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                expandQueries: false,
                signal: controller.signal,
            }),
            1_000
        );

        expect(outcome.state).toBe('rejected');
        expect(outcome.error).toMatchObject({ name: 'AbortError' });
    });

    it('reads aiContext only for the ranked URIs, never hydrating every credential', async () => {
        assertCurrentAiConsent.mockImplementation(async () => ({
            revision: 'current-revision',
            credentialUris: [
                'lc:credential:1',
                'lc:credential:weak',
                'lc:credential:strong',
                'lc:credential:known-bad',
            ],
        }));
        searchSimilar.mockImplementation(async () => [
            {
                score: 0.85,
                payload: { uri: 'lc:credential:1', credentialType: 'Achievement' },
            },
            {
                score: 0.95,
                payload: { uri: 'lc:credential:strong', credentialType: 'Achievement' },
            },
            {
                score: 0.05,
                payload: { uri: 'lc:credential:weak', credentialType: 'Achievement' },
            },
            {
                score: 0.99,
                payload: {
                    uri: 'lc:credential:unpermitted',
                    credentialType: 'Achievement',
                },
            },
            {
                score: 0.97,
                payload: {
                    uri: 'lc:credential:known-bad',
                    credentialType: 'Achievement',
                },
            },
        ]);
        recordCredentialOutcome(
            'did:example:learner',
            'lc:credential:known-bad',
            undefinedTermFailure()
        );
        db.getVCs.mockClear();

        const results = await searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
            expandQueries: false,
        });

        expect(db.getVCs).not.toHaveBeenCalled();
        // One read for the known-bad URI's stored text (it has none, so it stays
        // out of the search), then one for the ranked URIs.
        expect(db.getCredentialAiContexts).toHaveBeenCalledTimes(2);
        expect(db.getCredentialAiContexts.mock.calls[0]).toEqual([
            'did:example:learner',
            ['lc:credential:known-bad'],
        ]);
        expect(db.getCredentialAiContexts.mock.calls[1]).toEqual([
            'did:example:learner',
            ['lc:credential:strong', 'lc:credential:1'],
        ]);
        expect(results.map(({ uri }) => uri)).toEqual(['lc:credential:strong', 'lc:credential:1']);
    });

    // Seven strong candidates, ranked by score: lc:credential:r0 first.
    const rankedUris = Array.from({ length: 7 }, (_, i) => `lc:credential:r${i}`);
    const useRankedCandidates = () => {
        const receipt = {
            revision: 'current-revision',
            credentialUris: rankedUris,
        };
        assertCurrentAiConsent.mockImplementation(async () => receipt);
        searchSimilar.mockImplementation(async () =>
            rankedUris.map((uri, i) => ({
                score: 0.99 - i * 0.01,
                payload: { uri, credentialType: 'Achievement' },
            }))
        );
        db.getCredentialAiContexts.mockImplementation(async () =>
            rankedUris.map(uri => ({
                uri,
                category: 'Achievement',
                aiContext: 'stored context',
            }))
        );
    };
    // The ranked candidates, with no stored text for these URIs.
    const withoutRankedStoredText = (...uris: string[]) =>
        db.getCredentialAiContexts.mockImplementation(async () =>
            rankedUris.map(uri => ({
                uri,
                category: 'Achievement',
                aiContext: uris.includes(uri) ? '' : 'stored context',
            }))
        );
    const undefinedTermFailure = () =>
        new CredentialVerificationUnavailableError(
            'unrecognized_verifier_error',
            'undefined_jsonld_term'
        );
    const confirmedInvalidFailure = () =>
        markCredentialItemFailure(
            new Error('Credential verification failed'),
            'credential_invalid'
        );
    const withQuietWarn = async <T>(work: () => Promise<T>, events: unknown[] = []): Promise<T> => {
        const originalWarn = console.warn;
        const originalInfo = console.info;
        console.warn = mock((...data: unknown[]) => events.push(...data));
        console.info = mock(() => undefined);
        try {
            return await work();
        } finally {
            console.warn = originalWarn;
            console.info = originalInfo;
        }
    };

    it('walks past five bad top hits to a good one at rank six', async () => {
        useRankedCandidates();
        const bad = new Set(rankedUris.slice(0, 5));
        withoutRankedStoredText(...bad);
        resolveVerifiedCredentialProjection.mockImplementation(async (_did, uri) => {
            if (bad.has(uri)) throw undefinedTermFailure();
            return currentProjection;
        });
        const events: unknown[] = [];
        const results = await withQuietWarn(
            () =>
                searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                    expandQueries: false,
                    limit: 5,
                }),
            events
        );

        expect(results.map(({ uri }) => uri)).toEqual(['lc:credential:r5', 'lc:credential:r6']);
        expect(resolveVerifiedCredentialProjection).toHaveBeenCalledTimes(7);
        expect(JSON.stringify(events)).not.toContain('lc:credential');
        expect(JSON.stringify(events)).not.toContain('did:');
    });

    it('returns an empty context when every candidate fails permanently with no stored text', async () => {
        useRankedCandidates();
        withoutRankedStoredText(...rankedUris);
        resolveVerifiedCredentialProjection.mockImplementation(async () => {
            throw undefinedTermFailure();
        });
        const results = await withQuietWarn(() =>
            searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                expandQueries: false,
                limit: 5,
            })
        );

        expect(results).toEqual([]);
        expect(resolveVerifiedCredentialProjection).toHaveBeenCalledTimes(7);
    });

    it('skips the live read of a known-bad credential and uses its stored text', async () => {
        useRankedCandidates();
        recordCredentialOutcome('did:example:learner', 'lc:credential:r0', undefinedTermFailure());
        const results = await searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
            expandQueries: false,
            limit: 5,
        });

        expect(resolveVerifiedCredentialProjection).not.toHaveBeenCalledWith(
            'did:example:learner',
            'lc:credential:r0',
            expect.anything()
        );
        expect(results.map(({ uri }) => uri)).toEqual(rankedUris.slice(0, 5));
        expect(results[0]?.context).toBe('stored context');
        expect(assertCredentialConsent.mock.calls.map(([, uri]) => uri)).toEqual([
            'lc:credential:r0',
        ]);
    });

    it('skips a known-bad credential with no stored text', async () => {
        useRankedCandidates();
        withoutRankedStoredText('lc:credential:r0');
        recordCredentialOutcome('did:example:learner', 'lc:credential:r0', undefinedTermFailure());
        const results = await searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
            expandQueries: false,
            limit: 5,
        });

        expect(resolveVerifiedCredentialProjection).not.toHaveBeenCalledWith(
            'did:example:learner',
            'lc:credential:r0',
            expect.anything()
        );
        expect(results.map(({ uri }) => uri)).toEqual(rankedUris.slice(1, 6));
    });

    const uriFilter = (call: unknown[]) =>
        (call[3] as { must: { key: string; match: { any?: string[] } }[] }).must.find(
            ({ key }) => key === 'uri'
        )?.match.any;

    // Prod v186 deferred: 75 best points over 42 URIs, then nothing loaded. Known-bad
    // points took top-k slots that credentials still able to verify could have had.
    it('leaves known-bad credentials with no stored text out of the Qdrant search', async () => {
        useRankedCandidates();
        withoutRankedStoredText('lc:credential:r0');
        recordCredentialOutcome('did:example:learner', 'lc:credential:r0', undefinedTermFailure());
        await searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
            expandQueries: false,
            limit: 5,
        });

        expect(searchSimilar).toHaveBeenCalledTimes(5);
        for (const call of searchSimilar.mock.calls)
            expect(uriFilter(call)).toEqual(rankedUris.slice(1));
    });

    // v188 Math: preload marked ~90 of 182 credentials known-bad
    // (undefined_jsonld_term), which kept their stored text out of the search.
    it('keeps a known-bad credential with stored text in the Qdrant search', async () => {
        useRankedCandidates();
        recordCredentialOutcome('did:example:learner', 'lc:credential:r0', undefinedTermFailure());
        await searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
            expandQueries: false,
            limit: 5,
        });

        for (const call of searchSimilar.mock.calls) expect(uriFilter(call)).toEqual(rankedUris);
    });

    it('leaves a confirmed-invalid credential out of the search even with stored text', async () => {
        useRankedCandidates();
        recordCredentialOutcome(
            'did:example:learner',
            'lc:credential:r0',
            confirmedInvalidFailure()
        );
        const results = await searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
            expandQueries: false,
            limit: 5,
        });

        for (const call of searchSimilar.mock.calls)
            expect(uriFilter(call)).toEqual(rankedUris.slice(1));
        expect(results.map(({ uri }) => uri)).toEqual(rankedUris.slice(1, 6));
    });

    it('v188 Math: every credential known-bad still yields stored context without a live verify', async () => {
        useRankedCandidates();
        for (const uri of rankedUris)
            recordCredentialOutcome('did:example:learner', uri, undefinedTermFailure());
        const results = await searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
            expandQueries: false,
            limit: 5,
        });

        expect(results.map(({ uri }) => uri)).toEqual(rankedUris.slice(0, 5));
        expect(results.every(({ context }) => context === 'stored context')).toBe(true);
        expect(resolveVerifiedCredentialProjection).not.toHaveBeenCalled();
    });

    it('returns an empty context without searching when every credential is known-bad with no stored text', async () => {
        useRankedCandidates();
        withoutRankedStoredText(...rankedUris);
        for (const uri of rankedUris)
            recordCredentialOutcome('did:example:learner', uri, undefinedTermFailure());
        const results = await searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
            expandQueries: false,
            limit: 5,
        });

        expect(results).toEqual([]);
        expect(searchSimilar).not.toHaveBeenCalled();
        expect(resolveVerifiedCredentialProjection).not.toHaveBeenCalled();
    });

    // Prod v187 opening: 8 relevant candidates, noAiContextCount 8, walk never
    // ran. Their rows had no stored aiContext; the stored projection stands in.
    it('walks candidates whose stored text came from the stored projection', async () => {
        useRankedCandidates();
        db.getCredentialAiContexts.mockImplementation(async () =>
            rankedUris.map(uri => ({
                uri,
                category: 'Achievement',
                aiContext: 'projection text',
                fromProjection: true as const,
            }))
        );
        const results = await searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
            expandQueries: false,
            limit: 5,
        });

        expect(results.map(({ uri }) => uri)).toEqual(rankedUris.slice(0, 5));
    });

    it('uses the stored ingest-time text when a re-verify fails, transiently or permanently', async () => {
        useRankedCandidates();
        db.getCredentialAiContexts.mockImplementation(async () =>
            rankedUris.map(uri => ({
                uri,
                category: 'Stored Category',
                aiContext: `stored ${uri}`,
            }))
        );
        resolveVerifiedCredentialProjection.mockImplementation(async (_did, uri) => {
            if (uri === 'lc:credential:r0') return currentProjection;
            if (uri === 'lc:credential:r1') throw undefinedTermFailure();
            throw jsonLdFailure();
        });
        const events: unknown[] = [];
        const results = await withQuietWarn(
            () =>
                searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                    expandQueries: false,
                    limit: 5,
                }),
            events
        );

        // r0 verified live; r1 failed permanently and r2-r4 transiently, and all
        // four have stored text, so the first window fills the context.
        expect(results.map(({ uri }) => uri)).toEqual(rankedUris.slice(0, 5));
        expect(results[0]?.context).toBe(JSON.stringify(currentProjection));
        expect(results[1]).toMatchObject({
            type: 'Stored Category',
            context: 'stored lc:credential:r1',
        });
        expect(results[2]).toMatchObject({
            type: 'Stored Category',
            context: 'stored lc:credential:r2',
        });
        expect(assertCredentialConsent.mock.calls.map(([, uri]) => uri)).toEqual([
            'lc:credential:r1',
            'lc:credential:r2',
            'lc:credential:r3',
            'lc:credential:r4',
        ]);
        expect(events).toContainEqual(
            expect.objectContaining({
                event: 'credential_skipped',
                credentialBatch: 'context',
                verifierErrorKind: 'jsonld_context',
            })
        );
        expect(JSON.stringify(events)).not.toContain('lc:credential');
    });

    it('v188: permanent re-verify failures use stored text when it exists', async () => {
        useRankedCandidates();
        resolveVerifiedCredentialProjection.mockImplementation(async () => {
            throw undefinedTermFailure();
        });
        const results = await withQuietWarn(() =>
            searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                expandQueries: false,
                limit: 5,
            })
        );

        expect(results.map(({ uri }) => uri)).toEqual(rankedUris.slice(0, 5));
        expect(results.every(({ context }) => context === 'stored context')).toBe(true);
        expect(assertCredentialConsent).toHaveBeenCalledTimes(5);
    });

    it('a confirmed-invalid credential never falls back to its stored text', async () => {
        useRankedCandidates();
        resolveVerifiedCredentialProjection.mockImplementation(async (_did, uri) => {
            if (uri === 'lc:credential:r0') throw confirmedInvalidFailure();
            return currentProjection;
        });
        const results = await withQuietWarn(() =>
            searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                expandQueries: false,
                limit: 5,
            })
        );

        expect(results.map(({ uri }) => uri)).toEqual(rankedUris.slice(1, 6));
        expect(assertCredentialConsent).not.toHaveBeenCalled();
    });

    it('a consent change fails the permanent-failure fallback instead of using it', async () => {
        searchSimilar.mockImplementation(twoStrongResults);
        resolveVerifiedCredentialProjection.mockImplementation(async () => {
            throw undefinedTermFailure();
        });
        assertCredentialConsent.mockImplementation(async () => {
            throw new AiConsentError('Credential consent changed');
        });

        await expect(
            withQuietWarn(() =>
                searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                    expandQueries: false,
                })
            )
        ).rejects.toBeInstanceOf(AiConsentError);
    });

    it('a consent change fails the known-bad stored-text path instead of using it', async () => {
        searchSimilar.mockImplementation(twoStrongResults);
        for (const uri of ['lc:credential:1', 'lc:credential:strong'])
            recordCredentialOutcome('did:example:learner', uri, undefinedTermFailure());
        assertCredentialConsent.mockImplementation(async () => {
            throw new AiConsentError('Credential consent changed');
        });

        await expect(
            searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                expandQueries: false,
            })
        ).rejects.toBeInstanceOf(AiConsentError);
        expect(resolveVerifiedCredentialProjection).not.toHaveBeenCalled();
    });

    it('a consent change fails the stored-text fallback instead of using it', async () => {
        searchSimilar.mockImplementation(twoStrongResults);
        resolveVerifiedCredentialProjection.mockImplementation(async () => {
            throw jsonLdFailure();
        });
        assertCredentialConsent.mockImplementation(async () => {
            throw new AiConsentError('Credential consent changed');
        });

        await expect(
            withQuietWarn(() =>
                searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                    expandQueries: false,
                })
            )
        ).rejects.toBeInstanceOf(AiConsentError);
    });

    // v194 Math: every candidate had stored text, the live verify was contended
    // by the preload, and the deferred phase delivered nothing.
    it('v194: a live verify still running near the deadline gives way to stored text', async () => {
        useRankedCandidates();
        resolveVerifiedCredentialProjection.mockImplementation(() => new Promise<never>(() => {}));
        const events: unknown[] = [];
        let results: Awaited<ReturnType<typeof searchCredentialContextsByTopic>> = [];
        const deadlineAt = performance.now() + 1_100;
        const outcome = await withQuietWarn(
            () =>
                settleWithin(
                    searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                        expandQueries: false,
                        limit: 5,
                        deadlineAt,
                    }).then(value => {
                        results = value;
                    }),
                    2_500
                ),
            events
        );

        expect(outcome.state).toBe('resolved');
        expect(performance.now()).toBeLessThan(deadlineAt);
        expect(results.map(({ uri }) => uri)).toEqual(rankedUris.slice(0, 5));
        expect(results.every(({ context }) => context === 'stored context')).toBe(true);
        // Each stored text was consent-checked; giving way is not known-bad.
        expect(assertCredentialConsent).toHaveBeenCalledTimes(5);
        expect(isKnownBadCredential('did:example:learner', 'lc:credential:r0')).toBe(false);
        expect(events).toContainEqual(
            expect.objectContaining({
                event: 'credential_skipped',
                failureCode: 'credential_verification_unavailable',
                credentialBatch: 'context',
                verificationSubreason: 'sdk_timeout',
            })
        );
    });

    // v198 Math: without remote contexts every live verify hung until it gave
    // way, so the 2s opening budget ran out and only the deferred search (~14s)
    // delivered. The opening uses the stored text without waiting on the verifier.
    it('v198: preferStoredText uses stored text without a live verify', async () => {
        useRankedCandidates();
        resolveVerifiedCredentialProjection.mockImplementation(() => new Promise<never>(() => {}));
        const startedAt = performance.now();
        const results = await searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
            expandQueries: false,
            limit: 5,
            preferStoredText: true,
            deadlineAt: startedAt + 2_000,
        });

        // Well before the live verify would have given way (deadline - 1s).
        expect(performance.now() - startedAt).toBeLessThan(500);
        expect(results.map(({ uri }) => uri)).toEqual(rankedUris.slice(0, 5));
        expect(results.every(({ context }) => context === 'stored context')).toBe(true);
        expect(resolveVerifiedCredentialProjection).not.toHaveBeenCalled();
        expect(assertCredentialConsent).toHaveBeenCalledTimes(5);
    });

    it('preferStoredText still verifies live a credential with no stored text', async () => {
        useRankedCandidates();
        withoutRankedStoredText('lc:credential:r0');
        const results = await searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
            expandQueries: false,
            limit: 5,
            preferStoredText: true,
        });

        expect(resolveVerifiedCredentialProjection.mock.calls.map(([, uri]) => uri)).toEqual([
            'lc:credential:r0',
        ]);
        expect(results[0]?.context).not.toBe('stored context');
        expect(results.slice(1).map(({ context }) => context)).toEqual(
            Array(4).fill('stored context')
        );
    });

    it('preferStoredText does not bypass a consent change', async () => {
        useRankedCandidates();
        assertCredentialConsent.mockImplementation(async () => {
            throw new AiConsentError('Credential consent changed');
        });

        await expect(
            withQuietWarn(() =>
                searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                    expandQueries: false,
                    preferStoredText: true,
                })
            )
        ).rejects.toBeInstanceOf(AiConsentError);
        expect(resolveVerifiedCredentialProjection).not.toHaveBeenCalled();
    });

    it('a deadline is not a fallback: a stored-text consent check that outlasts it is a timeout', async () => {
        searchSimilar.mockImplementation(twoStrongResults);
        resolveVerifiedCredentialProjection.mockImplementation(() => new Promise<never>(() => {}));
        assertCredentialConsent.mockImplementation(() => new Promise<never>(() => {}));
        const outcome = await withQuietWarn(() =>
            settleWithin(
                searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                    expandQueries: false,
                    deadlineAt: performance.now() + 1_100,
                }),
                2_500
            )
        );

        expect(outcome.state).toBe('rejected');
        expect(outcome.error).toMatchObject({ name: 'TimeoutError' });
        expect(assertCredentialConsent).toHaveBeenCalled();
    });

    it('keeps the first window when a later window fails transiently with no stored text', async () => {
        useRankedCandidates();
        withoutRankedStoredText(...rankedUris.slice(1));
        resolveVerifiedCredentialProjection.mockImplementation(async (_did, uri) => {
            if (uri === 'lc:credential:r0') return currentProjection;
            if (uri === 'lc:credential:r5') throw jsonLdFailure();
            throw undefinedTermFailure();
        });
        const results = await withQuietWarn(() =>
            searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                expandQueries: false,
                limit: 5,
            })
        );

        expect(results.map(({ uri }) => uri)).toEqual(['lc:credential:r0']);
    });

    it('a deadline during a later window still rejects as a timeout', async () => {
        useRankedCandidates();
        const bad = new Set(rankedUris.slice(0, 5));
        // No stored text anywhere, so the hung later window has nothing to use.
        withoutRankedStoredText(...rankedUris);
        resolveVerifiedCredentialProjection.mockImplementation(async (_did, uri) => {
            if (bad.has(uri)) throw undefinedTermFailure();
            return new Promise<never>(() => {});
        });
        const outcome = await withQuietWarn(() =>
            settleWithin(
                searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                    expandQueries: false,
                    limit: 5,
                    deadlineAt: performance.now() + 1_100,
                }),
                2_500
            )
        );

        expect(outcome.state).toBe('rejected');
        expect(outcome.error).toMatchObject({ name: 'TimeoutError' });
    });

    it('a deadline during a later window returns the windows already loaded', async () => {
        useRankedCandidates();
        withoutRankedStoredText(...rankedUris.slice(1));
        resolveVerifiedCredentialProjection.mockImplementation(async (_did, uri) => {
            if (uri === 'lc:credential:r0') return currentProjection;
            if (uri === 'lc:credential:r5') return new Promise<never>(() => {});
            throw undefinedTermFailure();
        });
        let results: { uri: string }[] = [];
        const outcome = await withQuietWarn(() =>
            settleWithin(
                searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
                    expandQueries: false,
                    limit: 5,
                    deadlineAt: performance.now() + 1_100,
                }).then(contexts => {
                    results = contexts;
                }),
                2_500
            )
        );

        expect(outcome.state).toBe('resolved');
        expect(results.map(({ uri }) => uri)).toEqual(['lc:credential:r0']);
    });

    // Prod v185: 15 points per dimension, none stale or unpermitted, all 75 counted
    // as missing a type, 0 candidates. Points indexed before the refactor stored the
    // VC `type` array as credentialType, which the storage boundary strips.
    it('keeps permitted points that have no stored credential type', async () => {
        searchSimilar.mockImplementation(async () => [
            { score: 0.9, payload: { uri: 'lc:credential:strong' } },
            { score: 0.6, payload: { uri: 'lc:credential:1' } },
        ]);

        const results = await searchCredentialContextsByTopic('Budgeting', 'did:example:learner', {
            expandQueries: false,
        });

        expect(results.map(({ uri }) => uri)).toEqual(['lc:credential:strong', 'lc:credential:1']);
        // The label shown downstream is the verified projection's category.
        expect(results.every(({ type }) => type === 'Achievement')).toBe(true);
    });
});
