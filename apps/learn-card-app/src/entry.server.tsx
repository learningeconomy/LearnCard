import React from 'react';
import { renderToReadableStream } from 'react-dom/server';
import { ServerRouter, type EntryContext } from 'react-router';

/**
 * Renders documents only at build time (prerendering) and in the dev server: SPA mode has no
 * runtime server. It waits for the whole document, since the output is static. Unlike React
 * Router's default Node entry it imports no `node:stream`, which this app's browser polyfill
 * aliases would replace.
 */
export default async function handleRequest(
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    routerContext: EntryContext
) {
    let status = responseStatusCode;
    const body = await renderToReadableStream(
        <ServerRouter context={routerContext} url={request.url} />,
        {
            onError(error: unknown) {
                status = 500;
                console.error(error);
            },
        }
    );
    await body.allReady;
    responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
    return new Response(body, { headers: responseHeaders, status });
}
