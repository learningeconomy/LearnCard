import type {
    AuthProviderKind,
    DashboardSession,
    ExternalIdentity,
    ExternalIdentityBinding,
} from '@learncard/types';

export type LoginContext = {
    tenantId: string;
    providerId: string;
    redirectUri: string;
    state?: string;
};

export type CallbackContext = {
    tenantId: string;
    providerId: string;
    params: Record<string, string>;
};

export type IdentityResolution = {
    binding: ExternalIdentityBinding;
    isNewlyProvisioned: boolean;
};

export interface ConsoleAuthProvider {
    readonly id: string;
    readonly kind: AuthProviderKind;

    beginLogin(ctx: LoginContext): Promise<{ redirectUrl: string }>;
    handleCallback(ctx: CallbackContext): Promise<ExternalIdentity>;
    resolveBinding(identity: ExternalIdentity, ctx: CallbackContext): Promise<IdentityResolution>;
    logout(session: DashboardSession): Promise<void>;
}
