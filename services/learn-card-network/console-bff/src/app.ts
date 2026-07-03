import type { DashboardSession, TenantAuthPolicy } from '@learncard/types';

import type { ProviderRegistry } from '@providers';
import type { SessionStore, LoginStateStore } from '@session';

export type ConsoleAuthServiceDeps = {
    registry: ProviderRegistry;
    sessions: SessionStore;
    resolvePolicy: (tenantId: string) => Promise<TenantAuthPolicy>;
    stateStore?: LoginStateStore;
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

        const state = this.deps.stateStore
            ? await this.deps.stateStore.issue({
                  tenantId: params.tenantId,
                  providerId: params.providerId,
              })
            : params.state;

        return provider.beginLogin({ ...params, state });
    }

    async completeLogin(params: CompleteLoginParams): Promise<DashboardSession> {
        if (this.deps.stateStore) {
            const record = params.params.state
                ? await this.deps.stateStore.consume(params.params.state)
                : null;

            if (
                !record ||
                record.tenantId !== params.tenantId ||
                record.providerId !== params.providerId
            ) {
                throw new Error('Invalid or missing login state');
            }
        }

        const policy = await this.deps.resolvePolicy(params.tenantId);
        const provider = this.deps.registry.resolve(policy, params.providerId);

        const identity = await provider.handleCallback(params);
        const assuranceLevel = identity.assuranceLevel ?? 'standard';

        if (policy.minAssuranceLevel === 'mfa' && assuranceLevel !== 'mfa') {
            throw new Error('Provider did not satisfy the tenant MFA assurance requirement');
        }

        const { binding, grants } = await provider.resolveBinding(identity, params);

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
                    ecosystemRoles: grants,
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
