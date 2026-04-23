/* eslint-disable */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8899);
const ROOT = __dirname;

// We also serve the built @learncard/embed-sdk package under /embed-sdk/* so the
// demo pages can load the local `dist/badge-claim.js` without needing to publish
// to npm. Falls back gracefully if the package hasn't been built yet.
const EMBED_SDK_DIST = path.resolve(
    __dirname,
    '..',
    '..',
    'packages',
    'learn-card-embed-sdk',
    'dist'
);

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.map': 'application/json; charset=utf-8',
};

function send(res, statusCode, body, headers = {}) {
    res.writeHead(statusCode, {
        'Cache-Control': 'no-store',
        // Allow wallets to POST to these JSON files cross-origin if we're ever
        // used with a remote brain-service against a local `data-src`.
        'Access-Control-Allow-Origin': '*',
        ...headers,
    });
    res.end(body);
}

function resolveRequestedFile(urlPath) {
    // /embed-sdk/* → packages/learn-card-embed-sdk/dist/*
    if (urlPath.startsWith('/embed-sdk/')) {
        const sub = urlPath.slice('/embed-sdk/'.length);
        return { absPath: path.join(EMBED_SDK_DIST, sub), label: 'embed-sdk' };
    }

    const clean = urlPath === '/' ? '/index.html' : urlPath;
    return { absPath: path.join(ROOT, clean), label: 'example' };
}

const server = http.createServer((req, res) => {
    // Strip query string for file resolution.
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

    // Prevent path traversal.
    if (urlPath.includes('..')) {
        return send(res, 400, 'Bad request');
    }

    const { absPath } = resolveRequestedFile(urlPath);

    fs.stat(absPath, (err, stat) => {
        if (err || !stat.isFile()) {
            return send(res, 404, `Not found: ${urlPath}`);
        }

        fs.readFile(absPath, (readErr, content) => {
            if (readErr) {
                return send(res, 500, 'Read error');
            }
            const ext = path.extname(absPath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            send(res, 200, content, { 'Content-Type': contentType });
        });
    });
});

server.listen(PORT, () => {
    const base = `http://localhost:${PORT}`;
    console.log(`\nBadge Claim examples running at ${base}\n`);
    console.log('Pages:');
    console.log(`  ${base}/               — landing page with links to all demos`);
    console.log(`  ${base}/signed.html    — data-src → pre-signed VC JSON`);
    console.log(`  ${base}/unsigned.html  — data-src → unsigned VC JSON (LearnCard signs)`);
    console.log(`  ${base}/inline.html    — data-credential inline JSON`);
    console.log(`  ${base}/qr-only.html   — data-mode="qr"`);
    console.log(`  ${base}/button-only.html — data-mode="button"`);
    console.log(`  ${base}/custom-target.html — data-target="#my-div"\n`);

    if (!fs.existsSync(path.join(EMBED_SDK_DIST, 'badge-claim.js'))) {
        console.warn(
            `  warning: ${EMBED_SDK_DIST}/badge-claim.js is missing.\n` +
                `  run: pnpm --filter @learncard/embed-sdk build\n`
        );
    }
});
