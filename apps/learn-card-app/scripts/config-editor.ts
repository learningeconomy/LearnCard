#!/usr/bin/env npx tsx

/**
 * config-editor.ts
 *
 * Lightweight dev server for the tenant config editor UI.
 * Serves the SPA and provides REST endpoints for tenant CRUD + validation.
 *
 * Usage:
 *   npx tsx scripts/config-editor.ts
 *   pnpm config-editor
 *
 * Opens http://localhost:4400 in your default browser.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'fs';
import { resolve, dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

import { tenantConfigSchema } from 'learn-card-base/src/config/tenantConfigSchema';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from 'learn-card-base/src/config/tenantDefaults';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');
const ENVIRONMENTS_DIR = resolve(APP_ROOT, 'environments');
const SPA_PATH = resolve(APP_ROOT, 'tools/config-editor/index.html');

const PORT = 4400;

// ---------------------------------------------------------------------------
// Deep merge (same as prepare-native-config.ts)
// ---------------------------------------------------------------------------

const deepMerge = (
    base: Record<string, unknown>,
    overrides: Record<string, unknown>
): Record<string, unknown> => {
    const result = { ...base };

    for (const key of Object.keys(overrides)) {
        const baseVal = base[key];
        const overrideVal = overrides[key];

        if (
            baseVal && overrideVal &&
            typeof baseVal === 'object' && !Array.isArray(baseVal) &&
            typeof overrideVal === 'object' && !Array.isArray(overrideVal)
        ) {
            result[key] = deepMerge(
                baseVal as Record<string, unknown>,
                overrideVal as Record<string, unknown>,
            );
        } else {
            result[key] = overrideVal;
        }
    }

    return result;
};

// ---------------------------------------------------------------------------
// Compute overrides (diff against defaults)
// ---------------------------------------------------------------------------

const computeOverrides = (
    merged: Record<string, unknown>,
    defaults: Record<string, unknown>
): Record<string, unknown> => {
    const overrides: Record<string, unknown> = {};

    for (const key of Object.keys(merged)) {
        if (key.startsWith('_')) continue;

        const mergedVal = merged[key];
        const defaultVal = defaults[key];

        if (mergedVal === defaultVal) continue;

        if (
            mergedVal && defaultVal &&
            typeof mergedVal === 'object' && !Array.isArray(mergedVal) &&
            typeof defaultVal === 'object' && !Array.isArray(defaultVal)
        ) {
            const nested = computeOverrides(
                mergedVal as Record<string, unknown>,
                defaultVal as Record<string, unknown>,
            );

            if (Object.keys(nested).length > 0) {
                overrides[key] = nested;
            }
        } else if (JSON.stringify(mergedVal) !== JSON.stringify(defaultVal)) {
            overrides[key] = mergedVal;
        }
    }

    return overrides;
};

// ---------------------------------------------------------------------------
// API handlers
// ---------------------------------------------------------------------------

const listTenants = (): { name: string; hasConfig: boolean; hasAssets: boolean }[] => {
    if (!existsSync(ENVIRONMENTS_DIR)) return [];

    return readdirSync(ENVIRONMENTS_DIR)
        .filter(name => {
            const full = join(ENVIRONMENTS_DIR, name);

            return statSync(full).isDirectory();
        })
        .map(name => ({
            name,
            hasConfig: existsSync(join(ENVIRONMENTS_DIR, name, 'config.json')),
            hasAssets: existsSync(join(ENVIRONMENTS_DIR, name, 'assets')),
        }));
};

const readTenantConfig = (tenant: string): { overrides: Record<string, unknown>; merged: Record<string, unknown> } => {
    const configPath = join(ENVIRONMENTS_DIR, tenant, 'config.json');
    let overrides: Record<string, unknown> = {};

    if (existsSync(configPath)) {
        overrides = JSON.parse(readFileSync(configPath, 'utf-8'));
    }

    const merged = deepMerge(
        DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
        overrides,
    );

    return { overrides, merged };
};

const validateConfig = (config: Record<string, unknown>): { valid: boolean; errors: string[]; data?: Record<string, unknown> } => {
    const result = tenantConfigSchema.safeParse(config);

    if (result.success) {
        return { valid: true, errors: [], data: result.data as unknown as Record<string, unknown> };
    }

    return {
        valid: false,
        errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
    };
};

const saveTenantConfig = (tenant: string, overrides: Record<string, unknown>): void => {
    const tenantDir = join(ENVIRONMENTS_DIR, tenant);

    if (!existsSync(tenantDir)) {
        mkdirSync(tenantDir, { recursive: true });
    }

    writeFileSync(
        join(tenantDir, 'config.json'),
        JSON.stringify(overrides, null, 4) + '\n',
        'utf-8',
    );
};

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp', '.ico']);

const MIME_TYPES: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
};

const listTenantAssets = (tenant: string): { path: string; name: string; size: number }[] => {
    const assetsDir = join(ENVIRONMENTS_DIR, tenant, 'assets');

    if (!existsSync(assetsDir)) return [];

    const results: { path: string; name: string; size: number }[] = [];

    const walk = (dir: string, prefix: string) => {
        for (const entry of readdirSync(dir)) {
            const full = join(dir, entry);
            const rel = prefix ? `${prefix}/${entry}` : entry;
            const stat = statSync(full);

            if (stat.isDirectory()) {
                walk(full, rel);
            } else if (IMAGE_EXTENSIONS.has(extname(entry).toLowerCase())) {
                results.push({ path: rel, name: entry, size: stat.size });
            }
        }
    };

    walk(assetsDir, '');

    return results;
};

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const readBody = (req: IncomingMessage): Promise<string> =>
    new Promise((resolve, reject) => {
        let body = '';

        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });

const json = (res: ServerResponse, status: number, data: unknown): void => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    const path = url.pathname;

    // CORS for local dev
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    try {
        // --- API routes ---

        if (path === '/api/defaults') {
            json(res, 200, DEFAULT_LEARNCARD_TENANT_CONFIG);
            return;
        }

        if (path === '/api/tenants' && req.method === 'GET') {
            json(res, 200, listTenants());
            return;
        }

        const tenantMatch = path.match(/^\/api\/tenant\/([a-zA-Z0-9_-]+)$/);

        if (tenantMatch) {
            const tenant = tenantMatch[1]!;

            if (req.method === 'GET') {
                json(res, 200, readTenantConfig(tenant));
                return;
            }

            if (req.method === 'PUT') {
                const body = JSON.parse(await readBody(req));
                const merged = deepMerge(
                    DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
                    body.overrides,
                );
                const validation = validateConfig(merged);

                if (!validation.valid) {
                    json(res, 400, { error: 'Validation failed', errors: validation.errors });
                    return;
                }

                saveTenantConfig(tenant, body.overrides);
                json(res, 200, { saved: true, overrides: body.overrides, merged });
                return;
            }
        }

        if (path === '/api/validate' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const merged = deepMerge(
                DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
                body,
            );

            json(res, 200, validateConfig(merged));
            return;
        }

        // List asset files for a tenant
        const assetsListMatch = path.match(/^\/api\/tenant\/([a-zA-Z0-9_-]+)\/assets$/);

        if (assetsListMatch && req.method === 'GET') {
            json(res, 200, listTenantAssets(assetsListMatch[1]!));
            return;
        }

        // Serve an asset file from a tenant's assets directory
        const assetFileMatch = path.match(/^\/assets\/([a-zA-Z0-9_-]+)\/(.+)$/);

        if (assetFileMatch && req.method === 'GET') {
            const tenant = assetFileMatch[1]!;
            const filePath = assetFileMatch[2]!;

            // Prevent directory traversal
            if (filePath.includes('..')) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Bad request');
                return;
            }

            const fullPath = join(ENVIRONMENTS_DIR, tenant, 'assets', filePath);

            if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Asset not found');
                return;
            }

            const ext = extname(fullPath).toLowerCase();
            const mime = MIME_TYPES[ext] ?? 'application/octet-stream';

            res.writeHead(200, {
                'Content-Type': mime,
                'Cache-Control': 'no-cache',
            });
            res.end(readFileSync(fullPath));
            return;
        }

        if (path === '/api/compute-overrides' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const overrides = computeOverrides(
                body,
                DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
            );

            json(res, 200, overrides);
            return;
        }

        // --- SPA ---

        if (path === '/' || path === '/index.html') {
            const html = readFileSync(SPA_PATH, 'utf-8');

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
            return;
        }

        // 404
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    } catch (err) {
        console.error('Server error:', err);
        json(res, 500, { error: String(err) });
    }
};

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const server = createServer(handler);

server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;

    console.log(`\n🎨 Tenant Config Editor running at: ${url}\n`);

    // Open browser
    const cmd = process.platform === 'darwin' ? 'open'
        : process.platform === 'win32' ? 'start'
        : 'xdg-open';

    exec(`${cmd} ${url}`);
});
