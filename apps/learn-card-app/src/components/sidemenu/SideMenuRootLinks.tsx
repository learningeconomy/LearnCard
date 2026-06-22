import React from 'react';
import { useQuery } from '@tanstack/react-query';
import numeral from 'numeral';
import PreloadingLink from '../generic/PreloadingLink';

import { useFlags } from 'launchdarkly-react-client-sdk';
import {
    currentUserStore,
    ToastTypeEnum,
    useAiFeatureGate,
    useGetCurrentLCNUser,
    useGetUnreadUserNotifications,
    useToast,
} from 'learn-card-base';

import { IonMenuToggle, IonList } from '@ionic/react';
import AiPassportPersonalizationContainer from '../ai-passport/AiPassportPersonalizationContainer';

import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { useModal, ModalTypes } from 'learn-card-base';

import { useTheme } from '../../theme/hooks/useTheme';
import { IconSetEnum } from '../../theme/icons/index';
import { ColorSetEnum } from '../../theme/colors/index';
import {
    fetchLearnCardAssistantProfile,
    getInitialAgentUrl,
    normalizeAgentUrl,
} from '../../pages/my-assistant/learnCardAssistant.api';
import { useDashboardAsHome } from '../../pages/dashboard/hooks/useDashboardAsHome';

type SideMenuRootLinksProps = {
    activeTab: string;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    branding: BrandingEnum;
};

