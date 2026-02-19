import { useState, useCallback, useEffect, useRef } from 'react';
import { BoostCMSState } from '../components/boost/boost';
import { BoostCategoryOptionsEnum } from 'learn-card-base';

const STORAGE_KEY = 'lc_boost_cms_autosave';
const STORAGE_VERSION = 1;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEBOUNCE_MS = 2000; // 2 seconds debounce for local saves

const ALL_BOOST_CATEGORIES = [
    'Social Badge',
    'Achievement',
    'Learning History',
    'ID',
    'Work History',
    'Skill',
    'Membership',
    'Accomplishment',
    'Accommodation',
    'Family',
    'Course',
    'Job',
];

interface AutosaveStorageWrapper {
    version: number;
    timestamp: number;
    data: BoostCMSState;
    boostCategoryType?: string;
    boostSubCategoryType?: string;
}

interface UseBoostCMSAutosaveOptions {
    enabled?: boolean;
    boostCategoryType?: BoostCategoryOptionsEnum | string;
    boostSubCategoryType?: string | null;
}

interface UseBoostCMSAutosaveReturn {
    hasRecoveredState: boolean;
    recoveredState: BoostCMSState | null;
    recoveredBoostCategory: string | null;
    clearRecoveredState: (alsoCleanLocalStorage?: boolean) => void;
    saveToLocal: (state: BoostCMSState) => void;
    clearLocalSave: () => void;
    isAutosaving: boolean;
    hasUnsavedChanges: boolean;
}

/**
 * Hook for auto-saving BoostCMS state to prevent data loss.
 * Features:
 * - Saves state to localStorage on changes (debounced)
 * - Recovers state from localStorage on component mount
 */
