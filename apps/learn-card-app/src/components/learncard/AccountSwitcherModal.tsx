import React, { useState } from 'react';

import { IonSpinner } from '@ionic/react';
import NewProfileButton from './NewProfileButton';
import ParentSwitcherButton from './ParentSwitcherButton';
import NewProfileTypeSelector from './NewProfileTypeSelector';
import ActiveChildAccountButton from './ActiveChildAccountButton';
import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';
import ChildInviteModal from '../familyCMS/FamilyCMSInviteModal/ChildInviteModal/ChildInviteModal';
import AdminToolsCreateProfileSimple from '../../pages/adminToolsPage/AdminToolsAccountSwitcher/AdminToolsCreateProfileSimple';

import { useCreateChildAccount } from '../../hooks/useCreateChildAccount';
import useGetFamilyCredential from '../../hooks/useGetFamilyCredential';

import {
    useModal,
    useCurrentUser,
    useSwitchProfile,
    useGetCurrentLCNUser,
    useGetAvailableProfiles,
    ModalTypes,
    UserProfilePicture,
    switchedProfileStore,
} from 'learn-card-base';

import { FamilyChildAccount } from '../familyCMS/familyCMSState';
import { ConsentFlowContractDetails, LCNProfile } from '@learncard/types';
import { SwitcherStepEnum } from './switcher.helpers';

type AccountSwitcherModalProps = {
    title?: string;
    showFooter?: boolean;
    isFromGame?: boolean;
    contractDetails?: ConsentFlowContractDetails;
    showServiceProfiles?: boolean;
    showServiceProfilesOnly?: boolean;
    handlePlayerSwitchOverride?: (user: LCNProfile) => void;
    handleBackToGame?: () => void;
    onPlayerSwitch?: (user: LCNProfile) => void;

    headerOverrideComponent?: React.ReactNode;
    footerOverrideComponent?: React.ReactNode;

    showStepsFooter?: boolean;
    containerClassName?: string;
    initialStep?: string;
    childOnly?: boolean;
};

