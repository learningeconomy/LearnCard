/**
 * native-auth-audiences.ts
 *
 * Derives native Google/Apple sign-in audiences and Keycloak native-client
 * requirements *per tenant* from files that already exist — no new tenant
 * config fields. Sources:
 *
 *   - `environments/<tenant>/config.json` (+ `config.<stage>.json` overlay),
 *     merged the same way `prepare-native-config.ts` does (tenantDefaults →
 *     config.json → config.<stage>.json) — for `native.bundleId` and
 *     `auth.keycloak.*`.
 *   - `environments/<tenant>/assets/config/GoogleService-Info.plist` → the
 *     iOS Google OAuth client id (`CLIENT_ID`).
 *   - `environments/<tenant>/assets/config/google-services.json` → the
 *     Android "web" OAuth client id: the `client_type: 3`
 *     (`default_web_client_id`) entry under the `client[]` block whose
 *     `package_name` matches `native.bundleId`.
 *   - Apple's audience is simply `native.bundleId` (Sign in with Apple uses
 *     the bundle ID as `aud` for native clients).
 *
 * Both Firebase asset lookups fall back to the learncard tenant's files when
 * a tenant doesn't ship its own — mirroring the `FIREBASE_CONFIG_MAP`
 * fallback in `prepare-native-config.ts` — so the derived audiences match
 * what actually ships.
 *
 * Consumers:
 *   - `bun run lc auth-audiences` — human-readable report + combined CSV env
 *     lines ready to paste into an lca-api deployment.
 *   - `bun run lc dev` — auto-injects `GOOGLE_OAUTH_CLIENT_IDS` /
 *     `APPLE_OAUTH_CLIENT_IDS` into the local docker compose invocation.
 *   - `validate-native-auth.ts` — `lc validate` cross-checks for tenants /
 *     stages whose merged `auth.provider` is `'keycloak'`.
 *
 * IMPORTANT: `GOOGLE_OAUTH_CLIENT_IDS` / `APPLE_OAUTH_CLIENT_IDS` remain a
 * SERVER-controlled allowlist read once from the environment
 * (services/learn-card-network/lca-api/src/helpers/social-token.helpers.ts).
 * Nothing here is read at request time, and nothing here talks to a client-
 * claimed tenant config — this module only helps humans/scripts populate
 * that env var correctly for a given deployment.
 */

import { existsSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

import { deepMerge } from 'learn-card-base/src/config/deepMerge';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from 'learn-card-base/src/config/tenantDefaults';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');

/** Default `environments/` root — overridable (tests pass a temp fixture dir). */
export const DEFAULT_ENVIRONMENTS_DIR = resolve(APP_ROOT, 'environments');

/**
 * Web Origins required on the Keycloak native client. Constant across
 * tenants — the token-exchange `fetch` runs from the WebView, whose origin
 * is `capacitor://localhost` on iOS and `https://localhost` on Android (Capacitor's default androidScheme).
 * See infra/keycloak/README.md "Users and clients".
 */
export const KEYCLOAK_NATIVE_WEB_ORIGINS: readonly string[] = [
    'capacitor://localhost',
    'https://localhost',
];

export interface NativeAuthRequirements {
    tenantId: string;
    bundleId?: string;
    /** iOS Google OAuth client id, from GoogleService-Info.plist's CLIENT_ID. */
    googleIosClientId?: string;
    /** Android "web" (client_type 3 / default_web_client_id) ids, from google-services.json. */
    googleAndroidWebClientIds: string[];
    /** Deduped, sorted union of googleIosClientId + googleAndroidWebClientIds. */
    googleClientIds: string[];
    /** Apple audience — the app's bundle ID. */
    appleClientIds: string[];
    /** Keycloak native client "Valid Redirect URIs" entries (`<bundleId>://login`). */
    keycloakRedirectUris: string[];
    /** Keycloak native client "Web Origins" entries. */
    keycloakWebOrigins: string[];
    warnings: string[];
}

export interface MergedTenantConfigResult {
    config: Record<string, unknown>;
    warnings: string[];
}

/**
 * Load `environments/<tenant>/config.json` (+ `config.<stage>.json` overlay),
 * deep-merged onto `DEFAULT_LEARNCARD_TENANT_CONFIG` — the same merge order
 * `prepare-native-config.ts` uses at build time. Never throws: missing or
 * unparsable files become warnings and the corresponding override is treated
 * as `{}`.
 */
export const loadMergedTenantConfig = (
    tenantId: string,
    stageId?: string,
    environmentsDir: string = DEFAULT_ENVIRONMENTS_DIR
): MergedTenantConfigResult => {
    const warnings: string[] = [];
    const tenantDir = join(environmentsDir, tenantId);
    const configPath = join(tenantDir, 'config.json');

    let tenantOverrides: Record<string, unknown> = {};

    if (existsSync(configPath)) {
        try {
            tenantOverrides = JSON.parse(readFileSync(configPath, 'utf-8'));
        } catch {
            warnings.push(`Could not parse ${configPath} as JSON.`);
        }
    } else {
        warnings.push(`No config.json found for tenant "${tenantId}" at ${configPath}.`);
    }

    let stageOverrides: Record<string, unknown> = {};

    if (stageId) {
        const stagePath = join(tenantDir, `config.${stageId}.json`);

        if (existsSync(stagePath)) {
            try {
                stageOverrides = JSON.parse(readFileSync(stagePath, 'utf-8'));
            } catch {
                warnings.push(`Could not parse ${stagePath} as JSON.`);
            }
        } else {
            warnings.push(
                `No stage overlay for "${tenantId}/${stageId}" at ${stagePath} — using base config only.`
            );
        }
    }

    const config = deepMerge(
        deepMerge(
            DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
            tenantOverrides
        ),
        stageOverrides
    );

    return { config, warnings };
};

/** Read a dotted path (e.g. `"native.bundleId"`) off a plain object. */
const getPath = (obj: unknown, path: string): unknown =>
    path
        .split('.')
        .reduce<unknown>(
            (o, key) =>
                o && typeof o === 'object' ? (o as Record<string, unknown>)[key] : undefined,
            obj
        );

/**
 * Resolve a tenant's Firebase config asset, falling back to the learncard
 * tenant's copy when the tenant doesn't ship its own — mirrors the
 * `FIREBASE_CONFIG_MAP` fallback in `prepare-native-config.ts` so the derived
 * audiences match what actually gets built.
 */
const resolveConfigAsset = (
    environmentsDir: string,
    tenantId: string,
    fileName: string
): string | undefined => {
    const tenantPath = join(environmentsDir, tenantId, 'assets', 'config', fileName);

    if (existsSync(tenantPath)) return tenantPath;
    if (tenantId === 'learncard') return undefined;

    const fallbackPath = join(environmentsDir, 'learncard', 'assets', 'config', fileName);

    return existsSync(fallbackPath) ? fallbackPath : undefined;
};

export interface PlistClientIdResult {
    clientId?: string;
    warning?: string;
}

/**
 * Dependency-free `CLIENT_ID` extraction from a `GoogleService-Info.plist`.
 * Regex-based key/string lookup rather than a full plist parser (or shelling
 * out to macOS-only `plutil`), so this also works on Linux CI.
 */
export const parseGoogleServiceInfoPlistClientId = (filePath: string): PlistClientIdResult => {
    let raw: string;

    try {
        raw = readFileSync(filePath, 'utf-8');
    } catch {
        return { warning: `Could not read ${filePath}.` };
    }

    const match = raw.match(/<key>CLIENT_ID<\/key>\s*<string>([^<]+)<\/string>/);

    if (!match?.[1]) {
        return { warning: `CLIENT_ID key not found in ${filePath}.` };
    }

    return { clientId: match[1] };
};

interface GoogleServicesOAuthClient {
    client_id?: string;
    client_type?: number;
}

interface GoogleServicesClientEntry {
    client_info?: { android_client_info?: { package_name?: string } };
    oauth_client?: GoogleServicesOAuthClient[];
}

interface GoogleServicesFile {
    client?: GoogleServicesClientEntry[];
}

export interface GoogleServicesWebClientIdsResult {
    clientIds: string[];
    warning?: string;
}

/**
 * Extract the `client_type: 3` ("default_web_client_id") OAuth client id(s)
 * from `google-services.json` for the `client[]` block whose
 * `android_client_info.package_name` matches `packageName`. `client_type: 3`
 * is the web client Google's server-side token verification expects as the
 * `aud` for a native Android app's ID token.
 */
export const parseGoogleServicesWebClientIds = (
    filePath: string,
    packageName: string
): GoogleServicesWebClientIdsResult => {
    let raw: string;

    try {
        raw = readFileSync(filePath, 'utf-8');
    } catch {
        return { clientIds: [], warning: `Could not read ${filePath}.` };
    }

    let parsed: GoogleServicesFile;

    try {
        parsed = JSON.parse(raw);
    } catch {
        return { clientIds: [], warning: `Could not parse ${filePath} as JSON.` };
    }

    const matchingClients = (parsed.client ?? []).filter(
        c => c.client_info?.android_client_info?.package_name === packageName
    );

    if (matchingClients.length === 0) {
        return {
            clientIds: [],
            warning: `No client entry for package "${packageName}" in ${filePath}.`,
        };
    }

    const ids = new Set<string>();

    for (const client of matchingClients) {
        for (const oauth of client.oauth_client ?? []) {
            if (oauth.client_type === 3 && oauth.client_id) ids.add(oauth.client_id);
        }
    }

    if (ids.size === 0) {
        return {
            clientIds: [],
            warning: `No client_type 3 (web) OAuth client for package "${packageName}" in ${filePath}.`,
        };
    }

    return { clientIds: [...ids].sort() };
};

/**
 * Derive native Google/Apple sign-in audiences + Keycloak native client
 * requirements for one tenant/stage. Pure with respect to process state — no
 * writes, never throws. Missing inputs become entries in `warnings` plus
 * empty arrays / `undefined` fields.
 */
export const deriveNativeAuthRequirements = (
    tenantId: string,
    stageId?: string,
    environmentsDir: string = DEFAULT_ENVIRONMENTS_DIR
): NativeAuthRequirements => {
    const warnings: string[] = [];

    const { config, warnings: configWarnings } = loadMergedTenantConfig(
        tenantId,
        stageId,
        environmentsDir
    );

    warnings.push(...configWarnings);

    const bundleId = getPath(config, 'native.bundleId') as string | undefined;

    if (!bundleId) {
        warnings.push(
            `No native.bundleId resolved for tenant "${tenantId}" — cannot derive the Apple audience or the Keycloak redirect URI.`
        );
    }

    let googleIosClientId: string | undefined;
    const iosPlistPath = resolveConfigAsset(environmentsDir, tenantId, 'GoogleService-Info.plist');

    if (!iosPlistPath) {
        warnings.push(
            `No GoogleService-Info.plist found for tenant "${tenantId}" (checked tenant assets and the learncard fallback).`
        );
    } else {
        const result = parseGoogleServiceInfoPlistClientId(iosPlistPath);

        googleIosClientId = result.clientId;
        if (result.warning) warnings.push(`${result.warning} (tenant "${tenantId}")`);
    }

    let googleAndroidWebClientIds: string[] = [];
    const androidJsonPath = resolveConfigAsset(environmentsDir, tenantId, 'google-services.json');

    if (!androidJsonPath) {
        warnings.push(
            `No google-services.json found for tenant "${tenantId}" (checked tenant assets and the learncard fallback).`
        );
    } else if (!bundleId) {
        warnings.push(
            `Skipping Android Google client lookup for tenant "${tenantId}" — no bundleId resolved.`
        );
    } else {
        const result = parseGoogleServicesWebClientIds(androidJsonPath, bundleId);

        googleAndroidWebClientIds = result.clientIds;
        if (result.warning) warnings.push(`${result.warning} (tenant "${tenantId}")`);
    }

    const googleClientIds = Array.from(
        new Set([...(googleIosClientId ? [googleIosClientId] : []), ...googleAndroidWebClientIds])
    ).sort();

    const appleClientIds = bundleId ? [bundleId] : [];
    const keycloakRedirectUris = bundleId ? [`${bundleId}://login`] : [];

    return {
        tenantId,
        bundleId,
        googleIosClientId,
        googleAndroidWebClientIds,
        googleClientIds,
        appleClientIds,
        keycloakRedirectUris,
        keycloakWebOrigins: [...KEYCLOAK_NATIVE_WEB_ORIGINS],
        warnings,
    };
};

/** Deduped, sorted CSV audiences across tenants — ready for an lca-api deployment env. */
export const mergeAudiences = (
    requirements: NativeAuthRequirements[]
): { google: string; apple: string } => {
    const google = Array.from(new Set(requirements.flatMap(r => r.googleClientIds))).sort();
    const apple = Array.from(new Set(requirements.flatMap(r => r.appleClientIds))).sort();

    return { google: google.join(','), apple: apple.join(',') };
};

/** Safely single-quote a value for embedding in a `sh -c` command string. */
export const shellSingleQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

/**
 * Build the ` GOOGLE_OAUTH_CLIENT_IDS='...' APPLE_OAUTH_CLIENT_IDS='...'`
 * prefix for the local docker compose command (leading space included so it
 * concatenates directly after other inline env assignments). Returns `''`
 * when both audiences are empty; each var is included independently
 * otherwise.
 */
export const buildAudiencesEnvPrefix = (merged: { google: string; apple: string }): string => {
    const parts: string[] = [];

    if (merged.google) parts.push(`GOOGLE_OAUTH_CLIENT_IDS=${shellSingleQuote(merged.google)}`);
    if (merged.apple) parts.push(`APPLE_OAUTH_CLIENT_IDS=${shellSingleQuote(merged.apple)}`);

    return parts.length > 0 ? ` ${parts.join(' ')}` : '';
};

// ---------------------------------------------------------------------------
// Keycloak native-client validation rules — used by validate-native-auth.ts
// and exercised directly by unit tests. Kept pure/side-effect-free here so
// the rules are testable without touching the filesystem.
// ---------------------------------------------------------------------------

export interface KeycloakNativeConfigInput {
    tenantId: string;
    stageId?: string;
    authProvider?: string;
    bundleId?: string;
    keycloakServerUrl?: string;
    keycloakRealm?: string;
    keycloakClientId?: string;
    keycloakAuthBridgeUrl?: string;
}

export interface KeycloakNativeConfigResult {
    /** `false` when `authProvider !== 'keycloak'` — nothing to check. */
    applicable: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Validate native-sign-in requirements for a tenant/stage whose merged
 * `auth.provider` is `'keycloak'`. No-op (`applicable: false`) otherwise.
 *
 * `googleClientIds` is passed in rather than re-derived here so callers can
 * reuse a `deriveNativeAuthRequirements()` result they already computed.
 */
export const validateKeycloakNativeConfig = (
    input: KeycloakNativeConfigInput,
    googleClientIds: string[]
): KeycloakNativeConfigResult => {
    if (input.authProvider !== 'keycloak') {
        return { applicable: false, errors: [], warnings: [] };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const isLocalStage = (input.stageId ?? 'production').toLowerCase().includes('local');

    if (!input.bundleId) {
        errors.push('auth.provider is "keycloak" but native.bundleId is not set.');
    }

    if (!input.keycloakServerUrl) {
        errors.push('auth.provider is "keycloak" but auth.keycloak.serverUrl is not set.');
    }

    if (!input.keycloakRealm) {
        errors.push('auth.provider is "keycloak" but auth.keycloak.realm is not set.');
    }

    if (!input.keycloakClientId) {
        errors.push('auth.provider is "keycloak" but auth.keycloak.clientId is not set.');
    }

    if (
        input.keycloakAuthBridgeUrl &&
        !input.keycloakAuthBridgeUrl.startsWith('https:') &&
        !isLocalStage
    ) {
        errors.push(
            `auth.keycloak.authBridgeUrl must use https: outside local stages (got "${input.keycloakAuthBridgeUrl}").`
        );
    }

    if (googleClientIds.length === 0) {
        warnings.push(
            'auth.provider is "keycloak" but no native Google OAuth client IDs could be derived (see `bun run lc auth-audiences`).'
        );
    }

    return { applicable: true, errors, warnings };
};
