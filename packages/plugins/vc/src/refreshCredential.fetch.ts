export type PinnedAddress = { address: string; family: 4 | 6 };

type NodeLookupCallback = (
    error: Error | null,
    address: string | Array<PinnedAddress>,
    family?: number
) => void;

type NodeResponse = {
    statusCode?: number;
    statusMessage?: string;
    headers: Record<string, string | string[] | undefined>;
    on: (event: string, listener: (...args: unknown[]) => void) => void;
    destroy: (error?: Error) => void;
};

type NodeRequest = {
    on: (event: string, listener: (error: Error) => void) => void;
    end: () => void;
};

type NodeHttpClient = {
    request: (
        url: URL,
        options: Record<string, unknown>,
        onResponse: (response: NodeResponse) => void
    ) => NodeRequest;
};

const isNodeRuntime = typeof process !== 'undefined' && !!process.versions?.node;

const toResponseHeaders = (headers: Record<string, string | string[] | undefined>): Headers => {
    const result = new Headers();

    for (const [name, value] of Object.entries(headers)) {
        if (Array.isArray(value)) value.forEach(entry => result.append(name, entry));
        else if (value !== undefined) result.append(name, value);
    }

    return result;
};

/**
 * Fetches through an already-validated IP address in Node without changing the URL
 * hostname. Keeping the original URL lets Node perform SNI and certificate hostname
 * verification against the refresh endpoint while the custom lookup prevents a
 * second, potentially rebound DNS answer from selecting the socket destination.
 * Browsers do not expose connection-level DNS controls and therefore use native fetch.
 */
export const fetchWithPinnedAddress = async (
    url: URL,
    init: RequestInit,
    pinnedAddress?: PinnedAddress
): Promise<Response> => {
    if (!isNodeRuntime || !pinnedAddress) return globalThis.fetch(url.href, init);

    const specifier = url.protocol === 'https:' ? 'node:https' : 'node:http';
    const client = (await import(/* @vite-ignore */ specifier)) as unknown as NodeHttpClient;

    return new Promise<Response>((resolve, reject) => {
        const lookup = (
            _hostname: string,
            options: { all?: boolean },
            callback: NodeLookupCallback
        ): void => {
            if (options?.all) callback(null, [pinnedAddress]);
            else callback(null, pinnedAddress.address, pinnedAddress.family);
        };

        let request: NodeRequest;

        try {
            const headers = Object.fromEntries(new Headers(init.headers).entries());

            headers['accept-encoding'] = 'identity';

            request = client.request(
                url,
                {
                    method: init.method,
                    headers,
                    signal: init.signal,
                    lookup,
                    // A shared agent could reuse a socket created for a different DNS
                    // answer and bypass this request's validated pin.
                    agent: false,
                    ...(url.protocol === 'https:' ? { servername: url.hostname } : {}),
                },
                nodeResponse => {
                    const status = nodeResponse.statusCode ?? 0;
                    const hasBody = status !== 204 && status !== 205 && status !== 304;
                    const body = hasBody
                        ? new ReadableStream<Uint8Array>({
                              start(controller) {
                                  nodeResponse.on('data', chunk => {
                                      if (typeof chunk === 'string') {
                                          controller.enqueue(new TextEncoder().encode(chunk));
                                      } else if (chunk instanceof Uint8Array) {
                                          controller.enqueue(chunk);
                                      } else {
                                          controller.error(
                                              new TypeError('Unsupported response chunk')
                                          );
                                      }
                                  });
                                  nodeResponse.on('end', () => controller.close());
                                  nodeResponse.on('error', error => controller.error(error));
                                  nodeResponse.on('aborted', () =>
                                      controller.error(
                                          new DOMException(
                                              'The operation was aborted',
                                              'AbortError'
                                          )
                                      )
                                  );
                              },
                              cancel(reason) {
                                  nodeResponse.destroy(
                                      reason instanceof Error ? reason : new Error(String(reason))
                                  );
                              },
                          })
                        : null;

                    resolve(
                        new Response(body, {
                            status,
                            statusText: nodeResponse.statusMessage,
                            headers: toResponseHeaders(nodeResponse.headers),
                        })
                    );
                }
            );
        } catch (error) {
            reject(error);
            return;
        }

        request.on('error', reject);
        request.end();
    });
};