const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
    title = 'Select Profile',
    showFooter = false,
    isFromGame,
    handlePlayerSwitchOverride = undefined,
    contractDetails,
    handleBackToGame,
    onPlayerSwitch,
    showServiceProfiles = false,
    showServiceProfilesOnly = false,
    headerOverrideComponent,
    footerOverrideComponent,

    showStepsFooter = false,
    containerClassName = '',
    initialStep,
    childOnly = false,
}) => {
    const currentUser = useCurrentUser();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { newModal, closeModal, closeAllModals } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const [activeStep, setActiveStep] = useState(initialStep ?? SwitcherStepEnum.selectProfile);

    const { mutate: createChildAccount } = useCreateChildAccount();

    const { familyCredential } = useGetFamilyCredential();
    const familyName = familyCredential?.boostCredential?.name ?? familyCredential?.name;

    const { data: profiles, isLoading } = useGetAvailableProfiles();

    const profileType = switchedProfileStore.use.profileType();
    const profileIsParent = profileType !== 'child' && profileType !== 'service';

    let profileRecords = profiles?.records ?? [];
    profileRecords =
        showServiceProfiles || showServiceProfilesOnly
            ? profileRecords
            : profileRecords?.filter?.(
                  ({ profile }: { profile: LCNProfile }) => !profile.isServiceProfile
              );

    if (showServiceProfilesOnly) {
        profileRecords = profileRecords?.filter?.(
            ({ profile }: { profile: LCNProfile }) => profile.isServiceProfile
        );
    }

    const { handleSwitchAccount, isSwitching } = useSwitchProfile({
        onSwitch: closeModal,
    });

    const handleAddPlayer = () => {
        newModal(
            <ChildInviteModal
                familyName={familyName}
                handleSaveChildAccount={async (childAccount: FamilyChildAccount) => {
                    await createChildAccount({
                        childAccount,
                        boostUri: familyCredential?.boostId,
                    });
                }}
                handleCloseModal={closeModal}
            />,
            {},
            {}
        );
    };

    if (isLoading) {
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[300px] bg-white">
                <IonSpinner name="crescent" color="grayscale-900" className="scale-[2] mb-8 mt-6" />
                <p className="font-poppins text-grayscale-900">Loading Accounts...</p>
            </div>
        );
    }

    if (activeStep === SwitcherStepEnum.selectProfileType) {
        return (
            <NewProfileTypeSelector
                handleCreateOrganizationAccount={() =>
                    setActiveStep(SwitcherStepEnum.createOrganizationAccount)
                }
                handleCreateChildAccount={() => setActiveStep(SwitcherStepEnum.createChildAccount)}
                handleGoBack={() => setActiveStep(SwitcherStepEnum.selectProfile)}
            />
        );
    } else if (activeStep === SwitcherStepEnum.createChildAccount) {
        return <AdminToolsCreateProfileSimple profileType="child" />;
    } else if (activeStep === SwitcherStepEnum.createOrganizationAccount) {
        return <AdminToolsCreateProfileSimple profileType="organization" />;
    }

    return (
        <>
            <section
                className={`bg-white px-[30px] py-[40px] rounded-[20px] shadow-soft-bottom min-w-[350px] overflow-y-auto ${containerClassName}`}
            >
                {headerOverrideComponent}
                {!headerOverrideComponent && (
                    <h1 className="text-grayscale-900 font-notoSans text-[22px] leading-[130%] tracking-[-0.25px] text-center mb-[20px]">
                        {title}
                    </h1>
                )}
                <div className="grid grid-cols-2 gap-[20px] justify-items-center ">
                    <ActiveChildAccountButton
                        handlePlayerSwitchOverride={handlePlayerSwitchOverride}
                        onPlayerSwitch={onPlayerSwitch}
                    />
                    {!childOnly && (
                        <ParentSwitcherButton
                            handlePlayerSwitchOverride={handlePlayerSwitchOverride}
                            onPlayerSwitch={onPlayerSwitch}
                            isSwitching={isSwitching}
                        />
                    )}

                    {profileRecords
                        ?.filter(({ profile }: { profile: LCNProfile }) => {
                            // Filter out the active child account since it's already shown in ActiveChildAccountButton
                            if (profileType === 'child' && currentLCNUser?.did === profile?.did) {
                                return false;
                            }
                            return true;
                        })
                        ?.map((p, index) => {
                            const { profile, manager } = p;

                            const displayName = profile?.displayName || manager?.displayName;
                            const image = profile?.image || manager?.image;
                            const isSelected = currentLCNUser?.did === profile?.did;

                            const isServiceProfile = profile?.isServiceProfile ?? false;

                            return (
                                <button
                                    onClick={async () => {
                                        const switchedUser = {
                                            ...manager,
                                            did: profile?.did,
                                            profileId: profile?.profileId,
                                            isServiceProfile: profile?.isServiceProfile,
                                        };

                                        if (handlePlayerSwitchOverride) {
                                            handlePlayerSwitchOverride(switchedUser);
                                        } else {
                                            await handleSwitchAccount(switchedUser);
                                        }
                                        onPlayerSwitch?.(switchedUser);
                                    }}
                                    key={index}
                                    className="flex flex-col gap-[5px] items-center disabled:opacity-60"
                                    disabled={isSwitching}
                                >
                                    <UserProfilePicture
                                        customContainerClass={`flex justify-center items-center w-[86px] h-[86px] max-w-[86px] max-h-[86px] rounded-full overflow-hidden text-white font-medium text-4xl shrink-0 ${
                                            isSelected
                                                ? 'border-[3px] border-solid border-emerald-700'
                                                : ''
                                        }`}
                                        customImageClass="flex justify-center items-center w-[86px] h-[86px] max-w-[86px] max-h-[86px] rounded-full overflow-hidden object-cover shrink-0"
                                        customSize={120}
                                        user={{ displayName, image }}
                                    />

                                    <div className="flex flex-col items-center">
                                        <p
                                            className={`text-sm capitalize font-medium ${
                                                isSelected
                                                    ? 'text-grayscale-900'
                                                    : 'text-grayscale-600 '
                                            }`}
                                        >
                                            {displayName}
                                        </p>
                                        <p className="text-xs text-grayscale-600 font-semibold capitalize">
                                            {isServiceProfile ? 'Organization' : 'Child'}
                                        </p>
                                        <div className="h-[15px] w-[15px]">
                                            {isSelected && (
                                                <CircleCheckmark className="h-[15px] w-[15px]" />
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}

                    {showServiceProfiles && profileIsParent && (
                        <NewProfileButton
                            onClick={() => {
                                // if the user hasnt created a family credential bypass the profile selector type
                                // and go directly to the create organization account step
                                if (!familyCredential || showServiceProfilesOnly) {
                                    setActiveStep(SwitcherStepEnum.createOrganizationAccount);
                                    return;
                                }
                                setActiveStep(SwitcherStepEnum.selectProfileType);
                            }}
                        />
                    )}
                </div>
            </section>

            {showFooter &&
                (footerOverrideComponent || (
                    <footer className="absolute bottom-0 left-0 w-full bg-white bg-opacity-70 border-t-[1px] border-solid border-white p-[20px] backdrop-blur-[10px] flex flex-col gap-[10px] items-center">
                        <button
                            onClick={handleAddPlayer}
                            type="button"
                            className="shrink-0 w-full max-w-[400px] py-[10px] px-[15px] text-[20px] bg-grayscale-900 rounded-full font-notoSans text-white shadow-button-bottom disabled:opacity-60"
                            disabled={!familyCredential?.boostId || isSwitching}
                        >
                            Add New Player
                        </button>
                        <button
                            onClick={isFromGame ? handleBackToGame : closeAllModals}
                            type="button"
                            className="text-[17px] text-grayscale-900 font-[600] leading-[24px] tracking-[0.25px]"
                        >
                            {isFromGame ? 'Back to Game' : 'Cancel'}
                        </button>
                    </footer>
                ))}

            {showStepsFooter && (
                <>
                    <div className="w-full flex items-center justify-center mt-4">
                        <button
                            type="button"
                            className="shrink-0 w-full py-2 h-full flex items-center font-medium justify-center text-xl bg-white rounded-[20px] shadow-bottom text-grayscale-800"
                            onClick={closeModal}
                        >
                            Close
                        </button>
                    </div>
                </>
            )}
        </>
    );
};

export default AccountSwitcherModal;
