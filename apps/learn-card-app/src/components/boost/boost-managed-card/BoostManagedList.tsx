import React, { useEffect, useRef } from 'react';

import { useHistory } from 'react-router-dom';
import { useLoadingLine } from '../../../stores/loadingStore';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import useBoostModal from '../hooks/useBoostModal';
import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';
import { IonRow, IonCol, IonGrid, IonSpinner } from '@ionic/react';
import BoostManagedCard from '../../../components/boost/boost-managed-card/BoostManagedCard';
import BoostErrorsDisplay from '../../../components/boost/boostErrors/BoostErrorsDisplay';
import NewBoostButton from '../NewBoostButton';

import {
    CredentialCategoryEnum,
    BoostPageViewModeType,
    BoostPageViewMode,
    useGetPaginatedManagedBoosts,
    searchManagedBoostsFromCache,
    pluralize,
} from 'learn-card-base';
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
};

const BoostManagedList: React.FC<BoostManagedListProps> = ({
    category,
    viewMode,
    bgFillerColor,
    defaultImg,
    title,
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
    } = useGetPaginatedManagedBoosts(category, { limit: 12 });

    const managedBoostsOnScreen = useOnScreen(managedBoostInfiniteScrollRef as any, '-100px', [
        managedBoosts?.pages?.[0]?.records?.length,
    ]);

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

    const searchActive = credentialSearchStore.use.isSearchActive();
    const searchString = credentialSearchStore.use.searchString() || '';
    const searchResults = searchManagedBoostsFromCache(managedBoosts);
    const noSearchResults = searchResults?.length === 0;
    const searchResultsCount = searchResults?.length;

    const { bgColor: noResultsLineColor, title: categoryTitle } =
        SubheaderContentType[credentialCategoryToSubheaderType(category)];

    const { handlePresentBoostModal } = useBoostModal(history, category);

    const credentialsBackgroundFetching = managedBoostsFetching && !managedBoostsLoading;

    useLoadingLine(credentialsBackgroundFetching);

    const boostError = managedBoostsError ? true : false;

    const managedBoostsList =
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
                        />
                    );
                })
        ) ?? [];

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
                {noSearchResults && `No managed ${categoryTitle} titled "${searchString}"`}
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
            {!managedBoostsLoading && !boostError && managedBoostsList && (
                <>
                    <IonCol className="flex m-auto items-center flex-wrap w-full achievements-list-container ">
                        {isCardView && (
                            <IonGrid className="max-w-[600px]">
                                {searchActive && searchResultsElement}
                                <IonRow>
                                    {managedBoostsList}
                                    <NewBoostButton
                                        credentialType={category}
                                        onClick={handlePresentBoostModal}
                                    />
                                </IonRow>
                                <div role="presentation" ref={managedBoostInfiniteScrollRef} />
                            </IonGrid>
                        )}
                        {!isCardView && (
                            <>
                                <div className="flex flex-col gap-[10px] w-full max-w-[600px] px-[20px] pt-[25px]">
                                    {searchActive && searchResultsElement}
                                    {managedBoostsList}
                                    <NewBoostButton
                                        credentialType={category}
                                        onClick={handlePresentBoostModal}
                                        viewMode={viewMode}
                                    />
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
            {((!managedBoostsLoading && managedBoostsList?.length === 0) || managedBoostsLoading) &&
                !boostError &&
                !searchActive && (
                    <section
                        className={`flex relative flex-col achievements-list-container px-[20px] text-center justify-center items-center max-w-[700px] mx-auto ${
                            isCardView ? 'pt-[30px]' : 'px-[20px] pt-[30px]'
                        }`}
                    >
                        <NewBoostButton
                            credentialType={category}
                            onClick={handlePresentBoostModal}
                            viewMode={viewMode}
                        />
                    </section>
                )}
            {boostError && <BoostErrorsDisplay refetch={handleRefetch} />}
        </>
    );
};

export default BoostManagedList;