export function useBoostCMSAutosave({
    enabled = true,
    boostCategoryType,
    boostSubCategoryType,
}: UseBoostCMSAutosaveOptions = {}): UseBoostCMSAutosaveReturn {
    const [hasRecoveredState, setHasRecoveredState] = useState(false);
    const [recoveredState, setRecoveredState] = useState<BoostCMSState | null>(null);
    const [recoveredBoostCategory, setRecoveredBoostCategory] = useState<string | null>(null);
    const [recoveredStorageKey, setRecoveredStorageKey] = useState<string | null>(null);
    const [isAutosaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentStateRef = useRef<BoostCMSState | null>(null);
    const lastSavedCategoryRef = useRef<string | null>(null);

    // Build storage key that includes category context
    const getStorageKey = useCallback(() => {
        if (boostCategoryType) {
            return `${STORAGE_KEY}_${boostCategoryType}`;
        }
        return STORAGE_KEY;
    }, [boostCategoryType]);

    // Helper to validate and parse a stored state
    const parseStoredState = useCallback(
        (
            stored: string,
            storageKey: string
        ): { data: BoostCMSState; category: string | null; storageKey: string } | null => {
            try {
                const parsed: AutosaveStorageWrapper = JSON.parse(stored);

                // Check version compatibility
                if (parsed.version !== STORAGE_VERSION) {
                    localStorage.removeItem(storageKey);
                    return null;
                }

                // Check expiration
                const age = Date.now() - parsed.timestamp;
                if (age > MAX_AGE_MS) {
                    localStorage.removeItem(storageKey);
                    return null;
                }

                // Validate the state has meaningful content
                const hasContent =
                    parsed.data?.basicInfo?.name ||
                    parsed.data?.basicInfo?.description ||
                    parsed.data?.appearance?.badgeThumbnail;

                if (hasContent) {
                    return {
                        data: parsed.data,
                        category: parsed.boostCategoryType || null,
                        storageKey,
                    };
                }
            } catch {
                // Invalid JSON, remove it
                localStorage.removeItem(storageKey);
            }
            return null;
        },
        []
    );

    // Load recovered state from localStorage on mount - checks ALL boost categories
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        // First check the current category's key
        const currentKey = getStorageKey();
        const currentStored = localStorage.getItem(currentKey);
        if (currentStored) {
            const result = parseStoredState(currentStored, currentKey);
            if (result) {
                setRecoveredState(result.data);
                setRecoveredBoostCategory(result.category);
                setRecoveredStorageKey(result.storageKey);
                setHasRecoveredState(true);
                return;
            }
        }

        // If no current category match, check all other categories for any saved state
        for (const category of ALL_BOOST_CATEGORIES) {
            const key = `${STORAGE_KEY}_${category}`;
            if (key === currentKey) continue;

            const stored = localStorage.getItem(key);
            if (stored) {
                const result = parseStoredState(stored, key);
                if (result) {
                    setRecoveredState(result.data);
                    setRecoveredBoostCategory(result.category);
                    setRecoveredStorageKey(result.storageKey);
                    setHasRecoveredState(true);
                    return;
                }
            }
        }

        const baseStored = localStorage.getItem(STORAGE_KEY);
        if (baseStored) {
            const result = parseStoredState(baseStored, STORAGE_KEY);
            if (result) {
                setRecoveredState(result.data);
                setRecoveredBoostCategory(result.category);
                setRecoveredStorageKey(result.storageKey);
                setHasRecoveredState(true);
            }
        }
    }, [enabled, getStorageKey, parseStoredState]);

    // Save state to localStorage (debounced)
    const saveToLocal = useCallback(
        (state: BoostCMSState) => {
            if (!enabled || typeof window === 'undefined') return;

            currentStateRef.current = state;

            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            // Mark as having unsaved changes immediately
            setHasUnsavedChanges(true);

            saveTimeoutRef.current = setTimeout(() => {
                try {
                    const stateCategoryType = state.basicInfo?.type || boostCategoryType;
                    const stateSubCategoryType =
                        state.basicInfo?.achievementType || boostSubCategoryType;

                    const wrapper: AutosaveStorageWrapper = {
                        version: STORAGE_VERSION,
                        timestamp: Date.now(),
                        data: state,
                        boostCategoryType: stateCategoryType,
                        boostSubCategoryType: stateSubCategoryType ?? undefined,
                    };

                    // Use state's category for storage key so category changes are saved to the correct key
                    const storageKey = stateCategoryType
                        ? `${STORAGE_KEY}_${stateCategoryType}`
                        : STORAGE_KEY;

                    // If category changed, clear the old category's storage key to prevent stale data
                    const lastCategory = lastSavedCategoryRef.current;
                    if (lastCategory && lastCategory !== stateCategoryType) {
                        const oldKey = `${STORAGE_KEY}_${lastCategory}`;
                        localStorage.removeItem(oldKey);
                    }

                    localStorage.setItem(storageKey, JSON.stringify(wrapper));
                    lastSavedCategoryRef.current = stateCategoryType || null;
                } catch (err) {
                    console.warn('[useBoostCMSAutosave] Failed to save to localStorage:', err);
                }
            }, DEBOUNCE_MS);
        },
        [enabled, boostCategoryType, boostSubCategoryType]
    );

    // Clear local save
    const clearLocalSave = useCallback(() => {
        if (typeof window === 'undefined') return;

        try {
            const storageKey = getStorageKey();
            localStorage.removeItem(storageKey);
            currentStateRef.current = null;
            setHasUnsavedChanges(false);
        } catch (err) {
            console.warn('[useBoostCMSAutosave] Failed to clear local save:', err);
        }
    }, [getStorageKey]);

    const clearRecoveredState = useCallback(
        (alsoCleanLocalStorage: boolean = false) => {
            if (recoveredStorageKey && typeof window !== 'undefined') {
                try {
                    localStorage.removeItem(recoveredStorageKey);
                } catch (err) {
                    console.warn(
                        '[useBoostCMSAutosave] Failed to clear recovered storage key:',
                        err
                    );
                }
            }

            setRecoveredState(null);
            setRecoveredBoostCategory(null);
            setRecoveredStorageKey(null);
            setHasRecoveredState(false);

            // If explicitly discarding, clear all saved states
            if (alsoCleanLocalStorage) {
                if (typeof window !== 'undefined') {
                    try {
                        localStorage.removeItem(STORAGE_KEY);
                        for (const category of ALL_BOOST_CATEGORIES) {
                            localStorage.removeItem(`${STORAGE_KEY}_${category}`);
                        }
                    } catch (err) {
                        console.warn(
                            '[useBoostCMSAutosave] Failed to clear all saved states:',
                            err
                        );
                    }
                }
                currentStateRef.current = null;
                setHasUnsavedChanges(false);
            }
        },
        [recoveredStorageKey]
    );

    useEffect(() => {
        if (!enabled || typeof window === 'undefined' || typeof document === 'undefined') return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && currentStateRef.current) {
                try {
                    const wrapper: AutosaveStorageWrapper = {
                        version: STORAGE_VERSION,
                        timestamp: Date.now(),
                        data: currentStateRef.current,
                        boostCategoryType,
                        boostSubCategoryType: boostSubCategoryType ?? undefined,
                    };

                    const storageKey = getStorageKey();
                    localStorage.setItem(storageKey, JSON.stringify(wrapper));
                } catch (err) {
                    console.warn('[useBoostCMSAutosave] Failed to save on visibility change:', err);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled, boostCategoryType, boostSubCategoryType, getStorageKey]);

    // Handle browser close/refresh/navigation
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (currentStateRef.current) {
                // Force immediate local save
                try {
                    const wrapper: AutosaveStorageWrapper = {
                        version: STORAGE_VERSION,
                        timestamp: Date.now(),
                        data: currentStateRef.current,
                        boostCategoryType,
                        boostSubCategoryType: boostSubCategoryType ?? undefined,
                    };

                    const storageKey = getStorageKey();
                    localStorage.setItem(storageKey, JSON.stringify(wrapper));
                } catch (err) {
                    console.warn('[useBoostCMSAutosave] Failed to save on beforeunload:', err);
                }

                // Show browser's built-in "unsaved changes" prompt
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [enabled, boostCategoryType, boostSubCategoryType, getStorageKey]);

    // Save immediately and cleanup on unmount
    useEffect(() => {
        return () => {
            // Clear any pending debounced save
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            // Save immediately on unmount if there's pending state
            if (currentStateRef.current) {
                try {
                    const storageKey = getStorageKey();
                    const wrapper = {
                        version: STORAGE_VERSION,
                        timestamp: Date.now(),
                        data: currentStateRef.current,
                        boostCategoryType,
                    };

                    localStorage.setItem(storageKey, JSON.stringify(wrapper));
                } catch (err) {
                    console.warn('[useBoostCMSAutosave] Failed to save on unmount:', err);
                }
            }
        };
    }, [getStorageKey, boostCategoryType]);

    return {
        hasRecoveredState,
        recoveredState,
        recoveredBoostCategory,
        clearRecoveredState,
        saveToLocal,
        clearLocalSave,
        isAutosaving,
        hasUnsavedChanges,
    };
}

export default useBoostCMSAutosave;
