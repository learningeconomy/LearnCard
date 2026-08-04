import type { AgentToolDefinition } from '../../agent/types';

export type WebSearchProviderName = 'brave' | 'mock';

export type WebSearchFreshness = 'pd' | 'pw' | 'pm' | 'py' | string;

export type WebSearchSafeSearch = 'off' | 'moderate' | 'strict';

export interface WebSearchRequest {
    query: string;
    limit: number;
    freshness?: WebSearchFreshness;
    country?: string;
    searchLang?: string;
    safeSearch?: WebSearchSafeSearch;
    providerOptions?: Record<string, unknown>;
}

export interface WebSearchResult {
    title: string;
    url: string;
    snippet: string;
    rank: number;
    score?: number;
    retrievedAt: string;
}

export interface WebSearchResponse {
    query: string;
    provider: WebSearchProviderName;
    retrievedAt: string;
    results: WebSearchResult[];
}

export interface WebSearchProvider {
    name: WebSearchProviderName;
    search: (request: WebSearchRequest, signal?: AbortSignal) => Promise<WebSearchResponse>;
}

export interface CreateWebSearchToolOptions {
    provider: WebSearchProvider;
    defaultLimit?: number;
    maxLimit?: number;
    defaults?: {
        country?: string;
        searchLang?: string;
        safeSearch?: WebSearchSafeSearch;
    };
}

export interface BraveWebSearchProviderOptions {
    apiKey: string;
    endpoint?: string;
    fetchImpl?: typeof fetch;
}

export interface MockWebSearchProviderOptions {
    results?: WebSearchResult[];
}

const BRAVE_WEB_SEARCH_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';
const MAX_QUERY_LENGTH = 400;
const MAX_QUERY_WORDS = 50;
const HARD_MAX_RESULTS = 20;
const DEFAULT_LIMIT = 5;
const DEFAULT_MAX_LIMIT = 10;
const SAFE_SEARCH_VALUES = ['off', 'moderate', 'strict'] as const;

class WebSearchInputError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const readString = (value: unknown): string | undefined =>
    typeof value === 'string' ? value.trim() || undefined : undefined;

const readLimit = (value: unknown, fallback: number, maxLimit: number): number => {
    const parsed =
        typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;

    if (!Number.isFinite(parsed)) return fallback;

    return Math.max(1, Math.min(maxLimit, Math.trunc(parsed)));
};

const normalizeMaxLimit = (maxLimit: number | undefined): number =>
    Math.max(1, Math.min(HARD_MAX_RESULTS, Math.trunc(maxLimit ?? DEFAULT_MAX_LIMIT)));

const normalizeDefaultLimit = (defaultLimit: number | undefined, maxLimit: number): number =>
    Math.max(1, Math.min(maxLimit, Math.trunc(defaultLimit ?? DEFAULT_LIMIT)));

const assertQueryBounds = (query: string): void => {
    if (!query) throw new WebSearchInputError('webSearch query is required.');

    if (query.length > MAX_QUERY_LENGTH) {
        throw new WebSearchInputError(
            `webSearch query must be ${MAX_QUERY_LENGTH} characters or fewer.`
        );
    }

    if (query.split(/\s+/).filter(Boolean).length > MAX_QUERY_WORDS) {
        throw new WebSearchInputError(`webSearch query must be ${MAX_QUERY_WORDS} words or fewer.`);
    }
};

const normalizeSafeSearch = (
    value: unknown,
    fallback?: WebSearchSafeSearch
): WebSearchSafeSearch | undefined => {
    const normalized = readString(value) ?? fallback;

    if (!normalized) return undefined;

    if ((SAFE_SEARCH_VALUES as readonly string[]).includes(normalized)) {
        return normalized as WebSearchSafeSearch;
    }

    throw new WebSearchInputError('webSearch safeSearch must be off, moderate, or strict.');
};

const normalizeCountry = (value: unknown, fallback?: string): string | undefined => {
    const normalized = readString(value) ?? fallback;

    if (!normalized) return undefined;

    if (!/^[A-Za-z]{2}$/.test(normalized)) {
        throw new WebSearchInputError('webSearch country must be a 2-character country code.');
    }

    return normalized.toUpperCase();
};

const normalizeSearchLang = (value: unknown, fallback?: string): string | undefined => {
    const normalized = readString(value) ?? fallback;

    if (!normalized) return undefined;

    if (!/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(normalized)) {
        throw new WebSearchInputError('webSearch searchLang must be a valid language code.');
    }

    return normalized;
};

export const normalizeWebSearchToolRequest = (
    args: Record<string, unknown>,
    options: Omit<CreateWebSearchToolOptions, 'provider'>
): WebSearchRequest => {
    const maxLimit = normalizeMaxLimit(options.maxLimit);
    const defaultLimit = normalizeDefaultLimit(options.defaultLimit, maxLimit);
    const query = readString(args.query) ?? '';

    assertQueryBounds(query);

    return {
        query,
        limit: readLimit(args.limit, defaultLimit, maxLimit),
        freshness: readString(args.freshness),
        country: normalizeCountry(args.country, options.defaults?.country),
        searchLang: normalizeSearchLang(args.searchLang, options.defaults?.searchLang),
        safeSearch: normalizeSafeSearch(args.safeSearch, options.defaults?.safeSearch),
    };
};

