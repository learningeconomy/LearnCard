import React, { useEffect, useRef } from 'react';

import { useLoadingLine } from '../../../stores/loadingStore';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';
import { IonRow, IonCol, IonGrid, IonSpinner } from '@ionic/react';
import BoostEarnedCard, { BoostEarnedCardSkeleton } from './BoostEarnedCard';

import {
    CredentialCategoryEnum,
    BoostPageViewMode,
    BoostPageViewModeType,
    BrandingEnum,
    useCredentialCollection,
} from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';
import {
    credentialCategoryToSubheaderType,
    SubheaderContentType,
} from '../../main-subheader/MainSubHeader.types';

type BoostEarnedListProps = {
    category: CredentialCategoryEnum;
    viewMode: BoostPageViewModeType;
    bgFillerColor?: string;
    defaultImg: string;
    title: string;
    emptyImg?: string;
    emptyMessage?: string;
    emptyMessageStyle?: string;
};
const INITIAL_SKELETON_COUNT = 4;

const BoostEarnedList: React.FC<BoostEarnedListProps> = ({
    category,
    viewMode,
    bgFillerColor,
    defaultImg,
    title,
    emptyImg,
    emptyMessage,
    emptyMessageStyle,
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
        if (onScreen && hasNextIndexPage && !credentialsFetching && !boostError && !searching)
            fetchNextPage();
    }, [fetchNextPage, hasNextIndexPage, onScreen, credentialsFetching, boostError, searching]);

    const noResultsLineColor =
        SubheaderContentType[credentialCategoryToSubheaderType(category)].bgColor;
    const showSkeleton = credentialsLoading && records.length === 0;
    const credentialsBackgroundFetching = credentialsFetching && !credentialsLoading;
    useLoadingLine(credentialsBackgroundFetching);
    const credentials = matches.map(record => (
        <BoostEarnedCard
            key={record.uri}
            uri={record.uri}
            defaultImg={defaultImg}
            categoryType={category}
            boostPageViewMode={viewMode}
            loading={credentialsLoading}
            branding={BrandingEnum.scoutPass}
        />
    ));
    const loadingCredentials = Array.from({ length: INITIAL_SKELETON_COUNT }, (_, index) => (
        <BoostEarnedCardSkeleton
            key={`earned-skeleton-${category}-${index}`}
            categoryType={category}
            boostPageViewMode={viewMode}
            branding={BrandingEnum.scoutPass}
        />
    ));

    const isCardView = viewMode === BoostPageViewMode.Card;
    const searchResultsText = searching
        ? isComplete
            ? matches.length === 0
                ? m['common.searchResults.noEarned']({ query: searchString })
                : matches.length === 1
                  ? m['common.searchResults.foundOne']({
                        count: matches.length,
                        query: searchString,
                    })
                  : m['common.searchResults.foundOther']({
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
            : `${records.length} credentials loaded. ${credentialsFetching ? 'Loading more…' : 'More credentials are available.'}`;

    const searchResultsElement = (
        <div
            className={`flex flex-col gap-[10px] mt-[6px] ${isCardView ? 'px-[15px]' : ''} ${boostError ? 'rounded-2xl border border-red-100 bg-red-50 p-3' : ''}`}
        >
            <span
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className={`font-notoSans text-[14px] font-bold ${boostError ? 'text-red-700' : 'text-grayscale-900'}`}
            >
                {searchResultsText}
            </span>
            {boostError && (
                <button
                    type="button"
                    aria-disabled={credentialsFetching}
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
                <IonCol
                    className="flex m-auto items-center flex-wrap w-full achievements-list-container"
                    role="status"
                    aria-label={m['common.searchResults.loadingEarned']()}
                >
                    {isCardView ? (
                        <IonGrid className="max-w-[600px] pt-[25px]">
                            <IonRow>{loadingCredentials}</IonRow>
                        </IonGrid>
                    ) : (
                        <div className="flex flex-col gap-[10px] w-full max-w-[700px] px-[20px] pt-[25px]">
                            {loadingCredentials}
                        </div>
                    )}
                </IonCol>
            )}
            {!showSkeleton && credentials.length === 0 && !searching && isComplete && (
                <section className="flex relative flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center mt-[50px]">
                    <img src={emptyImg} alt={title} className="w-[180px] h-[180px] m-auto block" />
                    <p
                        className={`absolute inset-0 flex items-center justify-center font-bold text-center w-[133px] m-auto text-[16px] ${emptyMessageStyle}`}
                    >
                        {emptyMessage}
                    </p>
                </section>
            )}
            {!showSkeleton && (
                <>
                    <IonCol className="flex m-auto items-center flex-wrap w-full  achievements-list-container">
                        {isCardView && (
                            <IonGrid className="max-w-[600px] pt-[25px]">
                                {(searchActive || hasNextPage || boostError) &&
                                    searchResultsElement}
                                <IonRow>{credentials}</IonRow>
                                <div role="presentation" ref={infiniteScrollRef} />
                            </IonGrid>
                        )}
                        {!isCardView && (
                            <>
                                <div className="flex flex-col gap-[10px] w-full max-w-[700px] px-[20px] pt-[25px]">
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
