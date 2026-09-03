/**
 * API client for SSS Key Manager server routes
 */

import type {
    AuthProvider,
    AuthProviderType,
    ContactMethod,
    ServerEncryptedShare,
    RecoveryMethodInfo,
    EncryptedShare,
    SecurityLevel,
    SssActivationState,
    IdentityRecoverySession,
} from './types';
import {
    encryptEmailRelayPayload,
    generateEmailRelayConfirmationCode,
    type EmailRelayBranding,
} from './email-relay-crypto';

export interface GetAuthShareResponse {
    authShare: ServerEncryptedShare | null;
    primaryDid: string | null;
    securityLevel: SecurityLevel;
    recoveryMethods: RecoveryMethodInfo[];
    keyProvider: 'web3auth' | 'sss';
    shareVersion: number;
    maskedRecoveryEmail?: string | null;
    sssActivationState: SssActivationState;
}

export interface StoreAuthShareInput {
    authShare: ServerEncryptedShare;
    primaryDid: string;
    securityLevel?: SecurityLevel;
    sssActivationState?: 'provisional';
}

export interface StoreRecoveryShareInput {
    type: 'passkey' | 'backup' | 'phrase' | 'email';
    encryptedShare?: EncryptedShare;
    credentialId?: string;
    shareVersion?: number;
}

export interface RecoverySessionMaterial {
    authShare: ServerEncryptedShare;
    encryptedShare?: EncryptedShare;
    primaryDid: string;
    shareVersion: number;
    rebindSessionToken: string;
}

export interface ApiClientConfig {
    serverUrl: string;
    authProvider: AuthProvider;
    escrowRelayPublicKey?: string;
    escrowRelayKeyId?: string;
    emailBranding?: EmailRelayBranding;
}

export class SSSApiClient {
    private serverUrl: string;
    private authProvider: AuthProvider;
    private escrowRelayPublicKey: string;
    private escrowRelayKeyId: string;
    private emailBranding?: EmailRelayBranding;

    constructor(config: ApiClientConfig) {
        this.serverUrl = config.serverUrl.replace(/\/$/, '');
        this.authProvider = config.authProvider;
        this.escrowRelayPublicKey = config.escrowRelayPublicKey ?? '';
        this.escrowRelayKeyId = config.escrowRelayKeyId ?? '';
        this.emailBranding = config.emailBranding;
    }

