import React from 'react';
import { useHistory } from 'react-router-dom';

import { IonSpinner } from '@ionic/react';
import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';
import AdminPageStructure from './AdminPageStructure';
import AdminToolsCreateProfileSimple from './AdminToolsAccountSwitcher/AdminToolsCreateProfileSimple';

import {
    useModal,
    useSwitchProfile,
    useGetCurrentLCNUser,
    useGetAvailableProfiles,
    currentUserStore,
    switchedProfileStore,
    UserProfilePicture,
} from 'learn-card-base';

const ManageServiceProfilesPage: React.FC = () => {
    const history = useHistory();
    const { newModal } = useModal();

    const currentUser = currentUserStore.use.currentUser();
    const parentUser = currentUserStore.use.parentUser();
    const isSwitchedProfile = switchedProfileStore.use.isSwitchedProfile();

    const { currentLCNUser } = useGetCurrentLCNUser();
    const isServiceProfile = currentLCNUser?.isServiceProfile;

    const mainUser = parentUser || currentUser;

    const { data: paginatedProfiles } = useGetAvailableProfiles({ isServiceProfile: true });

    const profiles = paginatedProfiles?.records;

    const { handleSwitchAccount, handleSwitchBackToParentAccount, isSwitching } =
        useSwitchProfile();

    const openCreateManagedProfileModal = () => {
        newModal(<AdminToolsCreateProfileSimple profileType="organization" />, {
            sectionClassName: '!bg-transparent !border-none !shadow-none !max-w-[400px]',
            hideButton: true,
        });
    };

    return (
        <AdminPageStructure title="Manage Service Profiles">
            <ul className="w-full max-w-[500px] relative">
                {isSwitching && (
                    <div className="w-full h-full absolute flex flex-col gap-[5px] items-center justify-center bg-grayscale-100 backdrop-blur-[2px] bg-opacity-60 z-9999">
                        <IonSpinner color="dark" />
                        <span>Switching...</span>
                    </div>
                )}
                <li className="flex gap-[15px] items-center py-[15px] px-[10px] border-b-[1px] border-grayscale-200 border-solid last:border-b-0">
                    <UserProfilePicture
                        customContainerClass="flex justify-center items-center w-[40px] h-[40px] max-w-[40px] max-h-[40px] shrink-0 rounded-full overflow-hidden text-white font-medium text-2xl "
                        customImageClass="flex justify-center items-center w-[40px] h-[40px] max-w-[40px] max-h-[40px] rounded-full overflow-hidden object-cover shrink-0"
                        customSize={120}
                        user={{ displayName: mainUser?.name, image: mainUser?.profileImage }}
                    />
                    {mainUser?.name}
                    {isSwitchedProfile && (
                        <button
                            onClick={handleSwitchBackToParentAccount}
                            className="rounded-full px-[10px] py-[5px] shadow-box-bottom ml-auto"
                        >
                            Switch
                        </button>
                    )}
                    {!isSwitchedProfile && (
                        <CircleCheckmark className="ml-auto h-[40px] w-[40px]" />
                    )}
                </li>
                {isSwitchedProfile && (
                    <li className="flex gap-[15px] items-center py-[15px] px-[10px] border-b-[1px] border-grayscale-200 border-solid last:border-b-0">
                        <UserProfilePicture
                            customContainerClass="flex justify-center items-center w-[40px] h-[40px] max-w-[40px] max-h-[40px] shrink-0 rounded-full overflow-hidden text-white font-medium text-2xl "
                            customImageClass="flex justify-center items-center w-[40px] h-[40px] max-w-[40px] max-h-[40px] rounded-full overflow-hidden object-cover shrink-0"
                            customSize={120}
                            user={{
                                displayName: currentUser?.name,
                                image: currentUser?.profileImage,
                            }}
                        />
                        {currentUser?.name}
                        <CircleCheckmark className="ml-auto h-[40px] w-[40px]" />
                    </li>
                )}
                {profiles?.length === 0 && (
                    <div className="w-full text-center pt-[15px]">No Managed Service Profiles</div>
                )}
                {profiles?.map((availableProfile, index) => {
                    const { profile } = availableProfile;

                    const { displayName, image } = profile;

                    return (
                        <li
                            key={index}
                            className="flex gap-[15px] items-center py-[15px] px-[10px] border-b-[1px] border-grayscale-200 border-solid last:border-b-0"
                        >
                            <UserProfilePicture
                                customContainerClass="flex justify-center items-center w-[40px] h-[40px] max-w-[40px] max-h-[40px] shrink-0 rounded-full overflow-hidden text-white font-medium text-2xl "
                                customImageClass="flex justify-center items-center w-[40px] h-[40px] max-w-[40px] max-h-[40px] rounded-full overflow-hidden object-cover shrink-0"
                                customSize={120}
                                user={{ displayName, image }}
                            />
                            {profile.displayName}
                            <button
                                onClick={() => handleSwitchAccount(profile)}
                                className="rounded-full px-[10px] py-[5px] shadow-box-bottom ml-auto"
                            >
                                Switch
                            </button>
                        </li>
                    );
                })}
                {/* TODO handle pagination */}
            </ul>
            <button
                onClick={openCreateManagedProfileModal}
                className="py-[5px] px-[15px] rounded-full bg-emerald-700 text-white text-[20px] shadow-box-bottom"
            >
                Create New Service Profile
            </button>
            {isServiceProfile && (
                <button
                    className="bg-white rounded-[20px] shadow-bottom px-[15px] py-[10px]"
                    onClick={() => history.push('/admin-tools/manage-contracts')}
                >
                    Manage ConsentFlow Contracts
                </button>
            )}
        </AdminPageStructure>
    );
};

export default ManageServiceProfilesPage;
