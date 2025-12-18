import React from 'react';
import { LCNProfile } from '@learncard/types';
import {
    currentUserStore,
    ModalTypes,
    switchedProfileStore,
    useGetCurrentLCNUser,
    useModal,
    useSwitchProfile,
    useWallet,
} from 'learn-card-base';
import FamilyPinWrapper, {
    FamilyPinViewModeEnum,
} from '../components/familyCMS/FamilyBoostPreview/FamilyPin/FamilyPinWrapper';

export const usePin = (onSwitch?: (profile: LCNProfile) => void) => {
    const { newModal } = useModal();
    const { initWallet } = useWallet();
    const { handleSwitchBackToParentAccount, isSwitching } = useSwitchProfile();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const hasParentSwitchedProfiles = switchedProfileStore?.use?.isSwitchedProfile();

    const handleSwitch = async () => {
        await handleSwitchBackToParentAccount();
        onSwitch?.(currentLCNUser);
    };

    const handleVerifyParentPin = async (options?: {
        ignorePin?: boolean;
        switchToParentAfterPin?: boolean;
        onSuccess?: () => void;
        closeButtonText?: string;
    }) => {
        const {
            ignorePin = false,
            switchToParentAfterPin = true,
            onSuccess,
            closeButtonText,
        } = options ?? {};

        const parentDid = currentUserStore.get.parentUserDid();

        if (hasParentSwitchedProfiles && parentDid) {
            if (ignorePin) {
                handleSwitch();
                return;
            }

            const wallet = await initWallet();
            const hasPin = await wallet.invoke.hasPin(parentDid);

            if (!hasPin) {
                handleSwitch();
                return;
            }
        }

        newModal(
            <FamilyPinWrapper
                viewMode={FamilyPinViewModeEnum?.edit}
                skipVerification={false}
                existingPin={['', '', '', '', '']}
                handleOnSubmit={async () => {
                    if (switchToParentAfterPin) {
                        handleSwitch();
                    }
                    onSuccess?.();
                }}
                familyName={''}
                closeButtonText={closeButtonText}
            />,
            {
                sectionClassName:
                    '!bg-transparent !border-none !shadow-none !rounded-none mb-[-10px]',
                hideButton: true,
                usePortal: true,
                portalClassName: '!max-w-[400px] !mb-[-70px] h-[150px] ',
            },
            { mobile: ModalTypes.FullScreen, desktop: ModalTypes.Cancel }
        );
    };

    return { handleVerifyParentPin, isSwitching };
};

export default usePin;
