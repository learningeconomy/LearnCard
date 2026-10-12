import type { StagingGlobal } from './contracts';
/** Explicit staging-only configuration: never inherit the SDK's production defaults. */
export const staging = Object.freeze({
    network: 'https://staging.network.learncard.com/trpc',
    cloud: 'https://staging.cloud.learncard.com/trpc',
    account: 'https://staging.api.learncard.app/api',
});

const origins = new Set([new URL(staging.network).origin, new URL(staging.cloud).origin]);

/** JSON objects have no key order; Swift serialization may reorder fixture dictionaries. */
export const canonicalJSON = (value: unknown): string =>
    JSON.stringify(value, (_key, item) =>
        item && typeof item === 'object' && !Array.isArray(item)
            ? Object.fromEntries(
                  Object.keys(item)
                      .sort()
                      .map(key => [key, item[key]])
              )
            : item
    );

/** Bound SDK fetches to the two staging services; reject redirects before forwarding auth. */
export const installStagingFetch = (): void => {
    const handler = (globalThis as typeof globalThis & StagingGlobal).webkit?.messageHandlers
        ?.stagingTransport;
    const original: typeof fetch = handler
        ? async (input, init) => {
              const request = new Request(input, init);
              const response = await handler.postMessage({
                  url: request.url,
                  method: request.method,
                  headers: Object.fromEntries(request.headers.entries()),
                  body: await request.text(),
              });
              const result = new Response(response.body, {
                  status: response.status,
                  headers: { 'Content-Type': response.contentType },
              });
              // WASM reqwest reads Response.url; constructed responses otherwise report "".
              Object.defineProperty(result, 'url', { value: request.url });
              return result;
          }
        : globalThis.fetch.bind(globalThis);
    globalThis.fetch = async (input, init) => {
        const url = new URL(input instanceof Request ? input.url : String(input));
        if (!origins.has(url.origin) || url.username || url.password) {
            throw new Error(`The staging spike refused service: ${url.origin}`);
        }
        return original(input, {
            ...init,
            credentials: 'omit',
            redirect: 'error',
            signal: init?.signal ?? AbortSignal.timeout(20_000),
        });
    };
};
