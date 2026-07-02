import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import { ModalTypes, useModal, QRCodeScannerStore, useAiFeatureGate } from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import CheckListContainer from '../../../components/learncard/checklist/CheckListContainer';
import AiPassportPersonalizationContainer from '../../../components/ai-passport/AiPassportPersonalizationContainer';
import SolidCircleIcon from 'learn-card-base/svgs/SolidCircleIcon';
import AISessionsQuickNav from '../../../components/svgs/quicknav/AISessionsQuickNav';
import BoostsQuickNav from '../../../components/svgs/quicknav/BoostsQuickNav';
import CredentialQuickNav from '../../../components/svgs/quicknav/CredentialQuickNav';
import ClaimCredentialQuickNav from '../../../components/svgs/quicknav/ClaimCredentialQuickNav';
import UnicornIcon from 'learn-card-base/svgs/UnicornIcon';
import ResumeQuickNav from '../../../components/svgs/quicknav/ResumeQuickNav';
import CaretDown from 'learn-card-base/svgs/CaretDown';
import StudiesQuickNav from '../../../components/svgs/quicknav/StudiesQuickNav';
import ShareInsightsQuickNav from '../../../components/svgs/quicknav/ShareInsightsQuickNav';
import UnderstandSkillsQuickNav from '../../../components/svgs/quicknav/UnderstandSkillsQuickNav';
import X from 'learn-card-base/svgs/X';
import FamiliesQuickNav from '../../../components/svgs/quicknav/FamiliesQuickNav';
import RequestInsightsQuickNav from '../../../components/svgs/quicknav/RequestInsightsQuickNav';
import AddToLearnCardQuickNav from '../../../components/svgs/quicknav/AddToLearnCardQuickNav';
import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';
import AddUserQuickNav from '../../../components/svgs/quicknav/AddUserQuickNav';
import ImportCredentialQuickNav from '../../../components/svgs/quicknav/ImportCredentialQuickNav';
import SwitchAccountQuickNav from '../../../components/svgs/quicknav/SwitchAccountQuickNav';
import CreateApiTokenQuickNav from '../../../components/svgs/quicknav/CreateApiTokenQuickNav';
import CreateSigningAuthorityQuickNav from '../../../components/svgs/quicknav/CreateSigningAuthorityQuickNav';
import CreateConsentFlowQuickNav from '../../../components/svgs/quicknav/CreateConsentFlowQuickNav';
import SwitchNetworksQuickNav from '../../../components/svgs/quicknav/SwitchNetworksQuickNav';
import ReadDocsQuickNav from '../../../components/svgs/quicknav/ReadDocsQuickNav';
import AddChildQuickNav from '../../../components/svgs/quicknav/AddChildQuickNav';
import SwitchChildQuickNav from '../../../components/svgs/quicknav/SwitchChildQuickNav';
import NavBarPassportIcon from '../../../components/svgs/NavBarPassportIcon';
import NavBarLaunchPadIcon from '../../../components/svgs/NavBarLaunchPadIcon';
import IssueManagedBoostSelector from './IssueManagedBoostSelector';
import { AiInsightsTabsEnum } from '../../ai-insights/ai-insight-tabs/ai-insights-tabs.helpers';
import { RequestInsightsModal } from '../../ai-insights/request-insights/RequestInsightsModal';
import ShareInsightsModal from '../../ai-insights/share-insights/ShareInsightsModal';
import { createTeacherStudentContract } from '../../ai-insights/request-insights/request-insights.helpers';
import { createAiInsightsService } from '../../ai-insights/learner-insights/learner-insights.helpers';
import {
    roleIcons,
    iconBgColors,
} from '../../../components/onboarding/onboardingRoles/OnboardingRoleItem';
import LaunchPadRoleSelector from './LaunchPadRoleSelector';
import { useTheme } from '../../../theme/hooks/useTheme';
import { IconSetEnum } from '../../../theme/icons/index';
import AccountSwitcherModal from '../../../components/learncard/AccountSwitcherModal';
import { SwitcherStepEnum } from '../../../components/learncard/switcher.helpers';
import FamilyBoostPreviewWrapper from '../../../components/familyCMS/FamilyBoostPreview/FamilyBoostPreviewWrapper';
import useGetFamilyCredential from '../../../hooks/useGetFamilyCredential';
import AdminToolsOptionsContainer from '../../adminToolsPage/AdminToolsModal/AdminToolsOptionsContainer';
import {
    adminToolOptions,
    AdminToolOptionsEnum,
    developerToolOptions,
} from '../../adminToolsPage/AdminToolsModal/admin-tools.helpers';
import AdminToolsCreateProfileSimple from '../../adminToolsPage/AdminToolsAccountSwitcher/AdminToolsCreateProfileSimple';
import useBoostModal from '../../../components/boost/hooks/useBoostModal';
import { openDeveloperDocs } from '../../../helpers/externalLinkHelpers';
import {
    LearnCardRolesEnum,
    LearnCardRoles,
} from '../../../components/onboarding/onboarding.helpers';
import { getRoleTitle } from '../../../components/onboarding/onboardingRoles/onboardingRolesI18n';
import { useAnalytics, AnalyticsEvents } from '@analytics';
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
    useDeviceTypeByWidth,
    getFirstName,
    useCurrentUser,
} from 'learn-card-base';
import { getGreetingAndEmoji } from './launchPadHeader.helpers';
import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import AddToLearnCardMenuWrapper from '../../../components/add-to-learncard-menu/AddToLearnCardMenuWrapper';
import AddToLearnCardMenu from '../../../components/add-to-learncard-menu/AddToLearnCardMenu';
import * as m from '../../../paraglide/messages.js';

