import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';

import useBoostModal from '../../components/boost/hooks/useBoostModal';
import { useLoadingLine } from '../../stores/loadingStore';

import {
    newCredsStore,
    usePathQuery,
    useCountBoosts,
    useGetCredentialList,
    useGetCredentialCount,
    useIsCurrentUserLCNUser,
    useGetPaginatedManagedBoosts,
    CredentialCategoryEnum,
    CredentialListTabEnum,
    categoryMetadata,
} from 'learn-card-base';
import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';

import MainHeader from '../../components/main-header/MainHeader';
import BoostEarnedList from '../../components/boost/boost-earned-card/BoostEarnedList';
import BoostManagedList from '../../components/boost/boost-managed-card/BoostManagedList';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';
import EarnedAndManagedTabs from '../../components/EarnedAndManagedTabs/EarnedAndManagedTabs';

import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';

import useTheme from '../../theme/hooks/useTheme';
import passportPageStore from '../../stores/passportPageStore';

interface CategoryConfig {
    boostCategory: CredentialCategoryEnum;
    subheaderType: SubheaderTypeEnum;
    title: string;
    iconColor: string;
    dividerLineColor: string;
    searchInputColor: string;
    tabBackgroundColor: string;
}

const categoryToConfig: Record<string, CategoryConfig> = {
    [CredentialCategoryEnum.socialBadge]: {
        boostCategory: CredentialCategoryEnum.socialBadge, // category
        subheaderType: SubheaderTypeEnum.SocialBadge, // header type

        title: 'Boosts',
        iconColor: 'text-blue-700',
        dividerLineColor: 'blue-400',
        searchInputColor: 'blue-400',
        tabBackgroundColor: 'blue-400',
    },
    [CredentialCategoryEnum.workHistory]: {
        boostCategory: CredentialCategoryEnum.workHistory, // category
        subheaderType: SubheaderTypeEnum.Job, // header type

        title: 'Experiences',
        iconColor: 'text-cyan-701',
        dividerLineColor: 'cyan-401',
        searchInputColor: 'cyan-300',
        tabBackgroundColor: 'cyan-300',
    },
    [CredentialCategoryEnum.learningHistory]: {
        boostCategory: CredentialCategoryEnum.learningHistory, // category
        subheaderType: SubheaderTypeEnum.Learning, // header type

        title: 'Studies',
        iconColor: 'text-emerald-701',
        dividerLineColor: 'emerald-401',
        searchInputColor: 'emerald-500',
        tabBackgroundColor: 'emerald-401',
    },
    [CredentialCategoryEnum.accommodation]: {
        boostCategory: CredentialCategoryEnum.accommodation, // category
        subheaderType: SubheaderTypeEnum.Accommodation, // header type

        title: 'Assistance',
        iconColor: 'text-violet-700',
        dividerLineColor: 'violet-400',
        searchInputColor: 'violet-300',
        tabBackgroundColor: 'violet-100',
    },
    [CredentialCategoryEnum.accomplishment]: {
        boostCategory: CredentialCategoryEnum.accomplishment, // category
        subheaderType: SubheaderTypeEnum.Accomplishment, // header type

        title: 'Portfolio',
        iconColor: 'text-yellow-700',
        dividerLineColor: 'yellow-400',
        searchInputColor: 'yellow-300',
        tabBackgroundColor: 'yellow-100',
    },
    [CredentialCategoryEnum.achievement]: {
        boostCategory: CredentialCategoryEnum.achievement, // category
        subheaderType: SubheaderTypeEnum.Achievement, // header type

        title: 'Achievements',
        iconColor: 'text-pink-700',
        dividerLineColor: 'pink-400',
        searchInputColor: 'pink-500',
        tabBackgroundColor: 'pink-400',
    },
    [CredentialCategoryEnum.id]: {
        boostCategory: CredentialCategoryEnum.id, // category
        subheaderType: SubheaderTypeEnum.ID, // header type

        title: 'IDs',
        iconColor: 'text-blue-700',
        dividerLineColor: 'blue-400',
        searchInputColor: 'blue-300',
        tabBackgroundColor: 'blue-300',
    },
};

type CredentialPageProps = {
    category: keyof typeof CredentialCategoryEnum;
};

