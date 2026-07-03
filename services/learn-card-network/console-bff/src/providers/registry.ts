import type { AuthProviderConfig, AuthProviderKind, TenantAuthPolicy } from '@learncard/types';

import type { ConsoleAuthProvider } from './types';

export type ProviderFactory = (config: AuthProviderConfig) => ConsoleAuthProvider;

export class ProviderRegistry {
    private readonly factories = new Map<AuthProviderKind, ProviderFactory>();

    register(kind: AuthProviderKind, factory: ProviderFactory): this {
        this.factories.set(kind, factory);

        return this;
    }

    resolve(policy: TenantAuthPolicy, providerId: string): ConsoleAuthProvider {
        const config = policy.providers.find(provider => provider.providerId === providerId);

        if (!config) {
            throw new Error(
                `Provider "${providerId}" is not configured for tenant "${policy.tenantId}"`
            );
        }

        if (!config.enabled) {
            throw new Error(`Provider "${providerId}" is disabled for tenant "${policy.tenantId}"`);
        }

        const factory = this.factories.get(config.kind);

        if (!factory) {
            throw new Error(`No provider factory registered for kind "${config.kind}"`);
        }

        return factory(config);
    }

    listAvailable(policy: TenantAuthPolicy): AuthProviderConfig[] {
        return policy.providers.filter(
            provider => provider.enabled && this.factories.has(provider.kind)
        );
    }
}
