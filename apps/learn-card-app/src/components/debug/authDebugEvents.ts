/**
 * Auth/SSS Debug Event Logger
 * 
 * A simple event system for tracking auth and SSS-related events in dev mode.
 * Events are stored in memory and can be subscribed to by the debug widget.
 */

export type AuthDebugEventType =
    | 'auth:init'
    | 'auth:login_start'
    | 'auth:login_success'
    | 'auth:login_error'
    | 'auth:logout'
    | 'auth:state_transition'
    | 'firebase:auth_state_change'
    | 'firebase:token_refresh'
    | 'sss:connect_start'
    | 'sss:connect_success'
    | 'sss:connect_error'
    | 'sss:device_share_found'
    | 'sss:device_share_missing'
    | 'sss:device_share_stored'
    | 'sss:device_share_cleared'
    | 'sss:auth_share_fetched'
    | 'sss:auth_share_stored'
    | 'sss:key_reconstructed'
    | 'sss:share_verified'
    | 'sss:share_version_update'
    | 'sss:recovery_start'
    | 'sss:recovery_success'
    | 'sss:recovery_error'
    | 'sss:setup_start'
    | 'sss:setup_success'
    | 'sss:setup_error'
    | 'sss:migrate_start'
    | 'sss:migrate_success'
    | 'sss:migrate_error'
    | 'wallet:init_start'
    | 'wallet:init_success'
    | 'wallet:init_error'
    | 'web3auth:init'
    | 'web3auth:login'
    | 'web3auth:error'
    | 'web3auth:migration_key'
    | 'auth:coordinator_ready'
    | 'auth:coordinator_error'
    | 'custom';

export interface AuthDebugEvent {
    id: string;
    type: AuthDebugEventType;
    message: string;
    timestamp: Date;
    data?: Record<string, unknown>;
    level: 'info' | 'success' | 'warning' | 'error';
}

type EventListener = (event: AuthDebugEvent) => void;

const MAX_EVENTS = 100;

let events: AuthDebugEvent[] = [];
let listeners: Set<EventListener> = new Set();
let eventIdCounter = 0;

/**
 * Check if debug mode is enabled
 */
const isDebugEnabled = (): boolean => {
    if (typeof window === 'undefined') return false;

    try {
        return (
            import.meta.env.VITE_ENABLE_AUTH_DEBUG_WIDGET === 'true' ||
            import.meta.env.DEV
        );
    } catch {
        return false;
    }
};

/**
 * Emit an auth debug event
 */
export const emitAuthDebugEvent = (
    type: AuthDebugEventType,
    message: string,
    options?: {
        data?: Record<string, unknown>;
        level?: 'info' | 'success' | 'warning' | 'error';
    }
): void => {
    if (!isDebugEnabled()) return;

    const event: AuthDebugEvent = {
        id: `evt_${++eventIdCounter}_${Date.now()}`,
        type,
        message,
        timestamp: new Date(),
        data: options?.data,
        level: options?.level ?? 'info',
    };

    events = [event, ...events].slice(0, MAX_EVENTS);

    listeners.forEach(listener => {
        try {
            listener(event);
        } catch (e) {
            console.error('[AuthDebug] Listener error:', e);
        }
    });
};

/**
 * Subscribe to auth debug events
 */
export const subscribeToAuthDebugEvents = (listener: EventListener): (() => void) => {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
};

/**
 * Get all stored events
 */
export const getAuthDebugEvents = (): AuthDebugEvent[] => {
    return [...events];
};

/**
 * Clear all events
 */
export const clearAuthDebugEvents = (): void => {
    events = [];

    listeners.forEach(listener => {
        try {
            listener({
                id: 'clear',
                type: 'custom',
                message: 'Events cleared',
                timestamp: new Date(),
                level: 'info',
            });
        } catch (e) {
            // ignore
        }
    });
};

/**
 * Helper to emit success events
 */
export const emitAuthSuccess = (type: AuthDebugEventType, message: string, data?: Record<string, unknown>): void => {
    emitAuthDebugEvent(type, message, { level: 'success', data });
};

/**
 * Helper to emit error events
 */
export const emitAuthError = (type: AuthDebugEventType, message: string, error?: unknown): void => {
    const errorData: Record<string, unknown> = {};

    if (error instanceof Error) {
        errorData.errorMessage = error.message;
        errorData.errorName = error.name;
    } else if (error) {
        errorData.error = String(error);
    }

    emitAuthDebugEvent(type, message, { level: 'error', data: errorData });
};

/**
 * Helper to emit warning events
 */
export const emitAuthWarning = (type: AuthDebugEventType, message: string, data?: Record<string, unknown>): void => {
    emitAuthDebugEvent(type, message, { level: 'warning', data });
};
