export interface OidcE2eRuntime {
    apiUrl: string;
    keycloakUrl: string;
    issuer: string;
    callbackUrl: string;
    mongoUri: string;
    mongoDbName: string;
    redisPort: number;
    adminPassword: string;
}

export interface LoginTicketResult {
    success: boolean;
    ticket?: string;
    error?: string;
}

export interface TestAccount {
    email: string;
    identityKey: string;
}
