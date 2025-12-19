'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { categoryMetadata, usePathQuery } from 'learn-card-base';
import { IonContent, IonPage } from '@ionic/react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';
import { useLoadingLine } from '../../stores/loadingStore';
import { ErrorBoundaryFallback } from '../../components/boost/boostErrors/BoostErrorsDisplay';
import {
    EarnedAndManagedTabs,
    CredentialListTabEnum,
    CredentialCategoryEnum,
    useIsCurrentUserLCNUser,
    BrandingEnum,
    useGetCredentialList,
    BoostPageViewModeType,
    BoostPageViewMode,
    useGetPaginatedManagedBoosts,
    useGetCredentialCount,
    useCountBoosts,
    ModalTypes,
    useModal,
    useGetCurrentUserTroopIds,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';

import MainHeader from '../../components/main-header/MainHeader';
import BoostEarnedList from '../../components/boost/boost-earned-card/BoostEarnedList';
import BoostManagedList from '../../components/boost/boost-managed-card/BoostManagedList';
import NewBoostSelectMenu from '../../components/boost/boost-select-menu/NewBoostSelectMenu';
import EmptyMeritBadgeIcon from '../../assets/images/emptyMeritBadge.svg';
import Plus from '../../components/svgs/Plus';
import { SubheaderContentType } from '../../components/main-subheader/MainSubHeader.types';
import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import { WalletCategoryTypes } from 'learn-card-base/components/IssueVC/types';

const MeritBadgesPage: React.FC = () => {
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });
    const query = usePathQuery();
    const flags = useFlags();

    // User permissions
    const { data: myTroopIds } = useGetCurrentUserTroopIds();
    const { data: currentLCNUser } = useIsCurrentUserLCNUser();
    const canCreateMeritBadges = useMemo(
        () =>
            Boolean(
                myTroopIds?.isNationalAdmin ||
                    myTroopIds?.isScoutGlobalAdmin ||
                    myTroopIds?.isTroopLeader
            ),
        [myTroopIds]
    );

    // State management
    const initialTab = useMemo(
        () => (query.get('managed') ? CredentialListTabEnum.Managed : CredentialListTabEnum.Earned),
        [query]
    );
    const [activeTab, setActiveTab] = useState<CredentialListTabEnum>(initialTab);
    const [viewMode, setViewMode] = useState<BoostPageViewModeType>(BoostPageViewMode.Card);

    // Data fetching
    const credentialCategory = CredentialCategoryEnum.meritBadge;
    const { isLoading: credentialsLoading, isFetching: credentialsFetching } =
        useGetCredentialList(credentialCategory);
    const { isLoading: managedBoostsLoading, isFetching: managedBoostsFetching } =
        useGetPaginatedManagedBoosts(credentialCategory, { limit: 12 });
    const { data: credentialCount, isLoading: countLoading } =
        useGetCredentialCount(credentialCategory);
    const { data: managedBoostCount = 0 } = useCountBoosts(credentialCategory);

    // Derived values
    const credentialsBackgroundFetching = useMemo(
        () =>
            (credentialsFetching && !credentialsLoading) ||
            (managedBoostsFetching && !managedBoostsLoading),
        [credentialsFetching, credentialsLoading, managedBoostsFetching, managedBoostsLoading]
    );
    useLoadingLine(credentialsBackgroundFetching);

    const { iconColor, textColor } = SubheaderContentType[SubheaderTypeEnum.MeritBadge];
    const imgSrc = categoryMetadata[CredentialCategoryEnum.meritBadge].defaultImageSrc;
    const shouldShowCreateButton = useMemo(
        () => flags.createMeritBadges && canCreateMeritBadges,
        [flags.createMeritBadges, canCreateMeritBadges]
    );

    // Handlers
    const handleCreateMeritBadge = useCallback(() => {
        newModal(
            <NewBoostSelectMenu
                handleCloseModal={closeModal}
                category={CredentialCategoryEnum.meritBadge}
            />,
            { className: '!p-0', sectionClassName: '!p-0' }
        );
    }, [newModal, closeModal]);

    // Memoized components
    const plusButtonOverride = useMemo(
        () => (
            <button
                type="button"
                aria-label="Create new merit badge"
                onClick={handleCreateMeritBadge}
                className={`flex items-center justify-center h-fit w-fit p-2 rounded-full bg-white ${textColor}`}
            >
                <Plus className={`h-5 w-5 ${iconColor}`} />
            </button>
        ),
        [handleCreateMeritBadge, iconColor, textColor]
    );

    const earnedAndManagedTabs = useMemo(
        () => (
            <EarnedAndManagedTabs
                handleActiveTab={setActiveTab}
                activeTab={activeTab}
                className="bg-sp-purple-light-medium"
                iconColor="text-sp-purple-midnight"
                searchInputColor="sp-purple-midnight"
                showListViewToggle
                viewMode={viewMode}
                setViewMode={setViewMode}
                inverseColors
                isManagedAvailable={shouldShowCreateButton}
                showManaged={managedBoostCount > 0}
                hideSearch={
                    activeTab === CredentialListTabEnum.Earned
                        ? credentialCount === 0
                        : managedBoostCount === 0
                }
            />
        ),
        [activeTab, viewMode, shouldShowCreateButton, managedBoostCount, credentialCount]
    );

    const listProps = useMemo(
        () => ({
            viewMode,
            defaultImg: imgSrc,
            category: BoostCategoryOptionsEnum.meritBadge,
            title: 'Merit Badges',
            bgFillerColor: '!bg-sp-purple-light-medium',
            emptyImg: EmptyMeritBadgeIcon,
            emptyMessage: "You don't have any Merit Badges yet.",
            emptyMessageStyle: 'text-[#4D006E]',
        }),
        [viewMode, imgSrc]
    );

    useEffect(() => {
        credentialSearchStore.set.reset();
    }, []);

    return (
        <IonPage className="bg-sp-purple-soft">
            <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
                <MainHeader
                    showBackButton
                    subheaderType={SubheaderTypeEnum.MeritBadge}
                    branding={BrandingEnum.scoutPass}
                    plusButtonOverride={
                        shouldShowCreateButton ? plusButtonOverride : earnedAndManagedTabs
                    }
                    count={credentialCount}
                    countLoading={countLoading}
                >
                    {currentLCNUser && shouldShowCreateButton && earnedAndManagedTabs}
                </MainHeader>

                <IonContent fullscreen className="relative" color="sp-purple-light-medium">
                    {activeTab === CredentialListTabEnum.Earned && (
                        <BoostEarnedList {...listProps} />
                    )}
                    {activeTab === CredentialListTabEnum.Managed && (
                        <BoostManagedList {...listProps} enableCreateButton={false} />
                    )}
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default MeritBadgesPage;
