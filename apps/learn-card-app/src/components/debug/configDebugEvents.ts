/**
 * Config & Theme Debug Event Logger
 *
 * A simple event system for tracking tenant config resolution and theme-related
 * events in dev mode. Events are stored in memory and can be subscribed to by
 * the debug widget's Config and Theme tabs.
 *
 * Mirrors the pattern in authDebugEvents.ts.
 */

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export type ConfigDebugEventType =
    // ── Config resolution ──
    | 'config:resolve_start'
    | 'config:static_override'
    | 'config:baked_loaded'
    | 'config:baked_missing'
    | 'config:fetch_start'
    | 'config:fetch_success'
    | 'config:fetch_partial_merge'
    | 'config:fetch_error'
    | 'config:cache_hit'
    | 'config:cache_miss'
    | 'config:cache_expired'
    | 'config:cache_schema_mismatch'
    | 'config:cache_write'
    | 'config:fallback_default'
    | 'config:resolved'
    // ── Bootstrap subsystems ──
    | 'bootstrap:start'
    | 'bootstrap:firebase_init'
    | 'bootstrap:auth_config_set'
    | 'bootstrap:network_store_init'
    | 'bootstrap:sentry_init'
    | 'bootstrap:userflow_init'
    | 'bootstrap:theme_enforced'
    | 'bootstrap:complete'
    // ── Theme ──
    | 'theme:store_init'
    | 'theme:enforce_default'
    | 'theme:enforce_reset'
    | 'theme:switch'
    | 'theme:asset_fallback'
    | 'theme:loaded'
    | 'custom';

// ---------------------------------------------------------------------------
// Event shape
// ---------------------------------------------------------------------------

export interface ConfigDebugEvent {
    id: string;
    type: ConfigDebugEventType;
    message: string;
    timestamp: Date;
    data?: Record<string, unknown>;
    level: 'info' | 'success' | 'warning' | 'error';
}

type EventListener = (event: ConfigDebugEvent) => void;

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const MAX_EVENTS = 200;

let events: ConfigDebugEvent[] = [];
let listeners: Set<EventListener> = new Set();
let eventIdCounter = 0;

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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Emit a config/theme debug event.
 */
export const emitConfigDebugEvent = (
    type: ConfigDebugEventType,
    message: string,
    options?: {
        data?: Record<string, unknown>;
        level?: 'info' | 'success' | 'warning' | 'error';
    }
): void => {
    if (!isDebugEnabled()) return;

    const event: ConfigDebugEvent = {
        id: `cfg_${++eventIdCounter}_${Date.now()}`,
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
            console.error('[ConfigDebug] Listener error:', e);
        }
    });
};

/**
 * Subscribe to config/theme debug events.
 */
export const subscribeToConfigDebugEvents = (listener: EventListener): (() => void) => {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
};

/**
 * Get all stored events.
 */
export const getConfigDebugEvents = (): ConfigDebugEvent[] => {
    return [...events];
};

/**
 * Clear all events.
 */
export const clearConfigDebugEvents = (): void => {
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
        } catch {
            // ignore
        }
    });
};

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

export const emitConfigSuccess = (type: ConfigDebugEventType, message: string, data?: Record<string, unknown>): void => {
    emitConfigDebugEvent(type, message, { level: 'success', data });
};

export const emitConfigError = (type: ConfigDebugEventType, message: string, error?: unknown): void => {
    const errorData: Record<string, unknown> = {};

    if (error instanceof Error) {
        errorData.errorMessage = error.message;
        errorData.errorName = error.name;
    } else if (error) {
        errorData.error = String(error);
    }

    emitConfigDebugEvent(type, message, { level: 'error', data: errorData });
};

export const emitConfigWarning = (type: ConfigDebugEventType, message: string, data?: Record<string, unknown>): void => {
    emitConfigDebugEvent(type, message, { level: 'warning', data });
};

// ---------------------------------------------------------------------------
// onEvent adapter for resolveTenantConfig
//
// Converts the generic (step, data) callback from resolveTenantConfig into
// typed ConfigDebugEvents. Pass this as `options.onEvent` to
// resolveTenantConfig() from bootstrapTenantConfig.
// ---------------------------------------------------------------------------

/** Level map for resolution steps */
const STEP_LEVELS: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
    'config:resolve_start': 'info',
    'config:static_override': 'info',
    'config:baked_loaded': 'success',
    'config:baked_missing': 'info',
    'config:fetch_start': 'info',
    'config:fetch_success': 'success',
    'config:fetch_partial_merge': 'info',
    'config:fetch_error': 'warning',
    'config:cache_hit': 'success',
    'config:cache_miss': 'info',
    'config:cache_expired': 'warning',
    'config:cache_schema_mismatch': 'warning',
    'config:cache_write': 'info',
    'config:fallback_default': 'warning',
    'config:resolved': 'success',
};

/**
 * Create an `onEvent` callback suitable for passing to resolveTenantConfig().
 */
export const createConfigResolutionListener = (): ((step: string, message: string, data?: Record<string, unknown>) => void) => {
    return (step: string, message: string, data?: Record<string, unknown>) => {
        const eventType = step as ConfigDebugEventType;
        const level = STEP_LEVELS[step] ?? 'info';

        emitConfigDebugEvent(eventType, message, { level, data });
    };
};
