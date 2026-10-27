export const MAX_HTTP_REQUEST_BODY_BYTES = 6 * 1024 * 1024;
export const REQUEST_BODY_TIMEOUT_MS = 30_000;
export const MAX_PUBLIC_REQUEST_BODY_BYTES = 64 * 1024;
export const MAX_AUTH_REQUEST_BODY_BYTES = 256 * 1024;
export const MAX_CONCURRENT_HTTP_BODIES = 16;

type JsonResponse = (data: unknown, status?: number) => Response;

export class RequestBodyError extends Error {
    constructor(
        readonly status: number,
        readonly code: string,
        message: string
    ) {
        super(message);
    }
}

export const cancelRequestBody = (req: Request): void => {
    void req.body?.cancel().catch(() => {});
};

const invalidBody = () => new RequestBodyError(400, 'invalid_request_body', 'Invalid request body');
const tooLarge = () =>
    new RequestBodyError(413, 'request_body_too_large', 'Request body is too large');

export const validateRequestBodyHeaders = (req: Request, maxBytes: number): void => {
    const contentLength = req.headers.get('content-length');
    if (contentLength !== null) {
        if (!/^\d+$/.test(contentLength)) throw invalidBody();
        if (Number(contentLength) > maxBytes) throw tooLarge();
    }
    const encoding = req.headers.get('content-encoding')?.trim().toLowerCase();
    if (encoding && encoding !== 'identity') {
        throw new RequestBodyError(
            415,
            'unsupported_request_encoding',
            'Compressed request bodies are not supported'
        );
    }
};

/** Count actual bytes before any text, JSON or multipart decoder receives them. */
export const readBoundedRequestBody = async (
    req: Request,
    maxBytes: number,
    timeoutMs = REQUEST_BODY_TIMEOUT_MS
): Promise<Uint8Array<ArrayBuffer>> => {
    validateRequestBodyHeaders(req, maxBytes);
    if (!req.body || req.signal.aborted) throw invalidBody();
    const reader = req.body.getReader();
    const bytes = new Uint8Array(maxBytes);
    let length = 0;
    const interrupted = Promise.withResolvers<never>();
    const interrupt = (error: RequestBodyError) => {
        interrupted.reject(error);
        void reader.cancel().catch(() => {});
    };
    const onAbort = () => interrupt(invalidBody());
    const timer = setTimeout(
        () =>
            interrupt(
                new RequestBodyError(408, 'request_body_timeout', 'Request body took too long')
            ),
        timeoutMs
    );
    req.signal.addEventListener('abort', onAbort, { once: true });
    try {
        // Both inputs retain rejection handlers after the other input wins.
        return await Promise.race([
            (async () => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value.byteLength > bytes.byteLength - length) {
                        void reader.cancel().catch(() => {});
                        throw tooLarge();
                    }
                    bytes.set(value, length);
                    length += value.byteLength;
                }
                // A short body must not retain the whole route-sized scratch buffer.
                return length === bytes.byteLength ? bytes : bytes.slice(0, length);
            })(),
            interrupted.promise,
        ]);
    } catch (error) {
        if (error instanceof RequestBodyError) throw error;
        throw invalidBody();
    } finally {
        clearTimeout(timer);
        req.signal.removeEventListener('abort', onAbort);
        reader.releaseLock();
    }
};

const requestBodyLimit = (pathname: string): number => {
    if (pathname === '/credentials/parse-file/reservations') return 0;
    if (pathname.startsWith('/auth/')) return MAX_AUTH_REQUEST_BODY_BYTES;
    if (pathname.startsWith('/insights/') || pathname.startsWith('/oauth/'))
        return MAX_PUBLIC_REQUEST_BODY_BYTES;
    return MAX_HTTP_REQUEST_BODY_BYTES;
};

/** Bound concurrent non-upload reads before auth or route-specific decoding. */
export const createHttpRequestBodyGuard = ({
    maxConcurrentRequests = MAX_CONCURRENT_HTTP_BODIES,
    bodyTimeoutMs = REQUEST_BODY_TIMEOUT_MS,
} = {}) => {
    let active = 0;
    return async <T>(
        req: Request,
        respond: JsonResponse,
        operation: (boundedRequest: Request) => Promise<T>
    ): Promise<T | Response> => {
        const pathname = new URL(req.url).pathname;
        // On Bun, accessing req.body before async authentication can empty its stream.
        // Check the upload path first to defer stream initialization.
        // Uploads have their own authenticated admission held through extraction.
        if ((pathname === '/credentials/parse-file' && req.method === 'POST') || !req.body) {
            try {
                return await operation(req);
            } finally {
                cancelRequestBody(req);
            }
        }
        if (active >= maxConcurrentRequests) {
            cancelRequestBody(req);
            const response = respond(
                {
                    error: 'Requests are busy. Please try again shortly.',
                    code: 'request_capacity_exceeded',
                },
                503
            );
            response.headers.set('Retry-After', '5');
            return response;
        }
        active += 1;
        let boundedRequest: Request;
        try {
            const bytes = await readBoundedRequestBody(
                req,
                requestBodyLimit(pathname),
                bodyTimeoutMs
            );
            boundedRequest = new Request(req, {
                method: req.method,
                body: bytes,
            });
        } catch (error) {
            if (!(error instanceof RequestBodyError)) throw error;
            return respond({ error: error.message, code: error.code }, error.status);
        } finally {
            active -= 1;
            cancelRequestBody(req);
        }
        // Model/database latency must not occupy a shared body-reader slot.
        return operation(boundedRequest);
    };
};
