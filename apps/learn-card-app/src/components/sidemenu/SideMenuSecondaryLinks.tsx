import React from 'react';
import { Link } from 'react-router-dom';
import { useFlags } from 'launchdarkly-react-client-sdk';

import CustomSpinner from '../svgs/CustomSpinner';
import { IonMenuToggle, IonList } from '@ionic/react';

import {
    CredentialCategoryEnum,
    useGetCredentialList,
    walletStore,
    WalletSyncState,
} from 'learn-card-base';

import { chatBotStore } from '../../stores/chatBotStore';

import { useTheme } from '../../theme/hooks/useTheme';
import { IconSetEnum } from '../../theme/icons/index';
import { ColorSetEnum } from '../../theme/colors/index';

const SideMenuSecondaryLinks: React.FC<{
    activeTab: string;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}> = ({ activeTab, setActiveTab }) => {
    const { theme, getIconSet, getColorSet } = useTheme();
    const iconSet = getIconSet(IconSetEnum.sideMenu);
    const colors = getColorSet(ColorSetEnum.sideMenu);

    const flags = useFlags();
    const isWalletSyncing = walletStore.useTracked.syncState();

    const { data: records } = useGetCredentialList(CredentialCategoryEnum.family);
    const hasFamilyID = records?.pages?.[0]?.records?.length > 0 ?? false;

    const canCreateFamilies = hasFamilyID || flags?.canCreateFamilies;
    const showAiInsights = flags?.showAiInsights;
    const hideAiPathways = flags?.hideAiPathways;

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

    const isSyncing = isWalletSyncing.status === WalletSyncState.Syncing;
    const isCompleted = isWalletSyncing.status === WalletSyncState.Completed;

    let walletText = 'Passport';
    if (isSyncing || isCompleted) walletText = isWalletSyncing?.text ?? 'Passport';

    let walletTextStyles = '';
    if (isSyncing) walletTextStyles = `${colors.syncingColor}`;
    if (isCompleted) walletTextStyles = `${colors.completedColor}`;

    const sideMenuLinks = theme?.sideMenuSecondaryLinks;

    const secondaryLinks = sideMenuLinks?.map(link => {
        if (link?.path === '/families' && !canCreateFamilies)
            return <React.Fragment key={link.path}></React.Fragment>;

        if (link?.path === '/ai/topics' && !flags?.enableLaunchPadUpdates)
            return <React.Fragment key={link.path}></React.Fragment>;

        if (link?.path === '/ai/insights' && !showAiInsights)
            return <React.Fragment key={link.path}></React.Fragment>;

        if (link?.path === '/ai/pathways' && hideAiPathways) {
            return <React.Fragment key={link.path}></React.Fragment>;
        }

        const IconComponent = iconSet[link.id as keyof typeof iconSet];

        const linkPath = link.path;
        const isWalletPath = linkPath === '/passport';

        const iconStyles = getIconStyles(linkPath);
        const textStyles = getTextStyles(linkPath);
        const linkBackgroundStyles = getLinkBackgroundStyles(linkPath);

        let linkEl = (
            <Link
                to={linkPath}
                className={`learn-card-side-menu-secondary-list-item-link ${linkBackgroundStyles} ${textStyles}`}
            >
                <IconComponent className={`${iconStyles}`} shadeColor={shadeColor} /> {link.label}
            </Link>
        );

        if (isWalletPath) {
            linkEl = (
                <Link
                    to={link.path}
                    className={`learn-card-side-menu-secondary-list-item-link ${linkBackgroundStyles} ${textStyles} ${walletTextStyles}`}
                >
                    {(isSyncing || isCompleted) && (
                        <div
                            className={`flex items-center justify-center absolute top-[12px] z-50 h-[28px] w-[28px] rounded-[10px]`}
                        >
                            {isSyncing && (
                                <CustomSpinner
                                    className={`${colors?.syncingColor} h-[18px] w-[18px]`}
                                />
                            )}
                        </div>
                    )}
                    <IconComponent
                        className={`${iconStyles}`}
                        shadeColor={shadeColor}
                        isCompleted={isCompleted}
                        isSyncing={isSyncing}
                    />{' '}
                    {walletText}
                </Link>
            );
        }

        return (
            <IonMenuToggle key={link.path} autoHide={false} className="relative w-full">
                <li
                    onClick={() => {
                        if (link.path === '/ai/topics') chatBotStore.set.resetStore();
                        setActiveTab(link.path);
                    }}
                    className="flex items-center justify-center px-2 py-0"
                >
                    {linkEl}
                </li>
                {isWalletPath && !isPathActive(link.path) && (
                    <div className="relative w-full flex items-center justify-center pb-2">
                        <div className="bottom-0 h-[1px] bg-gray-200 w-[90%]" />
                    </div>
                )}
            </IonMenuToggle>
        );
    });

    return <IonList className="m-4 rounded-2xl h-auto pt-4 pb-4">{secondaryLinks}</IonList>;
};

export default SideMenuSecondaryLinks;
