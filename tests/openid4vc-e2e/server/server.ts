/**
 * Glue layer that stitches the mini issuer + mini verifier into one
 * `node:http` server. Returns handles (`start` / `stop`) so vitest's
 * globalSetup can bring the server up before tests and tear it down
 * cleanly after.
 *
 * Intentionally uses `node:http` only — no fastify, no express — so
 * this test package has a zero-runtime-dep story.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';

import {
    createIssuerState,
    handleIssuerRequest,
    type HandlerContext,
    type HandlerResponse,
    type IssuerState,
} from './issuer';
import {
    createVerifierState,
    handleVerifierRequest,
    type VerifierState,
} from './verifier';

export interface E2EServerHandle {
    origin: string;
    port: number;
    issuer: IssuerState;
    verifier: VerifierState;
    stop: () => Promise<void>;
}

export const startE2EServer = async (
    options: { port?: number } = {}
): Promise<E2EServerHandle> => {
    // Two-stage bring-up: we need the final port before populating
    // issuer/verifier state (both bake the origin into responses).
    // Solution: allocate the listening socket first, then populate
    // state + attach the request handler.
    const server: Server = createServer();

    await new Promise<void>(resolve =>
        server.listen(options.port ?? 0, '127.0.0.1', () => resolve())
    );

    const address = server.address() as AddressInfo;
    const port = address.port;
    const origin = `http://127.0.0.1:${port}`;

    const state: ServerState = {
        issuer: await createIssuerState(origin),
        verifier: createVerifierState(origin),
    };

    server.on('request', (req, res) => void handleRequest(req, res, state));

    return {
        origin,
        port,
        issuer: state.issuer,
        verifier: state.verifier,
        stop: () =>
            new Promise<void>((resolve, reject) =>
                server.close(err => (err ? reject(err) : resolve()))
            ),
    };
};

/* -------------------------------------------------------------------------- */
/*                              request routing                               */
/* -------------------------------------------------------------------------- */

interface ServerState {
    issuer: IssuerState;
    verifier: VerifierState;
}

const handleRequest = async (
    req: IncomingMessage,
    res: ServerResponse,
    state: ServerState
): Promise<void> => {
    try {
        const body = await readBody(req);
        const ctx = buildContext(req, body, state);

        // Routes prefixed /vp/ go to the verifier; everything else
        // hits the issuer. The issuer has no /vp routes so overlap
        // is impossible.
        const handler = ctx.path.startsWith('/vp/')
            ? await handleVerifierRequest({ ...ctx, verifier: state.verifier })
            : await handleIssuerRequest(ctx);

        if (!handler) {
            writeJson(res, 404, { error: 'not_found', path: ctx.path });
            return;
        }

        writeResponse(res, handler);
    } catch (e) {
        writeJson(res, 500, {
            error: 'internal_server_error',
            message: e instanceof Error ? e.message : String(e),
        });
    }
};

const buildContext = (
    req: IncomingMessage,
    body: string,
    state: ServerState
): HandlerContext => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);

    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === 'string') headers[k.toLowerCase()] = v;
        else if (Array.isArray(v)) headers[k.toLowerCase()] = v.join(', ');
    }

    return {
        state: state.issuer,
        method: (req.method ?? 'GET').toUpperCase(),
        path: url.pathname,
        query: url.searchParams,
        body,
        headers,
    };
};

const readBody = (req: IncomingMessage): Promise<string> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', chunk => chunks.push(Buffer.from(chunk)));
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        req.on('error', reject);
    });

const writeResponse = (res: ServerResponse, handler: HandlerResponse): void => {
    // Redirect short-circuit — the /authorize endpoint returns
    // { location } in the body; we convert to a real 302.
    if (
        handler.status === 302 &&
        handler.body &&
        typeof handler.body === 'object' &&
        'location' in (handler.body as Record<string, unknown>)
    ) {
        const location = (handler.body as { location: string }).location;
        res.statusCode = 302;
        res.setHeader('Location', location);
        res.end();
        return;
    }

    const isString = typeof handler.body === 'string';
    const isBuffer = handler.body instanceof Buffer;
    const body = isString
        ? (handler.body as string)
        : isBuffer
        ? (handler.body as Buffer)
        : JSON.stringify(handler.body);

    const contentType =
        handler.contentType ??
        (isString || isBuffer ? 'text/plain; charset=utf-8' : 'application/json');

    res.statusCode = handler.status;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', Buffer.byteLength(body as string | Buffer));
    res.end(body);
};

const writeJson = (res: ServerResponse, status: number, body: unknown): void => {
    const text = JSON.stringify(body);
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(text));
    res.end(text);
};
