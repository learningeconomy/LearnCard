// =============================================================================
// Our Application Types
// =============================================================================

export type LMSProvider = 'canvas' | 'google' | 'schoology' | 'blackboard' | 'moodle' | 'brightspace' | 'other';

export type ConnectionStatus = 'CONNECTED' | 'SYNCING' | 'ERROR' | 'PENDING_APPROVAL';

export interface LMSConnection {
    id: string;
    integrationId: string;
    sourceId: string;
    provider: LMSProvider;
    providerName: string;
    institutionName: string;
    status: ConnectionStatus;
    connectedAt: string;
    accessToken?: string;
}

// =============================================================================
// Ed.link Widget SDK Types (Client-side)
// =============================================================================

export interface EdlinkIntegrationData {
    integration: {
        id: string;
        access_token: string;
        source: {
            id: string;
        };
        application: {
            id: string;
        };
        status: string;
        state: string;
        created_date: string;
        updated_date: string;
    };
}

export interface EdlinkOnboardingOptions {
    provider?: string;
    theme?: {
        primary_color?: string;
    };
    email?: string;
    onSuccess?: (data: EdlinkIntegrationData) => void;
    onError?: (error: Error) => void;
}

export interface EdlinkOnboardingInstance {
    show: () => void;
    destroy: () => void;
    on: (event: string, callback: (data: unknown) => void) => void;
}

export interface EdlinkClient {
    createOnboarding: (options: EdlinkOnboardingOptions) => EdlinkOnboardingInstance;
}

declare global {
    interface Window {
        Edlink?: new (config: { client_id: string }) => EdlinkClient;
    }
}
