import React, { useState } from 'react';

import AddUser from '../../svgs/AddUser';
import ChildInviteModal from './ChildInviteModal/ChildInviteModal';

import BoostAddressBook, {
    BoostAddressBookEditMode,
    BoostAddressBookViewMode,
} from '../../boost/boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBook';
import { FamilyChildAccount, FamilyCMSState, FamilyMember } from '../familyCMSState';
import { ModalTypes, useGetSearchProfiles, useModal } from 'learn-card-base';

export enum FamilyInviteTypeEnum {
    guardian = 'guardian',
    child = 'child',
}

type FamilyCMSInviteModalButtonProps = {
    btnText?: string;
    state: FamilyCMSState;
    setState: React.Dispatch<React.SetStateAction<FamilyCMSState>>;
    collectionKey: string;
    handleCloseModal: () => void;
    admins?: FamilyMember[];
    setAdmins?: React.Dispatch<React.SetStateAction<FamilyMember[]>>;
    members?: FamilyMember[];
    setMembers?: React.Dispatch<React.SetStateAction<FamilyMember[]>>;
    showBorder?: boolean;
    inviteType: FamilyInviteTypeEnum;
    handleDeleteUser?: (key: string, profileId: string) => void;
};

const FamilyCMSInviteModalButton: React.FC<FamilyCMSInviteModalButtonProps> = ({
    btnText,
    state,
    setState,
    members,
    setMembers,
    admins,
    setAdmins,
    handleCloseModal,
    collectionKey,
    showBorder = true,
    inviteType,
    handleDeleteUser,
}) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const [search, setSearch] = useState<string>('');
    const { data: searchResults, isLoading: loading } = useGetSearchProfiles(search ?? '');

    const presentAddressBook = () => {
        newModal(
            <BoostAddressBook
                state={state}
                setState={setState}
                viewMode={BoostAddressBookViewMode.full}
                mode={BoostAddressBookEditMode.edit}
                handleCloseModal={() => {
                    handleCloseModal();
                    closeModal();
                }}
                _issueTo={collectionKey === 'issueTo' ? members : admins}
                _setIssueTo={collectionKey === 'issueTo' ? setMembers : setAdmins}
                search={search}
                setSearch={setSearch}
                searchResults={searchResults}
                isLoading={loading}
                collectionPropName={collectionKey}
            />
        );
    };

    const handleSaveChildAccount = (childAccount: FamilyChildAccount) => {
        setState(prevState => {
            return {
                ...prevState,
                childAccounts: [...prevState?.childAccounts, childAccount],
            };
        });
    };

    const presentInviteChild = () => {
        newModal(
            <ChildInviteModal
                handleCloseModal={closeModal}
                familyName={state?.basicInfo?.name}
                handleSaveChildAccount={handleSaveChildAccount}
                handleDeleteUser={(key: string, profileId: string) =>
                    handleDeleteUser?.(key, profileId)
                }
            />
        );
    };

    const handleInvite = () => {
        if (inviteType === FamilyInviteTypeEnum.guardian) {
            presentAddressBook();
            return;
        } else if (inviteType === FamilyInviteTypeEnum.child) {
            handleCloseModal();
            presentInviteChild();
            return;
        }
    };

    return (
        <div className="w-full px-2">
            <button
                onClick={() => {
                    handleInvite();
                }}
                className={`w-full flex items-center justify-between px-2 border-b-grayscale-200 0 py-4 ${showBorder ? 'border-solid border-b-[1px]' : ''
                    }`}
            >
                <div className="flex flex-col items-start justify-center">
                    <p className="m-0 p-0 text-lg font-poppins text-grayscale-900">{btnText}</p>
                </div>
                <div className="max-w-[30px] max-h-[30px] min-h-[30px] min-w-[30px] object-contain rounded-full bg-white mr-2">
                    <AddUser className={`h-[30px] w-[30px] text-grayscale-900`} version="2" />
                </div>
            </button>
        </div>
    );
};

export default FamilyCMSInviteModalButton;
