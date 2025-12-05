import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ModalTypes, useModal } from 'learn-card-base';
import { ProfilePicture } from 'learn-card-base';
import PassportIcon from 'learn-card-base/svgs/PassportIcon';
import Rocket from 'learn-card-base/svgs/Rocket';
import CheckListContainer from 'apps/learn-card-app/src/components/learncard/checklist/CheckListContainer';
import AiPassportPersonalizationContainer from 'apps/learn-card-app/src/components/ai-passport/AiPassportPersonalizationContainer';
import SolidCircleIcon from 'learn-card-base/svgs/SolidCircleIcon';
import AISessionsQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/AISessionsQuickNav';
import BoostsQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/BoostsQuickNav';
import CredentialQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/CredentialQuickNav';
import UnicornIcon from 'learn-card-base/svgs/UnicornIcon';
import ResumeQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/ResumeQuickNav';
import CaretDown from 'learn-card-base/svgs/CaretDown';
import StudiesQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/StudiesQuickNav';
import X from 'learn-card-base/svgs/X';
import LaunchPadRoleSelector from './LaunchPadRoleSelector';
import { useTheme } from 'apps/learn-card-app/src/theme/hooks/useTheme';
import { IconSetEnum } from 'apps/learn-card-app/src/theme/icons/index';
import AccountSwitcherModal from 'apps/learn-card-app/src/components/learncard/AccountSwitcherModal';
import { SwitcherStepEnum } from 'apps/learn-card-app/src/components/learncard/switcher.helpers';
import FamilyBoostPreviewWrapper from 'apps/learn-card-app/src/components/familyCMS/FamilyBoostPreview/FamilyBoostPreviewWrapper';
import useGetFamilyCredential from 'apps/learn-card-app/src/hooks/useGetFamilyCredential';
import AdminToolsOptionsContainer from 'apps/learn-card-app/src/pages/adminToolsPage/AdminToolsModal/AdminToolsOptionsContainer';
import {
    adminToolOptions,
    AdminToolOptionsEnum,
    developerToolOptions,
} from 'apps/learn-card-app/src/pages/adminToolsPage/AdminToolsModal/admin-tools.helpers';
import AdminToolsCreateProfileSimple from 'apps/learn-card-app/src/pages/adminToolsPage/AdminToolsAccountSwitcher/AdminToolsCreateProfileSimple';
import useBoostModal from 'apps/learn-card-app/src/components/boost/hooks/useBoostModal';
import { openDeveloperDocs } from 'apps/learn-card-app/src/helpers/externalLinkHelpers';
import {
    LearnCardRolesEnum,
    LearnCardRoles,
} from '../../../components/onboarding/onboarding.helpers';
import {
    useWallet,
    useGetProfile,
    useToast,
    ToastTypeEnum,
    BoostCategoryOptionsEnum,
    BoostUserTypeEnum,
    useGetCredentialList,
    CredentialCategoryEnum,
} from 'learn-card-base';
import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';

const getIconForActionButton = (
    label: string,
    opts?: { buildMyLCIcon?: string; AiInsightsIcon?: React.FC<{ className?: string }> }
) => {
    switch (label) {
        case 'New AI Session':
            return <AISessionsQuickNav className="w-[50px] h-auto" />;
        case 'Boost Someone':
            return <BoostsQuickNav className="w-[50px] h-auto" />;
        case 'Create Resume':
            return <ResumeQuickNav className="w-[50px] h-auto" />;
        case 'Add Studies':
            return <StudiesQuickNav className="w-[50px] h-auto" />;
        case 'Add Credential':
            return <CredentialQuickNav className="w-[50px] h-auto" />;
        case 'Personalize AI Sessions':
            return <UnicornIcon className="w-[50px] h-auto" />;
        case 'Understand My Skills':
            if (opts?.AiInsightsIcon) return <opts.AiInsightsIcon className="w-[50px] h-auto" />;
            return <SolidCircleIcon className="w-[50px] h-auto" />;
        case 'Build My LearnCard':
            if (opts?.buildMyLCIcon) {
                return (
                    <img
                        src={opts.buildMyLCIcon}
                        alt="Build My LearnCard"
                        className="w-[50px] h-[50px] object-contain rounded-[8px] bg-white"
                    />
                );
            }
            return <SolidCircleIcon className="w-[50px] h-auto" />;
        case 'Start AI Tutoring Session':
            return <AISessionsQuickNav className="w-[50px] h-auto" />;
        case 'Claim Credential':
            return <CredentialQuickNav className="w-[50px] h-auto" />;
        case 'Create Credential':
        case 'Issue Learner Credential':
            return <CredentialQuickNav className="w-[50px] h-auto" />;
        case 'Manage Skills Frameworks':
            return <StudiesQuickNav className="w-[50px] h-auto" />;
        case 'View Learner Insights':
        case 'Request Learner Insights':
        case 'View Child Insights':
            return <ResumeQuickNav className="w-[50px] h-auto" />;
        case 'Boost Child':
            return <BoostsQuickNav className="w-[50px] h-auto" />;
        default:
            return <SolidCircleIcon className="w-[50px] h-auto" />;
    }
};

