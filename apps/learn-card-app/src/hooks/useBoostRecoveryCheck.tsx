import React, { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { useModal, ModalTypes, BoostCategoryOptionsEnum } from 'learn-card-base';
import { BoostCMSState } from '../components/boost/boost';
import RecoveryPrompt from '../components/common/RecoveryPrompt';

const STORAGE_KEY = 'lc_boost_cms_autosave';
const STORAGE_VERSION = 1;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

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

interface RecoveredStateInfo {
    data: BoostCMSState;
    category: string | null;
    storageKey: string;
}

export function useBoostRecoveryCheck() {
    const { newModal, closeModal } = useModal();
    const history = useHistory();

    const parseStoredState = useCallback(
        (stored: string, storageKey: string): RecoveredStateInfo | null => {
            try {
                const parsed: AutosaveStorageWrapper = JSON.parse(stored);

                if (parsed.version !== STORAGE_VERSION) {
                    localStorage.removeItem(storageKey);
                    return null;
                }

                const age = Date.now() - parsed.timestamp;
                if (age > MAX_AGE_MS) {
                    localStorage.removeItem(storageKey);
                    return null;
                }

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
                localStorage.removeItem(storageKey);
            }
            return null;
        },
        []
    );

    const checkForSavedState = useCallback((): RecoveredStateInfo | null => {
        if (typeof window === 'undefined') return null;

        // Check all category keys for any saved state
        for (const category of ALL_BOOST_CATEGORIES) {
            const key = `${STORAGE_KEY}_${category}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                const result = parseStoredState(stored, key);
                if (result) return result;
            }
        }

        // Also check base key
        const baseStored = localStorage.getItem(STORAGE_KEY);
        if (baseStored) {
            const result = parseStoredState(baseStored, STORAGE_KEY);
            if (result) return result;
        }

        return null;
    }, [parseStoredState]);

    const clearAllSavedStates = useCallback(() => {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem(STORAGE_KEY);
            for (const category of ALL_BOOST_CATEGORIES) {
                localStorage.removeItem(`${STORAGE_KEY}_${category}`);
            }
        } catch (err) {
            console.warn('[useBoostRecoveryCheck] Failed to clear saved states:', err);
        }
    }, []);

    const clearSpecificSavedState = useCallback((storageKey: string) => {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem(storageKey);
        } catch (err) {
            console.warn('[useBoostRecoveryCheck] Failed to clear saved state:', err);
        }
    }, []);

    /**
     * Check for saved state and show recovery modal if found.
     * @param onProceed - Callback to execute when user chooses to start fresh (no saved state or discarded)
     * @returns Promise that resolves when the check is complete
     */
    const checkAndPromptRecovery = useCallback(
        (onProceed: () => void): void => {
            const savedState = checkForSavedState();

            if (!savedState) {
                // No saved state, proceed normally
                onProceed();
                return;
            }

            const handleRecover = () => {
                closeModal();

                const categoryType = savedState.category || savedState.data?.basicInfo?.type;
                const subCategoryType = savedState.data?.basicInfo?.achievementType;

                // Build URL with query params to pass recovered state info
                const params = new URLSearchParams();
                if (categoryType) {
                    params.set('boostCategoryType', categoryType);
                }
                if (subCategoryType) {
                    params.set('boostSubCategoryType', subCategoryType);
                }
                // Signal to BoostCMS to auto-recover without showing its own modal
                params.set('recovering', 'true');

                history.push(`/boost?${params.toString()}`);
            };

            const handleDiscard = () => {
                clearAllSavedStates();
                closeModal();
                // Proceed with the original action
                onProceed();
            };

            newModal(
                <RecoveryPrompt
                    itemName={savedState.data?.basicInfo?.name || 'Untitled Credential'}
                    itemType="boost"
                    onRecover={handleRecover}
                    onDiscard={handleDiscard}
                />,
                { sectionClassName: '!max-w-[400px]' },
                { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
            );
        },
        [
            checkForSavedState,
            clearAllSavedStates,
            clearSpecificSavedState,
            closeModal,
            history,
            newModal,
        ]
    );

    return {
        checkForSavedState,
        checkAndPromptRecovery,
        clearAllSavedStates,
        clearSpecificSavedState,
    };
}

export default useBoostRecoveryCheck;
