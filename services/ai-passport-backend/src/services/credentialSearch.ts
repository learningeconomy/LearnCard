import { withSearchGeneration } from '../ai/read-generation';
import { embeddingCacheIdentity } from '../ai/embedding-generation';
import type { ServerWebSocket } from 'bun';

import { generateCredentialEmbeddingTexts } from '../ai/embedding-texts';
import type { CredentialEmbeddingTexts } from '../ai/generation-schemas';
import { generateEmbeddings } from '../ai/embeddings';
import { streamingAiCall } from '../ai';
import { CREDENTIAL_COLLECTION_PREFIXES } from '../constants/collections';
import {
    CREDENTIAL_RELEVANCE_MIN_AVERAGE_SCORE,
    CREDENTIAL_RELEVANCE_MIN_MATCHES,
    CREDENTIAL_RELEVANCE_STRONG_SCORE,
    TITLE_MODEL,
} from '../constants/env';
import { db } from '../db';
import { sendTimingEvent } from '../utils/timing';
import { searchSimilar } from '../db/qdrant';
import { assertCurrentAiConsent, getCurrentAiSubject } from '../ai/privacy';
import { AiConsentError } from '../learncard/consent';
import { runWithLearnCardRequestScope } from '../learncard/requestScope';
import {
    assertCredentialConsent,
    resolveVerifiedCredentialProjection,
} from '../credentials/service';
import { serializeModelSafeCredentialProjection } from '../credentials/projection';
import {
    isCredentialItemFailure,
    isConfirmedInvalidCredentialFailure,
    isKnownBadCredential,
    knownBadCredentialKind,
    logCredentialSkip,
    markCredentialItemFailure,
    settleCredentialBatch,
} from '../credentials/batch';
import { CredentialVerificationUnavailableError } from '../credentials/verification';
import { createHmac } from 'node:crypto';
import { getPrivacyKeyMaterial } from '../ai/privacy-keys';

// Placeholder label for a point with no stored type; never shown to the model.
const UNTYPED_CREDENTIAL = 'Uncategorized Credential';

// The part of the deadline a live verify leaves for a credential that has
// stored ingest-time text, so that text and its consent check still land.
const STORED_TEXT_RESERVE_MS = 2_000;

export type TopicSearchContext = {
    uri: string;
    type: string;
    context: string;
    score: number;
    strongestScore: number;
    averageScore: number;
    matchCount: number;
};

export type TopicSearchResult = TopicSearchContext & { title: string };

export type CredentialSearchMetrics = {
    embeddingTextsFromCache: boolean;
    candidateCount: number;
    filteredCount: number;
    resultCount: number;
    lowestScore?: number;
    highestScore?: number;
    highestAverageScore?: number;
    highestStrongestScore?: number;
    maxMatchCount?: number;
};

export type CredentialSearchOptions = {
    limit?: number;
    expandQueries?: boolean;
    ws?: ServerWebSocket<{ did: string; type?: string }>;
    signal?: AbortSignal;
    deadlineAt?: number;
    /**
     * Use a candidate's stored ingest-time text (consent re-checked) without a
     * live verify. The opening context sets it: its budget is too short to wait
     * on the verifier, and stored text that lands beats a verify that doesn't.
     */
    preferStoredText?: boolean;
    onMetrics?: (metrics: CredentialSearchMetrics) => void;
};

const SEARCH_DIMENSIONS = [
    {
        prefix: CREDENTIAL_COLLECTION_PREFIXES.FULL_TEXT,
        key: 'fullText',
    },
    {
        prefix: CREDENTIAL_COLLECTION_PREFIXES.DOMAIN_SUMMARY,
        key: 'domainSummary',
    },
    {
        prefix: CREDENTIAL_COLLECTION_PREFIXES.KEY_CLAIMS,
        key: 'keyClaims',
    },
    {
        prefix: CREDENTIAL_COLLECTION_PREFIXES.TECHNICAL_METADATA,
        key: 'technicalMetadata',
    },
    {
        prefix: CREDENTIAL_COLLECTION_PREFIXES.COMPARISON_CONTEXT,
        key: 'comparisonContext',
    },
] as const;

