/**
 * Counts outbound HTTP requests by class so the summary can report how many
 * escrow (enclave-bound) calls the run actually made. Records only the class and
 * the status bucket: never URLs, headers or bodies. The one exception is a 429
 * from an escrow route, whose body `message` is compared (and then discarded)
 * with lca-api's fixed per-IP PIN limiter text, so limiter refusals can be told
 * apart from other 429s (a held PIN-operation lease, lifetime lock).
 */
export type RequestClass = 'escrow' | 'keys' | 'lca_other' | 'firebase' | 'other';

export interface RequestCounter {
    count: number;
    ok: number;
    status409: number;
    status429: number;
    /** Of `status429`: lca-api's per-client-IP PIN limiter. */
    throttledByClientIp: number;
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
    throttledByClientIp: 0,
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

/**
 * lca-api `pinThrottledMessage` (`src/routes/escrow.ts`), returned with 429 by
 * `limitPinCompletion` for `escrow:pin-start:<ip>` / `escrow:pin-complete:<ip>`
 * (more than 20 per 60 s window). The same text is also used once the PIN's
 * lifetime wrong-entry budget is spent, which this tool never causes (it always
 * sends the right PIN).
 */
export const PIN_CLIENT_IP_THROTTLE_MESSAGE = 'Please wait before trying again.';

/** One escrow response seen inside an observed scenario: route and status only. */
export interface EscrowResponse {
    /** Route below `/keys/escrow`, e.g. `/recover`, `/complete`; no query string. */
    path: string;
    status: number;
    throttledByClientIp: boolean;
}

export type EscrowObserver = (response: EscrowResponse) => void;

const isClientIpThrottle = async (response: Response): Promise<boolean> => {
    try {
        const body: unknown = await response.clone().json();
        return (
            !!body &&
            typeof body === 'object' &&
            'message' in body &&
            body.message === PIN_CLIENT_IP_THROTTLE_MESSAGE
        );
    } catch {
        return false;
    }
};

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

/**
 * `observer` returns the current scenario's escrow observer (the load script
 * keeps it in an AsyncLocalStorage), if any.
 */
export const instrumentFetch = (
    base: typeof fetch,
    serverUrl: string,
    counters: RequestCounters,
    observer: () => EscrowObserver | undefined = () => undefined
): typeof fetch => {
    const wrapped = async (
        input: Parameters<typeof fetch>[0],
        init?: Parameters<typeof fetch>[1]
    ): Promise<Response> => {
        const url = urlOf(input);
        const requestClass = classifyRequest(url, serverUrl);
        const counter = counters[requestClass];
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
        if (requestClass !== 'escrow') return response;
        const throttledByClientIp = response.status === 429 && (await isClientIpThrottle(response));
        if (throttledByClientIp) counter.throttledByClientIp += 1;
        observer()?.({
            path: url.slice(`${serverUrl}/keys/escrow`.length).split('?')[0],
            status: response.status,
            throttledByClientIp,
        });
        return response;
    };
    return wrapped as typeof fetch;
};
