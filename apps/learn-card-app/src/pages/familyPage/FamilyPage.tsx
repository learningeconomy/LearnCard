import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';
import { lazyWithRetry } from 'learn-card-base';
import { ErrorBoundary } from 'react-error-boundary';
import { IonContent, IonModal, IonPage } from '@ionic/react';
import {
    SubheaderContentType,
    SubheaderTypeEnum,
} from '../../components/main-subheader/MainSubHeader.types';
import MainHeader from '../../components/main-header/MainHeader';
import BoostManagedList from '../../components/boost/boost-managed-card/BoostManagedList';
import BoostEarnedList from '../../components/boost/boost-earned-card/BoostEarnedList';
const FamilyCMS = lazyWithRetry(() => import('../../components/familyCMS/FamilyCMS'));
import FamilyBoostPreviewWrapper from '../../components/familyCMS/FamilyBoostPreview/FamilyBoostPreviewWrapper';
import RelationshipCats from '../../assets/images/relationships-cats.svg';
import Plus from 'learn-card-base/svgs/Plus';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';

import {
    EarnedAndManagedTabs,
    CredentialListTabEnum,
    CredentialCategoryEnum,
    useGetCredentialList,
    BoostPageViewModeType,
    BoostPageViewMode,
    useGetPaginatedManagedBoosts,
    useGetCredentialCount,
    useCountBoosts,
    useModal,
    ModalTypes,
    switchedProfileStore,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';

import { usePathQuery } from 'learn-card-base';
import { useIsCurrentUserLCNUser } from 'learn-card-base';
import { useLoadingLine } from '../../stores/loadingStore';
import useBoostModal from '../../components/boost/hooks/useBoostModal';
import useLCNGatedAction from '../../components/network-prompts/hooks/useLCNGatedAction';

import useTheme from '../../theme/hooks/useTheme';

const FamilyPage: React.FC = () => {
    const { getThemedCategoryColors } = useTheme();

    const colors = getThemedCategoryColors(CredentialCategoryEnum.family);
    const { backgroundSecondaryColor, backgroundPrimaryColor, headerTextColor } = colors;

    const query = usePathQuery();
    const history = useHistory();

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const _activeTab = query.get('managed')
        ? CredentialListTabEnum.Managed
        : CredentialListTabEnum.Earned;

    const _boostUri = query.get('boostUri');
    const _showPreview = query.get('showPreview');

    const [activeTab, setActiveTab] = useState<CredentialListTabEnum | string>(
        _activeTab ?? CredentialListTabEnum.Earned
    );
    const [viewMode, setViewMode] = useState<BoostPageViewModeType>(BoostPageViewMode.Card);

    const { handlePresentBoostModal } = useBoostModal(history, BoostCategoryOptionsEnum.family);

    const { data: currentLCNUser } = useIsCurrentUserLCNUser();

    const { data: credentialCount, isLoading: countLoading } = useGetCredentialCount(
        CredentialCategoryEnum.family
    );
    const { data: managedBoostCount = 0 } = useCountBoosts(CredentialCategoryEnum.family);
    const hasSwitchedProfiles = switchedProfileStore.use.isSwitchedProfile();
    const { gate } = useLCNGatedAction();

    const {
        data: records,
        isLoading: credentialsLoading,
        isFetching: credentialsFetching,
    } = useGetCredentialList(CredentialCategoryEnum.family);

    const {
        data: managedBoosts,
        isLoading: managedBoostsLoading,
        isFetching: managedBoostsFetching,
    } = useGetPaginatedManagedBoosts(CredentialCategoryEnum.family, { limit: 12 });

    const credentialsBackgroundFetching =
        (credentialsFetching && !credentialsLoading) ||
        (managedBoostsFetching && !managedBoostsLoading);

    useLoadingLine(credentialsBackgroundFetching);

    const showFamilyCMS = async () => {
        const { prompted } = await gate();
        if (prompted) return;
        newModal(<FamilyCMS handleCloseModal={closeModal} />);
    };

    useEffect(() => {
        credentialSearchStore.set.reset();
    }, []);

    // Auto-open family creation flow if requested (e.g., underage -> parent login flow)
    useEffect(() => {
        const shouldCreate = query.get('createFamily');
        if (shouldCreate) {
            showFamilyCMS();
            history.replace('/families');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const imgSrc = RelationshipCats;
    const { iconColor, textColor } = SubheaderContentType[SubheaderTypeEnum.Family];

    const simpleEarnedBoostsCount = records?.pages?.[0]?.records?.length ?? 0;
    const simpleManagedBoostsCount = managedBoosts?.pages?.[0]?.records?.length ?? 0;

    const hasFamilyID = records?.pages?.[0]?.records?.length > 0 ?? false;

    let isBoostsEmpty = false;
    if (activeTab === CredentialListTabEnum.Managed) {
        isBoostsEmpty = !managedBoostsLoading && simpleEarnedBoostsCount === 0;
    } else if (activeTab === CredentialListTabEnum.Earned) {
        isBoostsEmpty = !credentialsLoading && simpleManagedBoostsCount === 0;
    }

    const listProps = {
        viewMode: viewMode,
        defaultImg: imgSrc,
        category: BoostCategoryOptionsEnum.family,
        title: 'Families',
        bgFillerColor: `!bg-${backgroundSecondaryColor}`,
    };

    const plusButtonOverride =
        hasSwitchedProfiles || hasFamilyID ? (
            <></>
        ) : (
            <button
                type="button"
                aria-label="plus-button"
                onClick={() => showFamilyCMS()}
                className={`flex items-center justify-center h-fit w-fit p-[8px] rounded-full bg-${backgroundPrimaryColor}`}
            >
                <Plus className={`h-[20px] w-[20px] ${headerTextColor}`} />
            </button>
        );

    return (
        <IonPage className={`bg-${backgroundSecondaryColor}`}>
            <GenericErrorBoundary category={CredentialCategoryEnum.family}>
                <MainHeader
                    category={CredentialCategoryEnum.family}
                    showBackButton
                    subheaderType={SubheaderTypeEnum.Family}
                    isBoostsEmpty={isBoostsEmpty}
                    count={credentialCount as number}
                    countLoading={countLoading}
                    plusButtonOverride={plusButtonOverride}
                >
                    {currentLCNUser && (
                        <EarnedAndManagedTabs
                            handleActiveTab={setActiveTab}
                            handlePlusClick={handlePresentBoostModal}
                            activeTab={activeTab}
                            containerClassName="px-[5px]"
                            className="bg-amber-900"
                            iconColor="text-amber-700"
                            dividerLineColor="amber-400"
                            searchInputColor="amber-400"
                            showListViewToggle={false}
                            showManaged={false}
                            showEarnedAndManaged={false}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
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
                    className={`relative bg-${backgroundSecondaryColor}`}
                    color={backgroundSecondaryColor}
                >
                    {activeTab === CredentialListTabEnum.Earned && (
                        <BoostEarnedList {...listProps} />
                    )}
                    {activeTab === CredentialListTabEnum.Managed && (
                        <BoostManagedList {...listProps} />
                    )}
                    <IonModal isOpen={Boolean(_showPreview) && _boostUri}>
                        <FamilyBoostPreviewWrapper uri={_boostUri as string} />
                    </IonModal>
                </IonContent>
            </GenericErrorBoundary>
        </IonPage>
    );
};

export default FamilyPage;
