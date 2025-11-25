import React from 'react';

import Pencil from '../../svgs/Pencil';
import TrashBin from '../../../components/svgs/TrashBin';
import ChildInviteModal, {
    ChildInviteModalViewModeEnum,
} from '../FamilyCMSInviteModal/ChildInviteModal/ChildInviteModal';

import { useModal, ModalTypes, UserProfilePicture } from 'learn-card-base';
import { FamilyChildAccount, FamilyCMSState, FamilyMember } from '../familyCMSState';

export enum FamilyMembersListTabsEnum {
    all = 'all',
    child = 'child',
    guardian = 'guardian',
}

type FamilyCMSMemberListItemProps = {
    state: FamilyCMSState;
    user: FamilyMember | FamilyChildAccount;
    handleDeleteUser: (key: string, profileId: string) => void;
    handleUpdateChildAccount: (name: string, updatedUser: FamilyChildAccount) => void;
};

export const FamilyCMSMemberListItem: React.FC<FamilyCMSMemberListItemProps> = ({
    state,
    user,
    handleDeleteUser,
    handleUpdateChildAccount,
}) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const customChildrenName = state?.basicInfo?.memberTitles?.dependents;
    const customGuardianName = state?.basicInfo?.memberTitles?.guardians;

    const isChildAccount = user?.type === 'child';

    const typeTitle = isChildAccount
        ? customChildrenName?.singular || 'Child'
        : customGuardianName?.singular || 'Guardian';
    const deleteKey = isChildAccount ? 'issueTo' : 'admins';

    const profileId = isChildAccount ? user?.name : user?.profileId;

    const presentChildInviteModal = () => {
        newModal(
            <ChildInviteModal
                viewMode={ChildInviteModalViewModeEnum.edit}
                existingChild={user}
                familyName={state?.basicInfo?.name}
                handleCloseModal={closeModal}
                handleUpdateChildAccount={(name: string, updatedUser: FamilyChildAccount) =>
                    handleUpdateChildAccount(name, updatedUser)
                }
            />
        );
    };

    return (
        <div
            key={user?.did}
            className="flex items-center justify-between w-full bg-white border-t-grayscale-100 border-t-solid border-t-[2px] pb-[12px] pt-[12px]"
        >
            <div className="flex items-center justify-start w-full">
                <div className="flex items-center justify-start">
                    <UserProfilePicture
                        customContainerClass="flex justify-center items-center w-[40px] h-[40px] rounded-full overflow-hidden text-white font-medium text-4xl mr-3"
                        customImageClass="flex justify-center items-center w-[40px] h-[40px] rounded-full overflow-hidden object-cover"
                        customSize={120}
                        user={user}
                    />
                </div>
                <div className="flex flex-col items-start justify-center pt-1 pr-1 pb-1">
                    <p className="text-grayscale-900 font-normal font-poppins">
                        {user?.displayName || user?.name || user?.profileId}
                    </p>
                    <p className="text-grayscale-500 font-medium font-poppins flex items-center justify-center">
                        {typeTitle}
                    </p>
                </div>
            </div>
            {isChildAccount && (
                <div className="flex items-center justify-center rounded-full bg-grayscale-100 mr-2 h-[40px] w-[40px] min-h-[40px] min-w-[40px]  overflow-hidden">
                    <button
                        onClick={() => presentChildInviteModal()}
                        className="overflow-hidden flex items-center justify-center p-[8px]"
                    >
                        <Pencil className="text-blue-950 h-[30px] w-[30px]" />
                    </button>
                </div>
            )}

            <div className="flex items-center justify-center rounded-full bg-grayscale-100 mr-2 h-[40px] w-[40px] min-h-[40px] min-w-[40px]  overflow-hidden">
                <button
                    onClick={() => handleDeleteUser(deleteKey, profileId)}
                    className="overflow-hidden flex items-center justify-center p-[8px]"
                >
                    <TrashBin className="text-blue-950 h-[30px] w-[30px]" />
                </button>
            </div>
        </div>
    );
};

export default FamilyCMSMemberListItem;