    private async getAuthHeaders(): Promise<Record<string, string>> {
        const token = await this.authProvider.getIdToken();
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };
    }

    private async getContactMethodFromUser(): Promise<ContactMethod | null> {
        const user = await this.authProvider.getCurrentUser();
        if (!user) return null;

        if (user.email) {
            return { type: 'email' as const, value: user.email.toLowerCase() };
        }
        if (user.phone) {
            return { type: 'phone' as const, value: user.phone };
        }
        return null;
    }

    async getAuthShare(): Promise<GetAuthShareResponse | null> {
        const headers = await this.getAuthHeaders();
        const providerType = this.authProvider.getProviderType();

        const response = await fetch(`${this.serverUrl}/keys/auth-share`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ providerType }),
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to get auth share: ${response.statusText}`);
        }

        return response.json();
    }

    async storeAuthShare(input: StoreAuthShareInput): Promise<void> {
        const headers = await this.getAuthHeaders();
        const providerType = this.authProvider.getProviderType();

        const response = await fetch(`${this.serverUrl}/keys/auth-share`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                ...input,
                providerType,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to store auth share: ${response.statusText}`);
        }
    }

    async addRecoveryMethod(input: StoreRecoveryShareInput): Promise<void> {
        const headers = await this.getAuthHeaders();
        const providerType = this.authProvider.getProviderType();

        const response = await fetch(`${this.serverUrl}/keys/recovery`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                ...input,
                providerType,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to add recovery method: ${response.statusText}`);
        }
    }

    async getRecoveryShare(
        type: 'passkey' | 'backup' | 'phrase' | 'email',
        credentialId?: string
    ): Promise<{ encryptedShare?: EncryptedShare; shareVersion?: number } | null> {
        // P0-4: authToken travels via the X-Auth-Token header — never as a
        // query param, which would land in proxy/ALB access logs. A
        // dedicated header (not Authorization) avoids colliding with
        // clients that send a DID-Auth VP as Authorization for this route.
        const token = await this.authProvider.getIdToken();
        const providerType = this.authProvider.getProviderType();

        const params = new URLSearchParams({ type, providerType });

        if (credentialId) {
            params.append('credentialId', credentialId);
        }

        const response = await fetch(`${this.serverUrl}/keys/recovery?${params}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to get recovery share: ${response.statusText}`);
        }

        return response.json();
    }

    async startIdentityRecovery(email: string): Promise<void> {
        const response = await fetch(`${this.serverUrl}/keys/recovery-session/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            throw new Error(`Failed to send recovery code: ${response.statusText}`);
        }
    }

    async verifyIdentityRecovery(email: string, code: string): Promise<IdentityRecoverySession> {
        const response = await fetch(`${this.serverUrl}/keys/recovery-session/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
        });

        if (!response.ok) {
            throw new Error(`Failed to verify recovery code: ${response.statusText}`);
        }

        return response.json();
    }

    async useIdentityRecoverySession(
        recoverySessionToken: string,
        type: StoreRecoveryShareInput['type'],
        credentialId?: string
    ): Promise<RecoverySessionMaterial> {
        const response = await fetch(`${this.serverUrl}/keys/recovery-session/recover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recoverySessionToken, type, credentialId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to retrieve recovery data: ${response.statusText}`);
        }

        return response.json();
    }

    async completeIdentityRecoveryRebind(input: {
        recoverySessionToken: string;
        newAuthToken: string;
        providerType: AuthProviderType;
        primaryDid: string;
        authShare: ServerEncryptedShare;
        didAuthVp: string;
    }): Promise<{ shareVersion: number; recoveryMethodsRequireConfirmation: string[] }> {
        const response = await fetch(`${this.serverUrl}/keys/recovery-session/rebind`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${input.didAuthVp}`,
                'X-Auth-Token': input.newAuthToken,
            },
            body: JSON.stringify({
                recoverySessionToken: input.recoverySessionToken,
                providerType: input.providerType,
                primaryDid: input.primaryDid,
                authShare: input.authShare,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to bind the new sign-in: ${response.statusText}`);
        }

        return response.json();
    }

    async markMigrated(): Promise<void> {
        const headers = await this.getAuthHeaders();
        const providerType = this.authProvider.getProviderType();

        const response = await fetch(`${this.serverUrl}/keys/migrate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ providerType }),
        });

        if (!response.ok) {
            throw new Error(`Failed to mark as migrated: ${response.statusText}`);
        }
    }

    async activate(): Promise<void> {
        const headers = await this.getAuthHeaders();
        const providerType = this.authProvider.getProviderType();

        const response = await fetch(`${this.serverUrl}/keys/activate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ providerType }),
        });

        if (!response.ok) {
            throw new Error(`Failed to activate SSS key: ${response.statusText}`);
        }
    }

    async sendEmailBackupShare(emailShare: string, overrideEmail?: string): Promise<void> {
        const headers = await this.getAuthHeaders();
        const providerType = this.authProvider.getProviderType();

        let email = overrideEmail;

        if (!email) {
            const user = await this.authProvider.getCurrentUser();
            email = user?.email;
        }

        if (!email) {
            throw new Error('Cannot send email backup share: no email address available');
        }

        const confirmationCode = generateEmailRelayConfirmationCode();
        const relayPayload = await encryptEmailRelayPayload(
            {
                targetEmail: email,
                recoveryKey: emailShare,
                confirmationCode,
                branding: this.emailBranding,
            },
            this.escrowRelayPublicKey,
            this.escrowRelayKeyId
        );

        const response = await fetch(`${this.serverUrl}/keys/email-backup`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                providerType,
                relayPayload,
                confirmationCode,
                email,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to send email backup share: ${response.statusText}`);
        }
    }

    async addRecoveryEmail(email: string): Promise<void> {
        const token = await this.authProvider.getIdToken();
        const providerType = this.authProvider.getProviderType();

        const response = await fetch(`${this.serverUrl}/keys/recovery-email/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authToken: token, providerType, email }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(
                data?.message || `Failed to add recovery email: ${response.statusText}`
            );
        }
    }

    async verifyRecoveryEmail(code: string): Promise<{ maskedEmail: string }> {
        const token = await this.authProvider.getIdToken();
        const providerType = this.authProvider.getProviderType();

        const response = await fetch(`${this.serverUrl}/keys/recovery-email/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authToken: token, providerType, code }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(
                data?.message || `Failed to verify recovery email: ${response.statusText}`
            );
        }

        return response.json();
    }

    async deleteUserKey(): Promise<void> {
        const headers = await this.getAuthHeaders();
        const providerType = this.authProvider.getProviderType();

        const response = await fetch(`${this.serverUrl}/keys`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ providerType }),
        });

        if (!response.ok) {
            throw new Error(`Failed to delete user key: ${response.statusText}`);
        }
    }
}
