import { afterEach, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { deriveRealmInputs, writeRealmInputs } from './keycloak-realm-inputs';

const directories: string[] = [];
const fixture = (): string => {
    const dir = mkdtempSync(join(tmpdir(), 'lc-realm-'));
    directories.push(dir);
    return dir;
};
const tenant = (dir: string, name: string, overrides: Record<string, unknown> = {}): void => {
    mkdirSync(join(dir, name), { recursive: true });
    writeFileSync(
        join(dir, name, 'config.json'),
        JSON.stringify({
            tenantId: name,
            domain: `${name}.example.com`,
            auth: {
                provider: 'keycloak',
                keycloak: {
                    serverUrl: 'https://auth.example.com',
                    realm: 'shared',
                    clientId: 'learncard-app',
                    googleClientId: 'web-google',
                    appleClientId: 'web-apple',
                },
            },
            native: { bundleId: `com.${name}.app` },
            apis: { lcaApi: 'https://api.example.com/trpc' },
            ...overrides,
        })
    );
};
afterEach((): void => {
    for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('realm inputs', (): void => {
    test('groups shared identity domains and deduplicates native origins', (): void => {
        const dir = fixture();
        tenant(dir, 'b');
        tenant(dir, 'a');
        tenant(dir, 'firebase', { auth: { provider: 'firebase' } });
        const realm = deriveRealmInputs('staging', dir).realms.shared;
        expect(realm.tenants).toEqual(['a', 'b']);
        expect(realm.redirect_uris).toContain('com.a.app://login');
        expect(realm.web_origins).toEqual([
            'capacitor://localhost',
            'https://a.example.com',
            'https://b.example.com',
            'https://localhost',
        ]);
        expect(realm.apple_oauth_client_ids).toEqual(['com.a.app', 'com.b.app']);
        expect(realm.apple_client_id).toBe('web-apple');
        expect(realm.lca_api_issuer_url).toBe('https://api.example.com');
    });
    test('stage overrides base config and missing overlays retain base', (): void => {
        const dir = fixture();
        tenant(dir, 'a');
        writeFileSync(
            join(dir, 'a/config.staging.json'),
            JSON.stringify({ domain: 'stage.example.com' })
        );
        expect(deriveRealmInputs('staging', dir).realms.shared.redirect_uris).toContain(
            'https://stage.example.com/*'
        );
        expect(deriveRealmInputs('production', dir).realms.shared.redirect_uris).toContain(
            'https://a.example.com/*'
        );
    });
    test('rejects malformed overlays instead of silently dropping configuration', (): void => {
        const dir = fixture();
        tenant(dir, 'a');
        writeFileSync(join(dir, 'a/config.staging.json'), '{');
        expect(() => deriveRealmInputs('staging', dir)).toThrow('Invalid JSON');
    });
    test('rejects same realm on different servers and conflicting social IDs', (): void => {
        const dir = fixture();
        tenant(dir, 'a');
        tenant(dir, 'b');
        writeFileSync(
            join(dir, 'b/config.staging.json'),
            JSON.stringify({ auth: { keycloak: { serverUrl: 'https://other.example.com' } } })
        );
        expect(() => deriveRealmInputs('staging', dir)).toThrow('Conflicting');
        writeFileSync(
            join(dir, 'b/config.staging.json'),
            JSON.stringify({ auth: { keycloak: { appleClientId: 'other' } } })
        );
        expect(() => deriveRealmInputs('staging', dir)).toThrow('Conflicting');
    });
    test('does not invent Apple web ID from native bundle', (): void => {
        const dir = fixture();
        tenant(dir, 'a', {
            auth: {
                provider: 'keycloak',
                keycloak: {
                    serverUrl: 'https://auth.example.com',
                    realm: 'shared',
                    clientId: 'learncard-app',
                },
            },
        });
        expect(deriveRealmInputs('staging', dir).realms.shared.apple_client_id).toBeNull();
    });
    test('fails closed on empty stage, unsafe stage and deployed HTTP', (): void => {
        const dir = fixture();
        expect(() => deriveRealmInputs('staging', dir)).toThrow('No Keycloak');
        expect(() => deriveRealmInputs('../staging', dir)).toThrow('Invalid stage');
        tenant(dir, 'a', { apis: { lcaApi: 'http://localhost:5100/trpc' } });
        expect(() => deriveRealmInputs('staging', dir)).toThrow('HTTPS');
    });
    test('check detects stale files without overwriting them', (): void => {
        const dir = fixture();
        tenant(dir, 'a');
        const inputs = deriveRealmInputs('staging', dir);
        const path = join(dir, 'output.json');
        expect(() => writeRealmInputs(inputs, path, true)).toThrow('Stale');
        writeRealmInputs(inputs, path, false);
        writeRealmInputs(inputs, path, true);
        writeFileSync(path, '{}');
        expect(() => writeRealmInputs(inputs, path, true)).toThrow('Stale');
        expect(readFileSync(path, 'utf8')).toBe('{}');
    });
});
