#!/usr/bin/env bun
/** Configure only ignored development artifacts; never deploy or change release settings. */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from '../../../../packages/learn-card-base/src/config/tenantDefaults';
import { deepMerge } from '../../../../packages/learn-card-base/src/config/deepMerge';
import { parseTenantConfig } from '../../../../packages/learn-card-base/src/config/tenantConfigSchema';

const { values } = parseArgs({
    options: {
        'web-port': { type: 'string', default: '43157' },
        'brain-port': { type: 'string', default: '4000' },
        'cloud-port': { type: 'string', default: '4100' },
        'api-port': { type: 'string', default: '5100' },
        'after-sync': { type: 'boolean', default: false },
        bundled: { type: 'boolean', default: false },
        help: { type: 'boolean', default: false },
    },
});
if (values.help) {
    console.log(
        'Configure native account proof: --web-port 43157 --brain-port 4000 --cloud-port 4100 --api-port 5100; run again with --after-sync after cap sync android. Add --bundled to package built web assets instead of using Vite. Requires an existing local backend.'
    );
    process.exit(0);
}
const port = (value: string) => {
    const parsed = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(parsed) || parsed < 1024 || parsed > 65535)
        throw new Error('Use a valid unprivileged port');
    return parsed;
};
const ports = {
    web: port(values['web-port']!),
    brain: port(values['brain-port']!),
    cloud: port(values['cloud-port']!),
    api: port(values['api-port']!),
};
if (new Set(Object.values(ports)).size !== 4) throw new Error('Use distinct ports');
const app = resolve(import.meta.dir, '../..');
if (values['after-sync']) {
    const path = resolve(app, 'android/app/src/main/assets/capacitor.config.json');
    const config = JSON.parse(await readFile(path, 'utf8'));
    if (values.bundled) {
        const html = await readFile(
            resolve(app, 'android/app/src/main/assets/public/index.html'),
            'utf8'
        );
        if (html.includes('/src/index.tsx') || !/src=["']\/assets\/[^"']+\.js["']/.test(html))
            throw new Error(
                'Build the web app and run cap copy android before selecting bundled mode'
            );
    }
    config.appName = 'LearnCard Native Dev';
    config.server = { ...config.server, cleartext: true };
    if (values.bundled) delete config.server.url;
    else config.server.url = `http://localhost:${ports.web}`;
    config.android = { ...config.android, allowMixedContent: true, loggingBehavior: 'none' };
    config.plugins = {
        ...config.plugins,
        CapacitorUpdater: {
            ...config.plugins?.CapacitorUpdater,
            autoUpdate: false,
            // Local debug builds never download an OTA bundle. Keep the updater
            // launch handshake identical for live-server and bundled comparisons.
            appReadyTimeout: 1000,
        },
        FirebaseAuthentication: { skipNativeAuth: true },
    };
    await writeFile(path, JSON.stringify(config, null, 4) + '\n');
    console.log(
        `Ignored Android debug configuration updated (${values.bundled ? 'bundled assets' : 'Vite server'}). Build only with -PdigitalCredentialsDev.`
    );
} else {
    const base = JSON.parse(
        await readFile(resolve(app, 'environments/learncard/config.json'), 'utf8')
    );
    const local = JSON.parse(
        await readFile(resolve(app, 'environments/learncard/config.local.json'), 'utf8')
    );
    const config = deepMerge(deepMerge(DEFAULT_LEARNCARD_TENANT_CONFIG, base), local);
    config.stage = 'local';
    // Native connectivity checks the real HTTPS tenant asset, never the bundled/development origin.
    config.domain = base.domain;
    config.devDomain = config.domain;
    config.apis = {
        brainService: `http://localhost:${ports.brain}/trpc`,
        brainServiceApi: `http://localhost:${ports.brain}/api`,
        cloudService: `http://localhost:${ports.cloud}/trpc`,
        lcaApi: `http://localhost:${ports.api}/trpc`,
        notificationsEndpoint: `http://localhost:${ports.api}/api/notifications/send`,
        xapi: `http://localhost:${ports.cloud}/xapi`,
        aiService: `http://localhost:${ports.api}`,
        aiAgentService: `http://localhost:${ports.api}`,
    };
    config.auth = {
        provider: 'keycloak',
        keyDerivation: 'sss',
        keycloak: local.auth.keycloak,
        sss: { ...local.auth.sss, serverUrl: `http://localhost:${ports.api}/api` },
    };
    config.observability = {
        sentryDsn: '',
        sentryEnv: 'native-local-proof',
        sentryTraceDomains: [],
        launchDarklyClientId: '',
        userflowToken: '',
        analyticsProvider: 'noop',
        posthogKey: '',
        googleMapsApiKey: '',
    };
    config.features = {
        ...config.features,
        analytics: false,
        aiFeatures: false,
        samplePersonas: [],
        legacySamplePersonaContractUris: [],
    };
    config.storage = {
        provider: 's3',
        uploadEndpoint: `http://localhost:${ports.api}/api/uploads`,
        cdnDomain: `localhost:${ports.api}`,
    };
    await writeFile(
        resolve(app, 'public/tenant-config.json'),
        JSON.stringify(parseTenantConfig(config, 'native account proof'), null, 4) + '\n'
    );
    await mkdir(resolve(app, 'build'), { recursive: true });
    try {
        await access(resolve(app, 'build/index.html'));
    } catch {
        await writeFile(
            resolve(app, 'build/index.html'),
            '<!doctype html><html><body>Start the local LearnCard development server.</body></html>'
        );
    }
    console.log(
        values.bundled
            ? 'Ignored local tenant configuration ready. Build web assets, run cap copy android, then rerun with --after-sync --bundled. Local APIs remain required.'
            : 'Ignored local tenant configuration ready. This debug APK uses the Vite development server, not an offline production bundle.'
    );
}
