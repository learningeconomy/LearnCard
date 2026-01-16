'use client';
import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';

import { IonContent, IonPage } from '@ionic/react';
import MainHeader from '../../components/main-header/MainHeader';
import BoostEarnedList from '../../components/boost/boost-earned-card/BoostEarnedList';
import BoostManagedList from '../../components/boost/boost-managed-card/BoostManagedList';
import NewBoostSelectMenu from '../../components/boost/boost-select-menu/NewBoostSelectMenu';
// @ts-ignore
import EmptySocialBoostIcon from '../../assets/images/emptySocialBoost.svg';
import Plus from '../../components/svgs/Plus';
import { closeAll } from '../../helpers/uiHelpers';
import NewJoinNetworkPrompt from '../../components/network-prompts/NewJoinNetworkPrompt';

import {
    usePathQuery,
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
    useModal,
    ModalTypes,
    useIsLoggedIn,
    categoryMetadata,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';

import { useLoadingLine } from '../../stores/loadingStore';
import {
    SubheaderContentType,
    SubheaderTypeEnum,
} from '../../components/main-subheader/MainSubHeader.types';
import { ErrorBoundaryFallback } from '../../components/boost/boostErrors/BoostErrorsDisplay';

const BoostsPage: React.FC = () => {
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });
    const query = usePathQuery();

    const _activeTab = query.get('managed')
        ? CredentialListTabEnum.Managed
        : CredentialListTabEnum.Earned;

    const [activeTab, setActiveTab] = useState<CredentialListTabEnum | string>(
        _activeTab ?? CredentialListTabEnum.Earned
    );
    const [viewMode, setViewMode] = useState<BoostPageViewModeType>(BoostPageViewMode.Card);

    const {
        data: currentLCNUser,
        isLoading: currentLCNUserLoading,
        refetch,
    } = useIsCurrentUserLCNUser();

    const { isLoading: credentialsLoading, isFetching: credentialsFetching } = useGetCredentialList(
        CredentialCategoryEnum.socialBadge
    );

    const { isLoading: managedBoostsLoading, isFetching: managedBoostsFetching } =
        useGetPaginatedManagedBoosts(CredentialCategoryEnum.socialBadge, { limit: 12 });

    const { data: credentialCount, isLoading: countLoading } = useGetCredentialCount(
        CredentialCategoryEnum.socialBadge
    );

    const { data: managedBoostCount = 0 } = useCountBoosts(CredentialCategoryEnum.socialBadge);

    const credentialsBackgroundFetching =
        (credentialsFetching && !credentialsLoading) ||
        (managedBoostsFetching && !managedBoostsLoading);

    useLoadingLine(credentialsBackgroundFetching);

    useEffect(() => {
        credentialSearchStore.set.reset();
    }, []);

    const imgSrc = categoryMetadata[CredentialCategoryEnum.socialBadge].defaultImageSrc;

    const { iconColor, textColor } = SubheaderContentType[SubheaderTypeEnum.SocialBadge];

    const { newModal: newNetworkModal, closeModal: closeNetworkModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const openNetworkModal = () => {
        newNetworkModal(
            <NewJoinNetworkPrompt
                handleCloseModal={() => {
                    closeNetworkModal();
                    closeAll?.();
                }}
                showNotificationsModal={false}
            />
        );
    };
    const { data, isLoading } = useIsCurrentUserLCNUser();
    const isLoggedIn = useIsLoggedIn();

    const handlePresentJoinNetworkModal = async () => {
        if (!isLoading && !data && isLoggedIn) {
            openNetworkModal();
            return { prompted: true };
        }
        return { prompted: false };
    };

    const plusButtonOverride = (
        <button
            type="button"
            aria-label="plus-button"
            onClick={async () => {
                const isCurrentLCNUser =
                    currentLCNUserLoading || typeof currentLCNUser === 'undefined'
                        ? (await refetch()).data
                        : currentLCNUser;

                if (!isCurrentLCNUser) {
                    handlePresentJoinNetworkModal();
                    return;
                }

                newModal(
                    <NewBoostSelectMenu
                        handleCloseModal={() => closeModal()}
                        category={BoostCategoryOptionsEnum.socialBadge}
                        showHardcodedBoostPacks
                    />,
                    {
                        className: '!p-0',
                        sectionClassName: '!p-0',
                    }
                );
            }}
            className={`flex items-center justify-center h-fit w-fit p-[8px] rounded-full bg-white ${textColor}`}
        >
            <Plus className={`h-[20px] w-[20px] ${iconColor}`} />
        </button>
    );

    const listProps = {
        viewMode: viewMode,
        defaultImg: imgSrc,
        category: BoostCategoryOptionsEnum.socialBadge as unknown as CredentialCategoryEnum,
        title: 'Boosts',
        bgFillerColor: '!bg-sp-blue-light-ocean',
        emptyImg: EmptySocialBoostIcon as any,
        emptyMessage: "You don't have any Boosts yet.",
        emptyMessageStyle: 'text-[#03748D] -mt-4',
    };

    return (
        <IonPage className="bg-sp-blue-ocean">
            <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
                <MainHeader
                    showBackButton
                    subheaderType={SubheaderTypeEnum.SocialBadge}
                    branding={BrandingEnum.scoutPass}
                    plusButtonOverride={plusButtonOverride}
                    count={credentialCount as number}
                    countLoading={countLoading}
                >
                    {currentLCNUser && (
                        <EarnedAndManagedTabs
                            handleActiveTab={setActiveTab}
                            activeTab={activeTab}
                            className="bg-sp-blue-light-ocean"
                            iconColor="text-sp-blue-ocean"
                            searchInputColor="sp-blue-dark-ocean"
                            showListViewToggle
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            inverseColors
                            showManaged={managedBoostCount > 0}
                            hideSearch={
                                activeTab === CredentialListTabEnum.Earned
                                    ? credentialCount === 0
                                    : managedBoostCount === 0
                            }
                        />
                    )}
                </MainHeader>

                <IonContent
                    fullscreen
                    className="relative bg-[#3FBDD9]"
                    color="sp-blue-light-ocean"
                >
                    {activeTab === CredentialListTabEnum.Earned && (
                        <BoostEarnedList {...listProps} />
                    )}
                    {activeTab === CredentialListTabEnum.Managed && (
                        <BoostManagedList {...listProps} />
                    )}
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default BoostsPage;
