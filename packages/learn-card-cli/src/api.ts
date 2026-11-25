import type { Command } from 'commander';

import { out } from './out';
import { CliError, UsageError } from './errors';
import {
    assertProjectNetwork,
    loadProject,
    resolveServices,
    type Project,
    type ProjectOptions,
} from './project';
import { toJsonSafe, type JsonValue } from './serialize';
import { defaultJsonInputIo, readJsonInput, type JsonInputIo } from './json-input';
import type { RunCommand } from './doctor';

export interface ApiOptions extends Pick<ProjectOptions, 'network' | 'json' | 'yes'> {
    /** JSON request body (inline, `@file`, or `-` for stdin). */
    data?: string;
    /** `key=value` query parameters (repeatable). */
    query?: string[];
    /** Allow methods other than GET/HEAD. `-y` never implies this. */
    write?: boolean;
    /** Print the request (token masked) without sending it. */
    dryRun?: boolean;
    /** Print the OpenAPI spec URL instead of calling the API. */
    spec?: boolean;
    /** With `--spec`: download the public spec and list its operations. */
    fetch?: boolean;
    /** Request timeout in seconds (default: 30). */
    timeout?: string;
}

export interface ApiDeps {
    fetch: typeof fetch;
    io: JsonInputIo;
    env: Record<string, string | undefined>;
}

const defaultDeps = (): ApiDeps => ({
    fetch: (...args) => globalThis.fetch(...args),
    io: defaultJsonInputIo,
    env: process.env,
});

export const API_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type ApiMethod = (typeof API_METHODS)[number];
const READ_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD']);

/**
 * GET routes that change state on the server despite their verb (e.g. one-click email links).
 * They need `--write` like any other mutation. Patterns match the canonical route path from
 * {@link routePathCandidates}; trpc-to-openapi matches routes case-insensitively, hence `i`.
 * Keep in sync with brain-service routes (audit: every OpenAPI `method: 'GET'` handler).
 */
export const SIDE_EFFECT_GET_PATHS: readonly RegExp[] = [
    // inbox.approveGuardianRequestByPath: validates the token, approves the requester's
    // profile, queues a PROFILE_PARENT_APPROVED notification, emails the requester and
    // marks the token used. Any segment is a token on GET (send/approve are POST-only).
    /^\/inbox\/guardian-approval\/[^/]+$/i,
    // utilities.getChallenges: generates up to 100 challenges and registers them as valid
    // auth challenges for the caller's DID (setValidChallengesForDid).
    /^\/challenges$/i,
];

/** Origin used only to parse a path the way the request URL will be built; never contacted. */
const CLASSIFY_ORIGIN = 'http://learncard.invalid';

/** Decode valid `%XX` runs; leave malformed escapes as they are instead of throwing. */
const safeDecodePath = (path: string): string =>
    path.replace(/(?:%[0-9a-f]{2})+/gi, run => {
        try {
            return decodeURIComponent(run);
        } catch {
            return run;
        }
    });

/** Collapse duplicate slashes and strip trailing ones, keeping a bare `/`. */
const canonicalRoutePath = (pathname: string): string =>
    pathname.replace(/\/{2,}/g, '/').replace(/(.)\/+$/, '$1');

/** Parse a path with the WHATWG URL parser, as the request URL and the server adapters do. */
const parsedPathname = (path: string): string =>
    new URL(`${CLASSIFY_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`).pathname;

/** Upper bound on decode + re-parse rounds; each round must change the path to continue. */
const MAX_DECODE_ROUNDS = 8;

/**
 * Canonical forms of the route path the server may see for `apiPath` (relative to the REST
 * base): parsed with the WHATWG URL parser like the real request (so `\` becomes `/`, the
 * query and fragment are dropped), with duplicate and trailing slashes removed, both
 * percent-encoded (what the Fastify router matches) and decoded. The decoded path is parsed
 * again, as the production Lambda adapter does (API Gateway decodes the path parameter and
 * trpc-to-openapi re-parses it with `new URL()`), so encoded delimiters such as `%5C`, `%3F`,
 * `%23`, `%20`, `%09` or `..%2F` resolve to the route they reach. Repeats until stable.
 */
export const routePathCandidates = (apiPath: string): string[] => {
    const candidates = new Set<string>();
    let current = parsedPathname(apiPath);
    for (let round = 0; round < MAX_DECODE_ROUNDS; round += 1) {
        const decoded = safeDecodePath(current);
        const reparsed = parsedPathname(decoded);
        for (const path of [current, decoded, reparsed]) candidates.add(canonicalRoutePath(path));
        if (reparsed === current) break;
        current = reparsed;
    }
    return [...candidates];
};

