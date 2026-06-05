import { describe, expect, it } from 'vitest';

import {
    createBraveWebSearchProvider,
    createMockWebSearchProvider,
    createWebSearchTool,
    type WebSearchProvider,
    type WebSearchRequest,
    type WebSearchResponse,
} from '../src/tools/webSearch';

const fixedResult = (request: WebSearchRequest): WebSearchResponse => ({
    query: request.query,
    provider: 'mock',
    retrievedAt: '2026-06-05T00:00:00.000Z',
    results: [
        {
            title: 'LearnCard',
            url: 'https://learncard.com',
            snippet: 'Digital credentials platform.',
            rank: 1,
            score: 1,
            retrievedAt: '2026-06-05T00:00:00.000Z',
        },
    ].slice(0, request.limit),
});

describe('webSearch tool', () => {
    it('returns normalized provider results with source attribution and retrieval time', async () => {
        const provider: WebSearchProvider = {
            name: 'mock',
            search: async request => fixedResult(request),
        };
        const tool = createWebSearchTool({ provider });
        const result = await tool.execute(
            { query: ' LearnCard news ', limit: 1 },
            { runId: 'run-1' }
        );

        expect(result).toEqual({
            query: 'LearnCard news',
            provider: 'mock',
            retrievedAt: '2026-06-05T00:00:00.000Z',
            results: [
                {
                    title: 'LearnCard',
                    url: 'https://learncard.com',
                    snippet: 'Digital credentials platform.',
                    rank: 1,
                    score: 1,
                    retrievedAt: '2026-06-05T00:00:00.000Z',
                },
            ],
        });
    });

    it('returns an empty result list when the provider has no matches', async () => {
        const tool = createWebSearchTool({ provider: createMockWebSearchProvider() });

        await expect(
            tool.execute({ query: 'unlikely query' }, { runId: 'run-1' })
        ).resolves.toMatchObject({
            query: 'unlikely query',
            provider: 'mock',
            results: [],
        });
    });

    it('rejects blank and overlong queries with bounded input errors', async () => {
        const tool = createWebSearchTool({ provider: createMockWebSearchProvider() });

        await expect(tool.execute({ query: '   ' }, { runId: 'run-1' })).rejects.toThrow(
            'webSearch query is required.'
        );
        await expect(tool.execute({ query: 'x'.repeat(401) }, { runId: 'run-1' })).rejects.toThrow(
            'webSearch query must be 400 characters or fewer.'
        );
        await expect(
            tool.execute(
                { query: Array.from({ length: 51 }, () => 'word').join(' ') },
                { runId: 'run-1' }
            )
        ).rejects.toThrow('webSearch query must be 50 words or fewer.');
    });

    it('clamps limits and applies normalized defaults', async () => {
        let captured: WebSearchRequest | undefined;
        const provider: WebSearchProvider = {
            name: 'mock',
            search: async request => {
                captured = request;

                return fixedResult(request);
            },
        };
        const tool = createWebSearchTool({
            provider,
            defaultLimit: 4,
            maxLimit: 7,
            defaults: {
                country: 'us',
                searchLang: 'en',
                safeSearch: 'strict',
            },
        });

        await tool.execute({ query: ' trimmed ', limit: 99 }, { runId: 'run-1' });
        expect(captured).toMatchObject({
            query: 'trimmed',
            limit: 7,
            country: 'US',
            searchLang: 'en',
            safeSearch: 'strict',
        });
    });

    it('returns bounded provider failure errors without leaking provider details', async () => {
        const tool = createWebSearchTool({
            provider: {
                name: 'mock',
                search: async () => {
                    throw new Error('secret-token raw response body');
                },
            },
        });

        await expect(tool.execute({ query: 'current info' }, { runId: 'run-1' })).rejects.toThrow(
            'webSearch failed for provider mock.'
        );
    });

    it('keeps the agent-facing shape stable across providers', async () => {
        const mockTool = createWebSearchTool({
            provider: {
                name: 'mock',
                search: async request => fixedResult(request),
            },
        });
        const braveProvider = createBraveWebSearchProvider({
            apiKey: 'test-key',
            fetchImpl: async () =>
                new Response(
                    JSON.stringify({
                        web: {
                            results: [
                                {
                                    title: 'Brave title',
                                    url: 'https://example.com/brave',
                                    description: 'Brave description.',
                                },
                            ],
                        },
                    }),
                    { status: 200 }
                ),
        });
        const braveTool = createWebSearchTool({ provider: braveProvider });
        const mockResult = await mockTool.execute({ query: 'same query' }, { runId: 'run-1' });
        const braveResult = await braveTool.execute({ query: 'same query' }, { runId: 'run-1' });

        expect(Object.keys(mockResult as Record<string, unknown>).sort()).toEqual(
            Object.keys(braveResult as Record<string, unknown>).sort()
        );
        expect(braveResult).toMatchObject({
            query: 'same query',
            provider: 'brave',
            results: [
                {
                    title: 'Brave title',
                    url: 'https://example.com/brave',
                    snippet: 'Brave description.',
                    rank: 1,
                },
            ],
        });
    });
});