export const createWebSearchTool = ({
    provider,
    defaultLimit,
    maxLimit,
    defaults,
}: CreateWebSearchToolOptions): AgentToolDefinition => ({
    name: 'webSearch',
    description:
        'Search the current web for time-sensitive facts, recent events, current market or work information, and source-attributed lookups. Use memory tools for durable user context and ConsentFlow tools for approved personal data.',
    parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['query'],
        properties: {
            query: {
                type: 'string',
                description: 'Search query, trimmed and capped at 400 characters or 50 words.',
                maxLength: MAX_QUERY_LENGTH,
            },
            limit: {
                type: 'integer',
                description: 'Number of normalized results to return. Clamped to 1..20.',
                minimum: 1,
                maximum: HARD_MAX_RESULTS,
            },
            freshness: {
                type: 'string',
                description:
                    'Optional freshness hint such as pd, pw, pm, py, or YYYY-MM-DDtoYYYY-MM-DD.',
            },
            country: {
                type: 'string',
                description: 'Optional 2-character country code, such as US.',
                minLength: 2,
                maxLength: 2,
            },
            searchLang: {
                type: 'string',
                description: 'Optional language code, such as en.',
            },
            safeSearch: {
                type: 'string',
                enum: SAFE_SEARCH_VALUES,
                description: 'Optional SafeSearch level.',
            },
        },
    },
    execute: async (args, context) => {
        const request = normalizeWebSearchToolRequest(args, { defaultLimit, maxLimit, defaults });

        try {
            return await provider.search(request, context.signal);
        } catch (error) {
            context.signal?.throwIfAborted();
            if (error instanceof WebSearchInputError) throw error;

            throw new Error(`webSearch failed for provider ${provider.name}.`);
        }
    },
});

const getStringField = (record: Record<string, unknown>, field: string): string | undefined =>
    typeof record[field] === 'string' ? record[field] : undefined;

const getNumberField = (record: Record<string, unknown>, field: string): number | undefined =>
    typeof record[field] === 'number' && Number.isFinite(record[field]) ? record[field] : undefined;

const getBraveWebResults = (payload: unknown): Record<string, unknown>[] => {
    if (!isRecord(payload)) return [];

    const web = payload.web;

    if (!isRecord(web) || !Array.isArray(web.results)) return [];

    return web.results.filter(isRecord);
};

const toBraveResult = (
    result: Record<string, unknown>,
    index: number,
    retrievedAt: string
): WebSearchResult | undefined => {
    const title = getStringField(result, 'title')?.trim();
    const url = getStringField(result, 'url')?.trim();
    const snippet = getStringField(result, 'description')?.trim() ?? '';

    if (!title || !url) return undefined;

    const rank = index + 1;

    return {
        title,
        url,
        snippet,
        rank,
        score: getNumberField(result, 'score') ?? 1 / rank,
        retrievedAt,
    };
};

export const createMockWebSearchProvider = ({
    results = [],
}: MockWebSearchProviderOptions = {}): WebSearchProvider => ({
    name: 'mock',
    search: async (request, signal) => {
        signal?.throwIfAborted();
        const retrievedAt = new Date().toISOString();

        return {
            query: request.query,
            provider: 'mock',
            retrievedAt,
            results: results.slice(0, request.limit).map((result, index) => ({
                ...result,
                rank: index + 1,
                retrievedAt,
            })),
        };
    },
});

export const createBraveWebSearchProvider = ({
    apiKey,
    endpoint = BRAVE_WEB_SEARCH_ENDPOINT,
    fetchImpl = fetch,
}: BraveWebSearchProviderOptions): WebSearchProvider => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) throw new Error('BRAVE_SEARCH_API_KEY is required for Brave web search.');

    return {
        name: 'brave',
        search: async (request, signal) => {
            signal?.throwIfAborted();
            const retrievedAt = new Date().toISOString();
            const url = new URL(endpoint);

            url.searchParams.set('q', request.query);
            url.searchParams.set(
                'count',
                String(Math.max(1, Math.min(HARD_MAX_RESULTS, request.limit)))
            );
            url.searchParams.set('result_filter', 'web');

            if (request.freshness) url.searchParams.set('freshness', request.freshness);
            if (request.country) url.searchParams.set('country', request.country);
            if (request.searchLang) url.searchParams.set('search_lang', request.searchLang);
            if (request.safeSearch) url.searchParams.set('safesearch', request.safeSearch);

            const response = await fetchImpl(url, {
                headers: {
                    Accept: 'application/json',
                    'X-Subscription-Token': trimmedKey,
                },
                ...(signal ? { signal } : {}),
            });

            if (!response.ok) {
                throw new Error(`Brave Search request failed with status ${response.status}.`);
            }

            signal?.throwIfAborted();
            const payload = (await response.json()) as unknown;
            const results = getBraveWebResults(payload)
                .map((result, index) => toBraveResult(result, index, retrievedAt))
                .filter((result): result is WebSearchResult => Boolean(result))
                .slice(0, request.limit);

            return {
                query: request.query,
                provider: 'brave',
                retrievedAt,
                results,
            };
        },
    };
};
