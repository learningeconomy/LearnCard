import type { FastifyInstance } from 'fastify';
import type {
    APIGatewayProxyEvent,
    APIGatewayProxyEventV2,
    APIGatewayProxyResult,
    Context,
} from 'aws-lambda';
import { Transform } from 'node:stream';

// This leaves headroom below Lambda's 6 MB synchronous invocation envelope. It is a byte limit,
// rather than an item limit, because large CLR credentials can make a small batch very large.
export const INBOX_BATCH_MAX_BYTES = 4 * 1024 * 1024;
const MESSAGE = 'Inbox batch exceeds the 4 MiB JSON payload limit';

const requestPath = (url: string): string => {
    try {
        return decodeURIComponent(url.split('?')[0]!).replace(/\/$/, '');
    } catch {
        return url.split('?')[0]!;
    }
};

/**
 * Identifies only the batch procedure across REST and tRPC transports. A tRPC URL may contain
 * comma-separated procedures when the client batches calls, so any batch-issuance member raises
 * the parser allowance for the shared request.
 */
export const isInboxBatchRequest = (url: string): boolean => {
    const path = requestPath(url);
    return (
        path === '/api/inbox/issue-batch' ||
        path === '/inbox/issue-batch' ||
        (path.startsWith('/trpc/') &&
            path.slice('/trpc/'.length).split(',').includes('inbox.issueBatch'))
    );
};

/**
 * Gives adapter wildcard routes a 4 MiB parser ceiling, then enforces the real per-procedure
 * limit in preParsing. trpc-to-openapi and tRPC each register one catch-all Fastify route, so
 * setting a limit on `/api/inbox/issue-batch` would never run in the Docker server.
 * Other procedures retain the server's default budget here. Future procedures needing a
 * different budget must update this selector as well as the shared parser ceiling; a route
 * bodyLimit alone cannot override this streaming guard.
 */
export const configureInboxBatchBodyLimit = (server: FastifyInstance): void => {
    const defaultLimit = server.initialConfig.bodyLimit ?? 1024 * 1024;
    server.addHook('onRoute', options => {
        // Both adapters register catch-all routes, not one Fastify route per procedure.
        if (options.url.startsWith('/api/') || options.url.startsWith('/trpc/')) {
            options.bodyLimit = INBOX_BATCH_MAX_BYTES;
        }
    });
    server.addHook('preParsing', async (request, _reply, payload) => {
        const path = requestPath(request.url);
        if (!path.startsWith('/api/') && !path.startsWith('/trpc/')) return payload;
        const limit = isInboxBatchRequest(request.url) ? INBOX_BATCH_MAX_BYTES : defaultLimit;
        const tooLarge = (): Error =>
            Object.assign(new Error('Request body is too large'), {
                statusCode: 413,
                code: 'FST_ERR_CTP_BODY_TOO_LARGE',
            });
        if (Number(request.headers['content-length']) > limit) throw tooLarge();
        // Count actual bytes as well: Content-Length is optional and client controlled. Fastify
        // requires receivedEncodedLength on replacement streams to retain its normal accounting.
        let bytes = 0;
        const stream = new Transform({
            transform(chunk, _encoding, callback) {
                bytes += chunk.length;
                if (bytes > limit) callback(tooLarge());
                else callback(null, chunk);
            },
        });
        Object.defineProperty(stream, 'receivedEncodedLength', { get: () => bytes });
        payload.once('error', error => stream.destroy(error));
        return payload.pipe(stream);
    });
};

/** REST adapters bypass Fastify onSend hooks. Keep the documented 202 in src/openapi.ts in sync. */
export const inboxBatchResponseMeta = ({
    paths,
    errors,
}: {
    paths?: readonly string[];
    errors: readonly unknown[];
}): { status?: number } =>
    !errors.length && paths?.includes('inbox.issueBatch') ? { status: 202 } : {};

type GatewayEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2;

/**
 * Enforces decoded request bytes before either Lambda adapter parses JSON or creates a context.
 * API Gateway can base64 encode binary bodies; their encoded string length is not the payload size.
 * The wrapper also mirrors each transport's error envelope so SDK clients retain normal semantics.
 */
export const withInboxBatchBodyLimit =
    <TEvent extends GatewayEvent, TResult>(
        handler: (event: TEvent, context: Context) => Promise<TResult>,
        transport: 'openapi' | 'trpc'
    ): ((event: TEvent, context: Context) => Promise<TResult | APIGatewayProxyResult>) =>
    async (event, context) => {
        const route = event.pathParameters?.trpc;
        // `trpc` is a path parameter in deployed Lambda events, while local/OpenAPI events expose
        // the concrete path. Normalize both forms before applying the same route predicate.
        let path: string;
        if (route) {
            const prefix = transport === 'trpc' ? '/trpc' : '';
            path = `${prefix}/${route.replace(/^\//, '')}`;
        } else if ('rawPath' in event) {
            path = event.rawPath;
        } else {
            path = event.path;
        }
        const bytes = event.isBase64Encoded
            ? Buffer.from(event.body ?? '', 'base64').length
            : Buffer.byteLength(event.body ?? '', 'utf8');
        if (isInboxBatchRequest(path) && bytes > INBOX_BATCH_MAX_BYTES) {
            // A tRPC batch expects one response entry per requested procedure, including this
            // transport-level failure, whereas REST returns its ordinary error object.
            // REST matches trpc-to-openapi's { message, code } validation envelope, rather
            // than the shim's { error: ... } fallback for unexpected adapter exceptions.
            const paths = requestPath(path)
                .replace(/^\/trpc\//, '')
                .split(',');
            const errors = paths.map(procedure => ({
                error: {
                    message: MESSAGE,
                    code: -32013,
                    data: { code: 'PAYLOAD_TOO_LARGE', httpStatus: 413, path: procedure },
                },
            }));
            const batched =
                event.queryStringParameters?.batch === '1' ||
                ('rawQueryString' in event &&
                    new URLSearchParams(event.rawQueryString).get('batch') === '1');
            return {
                statusCode: 413,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify(
                    transport === 'openapi'
                        ? { message: MESSAGE, code: 'PAYLOAD_TOO_LARGE' }
                        : batched
                          ? errors
                          : errors[0]
                ),
            };
        }
        return handler(event, context);
    };
