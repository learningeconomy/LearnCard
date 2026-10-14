import { request } from 'node:http';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createServer, preview, type ViteDevServer } from 'vite';
import { scoutNewsDevServer } from '../scripts/scoutNewsDevServer';
import news from '../src/components/scout-news/scoutnewsdefault.json';

let server: ViteDevServer;
let port: number;

beforeAll(async () => {
    server = await createServer({
        configFile: false,
        plugins: [scoutNewsDevServer()],
        appType: 'custom',
        server: { host: '127.0.0.1', port: 0, watch: null },
    });
    await server.listen();
    port = (server.httpServer?.address() as AddressInfo).port;
});
afterEach(() => vi.unstubAllGlobals());
afterAll(async () => server?.close());

const fetchLocal = (path: string, method = 'GET', requestPort = port) =>
    new Promise<{ status: number | undefined; body: string; cache: string | undefined }>(
        (resolve, reject) => {
            const req = request(
                { hostname: '127.0.0.1', port: requestPort, path, method },
                response => {
                    let body = '';
                    response.setEncoding('utf8');
                    response.on('data', chunk => {
                        body += chunk;
                    });
                    response.on('error', reject);
                    response.on('end', () =>
                        resolve({
                            status: response.statusCode,
                            body,
                            cache: response.headers['cache-control'],
                        })
                    );
                }
            );
            req.on('error', reject);
            req.end();
        }
    );

describe('local Scout news HTTP endpoint', () => {
    it('also serves news and rejects query parameters in the preview server', async () => {
        const root = await mkdtemp(join(tmpdir(), 'scouts-news-preview-'));
        await mkdir(join(root, 'build'));
        const previewServer = await preview({
            root,
            configFile: false,
            plugins: [scoutNewsDevServer()],
            build: { outDir: 'build' },
            preview: { host: '127.0.0.1', port: 0 },
        });
        try {
            const previewPort = (previewServer.httpServer.address() as AddressInfo).port;
            const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(news)));
            vi.stubGlobal('fetch', fetchMock);
            expect((await fetchLocal('/api/scout-news?page=1', 'GET', previewPort)).status).toBe(
                400
            );
            expect(fetchMock).not.toHaveBeenCalled();
            const response = await fetchLocal('/api/scout-news', 'GET', previewPort);
            expect(response.status).toBe(200);
            expect(JSON.parse(response.body)).toEqual(news);
        } finally {
            await new Promise<void>((resolve, reject) =>
                previewServer.httpServer.close(error => (error ? reject(error) : resolve()))
            );
            await rm(root, { recursive: true, force: true });
        }
    });

    it.each(['/api/scout-news', '/api/scout-news/'])(
        'serves valid news using the fixed upstream for %s',
        async path => {
            const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(news)));
            vi.stubGlobal('fetch', fetchMock);
            const response = await fetchLocal(path);
            expect(response.status).toBe(200);
            expect(JSON.parse(response.body)).toEqual(news);
            expect(fetchMock).toHaveBeenCalledWith(
                'https://www.scout.org/api/news',
                expect.any(Object)
            );
        }
    );

    it.each([
        ['GET', '/api/scout-news?page=1', 400],
        ['GET', '/api/scout-news?url=https://example.com', 400],
        ['POST', '/api/scout-news', 405],
        ['OPTIONS', '/api/scout-news', 204],
        ['GET', '/api/scout-news-other', 404],
    ])('handles %s %s without fetching upstream', async (method, path, status) => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        expect((await fetchLocal(path, method)).status).toBe(status);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns an uncached 502 for malformed upstream pagination, matching deployment', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...news, pager: {} })))
        );
        const response = await fetchLocal('/api/scout-news');
        expect(response.status).toBe(502);
        expect(response.cache).toBe('no-store');
        expect(JSON.parse(response.body)).toEqual({ error: 'Invalid Scout news response' });
    });
});