// Translation map: internal ID → translated display label
const ACTION_LABELS: Record<string, () => string> = {
    'Add to LearnCard': () => m['launchpad.actions.addToLearnCard'](),
    'Build My LearnCard': () => m['launchpad.actions.buildMyLearnCard'](),
    'New AI Tutoring Session': () => m['launchpad.actions.newAiTutoringSession'](),
    'Understand My Skills': () => m['launchpad.actions.understandMySkills'](),
    'Customize AI Sessions': () => m['launchpad.actions.customizeAiSessions'](),
    'Share Insights with Teacher': () => m['launchpad.actions.shareInsightsWithTeacher'](),
    'View Learner Insights': () => m['launchpad.actions.viewLearnerInsights'](),
    'Request Learner Insights': () => m['launchpad.actions.requestLearnerInsights'](),
    'Issue Credential': () => m['launchpad.actions.issueCredential'](),
    'Create Credential': () => m['launchpad.actions.createCredential'](),
    'Edit Skills Frameworks': () => m['launchpad.actions.editSkillsFrameworks'](),
    'Manage Skills Frameworks': () => m['launchpad.actions.manageSkillsFrameworks'](),
    'Create Family': () => m['launchpad.actions.createFamily'](),
    'View Family': () => m['launchpad.actions.viewFamily'](),
    'Boost Child': () => m['launchpad.actions.boostChild'](),
    'Add Child': () => m['launchpad.actions.addChild'](),
    'Switch Child': () => m['launchpad.actions.switchChild'](),
    'View Child Insights': () => m['launchpad.actions.viewChildInsights'](),
    'Create API Token': () => m['launchpad.actions.createApiToken'](),
    'Create Signing Authority': () => m['launchpad.actions.createSigningAuthority'](),
    'Create ConsentFlow': () => m['launchpad.actions.createConsentFlow'](),
    'Switch Network': () => m['launchpad.actions.switchNetwork'](),
    'Read Docs': () => m['launchpad.actions.readDocs'](),
    'Import Credentials': () => m['launchpad.actions.importCredentials'](),
    'Create Organization': () => m['launchpad.actions.createOrganization'](),
    'Switch Account': () => m['launchpad.actions.switchAccount'](),
    'Claim Credential': () => m['launchpad.actions.claimCredential'](),
};

