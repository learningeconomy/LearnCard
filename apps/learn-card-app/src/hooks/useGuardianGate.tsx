import { useCallback, useMemo } from 'react';
import { getLogger } from 'learn-card-base';
const log = getLogger('use-guardian-gate');

import {
    switchedProfileStore,
    useModal,
    useWallet,
    ModalTypes,
    currentUserStore,
    useGetCurrentLCNUser,
    calculateAge,
} from 'learn-card-base';
import { guardianApprovalStore } from 'learn-card-base/stores/guardianApprovalStore';

import { FamilyPinWrapper } from '../components/familyCMS/FamilyBoostPreview/FamilyPin/FamilyPinWrapper';

const DEFAULT_VERIFICATION_TTL = 5 * 60 * 1000; // 5 minutes in ms

/**
 * Standalone function to clear guardian verification cache.
 * Call this when switching from child profile back to parent.
 */
export const clearGuardianVerification = (): void => {
    guardianApprovalStore.set.clearAllApprovals();
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

export type GuardedActionOptions = {
    /** Force re-verification even if guardian was recently verified */
    ignorePriorVerification?: boolean;
};

export type GuardianGateResult = {
    /** Wraps an action with guardian approval when needed */
    guardedAction: (
        action: () => Promise<void> | void,
        options?: GuardedActionOptions
    ) => Promise<void>;
    /** Whether the current profile is a child profile */
    isChildProfile: boolean;
    /** Whether the guardian has verified within the current TTL window */
    isGuardianVerified: boolean;
    /** Force clear the verification cache */
    clearVerification: () => void;
    /** Current user age */
    userAge: number | null;
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
    const { currentLCNUser } = useGetCurrentLCNUser();

    const isSwitchedProfile = switchedProfileStore?.use?.isSwitchedProfile();
    const profileType = switchedProfileStore?.use?.profileType();
    const parentDid = currentUserStore.use.parentUserDid();

    // Determine if we're operating as a child profile
    const isChildProfile = Boolean(isSwitchedProfile && profileType === 'child');

    // Calculate user age from date of birth
    const userAge = useMemo(() => {
        const userDob = currentLCNUser?.dob; // form: "YYYY-MM-DD"
        if (!userDob) return null;
        const age = calculateAge(userDob);
        return Number.isNaN(age) ? null : age;
    }, [currentLCNUser?.dob]);

    const isGuardianVerified = useCallback((): boolean => {
        const childDid = switchedProfileStore.get.switchedDid();
        return Boolean(
            parentDid && childDid && guardianApprovalStore.get.getApproval(parentDid, childDid)
        );
    }, [parentDid]);

    const setVerified = useCallback(async () => {
        try {
            const childDid = switchedProfileStore.get.switchedDid();
            const parentPrivateKey = currentUserStore.get.parentUser()?.privateKey;
            if (!parentDid || !childDid || !parentPrivateKey) {
                throw new Error('Guardian signing identity is unavailable');
            }

            const parentWallet = await initWallet(parentPrivateKey, parentDid);
            const expiresAt = Date.now() + Math.min(verificationTTL, DEFAULT_VERIFICATION_TTL);
            const guardianClaims = JSON.stringify({
                iss: parentDid,
                sub: childDid,
                exp: Math.floor(expiresAt / 1000),
                scope: 'guardian-approval',
            });
            const vp = await parentWallet.invoke.getDidAuthVp({
                proofFormat: 'jwt',
                challenge: guardianClaims,
            });
            if (typeof vp !== 'string' || !vp) {
                throw new Error('Guardian signing did not return an approval');
            }
            if (switchedProfileStore.get.switchedDid() !== childDid) {
                throw new Error('Child profile changed during guardian approval');
            }
            guardianApprovalStore.set.setApproval(parentDid, childDid, vp, expiresAt);
        } catch {
            onCancel?.();
            throw new Error('Could not create guardian approval. Please try again.');
        }
    }, [parentDid, initWallet, verificationTTL, onCancel]);

    const clearVerification = useCallback(() => {
        if (parentDid) {
            guardianApprovalStore.set.clearApproval(parentDid);
        }
    }, [parentDid]);

    const guardedAction = useCallback(
        async (
            action: () => Promise<void> | void,
            options: GuardedActionOptions = {}
        ): Promise<void> => {
            const { ignorePriorVerification = false } = options;
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
            if (!ignorePriorVerification && isGuardianVerified()) {
                onVerified?.(); // fix for an edge case where the original source modal was closed quickly after entering PIN
                await action();
                return;
            }

            // Need guardian verification
            if (!parentDid) {
                log.warn('useGuardianGate: No parent DID found for child profile');
                onCancel?.();
                return;
            }

            // Check if PIN exists for the parent
            const wallet = await initWallet();
            const hasPin = await wallet.invoke.hasPin(parentDid);

            // If no PIN set, skip verification
            if (!hasPin) {
                await setVerified();
                onVerified?.();
                await action();
                return;
            }

            // Show verification modal using FamilyPinWrapper
            return new Promise<void>((resolve, reject) => {
                const handleSuccess = async () => {
                    closeModal();
                    try {
                        await setVerified();
                        onVerified?.();
                        await action();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
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
        userAge,
    };
};

export default useGuardianGate;
