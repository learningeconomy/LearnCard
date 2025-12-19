import React from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useIonModal } from '@ionic/react';
import ChildInviteModal from '../../FamilyCMSInviteModal/ChildInviteModal/ChildInviteModal';
import FamilyInviteGuardian from './FamilyInviteGuardian';
import AddUser from '../../../svgs/AddUser';

import { LCNProfile, VC } from '@learncard/types';
import { FamilyChildAccount } from '../../familyCMSState';

import { ModalTypes, useGetBoostChildrenProfileManagers, useModal } from 'learn-card-base';
import { useCreateChildAccount } from 'apps/learn-card-app/src/hooks/useCreateChildAccount';

const FamilyBoostInviteModalOptions: React.FC<{
    credential?: VC;
    handleCloseModal: () => void;
}> = ({ credential, handleCloseModal }) => {
    const { closeModal, newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const queryClient = useQueryClient();
    const boostUri = credential?.boostId;

    const familyName = credential?.name;
    const familyTitles = credential?.familyTitles;
    const guardianTitle = familyTitles?.guardians;
    const dependentTitle = familyTitles?.dependents;

    const { mutate: createChildAccount } = useCreateChildAccount();
    const { refetch: refetchChildrenProfiles } = useGetBoostChildrenProfileManagers(boostUri);

    const [openGuardianInviteModal, dismissGuardianInviteModal] = useIonModal(
        FamilyInviteGuardian,
        {
            boostUri: credential?.boostId,
            credential: credential,
            handleCloseModal: () => dismissGuardianInviteModal(),
        }
    );

    const handleCreateChildAccount = async (childAccount: FamilyChildAccount) => {
        createChildAccount({
            childAccount: childAccount,
            boostUri: boostUri || credential?.boostId,
        });
    };

    const openChildInviteModal = () => {
        handleCloseModal();
        newModal(
            <ChildInviteModal
                handleCloseModal={closeModal}
                familyName={familyName}
                handleSaveChildAccount={handleCreateChildAccount}
            />,
            {},
            { mobile: ModalTypes.Freeform, desktop: ModalTypes.FullScreen }
        );
    };

    return (
        <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full px-2 max-w-[600px]">
                <button
                    onClick={() => {
                        handleCloseModal();
                        openGuardianInviteModal();
                    }}
                    className="w-full flex items-center justify-between px-2 border-b-grayscale-200 py-4 border-solid border-b-[1px]"
                >
                    <div className="flex flex-col items-start justify-center">
                        <p className="m-0 p-0 text-lg font-poppins text-grayscale-900">
                            Invite a {guardianTitle?.singular}
                        </p>
                    </div>
                    <div className="max-w-[30px] max-h-[30px] min-h-[30px] min-w-[30px] object-contain rounded-full bg-white mr-2">
                        <AddUser className={`h-[30px] w-[30px] text-grayscale-900`} version="2" />
                    </div>
                </button>
            </div>
            <div className="w-full px-2">
                <button
                    onClick={() => {
                        handleCloseModal();
                        openChildInviteModal();
                    }}
                    className="w-full flex items-center justify-between px-2 border-b-grayscale-200 py-4"
                >
                    <div className="flex flex-col items-start justify-center">
                        <p className="m-0 p-0 text-lg font-poppins text-grayscale-900">
                            Add a {dependentTitle?.singular}
                        </p>
                    </div>
                    <div className="max-w-[30px] max-h-[30px] min-h-[30px] min-w-[30px] object-contain rounded-full bg-white mr-2">
                        <AddUser className={`h-[30px] w-[30px] text-grayscale-900`} version="2" />
                    </div>
                </button>
            </div>
        </div>
    );
};

export default FamilyBoostInviteModalOptions;