const topicEmbeddingCache = new Map<string, CredentialEmbeddingTexts>();

const setCachedEmbeddingTexts = (topic: string, texts: CredentialEmbeddingTexts): void => {
    topicEmbeddingCache.set(topic, texts);

    if (topicEmbeddingCache.size <= 100) return;

    const firstKey = topicEmbeddingCache.keys().next().value;

    if (firstKey) topicEmbeddingCache.delete(firstKey);
};

const topicQueryKey = (did: string, revision: string, topic: string) =>
    createHmac('sha256', getPrivacyKeyMaterial().reference)
        .update(JSON.stringify([embeddingCacheIdentity(), did, revision, topic]))
        .digest('hex');

// One expansion per query key at a time: the deferred search joins the
// session-start warm-up instead of asking the model again. If the joined
// warm-up fails, this caller generates under its own signal.
const inFlightExpansions = new Map<string, Promise<CredentialEmbeddingTexts>>();

const loadTopicExpansion = async (
    queryKey: string,
    topic: string,
    signal: AbortSignal | undefined
): Promise<CredentialEmbeddingTexts> => {
    const cached = topicEmbeddingCache.get(queryKey);
    if (cached) return cached;
    const pending = inFlightExpansions.get(queryKey);
    if (pending) {
        try {
            return await raceCancellation(pending, signal, undefined);
        } catch {
            signal?.throwIfAborted();
        }
    }
    const generation = generateCredentialEmbeddingTexts(topic, { signal }).then(texts => {
        setCachedEmbeddingTexts(queryKey, texts);
        return texts;
    });
    inFlightExpansions.set(queryKey, generation);
    generation
        .finally(() => {
            if (inFlightExpansions.get(queryKey) === generation)
                inFlightExpansions.delete(queryKey);
        })
        .catch(() => undefined);
    return generation;
};

/**
 * Warm the topic's query expansion at session start, under the same consent
 * check as the search, so the deferred search finds it cached (or joins it).
 */
export const warmCredentialTopicExpansion = (
    topic: string,
    did: string,
    options: { signal?: AbortSignal } = {}
): Promise<void> =>
    withSearchGeneration(() =>
        runWithLearnCardRequestScope({ signal: options.signal }, async () => {
            if (getCurrentAiSubject() !== did) throw new AiConsentError();
            const receipt = await assertCurrentAiConsent('model-inference', {
                signal: options.signal,
            });
            if (!receipt.credentialUris.length) return;
            await loadTopicExpansion(
                topicQueryKey(did, receipt.revision, topic),
                topic,
                options.signal
            );
        })
    );

const sendTiming = (
    ws: ServerWebSocket<{ did: string; type?: string }> | undefined,
    operation: string,
    phase: 'start' | 'complete',
    duration?: number,
    metadata?: Record<string, unknown>
): void => {
    if (!ws) return;

    sendTimingEvent(ws, {
        operation,
        phase,
        duration,
        metadata,
        timestamp: new Date().toISOString(),
    });
};

const throwIfCancelled = (
    signal: AbortSignal | undefined,
    deadlineAt: number | undefined
): void => {
    signal?.throwIfAborted();

    if (deadlineAt !== undefined && performance.now() >= deadlineAt) {
        throw new DOMException('Credential search deadline exceeded', 'TimeoutError');
    }
};

/**
 * Stop waiting on `work` once `signal` aborts or `deadlineAt` passes. The work
 * itself may still finish in the background; the caller is released either way.
 */
const raceCancellation = <T>(
    work: Promise<T>,
    signal: AbortSignal | undefined,
    deadlineAt: number | undefined
): Promise<T> => {
    if (!signal && deadlineAt === undefined) return work;
    return new Promise<T>((resolve, reject) => {
        let settled = false;
        const finish = (complete: () => void): void => {
            if (settled) return;
            settled = true;
            if (timer) clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
            complete();
        };
        const onAbort = (): void =>
            finish(() =>
                reject(
                    signal!.reason ?? new DOMException('Credential search aborted', 'AbortError')
                )
            );
        const timer =
            deadlineAt === undefined
                ? undefined
                : setTimeout(
                      () =>
                          finish(() =>
                              reject(
                                  new DOMException(
                                      'Credential search deadline exceeded',
                                      'TimeoutError'
                                  )
                              )
                          ),
                      Math.max(0, deadlineAt - performance.now())
                  );
        if (signal?.aborted) onAbort();
        else signal?.addEventListener('abort', onAbort, { once: true });
        work.then(
            value => finish(() => resolve(value)),
            (error: unknown) => finish(() => reject(error))
        );
    });
};

