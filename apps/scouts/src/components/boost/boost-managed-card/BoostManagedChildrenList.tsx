import React, { useEffect, useRef, useMemo } from 'react';

import { useHistory } from 'react-router-dom';
import { useLoadingLine } from '../../../stores/loadingStore';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import useBoostModal from '../hooks/useBoostModal';
import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';
import { EmptyState } from '../boost-select-menu/NewBoostSelectMenu';
import { IonRow, IonCol, IonGrid, IonSpinner, useIonModal } from '@ionic/react';
import BoostManagedCard from '../../../components/boost/boost-managed-card/BoostManagedCard';
import BoostErrorsDisplay from '../../../components/boost/boostErrors/BoostErrorsDisplay';
import HourGlass from '../../../assets/lotties/hourglass.json';
import {
    CredentialCategoryEnum,
    BoostPageViewModeType,
    BoostPageViewMode,
    useGetPaginatedFamilialBoosts,
    BrandingEnum,
    searchManagedBoostsFromCache,
    pluralize,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';
import { BoostQuery } from '@learncard/types';

import Lottie from 'react-lottie-player';
import NewBoostSelectMenu from '../boost-select-menu/NewBoostSelectMenuOld';
import NewBoostSelectMenuCustomTypeButton from '../boost-select-menu/NewBoostSelectMenuCustomTypeButton';
import {
    credentialCategoryToSubheaderType,
    SubheaderContentType,
} from '../../main-subheader/MainSubHeader.types';

type BoostManagedListProps = {
    parentUri: string;
    parentGenerations: number;
    childGenerations: number;
    query?: BoostQuery;
    category: CredentialCategoryEnum | BoostCategoryOptionsEnum;
    viewMode: BoostPageViewModeType;
    bgFillerColor?: string;
    defaultImg?: string;
    title?: string;
    search?: string;
    enableCreateButton?: boolean;
    includeExtendedFamily?: boolean;
    handleCloseModal?: () => void;
};

const BoostManagedChildrenList: React.FC<BoostManagedListProps> = ({
    parentUri,
    parentGenerations = 2,
    childGenerations = 2,
    query,
    category,
    viewMode,
    bgFillerColor,
    defaultImg,
    includeExtendedFamily,
    search,
    title,
    enableCreateButton = true,
    handleCloseModal,
}) => {
    const history = useHistory();
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
    } = useGetPaginatedFamilialBoosts(
        parentUri,
        parentGenerations,
        childGenerations,
        query,
        category,
        includeExtendedFamily
    );

    const searchActive = credentialSearchStore.use.isSearchActive();
    const searchString = credentialSearchStore.use.searchString() || '';
    const searchResults = searchManagedBoostsFromCache(managedBoosts);
    const noSearchResults = searchResults?.length === 0;
    const searchResultsCount = searchResults?.length;

    const managedBoostsOnScreen = useOnScreen(managedBoostInfiniteScrollRef as any, '-100px', [
        managedBoosts?.pages?.[0]?.records?.length,
    ]);

    const [presentNewBoostSelector, dismissNewBoostSelector] = useIonModal(NewBoostSelectMenu, {
        handleCloseModal: () => dismissNewBoostSelector(),
        category,
    });

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
                    ?.filter(record => searchResults.some(cred => cred.uri === record?.uri))
                    ?.map((record, index) => (
                        <BoostManagedCard
                            key={record?.uri ?? `boost-${index}`}
                            boost={record}
                            refetchQuery={managedBoostsRefetch}
                            defaultImg={defaultImg}
                            categoryType={category}
                            boostPageViewMode={viewMode}
                            loading={managedBoostsLoading}
                            branding={BrandingEnum.scoutPass}
                            useCmsModal={true}
                        />
                    ))
            ) ?? [],
        [managedBoosts, searchResults, category, viewMode, managedBoostsLoading]
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
                    <div className="max-w-[280px] mt-[40px]">
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
                    {isCardView && (
                        <IonGrid className="max-w-[600px]">
                            {searchActive && searchResultsElement}
                            <IonRow>
                                {enableCreateButton && (
                                    <NewBoostSelectMenuCustomTypeButton
                                        category={category}
                                        handleCloseModal={handleCloseModal}
                                        useCMSModal
                                        parentUri={parentUri}
                                    />
                                )}
                                {managedBoostsList}
                            </IonRow>
                            <div
                                aria-hidden="true"
                                role="presentation"
                                ref={managedBoostInfiniteScrollRef}
                            />
                        </IonGrid>
                    )}
                    {!isCardView && (
                        <>
                            {searchActive && searchResultsElement}
                            {managedBoostsList}
                            {/* {enableCreateButton && (
                                        <NewBoostButton
                                            credentialType={category}
                                            onClick={handlePresentBoostModal}
                                            viewMode={viewMode}
                                            branding={BrandingEnum.scoutPass}
                                        />
                                    )} */}

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
                </>
            )}

            {boostError && <BoostErrorsDisplay refetch={handleRefetch} />}
            {!managedBoostsLoading && !managedBoostsError && managedBoostsList?.length === 0 && (
                <div className="flex w-full justify-center">
                    <EmptyState />
                </div>
            )}
        </>
    );
};

export default BoostManagedChildrenList;
