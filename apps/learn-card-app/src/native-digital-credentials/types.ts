export const NATIVE_CREDENTIAL_PATH = '/native-digital-credentials';

/** Sanitized registry projection. Claim values, credentials, keys and storage URIs are forbidden. */
export interface AndroidCredentialEntry {
    id: string;
    vct: string;
    title: string;
    claims: Array<{ path: string[]; displayName: string }>;
}

export interface PendingDigitalCredentialRequest {
    requestId: string;
    selectedEntryId: string;
    /** Established in Android from platform calling-app information, never from the request JSON. */
    origin: string;
    /** Display label supplied by Android; request JSON metadata is ignored. */
    callerName?: string;
    /** Authenticated Android package identifier, independent of the optional display label. */
    callerPackage?: string;
    request: { protocol: string; data: Record<string, unknown> };
}

export interface NativeDigitalCredentialsPlugin {
    status: () => Promise<{ enabled: boolean; registeredEntryIds?: string[] }>;
    register: (options: { entries: AndroidCredentialEntry[] }) => Promise<{ registered: number }>;
    clear: () => Promise<{ cleared: boolean }>;
    getPendingRequest: () => Promise<{
        pending?: PendingDigitalCredentialRequest;
        isProvider?: boolean;
    }>;
    complete: (options: { requestId: string; responseJson: string }) => Promise<void>;
    cancel: (options: { requestId?: string }) => Promise<void>;
}
