/**
 * API client for SSS Key Manager server routes
 */

import type {
    AuthProvider,
    AuthProviderType,
    ServerEncryptedShare,
    RecoveryMethodInfo,
    EncryptedShare,
    SecurityLevel,
    SssActivationState,
    IdentityRecoverySession,
} from './types';
import type { EmailRelayBranding } from './email-relay-crypto';

const DID_CHALLENGE_REQUIRED_ERROR =
    'This operation requires the DID-challenge flow; use createSSSStrategy';

const throwDidChallengeRequired = (): never => {
    throw new Error(DID_CHALLENGE_REQUIRED_ERROR);
};

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

/** @deprecated Use `createSSSStrategy`, which implements the hardened DID-challenge flow. */
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
            'X-Auth-Token': token,
        };
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

    /** @deprecated Requires DID-challenge authorization. Use `createSSSStrategy`. */
    async storeAuthShare(_input: StoreAuthShareInput): Promise<void> {
        throwDidChallengeRequired();
    }

    /** @deprecated Requires DID-challenge authorization. Use `createSSSStrategy`. */
    async addRecoveryMethod(_input: StoreRecoveryShareInput): Promise<void> {
        throwDidChallengeRequired();
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

    /** @deprecated Requires DID-challenge authorization. Use `createSSSStrategy`. */
    async markMigrated(): Promise<void> {
        throwDidChallengeRequired();
    }

    /** @deprecated Requires DID-challenge authorization. Use `createSSSStrategy`. */
    async activate(): Promise<void> {
        throwDidChallengeRequired();
    }

    /** @deprecated Requires DID-challenge authorization. Use `createSSSStrategy`. */
    async sendEmailBackupShare(_emailShare: string, _overrideEmail?: string): Promise<void> {
        throwDidChallengeRequired();
    }

    /** @deprecated Requires DID-challenge authorization. Use `createSSSStrategy`. */
    async addRecoveryEmail(_email: string): Promise<void> {
        throwDidChallengeRequired();
    }

    /** @deprecated Requires DID-challenge authorization. Use `createSSSStrategy`. */
    async verifyRecoveryEmail(_code: string): Promise<{ maskedEmail: string }> {
        return throwDidChallengeRequired();
    }

    /** @deprecated Requires DID-challenge authorization. Use `createSSSStrategy`. */
    async deleteUserKey(): Promise<void> {
        throwDidChallengeRequired();
    }
}
