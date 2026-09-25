import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import {
    DEFAULT_ENVIRONMENTS_DIR,
    deriveNativeAuthRequirements,
    loadMergedTenantConfig,
} from './native-auth-audiences';

export interface RealmInputs {
    server_url: string;
    redirect_uris: string[];
    web_origins: string[];
    post_logout_redirect_uris: string[];
    google_client_id: string | null;
    apple_client_id: string | null;
    lca_api_issuer_url: string;
    tenants: string[];
    google_oauth_client_ids: string[];
    apple_oauth_client_ids: string[];
}

export interface RealmInputsFile {
    realms: Record<string, RealmInputs>;
}

const sorted = (values: string[]): string[] => [...new Set(values)].sort();
const object = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Expected a configuration object.');
    }
    return value as Record<string, unknown>;
};
const string = (value: unknown, field: string): string => {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing ${field}.`);
    return value;
};
const optionalString = (value: unknown, field: string): string | null =>
    value === undefined ? null : string(value, field);

/** Generate deterministic, non-secret realm inputs from the same merge as native builds. */
export const deriveRealmInputs = (
    stage = 'keycloak-staging',
    environmentsDir = DEFAULT_ENVIRONMENTS_DIR
): RealmInputsFile => {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(stage)) throw new Error('Invalid stage name.');
    const realms: Record<string, RealmInputs> = {};
    const tenants = readdirSync(environmentsDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && entry.name !== 'local')
        .map(entry => entry.name)
        .filter(tenant => existsSync(join(environmentsDir, tenant, 'config.json')))
        .sort();

    for (const tenant of tenants) {
        const stageId = stage === 'production' ? undefined : stage;
        const { config, warnings } = loadMergedTenantConfig(tenant, stageId, environmentsDir);
        // Missing overlays intentionally fall back to base; malformed JSON must never
        // silently remove a realm from an authoritative Terraform input file.
        if (warnings.some(warning => warning.startsWith('Could not parse'))) {
            throw new Error(`Invalid JSON for tenant ${tenant}.`);
        }
        const auth = object(config.auth);
        if (auth.provider !== 'keycloak') continue;
        const keycloak = object(auth.keycloak);
        const realm = string(keycloak.realm, 'auth.keycloak.realm');
        if (!/^[a-zA-Z0-9_-]+$/.test(realm) || realm === 'master') {
            throw new Error(`Invalid application realm: ${realm}.`);
        }
        if (keycloak.clientId !== 'learncard-app') {
            throw new Error(`${tenant}: realm module requires clientId learncard-app.`);
        }
        const server = new URL(string(keycloak.serverUrl, 'auth.keycloak.serverUrl'));
        const issuer = new URL(string(object(config.apis).lcaApi, 'apis.lcaApi'));
        const local = stage.includes('local');
        if (!local && (server.protocol !== 'https:' || issuer.protocol !== 'https:')) {
            throw new Error(`${tenant}: deployed authentication URLs must use HTTPS.`);
        }
        const domain = string(local ? config.devDomain : config.domain, 'domain');
        const origin = new URL(`${local ? 'http' : 'https'}://${domain}`).origin;
        const native = deriveNativeAuthRequirements(tenant, stageId, environmentsDir);
        // Native Apple bundle audiences are NOT Apple web Services IDs. Unspecified
        // web IDs remain null and must be supplied in the deployment secret JSON.
        const googleId =
            optionalString(keycloak.googleClientId, 'googleClientId') ??
            (native.googleAndroidWebClientIds.length === 1
                ? native.googleAndroidWebClientIds[0]
                : null);
        const appleId = optionalString(keycloak.appleClientId, 'appleClientId');
        const serverUrl = server.href.replace(/\/$/, '');
        const issuerUrl = issuer.href.replace(/\/trpc\/?$/, '').replace(/\/$/, '');
        const previous = realms[realm];
        if (
            previous &&
            (previous.server_url !== serverUrl ||
                previous.lca_api_issuer_url !== issuerUrl ||
                previous.google_client_id !== googleId ||
                previous.apple_client_id !== appleId)
        ) {
            throw new Error(`Conflicting server, issuer or social client IDs for realm ${realm}.`);
        }
        const current: RealmInputs = previous ?? {
            server_url: serverUrl,
            lca_api_issuer_url: issuerUrl,
            google_client_id: googleId,
            apple_client_id: appleId,
            redirect_uris: [],
            web_origins: [],
            post_logout_redirect_uris: [],
            tenants: [],
            google_oauth_client_ids: [],
            apple_oauth_client_ids: [],
        };
        current.redirect_uris = sorted([
            ...current.redirect_uris,
            `${origin}/*`,
            ...native.keycloakRedirectUris,
        ]);
        current.web_origins = sorted([
            ...current.web_origins,
            origin,
            ...native.keycloakWebOrigins,
        ]);
        current.post_logout_redirect_uris = sorted([
            ...current.post_logout_redirect_uris,
            `${origin}/*`,
            ...native.keycloakRedirectUris,
        ]);
        current.tenants = sorted([...current.tenants, tenant]);
        current.google_oauth_client_ids = sorted([
            ...current.google_oauth_client_ids,
            ...native.googleClientIds,
        ]);
        current.apple_oauth_client_ids = sorted([
            ...current.apple_oauth_client_ids,
            ...native.appleClientIds,
        ]);
        realms[realm] = current;
    }
    if (Object.keys(realms).length === 0)
        throw new Error(`No Keycloak tenants for ${stage}; refusing empty realm inputs.`);
    return {
        realms: Object.fromEntries(Object.entries(realms).sort(([a], [b]) => a.localeCompare(b))),
    };
};

/** Check without writing, or persist reviewed inputs. No IDs pass through the logger. */
export const writeRealmInputs = (inputs: RealmInputsFile, path: string, check: boolean): void => {
    const content = `${JSON.stringify(inputs, null, 4)}\n`;
    if (check) {
        if (!existsSync(path) || readFileSync(path, 'utf8') !== content) {
            throw new Error(
                `Stale realm inputs: ${path}. Run lc keycloak realm-inputs for this stage.`
            );
        }
    } else {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    }
};

export const runRealmInputs = (args: string[]): void => {
    const positional = args.filter(arg => !arg.startsWith('--'));
    if (positional.length > 1 || args.some(arg => arg.startsWith('--') && arg !== '--check')) {
        throw new Error('Usage: lc keycloak realm-inputs [stage] [--check]');
    }
    const stage = positional[0] ?? 'keycloak-staging';
    const path = resolve(
        import.meta.dir,
        '../../../infra/keycloak/terraform/realm/generated',
        `${stage}.tfvars.json`
    );
    writeRealmInputs(deriveRealmInputs(stage), path, args.includes('--check'));
    process.stdout.write(`${args.includes('--check') ? 'Checked' : 'Generated'} ${path}\n`);
};

if (import.meta.main) {
    try {
        runRealmInputs(process.argv.slice(2));
    } catch (error) {
        process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
        process.exitCode = 1;
    }
}
