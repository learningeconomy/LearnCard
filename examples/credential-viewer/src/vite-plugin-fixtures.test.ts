import { EventEmitter } from 'node:events';

import { describe, expect, it } from 'vitest';

import fixtureWriterPlugin from './vite-plugin-fixtures';

type Middleware = (
    request: EventEmitter & { method?: string },
    response: {
        statusCode: number;
        setHeader: (name: string, value: string) => void;
        end: (body: string) => void;
    }
) => void;

const postFixture = async (
    body: Record<string, unknown>
): Promise<{ status: number; body: unknown }> => {
    let saveFixture: Middleware | undefined;
    const plugin = fixtureWriterPlugin();
    const configureServer = plugin.configureServer;

    if (typeof configureServer !== 'function') {
        throw new Error('Expected fixture writer to configure the Vite server');
    }

    configureServer({
        middlewares: {
            use: (route: string, middleware: Middleware) => {
                if (route === '/api/save-fixture') saveFixture = middleware;
            },
        },
    } as never);

    if (!saveFixture) throw new Error('Expected save-fixture middleware');

    const request = Object.assign(new EventEmitter(), { method: 'POST' });

    return new Promise(resolve => {
        const response = {
            statusCode: 200,
            setHeader: () => {},
            end: (responseBody: string) => {
                resolve({ status: response.statusCode, body: JSON.parse(responseBody) });
            },
        };

        saveFixture!(request, response);
        request.emit('data', Buffer.from(JSON.stringify(body)));
        request.emit('end');
    });
};

const getFixtureFolders = (): { folders: string[] } => {
    let fixtureFolders: Middleware | undefined;
    const plugin = fixtureWriterPlugin();
    const configureServer = plugin.configureServer;

    if (typeof configureServer !== 'function') {
        throw new Error('Expected fixture writer to configure the Vite server');
    }

    configureServer({
        middlewares: {
            use: (route: string, middleware: Middleware) => {
                if (route === '/api/fixture-folders') fixtureFolders = middleware;
            },
        },
    } as never);

    if (!fixtureFolders) throw new Error('Expected fixture-folders middleware');

    let responseBody = '';
    const response = {
        statusCode: 200,
        setHeader: () => {},
        end: (body: string) => {
            responseBody = body;
        },
    };

    fixtureFolders(new EventEmitter(), response);

    return JSON.parse(responseBody) as { folders: string[] };
};

describe('fixture writer', () => {
    it('does not offer the reserved SD-JWT template folder to the W3C creator', () => {
        expect(getFixtureFolders().folders).not.toContain('sd-jwt-vc');
    });

    it.each([
        {
            folder: 'sd-jwt-vc',
            metadata: { id: 'sd-jwt-vc/course-completion', spec: 'vc-v2' },
            credential: {},
        },
        {
            folder: 'vc-v2',
            metadata: { id: 'vc-v2/basic', spec: 'sd-jwt-vc' },
            credential: {},
        },
    ])('rejects SD-JWT metadata sent to the W3C fixture endpoint', async request => {
        const response = await postFixture(request);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'The New Fixture endpoint only creates W3C VC fixtures.',
        });
    });
});
