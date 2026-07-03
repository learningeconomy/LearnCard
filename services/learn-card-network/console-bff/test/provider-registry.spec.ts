import { describe, it, expect } from 'vitest';

import { TenantAuthPolicyValidator, type ExternalIdentity } from '@learncard/types';

import { ProviderRegistry, type ConsoleAuthProvider } from '@providers';

const fakeProvider = (id: string): ConsoleAuthProvider => ({
    id,
    kind: 'oidc',
    async beginLogin() {
        return { redirectUrl: `https://idp.example/authorize?p=${id}` };
    },
    async handleCallback(): Promise<ExternalIdentity> {
        return { issuer: 'https://idp.example', subject: 'sub-1' };
    },
    async resolveBinding() {
        throw new Error('not implemented in test');
    },
    async logout() {},
});

const policy = (overrides = {}) =>
    TenantAuthPolicyValidator.parse({
        tenantId: 'lef',
        rootEcosystemId: 'eco_root',
        providers: [
            { providerId: 'lef-oidc', kind: 'oidc', enabled: true },
            { providerId: 'legacy-saml', kind: 'saml', enabled: true },
            { providerId: 'disabled-oidc', kind: 'oidc', enabled: false },
        ],
        ...overrides,
    });

describe('ProviderRegistry', () => {
    it('resolves a configured, enabled provider via its kind factory', () => {
        const registry = new ProviderRegistry().register('oidc', config =>
            fakeProvider(config.providerId)
        );

        const provider = registry.resolve(policy(), 'lef-oidc');

        expect(provider.id).toBe('lef-oidc');
        expect(provider.kind).toBe('oidc');
    });

    it('throws for an unconfigured provider', () => {
        const registry = new ProviderRegistry().register('oidc', c => fakeProvider(c.providerId));

        expect(() => registry.resolve(policy(), 'ghost')).toThrow(/not configured/);
    });

    it('throws for a disabled provider', () => {
        const registry = new ProviderRegistry().register('oidc', c => fakeProvider(c.providerId));

        expect(() => registry.resolve(policy(), 'disabled-oidc')).toThrow(/disabled/);
    });

    it('throws when no factory is registered for the provider kind', () => {
        const registry = new ProviderRegistry().register('oidc', c => fakeProvider(c.providerId));

        expect(() => registry.resolve(policy(), 'legacy-saml')).toThrow(/No provider factory/);
    });

    it('lists only enabled providers with a registered factory', () => {
        const registry = new ProviderRegistry().register('oidc', c => fakeProvider(c.providerId));

        const available = registry.listAvailable(policy());

        expect(available.map(p => p.providerId)).toEqual(['lef-oidc']);
    });
});