/** Whether a request only reads: GET/HEAD and not a known side-effecting GET route. */
export const isReadRequest = (httpMethod: string, apiPath: string): boolean =>
    READ_METHODS.has(httpMethod) &&
    !routePathCandidates(apiPath).some(candidate =>
        SIDE_EFFECT_GET_PATHS.some(pattern => pattern.test(candidate))
    );

export const DEFAULT_API_TIMEOUT_SECONDS = 30;
/** Error bodies longer than this are truncated in the envelope's `detail`. */
export const MAX_ERROR_DETAIL_BYTES = 4096;
const MASKED_AUTHORIZATION = 'Bearer ***';

export interface ApiUrls {
    /** REST base, e.g. https://network.learncard.com/api */
    apiBase: string;
    /** OpenAPI document, e.g. https://network.learncard.com/docs/openapi.json */
    specUrl: string;
    /** Interactive API reference, e.g. https://network.learncard.com/docs */
    docsUrl: string;
}

/**
 * Derive REST URLs from a resolved tRPC network URL. The brain service mounts tRPC at
 * `/trpc`, the OpenAPI adapter at `/api` and the spec at `/docs/openapi.json` on the same
 * root, so `https://host/prefix/trpc` → `https://host/prefix/api`.
 */
export const deriveApiUrls = (networkUrl: string): ApiUrls => {
    const url = new URL(networkUrl);
    const root = url.pathname.replace(/\/+$/, '').replace(/\/(trpc|api)$/, '');
    const base = `${url.origin}${root}`;
    return {
        apiBase: `${base}/api`,
        specUrl: `${base}/docs/openapi.json`,
        docsUrl: `${base}/docs`,
    };
};

export type ApiTokenSource = 'LEARNCARD_API_KEY' | '.env API_TOKEN';

/**
 * The bearer token for `api`: `LEARNCARD_API_KEY` from the environment wins, then
 * `API_TOKEN` from this folder's `.env` (written by `npx @learncard/cli token`).
 */
export const resolveApiToken = (
    projectEnv: Record<string, string>,
    runtime: Record<string, string | undefined>
): { token: string; source: ApiTokenSource } | undefined => {
    const fromEnv = runtime.LEARNCARD_API_KEY?.trim();
    if (fromEnv) return { token: fromEnv, source: 'LEARNCARD_API_KEY' };
    const fromProject = projectEnv.API_TOKEN?.trim();
    if (fromProject) return { token: fromProject, source: '.env API_TOKEN' };
    return undefined;
};

export const parseApiMethod = (method: string): ApiMethod => {
    const upper = method.toUpperCase();
    if (!(API_METHODS as readonly string[]).includes(upper))
        throw new UsageError(`Unknown HTTP method "${method}". Use ${API_METHODS.join(', ')}.`);
    return upper as ApiMethod;
};

/**
 * Validate an API path and drop a redundant `/api` prefix. Only paths on the network's own
 * REST base are allowed, so the token can never be sent to another host.
 */
export const normalizeApiPath = (path: string): string => {
    const trimmed = path.trim();
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith('//'))
        throw new UsageError(
            `"${path}" is a URL. Pass a path on the network's REST API, e.g. /profile.`,
            'Pick the host with --network production|staging|local|<tRPC URL>.'
        );
    if (!trimmed.startsWith('/'))
        throw new UsageError(`API path "${path}" must start with "/", e.g. /profile.`);
    // A fragment is never sent, so the server would route on a different path than shown.
    if (trimmed.includes('#'))
        throw new UsageError(
            `API path "${path}" must not contain "#": URL fragments are never sent to the server.`
        );
    // The URL parser treats `\` like `/` and decodes `%2e` before resolving dot segments,
    // so `/%2e%2e/x` and `/..\x` would otherwise climb out of the /api base.
    if (
        trimmed
            .split('?')[0]!
            .split(/[/\\]/)
            .some(segment => /^(?:\.|%2e){1,2}$/i.test(segment))
    )
        throw new UsageError(`API path "${path}" must not contain "." or ".." segments.`);
    return trimmed.replace(/^\/api(?=\/|$|\?)/, '') || '/';
};

/** Parse repeated `--query key=value` flags. */
export const parseQuery = (pairs: readonly string[] = []): [string, string][] =>
    pairs.map(pair => {
        const index = pair.indexOf('=');
        if (index <= 0)
            throw new UsageError(`--query "${pair}" must be key=value (e.g. --query limit=10).`);
        return [pair.slice(0, index), pair.slice(index + 1)];
    });

