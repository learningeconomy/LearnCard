import React, { useState } from 'react';

import { useConfirmation, useModal, ModalTypes } from 'learn-card-base';

import { IonInput } from '@ionic/react';
import AddUser from '../../svgs/AddUser';
import FamilyCMSInviteModal from '../FamilyCMSInviteModal/FamilyCMSInviteModal';
import FamilyCMSMemberListItem from './FamilyCMSMemberListItem';

import { FamilyChildAccount, FamilyCMSState, FamilyMember } from '../familyCMSState';

export enum FamilyMembersListTabsEnum {
    all = 'all',
    child = 'child',
    guardian = 'guardian',
}

type FamilyCMSMemberListProps = {
    state: FamilyCMSState;
    setState: React.Dispatch<React.SetStateAction<FamilyCMSState>>;
    children?: React.ReactNode;
};

export const FamilyCMSMemberList: React.FC<FamilyCMSMemberListProps> = ({
    state,
    setState,
    children,
}) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const confirm = useConfirmation();

    const [activeTab, setActiveTab] = useState<FamilyMembersListTabsEnum>(
        FamilyMembersListTabsEnum.all
    );
    const [search, setSearch] = useState<string>('');
    const [admins, setAdmins] = useState<FamilyMember[]>(state?.admins);
    const [members, setMembers] = useState<FamilyChildAccount[]>(state?.childAccounts);

    const showFamilyInviteModal = () => {
        newModal(
            <FamilyCMSInviteModal
                state={state}
                setState={setState}
                handleCloseModal={closeModal}
                admins={admins}
                setAdmins={setAdmins}
                members={members}
                setMembers={setMembers}
                handleDeleteUser={(key: string, profileId: string) =>
                    handleDeleteUser(key, profileId)
                }
            />
        );
    };

    const childsList =
        state?.childAccounts?.map(child => {
            return {
                ...child,
                type: 'child',
            };
        }) ?? [];
    const GuardiansList =
        state?.admins?.map(guardian => {
            return {
                ...guardian,
                type: 'guardian',
            };
        }) ?? [];
    const childrenAndGuardiansList = [...GuardiansList, ...childsList];

    const childsListCount = childsList?.length ?? 0;
    const GuardiansListCount = GuardiansList?.length ?? 0;
    const childrenAndGuardiansListCount = childsListCount + GuardiansListCount;

    const customChildrenName = state?.basicInfo?.memberTitles?.dependents;
    const customGuardianName = state?.basicInfo?.memberTitles?.guardians;

    const handleDeleteUser = async (key: string, profileId: string) => {
        if (key === 'admins') {
            if (
                await confirm({
                    text: `Are you sure you want remove this ${customGuardianName.singular}`,
                    cancelButtonClassName:
                        'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px] ',
                    confirmButtonClassName:
                        'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
                })
            ) {
                setAdmins?.(prevState => [
                    ...prevState?.filter(user => user?.profileId !== profileId),
                ]);
                setState(prevState => {
                    return {
                        ...prevState,
                        [key]: [...prevState?.[key]?.filter(user => user?.profileId !== profileId)],
                    };
                });
            }
        }

        if (key === 'issueTo') {
            if (
                await confirm({
                    text: `Are you sure you want remove this ${customChildrenName.singular}`,
                    cancelButtonClassName:
                        'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px] ',
                    confirmButtonClassName:
                        'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
                })
            ) {
                setMembers?.(prevState => [...prevState?.filter(user => user?.name !== profileId)]);
                setState(prevState => {
                    return {
                        ...prevState,
                        childAccounts: [
                            ...prevState?.childAccounts?.filter(user => user?.name !== profileId),
                        ],
                    };
                });
            }
        }
    };

    const handleUpdateChildAccount = (name: string, updatedUser: FamilyChildAccount) => {
        setMembers?.(prevState => [
            ...prevState?.map(user => {
                if (user?.name === name) return updatedUser;
                return user;
            }),
        ]);
        setState(prevState => {
            return {
                ...prevState,
                childAccounts: [
                    ...prevState?.childAccounts.map(user => {
                        if (user?.name === name) return updatedUser;
                        return user;
                    }),
                ],
            };
        });
    };

    let filteredList = childrenAndGuardiansList ?? [];
    if (activeTab === FamilyMembersListTabsEnum.guardian) filteredList = GuardiansList;
    if (activeTab === FamilyMembersListTabsEnum.child) filteredList = childsList;
    if (search.length > 0) {
        filteredList = filteredList.filter(user => {
            if (
                user?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
                user?.profileId?.toLowerCase().includes(search.toLowerCase()) ||
                user?.name?.toLowerCase().includes(search.toLowerCase())
            ) {
                return true;
            }
            return false;
        });
    }

    return (
        <section className="bg-white ion-padding rounded-[20px] shadow-soft-bottom mt-[20px]">
            <div className="w-full flex items-start justify-center flex-col">
                <div className="w-full flex items-center justify-between">
                    <h3 className="font-poppins text-xl font-normal text-grayscale-800">
                        {childrenAndGuardiansListCount} Members
                    </h3>

                    <button
                        onClick={() => showFamilyInviteModal()}
                        className="bg-pink-600 flex items-center justify-center p-[6px] rounded-full w-[35px] h-[35px] min-w-[35px] min-h-[35px]"
                        aria-label="Add Family Member"
                    >
                        <AddUser className="text-white w-[25px] h-auto" />
                    </button>
                </div>
                {childrenAndGuardiansListCount > 0 && (
                    <>
                        <div className="flex mb-2">
                            <button
                                onClick={() => setActiveTab(FamilyMembersListTabsEnum.all)}
                                className={`text-sm font-poppins font-semibold mr-2 ${activeTab === FamilyMembersListTabsEnum.all
                                        ? 'text-[#0094B4]'
                                        : 'text-grayscale-700'
                                    }`}
                            >
                                All
                            </button>
                            {childsListCount > 0 && (
                                <button
                                    onClick={() => setActiveTab(FamilyMembersListTabsEnum.child)}
                                    className={`text-sm font-poppins font-semibold mr-2  ${activeTab === FamilyMembersListTabsEnum.child
                                            ? 'text-[#0094B4]'
                                            : 'text-grayscale-700'
                                        }`}
                                >
                                    {childsListCount}{' '}
                                    {childsListCount === 1
                                        ? customChildrenName?.singular || 'Child'
                                        : customChildrenName?.plural || 'Children'}
                                </button>
                            )}

                            {GuardiansListCount > 0 && (
                                <button
                                    onClick={() => setActiveTab(FamilyMembersListTabsEnum.guardian)}
                                    className={`text-sm font-poppins font-semibold mr-2  ${activeTab === FamilyMembersListTabsEnum.guardian
                                            ? 'text-[#0094B4]'
                                            : 'text-grayscale-700'
                                        }`}
                                >
                                    {GuardiansListCount}{' '}
                                    {GuardiansListCount === 1
                                        ? customGuardianName?.singular || 'Guardian'
                                        : customGuardianName?.plural || 'Guardians'}
                                </button>
                            )}
                        </div>
                        <IonInput
                            className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal font-poppins text-[17px] w-full troops-cms-placeholder mb-2"
                            placeholder="Search..."
                            value={search}
                            onIonInput={e => setSearch(e.detail.value)}
                        />
                    </>
                )}
            </div>

            {children}

            <div className="mt-1">
                {filteredList?.length > 0 &&
                    filteredList.map((user, index) => {
                        return (
                            <FamilyCMSMemberListItem
                                key={index}
                                state={state}
                                user={user}
                                handleDeleteUser={handleDeleteUser}
                                handleUpdateChildAccount={handleUpdateChildAccount}
                            />
                        );
                    })}

                {filteredList.length === 0 && search.length > 0 && (
                    <div className="w-full text-left flex flex-col items-start justify-center border-t-[2px] border-solid border-grayscale-100 pt-2 mt-2">
                        <p className="text-grayscale-600 text-base font-normal font-notoSans">
                            No results found for <span className="text-black italic">{search}</span>
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default FamilyCMSMemberList;
