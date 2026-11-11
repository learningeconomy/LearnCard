import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { deepMerge } from '../../../../packages/learn-card-base/src/config/deepMerge';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from '../../../../packages/learn-card-base/src/config/tenantDefaults';
import { parseTenantConfig } from '../../../../packages/learn-card-base/src/config/tenantConfigSchema';
import { embedSnippets } from '../../../../packages/learn-card-cli/scripts/embed-snippets';
import { renderTenantHtml } from '../render-tenant-html';
import { APP_ROOT } from './constants';
import { readStackEndpoints } from './stack';

/** Prepare only this owned stack's deployment artifacts; never mutate the developer tenant/index. */
export const prepareVerification = async (
    directory: string,
    options: { signal?: AbortSignal } = {}
): Promise<void> => {
    const { signal } = options;
    signal?.throwIfAborted();
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await embedSnippets(signal);
    const template = await readFile(join(APP_ROOT, 'index.template.html'), {
        encoding: 'utf8',
        signal,
    });
    // `lc verify prepare` also runs before allocation (e.g. before a CI typecheck).
    // Leave state creation to startStack, so a later --fresh still has its meaning.
    try {
        await stat(join(directory, 'state.json'));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        await writeFile(
            join(directory, 'index.html'),
            renderTenantHtml(template, DEFAULT_LEARNCARD_TENANT_CONFIG.branding),
            { mode: 0o600, signal }
        );
        return;
    }
    const stack = await readStackEndpoints(directory);
    const base = JSON.parse(
        await readFile(join(APP_ROOT, 'environments/learncard/config.json'), {
            encoding: 'utf8',
            signal,
        })
    );
    const local = JSON.parse(
        await readFile(join(APP_ROOT, 'environments/learncard/config.local.json'), {
            encoding: 'utf8',
            signal,
        })
    );
    const config = deepMerge(deepMerge(DEFAULT_LEARNCARD_TENANT_CONFIG, base), local);
    config.domain = `localhost:${stack.ports.app}`;
    config.devDomain = config.domain;
    config.stage = 'local';
    // Replace rather than merge: no inherited production keys or endpoints.
    config.apis = {
        brainService: stack.brain,
        brainServiceApi: stack.brainApi,
        cloudService: stack.cloud,
        lcaApi: stack.lcaApi,
        notificationsEndpoint: `http://localhost:${stack.ports.api}/api/notifications/send`,
        xapi: `http://localhost:${stack.ports.cloud}/xapi`,
        // AI is disabled and unprovisioned; keep any accidental call inside this stack.
        aiService: `http://localhost:${stack.ports.api}`,
        aiAgentService: `http://localhost:${stack.ports.api}`,
    };
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
    config.storage = {
        provider: 's3',
        uploadEndpoint: `http://localhost:${stack.ports.api}/api/uploads`,
        cdnDomain: `localhost:${stack.ports.api}`,
    };
    const tenant = parseTenantConfig(config, 'lc verify local tenant');
    await writeFile(join(directory, 'tenant-config.json'), JSON.stringify(tenant), {
        mode: 0o600,
        signal,
    });
    await writeFile(join(directory, 'index.html'), renderTenantHtml(template, tenant.branding), {
        mode: 0o600,
        signal,
    });
};
