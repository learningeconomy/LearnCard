import React, { useEffect, useRef, useMemo } from 'react';
import Lottie from 'react-lottie-player';

import { useLoadingLine } from '../../../stores/loadingStore';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';
import { searchCredentialsFromCache } from 'learn-card-base';
import { IonRow, IonCol, IonGrid, IonSpinner } from '@ionic/react';
import BoostEarnedCard from '../../../components/boost/boost-earned-card/BoostEarnedCard';
import BoostErrorsDisplay from '../../../components/boost/boostErrors/BoostErrorsDisplay';
import HourGlass from '../../../assets/lotties/hourglass.json';

import {
    CredentialCategoryEnum,
    useGetCredentialList,
    BoostPageViewMode,
    BoostPageViewModeType,
    BrandingEnum,
    pluralize,
} from 'learn-card-base';
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
    const {
        data: records,
        isLoading: credentialsLoading,
        isFetching: credentialsFetching,
        hasNextPage,
        fetchNextPage,
        refetch: earnedBoostsRefetch,
        error: earnedBoostsError,
    } = useGetCredentialList(category);

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

    const searchActive = credentialSearchStore.use.isSearchActive();
    const searchString = credentialSearchStore.use.searchString() || '';
    const searchResults = searchCredentialsFromCache(records);
    const noSearchResults = searchResults?.length === 0;
    const searchResultsCount = searchResults?.length;

    const noResultsLineColor =
        SubheaderContentType[credentialCategoryToSubheaderType(category)].bgColor;

    const credentialsBackgroundFetching = credentialsFetching && !credentialsLoading;

    useLoadingLine(credentialsBackgroundFetching);

    const boostError = earnedBoostsError ? true : false;

    const credentials = useMemo(
        () =>
            records?.pages?.flatMap(page =>
                page?.records
                    ?.filter?.(record => searchResults.some(cred => cred.uri === record?.uri))
                    ?.map(record => (
                        <BoostEarnedCard
                            key={record?.uri}
                            uri={record?.uri}
                            defaultImg={defaultImg}
                            categoryType={category}
                            boostPageViewMode={viewMode}
                            loading={credentialsLoading}
                            branding={BrandingEnum.scoutPass}
                        />
                    ))
            ) ?? [],
        [records, searchResults]
    );

    const handleRefetch = async () => {
        try {
            await earnedBoostsRefetch?.();
        } catch (e) {
            throw new Error('There was an error, please try again.');
        }
    };

    const isCardView = viewMode === BoostPageViewMode.Card;

    const searchResultsElement = (
        <div className={`flex flex-col gap-[10px] mt-[6px] ${isCardView ? 'px-[15px]' : ''}`}>
            <span className="font-notoSans text-grayscale-900 text-[14px] font-[700]">
                {searchString?.trim?.() === '' && `Search ${searchResultsCount} earned boosts`}
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
            {credentialsLoading && !earnedBoostsError && (
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
            {!credentialsLoading &&
                credentials &&
                credentials?.length === 0 &&
                !earnedBoostsError &&
                !searchActive && (
                    <section className="flex relative flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center mt-[50px]">
                        <img
                            src={emptyImg}
                            alt={title}
                            className="w-[180px] h-[180px] m-auto block"
                        />
                        <p
                            className={`absolute inset-0 flex items-center justify-center font-bold text-center w-[133px] m-auto text-[16px] ${emptyMessageStyle}`}
                        >
                            {emptyMessage}
                        </p>
                    </section>
                )}
            {!credentialsLoading && !boostError && records && (
                <>
                    <IonCol className="flex m-auto items-center flex-wrap w-full  achievements-list-container">
                        {isCardView && (
                            <IonGrid className="max-w-[600px] pt-[25px]">
                                {searchActive && searchResultsElement}
                                <IonRow>{credentials}</IonRow>
                                <div role="presentation" ref={infiniteScrollRef} />
                            </IonGrid>
                        )}
                        {!isCardView && (
                            <>
                                <div className="flex flex-col gap-[10px] w-full max-w-[700px] px-[20px] pt-[25px]">
                                    {searchActive && searchResultsElement}
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
                            className={`bg-filler absolute h-full top-[0px] left-[0px] w-full mt-[110px] z-[-50] ${bgFillerColor}`}
                        />
                    </IonCol>
                </>
            )}

            {boostError && <BoostErrorsDisplay refetch={handleRefetch} />}
        </>
    );
};

export default BoostEarnedList;