export const parseTimeoutSeconds = (value: string | undefined): number => {
    if (value === undefined) return DEFAULT_API_TIMEOUT_SECONDS;
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds <= 0)
        throw new UsageError(`Invalid --timeout "${value}". Use a positive number of seconds.`);
    return seconds;
};

/** Build the full request URL: base + path + existing and `--query` parameters. */
export const buildApiUrl = (
    apiBase: string,
    path: string,
    query: readonly [string, string][]
): string => {
    const base = new URL(apiBase);
    const url = new URL(`${apiBase}${path}`);
    const basePath = base.pathname.replace(/\/+$/, '');
    // Defense in depth: the bearer token may only go to the network's own REST base.
    if (
        url.origin !== base.origin ||
        (url.pathname !== basePath && !url.pathname.startsWith(`${basePath}/`))
    )
        throw new UsageError(`API path "${path}" resolves outside ${apiBase}.`);
    for (const [key, value] of query) url.searchParams.append(key, value);
    return url.toString();
};

/** The path of a built request URL relative to the REST base (what the server routes on). */
export const routePathOf = (apiBase: string, url: string): string => {
    const basePath = new URL(apiBase).pathname.replace(/\/+$/, '');
    return new URL(url).pathname.slice(basePath.length) || '/';
};

const truncate = (text: string, maxBytes: number): string => {
    const bytes = Buffer.from(text, 'utf8');
    if (bytes.byteLength <= maxBytes) return text;
    return `${bytes.subarray(0, maxBytes).toString('utf8')}… [truncated ${bytes.byteLength - maxBytes} bytes]`;
};

const scrubToken = (text: string, token: string | undefined): string =>
    token ? text.split(token).join('***') : text;

const statusHint = (status: number): string | undefined => {
    if (status === 401)
        return 'The token was rejected. Create a new one with `npx @learncard/cli token --scope "<scopes>"` or set LEARNCARD_API_KEY.';
    if (status === 403)
        return 'The token lacks a scope this route needs. Create one with the right --scope (`npx @learncard/cli token --scope ...`).';
    if (status === 404)
        return 'Check the path against the OpenAPI spec: `npx @learncard/cli api --spec`.';
    if (status === 429) return 'Rate limited. Wait and retry.';
    return undefined;
};

interface FetchResult {
    response: Response;
    text: string;
}

const fetchWithTimeout = async (
    deps: ApiDeps,
    url: string,
    init: RequestInit,
    timeoutSeconds: number,
    label: string
): Promise<FetchResult> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
    try {
        const response = await deps.fetch(url, { ...init, signal: controller.signal });
        const text = init.method === 'HEAD' ? '' : await response.text();
        return { response, text };
    } catch (error) {
        if (controller.signal.aborted)
            throw new CliError(`${label} timed out after ${timeoutSeconds}s.`, {
                code: 'TIMEOUT',
                hint: 'Raise --timeout or check that the network is reachable.',
            });
        throw new CliError(`${label} failed: ${(error as Error).message || 'network error'}`, {
            code: 'NETWORK_ERROR',
            hint: 'Check --network and your connection. `npx @learncard/cli doctor` checks the setup.',
        });
    } finally {
        clearTimeout(timer);
    }
};

