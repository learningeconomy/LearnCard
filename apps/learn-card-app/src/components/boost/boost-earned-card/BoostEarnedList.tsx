import React, { useEffect, useRef } from 'react';

import * as m from '../../../paraglide/messages.js';
import { useLoadingLine } from '../../../stores/loadingStore';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';

import { IonRow, IonCol, IonGrid, IonSpinner } from '@ionic/react';
import BoostEarnedCard from '../../../components/boost/boost-earned-card/BoostEarnedCard';

import {
    CredentialCategoryEnum,
    BoostPageViewMode,
    BoostPageViewModeType,
    CredentialListSkeleton,
    useCredentialCollection,
} from 'learn-card-base';
import type { CredentialCategory } from 'learn-card-base/types/credentials';
import {
    credentialCategoryToSubheaderType,
    SubheaderContentType,
} from '../../main-subheader/MainSubHeader.types';
import CategoryEmptyPlaceholder from '../../empty-placeholder/CategoryEmptyPlaceHolder';

type CategoryType = CredentialCategory | 'Hidden';

type BoostEarnedListProps = {
    category: CategoryType;
    viewMode: BoostPageViewModeType;
    bgFillerColor?: string;
    defaultImg: string;
    title: string;
};

const BoostEarnedList: React.FC<BoostEarnedListProps> = ({
    category,
    viewMode,
    bgFillerColor,
    defaultImg,
    title,
}) => {
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
        if (onScreen && hasNextIndexPage && !credentialsFetching && !boostError && !searching) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextIndexPage, onScreen, credentialsFetching, boostError, searching]);

    const { bgColor: noResultsLineColor } =
        SubheaderContentType[credentialCategoryToSubheaderType(category)];

    const showSkeleton = credentialsLoading && records.length === 0;
    const credentialsBackgroundFetching = credentialsFetching && !credentialsLoading;
    useLoadingLine(credentialsBackgroundFetching);

    const categoryColors = {
        [CredentialCategoryEnum.learningHistory]: 'emerald-700',
        [CredentialCategoryEnum.socialBadge]: 'blue-400',
        [CredentialCategoryEnum.achievement]: 'pink-400',
        [CredentialCategoryEnum.qualifications]: 'orange-700',
        [CredentialCategoryEnum.accomplishment]: 'yellow-400',
        [CredentialCategoryEnum.workHistory]: 'blue-600',
        [CredentialCategoryEnum.accommodation]: 'violet-500',
        [CredentialCategoryEnum.id]: 'blue-500',
        [CredentialCategoryEnum.membership]: 'blue-500',
    };

    const textColor = categoryColors[category];

    const credentials = matches.map((record, index) => (
        <BoostEarnedCard
            key={record.uri || index}
            record={record}
            defaultImg={defaultImg}
            categoryType={record.category}
            boostPageViewMode={viewMode}
            loading={credentialsLoading}
            textColor={textColor}
        />
    ));

    const isCardView = viewMode === BoostPageViewMode.Card;

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
            {showSkeleton && (
                <div role="status" aria-live="polite" aria-label="Loading earned credentials">
                    <CredentialListSkeleton viewMode={isCardView ? 'card' : 'list'} />
                </div>
            )}
            {credentials.length === 0 && !showSkeleton && !searching && isComplete && (
                <section className="flex relative min-h-[200px] flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center">
                    <CategoryEmptyPlaceholder category={category} />
                    <div className="text-black mt-10">
                        <strong>
                            <p className="font-montserrat text-[14px] font-[700] text-grayscale-900">{`No ${title} yet.`}</p>
                        </strong>
                    </div>
                </section>
            )}
            {!showSkeleton && (
                <>
                    <IonCol className="flex m-auto items-center flex-wrap w-full  achievements-list-container">
                        {isCardView && (
                            <IonGrid className="max-w-[600px] pt-[20px]">
                                {(searchActive || hasNextPage || boostError) &&
                                    searchResultsElement}
                                <IonRow>{credentials}</IonRow>
                                <div role="presentation" ref={infiniteScrollRef} />
                            </IonGrid>
                        )}
                        {!isCardView && (
                            <>
                                <div className="flex flex-col gap-[10px] w-full max-w-[600px] px-[20px] pt-[25px]">
                                    {(searchActive || hasNextPage || boostError) &&
                                        searchResultsElement}
                                    {credentials}
                                </div>
                                <div role="presentation" ref={infiniteScrollRef} />
                            </>
                        )}
                        {credentialsFetching && (
                            <div className="w-full flex items-center justify-center">
                                <IonSpinner
                                    name="crescent"
                                    color="grayscale-900"
                                    className="scale-[2] mb-8 mt-6"
                                />
                            </div>
                        )}
                        <div
                            className={`bg-filler absolute h-full top-[0px] left-[0px] w-full mt-[110px] -z-50 ${bgFillerColor}`}
                        />
                    </IonCol>
                </>
            )}
        </>
    );
};

export default BoostEarnedList;
