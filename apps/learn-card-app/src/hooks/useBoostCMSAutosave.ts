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
    clearRecoveredState: () => void;
    saveToLocal: (state: BoostCMSState) => void;
    clearLocalSave: () => void;
    triggerAutosaveDraft: (state: BoostCMSState) => Promise<string | null>;
    isAutosaving: boolean;
}

/**
 * Hook for auto-saving BoostCMS state to prevent data loss.
 *
 * Features:
 * - Saves state to localStorage on changes (debounced)
 * - Can save as draft to server on critical events (errors, navigation)
 * - Recovers state from localStorage on component mount
 * - Handles visibility change (tab switching, app background)
 * - Handles beforeunload (browser close/navigation)
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
    const [isAutosaving, setIsAutosaving] = useState(false);

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

    // Load recovered state from localStorage on mount
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        try {
            const storageKey = getStorageKey();
            const stored = localStorage.getItem(storageKey);

            if (!stored) return;

            const parsed: AutosaveStorageWrapper = JSON.parse(stored);

            // Check version compatibility
            if (parsed.version !== STORAGE_VERSION) {
                console.log('[useBoostCMSAutosave] Version mismatch, ignoring saved state');
                localStorage.removeItem(storageKey);
                return;
            }

            // Check expiration
            const age = Date.now() - parsed.timestamp;
            if (age > MAX_AGE_MS) {
                console.log('[useBoostCMSAutosave] Saved state expired, removing');
                localStorage.removeItem(storageKey);
                return;
            }

            // Validate the state has meaningful content
            const hasContent =
                parsed.data?.basicInfo?.name ||
                parsed.data?.basicInfo?.description ||
                parsed.data?.appearance?.badgeThumbnail;

            if (hasContent) {
                setRecoveredState(parsed.data);
                setHasRecoveredState(true);
            }
        } catch (err) {
            console.warn('[useBoostCMSAutosave] Failed to load saved state:', err);
        }
    }, [enabled, getStorageKey]);

    // Save state to localStorage (debounced)
    const saveToLocal = useCallback(
        (state: BoostCMSState) => {
            if (!enabled || typeof window === 'undefined') return;

            currentStateRef.current = state;

            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

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
            // Also clear the current state ref so visibility/beforeunload handlers don't re-save
            currentStateRef.current = null;
        } catch (err) {
            console.warn('[useBoostCMSAutosave] Failed to clear local save:', err);
        }
    }, [getStorageKey]);

    // Clear recovered state (user chose to ignore it)
    const clearRecoveredState = useCallback(() => {
        setRecoveredState(null);
        setHasRecoveredState(false);
        clearLocalSave();
    }, [clearLocalSave]);

    // Trigger autosave to server as draft
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

    // Handle visibility change (tab switch, app background)
    useEffect(() => {
        if (!enabled || typeof window === 'undefined' || typeof document === 'undefined') return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && currentStateRef.current) {
                // Force immediate local save when going to background
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

    // Handle beforeunload (browser close/refresh/navigation)
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

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return {
        hasRecoveredState,
        recoveredState,
        clearRecoveredState,
        saveToLocal,
        clearLocalSave,
        triggerAutosaveDraft,
        isAutosaving,
    };
}

export default useBoostCMSAutosave;
