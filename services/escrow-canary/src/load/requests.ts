/**
 * Counts outbound HTTP requests by class so the summary can report how many
 * escrow (enclave-bound) calls the run actually made. Records only the class and
 * the status bucket: never URLs, headers or bodies.
 */
export type RequestClass = 'escrow' | 'keys' | 'lca_other' | 'firebase' | 'other';

export interface RequestCounter {
    count: number;
    ok: number;
    status409: number;
    status429: number;
    status4xx: number;
    status5xx: number;
    transport: number;
}

export type RequestCounters = Record<RequestClass, RequestCounter>;

const empty = (): RequestCounter => ({
    count: 0,
    ok: 0,
    status409: 0,
    status429: 0,
    status4xx: 0,
    status5xx: 0,
    transport: 0,
});

export const newRequestCounters = (): RequestCounters => ({
    escrow: empty(),
    keys: empty(),
    lca_other: empty(),
    firebase: empty(),
    other: empty(),
});

const urlOf = (input: Parameters<typeof fetch>[0]): string => {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.href;
    return input.url;
};

export const classifyRequest = (url: string, serverUrl: string): RequestClass => {
    if (url.startsWith(`${serverUrl}/`)) {
        const path = url.slice(serverUrl.length).split('?')[0];
        if (path === '/keys/escrow' || path.startsWith('/keys/escrow/')) return 'escrow';
        if (path.startsWith('/keys/') || path === '/keys') return 'keys';
        return 'lca_other';
    }
    try {
        const host = new URL(url).hostname;
        if (host === 'googleapis.com' || host.endsWith('.googleapis.com')) return 'firebase';
    } catch {
        return 'other';
    }
    return 'other';
};

export const instrumentFetch = (
    base: typeof fetch,
    serverUrl: string,
    counters: RequestCounters
): typeof fetch => {
    const wrapped = async (
        input: Parameters<typeof fetch>[0],
        init?: Parameters<typeof fetch>[1]
    ): Promise<Response> => {
        const counter = counters[classifyRequest(urlOf(input), serverUrl)];
        counter.count += 1;
        let response: Response;
        try {
            response = await base(input, init);
        } catch (error) {
            counter.transport += 1;
            throw error;
        }
        if (response.ok) counter.ok += 1;
        else if (response.status === 409) counter.status409 += 1;
        else if (response.status === 429) counter.status429 += 1;
        else if (response.status >= 500) counter.status5xx += 1;
        else if (response.status >= 400) counter.status4xx += 1;
        return response;
    };
    return wrapped as typeof fetch;
};
