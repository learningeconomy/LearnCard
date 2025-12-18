import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { ModalTypes, useModal, QRCodeScannerStore } from 'learn-card-base';
import { ProfilePicture } from 'learn-card-base';
import CheckListContainer from 'apps/learn-card-app/src/components/learncard/checklist/CheckListContainer';
import AiPassportPersonalizationContainer from 'apps/learn-card-app/src/components/ai-passport/AiPassportPersonalizationContainer';
import SolidCircleIcon from 'learn-card-base/svgs/SolidCircleIcon';
import AISessionsQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/AISessionsQuickNav';
import BoostsQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/BoostsQuickNav';
import CredentialQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/CredentialQuickNav';
import ClaimCredentialQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/ClaimCredentialQuickNav';
import UnicornIcon from 'learn-card-base/svgs/UnicornIcon';
import ResumeQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/ResumeQuickNav';
import CaretDown from 'learn-card-base/svgs/CaretDown';
import StudiesQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/StudiesQuickNav';
import ShareInsightsQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/ShareInsightsQuickNav';
import UnderstandSkillsQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/UnderstandSkillsQuickNav';
import X from 'learn-card-base/svgs/X';
import FamiliesQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/FamiliesQuickNav';
import RequestInsightsQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/RequestInsightsQuickNav';
import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';
import AddUserQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/AddUserQuickNav';
import ImportCredentialQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/ImportCredentialQuickNav';
import SwitchAccountQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/SwitchAccountQuickNav';
import CreateApiTokenQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/CreateApiTokenQuickNav';
import CreateSigningAuthorityQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/CreateSigningAuthorityQuickNav';
import CreateConsentFlowQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/CreateConsentFlowQuickNav';
import SwitchNetworksQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/SwitchNetworksQuickNav';
import ReadDocsQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/ReadDocsQuickNav';
import AddChildQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/AddChildQuickNav';
import SwitchChildQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/SwitchChildQuickNav';
import NavBarPassportIcon from 'apps/learn-card-app/src/components/svgs/NavBarPassportIcon';
import NavBarLaunchPadIcon from 'apps/learn-card-app/src/components/svgs/NavBarLaunchPadIcon';
import LaunchPadRoleSelector from './LaunchPadRoleSelector';
import IssueManagedBoostSelector from './IssueManagedBoostSelector';
import { AiInsightsTabsEnum } from '../../ai-insights/ai-insight-tabs/ai-insights-tabs.helpers';
import { RequestInsightsModal } from '../../ai-insights/request-insights/RequestInsightsModal';
import ShareInsightsModal from '../../ai-insights/share-insights/ShareInsightsModal';
import { createTeacherStudentContract } from '../../ai-insights/request-insights/request-insights.helpers';
import { createAiInsightsService } from '../../ai-insights/learner-insights/learner-insights.helpers';
import LearnerIcon from '../../../assets/images/quicknavroles/learnergradcapicon.png';
import GuardianIcon from '../../../assets/images/quicknavroles/guardianhomeicon.png';
import TeacherIcon from '../../../assets/images/quicknavroles/teacherappleicon.png';
import AdminIcon from '../../../assets/images/quicknavroles/adminshieldicon.png';
import DeveloperIcon from '../../../assets/images/quicknavroles/developeralienicon.png';
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
    useGetCurrentLCNUser,
    useToast,
    ToastTypeEnum,
    BoostCategoryOptionsEnum,
    BoostUserTypeEnum,
    useGetContracts,
    useGetCredentialList,
    CredentialCategoryEnum,
    switchedProfileStore,
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
        case 'Create Family':
        case 'View Family':
            return <FamiliesQuickNav className="w-[50px] h-auto" />;
        case 'Add Child':
            return <AddChildQuickNav className="w-[50px] h-auto" />;
        case 'Switch Child':
            return <SwitchChildQuickNav className="w-[50px] h-auto" />;
        case 'Customize AI Sessions':
            return <UnicornIcon className="w-[50px] h-auto" />;
        case 'Understand My Skills':
            return <UnderstandSkillsQuickNav className="w-[50px] h-auto" />;
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
        case 'New AI Tutoring Session':
            return <AISessionsQuickNav className="w-[50px] h-auto" />;
        case 'Claim Credential':
            return <ClaimCredentialQuickNav className="w-[50px] h-auto" />;
        case 'Create Credential':
        case 'Issue Credential':
            return <CredentialQuickNav className="w-[50px] h-auto" />;
        case 'Manage Skills Frameworks':
            return <StudiesQuickNav className="w-[50px] h-auto" />;
        case 'Edit Skills Frameworks':
            return <SkillsIconWithShape className="w-[50px] h-auto" />;
        case 'Import Credential':
        case 'Import Credentials':
            return <ImportCredentialQuickNav className="w-[50px] h-auto" />;
        case 'Create Organization':
            return <AddUserQuickNav className="w-[50px] h-auto" />;
        case 'Switch Account':
            return <SwitchAccountQuickNav className="w-[50px] h-auto" />;
        case 'Share Insights with Teacher':
            return <ShareInsightsQuickNav className="w-[50px] h-auto" />;
        case 'View Child Insights':
            return <ShareInsightsQuickNav className="w-[50px] h-auto" />;
        case 'View Learner Insights':
            return <ShareInsightsQuickNav className="w-[50px] h-auto" />;
        case 'Request Learner Insights':
            return <RequestInsightsQuickNav className="w-[50px] h-auto" />;
        case 'Boost Child':
            return <BoostsQuickNav className="w-[50px] h-auto" />;
        case 'Create API Token':
            return <CreateApiTokenQuickNav className="w-[50px] h-auto" />;
        case 'Create Signing Authority':
            return <CreateSigningAuthorityQuickNav className="w-[50px] h-auto" />;
        case 'Create ConsentFlow':
            return <CreateConsentFlowQuickNav className="w-[50px] h-auto" />;
        case 'Switch Network':
            return <SwitchNetworksQuickNav className="w-[50px] h-auto" />;
        case 'Read Docs':
            return <ReadDocsQuickNav className="w-[50px] h-auto" />;
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
            case 'Issue Credential':
                closeModal();
                newModal(
                    <IssueManagedBoostSelector />,
                    { hideButton: true, sectionClassName: '!max-w-[500px]' },
                    { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
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
            case 'Customize AI Sessions':
                closeModal();
                newModal(
                    <AiPassportPersonalizationContainer />,
                    { className: '!bg-transparent' },
                    { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                );
                return;
            case 'New AI Tutoring Session':
                history.push('/ai/topics');
                closeModal();
                return;
            case 'Claim Credential':
                closeModal();
                QRCodeScannerStore.set.showScanner(true);
                return;
            case 'Share Insights with Teacher':
                closeModal();
                newModal(
                    <ShareInsightsModal />,
                    {},
                    { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                );
                return;
            default:
                return;
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`${bg} w-full text-left flex px-5 py-4  text-[18px] font-poppins font-semibold text-grayscale-900 rounded-[20px] border border-solid border-[3px] border-white shadow-[0_2px_6px_0_rgba(0,0,0,0.25)]`}
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
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { data: contractsData, refetch: refetchContracts } = useGetContracts();
    const { presentToast } = useToast();
    const { familyCredential } = useGetFamilyCredential();
    const { data: familyList } = useGetCredentialList(CredentialCategoryEnum.family);
    const familyUri = (familyList?.pages?.[0]?.records?.[0]?.uri as string) || undefined;

    type ConsentFlowContractLike = { name?: string; uri?: string };

    const contracts: ConsentFlowContractLike[] | undefined = Array.isArray(contractsData)
        ? (contractsData as ConsentFlowContractLike[])
        : (contractsData as { records?: ConsentFlowContractLike[] } | undefined)?.records;

    const [role, setRole] = useState<LearnCardRolesEnum | null>(null);
    const [optimisticRole, setOptimisticRole] = useState<LearnCardRolesEnum | null>(null);

    useEffect(() => {
        if (lcNetworkProfile?.role && optimisticRole === lcNetworkProfile.role) {
            setOptimisticRole(null);
            return;
        }
        if (optimisticRole) return;
        if (lcNetworkProfile?.role) {
            setRole(lcNetworkProfile.role as LearnCardRolesEnum);
        } else if (role === null) {
            setRole(LearnCardRolesEnum.learner);
        }
    }, [lcNetworkProfile?.role, optimisticRole]);

    const profileType = switchedProfileStore.use.profileType();
    const isChildProfile = profileType === 'child';

    const activeRole = (
        isChildProfile ? LearnCardRolesEnum.learner : role ?? LearnCardRolesEnum.learner
    ) as LearnCardRolesEnum;
    const roleLabel = LearnCardRoles.find(r => r.type === activeRole)?.title ?? 'Learner';
    const roleIcons: Record<LearnCardRolesEnum, string> = {
        [LearnCardRolesEnum.learner]: LearnerIcon,
        [LearnCardRolesEnum.guardian]: GuardianIcon,
        [LearnCardRolesEnum.teacher]: TeacherIcon,
        [LearnCardRolesEnum.admin]: AdminIcon,
        [LearnCardRolesEnum.counselor]: TeacherIcon,
        [LearnCardRolesEnum.developer]: DeveloperIcon,
    };
    const iconBgColors: Record<LearnCardRolesEnum, string> = {
        [LearnCardRolesEnum.learner]: 'var(--teal-200, #99F6E4)',
        [LearnCardRolesEnum.guardian]: 'var(--ion-color-violet-200)',
        [LearnCardRolesEnum.teacher]: 'var(--ion-color-amber-100)',
        [LearnCardRolesEnum.admin]: 'var(--ion-color-cyan-100)',
        [LearnCardRolesEnum.counselor]: 'var(--ion-color-violet-200)',
        [LearnCardRolesEnum.developer]: 'var(--lime-300, #BEF264)',
    };
    const roleIconSrc = roleIcons[activeRole];
    const roleIconBgStyle: React.CSSProperties = { backgroundColor: iconBgColors[activeRole] };

    const RoleActions: Record<LearnCardRolesEnum, string[]> = {
        [LearnCardRolesEnum.learner]: [
            'New AI Tutoring Session',
            'Understand My Skills',
            'Customize AI Sessions',
            'Share Insights with Teacher',
            'Build My LearnCard',
        ],
        [LearnCardRolesEnum.teacher]: [
            'View Learner Insights',
            'Request Learner Insights',
            'Issue Credential',
            'Create Credential',
            'Edit Skills Frameworks',
        ],
        [LearnCardRolesEnum.guardian]: [
            'Create Family',
            'Boost Child',
            'Add Child',
            'Switch Child',
            'View Child Insights',
        ],
        [LearnCardRolesEnum.developer]: [
            'Create API Token',
            'Create Signing Authority',
            'Create ConsentFlow',
            'Switch Network',
            'Read Docs',
        ],
        [LearnCardRolesEnum.admin]: [
            'Edit Skills Frameworks',
            'Import Credentials',
            'Create Organization',
            'Create Credential',
            'Switch Account',
        ],
        [LearnCardRolesEnum.counselor]: [
            'Manage Skills Frameworks',
            'Import Credentials',
            'Create Organization',
            'Switch Account',
            'Create Credential',
        ],
    };

    let actions = RoleActions[activeRole] ?? [];
    if (activeRole === LearnCardRolesEnum.guardian) {
        if (familyCredential) {
            actions = ['View Family', ...actions.filter(a => a !== 'Create Family')];
        } else {
            actions = actions.filter(a => a !== 'View Family');
        }
    }

    if (!Capacitor.isNativePlatform()) {
        actions = actions.map(a => (a === 'Claim Credential' ? 'Customize AI Sessions' : a));
    }

    const bgColors = [
        'bg-[#7DE3F6]',
        'bg-[#6E8BFF]',
        'bg-[#B8F36B]',
        'bg-[#69D7AE]',
        'bg-[#F7D54D]',
        'bg-[#FFD1E5]',
    ];

    const colorByLabel: Record<string, string> = {
        'Customize AI Sessions': 'bg-[var(--ion-color-amber-300)]',
        'New AI Tutoring Session': 'bg-[var(--ion-color-cyan-300)]',
        'Understand My Skills': 'bg-[var(--ion-color-violet-300)]',
        'Claim Credential': 'bg-[var(--ion-color-amber-300)]',
        'Share Insights with Teacher': 'bg-[var(--ion-color-lime-300)]',
        'Build My LearnCard': 'bg-[var(--ion-color-teal-200)]',
        // Guardian role labels
        'Create Family': 'bg-[var(--ion-color-spice-200)]',
        'View Family': 'bg-[var(--ion-color-spice-200)]',
        'Boost Child': 'bg-[var(--ion-color-blue-300)]',
        'Add Child': 'bg-[var(--ion-color-cyan-200)]',
        'Switch Child': 'bg-[var(--ion-color-yellow-300)]',
        'View Child Insights': 'bg-[var(--ion-color-lime-300)]',
        // Teacher role labels
        'View Learner Insights': 'bg-[var(--ion-color-lime-300)]',
        'Request Learner Insights': 'bg-[var(--ion-color-indigo-200)]',
        'Issue Credential': 'bg-[var(--ion-color-cyan-200)]',
        'Create Credential': 'bg-[var(--ion-color-amber-300)]',
        'Edit Skills Frameworks': 'bg-[var(--ion-color-violet-300)]',
        // Admin role labels
        'Import Credentials': 'bg-[var(--ion-color-blue-300)]',
        'Create Organization': 'bg-[var(--ion-color-lime-300)]',
        'Switch Account': 'bg-[var(--ion-color-cyan-200)]',
        // Developer role labels
        'Create API Token': 'bg-[var(--ion-color-violet-300)]',
        'Create Signing Authority': 'bg-[var(--ion-color-blue-200)]',
        'Create ConsentFlow': 'bg-[var(--ion-color-lime-300)]',
        'Switch Network': 'bg-[var(--ion-color-yellow-300)]',
        'Read Docs': 'bg-[var(--ion-color-teal-200)]',
    };

    const handleViewChildInsights = () => {
        history.push(`/ai/insights?tab=${AiInsightsTabsEnum.ChildInsights}`);
        closeModal();
    };

    const handleEditSkillsFrameworks = () => {
        history.push('/skills?tab=admin-panel');
        closeModal();
    };

    const handleViewLearnerInsights = () => {
        history.push(`/ai/insights?tab=${AiInsightsTabsEnum.LearnerInsights}`);
        closeModal();
    };

    const handleRequestLearnerInsights = async () => {
        try {
            const wallet = await initWallet();

            if (!wallet || !currentLCNUser) {
                presentToast('Unable to open Request Insights', {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
                return;
            }

            const existingTeacherContract = contracts?.find(
                contract => contract.name === 'AI Insights'
            );

            let contractUri = existingTeacherContract?.uri;

            if (!contractUri) {
                contractUri = await createTeacherStudentContract({
                    teacherProfile: currentLCNUser,
                });
                refetchContracts?.();
            }

            await createAiInsightsService(
                wallet,
                contractUri,
                currentLCNUser.profileId!,
                currentLCNUser.did!
            );

            closeModal();
            newModal(
                <RequestInsightsModal contractUri={contractUri} />,
                {},
                {
                    desktop: ModalTypes.FullScreen,
                    mobile: ModalTypes.FullScreen,
                }
            );
        } catch (e) {
            presentToast('Unable to open Request Insights', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

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
                        disabled={isChildProfile}
                        onClick={
                            isChildProfile
                                ? undefined
                                : () =>
                                      newModal(
                                          <LaunchPadRoleSelector
                                              role={role}
                                              setRole={newRole => {
                                                  setRole(newRole);
                                                  setOptimisticRole(newRole);
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
                                                          setOptimisticRole(null);
                                                          setRole(
                                                              (lcNetworkProfile?.role as LearnCardRolesEnum) ??
                                                                  LearnCardRolesEnum.learner
                                                          );
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
                                                  '!max-w-[600px] !mx-auto !max-h-[100%]',
                                          },
                                          {
                                              mobile: ModalTypes.Freeform,
                                              desktop: ModalTypes.Freeform,
                                          }
                                      )
                        }
                        className="rounded-[10px] border border-solid border-[#E2E3E9] bg-grayscale-white text-grayscale-700 text-sm font-poppins font-semibold"
                    >
                        <span className="p-[3px] flex items-center justify-center gap-2">
                            <span
                                className="flex items-center justify-center h-[22px] w-[22px] rounded-full"
                                style={roleIconBgStyle}
                            >
                                <img
                                    src={roleIconSrc}
                                    alt={`${roleLabel} icon`}
                                    className="h-[20px] w-[20px] object-contain"
                                />
                            </span>
                            <span>{roleLabel}</span>
                            {!isChildProfile && <CaretDown className="ml-[5px]" />}
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
                        bg={colorByLabel[label] ?? bgColors[i % bgColors.length]}
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
                                : label === 'View Learner Insights'
                                ? handleViewLearnerInsights
                                : label === 'View Child Insights'
                                ? handleViewChildInsights
                                : label === 'Edit Skills Frameworks'
                                ? handleEditSkillsFrameworks
                                : label === 'Request Learner Insights'
                                ? () => void handleRequestLearnerInsights()
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
                        <NavBarPassportIcon
                            version="2"
                            className="w-[26px] h-[26px] min-w-[26px] min-h-[26px]"
                        />
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
                        <NavBarLaunchPadIcon
                            version="2"
                            className="w-[26px] h-[26px] min-w-[26px] min-h-[26px]"
                        />
                        <span className="text-base font-poppins font-semibold">Launchpad</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default LaunchPadActionModal;