const ActionButton: React.FC<{
    label: string;
    bg: string;
    to?: string;
    onClick?: () => void;
}> = ({ label, bg, to, onClick }) => {
    const history = useHistory();
    const { newModal, closeModal, closeAllModals } = useModal();
    const { handlePresentBoostModal } = useBoostModal(undefined, undefined, true, true);
    const { theme, getIconSet } = useTheme();
    const buildMyLCIcon = theme?.defaults?.buildMyLCIcon;
    const sideMenuIcons = getIconSet(IconSetEnum.sideMenu);
    const AiInsightsIcon = sideMenuIcons[CredentialCategoryEnum.aiInsight];

    const handleClick = () => {
        if (onClick) {
            onClick();
            return;
        }
        if (to) {
            history.push(to);
            closeModal();
            return;
        }

        switch (label) {
            case 'Build My LearnCard':
                closeModal();
                newModal(
                    <CheckListContainer />,
                    { className: '!bg-transparent' },
                    { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                );
                return;
            case 'Create Family':
                history.push('/families?createFamily=1');
                closeModal();
                return;
            case 'Switch Child':
                closeModal();
                newModal(
                    <AccountSwitcherModal />,
                    { sectionClassName: '!max-w-[400px]' },
                    { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
                );
                return;
            case 'Add Child':
                closeModal();
                newModal(
                    <AccountSwitcherModal initialStep={SwitcherStepEnum.createChildAccount} />,
                    { sectionClassName: '!max-w-[400px]' },
                    { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
                );
                return;
            case 'Boost Child':
                closeModal();
                newModal(
                    <AccountSwitcherModal
                        childOnly
                        handlePlayerSwitchOverride={user => {
                            const baseLink = `/boost?boostUserType=${BoostUserTypeEnum.someone}&boostCategoryType=${BoostCategoryOptionsEnum.socialBadge}&boostSubCategoryType=${AchievementTypes.Aficionado}`;
                            const link = user?.profileId
                                ? `${baseLink}&otherUserProfileId=${user.profileId}`
                                : baseLink;
                            history.push(link);
                        }}
                        onPlayerSwitch={() => closeAllModals()}
                    />,
                    { sectionClassName: '!max-w-[400px]' },
                    { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
                );
                return;
            case 'Import Credentials':
                closeModal();
                newModal(
                    <AdminToolsOptionsContainer
                        option={
                            adminToolOptions.find(
                                option => option.type === AdminToolOptionsEnum.BULK_UPLOAD
                            )!
                        }
                    />,
                    {},
                    { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                );
                return;
            case 'Create Organization':
                closeModal();
                newModal(
                    <AdminToolsCreateProfileSimple profileType="organization" />,
                    {
                        sectionClassName: 'flex flex-col items-center justify-center',
                        className: 'w-full h-full',
                    },
                    { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                );
                return;
            case 'Switch Account':
                closeModal();
                newModal(
                    <AccountSwitcherModal
                        showServiceProfiles
                        containerClassName="max-h-[65vh]"
                        showStepsFooter
                    />,
                    {
                        sectionClassName:
                            '!bg-transparent !border-none !shadow-none !max-w-[400px]',
                        hideButton: true,
                    }
                );
                return;
            case 'Create Credential':
                closeModal();
                handlePresentBoostModal();
                return;
            case 'Create API Token':
                closeModal();
                newModal(
                    <AdminToolsOptionsContainer
                        option={
                            developerToolOptions.find(
                                option => option.type === AdminToolOptionsEnum.API_TOKENS
                            )!
                        }
                    />,
                    {},
                    { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                );
                return;
            case 'Create Signing Authority':
                closeModal();
                newModal(
                    <AdminToolsOptionsContainer
                        option={
                            developerToolOptions.find(
                                option => option.type === AdminToolOptionsEnum.SIGNING_AUTHORITY
                            )!
                        }
                    />,
                    {},
                    { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                );
                return;
            case 'Create ConsentFlow':
                closeModal();
                newModal(
                    <AdminToolsOptionsContainer
                        option={
                            adminToolOptions.find(
                                option => option.type === AdminToolOptionsEnum.CONSENT_FLOW
                            )!
                        }
                    />,
                    {},
                    { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                );
                return;
            case 'Switch Network':
                closeModal();
                newModal(
                    <AdminToolsOptionsContainer
                        option={
                            developerToolOptions.find(
                                option => option.type === AdminToolOptionsEnum.NETWORKS
                            )!
                        }
                    />,
                    {},
                    { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                );
                return;
            case 'Read Docs':
                openDeveloperDocs();
                closeModal();
                return;
            case 'Understand My Skills':
                history.push('/ai/insights');
                closeModal();
                return;
            case 'Personalize AI Sessions':
                closeModal();
                newModal(
                    <AiPassportPersonalizationContainer />,
                    { className: '!bg-transparent' },
                    { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                );
                return;
            case 'Start AI Tutoring Session':
                history.push('/ai/topics');
                closeModal();
                return;
            default:
                return;
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`${bg} w-full text-lef flex px-5 py-4  text-[18px] font-poppins font-semibold text-grayscale-900 rounded-[20px] border border-solid border-[3px] border-white shadow-[0_2px_6px_0_rgba(0,0,0,0.25)]`}
        >
            <div className="flex items-center justify-center">
                <span className="mr-2">
                    {getIconForActionButton(label, { buildMyLCIcon, AiInsightsIcon })}
                </span>{' '}
                {label}
            </div>
        </button>
    );
};

const LaunchPadActionModal: React.FC<{ showFooterNav?: boolean }> = ({ showFooterNav }) => {
    const { newModal, closeModal } = useModal();
    const history = useHistory();
    const { initWallet } = useWallet();
    const { data: lcNetworkProfile } = useGetProfile();
    const { presentToast } = useToast();
    const { familyCredential } = useGetFamilyCredential();
    const { data: familyList } = useGetCredentialList(CredentialCategoryEnum.family);
    const familyUri = (familyList?.pages?.[0]?.records?.[0]?.uri as string) || undefined;

    const [role, setRole] = useState<LearnCardRolesEnum | null>(null);

    useEffect(() => {
        if (lcNetworkProfile?.role) {
            setRole(lcNetworkProfile.role as LearnCardRolesEnum);
        } else if (role === null) {
            setRole(LearnCardRolesEnum.learner);
        }
    }, [lcNetworkProfile?.role]);

    const roleLabel = LearnCardRoles.find(r => r.type === role)?.title ?? 'Learner';

    const RoleActions: Record<LearnCardRolesEnum, string[]> = {
        [LearnCardRolesEnum.learner]: [
            'Build My LearnCard',
            'Understand My Skills',
            'Personalize AI Sessions',
            'Start AI Tutoring Session',
            'Share Insights with Teacher',
            // 'Claim Credential',
        ],
        [LearnCardRolesEnum.teacher]: [
            'View Learner Insights',
            'Request Learner Insights',
            'Issue Learner Credential',
            'Create Credential',
            'Manage Skills Frameworks',
        ],
        [LearnCardRolesEnum.guardian]: [
            'Create Family',
            'Add Child',
            'Switch Child',
            'Boost Child',
            'View Child Insights',
        ],
        [LearnCardRolesEnum.developer]: [
            'Create API Token',
            'Create Signing Authority',
            'Create ConsentFlow',
            'Switch Network',
            'Manage Skills Frameworks',
            'Read Docs',
        ],
        [LearnCardRolesEnum.admin]: [
            'Manage Skills Frameworks',
            'Import Credentials',
            'Create Organization',
            'Switch Account',
            'Create Credential',
        ],
        [LearnCardRolesEnum.counselor]: [
            'Manage Skills Frameworks',
            'Import Credentials',
            'Create Organization',
            'Switch Account',
            'Create Credential',
        ],
    };

    let actions = RoleActions[(role ?? LearnCardRolesEnum.learner) as LearnCardRolesEnum] ?? [];
    if (role === LearnCardRolesEnum.guardian) {
        if (familyCredential) {
            actions = ['View Family', ...actions.filter(a => a !== 'Create Family')];
        } else {
            actions = actions.filter(a => a !== 'View Family');
        }
    }
    const bgColors = [
        'bg-[#7DE3F6]',
        'bg-[#6E8BFF]',
        'bg-[#B8F36B]',
        'bg-[#69D7AE]',
        'bg-[#F7D54D]',
        'bg-[#FFD1E5]',
    ];

    return (
        <div className="relative w-full h-full flex flex-col items-stretch p-4 gap-3 max-w-[380px]">
            <button
                type="button"
                aria-label="Close modal"
                onClick={closeModal}
                className="self-end mt-[8px] h-[20px] w-[40px] rounded-full bg-transparent text-[#2A2F55] flex items-center justify-center"
            >
                <X className="w-[20px] h-[20px]" />
            </button>
            <div className="rounded-[15px] bg-white shadow-[0_2px_6px_0_rgba(0,0,0,0.25)] px-[10px] py-[15px]">
                <div className="w-full flex items-center justify-center">
                    <ProfilePicture
                        customContainerClass="flex justify-center items-center h-[48px] w-[48px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-xl min-w-[48px] min-h-[48px]"
                        customImageClass="flex justify-center items-center h-[48px] w-[48px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[48px] min-h-[48px]"
                        customSize={120}
                    />
                </div>

                <div className="w-full flex items-center justify-center">
                    <button
                        type="button"
                        onClick={() =>
                            newModal(
                                <LaunchPadRoleSelector
                                    role={role}
                                    setRole={newRole => {
                                        setRole(newRole);
                                        (async () => {
                                            try {
                                                const wallet = await initWallet();
                                                await wallet?.invoke?.updateProfile({
                                                    role: newRole,
                                                });
                                                presentToast('Role updated', {
                                                    type: ToastTypeEnum.Success,
                                                    hasDismissButton: true,
                                                });
                                            } catch (e) {
                                                presentToast('Unable to update role', {
                                                    type: ToastTypeEnum.Error,
                                                    hasDismissButton: true,
                                                });
                                            }
                                        })();
                                    }}
                                />,
                                {
                                    sectionClassName:
                                        '!max-w-[600px] !mx-auto !max-h-[100%] disable-scrollbars',
                                },
                                { mobile: ModalTypes.Freeform, desktop: ModalTypes.Freeform }
                            )
                        }
                        className="px-[20px] py-4px] rounded-full border border-solid border-[#E2E3E9] bg-grayscale-white text-grayscale-700 text-sm font-poppins font-semibold"
                    >
                        <span className="flex items-center justify-center">
                            {roleLabel} <CaretDown className="ml-[5px]" />
                        </span>
                    </button>
                </div>

                <h3 className="text-center text-[22px] font-poppins font-semibold text-grayscale-900 mt-[12px]">
                    What would you like to do?
                </h3>
            </div>

            <div className="mt-1 flex flex-col gap-3">
                {actions.map((label, i) => (
                    <ActionButton
                        key={`${label}-${i}`}
                        label={label}
                        bg={bgColors[i % bgColors.length]}
                        onClick={
                            label === 'View Family' && familyUri
                                ? () => {
                                      closeModal();
                                      newModal(
                                          <FamilyBoostPreviewWrapper uri={familyUri} />,
                                          {},
                                          {
                                              desktop: ModalTypes.FullScreen,
                                              mobile: ModalTypes.FullScreen,
                                          }
                                      );
                                      history.push('/families');
                                  }
                                : undefined
                        }
                    />
                ))}
            </div>
            {showFooterNav && (
                <div className="mt-1 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            history.push('/passport');
                            closeModal();
                        }}
                        className="w-full bg-white text-grayscale-900 rounded-[15px] border border-solid border-[#E2E3E9] py-3 shadow-[0_2px_6px_0_rgba(0,0,0,0.15)] flex items-center justify-center gap-2"
                    >
                        <PassportIcon className="w-[26px] h-[26px]" />
                        <span className="text-base font-poppins font-semibold">Passport</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (history.location.pathname === '/launchpad') {
                                closeModal();
                            } else {
                                history.push('/launchpad');
                                closeModal();
                            }
                        }}
                        className="w-full bg-white text-grayscale-900 rounded-[15px] border border-solid border-[#E2E3E9] py-3 shadow-[0_2px_6px_0_rgba(0,0,0,0.15)] flex items-center justify-center gap-2"
                    >
                        <Rocket className="w-[26px] h-[26px]" />
                        <span className="text-base font-poppins font-semibold">Launchpad</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default LaunchPadActionModal;
