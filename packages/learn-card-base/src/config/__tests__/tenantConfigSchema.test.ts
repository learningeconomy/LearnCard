import { describe, it, expect } from 'vitest';

import { tenantConfigSchema, parseTenantConfig } from '../tenantConfigSchema';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from '../tenantDefaults';

describe('tenantConfigSchema', () => {
    it('validates the default config successfully', () => {
        const result = tenantConfigSchema.safeParse(DEFAULT_LEARNCARD_TENANT_CONFIG);

        expect(result.success).toBe(true);
    });

    it('returns the full config shape from defaults', () => {
        const result = tenantConfigSchema.parse(DEFAULT_LEARNCARD_TENANT_CONFIG);

        expect(result.tenantId).toBe('learncard');
        expect(result.domain).toBe('learncard.app');
        expect(result.apis.brainService).toContain('network.learncard.com');
        expect(result.auth.provider).toBe('firebase');
        expect(result.auth.keyDerivation).toBe('sss');
        expect(result.branding.name).toBe('LearnCard');
        expect(result.features.aiFeatures).toBe(true);
        expect(result.observability.launchDarklyClientId).toBeTruthy();
        expect(result.native.bundleId).toBe('com.learncard.app');
    });

    it('applies Zod defaults for missing optional fields', () => {
        const minimal = {
            tenantId: 'test',
            domain: 'test.example.com',
            apis: {
                brainService: 'https://brain.test.com/trpc',
                brainServiceApi: 'https://brain.test.com/api',
                cloudService: 'https://cloud.test.com/trpc',
                lcaApi: 'https://api.test.com/trpc',
            },
            auth: {
                firebase: {
                    apiKey: 'test-key',
                    authDomain: 'test.firebaseapp.com',
                    projectId: 'test',
                    storageBucket: 'test.appspot.com',
                    messagingSenderId: '123',
                    appId: '1:123:web:abc',
                },
            },
            branding: {
                name: 'Test App',
            },
            features: {},
            observability: {
                launchDarklyClientId: 'test-ld-id',
                userflowToken: 'test-uf-token',
            },
            links: {},
            native: {
                bundleId: 'com.test.app',
                displayName: 'Test',
                deepLinkDomains: ['test.example.com'],
            },
        };

        const result = tenantConfigSchema.parse(minimal);

        // Zod defaults should be applied
        expect(result.auth.provider).toBe('firebase');
        expect(result.auth.keyDerivation).toBe('sss');
        expect(result.auth.enableEmailBackupShare).toBe(true);
        expect(result.auth.requireEmailForPhoneUsers).toBe(true);
        expect(result.branding.defaultTheme).toBe('colorful');
        expect(result.branding.loginRedirectPath).toBe('/waitingsofa?loginCompleted=true');
        expect(result.features.aiFeatures).toBe(true);
        expect(result.features.analytics).toBe(true);
        expect(result.observability.analyticsProvider).toBe('noop');
    });

    it('rejects config with missing required fields', () => {
        const invalid = {
            tenantId: 'test',
            // missing domain, apis, etc.
        };

        const result = tenantConfigSchema.safeParse(invalid);

        expect(result.success).toBe(false);
    });

    it('accepts branding asset URL fields', () => {
        const withAssets = {
            ...DEFAULT_LEARNCARD_TENANT_CONFIG,
            branding: {
                ...DEFAULT_LEARNCARD_TENANT_CONFIG.branding,
                textLogoUrl: '/branding/text-logo.svg',
                brandMarkUrl: '/branding/brand-mark.png',
                appIconUrl: '/branding/app-icon.png',
                desktopLoginBgUrl: '/branding/desktop-login-bg.png',
                desktopLoginBgAltUrl: '/branding/desktop-login-bg-alt.png',
            },
        };

        const result = tenantConfigSchema.parse(withAssets);

        expect(result.branding.textLogoUrl).toBe('/branding/text-logo.svg');
        expect(result.branding.brandMarkUrl).toBe('/branding/brand-mark.png');
        expect(result.branding.appIconUrl).toBe('/branding/app-icon.png');
        expect(result.branding.desktopLoginBgUrl).toBe('/branding/desktop-login-bg.png');
        expect(result.branding.desktopLoginBgAltUrl).toBe('/branding/desktop-login-bg-alt.png');
    });

    it('accepts absolute URLs for branding assets', () => {
        const withAbsolute = {
            ...DEFAULT_LEARNCARD_TENANT_CONFIG,
            branding: {
                ...DEFAULT_LEARNCARD_TENANT_CONFIG.branding,
                textLogoUrl: 'https://cdn.example.com/logo.svg',
                appIconUrl: 'https://cdn.example.com/icon.png',
            },
        };

        const result = tenantConfigSchema.parse(withAbsolute);

        expect(result.branding.textLogoUrl).toBe('https://cdn.example.com/logo.svg');
        expect(result.branding.appIconUrl).toBe('https://cdn.example.com/icon.png');
    });

    it('leaves branding asset fields undefined when not provided', () => {
        const result = tenantConfigSchema.parse(DEFAULT_LEARNCARD_TENANT_CONFIG);

        expect(result.branding.textLogoUrl).toBeUndefined();
        expect(result.branding.brandMarkUrl).toBeUndefined();
        expect(result.branding.appIconUrl).toBeUndefined();
        expect(result.branding.desktopLoginBgUrl).toBeUndefined();
        expect(result.branding.desktopLoginBgAltUrl).toBeUndefined();
    });

    it('preserves extra fields via .passthrough()', () => {
        const withExtra = {
            ...DEFAULT_LEARNCARD_TENANT_CONFIG,
            apis: {
                ...DEFAULT_LEARNCARD_TENANT_CONFIG.apis,
                customEndpoint: 'https://custom.example.com',
            },
        };

        const result = tenantConfigSchema.parse(withExtra);

        expect((result.apis as Record<string, unknown>).customEndpoint).toBe('https://custom.example.com');
    });
});

describe('parseTenantConfig', () => {
    it('returns validated config for valid input', () => {
        const config = parseTenantConfig(DEFAULT_LEARNCARD_TENANT_CONFIG, 'test');

        expect(config.tenantId).toBe('learncard');
    });

    it('returns null for invalid input', () => {
        const result = parseTenantConfig({ tenantId: 'bad' } as unknown, 'test');

        expect(result).toBeNull();
    });
});
