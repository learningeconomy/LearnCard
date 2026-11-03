/**
 * `learncard api`: URL derivation, token sourcing (never printed), write gating, dry run,
 * error envelopes, timeouts and `--spec`. `fetch` is always injected; nothing reaches a network.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';

import { CliError, errorEnvelope } from './errors';
import { out } from './out';
import {
    MAX_ERROR_DETAIL_BYTES,
    buildApiUrl,
    deriveApiUrls,
    isReadRequest,
    listOperations,
    normalizeApiPath,
    parseQuery,
    registerApiCommand,
    resolveApiToken,
    routePathCandidates,
    runApi,
    type ApiDeps,
} from './api';
import { resolveServices } from './project';
import type { RunCommand } from './doctor';

const TOKEN = 'lc_test_token_0123456789abcdef';
const ENV_KEY = 'lc_env_key_fedcba9876543210';
let cwd: string;

beforeEach(async () => {
    cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'lc-api-'));
    vi.spyOn(process, 'cwd').mockReturnValue(cwd);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    out.json = false;
    out.result = {};
});

afterEach(async () => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    await fs.rm(cwd, { recursive: true, force: true });
});

const writeEnv = (text: string): Promise<void> => fs.writeFile(path.join(cwd, '.env'), text);

const jsonResponse = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    });

const makeDeps = (
    fetchImpl: (url: string, init: RequestInit) => Promise<Response>,
    env: Record<string, string | undefined> = {}
): ApiDeps & { fetch: ReturnType<typeof vi.fn> } => {
    const fetchMock = vi.fn(fetchImpl);
    return {
        fetch: fetchMock as unknown as typeof fetch & ReturnType<typeof vi.fn>,
        env,
        io: {
            readStdin: async () => '{"from":"stdin"}',
            readFile: (file: string) => fs.readFile(file, 'utf8'),
        },
    } as ApiDeps & { fetch: ReturnType<typeof vi.fn> };
};

const offline = () =>
    makeDeps(async () => {
        throw new Error('test tried to reach the network');
    });

const failure = async (promise: Promise<unknown>): Promise<CliError> => {
    try {
        await promise;
    } catch (error) {
        return error as CliError;
    }
    throw new Error('expected a failure');
};

const printed = (): string =>
    [
        ...(console.log as unknown as ReturnType<typeof vi.fn>).mock.calls,
        ...(console.error as unknown as ReturnType<typeof vi.fn>).mock.calls,
    ]
        .flat()
        .map(String)
        .join('\n');

describe('URL derivation', () => {
    const urlsFor = (network: string) => deriveApiUrls(resolveServices({}, network, {}).network);

    it('maps production, staging and local tRPC URLs to /api and /docs', () => {
        expect(urlsFor('production')).toEqual({
            apiBase: 'https://network.learncard.com/api',
            specUrl: 'https://network.learncard.com/docs/openapi.json',
            docsUrl: 'https://network.learncard.com/docs',
        });
        expect(urlsFor('staging').apiBase).toBe('https://staging.network.learncard.com/api');
        expect(urlsFor('local')).toEqual({
            apiBase: 'http://localhost:4000/api',
            specUrl: 'http://localhost:4000/docs/openapi.json',
            docsUrl: 'http://localhost:4000/docs',
        });
    });

    it('keeps a custom host and path prefix', () => {
        expect(deriveApiUrls('https://lcn.example.org/brain/trpc/').apiBase).toBe(
            'https://lcn.example.org/brain/api'
        );
        expect(deriveApiUrls('https://lcn.example.org/brain/trpc').specUrl).toBe(
            'https://lcn.example.org/brain/docs/openapi.json'
        );
        expect(deriveApiUrls('http://127.0.0.1:9/api').apiBase).toBe('http://127.0.0.1:9/api');
        expect(deriveApiUrls('http://127.0.0.1:9').apiBase).toBe('http://127.0.0.1:9/api');
    });

    it('builds request URLs with query parameters', () => {
        expect(
            buildApiUrl('https://h/api', '/boost/search?x=1', [
                ['limit', '10'],
                ['q', 'a b'],
            ])
        ).toBe('https://h/api/boost/search?x=1&limit=10&q=a+b');
    });

    it('validates paths so the token stays on the network host', () => {
        expect(normalizeApiPath('/profile')).toBe('/profile');
        expect(normalizeApiPath('/api/profile')).toBe('/profile');
        expect(normalizeApiPath('/api')).toBe('/');
        expect(normalizeApiPath('/apiary')).toBe('/apiary');
        for (const bad of [
            'https://evil.example/x',
            '//evil.example/x',
            'profile',
            '/a/../b',
            '/%2e%2e/trpc/x',
            '/.%2E/trpc/x',
            '/a/%2E/b',
            '/..\\trpc',
            'javascript:x',
        ])
            expect(() => normalizeApiPath(bad), bad).toThrow(CliError);
    });

    it('refuses URLs that resolve outside the /api base', () => {
        expect(() => buildApiUrl('https://h/prefix/api', '/%2e%2e/trpc', [])).toThrow(CliError);
        expect(buildApiUrl('https://h/prefix/api', '/profile', [])).toBe(
            'https://h/prefix/api/profile'
        );
        expect(buildApiUrl('https://h/api', '/', [])).toBe('https://h/api/');
    });

    it('parses --query pairs', () => {
        expect(parseQuery(['a=1', 'b=x=y', 'c='])).toEqual([
            ['a', '1'],
            ['b', 'x=y'],
            ['c', ''],
        ]);
        expect(() => parseQuery(['novalue'])).toThrow(/key=value/);
        expect(() => parseQuery(['=1'])).toThrow(/key=value/);
    });
});

describe('token sourcing', () => {
    it('prefers LEARNCARD_API_KEY over .env API_TOKEN', () => {
        expect(resolveApiToken({ API_TOKEN: TOKEN }, { LEARNCARD_API_KEY: ENV_KEY })).toEqual({
            token: ENV_KEY,
            source: 'LEARNCARD_API_KEY',
        });
        expect(resolveApiToken({ API_TOKEN: TOKEN }, {})).toEqual({
            token: TOKEN,
            source: '.env API_TOKEN',
        });
        expect(resolveApiToken({ API_TOKEN: TOKEN }, { LEARNCARD_API_KEY: '  ' })?.source).toBe(
            '.env API_TOKEN'
        );
        expect(resolveApiToken({}, { API_TOKEN: 'ignored' })).toBeUndefined();
    });

    it('sends the env key as a bearer token', async () => {
        await writeEnv(`API_TOKEN=${TOKEN}\n`);
        const deps = makeDeps(async () => jsonResponse({ profileId: 'me' }), {
            LEARNCARD_API_KEY: ENV_KEY,
        });
        await runApi('get', '/profile', {}, deps);
        const [url, init] = deps.fetch.mock.calls[0]!;
        expect(url).toBe('https://network.learncard.com/api/profile');
        expect((init.headers as Record<string, string>).authorization).toBe(`Bearer ${ENV_KEY}`);
        expect(init.method).toBe('GET');
        expect(out.result).toEqual({
            status: 200,
            method: 'GET',
            path: '/profile',
            data: { profileId: 'me' },
        });
    });

    it('fails with NO_API_TOKEN before any request and writes nothing', async () => {
        const deps = offline();
        const error = await failure(runApi('GET', '/profile', {}, deps));
        expect(error.code).toBe('NO_API_TOKEN');
        expect(error.hint).toMatch(/token --scope/);
        expect(error.hint).toMatch(/LEARNCARD_API_KEY/);
        expect(deps.fetch).not.toHaveBeenCalled();
        expect(await fs.readdir(cwd)).toEqual([]);
    });

    it('never prints the token, even when the server echoes it', async () => {
        await writeEnv(`API_TOKEN=${TOKEN}\n`);
        out.json = true;
        const ok = makeDeps(async () => jsonResponse({ echoed: `Bearer ${TOKEN}` }));
        await runApi('GET', '/profile', {}, ok);
        expect(JSON.stringify(out.result)).not.toContain(TOKEN);

        const bad = makeDeps(async () => jsonResponse({ error: `bad token ${TOKEN}` }, 401));
        const envelope = errorEnvelope('api', await failure(runApi('GET', '/profile', {}, bad)));
        expect(JSON.stringify(envelope)).not.toContain(TOKEN);
        expect(printed()).not.toContain(TOKEN);
    });

    it('refuses a folder token for another network', async () => {
        await writeEnv(`API_TOKEN=${TOKEN}\nNETWORK_URL=staging\n`);
        const deps = offline();
        const error = await failure(runApi('GET', '/profile', { network: 'production' }, deps));
        expect(error.code).toBe('NETWORK_MISMATCH');
        expect(deps.fetch).not.toHaveBeenCalled();
    });

    it("uses the folder's network for a folder token", async () => {
        await writeEnv(`API_TOKEN=${TOKEN}\nNETWORK_URL=staging\n`);
        const deps = makeDeps(async () => jsonResponse([]));
        await runApi('GET', '/profile', {}, deps);
        expect(deps.fetch.mock.calls[0]![0]).toBe(
            'https://staging.network.learncard.com/api/profile'
        );
    });
});

describe('write gating', () => {
    it('requires --write for non-GET methods, and -y does not imply it', async () => {
        await writeEnv(`API_TOKEN=${TOKEN}\n`);
        for (const method of ['POST', 'put', 'PATCH', 'DELETE']) {
            const deps = offline();
            const error = await failure(
                runApi(method, '/boost/send', { yes: true, data: '{}' }, deps)
            );
            expect(error.code, method).toBe('WRITE_REQUIRES_FLAG');
            expect(error.hint).toContain('-y does not imply --write');
            expect(deps.fetch).not.toHaveBeenCalled();
        }
    });

    it('keeps --data and --query in the re-run hint', async () => {
        const error = await failure(
            runApi('POST', '/boost/send', { data: '{"a":1}', query: ['x=1'] }, offline())
        );
        expect(error.code).toBe('WRITE_REQUIRES_FLAG');
        expect(error.hint).toContain(
            'npx @learncard/cli api POST /boost/send --data ... --query ... --write'
        );
        // The inline body is never echoed into the hint.
        expect(error.hint).not.toContain('"a"');
        const bare = await failure(runApi('DELETE', '/boost', {}, offline()));
        expect(bare.hint).toContain('npx @learncard/cli api DELETE /boost --write.');
    });

    it('rejects a fragment in the path, which the server never sees', async () => {
        const deps = offline();
        for (const bad of ['/inbox/guardian-approval/tok#/', '/profile#x', '/challenges?#'])
            expect((await failure(runApi('GET', bad, {}, deps))).code, bad).toBe('USAGE');
        expect(() => normalizeApiPath('/inbox/guardian-approval/tok#/')).toThrow(/fragment/);
        expect(deps.fetch).not.toHaveBeenCalled();
    });

    it('gates side-effecting GETs however the path is spelled', async () => {
        await writeEnv(`API_TOKEN=${TOKEN}\n`);
        for (const variant of [
            '/inbox/guardian-approval/tok',
            '/inbox/guardian-approval/tok/',
            '/api/inbox/guardian-approval/tok/',
            '/api//inbox/guardian-approval/tok',
            '/inbox//guardian-approval/tok//',
            '/INBOX/Guardian-Approval/tok',
            '/inbox/guardian%2Dapproval/tok',
            '/inbox\\guardian-approval\\tok',
            '/inbox/guardian-approval/tok?x=1',
            '/challenges',
            '/challenges/',
            '/Challenges?amount=100',
        ]) {
            const deps = offline();
            const error = await failure(runApi('GET', variant, {}, deps));
            expect(error.code, variant).toBe('WRITE_REQUIRES_FLAG');
            expect(deps.fetch, variant).not.toHaveBeenCalled();
        }
    });

    it('gates side-effecting GETs hidden behind encoded delimiters', async () => {
        await writeEnv(`API_TOKEN=${TOKEN}\n`);
        for (const variant of [
            '/challenges%5C',
            '/challenges%20',
            '/challenges%23x',
            '/x/..%2Fchallenges',
            '/inbox/guardian-approval%5Ctok',
            '/x/..%2Finbox/guardian-approval/tok',
        ]) {
            const deps = offline();
            const error = await failure(runApi('GET', variant, {}, deps));
            expect(error.code, variant).toBe('WRITE_REQUIRES_FLAG');
            expect(deps.fetch, variant).not.toHaveBeenCalled();
        }
    });

    it('does not suggest %23 for a rejected "#"', async () => {
        const error = await failure(runApi('GET', '/profile#x', {}, offline()));
        expect(error.hint ?? '').not.toContain('%23');
    });

    it('sends a side-effecting GET with --write', async () => {
        await writeEnv(`API_TOKEN=${TOKEN}\n`);
        const deps = makeDeps(async () => jsonResponse(['c1']));
        await runApi('GET', '/challenges', { write: true, query: ['amount=1'] }, deps);
        expect(deps.fetch.mock.calls[0]![0]).toBe(
            'https://network.learncard.com/api/challenges?amount=1'
        );
    });

    it('sends a JSON body with --write', async () => {
        await writeEnv(`API_TOKEN=${TOKEN}\n`);
        const deps = makeDeps(async () => jsonResponse('urn:uuid:1'));
        const file = path.join(cwd, 'body.json');
        await fs.writeFile(file, '{"recipient":"taylor"}');
        await runApi('POST', '/send', { write: true, data: `@${file}` }, deps);
        const [, init] = deps.fetch.mock.calls[0]!;
        expect(init.body).toBe('{"recipient":"taylor"}');
        expect((init.headers as Record<string, string>)['content-type']).toBe('application/json');
        expect(out.result).toMatchObject({ status: 200, method: 'POST', data: 'urn:uuid:1' });
    });

    it('reads --data from stdin', async () => {
        await writeEnv(`API_TOKEN=${TOKEN}\n`);
        const deps = makeDeps(async () => jsonResponse({}));
        await runApi('PATCH', '/x', { write: true, data: '-' }, deps);
        expect(deps.fetch.mock.calls[0]![1].body).toBe('{"from":"stdin"}');
    });

    it('rejects a body on GET, bad JSON, and unknown methods as USAGE', async () => {
        const deps = offline();
        expect((await failure(runApi('GET', '/x', { data: '{}' }, deps))).code).toBe('USAGE');
        expect((await failure(runApi('POST', '/x', { data: '{', write: true }, deps))).code).toBe(
            'USAGE'
        );
        expect((await failure(runApi('TRACE', '/x', {}, deps))).code).toBe('USAGE');
        expect((await failure(runApi(undefined, undefined, {}, deps))).code).toBe('USAGE');
        expect((await failure(runApi('GET', '/x', { timeout: '0' }, deps))).code).toBe('USAGE');
        expect((await failure(runApi('GET', '/x', { fetch: true }, deps))).code).toBe('USAGE');
        expect(deps.fetch).not.toHaveBeenCalled();
    });
});

describe('dry run', () => {
    it('shows the request with a masked token and sends nothing', async () => {
        await writeEnv(`API_TOKEN=${TOKEN}\n`);
        const deps = offline();
        await runApi(
            'POST',
            '/api/boost/send',
            { dryRun: true, data: '{"a":1}', query: ['x=1'], network: 'local' },
            deps
        );
        expect(deps.fetch).not.toHaveBeenCalled();
        expect(out.result).toEqual({
            dryRun: true,
            method: 'POST',
            path: '/boost/send',
            url: 'http://localhost:4000/api/boost/send?x=1',
            routePath: '/boost/send',
            effect: 'write',
            allowed: false,
            headers: { authorization: 'Bearer ***', 'content-type': 'application/json' },
            tokenSource: '.env API_TOKEN',
            body: { a: 1 },
        });
        expect(JSON.stringify(out.result)).not.toContain(TOKEN);
        expect(printed()).not.toContain(TOKEN);
    });

    it('redacts the token and seed from the printed body, not only the JSON result', async () => {
        const seed = 'a'.repeat(64);
        await writeEnv(`API_TOKEN=${TOKEN}\nSECURE_SEED=${seed}\n`);
        await runApi(
            'POST',
            '/boost/send',
            { dryRun: true, data: JSON.stringify({ token: TOKEN, note: `seed ${seed}` }) },
            offline()
        );
        expect(printed()).toContain('Would send POST');
        expect(printed()).not.toContain(TOKEN);
        expect(printed()).not.toContain(seed);
        expect(JSON.stringify(out.result)).not.toContain(TOKEN);
        expect(JSON.stringify(out.result)).not.toContain(seed);
    });

    it('redacts the folder API_TOKEN even when LEARNCARD_API_KEY is the bearer', async () => {
        const envKey = 'env-key-' + 'b'.repeat(24);
        await writeEnv(`API_TOKEN=${TOKEN}\n`);
        const deps = makeDeps(
            async () => {
                throw new Error('test tried to reach the network');
            },
            { LEARNCARD_API_KEY: envKey }
        );
        await runApi(
            'POST',
            '/boost/send',
            { dryRun: true, data: JSON.stringify({ a: TOKEN, b: envKey }) },
            deps
        );
        for (const secret of [TOKEN, envKey]) {
            expect(printed()).not.toContain(secret);
            expect(JSON.stringify(out.result)).not.toContain(secret);
        }
    });

    it('shows the URL that will be sent and the route path it is gated on', async () => {
        await runApi('GET', '/api//inbox/Guardian-Approval/tok/', { dryRun: true }, offline());
        expect(out.result).toMatchObject({
            url: 'https://network.learncard.com/api//inbox/Guardian-Approval/tok/',
            routePath: '/inbox/Guardian-Approval/tok',
            effect: 'write',
            allowed: false,
        });
        expect(printed()).toContain('Not allowed yet');
    });

    it('works without a token or identity', async () => {
        await runApi('GET', '/profile', { dryRun: true }, offline());
        expect(out.result).toMatchObject({ tokenSource: null, headers: {}, allowed: true });
        expect(await fs.readdir(cwd)).toEqual([]);
    });
});

describe('responses', () => {
    beforeEach(() => writeEnv(`API_TOKEN=${TOKEN}\n`));

    it('maps a non-2xx response to HTTP_<status> with a truncated body', async () => {
        const huge = 'x'.repeat(MAX_ERROR_DETAIL_BYTES * 2);
        const deps = makeDeps(async () => new Response(huge, { status: 500 }));
        const error = await failure(runApi('GET', '/profile', {}, deps));
        const envelope = errorEnvelope('api', error);
        expect(envelope).toMatchObject({ ok: false, command: 'api', code: 'HTTP_500' });
        expect(envelope.error).toContain('GET /profile returned HTTP 500');
        expect(envelope.detail!.length).toBeLessThan(MAX_ERROR_DETAIL_BYTES + 100);
        expect(envelope.detail).toContain('[truncated');
    });

    it('adds a hint for auth failures', async () => {
        const deps = makeDeps(async () => jsonResponse({ message: 'no' }, 403));
        const error = await failure(runApi('GET', '/profile', {}, deps));
        expect(error.code).toBe('HTTP_403');
        expect(error.hint).toMatch(/scope/);
        expect(error.detail).toBe('{"message":"no"}');
    });

    it('returns text bodies as strings and HEAD as null', async () => {
        const text = makeDeps(async () => new Response('plain', { status: 200 }));
        await runApi('GET', '/health', {}, text);
        expect(out.result.data).toBe('plain');
        const head = makeDeps(async () => new Response(null, { status: 204 }));
        await runApi('HEAD', '/health', {}, head);
        expect(out.result).toMatchObject({ status: 204, data: null });
    });

    it('times out with TIMEOUT', async () => {
        const deps = makeDeps(
            (_url, init) =>
                new Promise((_resolve, reject) => {
                    init.signal!.addEventListener('abort', () => reject(new Error('aborted')));
                })
        );
        const error = await failure(runApi('GET', '/slow', { timeout: '0.01' }, deps));
        expect(error.code).toBe('TIMEOUT');
        expect(error.message).toContain('0.01s');
    });

    it('reports connection failures as NETWORK_ERROR', async () => {
        const deps = makeDeps(async () => {
            throw new TypeError('fetch failed');
        });
        expect((await failure(runApi('GET', '/x', {}, deps))).code).toBe('NETWORK_ERROR');
    });
});

describe('--spec', () => {
    it('prints the spec URL without downloading', async () => {
        const deps = offline();
        await runApi(undefined, undefined, { spec: true, network: 'staging' }, deps);
        expect(deps.fetch).not.toHaveBeenCalled();
        expect(out.result).toEqual({
            apiBase: 'https://staging.network.learncard.com/api',
            specUrl: 'https://staging.network.learncard.com/docs/openapi.json',
            docsUrl: 'https://staging.network.learncard.com/docs',
        });
    });

    it('--fetch lists operations without sending a token', async () => {
        const spec = {
            openapi: '3.0.3',
            servers: [{ url: 'http://localhost:4000/api' }],
            paths: {
                '/profile': {
                    get: { summary: 'Get profile', tags: ['Profiles'] },
                    post: { summary: 'Create profile', tags: ['Profiles'] },
                    parameters: [],
                },
                '/boost/send': { post: { tags: ['Boosts'] } },
            },
        };
        await writeEnv(`API_TOKEN=${TOKEN}\n`);
        const deps = makeDeps(async () => jsonResponse(spec));
        await runApi(undefined, undefined, { spec: true, fetch: true, network: 'local' }, deps);
        const [url, init] = deps.fetch.mock.calls[0]!;
        expect(url).toBe('http://localhost:4000/docs/openapi.json');
        expect(JSON.stringify(init)).not.toContain(TOKEN);
        expect(out.result.operations).toEqual([
            { method: 'GET', path: '/profile', summary: 'Get profile', tags: ['Profiles'] },
            { method: 'POST', path: '/profile', summary: 'Create profile', tags: ['Profiles'] },
            { method: 'POST', path: '/boost/send', tags: ['Boosts'] },
        ]);
        expect(out.result.servers).toEqual(spec.servers);
    });

    it('--fetch --dry-run reports the download without fetching', async () => {
        const deps = offline();
        await runApi(
            undefined,
            undefined,
            { spec: true, fetch: true, dryRun: true, network: 'staging' },
            deps
        );
        expect(deps.fetch).not.toHaveBeenCalled();
        expect(out.result).toMatchObject({
            dryRun: true,
            wouldFetch: true,
            specUrl: 'https://staging.network.learncard.com/docs/openapi.json',
        });
    });

    it('listOperations tolerates a malformed document', () => {
        expect(listOperations(null)).toEqual([]);
        expect(listOperations({ paths: { '/x': null } })).toEqual([]);
    });
});

describe('registerApiCommand', () => {
    it('collects repeated --query flags and leaves --write off', () => {
        const program = new Command();
        program.exitOverride();
        let seen: Record<string, unknown> | undefined;
        const run: RunCommand = async (command, options) => {
            expect(command).toBe('api');
            seen = options as Record<string, unknown>;
        };
        registerApiCommand(program, run);
        program.parse([
            'node',
            'learncard',
            'api',
            'GET',
            '/boost/search',
            '--query',
            'a=1',
            '--query',
            'b=2',
            '--json',
        ]);
        expect(seen).toMatchObject({ query: ['a=1', 'b=2'], json: true });
        expect(seen!.write).toBeUndefined();
    });
});

describe('isReadRequest', () => {
    it('treats GET/HEAD as reads', () => {
        expect(isReadRequest('GET', '/profile')).toBe(true);
        expect(isReadRequest('HEAD', '/profile')).toBe(true);
        expect(isReadRequest('POST', '/profile')).toBe(false);
    });

    it('treats side-effecting GET routes as writes', () => {
        // approveGuardianRequestByPath approves the requester's profile.
        expect(isReadRequest('GET', '/inbox/guardian-approval/abc123')).toBe(false);
        expect(isReadRequest('GET', '/inbox/guardian-approval/abc123?x=1')).toBe(false);
        expect(isReadRequest('HEAD', '/inbox/guardian-approval/abc123')).toBe(false);
    });

    it('matches a trailing slash, as the server strips it before routing', () => {
        expect(isReadRequest('GET', '/inbox/guardian-approval/abc123/')).toBe(false);
        expect(isReadRequest('GET', '/inbox/guardian-approval/abc123//')).toBe(false);
        expect(isReadRequest('GET', '/inbox/guardian-approval/abc123/?x=1')).toBe(false);
    });

    it('classifies on the path the server sees, ignoring a fragment', () => {
        expect(isReadRequest('GET', '/inbox/guardian-approval/abc123#/')).toBe(false);
        expect(isReadRequest('GET', '/inbox/guardian-approval/abc123#/x/y')).toBe(false);
        expect(routePathCandidates('/inbox/guardian-approval/abc#/')).toEqual([
            '/inbox/guardian-approval/abc',
        ]);
    });

    it('matches case-insensitively, like trpc-to-openapi routing', () => {
        expect(isReadRequest('GET', '/Inbox/GUARDIAN-APPROVAL/abc123')).toBe(false);
        expect(isReadRequest('GET', '/CHALLENGES')).toBe(false);
    });

    it('matches percent-encoded, backslash and duplicate-slash spellings', () => {
        expect(isReadRequest('GET', '/inbox/guardian%2Dapproval/abc123')).toBe(false);
        expect(isReadRequest('GET', '/inbox/guardian-approval/a%2Fb')).toBe(false);
        expect(isReadRequest('GET', '/inbox\\guardian-approval\\abc123')).toBe(false);
        expect(isReadRequest('GET', '//inbox//guardian-approval/abc123')).toBe(false);
        expect(isReadRequest('GET', '/inbox/guardian-approval/%E0%A4%A')).toBe(false);
    });

    // Production (Lambda) routes on the API Gateway-decoded path parameter, which
    // trpc-to-openapi re-parses with `new URL()`: `\\` → `/`, `?`/`#` cut, tabs and trailing
    // spaces dropped, dot segments resolved. These spellings all reach a side-effecting route.
    const LAMBDA_ENCODED_BYPASSES = [
        '/challenges%20',
        '/challenges%5C',
        '/challenges%5c',
        '/challenges%3Fx',
        '/challenges%23x',
        '/chall%09enges',
        '/x/..%2Fchallenges',
        '/x/%2E%2E%2Fchallenges',
        '/inbox/guardian-approval%5Ctok',
        '/inbox%5Cguardian-approval/tok',
        '/x/..%2Finbox/guardian-approval/tok',
        '/inbox/guardian-approval/tok%3F',
        '/challenges%2520',
    ];

    it('gates encoded delimiters that the Lambda adapter decodes and re-parses', () => {
        for (const path of LAMBDA_ENCODED_BYPASSES)
            expect(isReadRequest('GET', path), path).toBe(false);
        expect(routePathCandidates('/x/..%2Fchallenges')).toContain('/challenges');
        expect(routePathCandidates('/challenges%5C')).toContain('/challenges');
    });

    it('still treats encoded characters in ordinary read routes as reads', () => {
        expect(isReadRequest('GET', '/profile%20x')).toBe(true);
        expect(isReadRequest('GET', '/storage/resolve/lc%3Anetwork%3Aboost')).toBe(true);
        expect(isReadRequest('GET', '/x/..%2Fprofile')).toBe(true);
    });

    it('treats GET /challenges as a write (it registers auth challenges)', () => {
        expect(isReadRequest('GET', '/challenges')).toBe(false);
        expect(isReadRequest('GET', '/challenges/')).toBe(false);
        expect(isReadRequest('GET', '/challenges?amount=100')).toBe(false);
    });

    it('leaves neighbouring read routes alone', () => {
        expect(isReadRequest('GET', '/inbox/guardian-approval')).toBe(true);
        expect(isReadRequest('GET', '/inbox/guardian-credential-approval/abc123')).toBe(true);
        expect(isReadRequest('GET', '/challenges-x')).toBe(true);
        expect(isReadRequest('GET', '/profile/')).toBe(true);
        expect(isReadRequest('GET', '/')).toBe(true);
    });
});
