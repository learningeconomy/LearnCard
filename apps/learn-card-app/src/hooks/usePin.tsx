import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LCNProfile } from '@learncard/types';
import type { ModalInstanceToken } from 'learn-card-base/components/modals/types/Modals';
import {
    currentUserStore,
    ModalTypes,
    switchedProfileStore,
    useModal,
    useSwitchProfile,
    useWallet,
} from 'learn-card-base';
import FamilyPinWrapper, {
    FamilyPinViewModeEnum,
} from '../components/familyCMS/FamilyBoostPreview/FamilyPin/FamilyPinWrapper';

export const usePin = (onSwitch?: (profile: LCNProfile) => void) => {
    const { newModalWithToken, forceCloseModalByToken } = useModal();
    const queryClient = useQueryClient();
    const { initWallet } = useWallet();
    const { handleSwitchBackToParentAccount, isSwitching } = useSwitchProfile();
    const hasParentSwitchedProfiles = switchedProfileStore.use.isSwitchedProfile();

    const handleSwitch = async () => {
        const parentUser = currentUserStore.get.parentUser();
        const parentDid = currentUserStore.get.parentUserDid();
        await handleSwitchBackToParentAccount();
        return (
            queryClient.getQueryData<LCNProfile>(['getProfile', '', undefined]) ?? {
                did: parentDid ?? '',
                profileId: parentDid?.split(':').at(-1) ?? '',
                displayName: parentUser?.name ?? '',
                shortBio: '',
                bio: '',
                image: parentUser?.profileImage,
                isServiceProfile: false,
            }
        );
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
            const hasPin = ignorePin ? false : await (await initWallet()).invoke.hasPin(parentDid);
            if (!hasPin) {
                if (switchToParentAfterPin) onSwitch?.(await handleSwitch());
                onSuccess?.();
                return;
            }
        }

        const modalRef: { token?: ModalInstanceToken } = {};
        modalRef.token = newModalWithToken(
            <FamilyPinWrapper
                viewMode={FamilyPinViewModeEnum.edit}
                skipVerification={false}
                existingPin={['', '', '', '', '']}
                handleOnSubmit={async () => {
                    const parentProfile = switchToParentAfterPin ? await handleSwitch() : undefined;
                    if (modalRef.token) forceCloseModalByToken(modalRef.token);
                    if (parentProfile) onSwitch?.(parentProfile);
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
