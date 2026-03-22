import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { resolveTenantConfig } from '../resolveTenantConfig';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from '../tenantDefaults';
import { TENANT_CONFIG_SCHEMA_VERSION } from '../tenantConfigSchema';
import type { TenantConfig } from '../tenantConfig';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MINIMAL_OVERRIDES = {
    tenantId: 'vetpass',
    domain: 'vetpass.example.com',
    branding: {
        name: 'VetPass',
        loginRedirectPath: '/home?login=done',
    },
};

/** Build a full valid config for testing baked / static paths */
const buildFullConfig = (overrides: Partial<TenantConfig> = {}): TenantConfig => ({
    ...DEFAULT_LEARNCARD_TENANT_CONFIG,
    tenantId: 'test-tenant',
    domain: 'test.example.com',
    ...overrides,
});

// ---------------------------------------------------------------------------
// Mock fetch & localStorage
// ---------------------------------------------------------------------------

let fetchMock: ReturnType<typeof vi.fn>;
let localStorageMock: Record<string, string>;

beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    localStorageMock = {};

    vi.stubGlobal('localStorage', {
        getItem: (key: string) => localStorageMock[key] ?? null,
        setItem: (key: string, value: string) => { localStorageMock[key] = value; },
        removeItem: (key: string) => { delete localStorageMock[key]; },
    });
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('resolveTenantConfig – full boot path', () => {
    it('returns static config when provided (test/dev shortcut)', async () => {
        const staticConfig = buildFullConfig({ tenantId: 'static-test' });

        const result = await resolveTenantConfig({ staticConfig });

        expect(result.tenantId).toBe('static-test');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('falls back to DEFAULT config when all sources fail', async () => {
        // Baked fetch 404s
        fetchMock.mockImplementation(async (url: string) => ({
            ok: false,
            status: 404,
        }));

        const result = await resolveTenantConfig();

        expect(result.tenantId).toBe(DEFAULT_LEARNCARD_TENANT_CONFIG.tenantId);
        expect(result.domain).toBe(DEFAULT_LEARNCARD_TENANT_CONFIG.domain);
    });

    it('uses baked config when fetch succeeds for /tenant-config.json', async () => {
        const bakedConfig = buildFullConfig({ tenantId: 'baked' });

        fetchMock.mockImplementation(async (url: string) => {
            if (typeof url === 'string' && url.includes('tenant-config.json')) {
                return {
                    ok: true,
                    json: async () => bakedConfig,
                };
            }

            return { ok: false, status: 404 };
        });

        const result = await resolveTenantConfig();

        expect(result.tenantId).toBe('baked');
    });

    it('prefers fresh edge-function config over baked config', async () => {
        const bakedConfig = buildFullConfig({ tenantId: 'baked' });
        const freshConfig = buildFullConfig({ tenantId: 'fresh-edge' });

        fetchMock.mockImplementation(async (url: string) => {
            if (typeof url === 'string' && url.includes('tenant-config.json')) {
                return { ok: true, json: async () => bakedConfig };
            }

            if (typeof url === 'string' && url.includes('__tenant-config')) {
                return { ok: true, json: async () => freshConfig };
            }

            return { ok: false, status: 404 };
        });

        const result = await resolveTenantConfig();

        expect(result.tenantId).toBe('fresh-edge');
    });

    it('deep-merges partial edge-function response onto defaults', async () => {
        // Edge function returns only overrides (partial config)
        fetchMock.mockImplementation(async (url: string) => {
            if (typeof url === 'string' && url.includes('tenant-config.json')) {
                return { ok: false, status: 404 };
            }

            if (typeof url === 'string' && url.includes('__tenant-config')) {
                return { ok: true, json: async () => MINIMAL_OVERRIDES };
            }

            return { ok: false, status: 404 };
        });

        const result = await resolveTenantConfig();

        // Overridden fields
        expect(result.tenantId).toBe('vetpass');
        expect(result.domain).toBe('vetpass.example.com');
        expect(result.branding.name).toBe('VetPass');
        expect(result.branding.loginRedirectPath).toBe('/home?login=done');

        // Inherited defaults (deep-merged)
        expect(result.apis.brainService).toBe(DEFAULT_LEARNCARD_TENANT_CONFIG.apis.brainService);
        expect(result.auth.provider).toBe('firebase');
        expect(result.auth.keyDerivation).toBe('sss');
        expect(result.features.aiFeatures).toBe(true);
    });

    it('writes fresh config to localStorage cache', async () => {
        const freshConfig = buildFullConfig({ tenantId: 'cached-test' });

        fetchMock.mockImplementation(async (url: string) => {
            if (typeof url === 'string' && url.includes('tenant-config.json')) {
                return { ok: false, status: 404 };
            }

            if (typeof url === 'string' && url.includes('__tenant-config')) {
                return { ok: true, json: async () => freshConfig };
            }

            return { ok: false, status: 404 };
        });

        await resolveTenantConfig();

        const cacheKey = 'tenant-config-cache:cached-test';
        const cached = JSON.parse(localStorageMock[cacheKey]);

        expect(cached.config.tenantId).toBe('cached-test');
        expect(cached.cachedAt).toBeGreaterThan(0);
    });

    it('skips network fetch when offlineOnly is set', async () => {
        const result = await resolveTenantConfig({ offlineOnly: true });

        // Only baked fetch should have been called (for /tenant-config.json)
        const fetchCalls = fetchMock.mock.calls.map((c: unknown[]) => c[0]);
        const edgeCalls = fetchCalls.filter((url: unknown) =>
            typeof url === 'string' && url.includes('__tenant-config')
        );

        expect(edgeCalls).toHaveLength(0);
        expect(result.tenantId).toBe(DEFAULT_LEARNCARD_TENANT_CONFIG.tenantId);
    });

    it('uses cached config when fresh fetch fails and no baked config', async () => {
        // Pre-populate cache
        const cachedConfig = buildFullConfig({ tenantId: 'from-cache' });

        localStorageMock['tenant-config-cache:from-cache'] = JSON.stringify({
            config: cachedConfig,
            cachedAt: Date.now(),
            schemaVersion: TENANT_CONFIG_SCHEMA_VERSION,
        });

        // All fetches fail
        fetchMock.mockImplementation(async () => ({ ok: false, status: 500 }));

        // We need the baked config to provide a tenant hint for cache lookup.
        // Without it, the resolver tries a generic key. Let's test with the generic key.
        localStorageMock['tenant-config-cache'] = JSON.stringify({
            config: cachedConfig,
            cachedAt: Date.now(),
            schemaVersion: TENANT_CONFIG_SCHEMA_VERSION,
        });

        const result = await resolveTenantConfig();

        expect(result.tenantId).toBe('from-cache');
    });
});
