import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY_PREFIX = 'lc_wizard_';
const STORAGE_VERSION = 1;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface PersistedStateWrapper<T> {
    version: number;
    timestamp: number;
    data: T;
}

interface UsePersistedWizardStateOptions<T> {
    key: string;
    initialState: T;
    maxAgeMs?: number;
    debounceMs?: number;
}

/**
 * Custom hook for persisting wizard/guide state to localStorage.
 * 
 * Features:
 * - Automatic save on state changes (debounced)
 * - Versioned storage for migration support
 * - Automatic expiration of stale data
 * - SSR-safe (checks for window)
 * - Clear function for manual reset
 * 
 * Usage:
 * ```ts
 * const [state, setState, { clear, isLoaded }] = usePersistedWizardState({
 *   key: 'partner-onboarding',
 *   initialState: DEFAULT_ONBOARDING_STATE,
 * });
 * ```
 */
export function usePersistedWizardState<T>({
    key,
    initialState,
    maxAgeMs = MAX_AGE_MS,
    debounceMs = 500,
}: UsePersistedWizardStateOptions<T>): [
    T,
    React.Dispatch<React.SetStateAction<T>>,
    { clear: () => void; isLoaded: boolean; save: () => void }
] {
    const storageKey = `${STORAGE_KEY_PREFIX}${key}`;
    const [isLoaded, setIsLoaded] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load initial state from localStorage
    const [state, setStateInternal] = useState<T>(() => {
        if (typeof window === 'undefined') return initialState;

        try {
            const stored = localStorage.getItem(storageKey);

            if (!stored) return initialState;

            const parsed: PersistedStateWrapper<T> = JSON.parse(stored);

            // Check version compatibility
            if (parsed.version !== STORAGE_VERSION) {
                console.log(`[usePersistedWizardState] Version mismatch, using initial state`);
                return initialState;
            }

            // Check expiration
            const age = Date.now() - parsed.timestamp;

            if (age > maxAgeMs) {
                console.log(`[usePersistedWizardState] State expired, using initial state`);
                localStorage.removeItem(storageKey);
                return initialState;
            }

            console.log(`[usePersistedWizardState] Restored state from ${new Date(parsed.timestamp).toLocaleString()}`);
            return parsed.data;
        } catch (err) {
            console.warn(`[usePersistedWizardState] Failed to load persisted state:`, err);
            return initialState;
        }
    });

    // Mark as loaded after initial render
    useEffect(() => {
        setIsLoaded(true);
    }, []);

    // Save to localStorage (debounced)
    const saveToStorage = useCallback((newState: T) => {
        if (typeof window === 'undefined') return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            try {
                const wrapper: PersistedStateWrapper<T> = {
                    version: STORAGE_VERSION,
                    timestamp: Date.now(),
                    data: newState,
                };

                localStorage.setItem(storageKey, JSON.stringify(wrapper));
            } catch (err) {
                console.warn(`[usePersistedWizardState] Failed to save state:`, err);
            }
        }, debounceMs);
    }, [storageKey, debounceMs]);

    // Wrapped setState that also persists
    const setState = useCallback((action: React.SetStateAction<T>) => {
        setStateInternal(prev => {
            const newState = typeof action === 'function' 
                ? (action as (prev: T) => T)(prev) 
                : action;

            saveToStorage(newState);
            return newState;
        });
    }, [saveToStorage]);

    // Clear persisted state
    const clear = useCallback(() => {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem(storageKey);
            setStateInternal(initialState);
        } catch (err) {
            console.warn(`[usePersistedWizardState] Failed to clear state:`, err);
        }
    }, [storageKey, initialState]);

    // Force immediate save
    const save = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        if (typeof window === 'undefined') return;

        try {
            const wrapper: PersistedStateWrapper<T> = {
                version: STORAGE_VERSION,
                timestamp: Date.now(),
                data: state,
            };

            localStorage.setItem(storageKey, JSON.stringify(wrapper));
        } catch (err) {
            console.warn(`[usePersistedWizardState] Failed to save state:`, err);
        }
    }, [storageKey, state]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return [state, setState, { clear, isLoaded, save }];
}

/**
 * Get all wizard states from localStorage (for debugging/management)
 */
export function getAllWizardStates(): Record<string, { key: string; timestamp: Date; age: string }> {
    if (typeof window === 'undefined') return {};

    const result: Record<string, { key: string; timestamp: Date; age: string }> = {};

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key?.startsWith(STORAGE_KEY_PREFIX)) {
            try {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                const timestamp = new Date(data.timestamp);
                const ageMs = Date.now() - data.timestamp;
                const ageHours = Math.round(ageMs / (1000 * 60 * 60));

                result[key] = {
                    key: key.replace(STORAGE_KEY_PREFIX, ''),
                    timestamp,
                    age: ageHours < 24 ? `${ageHours}h` : `${Math.round(ageHours / 24)}d`,
                };
            } catch {
                // Skip invalid entries
            }
        }
    }

    return result;
}

/**
 * Clear all wizard states from localStorage
 */
export function clearAllWizardStates(): void {
    if (typeof window === 'undefined') return;

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key?.startsWith(STORAGE_KEY_PREFIX)) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
}
