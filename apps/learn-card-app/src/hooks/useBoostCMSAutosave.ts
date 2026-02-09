import { useState, useCallback, useEffect, useRef } from 'react';
import { BoostCMSState, LCNBoostStatusEnum, initialBoostCMSState } from '../components/boost/boost';
import { addFallbackNameToCMSState } from '../components/boost/boostHelpers';
import { extractSkillIdsFromAlignments } from '../components/boost/alignmentHelpers';
import { useCreateBoost, useToast, ToastTypeEnum, BoostCategoryOptionsEnum } from 'learn-card-base';
import { useQueryClient } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { BOOST_CATEGORY_TO_WALLET_ROUTE } from '../components/boost/boost-options/boostOptions';

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
    triggerAutosaveDraft: (state: BoostCMSState) => Promise<string | null>;
    isAutosaving: boolean;
    hasUnsavedChanges: boolean;
}

/**
 * Hook for auto-saving BoostCMS state to prevent data loss.
 *
 * Features:
 * - Saves state to localStorage on changes (debounced)
 * - Can save as draft to server on critical events (errors, navigation)
 * - Recovers state from localStorage on component mount
 */
export function useBoostCMSAutosave({
    enabled = true,
    boostCategoryType,
    boostSubCategoryType,
}: UseBoostCMSAutosaveOptions = {}): UseBoostCMSAutosaveReturn {
    const { mutateAsync: createBoost } = useCreateBoost();
    const { presentToast } = useToast();
    const queryClient = useQueryClient();
    const history = useHistory();

    const [hasRecoveredState, setHasRecoveredState] = useState(false);
    const [recoveredState, setRecoveredState] = useState<BoostCMSState | null>(null);
    const [recoveredBoostCategory, setRecoveredBoostCategory] = useState<string | null>(null);
    const [isAutosaving, setIsAutosaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentStateRef = useRef<BoostCMSState | null>(null);
    const hasTriggeredAutosaveRef = useRef(false);

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
        ): { data: BoostCMSState; category: string | null } | null => {
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
                    const wrapper: AutosaveStorageWrapper = {
                        version: STORAGE_VERSION,
                        timestamp: Date.now(),
                        data: state,
                        boostCategoryType,
                        boostSubCategoryType: boostSubCategoryType ?? undefined,
                    };

                    const storageKey = getStorageKey();
                    localStorage.setItem(storageKey, JSON.stringify(wrapper));
                } catch (err) {
                    console.warn('[useBoostCMSAutosave] Failed to save to localStorage:', err);
                }
            }, DEBOUNCE_MS);
        },
        [enabled, boostCategoryType, boostSubCategoryType, getStorageKey]
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

    const clearRecoveredState = useCallback((alsoCleanLocalStorage: boolean = false) => {
        setRecoveredState(null);
        setRecoveredBoostCategory(null);
        setHasRecoveredState(false);

        // Only clear localStorage if explicitly requested (e.g., on discard)
        // On recovery, we want to keep saving new changes
        if (alsoCleanLocalStorage) {
            if (typeof window !== 'undefined') {
                try {
                    localStorage.removeItem(STORAGE_KEY);
                    for (const category of ALL_BOOST_CATEGORIES) {
                        localStorage.removeItem(`${STORAGE_KEY}_${category}`);
                    }
                } catch (err) {
                    console.warn('[useBoostCMSAutosave] Failed to clear all saved states:', err);
                }
            }
            currentStateRef.current = null;
            setHasUnsavedChanges(false);
        }
    }, []);

    const triggerAutosaveDraft = useCallback(
        async (state: BoostCMSState): Promise<string | null> => {
            // Prevent duplicate autosaves
            if (hasTriggeredAutosaveRef.current || isAutosaving) {
                return null;
            }

            // Validate state has minimum required content
            const hasMinimumContent = state?.basicInfo?.name || state?.basicInfo?.description;

            if (!hasMinimumContent) {
                return null;
            }

            hasTriggeredAutosaveRef.current = true;
            setIsAutosaving(true);

            try {
                const skillIds = extractSkillIdsFromAlignments(state?.alignments ?? []);

                const { boostUri } = await createBoost({
                    state: addFallbackNameToCMSState(state as any),
                    status: LCNBoostStatusEnum.draft,
                    skillIds,
                });

                if (boostUri) {
                    // Clear local storage since we saved to server
                    clearLocalSave();

                    // Invalidate queries to refresh the list
                    queryClient.invalidateQueries({ queryKey: ['boosts', state.basicInfo.type] });

                    presentToast('Your progress has been auto-saved as a draft', {
                        duration: 4000,
                        type: ToastTypeEnum.Success,
                    });

                    return boostUri;
                }

                return null;
            } catch (err) {
                console.error('[useBoostCMSAutosave] Failed to autosave draft:', err);
                // Keep local save as fallback
                presentToast('Unable to auto-save. Your progress is saved locally.', {
                    duration: 4000,
                    type: ToastTypeEnum.Error,
                });
                return null;
            } finally {
                setIsAutosaving(false);
            }
        },
        [createBoost, clearLocalSave, queryClient, presentToast, isAutosaving]
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
        triggerAutosaveDraft,
        isAutosaving,
        hasUnsavedChanges,
    };
}

export default useBoostCMSAutosave;