const generateCredentialTitle = async (
    context: string,
    options: Pick<CredentialSearchOptions, 'ws' | 'signal'>,
    index: number
): Promise<string> => {
    const startedAt = performance.now();

    throwIfCancelled(options.signal, undefined);
    sendTiming(options.ws, 'generateCredentialTitle', 'start');

    const result = await streamingAiCall({
        model: TITLE_MODEL,
        systemPrompt:
            'Generate a concise title (5-7 words) summarizing the following credential context:',
        message: context,
        options: {
            accumulateContent: true,
            signal: options.signal,
        },
    });

    throwIfCancelled(options.signal, undefined);
    sendTiming(
        options.ws,
        'generateCredentialTitle',
        'complete',
        Math.round(performance.now() - startedAt),
        { index }
    );

    return result;
};

export const searchCredentialContextsByTopic = (
    topic: string,
    did: string,
    options: CredentialSearchOptions = {}
) => {
    return withSearchGeneration(() =>
        // One request: LearnCard calls inherit the search signal, and the consent
        // contract is read once instead of once per check per credential.
        runWithLearnCardRequestScope({ signal: options.signal }, () =>
            searchCredentialContextsPinned(topic, did, options)
        )
    );
};

const searchCredentialContextsPinned = async (
    topic: string,
    did: string,
    options: CredentialSearchOptions = {}
): Promise<TopicSearchContext[]> => {
    if (getCurrentAiSubject() !== did) throw new AiConsentError();
    // Check the deadline before the consent read, and bound that read by it.
    throwIfCancelled(options.signal, options.deadlineAt);
    const receipt = await assertCurrentAiConsent('model-inference', {
        signal: options.signal,
    });
    const permitted = new Set(receipt.credentialUris);
    if (!permitted.size) return [];
    const queryKey = topicQueryKey(did, receipt.revision, topic);
    const {
        limit = 5,
        expandQueries = true,
        ws,
        signal,
        deadlineAt,
        preferStoredText = false,
        onMetrics,
    } = options;
    const overallStartedAt = performance.now();
    let embeddingTextsFromCache = false;

    throwIfCancelled(signal, deadlineAt);
    sendTiming(ws, 'searchCredentialContextsByTopic', 'start', undefined, {
        limit,
        expandQueries,
    });

    let queryTexts: string[];

    if (expandQueries) {
        const cachedTexts = topicEmbeddingCache.get(queryKey);
        let texts: CredentialEmbeddingTexts;

        if (cachedTexts) {
            texts = cachedTexts;
            embeddingTextsFromCache = true;
        } else {
            texts = await loadTopicExpansion(queryKey, topic, signal);
            throwIfCancelled(signal, deadlineAt);
        }

        queryTexts = SEARCH_DIMENSIONS.map(({ key }) => texts[key]);
    } else {
        queryTexts = [topic];
    }

    throwIfCancelled(signal, deadlineAt);

    const vectors = await generateEmbeddings(queryTexts, {
        signal,
        purpose: 'query',
    });

    throwIfCancelled(signal, deadlineAt);

    const remainingMs =
        deadlineAt === undefined ? undefined : Math.floor(deadlineAt - performance.now());

    if (remainingMs !== undefined && remainingMs < 1000) {
        throw new DOMException('Insufficient time remaining for credential search', 'TimeoutError');
    }

    const qdrantOptions =
        remainingMs === undefined
            ? undefined
            : {
                  timeoutMs: remainingMs,
                  serverTimeoutSeconds: Math.floor(remainingMs / 1000),
              };
    const candidateLimit = Math.max(limit * 3, 15);
    // Known-bad credentials (a permanent failure in the last few minutes) are
    // left out of the search itself, so they cannot take the top-k slots from
    // credentials that may still verify. The exception is an unverifiable one
    // (not confirmed invalid) with stored ingest-time text: that text is what
    // the walk will use for it, so it stays searchable.
    const unverifiableUris = receipt.credentialUris.filter(
        uri => knownBadCredentialKind(did, uri) === 'unverifiable'
    );
    const unverifiable = new Set(unverifiableUris);
    const knownBadWithStoredText = new Set(
        unverifiableUris.length
            ? (await db.getCredentialAiContexts(did, unverifiableUris)).flatMap(
                  ({ uri, aiContext }) =>
                      unverifiable.has(uri) && typeof aiContext === 'string' && aiContext.trim()
                          ? [uri]
                          : []
              )
            : []
    );
    throwIfCancelled(signal, deadlineAt);
    const isSearchable = (uri: string) =>
        !isKnownBadCredential(did, uri) || knownBadWithStoredText.has(uri);
    const searchableUris = receipt.credentialUris.filter(isSearchable);
    if (!searchableUris.length) return [];
    const resultsPerDimension = await Promise.all(
        SEARCH_DIMENSIONS.map(({ prefix }, index) =>
            searchSimilar(
                prefix,
                vectors[expandQueries ? index : 0],
                candidateLimit,
                {
                    must: [
                        { key: 'did', match: { value: did } },
                        { key: 'uri', match: { any: searchableUris } },
                    ],
                },
                qdrantOptions
            )
        )
    );

    throwIfCancelled(signal, deadlineAt);

    const scoreByUri = new Map<
        string,
        Omit<TopicSearchContext, 'context' | 'averageScore' | 'matchCount'> & {
            dimensionScores: number[];
        }
    >();

    for (const dimensionResults of resultsPerDimension) {
        const bestPointByUri = new Map<string, (typeof dimensionResults)[number]>();

        for (const point of dimensionResults) {
            const uri = point.payload?.uri;
            if (typeof uri !== 'string' || !permitted.has(uri)) continue;

            const current = bestPointByUri.get(uri);
            if (!current || Number(point.score) > Number(current.score)) {
                bestPointByUri.set(uri, point);
            }
        }

        for (const [uri, point] of bestPointByUri) {
            // The stored type is a label only: the walk below replaces it with the
            // verified projection's category, and ownership and permission come from
            // the did/uri filter and receipt check above. Points written before the
            // refactor stored the VC `type` array here, which metadataOnly strips, so
            // dropping untyped points emptied context for every legacy-indexed learner.
            const storedType = point.payload?.credentialType;
            const type = typeof storedType === 'string' ? storedType : UNTYPED_CREDENTIAL;

            const score = Number(point.score) || 0;
            const existing = scoreByUri.get(uri);

            if (existing) {
                existing.score += score;
                existing.strongestScore = Math.max(existing.strongestScore, score);
                existing.dimensionScores.push(score);
            } else {
                scoreByUri.set(uri, {
                    uri,
                    type,
                    score,
                    strongestScore: score,
                    dimensionScores: [score],
                });
            }
        }
    }

    const candidates = [...scoreByUri.values()].map(({ dimensionScores, ...result }) => ({
        ...result,
        averageScore:
            dimensionScores.reduce((sum, score) => sum + score, 0) / dimensionScores.length,
        matchCount: dimensionScores.length,
    }));
    const minAverageScore = CREDENTIAL_RELEVANCE_MIN_AVERAGE_SCORE ?? 0.2;
    const minMatches = CREDENTIAL_RELEVANCE_MIN_MATCHES ?? 3;
    const strongScore = CREDENTIAL_RELEVANCE_STRONG_SCORE ?? 0.82;
    const relevantCandidates = candidates.filter(
        ({ strongestScore, averageScore, matchCount }) =>
            strongestScore >= strongScore ||
            (averageScore >= minAverageScore && matchCount >= minMatches)
    );
    // Known-bad credentials (including any that turned so while Qdrant ran)
    // are dropped before selection, except an unverifiable one whose stored
    // text was read above. The rest are walked in rank order below.
    const rankedCandidates = relevantCandidates
        .filter(({ uri }) => isSearchable(uri))
        .sort((left, right) => right.score - left.score);
    // Only the ranked URIs' stored aiContext is read. Hydrating every credential
    // the learner holds was slow and one missing raw credential failed it all.
    // A row with no stored text falls back to its stored, ingest-verified
    // projection (see getCredentialAiContexts).
    const storedByUri = new Map(
        (
            await db.getCredentialAiContexts(
                did,
                rankedCandidates.map(({ uri }) => uri)
            )
        ).map(row => [row.uri, row])
    );
    const ranked = rankedCandidates
        .flatMap((candidate): TopicSearchContext[] => {
            const context = storedByUri.get(candidate.uri)?.aiContext;
            if (typeof context !== 'string') return [];
            // A known-bad credential is walked only for its stored text.
            if (isKnownBadCredential(did, candidate.uri) && !context.trim()) return [];
            return [{ ...candidate, context }];
        })
        .slice(0, limit * 3);
    const results = ranked.slice(0, limit);
    const distribution = candidates.reduce(
        (metrics, candidate) => ({
            highestScore: Math.max(metrics.highestScore, candidate.score),
            highestStrongestScore: Math.max(
                metrics.highestStrongestScore,
                candidate.strongestScore
            ),
            highestAverageScore: Math.max(metrics.highestAverageScore, candidate.averageScore),
            maxMatchCount: Math.max(metrics.maxMatchCount, candidate.matchCount),
        }),
        {
            highestScore: -1,
            highestStrongestScore: -1,
            highestAverageScore: -1,
            maxMatchCount: 0,
        }
    );

    const metrics: CredentialSearchMetrics = {
        embeddingTextsFromCache,
        candidateCount: candidates.length,
        filteredCount: candidates.length - relevantCandidates.length,
        resultCount: results.length,
        lowestScore: results.at(-1)?.score,
        ...(candidates.length > 0 ? distribution : {}),
    };
    onMetrics?.(metrics);
    sendTiming(
        ws,
        'searchCredentialContextsByTopic',
        'complete',
        Math.round(performance.now() - overallStartedAt),
        metrics
    );

    // Projection reads and verifies each credential through LearnCard; hold it to
    // the same deadline and signal as every step before it.
    // One unreadable or unverifiable credential is skipped, not the context.
    // Walk the ranked candidates a window at a time until `limit` load, so bad
    // top hits do not hide good ones further down. Permanent failures only end
    // in an empty context; a transient one with nothing loaded still rejects.
    // A deadline mid-walk returns the windows already loaded.
    //
    // Live verify is tried first and wins when it succeeds. When it fails for
    // this credential alone, transiently or permanently (an undefined JSON-LD
    // term), and the credential has stored ingest-time text, consent is checked
    // again and that text stands in. A credential already known to be
    // unverifiable skips the live verify and goes straight to its stored text.
    // A confirmed-invalid credential never falls back: its rows were deleted.
    // With preferStoredText (the opening context), stored text is used the same
    // way without a live verify; only a credential with none is verified live.
    // A live verify still running near the deadline gives way to the stored
    // ingest-time text. The verifier is slow under load (the preload verifies the
    // same credentials), and a context of stored text beats no context. The
    // reserve is at most half of what is left, so a short budget still tries.
    // Giving way is transient: it never marks the credential known-bad.
    const liveVerifyDeadlineAt =
        deadlineAt === undefined
            ? undefined
            : deadlineAt -
              Math.min(STORED_TEXT_RESERVE_MS, Math.max(0, deadlineAt - performance.now()) / 2);
    const verifyLive = (result: TopicSearchContext) => {
        if (liveVerifyDeadlineAt === undefined || !result.context.trim())
            return resolveVerifiedCredentialProjection(did, result.uri, receipt);

        const verifyBudgetMs = liveVerifyDeadlineAt - performance.now();
        const giveWay = () => new CredentialVerificationUnavailableError('sdk_timeout');

        if (verifyBudgetMs <= 0) return Promise.reject(giveWay());

        let timer: ReturnType<typeof setTimeout> | undefined;

        return Promise.race([
            resolveVerifiedCredentialProjection(did, result.uri, receipt),
            new Promise<never>((_resolve, reject) => {
                timer = setTimeout(() => reject(giveWay()), verifyBudgetMs);
            }),
        ]).finally(() => clearTimeout(timer));
    };
    const loaded: TopicSearchContext[] = [];
    const useStoredText = async (result: TopicSearchContext): Promise<TopicSearchContext> => {
        await assertCredentialConsent(did, result.uri, receipt);
        const category = storedByUri.get(result.uri)?.category;
        return category ? { ...result, type: category } : result;
    };
    const project = async () => {
        for (let start = 0; start < ranked.length && loaded.length < limit; start += limit) {
            throwIfCancelled(signal, deadlineAt);
            let window: TopicSearchContext[];
            try {
                ({ loaded: window } = await settleCredentialBatch(
                    'context',
                    ranked.slice(start, start + limit).map((result, offset) => async () => {
                        const knownBad = knownBadCredentialKind(did, result.uri);
                        if (knownBad === 'invalid')
                            throw markCredentialItemFailure(
                                new Error('Credential verification failed'),
                                'credential_invalid'
                            );
                        if (
                            (preferStoredText || knownBad === 'unverifiable') &&
                            result.context.trim()
                        )
                            return useStoredText(result);
                        let projection;
                        try {
                            projection = await verifyLive(result);
                        } catch (error) {
                            // A read or re-verify that failed for this credential alone
                            // falls back to the stored ingest-time text (verified when it
                            // was ingested, not now). Confirmed-invalid credentials, and
                            // consent, deadline and abort failures, still fail as before.
                            if (
                                !isCredentialItemFailure(error, { signal, deadlineAt }) ||
                                isConfirmedInvalidCredentialFailure(error) ||
                                !result.context.trim()
                            )
                                throw error;
                            const fallback = await useStoredText(result);
                            logCredentialSkip('context', start + offset, ranked.length, error);
                            return fallback;
                        }
                        return {
                            ...result,
                            type: projection.category,
                            context: serializeModelSafeCredentialProjection(projection),
                        };
                    }),
                    { signal, deadlineAt, allowEmpty: true }
                ));
            } catch (error) {
                // Keep what loaded when a later window fails per credential only.
                if (loaded.length && isCredentialItemFailure(error, { signal, deadlineAt })) break;
                throw error;
            }
            loaded.push(...window);
        }
        return loaded.slice(0, limit);
    };
    throwIfCancelled(signal, deadlineAt);
    try {
        return await raceCancellation(project(), signal, deadlineAt);
    } catch (error) {
        if (loaded.length && error instanceof Error && error.name === 'TimeoutError')
            return loaded.slice(0, limit);
        throw error;
    }
};