import { getLogger } from 'learn-card-base';
const log = getLogger('launch-pad-action-modal');

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
        case 'Add to LearnCard':
            return <AddToLearnCardQuickNav className="w-[50px] h-auto" />;
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
    bgHex?: string;
    textColor?: string;
    borderColor?: string;
    to?: string;
    onClick?: () => void;
    role?: string;
}> = ({ label, bg, bgHex, textColor, borderColor, to, onClick, role }) => {
    const history = useHistory();
    const { newModal, closeModal, closeAllModals } = useModal();
    const { handlePresentBoostModal } = useBoostModal(undefined, undefined, true, true);
    const { theme, getIconSet } = useTheme();
    const brandingConfig = useBrandingConfig();
    const buildMyLCIcon = theme?.defaults?.buildMyLCIcon;
    const sideMenuIcons = getIconSet(IconSetEnum.sideMenu);
    const AiInsightsIcon = sideMenuIcons[CredentialCategoryEnum.aiInsight];
    const { track } = useAnalytics();

    const handleClick = () => {
        track(AnalyticsEvents.LAUNCHPAD_QUICKNAV_ACTION_CLICKED, {
            action: label,
            role: role ?? 'unknown',
        });

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
            className={`${
                !bgHex ? bg : ''
            } w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.67rem)] h-[160px] flex flex-col items-center justify-center px-[13px] py-[10px] text-[16px] font-poppins font-semibold ${
                !textColor ? 'text-grayscale-900' : ''
            } rounded-[20px] text-center border-solid border-[3px] ${
                !borderColor ? 'border-white' : ''
            } shadow-[0_2px_6px_0_rgba(0,0,0,0.25)]`}
            style={{
                ...(bgHex ? { backgroundColor: bgHex } : {}),
                ...(textColor ? { color: textColor } : {}),
                ...(borderColor ? { borderColor } : {}),
            }}
        >
            <div className="flex flex-col items-center justify-center">
                <span className="mr-2 pb-[5px]">
                    {getIconForActionButton(label, { buildMyLCIcon, AiInsightsIcon })}
                </span>{' '}
                {label === 'Build My LearnCard'
                    ? `Build My ${brandingConfig.name}`
                    : ACTION_LABELS[label]?.() ?? label}
            </div>
        </button>
    );
};

