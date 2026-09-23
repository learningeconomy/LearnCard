/**
 * Run with: bun test apps/learn-card-app/scripts/native-auth-audiences.test.ts
 * (cwd: apps/learn-card-app, so the "learn-card-base" tsconfig path alias resolves).
 *
 * Not under src/, so it's outside vitest.config.ts's `include`
 * (`src/**\/*.test.{ts,tsx}`) — uses Bun's built-in test runner instead.
 */
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import {
    buildAudiencesEnvPrefix,
    deriveNativeAuthRequirements,
    mergeAudiences,
    parseGoogleServiceInfoPlistClientId,
    parseGoogleServicesWebClientIds,
    shellSingleQuote,
    validateKeycloakNativeConfig,
} from './native-auth-audiences';

const PLIST_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CLIENT_ID</key>
	<string>111111-ios-client.apps.googleusercontent.com</string>
	<key>BUNDLE_ID</key>
	<string>com.example.app</string>
</dict>
</plist>
`;

const GOOGLE_SERVICES_FIXTURE = JSON.stringify({
    project_info: { project_number: '111111', project_id: 'example' },
    client: [
        {
            client_info: { android_client_info: { package_name: 'com.example.app' } },
            oauth_client: [
                { client_id: '111111-android-cert.apps.googleusercontent.com', client_type: 1 },
                { client_id: '111111-android-web.apps.googleusercontent.com', client_type: 3 },
            ],
        },
        {
            client_info: { android_client_info: { package_name: 'com.other.app' } },
            oauth_client: [
                { client_id: '222222-other-web.apps.googleusercontent.com', client_type: 3 },
            ],
        },
    ],
});

describe('parseGoogleServiceInfoPlistClientId', () => {
    let dir: string;

    beforeAll(() => {
        dir = mkdtempSync(join(tmpdir(), 'lc-native-auth-plist-'));
    });

    afterAll(() => {
        rmSync(dir, { recursive: true, force: true });
    });

    test('extracts CLIENT_ID from a valid plist', () => {
        const filePath = join(dir, 'GoogleService-Info.plist');
        writeFileSync(filePath, PLIST_FIXTURE, 'utf-8');

        const result = parseGoogleServiceInfoPlistClientId(filePath);

        expect(result.clientId).toBe('111111-ios-client.apps.googleusercontent.com');
        expect(result.warning).toBeUndefined();
    });

    test('warns without throwing when the file is missing', () => {
        const result = parseGoogleServiceInfoPlistClientId(join(dir, 'missing.plist'));

        expect(result.clientId).toBeUndefined();
        expect(result.warning).toContain('Could not read');
    });

    test('warns without throwing when CLIENT_ID is absent', () => {
        const filePath = join(dir, 'no-client-id.plist');
        writeFileSync(
            filePath,
            '<plist><dict><key>BUNDLE_ID</key><string>x</string></dict></plist>',
            'utf-8'
        );

        const result = parseGoogleServiceInfoPlistClientId(filePath);

        expect(result.clientId).toBeUndefined();
        expect(result.warning).toContain('CLIENT_ID key not found');
    });
});

describe('parseGoogleServicesWebClientIds', () => {
    let dir: string;
    let filePath: string;

    beforeAll(() => {
        dir = mkdtempSync(join(tmpdir(), 'lc-native-auth-gservices-'));
        filePath = join(dir, 'google-services.json');
        writeFileSync(filePath, GOOGLE_SERVICES_FIXTURE, 'utf-8');
    });

    afterAll(() => {
        rmSync(dir, { recursive: true, force: true });
    });

    test('picks the client_type 3 id for the matching package, ignoring client_type 1', () => {
        const result = parseGoogleServicesWebClientIds(filePath, 'com.example.app');

        expect(result.clientIds).toEqual(['111111-android-web.apps.googleusercontent.com']);
        expect(result.warning).toBeUndefined();
    });

    test('warns without throwing when the package is not present', () => {
        const result = parseGoogleServicesWebClientIds(filePath, 'com.unknown.app');

        expect(result.clientIds).toEqual([]);
        expect(result.warning).toContain('No client entry for package');
    });

    test('warns without throwing when the file is missing', () => {
        const result = parseGoogleServicesWebClientIds(
            join(dir, 'missing.json'),
            'com.example.app'
        );

        expect(result.clientIds).toEqual([]);
        expect(result.warning).toContain('Could not read');
    });
});

describe('deriveNativeAuthRequirements', () => {
    let environmentsDir: string;

    beforeAll(() => {
        environmentsDir = mkdtempSync(join(tmpdir(), 'lc-native-auth-env-'));

        // learncard: full tenant — config.json + Firebase assets
        const learncardConfigDir = join(environmentsDir, 'learncard', 'assets', 'config');
        mkdirSync(learncardConfigDir, { recursive: true });
        writeFileSync(
            join(environmentsDir, 'learncard', 'config.json'),
            JSON.stringify({ tenantId: 'learncard', native: { bundleId: 'com.learncard.app' } }),
            'utf-8'
        );
        writeFileSync(join(learncardConfigDir, 'GoogleService-Info.plist'), PLIST_FIXTURE, 'utf-8');
        writeFileSync(
            join(learncardConfigDir, 'google-services.json'),
            JSON.stringify({
                client: [
                    {
                        client_info: { android_client_info: { package_name: 'com.learncard.app' } },
                        oauth_client: [
                            {
                                client_id: 'lc-android-web.apps.googleusercontent.com',
                                client_type: 3,
                            },
                        ],
                    },
                ],
            }),
            'utf-8'
        );

        // barebones: only config.json — no assets/ dir at all, so lookups fall
        // back to learncard's Firebase files (same fallback prepare-native-config.ts uses).
        mkdirSync(join(environmentsDir, 'barebones'), { recursive: true });
        writeFileSync(
            join(environmentsDir, 'barebones', 'config.json'),
            JSON.stringify({ tenantId: 'barebones', native: { bundleId: 'com.barebones.app' } }),
            'utf-8'
        );
    });

    afterAll(() => {
        rmSync(environmentsDir, { recursive: true, force: true });
    });

    test('derives Google/Apple/Keycloak requirements for a fully configured tenant', () => {
        const result = deriveNativeAuthRequirements('learncard', undefined, environmentsDir);

        expect(result.bundleId).toBe('com.learncard.app');
        expect(result.googleIosClientId).toBe('111111-ios-client.apps.googleusercontent.com');
        expect(result.googleAndroidWebClientIds).toEqual([
            'lc-android-web.apps.googleusercontent.com',
        ]);
        expect([...result.googleClientIds].sort()).toEqual(
            [
                '111111-ios-client.apps.googleusercontent.com',
                'lc-android-web.apps.googleusercontent.com',
            ].sort()
        );
        expect(result.appleClientIds).toEqual(['com.learncard.app']);
        expect(result.keycloakRedirectUris).toEqual(['com.learncard.app://login']);
        expect(result.keycloakWebOrigins).toEqual(['capacitor://localhost', 'http://localhost']);
        expect(result.warnings).toEqual([]);
    });

    test('falls back to learncard Firebase assets and warns when a tenant has none of its own', () => {
        const result = deriveNativeAuthRequirements('barebones', undefined, environmentsDir);

        // Falls back to learncard's files, but "com.barebones.app" isn't a
        // package in the fallback google-services.json, so only the iOS id resolves.
        expect(result.bundleId).toBe('com.barebones.app');
        expect(result.googleIosClientId).toBe('111111-ios-client.apps.googleusercontent.com');
        expect(result.googleAndroidWebClientIds).toEqual([]);
        expect(
            result.warnings.some(w => w.includes('No client entry for package "com.barebones.app"'))
        ).toBe(true);
    });

    test('never throws when the tenant directory does not exist — warns, then resolves via defaults + the learncard fallback', () => {
        const result = deriveNativeAuthRequirements('ghost-tenant', undefined, environmentsDir);

        expect(
            result.warnings.some(w => w.includes('No config.json found for tenant "ghost-tenant"'))
        ).toBe(true);
        // DEFAULT_LEARNCARD_TENANT_CONFIG still supplies native.bundleId, and the
        // learncard fallback Firebase files resolve fully underneath it.
        expect(result.bundleId).toBe('com.learncard.app');
        expect(result.googleIosClientId).toBe('111111-ios-client.apps.googleusercontent.com');
    });
});

describe('deriveNativeAuthRequirements — no learncard fallback available', () => {
    let environmentsDir: string;

    beforeAll(() => {
        environmentsDir = mkdtempSync(join(tmpdir(), 'lc-native-auth-nofallback-'));
        mkdirSync(join(environmentsDir, 'solo'), { recursive: true });
        writeFileSync(
            join(environmentsDir, 'solo', 'config.json'),
            JSON.stringify({ tenantId: 'solo', native: { bundleId: 'com.solo.app' } }),
            'utf-8'
        );
    });

    afterAll(() => {
        rmSync(environmentsDir, { recursive: true, force: true });
    });

    test('warns with empty arrays (never throws) when neither the tenant nor learncard has Firebase assets', () => {
        const result = deriveNativeAuthRequirements('solo', undefined, environmentsDir);

        expect(result.bundleId).toBe('com.solo.app');
        expect(result.googleIosClientId).toBeUndefined();
        expect(result.googleAndroidWebClientIds).toEqual([]);
        expect(result.googleClientIds).toEqual([]);
        expect(result.appleClientIds).toEqual(['com.solo.app']);
        expect(result.keycloakRedirectUris).toEqual(['com.solo.app://login']);
        expect(
            result.warnings.some(w =>
                w.includes('No GoogleService-Info.plist found for tenant "solo"')
            )
        ).toBe(true);
        expect(
            result.warnings.some(w => w.includes('No google-services.json found for tenant "solo"'))
        ).toBe(true);
    });
});

describe('mergeAudiences', () => {
    test('dedupes and sorts across tenants', () => {
        const merged = mergeAudiences([
            {
                tenantId: 'a',
                bundleId: 'com.a.app',
                googleAndroidWebClientIds: ['b-id', 'a-id'],
                googleClientIds: ['b-id', 'a-id'],
                appleClientIds: ['com.a.app'],
                keycloakRedirectUris: [],
                keycloakWebOrigins: [],
                warnings: [],
            },
            {
                tenantId: 'b',
                bundleId: 'com.b.app',
                googleAndroidWebClientIds: ['a-id'],
                googleClientIds: ['a-id'],
                appleClientIds: ['com.b.app', 'com.a.app'],
                keycloakRedirectUris: [],
                keycloakWebOrigins: [],
                warnings: [],
            },
        ]);

        expect(merged.google).toBe('a-id,b-id');
        expect(merged.apple).toBe('com.a.app,com.b.app');
    });

    test('returns empty strings when there is nothing to merge', () => {
        expect(mergeAudiences([])).toEqual({ google: '', apple: '' });
    });
});

describe('shellSingleQuote / buildAudiencesEnvPrefix', () => {
    test('escapes embedded single quotes', () => {
        expect(shellSingleQuote(`a'b`)).toBe(`'a'\\''b'`);
    });

    test('builds a prefix with both vars when both are non-empty', () => {
        const prefix = buildAudiencesEnvPrefix({ google: 'g1,g2', apple: 'a1' });

        expect(prefix).toBe(` GOOGLE_OAUTH_CLIENT_IDS='g1,g2' APPLE_OAUTH_CLIENT_IDS='a1'`);
    });

    test('omits a var when its audience is empty, and returns "" when both are', () => {
        expect(buildAudiencesEnvPrefix({ google: 'g1', apple: '' })).toBe(
            ` GOOGLE_OAUTH_CLIENT_IDS='g1'`
        );
        expect(buildAudiencesEnvPrefix({ google: '', apple: '' })).toBe('');
    });
});

describe('validateKeycloakNativeConfig', () => {
    test('is a no-op for non-keycloak providers', () => {
        const result = validateKeycloakNativeConfig(
            { tenantId: 't', authProvider: 'firebase' },
            []
        );

        expect(result).toEqual({ applicable: false, errors: [], warnings: [] });
    });

    test('errors when bundleId is missing', () => {
        const result = validateKeycloakNativeConfig(
            {
                tenantId: 't',
                authProvider: 'keycloak',
                keycloakServerUrl: 'http://localhost:8081',
                keycloakRealm: 'learncard',
                keycloakClientId: 'learncard-app',
            },
            ['some-id']
        );

        expect(result.applicable).toBe(true);
        expect(result.errors).toEqual([
            'auth.provider is "keycloak" but native.bundleId is not set.',
        ]);
    });

    test('errors when authBridgeUrl is http on a non-local stage (e.g. staging)', () => {
        const result = validateKeycloakNativeConfig(
            {
                tenantId: 't',
                stageId: 'staging',
                authProvider: 'keycloak',
                bundleId: 'com.example.app',
                keycloakServerUrl: 'https://auth.example.com',
                keycloakRealm: 'example',
                keycloakClientId: 'example-app',
                keycloakAuthBridgeUrl: 'http://example.com/auth/continue.html',
            },
            ['some-id']
        );

        expect(result.errors.some(e => e.includes('must use https:'))).toBe(true);
    });

    test('allows an http authBridgeUrl on a "local"-named stage (e.g. keycloak-local)', () => {
        const result = validateKeycloakNativeConfig(
            {
                tenantId: 'learncard',
                stageId: 'keycloak-local',
                authProvider: 'keycloak',
                bundleId: 'com.learncard.app',
                keycloakServerUrl: 'http://localhost:8081',
                keycloakRealm: 'learncard',
                keycloakClientId: 'learncard-app',
                keycloakAuthBridgeUrl: 'http://localhost:3000/auth/continue.html',
            },
            ['some-id']
        );

        expect(result.applicable).toBe(true);
        expect(result.errors).toEqual([]);
    });

    test('warns (does not error) when no Google client ids were derivable', () => {
        const result = validateKeycloakNativeConfig(
            {
                tenantId: 't',
                authProvider: 'keycloak',
                bundleId: 'com.example.app',
                keycloakServerUrl: 'https://auth.example.com',
                keycloakRealm: 'example',
                keycloakClientId: 'example-app',
            },
            []
        );

        expect(result.errors).toEqual([]);
        expect(result.warnings.length).toBe(1);
    });
});
