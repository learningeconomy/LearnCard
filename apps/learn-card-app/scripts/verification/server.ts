import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import type { Plugin, UserConfig } from 'vite';
import viteConfig from '../../vite.config.mts';
import { deepMerge } from '../../../../packages/learn-card-base/src/config/deepMerge';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from '../../../../packages/learn-card-base/src/config/tenantDefaults';
import { parseTenantConfig } from '../../../../packages/learn-card-base/src/config/tenantConfigSchema';

// This is a direct child entrypoint, not imported by lc. The real app configuration,
// transforms and source modules are unchanged; only deployment configuration differs.
const start = async (): Promise<void> => {
    const [directory, token] = process.argv.slice(2);
    if (!directory || !token || !/^[a-f0-9]{32}$/.test(token))
        throw new Error('Verification directory/token required');
    const app = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
    const state = JSON.parse(await readFile(join(directory, 'state.json'), 'utf8'));
    if (state.token !== token || state.directory !== directory || state.phase !== 'starting')
        throw new Error('Frontend ownership mismatch');
    const stat = await readFile(`/proc/${process.pid}/stat`, 'utf8');
    await writeFile(
        join(directory, 'frontend-process.json'),
        JSON.stringify({
            token,
            identity: {
                pid: process.pid,
                startTime: stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19],
                bootId: (await readFile('/proc/sys/kernel/random/boot_id', 'utf8')).trim(),
            },
        }),
        { mode: 0o600 }
    );
    const base = JSON.parse(
        await readFile(join(app, 'environments/learncard/config.json'), 'utf8')
    );
    const local = JSON.parse(
        await readFile(join(app, 'environments/learncard/config.local.json'), 'utf8')
    );
    const config = deepMerge(deepMerge(DEFAULT_LEARNCARD_TENANT_CONFIG, base), local);
    // Replacing these blocks (rather than merging) avoids inherited production keys.
    config.domain = 'localhost:3000';
    config.devDomain = 'localhost:3000';
    config.stage = 'local';
    config.apis = {
        brainService: 'http://localhost:4000/trpc',
        brainServiceApi: 'http://localhost:4000/api',
        cloudService: 'http://localhost:4100/trpc',
        lcaApi: 'http://localhost:5100/trpc',
        notificationsEndpoint: 'http://localhost:5100/api/notifications/send',
        xapi: 'http://localhost:4100/xapi',
        aiService: 'http://localhost:4300',
        aiAgentService: 'http://localhost:4300',
    };
    // Seed login is the production developer-login path. Keycloak avoids initializing
    // Firebase's live SDK; interactive OAuth and AI are intentionally not provisioned.
    config.auth = {
        provider: 'keycloak',
        keyDerivation: 'sss',
        keycloak: local.auth.keycloak,
        sss: local.auth.sss,
    };
    config.observability = {
        sentryDsn: '',
        sentryEnv: 'verification',
        sentryTraceDomains: [],
        launchDarklyClientId: '',
        userflowToken: '',
        analyticsProvider: 'noop',
        posthogKey: '',
        googleMapsApiKey: '',
    };
    config.features = {
        ...(config.features as Record<string, unknown>),
        analytics: false,
        aiFeatures: false,
        samplePersonas: [],
        legacySamplePersonaContractUris: [],
    };
    // No upload provider is provisioned. Its configured endpoint is local so manual
    // exploration fails closed instead of uploading to the default Filestack account.
    config.storage = {
        provider: 's3',
        uploadEndpoint: 'http://localhost:5100/api/uploads',
        cdnDomain: 'localhost:5100',
    };
    const tenant = JSON.stringify(parseTenantConfig(config, 'lc verify local tenant'));
    await writeFile(join(directory, 'tenant-config.json'), tenant, { mode: 0o600 });
    const overlay: Plugin = {
        name: 'lc-verification-tenant',
        enforce: 'pre',
        configureServer(server) {
            server.middlewares.use((request, response, next) => {
                const pathname = request.url?.split('?')[0];
                if (
                    pathname === '/tenant-config.json' ||
                    pathname === '/__tenant-config' ||
                    pathname === '/__verification'
                ) {
                    response.setHeader('Content-Type', 'application/json');
                    response.setHeader('Cache-Control', 'no-store');
                    response.end(
                        pathname === '/__verification' ? JSON.stringify({ token }) : tenant
                    );
                    return;
                }
                next();
            });
        },
    };
    // Vite's config factory reads .env itself. Override every sanctioned setting it
    // consumes, and disable Vite's second env import so user VITE_* values cannot leak.
    Object.assign(process.env, {
        VITE_ENABLE_AUTH_DEBUG_WIDGET: 'false',
        VITE_CREDENTIAL_REFRESH_LOCAL_QA: 'true',
        VITE_DOCKER_SOURCE: 'true',
        VITE_AI_AGENT_URL: 'http://localhost:4300',
        ANALYZE: 'false',
        CHOKIDAR_USEPOLLING: 'false',
        CHOKIDAR_INTERVAL: '1000',
    });
    const resolved: UserConfig =
        typeof viteConfig === 'function'
            ? await viteConfig({ command: 'serve', mode: 'development' })
            : await viteConfig;
    const server = await createServer({
        ...resolved,
        root: app,
        configFile: false,
        envFile: false,
        mode: 'development',
        cacheDir: join(directory, 'vite-cache'),
        plugins: [overlay, ...(resolved.plugins ?? [])],
        server: {
            ...resolved.server,
            host: '127.0.0.1',
            port: 3000,
            strictPort: true,
            open: false,
        },
    });
    const shutdown = async (): Promise<void> => {
        await server.close();
        process.exit(0);
    };
    process.once('SIGINT', () => {
        void shutdown();
    });
    process.once('SIGTERM', () => {
        void shutdown();
    });
    await server.listen();
    server.printUrls();
};

void start().catch(error => {
    console.error(error);
    process.exit(1);
});