const SideMenuRootLinks: React.FC<SideMenuRootLinksProps> = ({ activeTab, setActiveTab }) => {
    const { theme, getIconSet, getColorSet } = useTheme();
    const iconSet = getIconSet(IconSetEnum.sideMenu);
    const colors = getColorSet(ColorSetEnum.sideMenu);

    const flags = useFlags();
    const parentLDFlags = currentUserStore.use.parentLDFlags();
    const hasAdminAccess = flags.enableAdminTools || parentLDFlags?.enableAdminTools;
    const learnCardAssistantEnabled =
        import.meta.env.DEV || Boolean(flags.enableLearnCardAssistant);
    const { isAiEnabled, reason } = useAiFeatureGate();
    const { presentToast } = useToast();
    // Same two-layer gate as the `/` landing redirect in Routes.tsx, so the
    // Dashboard nav entry and the home route can never drift.
    const dashboardAsHome = useDashboardAsHome();

    const { newModal } = useModal();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const currentDid = currentLCNUser?.did;
    const normalizedAgentUrl = React.useMemo(() => normalizeAgentUrl(getInitialAgentUrl()), []);
    const { data: assistantProfile } = useQuery({
        queryKey: ['learncard-assistant-profile', currentDid, normalizedAgentUrl],
        queryFn: () => fetchLearnCardAssistantProfile(normalizedAgentUrl, currentDid!),
        enabled: learnCardAssistantEnabled && Boolean(currentDid),
        staleTime: 60_000,
    });
    const assistantLabel = assistantProfile?.name ?? 'My Assistant';

    const handlePersonalizeMyAi = () => {
        newModal(
            <AiPassportPersonalizationContainer />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const activeTextStyles = colors.linkActiveColor; // text colors
    const inactiveTextStyles = colors.linkInactiveColor;

    const activeIconStyles = colors.linkActiveColor; // icon colors
    const inactiveIconStyles = colors.linkInactiveColor;

    const activeLinkBackgroundStyles = colors.linkActiveBackgroundColor; // link background colors
    const inactiveLinkBackgroundStyles = colors.linkInactiveBackgroundColor;

    const shadeColor = '#E2E3E9'; // default shade color

    const isPathActive = (tab: string) => {
        const isAdminToolsActive = tab === '/admin-tools' && activeTab.startsWith(tab);

        if (tab === activeTab || isAdminToolsActive) return true;
        return false;
    };

    const getTextStyles = (path: string) => {
        if (isPathActive(path)) {
            return activeTextStyles;
        }
        return inactiveTextStyles;
    };

    const getIconStyles = (path: string) => {
        if (isPathActive(path)) {
            return activeIconStyles;
        }
        return inactiveIconStyles;
    };

    const getLinkBackgroundStyles = (path: string) => {
        if (isPathActive(path)) {
            return activeLinkBackgroundStyles;
        }
        return inactiveLinkBackgroundStyles;
    };

    const { data } = useGetUnreadUserNotifications();
    const notificationsUnreadCount = data?.notifications?.length ?? 0;

    const walletLink = theme?.sideMenuRootLinks;
    const unreadCount =
        Number(notificationsUnreadCount) >= 1000
            ? numeral(Number(notificationsUnreadCount)).format('0.0a')
            : notificationsUnreadCount;
    let rootLinks: any = null;

    rootLinks = walletLink?.map(link => {
        if (link.label === 'Admin Tools' && !hasAdminAccess) return null;
        if (link.path === '/ai/assistant' && !learnCardAssistantEnabled) return null;
        if (link.path === '/dashboard' && !dashboardAsHome) return null;

        const IconComponent = iconSet[link.id as keyof typeof iconSet];
        const linkPath = link.path;
        const linkLabel = linkPath === '/ai/assistant' ? assistantLabel : link.label;

        const iconStyles = getIconStyles(linkPath);
        const textStyles = getTextStyles(linkPath);
        const linkBackgroundStyles = getLinkBackgroundStyles(linkPath);

        const isGatedAssistantRoute = linkPath === '/ai/assistant' && !isAiEnabled;

        let linkEl = isGatedAssistantRoute ? (
            <button
                type="button"
                onClick={e => {
                    e.preventDefault();
                    const msg =
                        reason === 'disabled_minor'
                            ? 'AI features are not available for users under 18.'
                            : 'AI features are currently disabled. You can enable them in Privacy & Data from your profile.';
                    presentToast(msg, { type: ToastTypeEnum.Error });
                }}
                className={`learn-card-side-menu-secondary-list-item-link ${linkBackgroundStyles} ${textStyles} opacity-50`}
            >
                <IconComponent className={`${iconStyles}`} shadeColor={shadeColor} />
                {linkLabel}
            </button>
        ) : (
            <PreloadingLink
                to={linkPath}
                className={`learn-card-side-menu-secondary-list-item-link ${linkBackgroundStyles} ${textStyles}`}
            >
                <IconComponent className={`${iconStyles}`} shadeColor={shadeColor} />
                {linkLabel}
            </PreloadingLink>
        );

        if (link.label === 'Personalize') {
            linkEl = (
                <button
                    type="button"
                    onClick={() => handlePersonalizeMyAi()}
                    className={`cursor-pointer learn-card-side-menu-secondary-list-item-link ${linkBackgroundStyles} ${textStyles}`}
                >
                    <IconComponent className={`${iconStyles}`} shadeColor={shadeColor} />
                    {linkLabel}
                </button>
            );
        }

        if (linkPath === '/notifications') {
            linkEl = (
                <PreloadingLink
                    to={linkPath}
                    className={`learn-card-side-menu-secondary-list-item-link ${linkBackgroundStyles} ${textStyles}`}
                >
                    <div className={`flex relative mr-[10px] text-[14px] ${textStyles}`}>
                        <IconComponent
                            className={`h-[30px] w-[30px] ${iconStyles}`}
                            shadeColor={shadeColor}
                        />
                        {Number(unreadCount) >= 1 && (
                            <div
                                className={`absolute !right-[-5px] !top-[-8px] text-xs font-bold ${colors.indicatorColor}`}
                            >
                                {unreadCount}
                            </div>
                        )}
                    </div>

                    {link.label}
                </PreloadingLink>
            );
        }

        return (
            <IonMenuToggle key={link.id} autoHide={false} className="w-full">
                <div
                    onClick={() => setActiveTab(linkPath)}
                    className="flex items-center justify-center px-2 py-0"
                >
                    {linkEl}
                </div>
            </IonMenuToggle>
        );
    });

    return <IonList className="m-4 rounded-2xl py-3">{rootLinks}</IonList>;
};

export default SideMenuRootLinks;
