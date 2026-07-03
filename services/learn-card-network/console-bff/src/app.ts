import type { DashboardSession, TenantAuthPolicy } from '@learncard/types';

import type { ProviderRegistry } from '@providers';
import type { SessionStore } from '@session';

export type ConsoleAuthServiceDeps = {
    registry: ProviderRegistry;
    sessions: SessionStore;
    resolvePolicy: (tenantId: string) => Promise<TenantAuthPolicy>;
};

export type BeginLoginParams = {
    tenantId: string;
    providerId: string;
    redirectUri: string;
    state?: string;
};

export type CompleteLoginParams = {
    tenantId: string;
    providerId: string;
    params: Record<string, string>;
};

export class ConsoleAuthService {
    constructor(private readonly deps: ConsoleAuthServiceDeps) {}

    async beginLogin(params: BeginLoginParams): Promise<{ redirectUrl: string }> {
        const policy = await this.deps.resolvePolicy(params.tenantId);
        const provider = this.deps.registry.resolve(policy, params.providerId);

        return provider.beginLogin(params);
    }

    async completeLogin(params: CompleteLoginParams): Promise<DashboardSession> {
        const policy = await this.deps.resolvePolicy(params.tenantId);
        const provider = this.deps.registry.resolve(policy, params.providerId);

        const identity = await provider.handleCallback(params);
        const assuranceLevel = identity.assuranceLevel ?? 'standard';

        if (policy.minAssuranceLevel === 'mfa' && assuranceLevel !== 'mfa') {
            throw new Error('Provider did not satisfy the tenant MFA assurance requirement');
        }

        const { binding } = await provider.resolveBinding(identity, params);

        return this.deps.sessions.create(
            {
                tenantId: policy.tenantId,
                providerId: provider.id,
                providerKind: provider.kind,
                externalSubject: binding.subject,
                profileId: binding.profileId,
                managedDid: binding.managedDid,
                activeEcosystemId: binding.ecosystemId,
                effectiveAccess: {
                    ecosystemRoles: [
                        { ecosystemId: binding.ecosystemId, role: policy.defaultRole },
                    ],
                    scopes: [],
                },
                assuranceLevel,
            },
            policy.sessionTtlSeconds
        );
    }

    async getSession(sessionId: string): Promise<DashboardSession | null> {
        return this.deps.sessions.get(sessionId);
    }

    async logout(sessionId: string): Promise<void> {
        const session = await this.deps.sessions.get(sessionId);

        if (session) {
            const policy = await this.deps.resolvePolicy(session.tenantId);
            const provider = this.deps.registry.resolve(policy, session.providerId);

            await provider.logout(session);
        }

        await this.deps.sessions.destroy(sessionId);
    }
}