const LaunchPadActionModal: React.FC<{ showFooterNav?: boolean }> = ({ showFooterNav }) => {
    const { newModal, closeModal } = useModal();
    const history = useHistory();
    const { initWallet } = useWallet();
    const { colors: themeColors } = useTheme();
    const actionModalButtonColors = themeColors?.defaults?.actionModalButtonColors;
    const actionModalTextColor = themeColors?.defaults?.actionModalTextColor;
    const actionModalCardBgColor = themeColors?.defaults?.actionModalCardBgColor;
    const actionModalCardTextColor = themeColors?.defaults?.actionModalCardTextColor;
    const actionModalButtonBorderColor = themeColors?.defaults?.actionModalButtonBorderColor;
    const { data: lcNetworkProfile, refetch: refetchProfile } = useGetProfile();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { data: contractsData, refetch: refetchContracts } = useGetContracts();
    const { presentToast } = useToast();
    const { familyCredential } = useGetFamilyCredential();
    const { data: familyList } = useGetCredentialList(CredentialCategoryEnum.family);
    const familyUri = (familyList?.pages?.[0]?.records?.[0]?.uri as string) || undefined;
    const { isDesktop } = useDeviceTypeByWidth();

    const currentUser = useCurrentUser();
    const currentHour = moment().hour();
    const { emoji, greeting } = getGreetingAndEmoji(currentHour);
    const name = getFirstName(currentUser?.name ?? '');

    type ConsentFlowContractLike = { name?: string; uri?: string };

    const contracts: ConsentFlowContractLike[] | undefined = Array.isArray(contractsData)
        ? (contractsData as ConsentFlowContractLike[])
        : (contractsData as { records?: ConsentFlowContractLike[] } | undefined)?.records;

    const [role, setRole] = useState<LearnCardRolesEnum | null>(null);
    const [optimisticRole, setOptimisticRole] = useState<LearnCardRolesEnum | null>(null);

    const handleRoleChange = async (newRole: LearnCardRolesEnum) => {
        setRole(newRole);
        setOptimisticRole(newRole);

        // The wallet write is the only step whose failure means the role did
        // NOT actually change. Roll back optimistic state + surface an error
        // toast only if THIS step throws — cache-refresh failures below
        // should not trigger a rollback (the server state already reflects
        // the new role at that point).
        try {
            const wallet = await initWallet();
            await wallet?.invoke?.updateProfile({
                role: newRole,
            });
        } catch (e) {
            setOptimisticRole(null);
            setRole((lcNetworkProfile?.role as LearnCardRolesEnum) ?? LearnCardRolesEnum.learner);
            presentToast(m['launchpad.modal.unableToUpdateRole'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            return;
        }

        // useGetProfile has a 5-minute staleTime and wallet.invoke.updateProfile
        // does not invalidate its cache — explicitly refetch so subsequent
        // mounts of LaunchPadActionModal see the new role (otherwise the
        // dropdown reverts to the stale cached value on next "+" open). If the
        // refetch itself fails (transient network blip, etc.) the role has
        // still been updated on the server — don't roll back, don't alarm the
        // user; the cache will re-sync on next reload or staleTime expiry.
        try {
            await refetchProfile();
        } catch (e) {
            log.error('Failed to refresh profile cache after role change', e);
        }

        const newRoleTitle = getRoleTitle(newRole);
        presentToast(m['launchpad.modal.nowRole']({ role: newRoleTitle }), {
            title: m['launchpad.modal.roleUpdated'](),
            type: ToastTypeEnum.Success,
            hasDismissButton: true,
            hasCheckmark: true,
            autoDismiss: false,
        });
    };

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
    const { isAiEnabled, isLoading: isAiFeatureLoading } = useAiFeatureGate();

    const activeRole = (
        isChildProfile ? LearnCardRolesEnum.learner : role ?? LearnCardRolesEnum.learner
    ) as LearnCardRolesEnum;

    const roleLabel = getRoleTitle(activeRole);
    const roleIconSrc = roleIcons[activeRole];
    const roleIconBgStyle: React.CSSProperties = { backgroundColor: iconBgColors[activeRole] };

    // Counselor is hidden from the role picker on the launchpad — OnboardingRoles
    // already filters it for the mobile bottom-sheet path, and we replicate that
    // here for the desktop Menu so both surfaces show the same five roles.
    const visibleRoles = LearnCardRoles.filter(r => r.type !== LearnCardRolesEnum.counselor);

    // Pill button contents shared between the desktop MenuButton and the mobile
    // trigger so the trigger looks identical across breakpoints.
    const rolePillContents = (
        <span className="p-[3px] pr-[8px] flex items-center justify-center gap-2">
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
            {!isChildProfile && <CaretDown className="ml-[2px]" />}
        </span>
    );
    const rolePillClassName = `rounded-[10px] border border-solid border-[#E2E3E9] bg-grayscale-white text-grayscale-700 text-sm font-poppins font-semibold ${
        isChildProfile ? 'cursor-not-allowed' : 'cursor-pointer'
    }`;

    const RoleActions: Record<LearnCardRolesEnum, string[]> = {
        [LearnCardRolesEnum.learner]: [
            'Add to LearnCard',
            'Build My LearnCard',
            'New AI Tutoring Session',
            'Understand My Skills',
            'Customize AI Sessions',
            'Share Insights with Teacher',
        ],
        [LearnCardRolesEnum.teacher]: [
            'Add to LearnCard',
            'View Learner Insights',
            'Request Learner Insights',
            'Issue Credential',
            'Create Credential',
            'Edit Skills Frameworks',
        ],
        [LearnCardRolesEnum.guardian]: [
            'Add to LearnCard',
            'Create Family',
            'Boost Child',
            'Add Child',
            'Switch Child',
            'View Child Insights',
        ],
        [LearnCardRolesEnum.developer]: [
            'Add to LearnCard',
            'Create API Token',
            'Create Signing Authority',
            'Create ConsentFlow',
            'Switch Network',
            'Read Docs',
        ],
        [LearnCardRolesEnum.admin]: [
            'Add to LearnCard',
            'Edit Skills Frameworks',
            'Import Credentials',
            'Create Organization',
            'Create Credential',
            'Switch Account',
        ],
        [LearnCardRolesEnum.counselor]: [
            'Add to LearnCard',
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
            actions = [
                'Add to LearnCard',
                'View Family',
                ...actions.filter(a => a !== 'Create Family' && a !== 'Add to LearnCard'),
            ];
        } else {
            actions = actions.filter(a => a !== 'View Family');
        }
    }

    if (!Capacitor.isNativePlatform()) {
        actions = actions.map(a => (a === 'Claim Credential' ? 'Customize AI Sessions' : a));
    }

    const AI_ACTIONS = [
        'New AI Tutoring Session',
        'Understand My Skills',
        'Customize AI Sessions',
        'View Learner Insights',
        'View Child Insights',
        'Request Learner Insights',
        'Share Insights with Teacher',
    ];

    if (!isAiEnabled) {
        actions = actions.filter(a => !AI_ACTIONS.includes(a));
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
        'Add to LearnCard': 'bg-[var(--ion-color-grayscale-100)]',
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
                presentToast(m['launchpad.modal.unableToOpenRequestInsights'](), {
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
            presentToast(m['launchpad.modal.unableToOpenRequestInsights'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleAddToLearnCard = () => {
        if (isDesktop) {
            newModal(
                <AddToLearnCardMenuWrapper />,
                {
                    sectionClassName: '!max-w-[500px] !bg-transparent !shadow-none',
                },
                { desktop: ModalTypes.Center }
            );
        } else {
            newModal(
                <AddToLearnCardMenu />,
                { sectionClassName: '!max-w-[500px]' },
                { mobile: ModalTypes.BottomSheet }
            );
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col items-stretch p-4 gap-3 max-w-[500px] mt-[20px]">
            <div
                className={`relative text-center rounded-[15px] shadow-[0_2px_6px_0_rgba(0,0,0,0.25)] p-[20px] ${
                    !actionModalCardBgColor ? 'bg-white' : ''
                }`}
                style={
                    actionModalCardBgColor ? { backgroundColor: actionModalCardBgColor } : undefined
                }
            >
                <button
                    type="button"
                    aria-label="Close modal"
                    onClick={closeModal}
                    className="absolute top-3 right-3 h-[30px] w-[30px] rounded-full bg-transparent flex items-center justify-center"
                    style={{ color: actionModalCardTextColor ?? '#2A2F55' }}
                >
                    <X className="w-[30px] h-[30px] text-grayscale-600" />
                </button>
                <p className="text-grayscale-700 font-normal text-[16px] font-poppins pt-[20px] pb-[12px]">
                    <span className="mr-2">{emoji}</span>
                    <span>
                        {greeting}
                        {name ? `, ${name}` : ''}
                    </span>
                </p>
                <div className="w-full flex items-center justify-center pb-[12px]">
                    {isChildProfile ? (
                        // Child profiles are pinned to Learner — render the pill
                        // as a non-interactive label.
                        <button type="button" disabled className={rolePillClassName}>
                            {rolePillContents}
                        </button>
                    ) : isDesktop ? (
                        // Desktop: inline HeadlessUI Menu — true dropdown UI.
                        <Menu as="div" className="relative inline-block">
                            <MenuButton className={rolePillClassName}>
                                {rolePillContents}
                            </MenuButton>
                            <MenuItems
                                anchor="bottom"
                                className="bg-white rounded-[15px] shadow-[0_2px_6px_0_rgba(0,0,0,0.25)] p-[8px] my-[6px] focus:outline-none z-[1000] min-w-[200px] flex flex-col gap-[4px]"
                            >
                                {visibleRoles.map(roleItem => {
                                    const isSelected = roleItem.type === activeRole;
                                    return (
                                        <MenuItem key={roleItem.id}>
                                            {({ focus }) => (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRoleChange(roleItem.type)}
                                                    className={`w-full flex items-center gap-2 p-[8px] rounded-[10px] font-poppins font-semibold text-[14px] text-grayscale-900 ${
                                                        focus ? 'bg-grayscale-100' : ''
                                                    }`}
                                                >
                                                    <span
                                                        className="flex items-center justify-center h-[22px] w-[22px] rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                iconBgColors[roleItem.type],
                                                        }}
                                                    >
                                                        <img
                                                            src={roleIcons[roleItem.type]}
                                                            alt={`${getRoleTitle(
                                                                roleItem.type
                                                            )} icon`}
                                                            className="h-[20px] w-[20px] object-contain"
                                                        />
                                                    </span>
                                                    <span className="flex-1 text-left">
                                                        {getRoleTitle(roleItem.type)}
                                                    </span>
                                                    {isSelected && (
                                                        <Checkmark className="w-[15px] h-[15px] text-[#2A2F55]" />
                                                    )}
                                                </button>
                                            )}
                                        </MenuItem>
                                    );
                                })}
                            </MenuItems>
                        </Menu>
                    ) : (
                        // Mobile/native: bottom-sheet modal, tap-to-pick.
                        <button
                            type="button"
                            onClick={() =>
                                newModal(
                                    <LaunchPadRoleSelector
                                        role={activeRole}
                                        setRole={handleRoleChange}
                                    />,
                                    {
                                        sectionClassName: '!max-w-[600px] !mx-auto !max-h-[100%]',
                                    },
                                    {
                                        mobile: ModalTypes.BottomSheet,
                                        desktop: ModalTypes.BottomSheet,
                                    }
                                )
                            }
                            className={rolePillClassName}
                        >
                            {rolePillContents}
                        </button>
                    )}
                </div>
                <h3
                    className={`text-[20px] font-poppins font-semibold ${
                        !actionModalCardTextColor ? 'text-grayscale-800' : ''
                    }`}
                    style={
                        actionModalCardTextColor ? { color: actionModalCardTextColor } : undefined
                    }
                >
                    {m['launchpad.modal.whatWouldYouLikeToDo']()}
                </h3>
            </div>

            <div className="mt-1 flex flex-wrap justify-center gap-4">
                {isAiFeatureLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                          <div
                              key={`skeleton-${i}`}
                              className="w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.67rem)] h-[160px] rounded-[20px] bg-grayscale-200 animate-pulse"
                          />
                      ))
                    : actions.map((label, i) => (
                          <ActionButton
                              key={`${label}-${i}`}
                              label={label}
                              bg={
                                  !actionModalButtonColors
                                      ? colorByLabel[label] ?? bgColors[i % bgColors.length]
                                      : ''
                              }
                              bgHex={
                                  actionModalButtonColors
                                      ? actionModalButtonColors[i % actionModalButtonColors.length]
                                      : undefined
                              }
                              textColor={actionModalTextColor}
                              borderColor={actionModalButtonBorderColor}
                              role={activeRole}
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
                                      : label === 'Add to LearnCard'
                                      ? handleAddToLearnCard
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
                        <span className="text-base font-poppins font-semibold">
                            {m['launchpad.passport']()}
                        </span>
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
                        <span className="text-base font-poppins font-semibold">
                            {m['launchpad.launchpad']()}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default LaunchPadActionModal;
