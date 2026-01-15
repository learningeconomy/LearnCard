import React, { useEffect, useRef, useMemo } from 'react';

import { useHistory } from 'react-router-dom';
import { useLoadingLine } from '../../../stores/loadingStore';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import useBoostModal from '../hooks/useBoostModal';
import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';

import { IonRow, IonCol, IonGrid, IonSpinner } from '@ionic/react';
import BoostManagedCard from '../../../components/boost/boost-managed-card/BoostManagedCard';
import BoostErrorsDisplay from '../../../components/boost/boostErrors/BoostErrorsDisplay';
// @ts-ignore
import HourGlass from '../../../assets/lotties/hourglass.json';
import {
    CredentialCategoryEnum,
    BoostPageViewModeType,
    BoostPageViewMode,
    useGetPaginatedManagedBoosts,
    BrandingEnum,
    searchManagedBoostsFromCache,
    pluralize,
    useModal,
    ModalTypes,
} from 'learn-card-base';

import NewBoostButton from 'learn-card-base/components/boost/NewBoostButton';
import Lottie from 'react-lottie-player';
import NewBoostSelectMenu from '../boost-select-menu/NewBoostSelectMenuOld';
import {
    credentialCategoryToSubheaderType,
    SubheaderContentType,
} from '../../main-subheader/MainSubHeader.types';

type BoostManagedListProps = {
    category: CredentialCategoryEnum;
    viewMode: BoostPageViewModeType;
    bgFillerColor?: string;
    defaultImg: string;
    title?: string;
    enableCreateButton?: boolean;
};

