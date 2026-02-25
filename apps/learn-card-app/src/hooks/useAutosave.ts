import { useState, useCallback, useEffect, useRef } from 'react';

const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_DEBOUNCE_MS = 2000;
const STORAGE_VERSION = 1;

interface AutosaveStorageWrapper<T, E = unknown> {
    version: number;
    timestamp: number;
    data: T;
    extra?: E;
    storageKey?: string;
}

export interface UseAutosaveOptions<T, E = unknown> {
    storageKey: string;
    enabled?: boolean;
    maxAgeMs?: number;
    debounceMs?: number;
    hasContent?: (state: T) => boolean;
}

export interface UseAutosaveReturn<T, E = unknown> {
    hasRecoveredState: boolean;
    recoveredState: T | null;
    recoveredExtra: E | null;
    recoveredStorageKey: string | null;
    clearRecoveredState: (alsoCleanLocalStorage?: boolean) => void;
    saveToLocal: (state: T, extra?: E) => void;
    clearLocalSave: () => void;
    hasUnsavedChanges: boolean;
}

export function useAutosave<T, E = unknown>({
    storageKey,
    enabled = true,
    maxAgeMs = DEFAULT_MAX_AGE_MS,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    hasContent,
}: UseAutosaveOptions<T, E>): UseAutosaveReturn<T, E> {
    const [hasRecoveredState, setHasRecoveredState] = useState(false);
    const [recoveredState, setRecoveredState] = useState<T | null>(null);
    const [recoveredExtra, setRecoveredExtra] = useState<E | null>(null);
    const [recoveredStorageKey, setRecoveredStorageKey] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentStateRef = useRef<{ state: T; extra?: E } | null>(null);

    // Load recovered state from localStorage on mount
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(storageKey);
            if (!stored) return;

            const parsed: AutosaveStorageWrapper<T, E> = JSON.parse(stored);

            if (parsed.version !== STORAGE_VERSION) {
                localStorage.removeItem(storageKey);
                return;
            }

            const age = Date.now() - parsed.timestamp;
            if (age > maxAgeMs) {
                localStorage.removeItem(storageKey);
                return;
            }

            const stateHasContent = hasContent ? hasContent(parsed.data) : true;

            if (stateHasContent) {
                setRecoveredState(parsed.data);
                setRecoveredExtra(parsed.extra ?? null);
                setRecoveredStorageKey(storageKey);
                setHasRecoveredState(true);
            }
        } catch (err) {
            console.warn(`[useAutosave] Failed to load from ${storageKey}:`, err);
        }
    }, [enabled, maxAgeMs, storageKey]);

    const saveToLocal = useCallback(
        (state: T, extra?: E) => {
            if (!enabled || typeof window === 'undefined') return;

            currentStateRef.current = { state, extra };
            setHasUnsavedChanges(true);

            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(() => {
                try {
                    const wrapper: AutosaveStorageWrapper<T, E> = {
                        version: STORAGE_VERSION,
                        timestamp: Date.now(),
                        data: state,
                        extra,
                        storageKey,
                    };

                    localStorage.setItem(storageKey, JSON.stringify(wrapper));
                } catch (err) {
                    console.warn('[useAutosave] Failed to save to localStorage:', err);
                }
            }, debounceMs);
        },
        [enabled, storageKey, debounceMs]
    );

    const clearLocalSave = useCallback(() => {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem(storageKey);
            currentStateRef.current = null;
            setHasUnsavedChanges(false);
        } catch (err) {
            console.warn('[useAutosave] Failed to clear local save:', err);
        }
    }, [storageKey]);

    const clearRecoveredState = useCallback(
        (alsoCleanLocalStorage: boolean = false) => {
            setRecoveredState(null);
            setRecoveredExtra(null);
            setRecoveredStorageKey(null);
            setHasRecoveredState(false);
            // Only clear localStorage if explicitly requested (e.g., on discard)
            // On recovery, we want to keep saving new changes
            if (alsoCleanLocalStorage) {
                clearLocalSave();
            }
        },
        [clearLocalSave]
    );

    // Handle visibility change - save immediately when tab becomes hidden
    useEffect(() => {
        if (!enabled || typeof window === 'undefined' || typeof document === 'undefined') return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && currentStateRef.current) {
                try {
                    const wrapper: AutosaveStorageWrapper<T, E> = {
                        version: STORAGE_VERSION,
                        timestamp: Date.now(),
                        data: currentStateRef.current.state,
                        extra: currentStateRef.current.extra,
                        storageKey,
                    };

                    localStorage.setItem(storageKey, JSON.stringify(wrapper));
                } catch (err) {
                    console.warn('[useAutosave] Failed to save on visibility change:', err);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [enabled, storageKey]);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (currentStateRef.current) {
                try {
                    const wrapper: AutosaveStorageWrapper<T, E> = {
                        version: STORAGE_VERSION,
                        timestamp: Date.now(),
                        data: currentStateRef.current.state,
                        extra: currentStateRef.current.extra,
                        storageKey,
                    };

                    localStorage.setItem(storageKey, JSON.stringify(wrapper));
                } catch (err) {
                    console.warn('[useAutosave] Failed to save on beforeunload:', err);
                }

                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [enabled, storageKey]);

    // Save immediately and cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            if (currentStateRef.current) {
                try {
                    const wrapper: AutosaveStorageWrapper<T, E> = {
                        version: STORAGE_VERSION,
                        timestamp: Date.now(),
                        data: currentStateRef.current.state,
                        extra: currentStateRef.current.extra,
                        storageKey,
                    };

                    localStorage.setItem(storageKey, JSON.stringify(wrapper));
                } catch (err) {
                    console.warn('[useAutosave] Failed to save on unmount:', err);
                }
            }
        };
    }, [storageKey]);

    return {
        hasRecoveredState,
        recoveredState,
        recoveredExtra,
        recoveredStorageKey,
        clearRecoveredState,
        saveToLocal,
        clearLocalSave,
        hasUnsavedChanges,
    };
}

export default useAutosave;
