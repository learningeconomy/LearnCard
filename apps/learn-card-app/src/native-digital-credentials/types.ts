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
    /** Self-asserted installed-app label; never use as an authenticated requester identity. */
    callerName?: string;
    /** Authenticated Android package identifier, independent of the optional display label. */
    callerPackage?: string;
    request: { protocol: string; data: Record<string, unknown> };
}

export interface NativeDigitalCredentialsPlugin {
    /** Local bookkeeping only; does not establish that entries still exist in GMS. */
    status: () => Promise<{ enabled: boolean; registeredEntryIds?: string[] }>;
    register: (options: { entries: AndroidCredentialEntry[] }) => Promise<{ registered: number }>;
    clear: () => Promise<{ cleared: boolean }>;
    getPendingRequest: () => Promise<{
        pending?: PendingDigitalCredentialRequest;
        isProvider?: boolean;
        /** Native binary can route OAuth callbacks to the activity that opened sign-in. */
        authCallbackRouting?: boolean;
    }>;
    beginAuthCallback: (options: {
        requestId: string;
        callbackUrlPrefix: string;
        timeoutMs: number;
    }) => Promise<{ token: string }>;
    endAuthCallback: (options: { token: string }) => Promise<void>;
    complete: (options: { requestId: string; responseJson: string }) => Promise<void>;
    cancel: (options: { requestId?: string }) => Promise<void>;
}
