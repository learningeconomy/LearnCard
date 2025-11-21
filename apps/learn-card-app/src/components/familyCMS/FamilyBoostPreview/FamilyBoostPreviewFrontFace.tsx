import React, { useEffect, useState } from 'react';

import FamilyCrest from '../FamilyCrest/FamilyCrest';
import FamilyBoostMembersList from './FamilyBoostMembersList/FamilyBoostMembersList';
import FamilyPinButton from './FamilyPin/FamilyPinButton';
import VerifiedBadge from 'learn-card-base/svgs/VerifiedBadge';

import FamilyPinWrapper, { FamilyPinViewModeEnum } from './FamilyPin/FamilyPinWrapper';
import { LCNProfile, VC } from '@learncard/types';
import {
    authStore,
    ModalTypes,
    switchedProfileStore,
    useCreatePin,
    useGetDidHasPin,
    useModal,
    useUpdatePin,
    useUpdatePinWithToken,
    useValidatePinUpdateToken,
    useWallet,
} from 'learn-card-base';

export const FamilyBoostPreviewFrontFace: React.FC<{
    credential: VC;
    presentShareBoostLink: () => void;
}> = ({ credential, presentShareBoostLink }) => {
    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const { initWallet } = useWallet();
    const thumbnail = credential?.image;
    const familyName = credential?.name;
    const familyMotto = credential?.credentialSubject?.achievement?.description;
    const emoji = credential?.display?.emoji;

    const { data: hasPin, isLoading: hasPinLoading, refetch } = useGetDidHasPin();
    const { mutateAsync: createPin } = useCreatePin();
    const { mutateAsync: updatePin } = useUpdatePin();
    const { mutateAsync: validatePinUpdateToken } = useValidatePinUpdateToken();
    const { mutateAsync: updatePinWithToken } = useUpdatePinWithToken();

    const hasSwitedProfiles = switchedProfileStore.use.isSwitchedProfile();

    const handlePinOnSubmit = async (pin: string, newPin: string = '') => {
        const pinUpdateToken = authStore.get.pinToken();
        const isPinValid = await validatePinUpdateToken({ token: pinUpdateToken });

        if (isPinValid && hasPin) {
            const result = await updatePinWithToken({ token: pinUpdateToken, newPin: pin });
            if (result) {
                authStore.set.pinToken('');
                authStore.set.pinTokenExpire(null);
            }

            return;
        } else if (hasPin && !isPinValid) {
            updatePin({ currentPin: pin, newPin: newPin });
            authStore.set.pinToken('');
            authStore.set.pinTokenExpire(null);
            return;
        } else {
            createPin({ pin });
            refetch();
        }
    };

    const presentPinModal = async () => {
        const pinUpdateToken = authStore.get.pinToken();
        const isPinValid = await validatePinUpdateToken({ token: pinUpdateToken });

        const skipVerification = !hasPin || isPinValid;

        newModal(
            <FamilyPinWrapper
                viewMode={
                    hasPin || isPinValid
                        ? FamilyPinViewModeEnum?.edit
                        : FamilyPinViewModeEnum.create
                }
                skipVerification={skipVerification}
                existingPin={['', '', '', '', '']}
                handleOnSubmit={handlePinOnSubmit}
                familyName={familyName}
                titleOverride={!hasPin && 'Create Pin'}
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

    const [guardians, setGuardians] = useState<LCNProfile[]>([]);
    const [dependents, setDependents] = useState<LCNProfile[]>([]);

    const getAdmins = async () => {
        const wallet = await initWallet();
        const admins = (await wallet?.invoke?.getBoostAdmins(credential?.boostId))?.records ?? [];

        setGuardians(
            admins?.map((admin: LCNProfile) => {
                return {
                    ...admin,
                    type: 'Guardian',
                };
            })
        );
    };

    const getDependents = async () => {
        const wallet = await initWallet();
        const _dependents =
            (await wallet?.invoke?.getBoostChildrenProfileManagers(credential?.boostId)).records ??
            [];

        setDependents(
            _dependents?.map((dependent: LCNProfile) => {
                return {
                    ...dependent,
                    type: 'Child',
                };
            })
        );
    };

    useEffect(() => {
        getAdmins();
        getDependents();
    }, []);

    const guardiansCount: number = guardians.length || 0;
    const childrenCount: number = dependents.length || 0;
    const totalMembersCount: number = guardiansCount + childrenCount || 0;

    return (
        <div className="w-full max-w-[400px] pb-[100px]">
            <FamilyCrest
                thumbnail={thumbnail}
                familyName={familyName}
                familyMotto={familyMotto}
                showQRCode
                showEmoji={emoji?.unified}
                emoji={emoji}
                qrCodeOnClick={presentShareBoostLink}
            >
                {/* needs to be the header font color */}
                <p className="text-grayscale-900 mt-4 leading-[.75rem] font-semibold font-poppins text-sm">
                    {totalMembersCount} Members
                </p>
                <FamilyBoostMembersList credential={credential} showMinified />
            </FamilyCrest>
            <div className="bg-white ion-padding rounded-b-[20px] shadow-soft-bottom pt-[24px]">
                {/* hide for mvp */}
                {/* <FamilyBoostList credential={credential} />*/}
                {!hasSwitedProfiles && (
                    <FamilyPinButton
                        onClick={presentPinModal}
                        title={hasPin ? 'Edit Pin' : 'Create Pin'}
                        pinExists={hasPin}
                    />
                )}

                <h3 className="flex items-center justify-center font-poppins uppercase text-xs text-blue-light font-medium mt-2">
                    <VerifiedBadge className="mr-1" /> Trusted
                </h3>
            </div>

            <FamilyBoostMembersList credential={credential} />
        </div>
    );
};

export default FamilyBoostPreviewFrontFace;