const BoostManagedList: React.FC<BoostManagedListProps> = ({
    category,
    viewMode,
    bgFillerColor,
    defaultImg,
    enableCreateButton = false,
}) => {
    const history = useHistory();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
    /*
        * start **
        Managed boosts query + pagination 
    */
    const managedBoostInfiniteScrollRef = useRef<HTMLDivElement>(null);
    const {
        data: managedBoosts,
        isLoading: managedBoostsLoading,
        isFetching: managedBoostsFetching,
        hasNextPage: managedBoostsHasNextPage,
        fetchNextPage: managedBoostsFetchNextPage,
        refetch: managedBoostsRefetch,
        error: managedBoostsError,
    } = useGetPaginatedManagedBoosts(category, { limit: 12 });

    const searchActive = credentialSearchStore.use.isSearchActive();
    const searchString = credentialSearchStore.use.searchString() || '';
    const searchResults = searchManagedBoostsFromCache(managedBoosts);
    const noSearchResults = searchResults?.length === 0;
    const searchResultsCount = searchResults?.length;

    const managedBoostsOnScreen = useOnScreen(managedBoostInfiniteScrollRef as any, '-100px', [
        managedBoosts?.pages?.[0]?.records?.length,
    ]);

    const presentNewBoostSelector = () => {
        newModal(
            <NewBoostSelectMenu handleCloseModal={() => closeModal()} category={category} />
        );
    };

    useEffect(() => {
        if (managedBoostsOnScreen && managedBoostsHasNextPage) managedBoostsFetchNextPage();
    }, [
        managedBoostsFetchNextPage,
        managedBoostsHasNextPage,
        managedBoostsOnScreen,
        managedBoostInfiniteScrollRef,
    ]);
    /*
        Managed boosts query + pagination 
         * end **
    */

    const noResultsLineColor =
        SubheaderContentType[credentialCategoryToSubheaderType(category)].bgColor;

    const { handlePresentBoostModal } = useBoostModal(history, category);

    const credentialsBackgroundFetching = managedBoostsFetching && !managedBoostsLoading;

    useLoadingLine(credentialsBackgroundFetching);

    const boostError = managedBoostsError ? true : false;

    const managedBoostsList = useMemo(
        () =>
            managedBoosts?.pages?.flatMap(page =>
                page?.records
                    ?.filter?.(record => searchResults.find(cred => cred.uri === record?.uri))
                    ?.map((record, index) => {
                        return (
                            <BoostManagedCard
                                key={record?.uri || index}
                                boost={record}
                                defaultImg={defaultImg}
                                categoryType={category}
                                boostPageViewMode={viewMode}
                                loading={managedBoostsLoading}
                                branding={BrandingEnum.scoutPass}
                            />
                        );
                    })
            ) ?? [],
        [managedBoosts, searchResults, category, viewMode, managedBoostsLoading, defaultImg]
    );

    const handleRefetch = async () => {
        try {
            await managedBoostsRefetch?.();
        } catch (e) {
            throw new Error('There was an error, please try again.');
        }
    };

    const isCardView = viewMode === BoostPageViewMode.Card;

    const searchResultsElement = (
        <div className={`flex flex-col gap-[10px] mt-[6px] ${isCardView ? 'px-[12px]' : ''}`}>
            <span className="font-notoSans text-grayscale-900 text-[14px] font-[700]">
                {searchString?.trim?.() === '' && `Search ${searchResultsCount} managed boosts`}
                {noSearchResults && `No managed ${category} titled "${searchString}"`}
                {searchResultsCount > 0 &&
                    searchString?.trim?.() !== '' &&
                    `Found ${searchResultsCount} ${pluralize(
                        'result',
                        searchResultsCount
                    )} for "${searchString}" `}
            </span>
            <div className={`h-[1px] bg-sp-blue-ocean mb-[5px] ${noResultsLineColor}`} />
        </div>
    );

    return (
        <>
            {managedBoostsLoading && !boostError && (
                <section className="loading-spinner-container flex items-center justify-center h-[80%] w-full ">
                    <div className="max-w-[280px] mt-[-40px]">
                        <Lottie
                            loop
                            animationData={HourGlass}
                            play
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </section>
            )}

            {!managedBoostsLoading && !boostError && managedBoostsList && (
                <>
                    <IonCol className="flex m-auto items-center flex-wrap w-full achievements-list-container ">
                        {isCardView && (
                            <IonGrid className="max-w-[600px] pt-[20px]">
                                {searchActive && searchResultsElement}
                                <IonRow>
                                    {managedBoostsList}
                                    {enableCreateButton && (
                                        <NewBoostButton
                                            credentialType={category}
                                            onClick={() => {
                                                if (
                                                    category === CredentialCategoryEnum.membership
                                                ) {
                                                    handlePresentBoostModal();
                                                } else {
                                                    presentNewBoostSelector();
                                                }
                                            }}
                                            branding={BrandingEnum.scoutPass}
                                            viewMode={viewMode}
                                        />
                                    )}
                                </IonRow>
                                <div role="presentation" ref={managedBoostInfiniteScrollRef} />
                            </IonGrid>
                        )}
                        {!isCardView && (
                            <>
                                <div className="flex flex-col gap-[10px] w-full max-w-[700px] px-[20px] pt-[25px]">
                                    {searchActive && searchResultsElement}
                                    {managedBoostsList}
                                    {enableCreateButton && (
                                        <NewBoostButton
                                            credentialType={category}
                                            onClick={handlePresentBoostModal}
                                            viewMode={viewMode}
                                            branding={BrandingEnum.scoutPass}
                                        />
                                    )}
                                </div>
                                <div role="presentation" ref={managedBoostInfiniteScrollRef} />
                            </>
                        )}
                        {managedBoostsFetching && (
                            <div className="w-full flex items-center justify-center">
                                <IonSpinner
                                    name="crescent"
                                    color="grayscale-900"
                                    className="scale-[2] mb-8 mt-6"
                                />
                            </div>
                        )}
                        <div
                            className={`bg-filler absolute h-full top-[0px] left-[0px] w-full mt-[110px] z-[-50] ${bgFillerColor}`}
                        />
                    </IonCol>
                </>
            )}

            {!managedBoostsLoading && !managedBoostsError && managedBoostsList?.length === 0 && (
                <section
                    className={`flex relative items-center flex-col achievements-list-container max-w-[700px]  mx-auto ${
                        isCardView ? 'pt-[30px]' : 'px-[20px] pt-[30px]'
                    }`}
                >
                    {enableCreateButton && !searchActive && (
                        <NewBoostButton
                            credentialType={category}
                            onClick={handlePresentBoostModal}
                            viewMode={viewMode}
                            branding={BrandingEnum.scoutPass}
                        />
                    )}
                </section>
            )}
            {boostError && <BoostErrorsDisplay refetch={handleRefetch} />}
        </>
    );
};

export default BoostManagedList;