describe('Brave web search provider', () => {
    it('maps Brave web results and sends bounded query parameters', async () => {
        let capturedUrl: URL | undefined;
        let capturedToken: string | undefined;
        const provider = createBraveWebSearchProvider({
            apiKey: 'brave-secret',
            fetchImpl: async (input, init) => {
                capturedUrl = new URL(String(input));
                capturedToken = new Headers(init?.headers).get('X-Subscription-Token') ?? undefined;

                return new Response(
                    JSON.stringify({
                        web: {
                            results: [
                                {
                                    title: 'First result',
                                    url: 'https://example.com/first',
                                    description: 'First snippet.',
                                },
                                {
                                    title: 'Second result',
                                    url: 'https://example.com/second',
                                    description: 'Second snippet.',
                                },
                            ],
                        },
                    }),
                    { status: 200 }
                );
            },
        });
        const result = await provider.search({
            query: 'learncard ai',
            limit: 2,
            freshness: 'pw',
            country: 'US',
            searchLang: 'en',
            safeSearch: 'moderate',
        });

        expect(capturedUrl?.origin).toBe('https://api.search.brave.com');
        expect(capturedUrl?.searchParams.get('q')).toBe('learncard ai');
        expect(capturedUrl?.searchParams.get('count')).toBe('2');
        expect(capturedUrl?.searchParams.get('freshness')).toBe('pw');
        expect(capturedUrl?.searchParams.get('country')).toBe('US');
        expect(capturedUrl?.searchParams.get('search_lang')).toBe('en');
        expect(capturedUrl?.searchParams.get('safesearch')).toBe('moderate');
        expect(capturedUrl?.searchParams.get('result_filter')).toBe('web');
        expect(capturedToken).toBe('brave-secret');
        expect(result).toMatchObject({
            query: 'learncard ai',
            provider: 'brave',
            retrievedAt: expect.any(String),
            results: [
                {
                    title: 'First result',
                    url: 'https://example.com/first',
                    snippet: 'First snippet.',
                    rank: 1,
                    score: 1,
                    retrievedAt: expect.any(String),
                },
                {
                    title: 'Second result',
                    url: 'https://example.com/second',
                    snippet: 'Second snippet.',
                    rank: 2,
                    score: 0.5,
                    retrievedAt: expect.any(String),
                },
            ],
        });
    });

    it('handles Brave no-results and failures without exposing response bodies', async () => {
        const emptyProvider = createBraveWebSearchProvider({
            apiKey: 'test-key',
            fetchImpl: async () =>
                new Response(JSON.stringify({ web: { results: [] } }), { status: 200 }),
        });
        const failingProvider = createBraveWebSearchProvider({
            apiKey: 'test-key',
            fetchImpl: async () => new Response('secret raw body', { status: 500 }),
        });

        await expect(emptyProvider.search({ query: 'none', limit: 5 })).resolves.toMatchObject({
            provider: 'brave',
            results: [],
        });
        await expect(failingProvider.search({ query: 'fail', limit: 5 })).rejects.toThrow(
            'Brave Search request failed with status 500.'
        );
    });
});
