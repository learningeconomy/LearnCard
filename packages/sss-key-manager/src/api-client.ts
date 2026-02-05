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
} from './types';

export interface GetAuthShareResponse {
    authShare: ServerEncryptedShare | null;
    primaryDid: string | null;
    securityLevel: SecurityLevel;
    recoveryMethods: RecoveryMethodInfo[];
    keyProvider: 'web3auth' | 'sss';
}

export interface StoreAuthShareInput {
    authShare: ServerEncryptedShare;
    primaryDid: string;
    securityLevel?: SecurityLevel;
}

export interface StoreRecoveryShareInput {
    type: 'password' | 'passkey' | 'backup';
    encryptedShare: EncryptedShare;
    credentialId?: string;
}

export interface ApiClientConfig {
    serverUrl: string;
    authProvider: AuthProvider;
}

export class SSSApiClient {
    private serverUrl: string;
    private authProvider: AuthProvider;

    constructor(config: ApiClientConfig) {
        this.serverUrl = config.serverUrl.replace(/\/$/, '');
        this.authProvider = config.authProvider;
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
        type: 'password' | 'passkey' | 'backup',
        credentialId?: string
    ): Promise<EncryptedShare | null> {
        const token = await this.authProvider.getIdToken();
        const providerType = this.authProvider.getProviderType();

        const params = new URLSearchParams({
            type,
            providerType,
            authToken: token,
        });

        if (credentialId) {
            params.append('credentialId', credentialId);
        }

        const response = await fetch(`${this.serverUrl}/keys/recovery?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to get recovery share: ${response.statusText}`);
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