export const enrichCredentialTitles = async (
    results: TopicSearchContext[],
    did: string,
    options: Pick<CredentialSearchOptions, 'ws' | 'signal'> = {}
): Promise<TopicSearchResult[]> =>
    // Titles are derived from this exact current context, not a prior grant's cache.
    Promise.all(
        results.map(async (result, index) => {
            throwIfCancelled(options.signal, undefined);

            if (getCurrentAiSubject() !== did) throw new AiConsentError();
            const receipt = await assertCurrentAiConsent('model-inference');
            const contextHash = createHmac('sha256', getPrivacyKeyMaterial().reference)
                .update(JSON.stringify([did, receipt.revision, result.context]))
                .digest('hex');
            let title = await db.getCredentialTitle(did, result.uri, contextHash);

            throwIfCancelled(options.signal, undefined);

            if (!title) {
                title = await generateCredentialTitle(result.context, options, index);
                throwIfCancelled(options.signal, undefined);
                await db.updateCredentialTitle(did, result.uri, title, contextHash);
            }

            return { ...result, title };
        })
    );

export const searchCredentialsByTopic = async (
    topic: string,
    did: string,
    options: CredentialSearchOptions = {}
): Promise<TopicSearchResult[]> =>
    runWithLearnCardRequestScope({ signal: options.signal }, async () => {
        const contexts = await searchCredentialContextsByTopic(topic, did, options);

        return enrichCredentialTitles(contexts, did, options);
    });
