import { useCallback } from 'react';

import {
    switchedProfileStore,
    useModal,
    useWallet,
    ModalTypes,
    currentUserStore,
} from 'learn-card-base';

import { FamilyPinWrapper } from '../components/familyCMS/FamilyBoostPreview/FamilyPin/FamilyPinWrapper';

const DEFAULT_VERIFICATION_TTL = 5 * 60 * 1000; // 5 minutes in ms

// Module-level storage for verification timestamps (not persisted)
const verificationTimestamps = new Map<string, number>();

/**
 * Standalone function to clear guardian verification cache.
 * Call this when switching from child profile back to parent.
 */
export const clearGuardianVerification = (): void => {
    verificationTimestamps.clear();
};

export type UseGuardianGateOptions = {
    /** Called when guardian verification is cancelled or fails */
    onCancel?: () => void;
    /** Called after successful guardian verification */
    onVerified?: () => void;
    /** Skip the gate entirely (e.g., for previews) */
    skip?: boolean;
    /** Session duration in ms before re-verification is required (default: 5 min) */
    verificationTTL?: number;
};

export type GuardianGateResult = {
    /** Wraps an action with guardian approval when needed */
    guardedAction: (action: () => Promise<void> | void) => Promise<void>;
    /** Whether the current profile is a child profile */
    isChildProfile: boolean;
    /** Whether the guardian has verified within the current TTL window */
    isGuardianVerified: boolean;
    /** Force clear the verification cache */
    clearVerification: () => void;
};

export const useGuardianGate = (options: UseGuardianGateOptions = {}): GuardianGateResult => {
    const {
        onCancel,
        onVerified,
        skip = false,
        verificationTTL = DEFAULT_VERIFICATION_TTL,
    } = options;

    const { newModal, closeModal } = useModal();
    const { initWallet } = useWallet();

    const isSwitchedProfile = switchedProfileStore?.use?.isSwitchedProfile();
    const profileType = switchedProfileStore?.use?.profileType();
    const parentDid = currentUserStore.use.parentUserDid();

    // Determine if we're operating as a child profile
    const isChildProfile = Boolean(isSwitchedProfile && profileType === 'child');

    // Check if verification is still valid within TTL
    const isGuardianVerified = useCallback((): boolean => {
        if (!parentDid) return false;

        const lastVerification = verificationTimestamps.get(parentDid);
        if (!lastVerification) return false;

        const elapsed = Date.now() - lastVerification;
        return elapsed < verificationTTL;
    }, [parentDid, verificationTTL]);

    const setVerified = useCallback(() => {
        if (parentDid) {
            verificationTimestamps.set(parentDid, Date.now());
        }
    }, [parentDid]);

    const clearVerification = useCallback(() => {
        if (parentDid) {
            verificationTimestamps.delete(parentDid);
        }
    }, [parentDid]);

    const guardedAction = useCallback(
        async (action: () => Promise<void> | void): Promise<void> => {
            // If skip is enabled, execute immediately
            if (skip) {
                await action();
                return;
            }

            // If not a child profile, execute immediately
            if (!isChildProfile) {
                await action();
                return;
            }

            // If already verified within TTL, execute immediately
            if (isGuardianVerified()) {
                await action();
                return;
            }

            // Need guardian verification
            if (!parentDid) {
                console.warn('useGuardianGate: No parent DID found for child profile');
                onCancel?.();
                return;
            }

            // Check if PIN exists for the parent
            const wallet = await initWallet();
            const hasPin = await wallet.invoke.hasPin(parentDid);

            // If no PIN set, skip verification
            if (!hasPin) {
                setVerified();
                onVerified?.();
                await action();
                return;
            }

            // Show verification modal using FamilyPinWrapper
            return new Promise<void>(resolve => {
                const handleSuccess = async () => {
                    // Close modal FIRST, before running action
                    closeModal();
                    // Small delay to ensure modal animation completes
                    await new Promise(r => setTimeout(r, 50));

                    setVerified();
                    onVerified?.();
                    await action();
                    resolve();
                };

                newModal(
                    <FamilyPinWrapper
                        viewMode="edit"
                        skipVerification={false}
                        existingPin={['', '', '', '', '']}
                        handleOnSubmit={handleSuccess}
                        familyName=""
                        closeButtonText="Cancel"
                    />,
                    {
                        sectionClassName:
                            '!bg-transparent !border-none !shadow-none !rounded-none mb-[-10px]',
                        hideButton: true,
                        usePortal: true,
                        portalClassName: '!max-w-[400px] !mb-[-70px] h-[150px]',
                    },
                    { mobile: ModalTypes.FullScreen, desktop: ModalTypes.Cancel }
                );
            });
        },
        [
            skip,
            isChildProfile,
            isGuardianVerified,
            parentDid,
            initWallet,
            newModal,
            closeModal,
            setVerified,
            onVerified,
            onCancel,
        ]
    );

    return {
        guardedAction,
        isChildProfile,
        isGuardianVerified: isGuardianVerified(),
        clearVerification,
    };
};

export default useGuardianGate;