const parseBody = (text: string, contentType: string | null): unknown => {
    if (!text) return null;
    if (contentType?.includes('json') || /^[[{"]/.test(text.trim())) {
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }
    return text;
};

/** An OpenAPI operation as listed by `api --spec --fetch`. */
export interface ApiOperation {
    method: string;
    path: string;
    summary?: string;
    tags?: string[];
}

const OPERATION_METHODS = ['get', 'head', 'post', 'put', 'patch', 'delete', 'options'];

/** Flatten an OpenAPI document's `paths` into `{method, path, summary, tags}` rows. */
export const listOperations = (spec: unknown): ApiOperation[] => {
    const paths = (spec as { paths?: Record<string, Record<string, unknown>> })?.paths ?? {};
    return Object.entries(paths).flatMap(([path, item]) =>
        OPERATION_METHODS.filter(method => item && typeof item[method] === 'object').map(method => {
            const operation = item[method] as { summary?: string; tags?: string[] };
            return {
                method: method.toUpperCase(),
                path,
                ...(operation.summary ? { summary: operation.summary } : {}),
                ...(Array.isArray(operation.tags) ? { tags: operation.tags } : {}),
            };
        })
    );
};

const runApiSpec = async (options: ApiOptions, deps: ApiDeps): Promise<void> => {
    const project = await loadProject(process.cwd());
    const { network } = resolveServices(project.env, options.network, deps.env);
    const urls = deriveApiUrls(network);
    if (options.fetch && options.dryRun) {
        // --dry-run never touches the network: report what would be downloaded.
        out.log(`Would download the OpenAPI spec: GET ${urls.specUrl}`);
        out.set({ ...urls, dryRun: true, wouldFetch: true });
        return;
    }
    if (!options.fetch) {
        out.log(`OpenAPI spec: ${urls.specUrl}`);
        out.log(`API reference: ${urls.docsUrl}`);
        out.log(`REST base: ${urls.apiBase}`);
        out.set({ ...urls });
        return;
    }
    const timeout = parseTimeoutSeconds(options.timeout);
    const { response, text } = await fetchWithTimeout(
        deps,
        urls.specUrl,
        { method: 'GET', headers: { accept: 'application/json' } },
        timeout,
        `GET ${urls.specUrl}`
    );
    if (!response.ok)
        throw new CliError(`GET ${urls.specUrl} returned HTTP ${response.status}.`, {
            code: `HTTP_${response.status}`,
            detail: truncate(text, MAX_ERROR_DETAIL_BYTES),
        });
    const spec = parseBody(text, response.headers.get('content-type'));
    if (!spec || typeof spec !== 'object')
        throw new CliError(`${urls.specUrl} did not return an OpenAPI JSON document.`, {
            code: 'BAD_SPEC',
            detail: truncate(text, MAX_ERROR_DETAIL_BYTES),
        });
    const operations = listOperations(spec);
    const servers = toJsonSafe((spec as { servers?: unknown }).servers ?? []);
    for (const operation of operations)
        out.log(
            `${operation.method.padEnd(6)} ${operation.path}${operation.summary ? `  ${operation.summary}` : ''}`
        );
    out.log(`\n${operations.length} operations. Paths are relative to ${urls.apiBase}.`);
    out.set({ ...urls, servers, operations: toJsonSafe(operations) });
};

const checkTokenNetwork = (project: Project, network: string): void => {
    try {
        assertProjectNetwork(project, network);
    } catch {
        throw new CliError(
            "This folder's API_TOKEN belongs to another network than the one requested.",
            {
                code: 'NETWORK_MISMATCH',
                hint: 'Drop --network to use the folder’s network, use a folder per network, or set LEARNCARD_API_KEY for the target network.',
            }
        );
    }
};

/**
 * `learncard api <METHOD> <path>`: call the LearnCard Network REST API with a bearer
 * token (LEARNCARD_API_KEY, else API_TOKEN from `.env`). Methods other than GET/HEAD need
 * `--write`. The token is never printed. Needs no identity and never writes files.
 */
export const runApi = async (
    method: string | undefined,
    path: string | undefined,
    options: ApiOptions,
    deps: ApiDeps = defaultDeps()
): Promise<void> => {
    if (options.spec) return runApiSpec(options, deps);
    if (options.fetch) throw new UsageError('--fetch only works with --spec (api --spec --fetch).');
    if (!method || !path)
        throw new UsageError(
            'Usage: api <METHOD> <path>, e.g. `npx @learncard/cli api GET /profile`.',
            'See every route with `npx @learncard/cli api --spec --fetch`.'
        );

    // Validate everything before reading .env or touching the network.
    const httpMethod = parseApiMethod(method);
    const apiPath = normalizeApiPath(path);
    const query = parseQuery(options.query);
    const timeout = parseTimeoutSeconds(options.timeout);
    let isRead = isReadRequest(httpMethod, apiPath);
    if (options.data !== undefined && READ_METHODS.has(httpMethod))
        throw new UsageError(
            `${httpMethod} requests have no body; pass parameters with --query key=value.`
        );
    const body =
        options.data !== undefined
            ? await readJsonInput(options.data, '--data', deps.io)
            : undefined;
    const assertWriteAllowed = (): void => {
        if (isRead || options.write || options.dryRun) return;
        const rerun = `npx @learncard/cli api ${httpMethod} ${apiPath}${options.data !== undefined ? ' --data ...' : ''}${query.length ? ' --query ...' : ''} --write`;
        throw new CliError(
            `${httpMethod} ${apiPath} can change data on the LearnCard Network, so it needs --write.`,
            {
                code: 'WRITE_REQUIRES_FLAG',
                hint: `Re-run with --write if you intend this (check first with --dry-run): ${rerun}. -y does not imply --write.`,
            }
        );
    };
    assertWriteAllowed();

    const project = await loadProject(process.cwd());
    const { network } = resolveServices(project.env, options.network, deps.env);
    const { apiBase } = deriveApiUrls(network);
    const url = buildApiUrl(apiBase, apiPath, query);
    // Re-classify on the exact URL that will be sent, so the gate and the request agree.
    const routePath = routePathOf(apiBase, url);
    isRead = isRead && isReadRequest(httpMethod, routePath);
    assertWriteAllowed();
    const effect = isRead ? 'read' : 'write';
    const auth = resolveApiToken(project.env, deps.env);
    const shownBody =
        body !== undefined
            ? toJsonSafe(body, {
                  redact: [
                      auth?.token,
                      project.env.API_TOKEN,
                      deps.env.LEARNCARD_API_KEY,
                      project.env.SECURE_SEED,
                  ],
              })
            : undefined;

    if (options.dryRun) {
        const allowed = isRead || !!options.write;
        out.log(`Would send ${httpMethod} ${url}`);
        out.log(
            `Authorization: ${auth ? `${MASKED_AUTHORIZATION} (from ${auth.source})` : 'none (no token found)'}`
        );
        if (shownBody !== undefined) out.log(JSON.stringify(shownBody, null, 2));
        if (!allowed) out.log('Not allowed yet: add --write to send it.');
        out.set({
            dryRun: true,
            method: httpMethod,
            path: apiPath,
            url,
            routePath: canonicalRoutePath(routePath),
            effect,
            allowed,
            headers: {
                ...(auth ? { authorization: MASKED_AUTHORIZATION } : {}),
                ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
            },
            tokenSource: auth?.source ?? null,
            ...(shownBody !== undefined ? { body: shownBody } : {}),
        });
        return;
    }

    if (!auth)
        throw new CliError('No API token for the LearnCard Network REST API.', {
            code: 'NO_API_TOKEN',
            hint: 'Create one with `npx @learncard/cli token --scope "<scopes>"` (saved to .env as API_TOKEN) or set LEARNCARD_API_KEY.',
        });
    if (auth.source === '.env API_TOKEN') checkTokenNetwork(project, network);

    const label = `${httpMethod} ${apiPath}`;
    const { response, text } = await fetchWithTimeout(
        deps,
        url,
        {
            method: httpMethod,
            headers: {
                accept: 'application/json',
                authorization: `Bearer ${auth.token}`,
                ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
            },
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        },
        timeout,
        label
    );

    if (!response.ok) {
        const hint = statusHint(response.status);
        throw new CliError(
            `${label} returned HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}.`,
            {
                code: `HTTP_${response.status}`,
                ...(hint ? { hint } : {}),
                ...(text
                    ? { detail: truncate(scrubToken(text, auth.token), MAX_ERROR_DETAIL_BYTES) }
                    : {}),
            }
        );
    }

    const data: JsonValue = toJsonSafe(parseBody(text, response.headers.get('content-type')), {
        redact: [
            auth.token,
            project.env.API_TOKEN,
            deps.env.LEARNCARD_API_KEY,
            project.env.SECURE_SEED,
        ],
    });
    // In --json mode the response is already on stdout; don't repeat it on stderr.
    if (!out.json) out.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    out.set({ status: response.status, method: httpMethod, path: apiPath, data });
};

const collect = (value: string, previous: string[] = []): string[] => [...previous, value];

/** Register `learncard api`. */
export const registerApiCommand = (program: Command, run: RunCommand): void => {
    program
        .command('api [method] [path]')
        .description(
            'Call the LearnCard Network REST API (<network>/api) with your API token. GET/HEAD run as-is; other methods need --write.'
        )
        .option('--data <json|@file|->', 'JSON request body (POST/PUT/PATCH/DELETE)')
        .option('--query <key=value>', 'query parameter (repeatable)', collect)
        .option('--write', 'allow POST/PUT/PATCH/DELETE (-y does not imply this)')
        .option('--dry-run', 'print the request (token masked) without sending it')
        .option('--timeout <seconds>', `request timeout (default: ${DEFAULT_API_TIMEOUT_SECONDS})`)
        .option('--spec', 'print the OpenAPI spec and API reference URLs for the network')
        .option('--fetch', 'with --spec: download the public spec and list its operations')
        .option('--network <url>', 'production|staging|local or a tRPC URL (default: production)')
        .option('--json', 'print a single JSON result on stdout')
        .action((method: string | undefined, path: string | undefined, options: ApiOptions) =>
            run('api', options, async () => {
                await runApi(method, path, options);
            })
        );
};