const CredentialPage: React.FC<CredentialPageProps> = ({ category }) => {
    const { getThemedCategoryColors } = useTheme();
    const colors = getThemedCategoryColors(category as CredentialCategoryEnum);

    const { backgroundSecondaryColor } = colors;

    const query = usePathQuery();
    const history = useHistory();

    const { data: currentLCNUser } = useIsCurrentUserLCNUser();

    const config = categoryToConfig[category];

    const _activeTab = query.get('managed')
        ? CredentialListTabEnum.Managed
        : CredentialListTabEnum.Earned;

    const [activeTab, setActiveTab] = useState<CredentialListTabEnum | string>(
        _activeTab ?? CredentialListTabEnum.Earned
    );

    const viewMode = passportPageStore.use.credentialViewMode();
    const setViewMode = passportPageStore.set.credentialViewMode;

    const { handlePresentBoostModal } = useBoostModal(history, config.boostCategory);

    const { data: credentialCount, isLoading: countLoading } = useGetCredentialCount(
        category as any
    );

    const { data: managedBoostData = 0 } = useCountBoosts(category as any);
    const managedBoostCount = typeof managedBoostData === 'number' ? managedBoostData : 0;

    const {
        data: records,
        isLoading: credentialsLoading,
        isFetching: credentialsFetching,
    } = useGetCredentialList(category as any);

    const {
        data: managedBoosts,
        isLoading: managedBoostsLoading,
        isFetching: managedBoostsFetching,
    } = useGetPaginatedManagedBoosts(category as any, { limit: 12 });

    const credentialsBackgroundFetching =
        (credentialsFetching && !credentialsLoading) ||
        (managedBoostsFetching && !managedBoostsLoading);

    useLoadingLine(credentialsBackgroundFetching);

    const simpleEarnedBoostsCount = records?.pages?.[0]?.records?.length ?? 0;
    const simpleManagedBoostsCount = managedBoosts?.pages?.[0]?.records?.length ?? 0;

    let isBoostsEmpty = false;
    if (activeTab === CredentialListTabEnum.Managed) {
        isBoostsEmpty = !managedBoostsLoading && simpleEarnedBoostsCount === 0;
    } else if (activeTab === CredentialListTabEnum.Earned) {
        isBoostsEmpty = !credentialsLoading && simpleManagedBoostsCount === 0;
    }

    const isId = config?.boostCategory === CredentialCategoryEnum.id;

    const idImageOverride = 'https://cdn.filestackcontent.com/9z6i0x3hSlG43paNZHag';
    const listProps = {
        viewMode,
        defaultImg: isId
            ? idImageOverride
            : categoryMetadata[config?.boostCategory].defaultImageSrc,
        category: config?.boostCategory,
        title: config?.title,
        bgFillerColor: `!bg-${backgroundSecondaryColor}`,
    };

    const handlePageClick = (e: React.MouseEvent) => {
        if (credentialSearchStore?.set?.closeSearchBar) {
            credentialSearchStore.set.closeSearchBar(
                e as unknown as React.MouseEvent<HTMLButtonElement>
            );
        }
    };

    return (
        <IonPage className={`bg-${backgroundSecondaryColor}`} onClick={handlePageClick}>
            <GenericErrorBoundary category={config.boostCategory}>
                <MainHeader
                    showBackButton
                    subheaderType={config.subheaderType}
                    isBoostsEmpty={isBoostsEmpty}
                    count={credentialCount as number}
                    countLoading={countLoading}
                    category={config.boostCategory}
                />
                <IonContent
                    fullscreen
                    className={`relative bg-${backgroundSecondaryColor}`}
                    color={backgroundSecondaryColor}
                >
                    {currentLCNUser && (
                        <EarnedAndManagedTabs
                            handleActiveTab={setActiveTab}
                            activeTab={activeTab}
                            containerClassName="px-4"
                            showListViewToggle
                            showManaged={managedBoostCount > 0}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            hideSearch={
                                activeTab === CredentialListTabEnum.Earned
                                    ? credentialCount === 0
                                    : managedBoostCount === 0
                            }
                            isManagedAvailable={managedBoostCount > 0}
                            category={config.boostCategory}
                        />
                    )}
                    <GenericErrorBoundary category={config.boostCategory}>
                        {activeTab === CredentialListTabEnum.Earned && (
                            <BoostEarnedList
                                viewMode={listProps.viewMode}
                                defaultImg={listProps.defaultImg}
                                category={listProps.category}
                                title={listProps.title}
                                bgFillerColor={listProps.bgFillerColor}
                            />
                        )}
                        {activeTab === CredentialListTabEnum.Managed && (
                            <BoostManagedList
                                viewMode={listProps.viewMode}
                                defaultImg={listProps.defaultImg}
                                category={listProps.category}
                                title={listProps.title}
                                bgFillerColor={listProps.bgFillerColor}
                            />
                        )}
                    </GenericErrorBoundary>
                </IonContent>
            </GenericErrorBoundary>
        </IonPage>
    );
};

export default CredentialPage;
