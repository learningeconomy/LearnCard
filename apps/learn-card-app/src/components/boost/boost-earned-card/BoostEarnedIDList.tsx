import React, { useEffect, useRef } from 'react';

import { useLoadingLine } from '../../../stores/loadingStore';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';

import { IonCol, IonSpinner } from '@ionic/react';
import BoostErrorsDisplay from '../../../components/boost/boostErrors/BoostErrorsDisplay';
import BoostEarnedIDCard from './BoostEarnedIDCard';
import CategoryDescriptor from '../../../components/category-descriptor/CategoryDescriptor';

import {
    CredentialCategoryEnum,
    useGetCredentialList,
    BoostPageViewMode,
    BoostPageViewModeType,
    searchCredentialsFromCache,
    pluralize,
} from 'learn-card-base';
import {
    credentialCategoryToSubheaderType,
    SubheaderContentType,
} from '../../main-subheader/MainSubHeader.types';
import CategoryEmptyPlaceholder from '../../empty-placeholder/CategoryEmptyPlaceHolder';

const BoostEarnedIDList: React.FC<{
    category: CredentialCategoryEnum;
    viewMode: BoostPageViewModeType;
    bgFillerColor?: string;
    defaultImg: string;
    title: string;
}> = ({ category, viewMode, bgFillerColor, defaultImg, title }) => {
    /*
        * start **
        Earned boosts query + pagination 
    */
    const infiniteScrollRef = useRef<HTMLDivElement>(null);
    const {
        data: records,
        isLoading: credentialsLoading,
        isFetching: credentialsFetching,
        hasNextPage,
        fetchNextPage,
        refetch: earnedBoostsRefetch,
        error: earnedBoostsError,
    } = useGetCredentialList(category);

    const searchActive = credentialSearchStore.use.isSearchActive();
    const searchString = credentialSearchStore.use.searchString() || '';
    const searchResults = searchCredentialsFromCache(records);
    const noSearchResults = searchResults?.length === 0;
    const searchResultsCount = searchResults?.length;

    const onScreen = useOnScreen(infiniteScrollRef as any, '-100px', [
        records?.pages?.[0]?.records?.length,
    ]);

    useEffect(() => {
        if (onScreen && hasNextPage) fetchNextPage();
    }, [fetchNextPage, hasNextPage, onScreen, infiniteScrollRef]);
    /*
        Earned boosts query + pagination 
        * end **
    */

    const noResultsLineColor =
        SubheaderContentType[credentialCategoryToSubheaderType(category)].bgColor;

    const credentialsBackgroundFetching = credentialsFetching && !credentialsLoading;

    useLoadingLine(credentialsBackgroundFetching);

    const boostError = earnedBoostsError ? true : false;

    const credentials =
        records?.pages?.flatMap(page =>
            page?.records
                ?.filter?.(record => searchResults.find(cred => cred.uri === record?.uri))
                .map((record, index) => {
                    return (
                        <BoostEarnedIDCard
                            key={record?.uri || index}
                            record={record}
                            defaultImg={defaultImg}
                            categoryType={category}
                            boostPageViewMode={viewMode}
                            loading={credentialsLoading}
                        />
                    );
                })
        ) ?? [];

    const handleRefetch = async () => {
        try {
            await earnedBoostsRefetch?.();
        } catch (e) {
            throw new Error('There was an error, please try again.');
        }
    };

    const isCardView = viewMode === BoostPageViewMode.Card;

    const loadingTextColor = 'teal-500';

    const searchResultsElement = (
        <div className={`flex flex-col gap-[5px] mt-[6px] ${isCardView ? 'px-[15px]' : ''}`}>
            <span className="font-notoSans text-grayscale-900 text-[14px] font-[700]">
                {searchString?.trim?.() === '' &&
                    `Search ${searchResultsCount} earned ${pluralize('boost', searchResultsCount)}`}
                {noSearchResults && `No earned ${category} titled "${searchString}"`}
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
            {(credentialsLoading || (credentials?.length === 0 && !credentialsLoading)) &&
                !boostError &&
                !searchActive && (
                    <section className="flex relative  min-h-[200px]  flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center">
                        <CategoryEmptyPlaceholder category={category} />
                        <div className="mt-10 text-black">
                            <strong>
                                <span
                                    className={`flex justify-center ${
                                        credentialsLoading ? 'animate-pulse' : 'normal'
                                    }`}
                                >
                                    {credentialsLoading ? (
                                        <p className={`loader text-${loadingTextColor}`}></p>
                                    ) : (
                                        <p>{`No ${title} yet.`}</p>
                                    )}
                                </span>
                            </strong>
                        </div>
                        {/* <CategoryDescriptor category={category} /> */}
                    </section>
                )}
            {!credentialsLoading && !boostError && records && (
                <>
                    {isCardView && (
                        <div className="flex flex-col">
                            {searchActive && searchResultsElement}
                            <section className="relative flex flex-wrap text-center justify-center items-center gap-4 max-w-[800px]">
                                <div
                                    className={`bg-filler absolute h-full mt-[200px] w-[3000px] z-[-10] ${bgFillerColor}`}
                                />
                                {credentials}
                                <div role="presentation" ref={infiniteScrollRef} />
                                {credentialsFetching && (
                                    <div className="w-full flex items-center justify-center">
                                        <IonSpinner
                                            name="crescent"
                                            color="grayscale-900"
                                            className="scale-[2] mb-8 mt-6"
                                        />
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                    {!isCardView && (
                        <IonCol className="flex m-auto items-center flex-wrap w-full achievements-list-container">
                            <div
                                className={`bg-filler absolute h-full mt-[200px] w-[3000px] z-[-10] ${bgFillerColor}`}
                            />
                            <div className="flex flex-col gap-[10px] w-full max-w-[700px] px-[20px]">
                                {searchActive && searchResultsElement}
                                {credentials}
                            </div>
                            <div role="presentation" ref={infiniteScrollRef} />
                            {credentialsFetching && (
                                <div className="w-full flex items-center justify-center">
                                    <IonSpinner
                                        name="crescent"
                                        color="grayscale-900"
                                        className="scale-[2] mb-8 mt-6"
                                    />
                                </div>
                            )}
                        </IonCol>
                    )}
                </>
            )}

            {boostError && <BoostErrorsDisplay refetch={handleRefetch} />}
        </>
    );
};

export default BoostEarnedIDList;
