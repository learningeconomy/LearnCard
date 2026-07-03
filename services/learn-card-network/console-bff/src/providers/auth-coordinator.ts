import type { AuthProviderKind, ExternalIdentity, TenantAuthPolicy } from '@learncard/types';

import type { JitProvisioner } from '@provisioning';

import type {
    CallbackContext,
    ConsoleAuthProvider,
    IdentityResolution,
    LoginContext,
} from './types';

export const AUTH_COORDINATOR_ISSUER = 'urn:learncard:auth-coordinator';

export type VerifiedDidAuth = { did: string; assuranceLevel?: 'standard' | 'mfa' };

export type AuthCoordinatorProviderDeps = {
    providerId: string;
    jit: JitProvisioner;
    resolvePolicy: (tenantId: string) => Promise<TenantAuthPolicy>;
    verifyDidAuth: (vpJwt: string) => Promise<VerifiedDidAuth>;
};

export class AuthCoordinatorProvider implements ConsoleAuthProvider {
    readonly kind: AuthProviderKind = 'auth-coordinator';

    constructor(private readonly deps: AuthCoordinatorProviderDeps) {}

    get id(): string {
        return this.deps.providerId;
    }

    async beginLogin(ctx: LoginContext): Promise<{ redirectUrl: string }> {
        const url = new URL(ctx.redirectUri);

        url.searchParams.set('provider', this.deps.providerId);
        if (ctx.state) url.searchParams.set('state', ctx.state);

        return { redirectUrl: url.toString() };
    }

    async handleCallback(ctx: CallbackContext): Promise<ExternalIdentity> {
        const vpJwt = ctx.params.vp;

        if (!vpJwt) throw new Error('Missing DID-Auth presentation in callback');

        const verified = await this.deps.verifyDidAuth(vpJwt);

        return {
            issuer: AUTH_COORDINATOR_ISSUER,
            subject: verified.did,
            assuranceLevel: verified.assuranceLevel ?? 'standard',
        };
    }

    async resolveBinding(
        identity: ExternalIdentity,
        ctx: CallbackContext
    ): Promise<IdentityResolution> {
        const policy = await this.deps.resolvePolicy(ctx.tenantId);

        return this.deps.jit.resolveOrProvision(identity, policy, this.deps.providerId);
    }

    async logout(): Promise<void> {}
}
