import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export type SmoketestEnv = 'staging' | 'production' | 'scouts';

export interface SmoketestUrls {
    app: string;
    api: string;
    cloud: string;
    lcaApi: string;
}

// Resolved relative to this file: tests/smoketests/lib/ → repo root is ../../..
// Playwright loads configs as CJS so __dirname is always available here.
const REPO_ROOT = resolve(__dirname, '../../..');

type JsonRecord = Record<string, unknown>;

const isPlainObject = (v: unknown): v is JsonRecord =>
    typeof v === 'object' && v !== null && !Array.isArray(v);

const deepMerge = <T extends JsonRecord>(base: T, override: JsonRecord): T => {
    const out: JsonRecord = { ...base };
    for (const [k, v] of Object.entries(override)) {
        const b = (base as JsonRecord)[k];
        out[k] = isPlainObject(b) && isPlainObject(v) ? deepMerge(b, v) : v;
    }
    return out as T;
};

const readTenantConfig = (tenant: string, stage?: string): JsonRecord => {
    const dir = resolve(REPO_ROOT, 'apps/learn-card-app/environments', tenant);
    const base = JSON.parse(readFileSync(resolve(dir, 'config.json'), 'utf8')) as JsonRecord;
    if (!stage) return base;
    const stagePath = resolve(dir, `config.${stage}.json`);
    if (!existsSync(stagePath)) return base;
    const override = JSON.parse(readFileSync(stagePath, 'utf8')) as JsonRecord;
    return deepMerge(base, override);
};

// Tenant-config URLs mostly end in /trpc; smoketests hit /api/health-check,
// so map /trpc → /api. brainServiceApi is already /api and passes through.
const toApiBase = (u: string): string => u.replace(/\/trpc\/?$/, '/api');

const urlsFromTenant = (stage: 'staging' | undefined): SmoketestUrls => {
    const cfg = readTenantConfig('learncard', stage);
    const apis = cfg.apis as JsonRecord;
    return {
        app: `https://${cfg.domain as string}`,
        api: toApiBase(apis.brainServiceApi as string),
        cloud: toApiBase(apis.cloudService as string),
        lcaApi: toApiBase(apis.lcaApi as string),
    };
};

// Scouts only has a production environment — no staging. URLs mirror
// packages/learn-card-base/src/constants/Networks.ts; the frontend lives at
// pass.scout.org.
const scoutsUrls = (): SmoketestUrls => ({
    app: 'https://pass.scout.org',
    api: 'https://scoutnetwork.org/api',
    cloud: 'https://cloud.scoutnetwork.org/api',
    lcaApi: 'https://api.scoutnetwork.org/api',
});

export const resolveUrls = (
    env: SmoketestEnv = (process.env.SMOKETEST_ENV as SmoketestEnv) ?? 'staging'
): SmoketestUrls => {
    const base: SmoketestUrls =
        env === 'staging'
            ? urlsFromTenant('staging')
            : env === 'production'
              ? urlsFromTenant(undefined)
              : env === 'scouts'
                ? scoutsUrls()
                : (() => {
                      throw new Error(`Unknown SMOKETEST_ENV: ${env}`);
                  })();

    // Per-URL env-var overrides — useful for local debugging against a custom deploy.
    return {
        app: process.env.SMOKETEST_APP_URL ?? base.app,
        api: process.env.SMOKETEST_API_URL ?? base.api,
        cloud: process.env.SMOKETEST_CLOUD_URL ?? base.cloud,
        lcaApi: process.env.SMOKETEST_LCA_API_URL ?? base.lcaApi,
    };
};
