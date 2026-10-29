import React, { useEffect, useRef } from 'react';

import * as m from '../../../paraglide/messages.js';
import { useLoadingLine } from '../../../stores/loadingStore';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';

import { IonCol, IonSpinner } from '@ionic/react';
import BoostEarnedIDCard from './BoostEarnedIDCard';

import {
    CredentialCategoryEnum,
    BoostPageViewMode,
    BoostPageViewModeType,
    useCredentialCollection,
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
    const searchActive = credentialSearchStore.use.isSearchActive();
    const searchString = credentialSearchStore.use.searchString() || '';
    const searching = searchActive && searchString.trim().length > 0;
    const {
        records,
        matches,
        isComplete,
        isPending: credentialsLoading,
        isFetching: credentialsFetching,
        isError: boostError,
        hasNextPage,
        hasNextIndexPage,
        fetchNextPage,
        retry,
    } = useCredentialCollection(category, {
        mode: searching ? 'search' : 'browse',
        search: searchString,
    });
    const onScreen = useOnScreen(infiniteScrollRef, '-100px', [records.length]);
    useEffect(() => {
        if (onScreen && hasNextIndexPage && !credentialsFetching && !boostError && !searching)
            fetchNextPage();
    }, [fetchNextPage, hasNextIndexPage, onScreen, credentialsFetching, boostError, searching]);

    const noResultsLineColor =
        SubheaderContentType[credentialCategoryToSubheaderType(category)].bgColor;

    const credentialsBackgroundFetching = credentialsFetching && !credentialsLoading;
    useLoadingLine(credentialsBackgroundFetching);
    const credentials = matches.map((record, index) => (
        <BoostEarnedIDCard
            key={record.uri || index}
            record={record}
            defaultImg={defaultImg}
            categoryType={category}
            boostPageViewMode={viewMode}
            loading={credentialsLoading}
        />
    ));
    const isCardView = viewMode === BoostPageViewMode.Card;
    const loadingTextColor = 'teal-500';
    const searchResultsElement = (
        <div
            className={`flex flex-col gap-[5px] mt-[6px] ${isCardView ? 'px-[15px]' : ''} ${boostError ? 'rounded-2xl border border-red-100 bg-red-50 p-3' : ''}`}
        >
            <span
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className={`font-notoSans text-[14px] font-[700] ${boostError ? 'text-red-700' : 'text-grayscale-900'}`}
            >
                {searching
                    ? isComplete
                        ? matches.length === 0
                            ? m['boost.search.noResultsTitled']({ query: searchString })
                            : m['boost.search.foundResults']({
                                  count: matches.length,
                                  query: searchString,
                              })
                        : boostError
                          ? `Search incomplete. ${matches.length} found so far`
                          : `Searching… ${matches.length} found so far`
                    : boostError
                      ? `Could not load ${records.length ? 'more ' : ''}credentials. ${records.length} loaded; collection incomplete.`
                      : isComplete
                        ? `${records.length} credentials. Collection complete.`
                        : `${records.length} credentials loaded. ${credentialsFetching ? 'Loading more…' : 'More credentials are available.'}`}
            </span>
            {boostError && (
                <button
                    type="button"
                    aria-disabled={credentialsFetching}
                    className="self-start py-2 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
                    onClick={() => {
                        if (!credentialsFetching) void retry();
                    }}
                >
                    {credentialsFetching ? 'Retrying…' : 'Retry loading credentials'}
                </button>
            )}
            {!searching && hasNextPage && !boostError && (
                <button
                    type="button"
                    aria-disabled={credentialsFetching}
                    className="self-start py-2 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
                    onClick={() => {
                        if (!credentialsFetching) void fetchNextPage();
                    }}
                >
                    {credentialsFetching ? 'Loading…' : 'Continue loading'}
                </button>
            )}
            <div className={`h-[1px] bg-sp-blue-ocean mb-[5px] ${noResultsLineColor}`} />
        </div>
    );
    return (
        <>
            {credentialsLoading && credentials.length === 0 && (
                <section
                    role="status"
                    aria-live="polite"
                    className="flex relative min-h-[200px] flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center"
                >
                    <CategoryEmptyPlaceholder category={category} />
                    <div className="mt-10 text-black">
                        <strong>
                            <span className="animate-pulse">
                                <p className={`loader text-${loadingTextColor}`}></p>
                            </span>
                        </strong>
                    </div>
                </section>
            )}
            {credentials.length === 0 && !searching && isComplete && (
                <section className="flex relative min-h-[200px] flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center">
                    <CategoryEmptyPlaceholder category={category} />
                    <div className="mt-10 text-black">
                        <strong>
                            <span className="normal">{`No ${title} yet.`}</span>
                        </strong>
                    </div>
                </section>
            )}
            {!credentialsLoading && (
                <>
                    {isCardView && (
                        <div className="flex flex-col">
                            {(searchActive || hasNextPage || boostError) && searchResultsElement}
                            <section className="relative flex flex-wrap text-center justify-center items-center gap-4 max-w-[800px]">
                                <div
                                    className={`bg-filler absolute h-full mt-[200px] w-[3000px] -z-10 ${bgFillerColor}`}
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
                                className={`bg-filler absolute h-full mt-[200px] w-[3000px] -z-10 ${bgFillerColor}`}
                            />
                            <div className="flex flex-col gap-[10px] w-full max-w-[700px] px-[20px]">
                                {(searchActive || hasNextPage || boostError) &&
                                    searchResultsElement}
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
        </>
    );
};

export default BoostEarnedIDList;
